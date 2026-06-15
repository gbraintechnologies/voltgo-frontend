/**
 * RiderFoundScreen.tsx
 * ─────────────────────────────────────────────────────────
 * Real MapView + Routes API polyline. UI unchanged from original.
 */

import React, { useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  Platform,
  Animated,
  PanResponder,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { DeliveryStackParamList } from "../../navigation/types";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import BicycleSvg from "../../assets/icons/bicycle-5.svg";
import StarSvg from "../../assets/icons/star.svg";
import { useRoutePolyline } from "../../utils/useRoutePolyline";
import CUSTOM_MAP_STYLE from "../../utils/mapStyle";
import { useOrderPolling } from "@/hooks/useApi";
import { useOrderSocket } from "@/hooks/useOrderSocket";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SNAP_PERCENTAGES = [0.82];

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  inputBg: "#F2F4F7",
  border: "#E0E4EA",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
};

type RouteParams = RouteProp<DeliveryStackParamList, "RiderFound">;

const DEFAULT_PICKUP = { latitude: 5.5968, longitude: -0.1869 };
const DEFAULT_DROPOFF = { latitude: 5.6502, longitude: -0.187 };

// ─── Custom Bottom Sheet ──────────────────────────────────────────────────────
function CustomBottomSheet({
  snapPoints,
  initialSnapIndex = 0,
  children,
}: {
  snapPoints: number[];
  initialSnapIndex?: number;
  children: React.ReactNode;
}) {
  const translateY = useRef(
    new Animated.Value(snapPoints[initialSnapIndex]),
  ).current;
  const lastGestureY = useRef(snapPoints[initialSnapIndex]);
  const isDragging = useRef(false);

  const snapToPoint = useCallback(() => {
    lastGestureY.current = snapPoints[0];
    Animated.spring(translateY, {
      toValue: snapPoints[0],
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [snapPoints, translateY]);

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
          lastGestureY.current = val;
          translateY.setOffset(val);
          translateY.setValue(0);
        });
      },
      onPanResponderMove: (_, { dy }) => {
        const minY = snapPoints[0];
        // Allow slight over-drag up (-12) and a small bounce down (+30)
        const next = Math.max(
          minY - 12,
          Math.min(minY + 30, lastGestureY.current + dy),
        );
        translateY.setValue(next - lastGestureY.current);
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
        translateY.flattenOffset();
        snapToPoint();
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        translateY.flattenOffset();
        snapToPoint();
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[sheetStyles.sheet, { transform: [{ translateY }] }]}
      {...panResponder.panHandlers}
    >
      {/* Handle — purely decorative, no panHandlers needed here */}
      <View style={sheetStyles.handleArea}>
        <View style={sheetStyles.handle} />
      </View>
      {children}
    </Animated.View>
  );
}

