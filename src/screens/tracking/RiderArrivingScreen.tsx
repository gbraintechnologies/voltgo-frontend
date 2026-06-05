/**
 * RiderArrivingScreen
 *
 * Custom bottom sheet — zero third-party dependencies.
 * Uses React Native's Animated + PanResponder for smooth
 * drag-to-expand / drag-to-collapse UX identical to @gorhom/bottom-sheet.
 *
 * Fonts:
 *  - "Rider Arriving" heading → HelveticaNeue-CondensedBold
 *  - Rider name → Poppins-Bold
 *  - Plate, ETA text, Cancel → Poppins-Regular / Poppins-SemiBold
 *
 * SVG assets:
 *  - arrow_back.svg    → back arrow
 *  - bicycle.svg       → bicycle illustration (in rider row)
 *  - phone_call.svg    → phone icon inside green action button
 *  - chat_bubble.svg   → chat icon inside blue action button
 *  - star.svg          → star icon in rating badge
 *
 * Images:
 *  - rider_john.png → rider circular photo
 *
 * NO @gorhom/bottom-sheet needed
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
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { DeliveryStackParamList } from "../../navigation/types";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import BicycleSvg from "../../assets/icons/bicycle.svg";
import StarSvg from "../../assets/icons/star.svg";
import PhoneCallSvg from "../../assets/icons/phone_call.svg";
import ChatBubbleSvg from "../../assets/icons/chat_bubble.svg";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

// ─── Theme ────────────────────────────────────────────────────────────────────
const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  primaryLight: "#D4F4E0",
  inputBg: "#F2F4F7",
  border: "#E0E4EA",
  textPrimary: "#1A1A2E",
  textMuted: "#9CA3AF",
  etaColor: "#00B86B",
  chatBlueBg: "#D4E8F4",
  chatBlue: "#3B9EFF",
};

// ─── Bottom sheet snap points ─────────────────────────────────────────────────
const SNAP_COLLAPSED = 0.55; // 55% — matches original gorhom config
const SNAP_EXPANDED = 0.9; // 90% — matches original gorhom config

const COLLAPSED_H = SCREEN_H * SNAP_COLLAPSED;
const EXPANDED_H = SCREEN_H * SNAP_EXPANDED;

const SNAP_THRESHOLD = 60;
const VELOCITY_THRESHOLD = 0.5;

// ─── Types ────────────────────────────────────────────────────────────────────
type RouteParams = RouteProp<DeliveryStackParamList, "RiderArriving">;

const PICKUP_COORD = { latitude: 5.5968, longitude: -0.1869 };
const DROPOFF_COORD = { latitude: 5.6502, longitude: -0.187 };

// ─── Custom Bottom Sheet Hook ─────────────────────────────────────────────────
function useCustomBottomSheet() {
  const initialOffset = SCREEN_H - COLLAPSED_H;
  const expandedOffset = SCREEN_H - EXPANDED_H;

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
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,

      onPanResponderGrant: () => {
        translateY.stopAnimation((currentValue) => {
          lastTranslateY.current = currentValue;
          translateY.setOffset(currentValue);
          translateY.setValue(0);
        });
      },

      onPanResponderMove: (_, gestureState) => {
        const clamped = Math.min(
          SCREEN_H - COLLAPSED_H + 40,
          Math.max(SCREEN_H - EXPANDED_H, gestureState.dy),
        );
        translateY.setValue(clamped);
      },

      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const { dy, vy } = gestureState;

        if (vy > VELOCITY_THRESHOLD) {
          springTo(SCREEN_H - COLLAPSED_H, false);
        } else if (vy < -VELOCITY_THRESHOLD) {
          springTo(SCREEN_H - EXPANDED_H, true);
        } else if (dy > SNAP_THRESHOLD) {
          springTo(SCREEN_H - COLLAPSED_H, false);
        } else if (dy < -SNAP_THRESHOLD) {
          springTo(SCREEN_H - EXPANDED_H, true);
        } else {
          const current = lastTranslateY.current + dy;
          const distToCollapsed = Math.abs(current - (SCREEN_H - COLLAPSED_H));
          const distToExpanded = Math.abs(current - (SCREEN_H - EXPANDED_H));
          if (distToCollapsed < distToExpanded) {
            springTo(SCREEN_H - COLLAPSED_H, false);
          } else {
            springTo(SCREEN_H - EXPANDED_H, true);
          }
        }
      },
    }),
  ).current;

  return { translateY, panResponder, isExpanded };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RiderArrivingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const {
    riderName = "John Cena",
    riderPlate = "GHA - 2233343 -4",
    riderRating = 4.5,
    vehicleType = "bicycle",
  } = route.params ?? {};

  const [eta, setEta] = useState(5);
  const { translateY, panResponder, isExpanded } = useCustomBottomSheet();

  const progressAnim = useRef(new Animated.Value(0)).current;

  const USE_STATIC_MAP = true;

  useEffect(() => {
    // Animate progress bar from 0 → 100% over 4 seconds (matches rider found timer)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: false, // width animation can't use native driver
    }).start();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setEta((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigation.replace("ActiveDelivery", route.params);
          return 0;
        }
        return prev - 1;
      });
    }, 10000);
    return () => clearInterval(timer);
  }, []);

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
        <Text style={styles.etaText}>33 min</Text>
      </View>

      {/* ── Custom Bottom Sheet ── */}
      <Animated.View
        style={[styles.bottomSheet, { transform: [{ translateY }] }]}
      >
        {/* Drag handle */}
        <View style={styles.handleArea} {...panResponder.panHandlers}>
          <View style={styles.handleBar} />
        </View>

        {/* Sheet content — not scrollable (fixed layout like original) */}
        <View style={styles.sheetContent}>
          {/* Heading */}
          <Text style={styles.heading}>Rider Arriving</Text>

          {/* Rider Row */}
          <View style={styles.riderRow}>
            <BicycleSvg width={76} height={56} />

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

          {/* Animated progress bar */}
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

          {/* ETA Text */}
          <Text style={styles.etaCountdown}>
            Rider will be here in {eta} min
          </Text>

          {/* Action Buttons */}
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

          {/* Spacer pushes cancel to bottom */}
          <View style={styles.spacer} />

          {/* Cancel */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.navigate("HomeMap")}
            activeOpacity={0.78}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E8EEF4" },

  // Map markers
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

  // ── Custom Bottom Sheet ──
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
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 36,
    alignItems: "center",
  },

  heading: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 20,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 0.2,
  },

  // Rider Row
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // ← add this
    width: "100%",
    marginBottom: 18,
    gap: 10,
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

  divider: {
    width: "55%",
    height: 1,
    backgroundColor: "#E0E4EA",
    marginBottom: 14,
  },

  etaCountdown: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.etaColor,
    marginBottom: 20,
  },

  actionsRow: {
    flexDirection: "row",
    // gap: 20, // ← was 14, increase to match image
    marginBottom: 20,
  },

  actionBtn: {
    width: 60, // ← was 54
    height: 60, // ← was 54
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Poppins-Medium",
  },
  actionBtn1: {
    width: 60, // ← was 54
    height: 60, // ← was 54
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
