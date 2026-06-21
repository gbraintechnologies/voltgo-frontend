/**
 * RiderArrivingScreen.tsx
 * ─────────────────────────────────────────────────────────
 * Real MapView + Routes API polyline + animated rider marker
 * that moves along the route as the ETA ticks down.
 * UI/layout unchanged from original.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  Linking,
  Platform,
  Animated,
  PanResponder,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { DeliveryStackParamList } from "../../navigation/types";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import StarSvg from "../../assets/icons/star.svg";
import PhoneCallSvg from "../../assets/icons/phone_call.svg";
import ChatBubbleSvg from "../../assets/icons/chat_bubble.svg";
import { useRoutePolyline } from "../../utils/useRoutePolyline";
import CUSTOM_MAP_STYLE from "../../utils/mapStyle";
import BicycleSvg from "../../assets/icons/bicycle.svg"; // already used in RiderFoundScreen
import MotorcycleSvg from "../../assets/icons/emoto.svg";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { useOrderPolling } from "@/hooks/useApi";
import ConfirmModal from "@/components/common/ConfirmModal";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  primaryLight: "#D4F4E0",
  inputBg: "#F2F4F7",
  textPrimary: "#1A1A2E",
  textMuted: "#9CA3AF",
  etaColor: "#00B86B",
  chatBlueBg: "#D4E8F4",
};

const SNAP_COLLAPSED = 0.55;
const SNAP_EXPANDED = 0.9;
const COLLAPSED_H = SCREEN_H * SNAP_COLLAPSED;
const EXPANDED_H = SCREEN_H * SNAP_EXPANDED;
const SNAP_THRESHOLD = 60;
const VELOCITY_THRESHOLD = 0.5;

type RouteParams = RouteProp<DeliveryStackParamList, "RiderArriving">;

const DEFAULT_PICKUP = { latitude: 5.5968, longitude: -0.1869 };
const DEFAULT_DROPOFF = { latitude: 5.6502, longitude: -0.187 };

/** Interpolate a position along a polyline by progress [0..1] */
function interpolateOnRoute(
  coords: { latitude: number; longitude: number }[],
  progress: number,
): { latitude: number; longitude: number } | null {
  if (coords.length < 2) return null;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const totalSegments = coords.length - 1;
  const floatIndex = clampedProgress * totalSegments;
  const segIndex = Math.floor(floatIndex);
  const segProgress = floatIndex - segIndex;
  const a = coords[Math.min(segIndex, totalSegments - 1)];
  const b = coords[Math.min(segIndex + 1, totalSegments)];
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * segProgress,
    longitude: a.longitude + (b.longitude - a.longitude) * segProgress,
  };
}

function useCustomBottomSheet() {
  const initialOffset = SCREEN_H - COLLAPSED_H;
  const translateY = useRef(new Animated.Value(initialOffset)).current;
  const lastTranslateY = useRef(initialOffset);
  const [isExpanded, setIsExpanded] = useState(false);
  const isDragging = useRef(false);

  const springTo = useCallback(
    (toValue: number, expanded: boolean) => {
      lastTranslateY.current = toValue;
      setIsExpanded(expanded);
      Animated.spring(translateY, {
        toValue,
        useNativeDriver: true,
        bounciness: 4,
        speed: 14,
      }).start();
    },
    [translateY],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        const isVertical = Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 4;
        if (isVertical) isDragging.current = true;
        return isVertical;
      },
      onPanResponderGrant: () => {
        isDragging.current = false;
        translateY.stopAnimation((val) => {
          lastTranslateY.current = val;
          translateY.setOffset(val);
          translateY.setValue(0);
        });
      },
      onPanResponderMove: (_, { dy }) => {
        const clamped = Math.min(
          SCREEN_H - COLLAPSED_H + 40,
          Math.max(SCREEN_H - EXPANDED_H, lastTranslateY.current + dy),
        );
        translateY.setValue(clamped - lastTranslateY.current);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        isDragging.current = false;
        translateY.flattenOffset();
        const current = lastTranslateY.current + dy;

        if (vy > VELOCITY_THRESHOLD) {
          springTo(SCREEN_H - COLLAPSED_H, false);
        } else if (vy < -VELOCITY_THRESHOLD) {
          springTo(SCREEN_H - EXPANDED_H, true);
        } else if (dy > SNAP_THRESHOLD) {
          springTo(SCREEN_H - COLLAPSED_H, false);
        } else if (dy < -SNAP_THRESHOLD) {
          springTo(SCREEN_H - EXPANDED_H, true);
        } else {
          const toCollapsed = Math.abs(current - (SCREEN_H - COLLAPSED_H));
          const toExpanded = Math.abs(current - (SCREEN_H - EXPANDED_H));
          springTo(
            toCollapsed < toExpanded
              ? SCREEN_H - COLLAPSED_H
              : SCREEN_H - EXPANDED_H,
            toCollapsed >= toExpanded,
          );
        }
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        translateY.flattenOffset();
        springTo(
          lastTranslateY.current,
          lastTranslateY.current !== SCREEN_H - COLLAPSED_H,
        );
      },
    }),
  ).current;

  return { translateY, panResponder, isExpanded };
}