const sheetStyles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  handleArea: { alignItems: "center", paddingTop: 10, paddingBottom: 6 },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: "#D0D6E0" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RiderFoundScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const mapRef = useRef<MapView>(null);

  const orderId = (route.params as any)?.orderId as string | undefined;
  const { data: orderRes } = useOrderPolling(orderId ?? "");
  const orderStatus = orderRes?.data?.status;

  const {
    riderName = "John Cena",
    riderPlate = "GHA - 2233343 -4",
    riderRating = 4.5,
    vehicleType = "bicycle",
    itemType = "Parcel",
    weight = "lightweight",
    specialInstructions = "Handle it as if your life depends on it.",
    paymentMethod = "Bundle credits",
  } = route.params ?? {};

  const pickupCoord = (route.params as any)?.pickupCoords ?? DEFAULT_PICKUP;
  const dropoffCoord = (route.params as any)?.dropoffCoords ?? DEFAULT_DROPOFF;

  const snapPoints = useMemo(
    () => SNAP_PERCENTAGES.map((pct) => SCREEN_HEIGHT * (1 - pct)),
    [],
  );

  const { coords: routeCoords, etaMinutes } = useRoutePolyline({
    origin: pickupCoord,
    destination: dropoffCoord,
    mode: vehicleType === "e-motorcycle" ? "TWO_WHEELER" : "BICYCLE",
  });

  useEffect(() => {
    console.log("RiderFound params:", JSON.stringify(route.params, null, 2));
    console.log(
      "orderRes rider:",
      JSON.stringify(orderRes?.data?.rider, null, 2),
    );
  }, [orderRes]);

  useEffect(() => {
    if (!mapRef.current) return;
    const points =
      routeCoords.length > 0 ? routeCoords : [pickupCoord, dropoffCoord];
    mapRef.current.fitToCoordinates(points, {
      edgePadding: {
        top: 80,
        right: 60,
        bottom: SCREEN_HEIGHT * 0.85,
        left: 60,
      },
      animated: true,
    });
  }, [routeCoords]);

  useOrderSocket({
    orderId: orderId ?? "",
    onStatusChanged: (payload:any) => {
      const status = payload.status as string;
      if (status === "rider_arriving") {
        navigation.replace("RiderArriving", {
          // ✅ prefer socket payload fields, fall back to what was already in params
          riderName:
            payload.rider?.full_name ?? payload.rider?.fullName ?? riderName,
          riderPlate:
            payload.rider?.vehicle?.plate_no ??
            payload.rider?.plate_no ??
            riderPlate,
          riderRating: payload.rider?.rating ?? riderRating,
          riderPhoto:
            payload.rider?.photo_url ??
            (route.params as any)?.riderPhoto ??
            null,
          vehicleType,
          pickup: route.params?.pickup,
          dropoff: route.params?.dropoff,
          pickupCoords: pickupCoord,
          dropoffCoords: dropoffCoord,
          orderId,
        });
      }
    },
  });

  const weightLabel =
    weight === "lightweight"
      ? "Light weight"
      : weight === "standard"
        ? "Standard"
        : "Heavy";

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
        <Marker
          coordinate={pickupCoord}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={styles.pickupDot}>
            <View style={styles.pickupDotInner} />
          </View>
        </Marker>
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
      </MapView>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <ArrowBackSvg width={50} height={48} />
      </TouchableOpacity>

      {/* ETA Badge */}
      <View style={styles.etaBadge}>
        <Text style={styles.etaText}>{displayEta} min</Text>
      </View>

      {/* Bottom Sheet */}
      <CustomBottomSheet snapPoints={snapPoints} initialSnapIndex={0}>
        {/* scrollEnabled={false} — content fits at 82% height, no scroll conflict */}
        <ScrollView
          style={{ maxHeight: SCREEN_HEIGHT * 0.82 - 220 }}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>Rider Found!</Text>

          <View style={styles.riderRow}>
            <BicycleSvg width={96} height={76} />
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

          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <DetailRow label="Item type :" value={itemType} />
          <DetailRow label="Weight category :" value={weightLabel} />
          <DetailRow
            label="Special instructions :"
            value={specialInstructions}
          />
          <DetailRow label="Payment method" value={paymentMethod} />

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={styles.sheetFooter}>
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              !["assigned", "rider_arriving"].includes(orderStatus ?? "") && {
                opacity: 0.5,
              },
            ]}
            onPress={() => {
              if (!["assigned", "rider_arriving"].includes(orderStatus ?? ""))
                return;
              navigation.navigate("RiderArriving", {
                riderName,
                riderPlate,
                riderRating,
                riderPhoto: (route.params as any)?.riderPhoto ?? null, // ← add
                vehicleType,
                pickup: route.params?.pickup,
                dropoff: route.params?.dropoff,
                pickupCoords: pickupCoord,
                dropoffCoords: dropoffCoord,
                orderId: (route.params as any)?.orderId,
              });
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>
              {["assigned", "rider_arriving"].includes(orderStatus ?? "")
                ? "Confirm"
                : "Waiting for rider…"}
            </Text>
          </TouchableOpacity>
          <View style={{ height: 12 }} />
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.navigate("MainTabs")}
            activeOpacity={0.78}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </CustomBottomSheet>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingVertical: 2,
  },
  label: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Colors.textPrimary,
  },
  value: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "right",
    flex: 1,
    paddingLeft: 12,
  },
});

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
    left: width / 2 - 34,
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
  sheetContent: { paddingHorizontal: 22, paddingTop: 4 },
  heading: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 18,
    letterSpacing: 0.2,
  },
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 16,
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
  sectionTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  cancelBtn: {
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
  sheetFooter: {
    paddingHorizontal: 22,
    paddingBottom: 32,
    paddingTop: 8,
    backgroundColor: Colors.white,
  },
});
