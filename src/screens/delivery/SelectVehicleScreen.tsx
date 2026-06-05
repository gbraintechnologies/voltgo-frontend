/**
 * SelectVehicleScreen
 *
 * Custom bottom sheet — zero third-party dependencies.
 * Uses React Native's Animated + PanResponder for smooth
 * drag-to-expand / drag-to-collapse UX identical to @gorhom/bottom-sheet.
 *
 * Fonts:
 *  - "Select Vehicle Type" heading, vehicle names, prices, button text → HelveticaNeue-CondensedBold
 *  - Description, ETA, labels, Bundle Credits text → Poppins-Regular / Poppins-SemiBold
 *
 * SVG assets (imported from your assets folder):
 *  - arrow_back.svg
 *  - bicycle.svg
 *  - emoto.svg
 *  - bundle_credits.svg
 *  - chevron_right.svg
 *
 * Dependencies needed:
 *  - react-native-maps
 *  - react-native-svg  (SvgXml)
 *  NO @gorhom/bottom-sheet needed
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  PanResponder,
  ScrollView,
  LayoutChangeEvent,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { DeliveryStackParamList } from "../../navigation/types";
import BundleCreditsSvg from "../../assets/icons/bundle_credits.svg";
import EmotoSvg from "../../assets/icons/emoto.svg";
import BicycleSvg from "../../assets/icons/bicycle.svg";
import ChevronRightSvg from "../../assets/icons/chevron_right.svg";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import { Image } from "react-native";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

// ─── Theme ────────────────────────────────────────────────────────────────────
const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  // inputBg: "#F2F4F7",
  inputBg: "#eeeeee",
  border: "#E0E4EA",
  textPrimary: "#1A1A2E",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  cardBorder: "#D1D8E4",
  bundleBg: "#E8F4FF",
  bundleIcon: "#000000ff",
};

// ─── Bottom sheet snap points (% of screen height) ───────────────────────────
const SNAP_COLLAPSED = 0.50;
const SNAP_EXPANDED = 0.65;
const SNAP_FULL = 0.70; // ← new: nearly full screen

const COLLAPSED_H = SCREEN_H * SNAP_COLLAPSED;
const EXPANDED_H = SCREEN_H * SNAP_EXPANDED;
const FULL_H = SCREEN_H * SNAP_FULL;

// How much drag before snapping to the other position
const SNAP_THRESHOLD = 60;
// Velocity threshold — fast flick snaps regardless of distance
const VELOCITY_THRESHOLD = 0.5;

// ─── Types ────────────────────────────────────────────────────────────────────
type RouteParams = RouteProp<DeliveryStackParamList, "SelectVehicle">;
type VehicleType = "bicycle" | "e-motorcycle";

const VEHICLES = [
  {
    id: "bicycle" as VehicleType,
    name: "Bicycle",
    description: "Lightweight, short distance",
    price: 24,
    eta: "6 min",
    Icon: BicycleSvg,
    svgW: 64,
    svgH: 48,
  },
  {
    id: "e-motorcycle" as VehicleType,
    name: "E-Motorcycle",
    description: "Standard/Heavy, Longer distance",
    price: 44,
    eta: "10 min",
    Icon: EmotoSvg,
    svgW: 68,
    svgH: 48,
  },
];

// Accra coordinates for the demo route
const PICKUP_COORD = { latitude: 5.5968, longitude: -0.1869 };
const DROPOFF_COORD = { latitude: 5.6502, longitude: -0.187 };

// ─── Custom Bottom Sheet Hook ─────────────────────────────────────────────────
function useCustomBottomSheet() {
  const initialOffset = SCREEN_H - COLLAPSED_H;

  const translateY = useRef(new Animated.Value(initialOffset)).current;
  const lastTranslateY = useRef(initialOffset);
  const [isExpanded, setIsExpanded] = useState(false);

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
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,

      onPanResponderGrant: () => {
        translateY.stopAnimation((currentValue) => {
          lastTranslateY.current = currentValue;
          translateY.setOffset(currentValue);
          translateY.setValue(0);
        });
      },

      onPanResponderMove: (_, gs) => {
        // gs.dy is relative delta from grant point
        // offset is already set to lastTranslateY, so just clamp gs.dy
        const minDelta = SCREEN_H - FULL_H - lastTranslateY.current; // how far up we can go
        const maxDelta = SCREEN_H - COLLAPSED_H + 40 - lastTranslateY.current; // how far down
        const clamped = Math.min(maxDelta, Math.max(minDelta, gs.dy));
        translateY.setValue(clamped);
      },

      onPanResponderRelease: (_, gs) => {
        translateY.flattenOffset();
        const current = lastTranslateY.current + gs.dy;
        const { vy } = gs;

        if (vy > VELOCITY_THRESHOLD) {
          springTo(SCREEN_H - COLLAPSED_H, false);
        } else if (vy < -VELOCITY_THRESHOLD) {
          springTo(
            current < SCREEN_H - EXPANDED_H
              ? SCREEN_H - FULL_H
              : SCREEN_H - EXPANDED_H,
            true,
          );
        } else {
          const snaps = [
            SCREEN_H - COLLAPSED_H,
            SCREEN_H - EXPANDED_H,
            SCREEN_H - FULL_H,
          ];
          const nearest = snaps.reduce((a, b) =>
            Math.abs(current - a) < Math.abs(current - b) ? a : b,
          );
          springTo(nearest, nearest !== SCREEN_H - COLLAPSED_H);
        }
      },
    }),
  ).current;

  return { translateY, panResponder, isExpanded };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SelectVehicleScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const { pickup = "American House", dropoff = "University of Ghana" } =
    route.params ?? {};

  const USE_STATIC_MAP = true;

  const [selected, setSelected] = useState<VehicleType>("bicycle");
  const { translateY, panResponder, isExpanded } = useCustomBottomSheet();

  const selectedVehicle = VEHICLES.find((v) => v.id === selected)!;

  const handleContinue = () => {
    navigation.navigate("ReviewDelivery", {
      pickup,
      dropoff,
      itemType: route.params?.itemType ?? "",
      weight: route.params?.weight ?? "lightweight",
      specialInstructions: route.params?.specialInstructions,
      vehicleType: selected,
      price: selectedVehicle.price,
      paymentMethod: "Bundle Credits",
    });
  };

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

      {/* ── Real Map ── */}
      {USE_STATIC_MAP ? (
        <Image
          source={require("../../assets/images/map_long.png")}
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
          {/* Pickup — blue dot */}
          <Marker coordinate={PICKUP_COORD} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.pickupDot}>
              <View style={styles.pickupDotInner} />
            </View>
          </Marker>
          {/* Dropoff — navy pin */}
          <Marker coordinate={DROPOFF_COORD} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.dropoffPin}>
              <View style={styles.dropoffPinCircle} />
              <View style={styles.dropoffPinTail} />
            </View>
          </Marker>
        </MapView>
      )}
      {/* ── Back Button ── */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <ArrowBackSvg width={60} height={58} />
      </TouchableOpacity>

      {/* ── ETA Badge ── */}
      <View style={styles.etaBadge}>
        <Text style={styles.etaText}>{selectedVehicle.eta}</Text>
      </View>

      {/* ── Custom Bottom Sheet ── */}
      <Animated.View
        style={[styles.bottomSheet, { transform: [{ translateY }] }]}
      >
        {/* Drag handle — full-width touch target for ergonomics */}
        <View style={styles.handleArea} {...panResponder.panHandlers}>
          <View style={styles.handleBar} />
        </View>

        {/* Scrollable content — scroll only works when expanded */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          // Disable scroll while collapsed so pan responder owns the gesture
          scrollEnabled={isExpanded}
          bounces={false}
        >
          {/* Heading */}
          <Text style={styles.heading}>Select Vehicle Type</Text>

          {/* Vehicle Cards */}
          {VEHICLES.map((vehicle) => {
            const isSelected = selected === vehicle.id;
            return (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleCard,
                  isSelected && styles.vehicleCardSelected,
                ]}
                onPress={() => setSelected(vehicle.id)}
                activeOpacity={0.85}
              >
                <vehicle.Icon width={vehicle.svgW} height={vehicle.svgH} />
                <View style={styles.vehicleInfo}>
                  <View style={styles.vehicleTopRow}>
                    <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    <Text style={styles.vehiclePrice}>
                      GHS {vehicle.price}.00
                    </Text>
                  </View>
                  <Text style={styles.vehicleDesc}>{vehicle.description}</Text>
                  <Text style={styles.vehicleEta}>{vehicle.eta}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Bundle Credits Row */}
          <TouchableOpacity
            style={styles.bundleRow}
            onPress={() =>
              navigation.navigate("PayWith", {
                vehicleType: selected,
                price: selectedVehicle.price,
                pickup,
                dropoff,
              })
            }
            activeOpacity={0.8}
          >
            <View style={styles.bundleIconWrap}>
              <BundleCreditsSvg width={60} height={56} />
            </View>
            <Text style={styles.bundleLabel}>Bundle Credits</Text>
            <Text style={styles.bundleCredits}>3 credits left</Text>
            <ChevronRightSvg width={8} height={14} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8EEF4",
  },

  // Map markers
  pickupDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(74, 144, 226, 0.25)",
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
  dropoffPin: {
    alignItems: "center",
  },
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

  // Overlays
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
    alignSelf: "center",
    left: SCREEN_W / 2 - 36,
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

  // ── Custom Bottom Sheet ──
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    // Sheet starts at the top of screen; translateY controls visible portion
    top: 0,
    height: SCREEN_H,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    // Shadow above the sheet
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },

  // Handle
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
    paddingHorizontal: 20,
    paddingTop: 0,
  },

  heading: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 18,
    // letterSpacing: 0.1
  },

  // Vehicle Cards
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 14,
    backgroundColor: Colors.white,
  },
  vehicleCardSelected: {
    borderColor: Colors.navy,
    borderWidth: 2,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  vehicleName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  vehiclePrice: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  vehicleDesc: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 3,
  },
  vehicleEta: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Bundle Credits
  bundleRow: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: Colors.bundleBg,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
    gap: 12,
  },
  bundleIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 10,
    // backgroundColor: Colors.bundleIcon,
    alignItems: "center",
    justifyContent: "center",
  },
  bundleLabel: {
    flex: 1,
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  bundleCredits: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 4,
  },

  // Continue
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});

// ─── Light map style ──────────────────────────────────────────────────────────
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
