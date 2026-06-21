/**
 * SelectVehicleScreen.tsx
 * ─────────────────────────────────────────────────────────
 * Real MapView + Routes API polyline. ETA badge updates
 * automatically based on the selected vehicle mode.
 * UI/layout unchanged from original.
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
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { DeliveryStackParamList } from "../../navigation/types";
import BundleCreditsSvg from "../../assets/icons/bundle_credits.svg";
import EmotoSvg from "../../assets/icons/emoto.svg";
import BicycleSvg from "../../assets/icons/bicycle.svg";
import ChevronRightSvg from "../../assets/icons/chevron_right.svg";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import { useRoutePolyline, TravelMode } from "../../utils/useRoutePolyline";
import CUSTOM_MAP_STYLE from "../../utils/mapStyle";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  inputBg: "#eeeeee",
  border: "#E0E4EA",
  textPrimary: "#1A1A2E",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  cardBorder: "#D1D8E4",
};

const SNAP_COLLAPSED = 0.5;
const SNAP_EXPANDED = 0.65;
const SNAP_FULL = 0.7;

const COLLAPSED_H = SCREEN_H * SNAP_COLLAPSED;
const EXPANDED_H = SCREEN_H * SNAP_EXPANDED;
const FULL_H = SCREEN_H * SNAP_FULL;
const SNAP_THRESHOLD = 60;
const VELOCITY_THRESHOLD = 0.5;

type RouteParams = RouteProp<DeliveryStackParamList, "SelectVehicle">;
type VehicleType = "bicycle" | "e-motorcycle";

const VEHICLES: {
  id: VehicleType;
  name: string;
  description: string;
  price: number;
  mode: TravelMode;
  Icon: any;
  svgW: number;
  svgH: number;
}[] = [
  {
    id: "bicycle",
    name: "Bicycle",
    description: "Lightweight, short distance",
    price: 24,
    mode: "BICYCLE",
    Icon: BicycleSvg,
    svgW: 64,
    svgH: 48,
  },
  {
    id: "e-motorcycle",
    name: "E-Motorcycle",
    description: "Standard/Heavy, Longer distance",
    price: 44,
    mode: "TWO_WHEELER",
    Icon: EmotoSvg,
    svgW: 68,
    svgH: 48,
  },
];

const DEFAULT_PICKUP = { latitude: 5.5968, longitude: -0.1869 };
const DEFAULT_DROPOFF = { latitude: 5.6502, longitude: -0.187 };

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
        translateY.stopAnimation((currentValue) => {
          lastTranslateY.current = currentValue;
          translateY.setOffset(currentValue);
          translateY.setValue(0);
        });
      },
      onPanResponderMove: (_, { dy }) => {
        const minDelta = SCREEN_H - FULL_H - lastTranslateY.current;
        const maxDelta = SCREEN_H - COLLAPSED_H + 40 - lastTranslateY.current;
        translateY.setValue(Math.min(maxDelta, Math.max(minDelta, dy)));
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        isDragging.current = false;
        translateY.flattenOffset();
        const current = lastTranslateY.current + dy;

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

export default function SelectVehicleScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const mapRef = useRef<MapView>(null);

  const [selected, setSelected] = useState<VehicleType>("bicycle");
  const { translateY, panResponder, isExpanded } = useCustomBottomSheet();

  const { pickup, dropoff, isScheduled, scheduledTime } = route.params ?? {};

  const pickupCoord = (route.params as any)?.pickupCoords ?? DEFAULT_PICKUP;
  const dropoffCoord = (route.params as any)?.dropoffCoords ?? DEFAULT_DROPOFF;

  const selectedVehicle = VEHICLES.find((v) => v.id === selected)!;

  // Fetch route for selected vehicle mode — re-fetches when selection changes
  const {
    coords: routeCoords,
    etaMinutes,
    loading,
  } = useRoutePolyline({
    origin: pickupCoord,
    destination: dropoffCoord,
    mode: selectedVehicle.mode,
  });

  // Fit map whenever route updates
  useEffect(() => {
    if (!mapRef.current) return;
    const points =
      routeCoords.length > 0 ? routeCoords : [pickupCoord, dropoffCoord];
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 60, right: 60, bottom: SCREEN_H * 0.58, left: 60 },
      animated: true,
    });
  }, [routeCoords]);

  const displayEta = etaMinutes
    ? `${etaMinutes} min`
    : loading
      ? "..."
      : selectedVehicle.id === "bicycle"
        ? "6 min"
        : "10 min";

  // const handleContinue = () => {
  //   if (isScheduled) {
  //     navigation.navigate("ReviewDelivery", {
  //       pickup,
  //       dropoff,
  //       pickupCoords: pickupCoord,
  //       dropoffCoords: dropoffCoord,
  //       itemType: (route.params as any)?.itemType ?? "",
  //       weight: (route.params as any)?.weight ?? "lightweight",
  //       specialInstructions: (route.params as any)?.specialInstructions,
  //       vehicleType: selected,
  //       price: selectedVehicle.price,
  //       paymentMethod: "Bundle Credits",
  //       isScheduled: true,
  //       scheduledTime,
  //     });
  //   } else {
  //     navigation.navigate("RiderMatching", {
  //       pickup,
  //       dropoff,
  //       pickupCoords: pickupCoord,
  //       dropoffCoords: dropoffCoord,
  //       itemType: (route.params as any)?.itemType ?? "",
  //       weight: (route.params as any)?.weight ?? "lightweight",
  //       specialInstructions: (route.params as any)?.specialInstructions,
  //       vehicleType: selected,
  //       price: selectedVehicle.price,
  //       paymentMethod: "Bundle Credits",
  //     });
  //   }
  // };

  const handleContinue = () => {
    // Both scheduled and non-scheduled go through ReviewDelivery
    // so payment is always required before an order is created
    navigation.navigate("ReviewDelivery", {
      pickup,
      dropoff,
      pickupCoords: pickupCoord,
      dropoffCoords: dropoffCoord,
      itemType: (route.params as any)?.itemType ?? "",
      weight: (route.params as any)?.weight ?? "lightweight",
      specialInstructions: (route.params as any)?.specialInstructions,
      vehicleType: selected,
      price: selectedVehicle.price,
      isScheduled: !!isScheduled,
      scheduledTime: scheduledTime ?? undefined,
    });
  };

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
        <ArrowBackSvg width={60} height={58} />
      </TouchableOpacity>

      {/* ETA Badge — live from Routes API */}
      <View style={styles.etaBadge}>
        <Text style={styles.etaText}>{displayEta}</Text>
      </View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[styles.bottomSheet, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.handleArea}>
          <View style={styles.handleBar} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={isExpanded}
          bounces={false}
        >
          <Text style={styles.heading}>Select Vehicle Type</Text>

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
                  {/* Show live ETA only for selected vehicle */}
                  {isSelected && (
                    <Text style={styles.vehicleEta}>{displayEta}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Bundle Credits */}
          {/* <TouchableOpacity
            style={styles.bundleRow}
            onPress={() =>
              navigation.navigate("PayWith", {
                vehicleType: selected,
                price: selectedVehicle.price,
                pickup,
                dropoff,
                pickupCoords: pickupCoord,
                dropoffCoords: dropoffCoord,
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
          </TouchableOpacity> */}

          {/* Continue */}
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
  sheetContent: { paddingHorizontal: 20, paddingTop: 0 },

  heading: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 18,
  },
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
  vehicleCardSelected: { borderColor: Colors.navy, borderWidth: 2 },
  vehicleInfo: { flex: 1 },
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
  },
  vehiclePrice: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: Colors.textPrimary,
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

  bundleRow: {
    flexDirection: "row",
    alignItems: "center",
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

  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20
  },
  continueBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});