export default function RiderArrivingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const mapRef = useRef<MapView>(null);
  const [cancelBlockedVisible, setCancelBlockedVisible] = useState(false);

  const {
    riderName = "John Cena",
    riderPlate = "GHA - 2233343 -4",
    riderRating = 4.5,
    vehicleType = "bicycle",
  } = route.params ?? {};

  const pickupCoord = (route.params as any)?.pickupCoords ?? DEFAULT_PICKUP;
  const dropoffCoord = (route.params as any)?.dropoffCoords ?? DEFAULT_DROPOFF;

  const orderId = (route.params as any)?.orderId as string | undefined;

  // FIX: REST fallback — every other tracking screen has this, this one
  // was socket-only, which is why it could get stuck if the socket missed
  // or hadn't yet delivered the "collected" event.
  const { data: polledOrder } = useOrderPolling(orderId ?? "");

  const [eta, setEta] = useState(5);
  const { translateY, panResponder } = useCustomBottomSheet();
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [riderCoord, setRiderCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Fetch real route
  const { coords: routeCoords, etaMinutes } = useRoutePolyline({
    origin: pickupCoord,
    destination: dropoffCoord,
    mode: vehicleType === "e-motorcycle" ? "TWO_WHEELER" : "BICYCLE",
  });

  // Set real ETA when route loads
  useEffect(() => {
    if (etaMinutes) setEta(etaMinutes);
  }, [etaMinutes]);

  // Fit map
  useEffect(() => {
    if (!mapRef.current) return;
    const points =
      routeCoords.length > 0 ? routeCoords : [pickupCoord, dropoffCoord];
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 80, right: 60, bottom: SCREEN_H * 0.55, left: 60 },
      animated: true,
    });
  }, [routeCoords]);

  useEffect(() => {
    if (!polledOrder) return;
    if (["collected", "in_transit"].includes(polledOrder.status)) {
      navigation.replace("ActiveDelivery", {
        ...route.params,
        orderId,
        riderName: polledOrder.rider?.full_name ?? route.params?.riderName,
        riderPlate:
          polledOrder.rider?.vehicle?.plate_no ?? route.params?.riderPlate,
        riderRating: polledOrder.rider?.rating ?? route.params?.riderRating,
        pickupCoords: route.params?.pickupCoords,
        dropoffCoords: route.params?.dropoffCoords,
      });
    }
  }, [polledOrder?.status]);

  // Animate rider along route
  useEffect(() => {
    if (routeCoords.length === 0 || eta <= 0) return;
    const totalMs = eta * 60 * 1000;
    const startTime = Date.now();

    const interval = setInterval(() => {
      // Stop simulating once real GPS takes over
      if (riderCoord) {
        clearInterval(interval);
        return;
      }
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / totalMs);
      const pos = interpolateOnRoute(routeCoords, progress);
      if (pos) setRiderCoord(pos);
      if (progress >= 1) clearInterval(interval);
    }, 2000);

    return () => clearInterval(interval);
  }, [routeCoords, eta]);

  // Progress bar animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: false,
    }).start();
  }, []);

  // ETA countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setEta((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Navigate when arrived
  useEffect(() => {
    if (eta === 0) navigation.replace("ActiveDelivery", route.params);
  }, [eta]);

  useOrderSocket({
    orderId: orderId ?? "",
    onRiderLocation: (payload) => {
      const coord = { latitude: payload.lat, longitude: payload.lng };
      setRiderCoord(coord);
    },
    onStatusChanged: (payload: any) => {
      if (payload.status === "collected") {
        navigation.replace("ActiveDelivery", {
          ...route.params,
          orderId,
          // ✅ Explicitly pull from payload if available, fallback to params
          riderName: payload.riderName ?? route.params?.riderName,
          riderPlate: payload.riderPlate ?? route.params?.riderPlate,
          riderRating: payload.riderRating ?? route.params?.riderRating,
          pickupCoords: route.params?.pickupCoords,
          dropoffCoords: route.params?.dropoffCoords,
        });
      }
    },
  });

  const displayEta = etaMinutes ?? 33;

  const initialRegion = {
    latitude: (pickupCoord.latitude + dropoffCoord.latitude) / 2,
    longitude: (pickupCoord.longitude + dropoffCoord.longitude) / 2,
    latitudeDelta:
      Math.abs(pickupCoord.latitude - dropoffCoord.latitude) * 3 + 0.02,
    longitudeDelta:
      Math.abs(pickupCoord.longitude - dropoffCoord.longitude) * 3 + 0.02,
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Real Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        customMapStyle={CUSTOM_MAP_STYLE}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={Colors.navy}
            strokeWidth={3.5}
          />
        )}

        {/* Pickup dot */}
        <Marker
          coordinate={pickupCoord}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={styles.pickupDot}>
            <View style={styles.pickupDotInner} />
          </View>
        </Marker>

        {/* Dropoff pin */}
        <Marker
          coordinate={dropoffCoord}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={false}
        >
          <View style={styles.dropoffPin}>
            <View style={styles.dropoffPinCircle} />
            <View style={styles.dropoffPinTail} />
          </View>
        </Marker>

        {/* Animated rider position */}
        {riderCoord && (
          <Marker
            coordinate={riderCoord}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={true}
          >
            <View style={styles.riderMarker}>
              {vehicleType === "e-motorcycle" ? (
                <MotorcycleSvg width={22} height={22} />
              ) : (
                <BicycleSvg width={22} height={22} />
              )}
            </View>
          </Marker>
        )}
      </MapView>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <ArrowBackSvg width={60} height={58} />
      </TouchableOpacity>

      {/* ETA Badge */}
      <View style={styles.etaBadge}>
        <Text style={styles.etaText}>{displayEta} min</Text>
      </View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[styles.bottomSheet, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        {/* Handle — decorative only */}
        <View style={styles.handleArea}>
          <View style={styles.handleBar} />
        </View>

        <View style={styles.sheetContent}>
          <Text style={styles.heading}>Rider Arriving</Text>

          <View style={styles.riderRow}>
            <BicycleSvg width={76} height={56} />
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Image
                  source={
                    (route.params as any)?.riderPhoto
                      ? { uri: (route.params as any).riderPhoto }
                      : require("../../assets/images/rider_john.png")
                  }
                  style={styles.avatar}
                />
              </View>
              <View style={styles.ratingBadge}>
                <StarSvg width={10} height={10} />
                <Text style={styles.ratingText}>{riderRating}</Text>
              </View>
            </View>
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>{riderName}</Text>
              <Text style={styles.riderPlate}>{riderPlate}</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>

          <Text style={styles.etaCountdown}>
            Rider will be here in {eta} min
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: Colors.primaryLight },
              ]}
              onPress={() => Linking.openURL("tel:0546785064")}
              activeOpacity={0.78}
            >
              <PhoneCallSvg width={22} height={22} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn1,
                { backgroundColor: Colors.chatBlueBg },
              ]}
              onPress={() => {}}
              activeOpacity={0.78}
            >
              <ChatBubbleSvg width={22} height={22} />
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setCancelBlockedVisible(true)}
            activeOpacity={0.78}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ConfirmModal
        visible={cancelBlockedVisible}
        title="Rider already on the way"
        message="Your rider is heading to pickup and can no longer be cancelled automatically. Contact support if you need to cancel this delivery."
        confirmLabel="Contact support"
        cancelLabel="Keep delivery"
        onConfirm={() => {
          setCancelBlockedVisible(false);
          navigation.navigate("Support");
        }}
        onCancel={() => setCancelBlockedVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E8EEF4" },
  pickupDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(74,144,226,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickupDotInner: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#4A90E2",
    borderWidth: 2.5,
    borderColor: Colors.white,
  },
  dropoffPin: { alignItems: "center" },
  dropoffPinCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.navy,
  },
  dropoffPinTail: {
    width: 3,
    height: 8,
    backgroundColor: Colors.navy,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  riderMarker: {
    width: 36,
    height: 36,
    backgroundColor: Colors.white,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 58 : 42,
    left: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  etaBadge: {
    position: "absolute",
    top: Platform.OS === "ios" ? 58 : 42,
    left: SCREEN_W / 2 - 34,
    backgroundColor: Colors.navy,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  etaText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Colors.white,
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: SCREEN_H,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  handleArea: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D0D6E0",
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 36,
    alignItems: "center",
  },
  heading: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 18,
    gap: 10,
  },
  avatarContainer: { position: "relative", marginRight: 4 },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.navy,
    overflow: "hidden",
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  ratingBadge: {
    position: "absolute",
    bottom: -9,
    alignSelf: "center",
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: "#E0E4EA",
  },
  ratingText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 10,
    color: Colors.textPrimary,
  },
  riderInfo: { flexShrink: 1 },
  riderName: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  riderPlate: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  progressTrack: {
    width: 160,
    height: 4,
    backgroundColor: "#E0E4EA",
    borderRadius: 2,
    marginBottom: 18,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.navy,
    borderRadius: 2,
  },
  etaCountdown: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.etaColor,
    marginBottom: 20,
  },
  actionsRow: { flexDirection: "row", marginBottom: 20 },
  actionBtn: {
    width: 60,
    height: 60,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtn1: {
    width: 60,
    height: 60,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: { flex: 1 },
  cancelBtn: {
    width: "100%",
    backgroundColor: Colors.inputBg,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
  },
  cancelText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
});
