/**
 * RiderMatchingScreen.tsx
 * ─────────────────────────────────────────────────────────
 * Real MapView + Routes API polyline replacing the static placeholder.
 * UI/layout unchanged from original.
 */

import React, { useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { SvgXml } from "react-native-svg";
import { DeliveryStackParamList } from "../../navigation/types";
import BicycleSvg from "../../assets/icons/bicycle.svg";
import SearchMagnifySvg from "../../assets/icons/search_magnify.svg";
import { useRoutePolyline } from "../../utils/useRoutePolyline";
// import { GOOGLE_MAPS_API_KEY } from "../../utils/mapsConfig";
import CUSTOM_MAP_STYLE from "../../utils/mapStyle";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  inputBg: "#F2F4F7",
  border: "#E0E4EA",
  textPrimary: "#1A1A2E",
  textMuted: "#9CA3AF",
};

const arrowBackSvg = `<svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 8H1M1 8L8 1M1 8L8 15" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

type RouteParams = RouteProp<DeliveryStackParamList, "RiderMatching">;

// Default Accra coords — overridden when real coords are passed via params
const DEFAULT_PICKUP = { latitude: 5.5968, longitude: -0.1869 };
const DEFAULT_DROPOFF = { latitude: 5.6502, longitude: -0.187 };

const SNAP_PERCENTAGES = [0.55, 0.88];

// ─── Custom Bottom Sheet ──────────────────────────────────────────────────────
interface CustomBottomSheetProps {
  snapPoints: number[];
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
    (index: number) => {
      currentSnapIndex.current = index;
      lastGestureY.current = snapPoints[index];
      Animated.spring(translateY, {
        toValue: snapPoints[index],
        useNativeDriver: true,
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
        translateY.stopAnimation((val) => {
          lastGestureY.current = val;
          translateY.setOffset(val);
          translateY.setValue(0);
        });
      },
      onPanResponderMove: (_, gs) => {
        const minY = snapPoints[snapPoints.length - 1];
        const nextVal = lastGestureY.current + gs.dy;
        const clamped = Math.max(
          minY - 24,
          Math.min(SCREEN_HEIGHT * 0.9, nextVal),
        );
        translateY.setValue(clamped - lastGestureY.current);
      },
      onPanResponderRelease: (_, gs) => {
        translateY.flattenOffset();
        const currentY = lastGestureY.current + gs.dy;
        const velocity = gs.vy;
        let targetIndex = currentSnapIndex.current;

        if (velocity > 0.5) {
          targetIndex = Math.max(0, currentSnapIndex.current - 1);
        } else if (velocity < -0.5) {
          targetIndex = Math.min(
            snapPoints.length - 1,
            currentSnapIndex.current + 1,
          );
        } else {
          let minDist = Infinity;
          snapPoints.forEach((sp, i) => {
            const dist = Math.abs(currentY - sp);
            if (dist < minDist) {
              minDist = dist;
              targetIndex = i;
            }
          });
        }

        lastGestureY.current = snapPoints[targetIndex];
        currentSnapIndex.current = targetIndex;
        Animated.spring(translateY, {
          toValue: snapPoints[targetIndex],
          useNativeDriver: true,
          velocity: gs.vy,
          tension: 68,
          friction: 12,
        }).start();
      },
    }),
  ).current;

  return (
    <Animated.View style={[sheetStyles.sheet, { transform: [{ translateY }] }]}>
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
export default function RiderMatchingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const params = route.params ?? {};

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef<MapView>(null);

  const snapPoints = useMemo(
    () => SNAP_PERCENTAGES.map((pct) => SCREEN_HEIGHT * (1 - pct)),
    [],
  );

  // Use coords passed from previous screen, fall back to defaults
  const pickupCoord = (params as any).pickupCoords ?? DEFAULT_PICKUP;
  const dropoffCoord = (params as any).dropoffCoords ?? DEFAULT_DROPOFF;

  // Fetch real route
  const { coords: routeCoords, etaMinutes } = useRoutePolyline({
    origin: pickupCoord,
    destination: dropoffCoord,
    mode: params.vehicleType === "e-motorcycle" ? "TWO_WHEELER" : "BICYCLE",
  });

  // Fit map to route once loaded
  useEffect(() => {
    if (!mapRef.current) return;
    const points =
      routeCoords.length > 0 ? routeCoords : [pickupCoord, dropoffCoord];
    mapRef.current.fitToCoordinates(points, {
      edgePadding: {
        top: 80,
        right: 60,
        bottom: SCREEN_HEIGHT * 0.5,
        left: 60,
      },
      animated: true,
    });
  }, [routeCoords]);

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Simulate rider found after 4s
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("RiderFound", {
        ...params,
        riderName: "John Cena",
        riderPlate: "GHA - 2233343 -4",
        riderRating: 4.5,
        vehicleType: params.vehicleType ?? "bicycle",
        pickupCoords: pickupCoord,
        dropoffCoords: dropoffCoord,
      });
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

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
        <SvgXml xml={arrowBackSvg} width={16} height={14} />
      </TouchableOpacity>

      {/* ETA Badge */}
      <View style={styles.etaBadge}>
        <Text style={styles.etaText}>{displayEta} min</Text>
      </View>

      {/* Bottom Sheet */}
      <CustomBottomSheet snapPoints={snapPoints} initialSnapIndex={0}>
        <View style={styles.sheetContent}>
          <Text style={styles.heading}>Rider Matching</Text>

          <Animated.View
            style={[
              styles.illustrationWrap,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <SearchMagnifySvg width={52} height={52} />
            <BicycleSvg width={90} height={68} />
          </Animated.View>

          <View style={styles.divider} />

          <Text style={styles.subtitle}>
            Hold on while we connect you{"\n"}to the closest rider...
          </Text>

          <View style={styles.spacer} />

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.navigate("HomeMap")}
            activeOpacity={0.78}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </CustomBottomSheet>
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
    marginBottom: 24,
    letterSpacing: 0.2,
  },
  illustrationWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  divider: {
    width: 130,
    height: 1,
    backgroundColor: "#E0E4EA",
    marginBottom: 18,
  },
  subtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
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
