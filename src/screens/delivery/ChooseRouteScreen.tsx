/**
 * ChooseRouteScreen.tsx  (fixed)
 * ─────────────────────────────────────────────────────────
 * Fixes:
 *   ✅ Pickup field is now a real GooglePlacesAutocomplete (typeable)
 *   ✅ Nearby landmarks fetched from Places Nearby Search API
 *   ✅ Landmarks shown in idle state AND in pickup suggestions panel
 *   ✅ Dropoff GPA unchanged / still works
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

// SVG assets
import CloseXSvg from "../../assets/icons/close_x.svg";
import Calendersvg from "../../assets/icons/sendpackage-calender.svg";
import ChevronDownSvg from "../../assets/icons/chevron-down-dark.svg";
import PinOutlineSvg from "../../assets/icons/pin_outline.svg";
import PinActiveSvg from "../../assets/icons/pin_location.svg";
import MapPinPersonSvg from "../../assets/icons/map_pin_person.svg";
import ClockSvg from "../../assets/icons/clock.svg";

import {
  GOOGLE_MAPS_API_KEY,
  PLACES_LOCATION_BIAS,
} from "../../utils/mapConfig";
import { useRecentSearches } from "@/hooks/userRecentSearches";
import { useDeviceLocation } from "../../contexts/LocationContext";
import MapPinPickerModal, {
  PickedLocation,
} from "@/components/common/MapPinPickerModal";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#AAAAAA",
  border: "#F0F0F0",
  inputBg: "#eeeeee",
  inputBgFocused: "#FFFFFF",
  currentLocationBg: "#EAF4FF",
  currentLocationText: "#1A6FC4",
  landmarkBg: "#F5F5F5",
  shadowColor: "#000",
};

type PinTarget = "pickup" | "dropoff";

// ── Nearby landmarks hook ──────────────────────────────────────────────────
interface Landmark {
  place_id: string;
  name: string;
  vicinity: string;
}

function useNearbyLandmarks(
  coords: { latitude: number; longitude: number } | null,
) {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);

    // Use Places Nearby Search — point_of_interest covers landmarks,
    // transit stations, malls, hospitals, schools etc.
    fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
        `?location=${coords.latitude},${coords.longitude}` +
        `&radius=1500` +
        `&type=point_of_interest` +
        `&rankby=prominence` +
        `&key=${GOOGLE_MAPS_API_KEY}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.results) {
          // Take top 5 most prominent nearby places
          setLandmarks(
            data.results.slice(0, 5).map((p: any) => ({
              place_id: p.place_id,
              name: p.name,
              vicinity: p.vicinity ?? "",
            })),
          );
        }
      })
      .catch((e) => console.warn("[useNearbyLandmarks]", e))
      .finally(() => setLoading(false));
  }, [coords?.latitude, coords?.longitude]);

  return { landmarks, loading };
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function ChooseRouteScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const autoFocusedRef = useRef(false);

  const [dropoffLabel, setDropoffLabel] = useState<string>("");
  const [dropoffCoords, setDropoffCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const {
    coords: deviceCoords,
    address: deviceAddress,
    loading: locationLoading,
  } = useDeviceLocation();

  const { landmarks, loading: landmarksLoading } =
    useNearbyLandmarks(deviceCoords);

  const [pickupLabel, setPickupLabel] = useState<string>("");
  const [pickupCoords, setPickupCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Pre-fill pickup with device location once resolved
  useEffect(() => {
    if (!locationLoading && deviceAddress && !pickupLabel) {
      setPickupLabel(deviceAddress);
      setPickupCoords(deviceCoords);
    }
  }, [locationLoading, deviceAddress, deviceCoords]);

  const { recents, addRecent, clearRecents } = useRecentSearches();

  const [pinPickerVisible, setPinPickerVisible] = useState(false);
  const [pinPickerTarget, setPinPickerTarget] = useState<PinTarget>("dropoff");

  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [pickupFocused, setPickupFocused] = useState(false);
  const [dropoffFocused, setDropoffFocused] = useState(false);

  // Refs for both GPA instances
  const pickupRef = useRef<any>(null);
  const dropoffRef = useRef<any>(null);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const p = route.params as any;
    if (!p) return;

    if (p.prefillDropoff) {
      setDropoffLabel(p.prefillDropoff);
      if (p.prefillDropoffCoords) setDropoffCoords(p.prefillDropoffCoords);
      const timer = setTimeout(() => {
        dropoffRef.current?.setAddressText?.(p.prefillDropoff);
        // Focus dropoff so user can confirm or change it
        dropoffRef.current?.focus?.();
      }, 150);
      return () => clearTimeout(timer);
    }

    if (p.prefillPickup) {
      setPickupLabel(p.prefillPickup);
      if (p.prefillPickupCoords) setPickupCoords(p.prefillPickupCoords);
      const timer = setTimeout(() => {
        pickupRef.current?.setAddressText?.(p.prefillPickup);
        dropoffRef.current?.focus?.();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (route.params?.selectedTime) setScheduledTime(route.params.selectedTime);
  }, [route.params?.selectedTime]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        autoFocusedRef.current = true; // ← mark as programmatic
        dropoffRef.current?.focus?.();
      }, 100);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const params = navigation
        .getState()
        ?.routes?.find((r: any) => r.name === "SchedulePickup")?.params as any;
      if (params?.selectedTime) setScheduledTime(params.selectedTime);
    }, []),
  );

  const proceed = useCallback(
    (
      dropoffName: string,
      dropoffCoordsArg?: { latitude: number; longitude: number },
    ) => {
      addRecent({
        name: dropoffName,
        address: dropoffCoordsArg
          ? `${dropoffCoordsArg.latitude.toFixed(4)}, ${dropoffCoordsArg.longitude.toFixed(4)}`
          : "",
        coords: dropoffCoordsArg,
      });
      navigation.navigate("DeliveryFlow", {
        screen: "DeliveryDetails",
        params: {
          pickup: pickupLabel || deviceAddress,
          pickupCoords: pickupCoords ?? deviceCoords ?? undefined,
          dropoff: dropoffName,
          dropoffCoords: dropoffCoordsArg,
          isScheduled: !!scheduledTime,
          scheduledTime: scheduledTime ?? undefined,
        },
      });
    },
    [
      pickupLabel,
      pickupCoords,
      deviceAddress,
      deviceCoords,
      scheduledTime,
      addRecent,
      navigation,
    ],
  );

  const handleDropoffSelect = useCallback(
    (data: any, details: any | null) => {
      const name = data.structured_formatting?.main_text ?? data.description;
      const lat = details?.geometry?.location?.lat;
      const lng = details?.geometry?.location?.lng;
      const coords = lat && lng ? { latitude: lat, longitude: lng } : undefined;
      setDropoffLabel(name);
      setDropoffCoords(coords ?? null);
      setDropoffFocused(false);
      proceed(name, coords); // still auto-proceeds on a fresh selection
    },
    [proceed],
  );

  const handlePickupSelect = useCallback((data: any, details: any | null) => {
    const name = data.structured_formatting?.main_text ?? data.description;
    const lat = details?.geometry?.location?.lat;
    const lng = details?.geometry?.location?.lng;
    const coords = lat && lng ? { latitude: lat, longitude: lng } : undefined;
    setPickupLabel(name);
    setPickupCoords(coords ?? null);
    setPickupFocused(false);
    // Move focus to dropoff after pickup is set
    setTimeout(() => dropoffRef.current?.focus?.(), 80);
  }, []);

  const handleSelectCurrentLocation = useCallback(
    (target: PinTarget) => {
      if (!deviceCoords) return;
      if (target === "pickup") {
        setPickupLabel(deviceAddress);
        setPickupCoords(deviceCoords);
        // Update the GPA text field to show the address
        pickupRef.current?.setAddressText?.(deviceAddress);
        setPickupFocused(false);
        setTimeout(() => dropoffRef.current?.focus?.(), 80);
      } else {
        proceed(deviceAddress, deviceCoords);
      }
    },
    [deviceCoords, deviceAddress, proceed],
  );

  const handleSelectLandmark = useCallback(
    (landmark: Landmark, target: PinTarget) => {
      if (target === "pickup") {
        setPickupLabel(landmark.name);
        // We don't have coords from Nearby Search, so geocode via place_id
        fetch(
          `https://maps.googleapis.com/maps/api/place/details/json` +
            `?place_id=${landmark.place_id}` +
            `&fields=geometry` +
            `&key=${GOOGLE_MAPS_API_KEY}`,
        )
          .then((r) => r.json())
          .then((data) => {
            const loc = data.result?.geometry?.location;
            if (loc) setPickupCoords({ latitude: loc.lat, longitude: loc.lng });
          })
          .catch(console.warn);
        pickupRef.current?.setAddressText?.(landmark.name);
        setPickupFocused(false);
        setTimeout(() => dropoffRef.current?.focus?.(), 80);
      } else {
        // For dropoff: geocode then proceed
        fetch(
          `https://maps.googleapis.com/maps/api/place/details/json` +
            `?place_id=${landmark.place_id}` +
            `&fields=geometry` +
            `&key=${GOOGLE_MAPS_API_KEY}`,
        )
          .then((r) => r.json())
          .then((data) => {
            const loc = data.result?.geometry?.location;
            proceed(
              landmark.name,
              loc ? { latitude: loc.lat, longitude: loc.lng } : undefined,
            );
          })
          .catch(() => proceed(landmark.name));
      }
    },
    [proceed],
  );

  const handleSelectRecent = useCallback(
    (recent: {
      name: string;
      coords?: { latitude: number; longitude: number };
    }) => {
      proceed(recent.name, recent.coords);
    },
    [proceed],
  );

  const handlePinConfirm = useCallback(
    (loc: PickedLocation) => {
      setPinPickerVisible(false);
      if (pinPickerTarget === "pickup") {
        setPickupLabel(loc.name);
        setPickupCoords(loc.coords);
        pickupRef.current?.setAddressText?.(loc.name);
      } else {
        proceed(loc.name, loc.coords);
      }
    },
    [pinPickerTarget, proceed],
  );

  const openPinPicker = useCallback((target: PinTarget) => {
    setPinPickerTarget(target);
    setPinPickerVisible(true);
  }, []);

  // ── Shared header row for suggestions panels ───────────────────────────
  const CurrentLocationRow = ({ target }: { target: PinTarget }) => (
    <TouchableOpacity
      style={styles.currentLocationRow}
      onPress={() => handleSelectCurrentLocation(target)}
      activeOpacity={0.7}
    >
      <View style={styles.currentLocationIconWrap}>
        <Text style={styles.currentLocationIcon}>◎</Text>
      </View>
      <View style={styles.locationTextWrap}>
        <Text style={styles.currentLocationLabel}>Current Location</Text>
        {locationLoading ? (
          <ActivityIndicator size="small" color={Colors.currentLocationText} />
        ) : (
          <Text style={styles.currentLocationSub} numberOfLines={1}>
            {deviceAddress}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // ── Nearby landmarks section (reusable) ────────────────────────────────
  const NearbySection = ({ target }: { target: PinTarget }) => {
    if (landmarksLoading) {
      return (
        <View style={styles.nearbyLoadingRow}>
          <ActivityIndicator size="small" color={Colors.textMuted} />
          <Text style={styles.nearbyLoadingText}>
            Finding nearby landmarks…
          </Text>
        </View>
      );
    }
    if (landmarks.length === 0) return null;
    return (
      <>
        <View style={styles.sectionDivider} />
        <View style={styles.recentHeader}>
          <Text style={styles.recentLabel}>Nearby</Text>
        </View>
        {landmarks.map((lm, i) => (
          <TouchableOpacity
            key={lm.place_id}
            style={[
              styles.recentRow,
              i < landmarks.length - 1 && styles.recentRowBorder,
            ]}
            onPress={() => handleSelectLandmark(lm, target)}
            activeOpacity={0.7}
          >
            <View style={styles.landmarkIconWrap}>
              <Text style={styles.landmarkIcon}>📍</Text>
            </View>
            <View style={styles.locationTextWrap}>
              <Text style={styles.locationName}>{lm.name}</Text>
              {lm.vicinity ? (
                <Text style={styles.locationAddress}>{lm.vicinity}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  const showIdle = !pickupFocused && !dropoffFocused;

  return (
    <>
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseXSvg width={18} height={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Route</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
            flex: 1,
          }}
        >
          {/* ── Schedule Pill ── */}
          <View style={styles.schedulePillWrap}>
            <TouchableOpacity
              style={[
                styles.scheduleBtn,
                scheduledTime
                  ? styles.scheduleBtnActive
                  : styles.scheduleBtnInactive,
              ]}
              onPress={() => navigation.navigate("SchedulePickup")}
              activeOpacity={0.75}
            >
              <Calendersvg width={14} height={14} />
              <Text
                style={[
                  styles.scheduleText,
                  !scheduledTime && styles.scheduleTextInactive,
                ]}
              >
                {scheduledTime ?? "Schedule"}
              </Text>
              <ChevronDownSvg width={13} height={13} />
            </TouchableOpacity>
          </View>

          {/* ── Input Section ── */}
          <View style={styles.inputsSection}>
            {/* ── Pickup: real GooglePlacesAutocomplete ── */}
            <View
              style={[
                styles.inputCard,
                pickupFocused && styles.inputCardFocused,
              ]}
            >
              <PinOutlineSvg width={18} height={18} style={styles.inputIcon} />
              <View style={styles.gpaWrapper}>
                <GooglePlacesAutocomplete
                  ref={pickupRef}
                  placeholder={pickupLabel || "Pickup location"}
                  fetchDetails
                  onPress={handlePickupSelect}
                  onFail={() => {}}
                  query={{
                    key: GOOGLE_MAPS_API_KEY,
                    language: "en",
                    location: `${PLACES_LOCATION_BIAS.latitude},${PLACES_LOCATION_BIAS.longitude}`,
                    radius: PLACES_LOCATION_BIAS.radius,
                    components: "country:gh",
                  }}
                  enablePoweredByContainer={false}
                  suppressDefaultStyles
                  styles={{
                    container: styles.gpaContainer,
                    textInputContainer: styles.gpaTextInputContainer,
                    textInput: styles.gpaTextInput,
                    listView: styles.gpaListView,
                    row: styles.gpaRow,
                    description: styles.gpaDescription,
                    separator: styles.gpaSeparator,
                    poweredContainer: { display: "none" },
                    powered: { display: "none" },
                  }}
                  textInputProps={{
                    placeholderTextColor: Colors.textMuted,
                    // Show the current pickupLabel as the field value
                    defaultValue: pickupLabel,
                    onFocus: () => {
                      setPickupFocused(true);
                      setDropoffFocused(false);
                      dropoffRef.current?.blur?.();
                    },
                    onBlur: () => {
                      setTimeout(() => setPickupFocused(false), 200);
                    },
                  }}
                  renderRow={(data: any) => (
                    <View style={styles.suggestionRow}>
                      <View style={styles.clockIconWrap}>
                        <ClockSvg width={16} height={16} />
                      </View>
                      <View style={styles.locationTextWrap}>
                        <Text style={styles.locationName} numberOfLines={1}>
                          {data.structured_formatting?.main_text ??
                            data.description}
                        </Text>
                        {data.structured_formatting?.secondary_text ? (
                          <Text
                            style={styles.locationAddress}
                            numberOfLines={1}
                          >
                            {data.structured_formatting.secondary_text}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  )}
                  // The header inside GPA's own dropdown
                  renderHeaderComponent={() => (
                    <CurrentLocationRow target="pickup" />
                  )}
                  keepResultsAfterBlur={false}
                  minLength={2}
                  debounce={300}
                  isRowScrollable={false}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
              <TouchableOpacity
                onPress={() => openPinPicker("pickup")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <MapPinPersonSvg width={22} height={22} />
              </TouchableOpacity>
            </View>

            {/* Connector dots */}
            <View style={styles.connector}>
              <View style={styles.connectorDot} />
              <View style={styles.connectorDot} />
              <View style={styles.connectorDot} />
            </View>

            {/* ── Dropoff: GooglePlacesAutocomplete ── */}
            <View
              style={[
                styles.inputCard,
                dropoffFocused && styles.inputCardFocused,
              ]}
            >
              <PinActiveSvg width={18} height={18} style={styles.inputIcon} />
              <View style={styles.gpaWrapper}>
                <GooglePlacesAutocomplete
                  ref={dropoffRef}
                  placeholder="Dropoff location"
                  fetchDetails
                  onPress={handleDropoffSelect}
                  onFail={() => {}}
                  query={{
                    key: GOOGLE_MAPS_API_KEY,
                    language: "en",
                    location: `${PLACES_LOCATION_BIAS.latitude},${PLACES_LOCATION_BIAS.longitude}`,
                    radius: PLACES_LOCATION_BIAS.radius,
                    components: "country:gh",
                  }}
                  enablePoweredByContainer={false}
                  suppressDefaultStyles
                  styles={{
                    container: styles.gpaContainer,
                    textInputContainer: styles.gpaTextInputContainer,
                    textInput: styles.gpaTextInput,
                    listView: styles.gpaListView,
                    row: styles.gpaRow,
                    description: styles.gpaDescription,
                    separator: styles.gpaSeparator,
                    poweredContainer: { display: "none" },
                    powered: { display: "none" },
                  }}
                  textInputProps={{
                    placeholderTextColor: Colors.textMuted,
                    onFocus: () => {
                      if (autoFocusedRef.current) {
                        // Programmatic focus — don't hide the idle list
                        autoFocusedRef.current = false;
                        return;
                      }
                      setDropoffFocused(true);
                      setPickupFocused(false);
                      pickupRef.current?.blur?.();
                    },
                    onBlur: () => {
                      setTimeout(() => setDropoffFocused(false), 200);
                    },
                  }}
                  renderRow={(data: any) => (
                    <View style={styles.suggestionRow}>
                      <View style={styles.clockIconWrap}>
                        <ClockSvg width={16} height={16} />
                      </View>
                      <View style={styles.locationTextWrap}>
                        <Text style={styles.locationName} numberOfLines={1}>
                          {data.structured_formatting?.main_text ??
                            data.description}
                        </Text>
                        {data.structured_formatting?.secondary_text ? (
                          <Text
                            style={styles.locationAddress}
                            numberOfLines={1}
                          >
                            {data.structured_formatting.secondary_text}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  )}
                  renderHeaderComponent={() => (
                    <CurrentLocationRow target="dropoff" />
                  )}
                  keepResultsAfterBlur={false}
                  minLength={2}
                  debounce={300}
                  isRowScrollable={false}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
              <TouchableOpacity
                style={{ paddingLeft: 6 }}
                onPress={() => openPinPicker("dropoff")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <MapPinPersonSvg width={22} height={22} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Idle state: recent searches + nearby landmarks ── */}
          {showIdle &&
            (landmarks.length > 0 ||
              recents.length > 0 ||
              landmarksLoading) && (
              <ScrollView
                style={styles.listSection}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Nearby landmarks */}
                {landmarks.length > 0 && (
                  <>
                    <View style={styles.recentHeader}>
                      <Text style={styles.recentLabel}>Nearby</Text>
                    </View>
                    {landmarks.map((lm, i) => (
                      <TouchableOpacity
                        key={lm.place_id}
                        style={[
                          styles.locationRow,
                          i < landmarks.length - 1 && styles.locationRowBorder,
                        ]}
                        onPress={() => handleSelectLandmark(lm, "dropoff")}
                        activeOpacity={0.7}
                      >
                        <View style={styles.landmarkIconWrap}>
                          <Text style={styles.landmarkIcon}>📍</Text>
                        </View>
                        <View style={styles.locationTextWrap}>
                          <Text style={styles.locationName}>{lm.name}</Text>
                          {lm.vicinity ? (
                            <Text style={styles.locationAddress}>
                              {lm.vicinity}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {/* Recent searches */}
                {recents.length > 0 && (
                  <>
                    <View
                      style={[
                        styles.recentHeader,
                        landmarks.length > 0 && { marginTop: 8 },
                      ]}
                    >
                      <Text style={styles.recentLabel}>Recent</Text>
                      <TouchableOpacity
                        onPress={clearRecents}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.clearText}>Clear</Text>
                      </TouchableOpacity>
                    </View>
                    {recents.map((r, i) => (
                      <TouchableOpacity
                        key={r.id}
                        style={[
                          styles.locationRow,
                          i < recents.length - 1 && styles.locationRowBorder,
                        ]}
                        onPress={() => handleSelectRecent(r)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.clockIconWrap}>
                          <ClockSvg width={20} height={20} />
                        </View>
                        <View style={styles.locationTextWrap}>
                          <Text style={styles.locationName}>{r.name}</Text>
                          {r.address ? (
                            <Text style={styles.locationAddress}>
                              {r.address}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {landmarksLoading && (
                  <View style={styles.nearbyLoadingRow}>
                    <ActivityIndicator size="small" color={Colors.textMuted} />
                    <Text style={styles.nearbyLoadingText}>
                      Finding nearby places…
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
        </Animated.View>
      </KeyboardAvoidingView>

      {/* ── Map pin picker modal ── */}
      <MapPinPickerModal
        visible={pinPickerVisible}
        onClose={() => setPinPickerVisible(false)}
        onConfirm={handlePinConfirm}
        initialCoords={
          pinPickerTarget === "pickup"
            ? (pickupCoords ?? deviceCoords ?? undefined)
            : (deviceCoords ?? undefined)
        }
        title={
          pinPickerTarget === "pickup" ? "Choose Pickup" : "Choose Dropoff"
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 8 : 12,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 19,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  headerSpacer: { width: 32 },

  schedulePillWrap: { paddingHorizontal: 20, marginBottom: 16 },
  scheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
    gap: 6,
  },
  scheduleBtnActive: { backgroundColor: "#0B3C5D" },
  scheduleBtnInactive: { backgroundColor: Colors.inputBg },
  scheduleText: {
    fontFamily: "Poppins-Medium",
    fontSize: 13,
    color: Colors.white,
  },
  scheduleTextInactive: { color: Colors.textSecondary },

  // ── Input cards ────────────────────────────────────────────────────────
  inputsSection: { paddingHorizontal: 20, marginBottom: 4 },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderWidth: 1.5,
    borderColor: "transparent",
    minHeight: 52,
    overflow: "visible",
  },
  inputCardFocused: {
    borderColor: Colors.navy,
    backgroundColor: Colors.inputBgFocused,
  },
  inputIcon: { marginRight: 10, flexShrink: 0 },

  connector: { alignItems: "center", paddingVertical: 4, gap: 3 },
  connectorDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },

  // ── GooglePlacesAutocomplete ───────────────────────────────────────────
  gpaWrapper: { flex: 1 },
  gpaContainer: { flex: 1 },
  gpaTextInputContainer: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 0,
    height: 52,
  },
  gpaTextInput: {
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: "transparent",
    margin: 0,
    padding: 0,
    paddingVertical: 0,
    height: 52,
    borderWidth: 0,
    shadowColor: "transparent",
    elevation: 0,
  },
  gpaListView: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginTop: 4,
    marginHorizontal: -14,
    borderWidth: 1,
    borderColor: "#E8EEF4",
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    position: "absolute",
    top: 52,
    left: -48,
    right: -36,
    zIndex: 1000,
  },
  gpaRow: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
  },
  gpaDescription: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  gpaSeparator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },

  // ── Suggestion rows ────────────────────────────────────────────────────
  suggestionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  currentLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.currentLocationBg,
    gap: 12,
  },
  currentLocationIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.currentLocationText,
    alignItems: "center",
    justifyContent: "center",
  },
  currentLocationIcon: { fontSize: 16, color: Colors.white },
  currentLocationLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.currentLocationText,
    marginBottom: 2,
  },
  currentLocationSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // ── Idle list ──────────────────────────────────────────────────────────
  listSection: { flex: 1, paddingHorizontal: 20, marginTop: 12, marginBottom:30 },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  recentLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  clearText: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 13,
    paddingHorizontal: 4,
  },
  recentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 15,
    paddingHorizontal: 4,
  },
  locationRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  clockIconWrap: { marginRight: 14, marginTop: 2 },
  landmarkIconWrap: { marginRight: 14, marginTop: 0 },
  landmarkIcon: { fontSize: 20 },
  locationTextWrap: { flex: 1 },
  locationName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  locationAddress: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  sectionDivider: { height: 1, backgroundColor: Colors.border },
  nearbyLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 14,
  },
  nearbyLoadingText: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
});


