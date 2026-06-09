/**
 * MapPinPickerModal.tsx
 * ─────────────────────────────────────────────────────────
 * Full-screen map where the user drags a pin to pick any location.
 * Reverse-geocodes the selected coordinate to a street address label.
 * Works for both pickup and dropoff.
 *
 * Props:
 *   visible       — controls the modal
 *   onClose       — called when user dismisses without confirming
 *   onConfirm     — called with { name, address, coords } on confirm
 *   initialCoords — where to centre the map initially
 *   title         — "Choose Pickup" | "Choose Dropoff" (shown in header)
 *
 * Dependencies (already in your project):
 *   react-native-maps
 *   expo-location  (for reverse geocoding)
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import MapView, { Region, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import CUSTOM_MAP_STYLE from "../../utils/mapStyle";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
  inputBg: "#F2F4F7",
  border: "#E0E4EA",
  overlay: "rgba(11,31,58,0.55)",
};

export interface PickedLocation {
  name: string;
  address: string;
  coords: { latitude: number; longitude: number };
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (location: PickedLocation) => void;
  initialCoords?: { latitude: number; longitude: number };
  title?: string;
}

const DEFAULT_COORDS = { latitude: 5.603717, longitude: -0.186964 };
const GEOCODE_DEBOUNCE_MS = 600;

export default function MapPinPickerModal({
  visible,
  onClose,
  onConfirm,
  initialCoords,
  title = "Choose Location",
}: Props) {
  const mapRef = useRef<MapView>(null);

  const centre = initialCoords ?? DEFAULT_COORDS;

  const [region, setRegion] = useState<Region>({
    latitude: centre.latitude,
    longitude: centre.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [resolvedLabel, setResolvedLabel] = useState<string>("");
  const [resolvedAddress, setResolvedAddress] = useState<string>("");
  const [geocoding, setGeocoding] = useState(false);

  // Pin bob animation when map stops moving
  const pinAnim = useRef(new Animated.Value(0)).current;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-centre when initialCoords changes (e.g. modal reopened for different field)
  useEffect(() => {
    if (!visible) return;
    const c = initialCoords ?? DEFAULT_COORDS;
    setRegion((prev) => ({
      ...prev,
      latitude: c.latitude,
      longitude: c.longitude,
    }));
    reverseGeocode(c.latitude, c.longitude);
  }, [visible, initialCoords]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const [place] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (place) {
        const name =
          place.name ??
          place.street ??
          place.district ??
          place.subregion ??
          "Selected Location";
        const addr = [place.street, place.district, place.city]
          .filter(Boolean)
          .join(", ");
        setResolvedLabel(name);
        setResolvedAddress((addr || place.city) ?? "");
      }
    } catch {
      setResolvedLabel("Selected Location");
      setResolvedAddress("");
    } finally {
      setGeocoding(false);
    }
  }, []);

  // Animate pin on drag start
  const onRegionChangeStart = useCallback(() => {
    Animated.spring(pinAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  }, [pinAnim]);

  // Debounce geocoding while user drags
  const onRegionChangeComplete = useCallback(
    (r: Region) => {
      setRegion(r);

      // Drop pin back down
      Animated.spring(pinAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }).start();

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        reverseGeocode(r.latitude, r.longitude);
      }, GEOCODE_DEBOUNCE_MS);
    },
    [pinAnim, reverseGeocode],
  );

  const handleConfirm = useCallback(() => {
    onConfirm({
      name: resolvedLabel || "Selected Location",
      address: resolvedAddress,
      coords: { latitude: region.latitude, longitude: region.longitude },
    });
  }, [onConfirm, resolvedLabel, resolvedAddress, region]);

  // Pin lifts up when dragging, drops back on release
  const pinTranslateY = pinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });
  const pinShadowOpacity = pinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.32],
  });
  const pinShadowScale = pinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* ── Map ── */}
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          region={region}
          onRegionChangeStart={onRegionChangeStart}
          onRegionChangeComplete={onRegionChangeComplete}
          customMapStyle={CUSTOM_MAP_STYLE}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          rotateEnabled={false}
        />

        {/* ── Fixed centre pin ── */}
        <View style={styles.pinContainer} pointerEvents="none">
          {/* Shadow under pin */}
          <Animated.View
            style={[
              styles.pinShadow,
              {
                opacity: pinShadowOpacity,
                transform: [{ scaleX: pinShadowScale }],
              },
            ]}
          />
          {/* Pin itself */}
          <Animated.View
            style={[
              styles.pinWrapper,
              { transform: [{ translateY: pinTranslateY }] },
            ]}
          >
            <View style={styles.pinHead} />
            <View style={styles.pinTail} />
          </Animated.View>
        </View>

        {/* ── Top bar ── */}
        <View
          style={[
            styles.topBar,
            { paddingTop: Platform.OS === "ios" ? 54 : 38 },
          ]}
        >
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Bottom confirmation card ── */}
        <View style={styles.bottomCard}>
          <View style={styles.locationRow}>
            <View style={styles.locationDot} />
            <View style={styles.locationTextWrap}>
              {geocoding ? (
                <View style={styles.geocodingRow}>
                  <ActivityIndicator size="small" color={Colors.navy} />
                  <Text style={styles.geocodingText}>Finding address…</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.locationName} numberOfLines={1}>
                    {resolvedLabel || "Move the map to pick a location"}
                  </Text>
                  {resolvedAddress ? (
                    <Text style={styles.locationAddress} numberOfLines={1}>
                      {resolvedAddress}
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.hint}>
            Drag the map to move the pin to any location
          </Text>

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              (geocoding || !resolvedLabel) && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={geocoding || !resolvedLabel}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8EEF4",
  },

  // ── Fixed centre pin ──────────────────────────────────────────────────────
  pinContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    // Centre-align: pin head is 28px wide, tail is 4px wide
    marginLeft: -14,
    // Offset up by half the bottom card height so pin sits on map centre visually
    marginTop: -52,
    alignItems: "center",
  },
  pinShadow: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.navy,
    marginTop: 2,
  },
  pinWrapper: {
    alignItems: "center",
    marginBottom: 0,
    position: "absolute",
    bottom: 8,
  },
  pinHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.navy,
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  pinTail: {
    width: 4,
    height: 14,
    backgroundColor: Colors.navy,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },

  // ── Top bar ───────────────────────────────────────────────────────────────
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  topBarTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },

  // ── Bottom confirmation card ──────────────────────────────────────────────
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  locationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.navy,
    flexShrink: 0,
  },
  locationTextWrap: {
    flex: 1,
  },
  geocodingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  geocodingText: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textMuted,
  },
  locationName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  locationAddress: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 14,
  },
  hint: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});



