/**
 * RiderFoundScreen
 *
 * Bottom sheet is built from scratch using Animated + PanResponder.
 * No @gorhom/bottom-sheet dependency required.
 *
 * Fonts:
 *  - "Rider Found!" heading, "Delivery Details" section, Confirm button → HelveticaNeue-CondensedBold
 *  - Rider name, plate, detail labels/values, Cancel → Poppins-Regular / Poppins-SemiBold / Poppins-Bold
 *
 * SVG assets:
 *  - arrow_back.svg      → back arrow
 *  - bicycle.svg         → bicycle illustration (in rider row)
 *  - star.svg            → star icon in rating badge
 *
 * Images:
 *  - rider_john.jpg / rider_john.png → rider circular photo
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

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Snap points as percentages of screen height ─────────────────────────────
// Snap 0 = 58% of screen (collapsed), Snap 1 = 92% of screen (expanded)
const SNAP_PERCENTAGES = [0.68];

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

const PICKUP_COORD = { latitude: 5.5968, longitude: -0.1869 };
const DROPOFF_COORD = { latitude: 5.6502, longitude: -0.187 };

// ─── Custom Bottom Sheet ──────────────────────────────────────────────────────

interface CustomBottomSheetProps {
  snapPoints: number[]; // array of pixel Y-positions (distance from top of screen)
  initialSnapIndex?: number;
  children: React.ReactNode;
}

function CustomBottomSheet({
  snapPoints,
  initialSnapIndex = 0,
  children,
}: CustomBottomSheetProps) {
  const translateY = useRef(
    new Animated.Value(snapPoints[initialSnapIndex]),
  ).current;
  const currentSnapIndex = useRef(initialSnapIndex);
  const lastGestureY = useRef(snapPoints[initialSnapIndex]);

  const snapTo = useCallback(
    (index: number, velocity = 0) => {
      currentSnapIndex.current = index;
      lastGestureY.current = snapPoints[index];
      Animated.spring(translateY, {
        toValue: snapPoints[index],
        useNativeDriver: true,
        velocity,
        tension: 68,
        friction: 12,
      }).start();
    },
    [snapPoints, translateY],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 4,
      onPanResponderGrant: () => {
        // Stop any running animation and grab current value
        translateY.stopAnimation((val) => {
          lastGestureY.current = val;
          translateY.setOffset(val);
          translateY.setValue(0);
        });
      },
      onPanResponderMove: (_, gs) => {
        const nextVal = lastGestureY.current + gs.dy;
        const minY = snapPoints[snapPoints.length - 1];
        // Only allow very slight overdrag upward (12px rubber-band),
        // and prevent dragging down more than 30px
        const clamped = Math.max(minY - 12, Math.min(minY + 30, nextVal));
        translateY.setValue(clamped - lastGestureY.current);
      },

      onPanResponderRelease: (_, gs) => {
        translateY.flattenOffset();
        // Always snap back to the single point
        lastGestureY.current = snapPoints[0];
        currentSnapIndex.current = 0;
        Animated.spring(translateY, {
          toValue: snapPoints[0],
          useNativeDriver: true,
          tension: 68,
          friction: 12,
        }).start();
      },
    }),
  ).current;

  return (
    <Animated.View style={[sheetStyles.sheet, { transform: [{ translateY }] }]}>
      {/* Drag handle — pan responder attached here */}
      <View {...panResponder.panHandlers} style={sheetStyles.handleArea}>
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
    // Height is large enough to cover from the topmost snap point to below the screen
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
  handleArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D0D6E0",
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RiderFoundScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
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

  const USE_STATIC_MAP = true;

  // Convert snap percentages to pixel Y-positions (translateY from top of screen)
  // Index 0 = 58% = sheet top is at 42% from screen top → translateY = 0.42 * SCREEN_HEIGHT
  // Index 1 = 92% = sheet top is at 8% from screen top → translateY = 0.08 * SCREEN_HEIGHT
  const snapPoints = useMemo(
    () => SNAP_PERCENTAGES.map((pct) => SCREEN_HEIGHT * (1 - pct)),
    [],
  );

  const weightLabel =
    weight === "lightweight"
      ? "Light weight"
      : weight === "standard"
        ? "Standard"
        : "Heavy";

  const mapRegion = {
    latitude: (PICKUP_COORD.latitude + DROPOFF_COORD.latitude) / 2,
    longitude: (PICKUP_COORD.longitude + DROPOFF_COORD.longitude) / 2,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ── Map ── */}
      {USE_STATIC_MAP ? (
        <Image
          source={require("../../assets/images/map_placeholder.png")}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          region={mapRegion}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          customMapStyle={lightMapStyle}
        >
          <Polyline
            coordinates={[PICKUP_COORD, DROPOFF_COORD]}
            strokeColor={Colors.navy}
            strokeWidth={3.5}
          />
          <Marker coordinate={PICKUP_COORD} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.pickupDot}>
              <View style={styles.pickupDotInner} />
            </View>
          </Marker>
          <Marker coordinate={DROPOFF_COORD} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.dropoffPin}>
              <View style={styles.dropoffPinCircle} />
              <View style={styles.dropoffPinTail} />
            </View>
          </Marker>
        </MapView>
      )}
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
        <Text style={styles.etaText}>33 min</Text>
      </View>

      {/* ── Custom Bottom Sheet ── */}
      <CustomBottomSheet snapPoints={snapPoints} initialSnapIndex={0}>
        <ScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          // Let scroll work when sheet is fully expanded
          scrollEnabled={true}
          bounces={false}
        >
          {/* Heading */}
          <Text style={styles.heading}>Rider Found!</Text>

          {/* Rider Row */}
          <View style={styles.riderRow}>
            <BicycleSvg width={96} height={76} />

            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Image
                  source={require("../../assets/images/rider_john.png")}
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

          {/* ── Delivery Details ── */}
          <Text style={styles.sectionTitle}>Delivery Details</Text>

          <DetailRow label="Item type :" value={itemType} />
          <DetailRow label="Weight category :" value={weightLabel} />
          <DetailRow
            label="Special instructions :"
            value={specialInstructions}
          />
          <DetailRow label="Payment method" value={paymentMethod} />

          <View style={{ height: 24 }} />

          {/* Confirm */}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => navigation.navigate("RiderArriving", route.params)}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>Confirm</Text>
          </TouchableOpacity>

          <View style={{ height: 12 }} />

          {/* Cancel */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.navigate("HomeMap")}
            activeOpacity={0.78}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </CustomBottomSheet>
    </View>
  );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────
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
    justifyContent: "space-between", // ← this creates the gap
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
    textAlign: "right", // ← align values to the right
    flex: 1,
    paddingLeft: 12,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
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

  sheetContent: {
    paddingHorizontal: 22,
    paddingTop: 4,
  },

  heading: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 20,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 18,
    letterSpacing: 0.2,
  },

  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // was missing
    marginBottom: 20,
    gap: 16,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 4,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.navy,
    overflow: "hidden",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
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
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 17,
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
});

const lightMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#eaf0f6" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7a9bb5" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d0dce8" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#ccdce8" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
