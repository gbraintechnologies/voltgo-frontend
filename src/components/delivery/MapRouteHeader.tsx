/**
 * MapRouteHeader.tsx
 * ─────────────────────────────────────────────────────────
 * Shared map header used across:
 *   SelectVehicleScreen, RiderMatchingScreen, RiderFoundScreen,
 *   RiderArrivingScreen, ActiveDeliveryScreen
 *
 * Now uses a real MapView with:
 *   - Google Routes API polyline (via useRoutePolyline hook)
 *   - Pickup dot marker + dropoff pin marker
 *   - ETA badge (auto-computed from Routes API, falls back to prop)
 *   - Optional back button
 *   - Custom light map style
 */
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { Colors, Typography, Spacing, Radius, Shadow } from "../../theme";
import {
  useRoutePolyline,
  LatLng,
  TravelMode,
} from "../../utils/useRoutePolyline";
import CUSTOM_MAP_STYLE from "../../utils/mapStyle";

const { width, height } = Dimensions.get("window");
export const MAP_HEIGHT = height * 0.46;

interface Props {
  origin: LatLng;
  destination: LatLng;
  /** Vehicle mode affects the routing calculation */
  mode?: TravelMode;
  onBack?: () => void;
  showBack?: boolean;
  /** Fallback ETA shown while route is loading. Ignored once Routes API responds. */
  etaMinutes?: number;
  style?: object;
  /** Optionally render extra markers / overlays inside the MapView */
  children?: React.ReactNode;
}

export default function MapRouteHeader({
  origin,
  destination,
  mode = "DRIVE",
  onBack,
  showBack = true,
  etaMinutes: etaProp = 33,
  style,
  children,
}: Props) {
  const mapRef = useRef<MapView>(null);

  const {
    coords,
    etaMinutes: etaFromAPI,
    loading,
  } = useRoutePolyline({
    origin,
    destination,
    mode,
  });

  const displayedEta = etaFromAPI ?? etaProp;

  // Fit the map to show both markers once the route arrives
  useEffect(() => {
    if (!mapRef.current) return;
    const points = coords.length > 0 ? coords : [origin, destination];
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 60, right: 60, bottom: 100, left: 60 },
      animated: true,
    });
  }, [coords]);

  // Initial region centred between origin and destination
  const initialRegion: Region = {
    latitude: (origin.latitude + destination.latitude) / 2,
    longitude: (origin.longitude + destination.longitude) / 2,
    latitudeDelta:
      Math.abs(origin.latitude - destination.latitude) * 2.5 + 0.02,
    longitudeDelta:
      Math.abs(origin.longitude - destination.longitude) * 2.5 + 0.02,
  };

  return (
    <View style={[styles.mapSection, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        customMapStyle={CUSTOM_MAP_STYLE}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
      >
        {/* Real road polyline from Routes API */}
        {coords.length > 0 && (
          <Polyline
            coordinates={coords}
            strokeColor={Colors.navy}
            strokeWidth={3.5}
            lineDashPattern={undefined}
          />
        )}

        {/* Pickup dot */}
        <Marker
          coordinate={origin}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={styles.pickupOuter}>
            <View style={styles.pickupInner} />
          </View>
        </Marker>

        {/* Dropoff pin */}
        <Marker
          coordinate={destination}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={false}
        >
          <View style={styles.dropoffPin}>
            <View style={styles.dropoffCircle} />
            <View style={styles.dropoffTail} />
          </View>
        </Marker>

        {/* Additional markers passed by screens (e.g. animated rider position) */}
        {children}
      </MapView>

      {/* Back button */}
      {showBack && onBack && (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      )}

      {/* ETA Badge */}
      <View style={styles.etaBadge}>
        <Text style={styles.etaText}>{displayedEta} min</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapSection: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },

  // Pickup marker
  pickupOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(74,144,226,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickupInner: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#4A90E2",
    borderWidth: 2.5,
    borderColor: "#fff",
  },

  // Dropoff marker
  dropoffPin: { alignItems: "center" },
  dropoffCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.navy,
  },
  dropoffTail: {
    width: 3,
    height: 8,
    backgroundColor: Colors.navy,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },

  // Back button
  backBtn: {
    position: "absolute",
    top: 52,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.soft,
  },
  backArrow: {
    fontSize: 18,
    color: Colors.textPrimary,
  },

  // ETA badge
  etaBadge: {
    position: "absolute",
    bottom: "30%",
    alignSelf: "center",
    left: "33%",
    backgroundColor: Colors.navy,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  etaText: {
    fontFamily: "Nunito-Bold",
    fontSize: Typography.sm,
    color: Colors.white,
  },
});


