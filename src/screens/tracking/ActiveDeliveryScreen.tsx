/**
 * ActiveDeliveryScreen.tsx
 * ─────────────────────────────────────────────────────────
 * Real MapView + Routes API polyline + live rider marker
 * animated along the decoded route. UI unchanged from original.
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Linking,
  Dimensions,
  Platform,
  Animated,
  PanResponder,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { DeliveryStackParamList } from "../../navigation/types";
import PhoneCallSvg from "../../assets/icons/phone_call.svg";
import ChatBubbleSvg from "../../assets/icons/chat_bubble.svg";
import PinLocationSvg from "../../assets/icons/pin_location.svg";
import StarSvg from "../../assets/icons/star.svg";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import ChevronRightSvg from "../../assets/icons/chevron_right.svg";
import { useRoutePolyline } from "../../utils/useRoutePolyline";
import CUSTOM_MAP_STYLE from "../../utils/mapStyle";

const { width, height: SCREEN_H } = Dimensions.get("window");

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  primaryLight: "#D4F4E0",
  border: "#E0E4EA",
  textPrimary: "#1A1A2E",
  textMuted: "#9CA3AF",
  chatBlueBg: "#D4E8F4",
  progressFill: "#0B1F3A",
  progressBg: "#E0E4EA",
  inputBg: "#F2F4F7",
};

const SNAP_CARD = SCREEN_H * 0.72;
const SNAP_DETAIL = SCREEN_H * 0.2;
const SNAP_THRESHOLD = 60;
const VELOCITY_THRESHOLD = 0.4;

// Simulated delivery progress (45% of the way) — replace with real backend data
const DELIVERY_PROGRESS = 0.45;

type RouteParams = RouteProp<DeliveryStackParamList, "ActiveDelivery">;

const DEFAULT_PICKUP = { latitude: 5.5968, longitude: -0.1869 };
const DEFAULT_DROPOFF = { latitude: 5.6502, longitude: -0.187 };

function interpolateOnRoute(
  coords: { latitude: number; longitude: number }[],
  progress: number,
): { latitude: number; longitude: number } | null {
  if (coords.length < 2) return null;
  const clamp = Math.max(0, Math.min(1, progress));
  const total = coords.length - 1;
  const fi = clamp * total;
  const si = Math.floor(fi);
  const sp = fi - si;
  const a = coords[Math.min(si, total - 1)];
  const b = coords[Math.min(si + 1, total)];
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * sp,
    longitude: a.longitude + (b.longitude - a.longitude) * sp,
  };
}

export default function ActiveDeliveryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const mapRef = useRef<MapView>(null);

  const {
    riderName = "John Cena",
    riderPlate = "GHA - 2233343 -4",
    riderRating = 4.5,
    itemType = "Parcel",
    weight = "lightweight",
    etaMinutes: etaProp = 15,
    specialInstructions = "Handle it as if your life depends on it.",
    paymentMethod = "Bundle credits",
    pickup = "American House",
    dropoff = "University of Ghana",
  } = route.params ?? {};

  const pickupCoord = (route.params as any)?.pickupCoords ?? DEFAULT_PICKUP;
  const dropoffCoord = (route.params as any)?.dropoffCoords ?? DEFAULT_DROPOFF;

  const vehicleType = (route.params as any)?.vehicleType ?? "bicycle";

  const { coords: routeCoords, etaMinutes } = useRoutePolyline({
    origin: pickupCoord,
    destination: dropoffCoord,
    mode: vehicleType === "e-motorcycle" ? "TWO_WHEELER" : "BICYCLE",
  });

  // Rider position based on progress
  const [riderCoord, setRiderCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (routeCoords.length === 0) return;
    const pos = interpolateOnRoute(routeCoords, DELIVERY_PROGRESS);
    if (pos) setRiderCoord(pos);
  }, [routeCoords]);

  // Fit map to show route with room for the card
  useEffect(() => {
    if (!mapRef.current) return;
    const points =
      routeCoords.length > 0 ? routeCoords : [pickupCoord, dropoffCoord];
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 80, right: 60, bottom: SCREEN_H * 0.35, left: 60 },
      animated: true,
    });
  }, [routeCoords]);

  const weightLabel =
    weight === "lightweight"
      ? "Light weight"
      : weight === "standard"
        ? "Standard"
        : "Heavy";

  const displayEta = etaMinutes ?? etaProp;

  // ── Bottom sheet ──────────────────────────────────────────────────────────
  const translateY = useRef(new Animated.Value(SNAP_CARD)).current;
  const lastY = useRef(SNAP_CARD);
  const [isExpanded, setIsExpanded] = useState(false);
  const detailOpacity = useRef(new Animated.Value(0)).current;

  const springTo = useCallback(
    (toValue: number) => {
      const expanding = toValue < SNAP_CARD;
      lastY.current = toValue;
      setIsExpanded(expanding);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue,
          useNativeDriver: true,
          bounciness: 3,
          speed: 14,
        }),
        Animated.timing(detailOpacity, {
          toValue: expanding ? 1 : 0,
          duration: expanding ? 280 : 150,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [translateY, detailOpacity],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 5,
      onPanResponderGrant: () => {
        translateY.stopAnimation((val) => {
          lastY.current = val;
          translateY.setOffset(val);
          translateY.setValue(0);
        });
      },
      onPanResponderMove: (_, { dy }) => {
        const next = Math.min(
          Math.max(lastY.current + dy, SNAP_DETAIL),
          SNAP_CARD + 40,
        );
        translateY.setValue(next - lastY.current);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        translateY.flattenOffset();
        const current = lastY.current + dy;
        if (vy < -VELOCITY_THRESHOLD || dy < -SNAP_THRESHOLD)
          springTo(SNAP_DETAIL);
        else if (vy > VELOCITY_THRESHOLD || dy > SNAP_THRESHOLD)
          springTo(SNAP_CARD);
        else
          springTo(
            Math.abs(current - SNAP_CARD) < Math.abs(current - SNAP_DETAIL)
              ? SNAP_CARD
              : SNAP_DETAIL,
          );
      },
    }),
  ).current;

  const initialRegion = {
    latitude: (pickupCoord.latitude + dropoffCoord.latitude) / 2 + 0.005,
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
            strokeWidth={4}
          />
        )}

        {/* Pickup */}
        <Marker
          coordinate={pickupCoord}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={styles.pickupHalo}>
            <View style={styles.pickupDot}>
              <View style={styles.pickupDotInner} />
            </View>
          </View>
        </Marker>

        {/* Dropoff */}
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

        {/* Rider — positioned at DELIVERY_PROGRESS along route */}
        {riderCoord && (
          <Marker
            coordinate={riderCoord}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.riderMarker}>
              <Text style={{ fontSize: 20 }}>
                {vehicleType === "e-motorcycle" ? "🛵" : "🚲"}
              </Text>
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
        <ArrowBackSvg width={50} height={48} />
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={styles.handleBar} />
        </View>

        <ScrollView
          contentContainerStyle={styles.sheetScroll}
          showsVerticalScrollIndicator={false}
          scrollEnabled={isExpanded}
          bounces={false}
        >
          {/* Card summary (always visible) */}
          <TouchableOpacity
            style={styles.cardSummary}
            onPress={() => springTo(isExpanded ? SNAP_CARD : SNAP_DETAIL)}
            activeOpacity={0.95}
          >
            {/* Rider row */}
            <View style={styles.riderRow}>
              <View style={styles.avatarWrap}>
                <Image
                  source={require("../../assets/images/rider_john.png")}
                  style={styles.avatar}
                />
                <View style={styles.ratingBadge}>
                  <StarSvg width={10} height={10} />
                  <Text style={styles.ratingText}>{riderRating}</Text>
                </View>
              </View>
              <View style={styles.riderTextWrap}>
                <Text style={styles.riderName}>{riderName}</Text>
                <Text style={styles.riderEta}>{displayEta} mins estimated</Text>
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: Colors.primaryLight },
                  ]}
                  onPress={() => Linking.openURL("tel:0546785064")}
                  activeOpacity={0.78}
                >
                  <PhoneCallSvg width={18} height={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: Colors.chatBlueBg },
                  ]}
                  onPress={() => {}}
                  activeOpacity={0.78}
                >
                  <ChatBubbleSvg width={18} height={18} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Progress row */}
            <View style={styles.progressRow}>
              <PinLocationSvg width={14} height={18} />
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${DELIVERY_PROGRESS * 100}%` },
                  ]}
                />
              </View>
              <PinLocationSvg width={14} height={18} />
            </View>

            {/* Parcel */}
            <View style={styles.parcelRow}>
              <View>
                <Text style={styles.parcelType}>{itemType}</Text>
                <Text style={styles.parcelWeight}>{weightLabel}</Text>
              </View>
              <Image
                source={require("../../assets/images/parcel_box.png")}
                style={styles.parcelImg}
              />
            </View>

            {/* Expand hint */}
            <View style={styles.expandHint}>
              <Text style={styles.expandHintText}>
                {isExpanded ? "Hide details" : "View details"}
              </Text>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: detailOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                }}
              >
                <ChevronRightSvg
                  width={8}
                  height={14}
                  style={{ transform: [{ rotate: "-90deg" }] }}
                />
              </Animated.View>
            </View>
          </TouchableOpacity>

          {/* Expandable detail section */}
          <Animated.View
            style={[styles.detailSection, { opacity: detailOpacity }]}
          >
            <View style={styles.detailDivider} />
            <Text style={styles.detailHeading}>Delivery Details</Text>
            <DetailRow label="Pickup" value={pickup} />
            <DetailRow label="Drop-off" value={dropoff} />
            <DetailRow label="Item type" value={itemType} />
            <DetailRow label="Weight" value={weightLabel} />
            <DetailRow
              label="Special instructions"
              value={specialInstructions}
            />
            <DetailRow label="Payment" value={paymentMethod} />
            <DetailRow label="Plate number" value={riderPlate} />
            <View style={{ height: 24 }} />
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.navigate("HomeMap")}
              activeOpacity={0.78}
            >
              <Text style={styles.cancelText}>Cancel Delivery</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={detailRowStyles.row}>
      <Text style={detailRowStyles.label}>{label}</Text>
      <Text style={detailRowStyles.value}>{value}</Text>
    </View>
  );
}

const detailRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  label: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Colors.textPrimary,
  },
  value: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
    textAlign: "right",
    paddingLeft: 12,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E8EEF4" },

  pickupHalo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(74,144,226,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickupDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(74,144,226,0.28)",
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
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

  sheet: {
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
  handleArea: { width: "100%", paddingVertical: 12, alignItems: "center" },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D0D6E0",
  },
  sheetScroll: { paddingHorizontal: 18 },
  cardSummary: { paddingTop: 4 },

  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  ratingBadge: {
    position: "absolute",
    bottom: -8,
    left: 7,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  ratingText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 10,
    color: Colors.textPrimary,
  },
  riderTextWrap: { flex: 1, paddingLeft: 2 },
  riderName: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 1,
  },
  riderEta: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: Colors.progressBg,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.progressFill,
    borderRadius: 3,
  },

  parcelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2,
  },
  parcelType: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  parcelWeight: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  parcelImg: { width: 56, height: 56, resizeMode: "contain" },

  expandHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    gap: 6,
    paddingVertical: 4,
  },
  expandHintText: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },

  detailSection: { paddingTop: 4 },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 18,
  },
  detailHeading: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: 0.2,
  },

  cancelBtn: {
    backgroundColor: Colors.inputBg,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 8,
  },
  cancelText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
});
