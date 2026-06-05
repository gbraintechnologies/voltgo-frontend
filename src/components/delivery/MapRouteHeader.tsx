/**
 * MapRouteHeader
 *
 * Shared component used in:
 *  - SelectVehicleScreen
 *  - RiderMatchingScreen
 *  - RiderFoundScreen
 *  - RiderArrivingScreen
 *  - ActiveDeliveryScreen
 *
 * Shows the map (or placeholder) with:
 *  - Route line drawn (A → B)
 *  - ETA badge (navy pill, e.g. "33 min")
 *  - Optional back arrow button (floating, white circle)
 *
 * Replace <MapPlaceholder /> with a real <MapView> when react-native-maps is installed.
 */
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Colors, Typography, Spacing, Radius, Shadow } from "../../theme";

const { width, height } = Dimensions.get("window");
export const MAP_HEIGHT = height * 0.46;

interface Props {
  onBack?: () => void;
  showBack?: boolean;
  etaMinutes?: number;
  style?: object;
}

export default function MapRouteHeader({
  onBack,
  showBack = true,
  etaMinutes = 33,
  style,
}: Props) {
  return (
    <View style={[styles.mapSection, style]}>
      {/*
        ── react-native-maps implementation ──────────────────────────────────
        import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
        import CUSTOM_MAP_STYLE from '../utils/mapStyle';

        Replace <MapPlaceholder /> with:

        <MapView
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={INITIAL_REGION}
          customMapStyle={CUSTOM_MAP_STYLE}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Polyline
            coordinates={[
              { latitude: 5.8700, longitude: 0.0480 },  // user location
              { latitude: 5.8840, longitude: 0.0590 },  // dropoff
            ]}
            strokeColor={Colors.navy}
            strokeWidth={3}
          />
          <Marker coordinate={{ latitude: 5.8700, longitude: 0.0480 }}>
            <View style={{ width: 14, height: 14, borderRadius: 7,
              backgroundColor: Colors.primary, borderWidth: 3, borderColor: '#fff' }} />
          </Marker>
          <Marker coordinate={{ latitude: 5.8840, longitude: 0.0590 }}>
            <Text style={{ fontSize: 22 }}>📍</Text>
          </Marker>
        </MapView>
        ─────────────────────────────────────────────────────────────────────
      */}
      <MapPlaceholder />

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
        <Text style={styles.etaText}>{etaMinutes} min</Text>
      </View>
    </View>
  );
}

function MapPlaceholder() {
  return (
    <View style={styles.mapBg}>
      {/* Simulated roads */}
      <View
        style={[styles.road, { top: "40%", left: 0, right: 0, height: 2 }]}
      />
      <View
        style={[styles.road, { top: "20%", left: 0, right: 0, height: 1 }]}
      />
      <View
        style={[styles.road, { top: "65%", left: 0, right: 0, height: 1 }]}
      />
      <View
        style={[styles.road, { left: "30%", top: 0, bottom: 0, width: 2 }]}
      />
      <View
        style={[styles.road, { left: "60%", top: 0, bottom: 0, width: 1 }]}
      />

      {/* Labels */}
      <Text style={[styles.mapLabel, { top: "10%", right: "8%" }]}>
        Afienya
      </Text>
      <Text style={[styles.mapLabel, { top: "18%", right: "10%" }]}>
        Next Filling Station
      </Text>
      <Text style={[styles.mapLabel, { top: "38%", left: "35%" }]}>
        Stariua Prep. School
      </Text>
      <Text style={[styles.mapLabel, { top: "52%", left: "5%" }]}>
        Zee's glam & nails
      </Text>
      <Text style={[styles.mapLabel, { top: "22%", left: "10%" }]}>Romesh</Text>

      {/* Route line (simplified) */}
      <View style={styles.routeLineH} />
      <View style={styles.routeLineV} />

      {/* Rider marker on route */}
      <Text style={[styles.markerEmoji, { top: "36%", left: "26%" }]}>🚲</Text>
      <Text style={[styles.markerEmoji, { top: "28%", left: "42%" }]}>🛵</Text>
      <Text style={[styles.markerEmoji, { top: "48%", left: "55%" }]}>🚲</Text>

      {/* Dropoff pin */}
      <Text
        style={[styles.markerEmoji, { top: "15%", right: "22%", fontSize: 22 }]}
      >
        📍
      </Text>

      {/* User dot */}
      <View style={styles.userDot} />

      {/* POI markers */}
      <View style={[styles.poiDot, { top: "10%", left: "8%" }]}>
        <Text style={{ fontSize: 10 }}>🍽️</Text>
      </View>
      <View style={[styles.poiDot, { top: "22%", right: "18%" }]}>
        <Text style={{ fontSize: 10 }}>🍽️</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapSection: {
    flex: 1, // ← was: height: MAP_HEIGHT
    position: "relative",
    overflow: "hidden",
  },
  mapBg: {
    flex: 1,
    backgroundColor: "#E8EEF4",
    position: "relative",
  },
  road: {
    position: "absolute",
    backgroundColor: "rgba(180,200,220,0.6)",
  },
  mapLabel: {
    position: "absolute",
    fontFamily: "Nunito-Regular",
    fontSize: 9,
    color: "#8899AA",
  },
  // Route: horizontal + vertical segments (L-shaped like in screenshots)
  routeLineH: {
    position: "absolute",
    height: 3,
    backgroundColor: Colors.navy,
    left: "15%",
    right: "35%",
    top: "44%",
    borderRadius: 2,
  },
  routeLineV: {
    position: "absolute",
    width: 3,
    backgroundColor: Colors.navy,
    right: "35%",
    top: "18%",
    height: "27%",
    borderRadius: 2,
  },
  markerEmoji: {
    position: "absolute",
    fontSize: 20,
  },
  userDot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
    bottom: "52%",
    left: "13%",
    ...Shadow.soft,
  },
  poiDot: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
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
