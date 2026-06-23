/**
 * HomeMapScreen.tsx
 * ─────────────────────────────────────────────────────────
 *   ✅ Rider markers use real SVG asset files
 *   ✅ Bottom sheet shows active delivery card when one is in progress
 *   ✅ Empty fallback state when no active deliveries
 *   ✅ Send Package row styled to match original
 *   ✅ Bottom sheet snap points spread out before nav triggers
 *   ✅ Search button (top-right) opens animated search bar (right → left)
 *   ✅ Search bar has pickup/dropoff toggle pill
 *   ✅ Search results update a pin on the map + allow pinch/zoom
 *   ✅ Confirming a result pre-populates the chosen field in ChooseRoute
 */

import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  PanResponder,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { Colors, Radius, Shadow } from "../../theme";
import ParcelSvg from "../../assets/icons/package.svg";
import Calendersvg from "../../assets/icons/sendpackage-calender.svg";
import PinLocationSvg from "../../assets/icons/pin_location.svg";
import PinOutlineSvg from "../../assets/icons/pin_outline.svg";
import CloseXSvg from "../../assets/icons/close_x.svg";

import BicycleMarkerSvg from "../../assets/icons/bicycle.svg";
import ScooterMarkerSvg from "../../assets/icons/emoto.svg";

import { useOrderSocket } from "../../hooks/useOrderSocket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QK } from "../../hooks/useApi";

import { useDeviceLocation } from "../../contexts/LocationContext";
import CUSTOM_MAP_STYLE from "../../utils/mapStyle";
import { useMyOrders } from "../../hooks/useApi";
import { Order, ordersApi } from "../../api/orders";
import {
  GOOGLE_MAPS_API_KEY,
  PLACES_LOCATION_BIAS,
} from "../../utils/mapConfig";

const { height, width } = Dimensions.get("window");

const DEFAULT_REGION: Region = {
  latitude: 5.603717,
  longitude: -0.186964,
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};

const RIDERS = [
  { id: 1, lat: 5.606, lng: -0.184, type: "bicycle" },
  { id: 2, lat: 5.61, lng: -0.191, type: "scooter" },
  { id: 3, lat: 5.6, lng: -0.182, type: "scooter" },
  { id: 4, lat: 5.598, lng: -0.188, type: "bicycle" },
  { id: 5, lat: 5.612, lng: -0.18, type: "bicycle" },
  { id: 6, lat: 5.596, lng: -0.194, type: "scooter" },
];

const SNAP_COLLAPSED = height * 0.68;
const SNAP_EXPANDED = height * 0.42;
const SNAP_FULL = height * 0.28;

const ACTIVE_STATUSES = [
  "pending",
  "searching",
  "assigned",
  "rider_arriving",
  "collected",
  "in_transit",
];

const STATUS_LABEL: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pending", color: "#B45309", bg: "#FEF3C7" },
  searching: { label: "Finding rider", color: "#1D4ED8", bg: "#DBEAFE" },
  assigned: { label: "Rider assigned", color: "#065F46", bg: "#D1FAE5" },
  rider_arriving: { label: "Rider arriving", color: "#065F46", bg: "#D1FAE5" },
  collected: { label: "Collected", color: "#1D4ED8", bg: "#DBEAFE" },
  in_transit: { label: "In transit", color: "#1D4ED8", bg: "#DBEAFE" },
};

type SearchTarget = "dropoff" | "pickup";

// ── Active delivery mini-card ──────────────────────────────────────────────
function ActiveDeliveryCard({
  order,
  onPress,
}: {
  order: Order;
  onPress: () => void;
}) {
  const status = STATUS_LABEL[order.status] ?? STATUS_LABEL.pending;
  return (
    <TouchableOpacity
      style={activeStyles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View
        style={[activeStyles.accentBar, { backgroundColor: status.color }]}
      />
      <View style={activeStyles.cardBody}>
        <View style={activeStyles.topRow}>
          <View style={[activeStyles.badge, { backgroundColor: status.bg }]}>
            <View
              style={[activeStyles.badgeDot, { backgroundColor: status.color }]}
            />
            <Text style={[activeStyles.badgeText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
          <Text style={activeStyles.price}>
            GHS {order.price_ghs ? Number(order.price_ghs).toFixed(2) : "—"}
          </Text>
        </View>
        <View style={activeStyles.routeRow}>
          <View style={activeStyles.routeIconCol}>
            <View style={activeStyles.dotGreen} />
            <View style={activeStyles.routeLine} />
            <PinLocationSvg width={12} height={14} />
          </View>
          <View style={activeStyles.routeAddresses}>
            <Text style={activeStyles.routeAddr} numberOfLines={1}>
              {order.pickup_address ?? "Pickup"}
            </Text>
            <Text style={activeStyles.routeAddr} numberOfLines={1}>
              {order.dropoff_address ?? "Dropoff"}
            </Text>
          </View>
        </View>
      </View>
      <View style={activeStyles.chevronWrap}>
        <Text style={activeStyles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={emptyStyles.wrap}>
      <View style={emptyStyles.iconCircle}>
        <View style={emptyStyles.boxBody}>
          <View style={emptyStyles.boxLid} />
          <View style={emptyStyles.boxRibbon} />
        </View>
      </View>
      <Text style={emptyStyles.title}>No active deliveries</Text>
      <Text style={emptyStyles.sub}>
        Your in-progress deliveries will appear here
      </Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function HomeMapScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const gpaRef = useRef<any>(null);

  const [riderLocation, setRiderLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const isDragging = useRef(false);

  const { coords: deviceCoords } = useDeviceLocation();

  const { data: ordersRes } = useQuery({
    queryKey: QK.orders(),
    queryFn: () => ordersApi.getMyOrders({ limit: 20 }),
    refetchInterval: 5000, // poll every 5s on home screen
    staleTime: 0,
  });

  const allOrders: Order[] =
    (ordersRes?.data as any)?.items ?? ordersRes?.data?.orders ?? [];
    
  const activeOrders = allOrders.filter((o) =>
    ACTIVE_STATUSES.includes(o.status),
  );
  const topActive = activeOrders[0] ?? null;

  // ── Search overlay state ────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTarget, setSearchTarget] = useState<SearchTarget>("dropoff");
  const [searchPin, setSearchPin] = useState<{
    latitude: number;
    longitude: number;
    name: string;
  } | null>(null);
  const [pendingResult, setPendingResult] = useState<{
    name: string;
    coords?: { latitude: number; longitude: number };
  } | null>(null);

  // Slide: starts at full width (off-screen right), animates to 0
  const searchSlideX = useRef(new Animated.Value(width)).current;
  const searchFadeBackdrop = useRef(new Animated.Value(0)).current;

  const qc = useQueryClient();

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setSearchPin(null);
    setPendingResult(null);
    Animated.parallel([
      Animated.spring(searchSlideX, {
        toValue: 0,
        tension: 68,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(searchFadeBackdrop, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => gpaRef.current?.focus?.(), 80);
    });
  }, [searchSlideX, searchFadeBackdrop]);

  const closeSearch = useCallback(() => {
    Animated.parallel([
      Animated.spring(searchSlideX, {
        toValue: width,
        tension: 68,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(searchFadeBackdrop, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSearchOpen(false);
      setSearchPin(null);
      setPendingResult(null);
      gpaRef.current?.clear?.();
    });
  }, [searchSlideX, searchFadeBackdrop]);

  const handleSearchSelect = useCallback((data: any, details: any | null) => {
    const name = data.structured_formatting?.main_text ?? data.description;
    const lat = details?.geometry?.location?.lat;
    const lng = details?.geometry?.location?.lng;
    const pin = lat && lng ? { latitude: lat, longitude: lng, name } : null;

    if (pin) {
      setSearchPin(pin);
      mapRef.current?.animateToRegion(
        {
          latitude: pin.latitude,
          longitude: pin.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        },
        600,
      );
    }
    setPendingResult({
      name,
      coords: pin
        ? { latitude: pin.latitude, longitude: pin.longitude }
        : undefined,
    });
  }, []);

  const handleConfirmPin = useCallback(() => {
    if (!pendingResult) return;
    closeSearch();
    setTimeout(() => {
      navigation.navigate("DeliveryFlow", {
        screen: "ChooseRoute",
        params:
          searchTarget === "pickup"
            ? {
                prefillPickup: pendingResult.name,
                prefillPickupCoords: pendingResult.coords,
              }
            : {
                prefillDropoff: pendingResult.name,
                prefillDropoffCoords: pendingResult.coords,
              },
      });
    }, 320);
  }, [pendingResult, searchTarget, closeSearch, navigation]);

  useEffect(() => {
    if (!topActive) return;

    if (
      topActive.status === "assigned" ||
      topActive.status === "rider_arriving"
    ) {
      // Auto-navigate to RiderFound if we were on matching
      // Only if the current route is HomeMap (not already on tracking screens)
      const currentRoute = navigation.getState()?.routes?.slice(-1)[0]?.name;
      if (currentRoute === "HomeMap") {
        // Don't auto-navigate from home — let user tap the card
        // But DO add refetchInterval to useMyOrders:
      }
    }
  }, [topActive?.status]);

  useEffect(() => {
    if (deviceCoords && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: deviceCoords.latitude,
          longitude: deviceCoords.longitude,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        },
        800,
      );
    }
  }, [deviceCoords]);

  useEffect(() => {
    const inProgress =
      topActive &&
      ["assigned", "rider_arriving", "collected", "in_transit"].includes(
        topActive.status,
      );
    if (!inProgress || !topActive?.rider_id) return;

    const fetchRiderLocation = async () => {
      try {
        // Replace with your actual rider location endpoint
        const res = await fetch(`/api/riders/${topActive.rider_id}/location`);
        const json = await res.json();
        if (json?.latitude && json?.longitude) {
          setRiderLocation({
            latitude: json.latitude,
            longitude: json.longitude,
          });
        }
      } catch {}
    };

    fetchRiderLocation();
    const interval = setInterval(fetchRiderLocation, 8000);
    return () => clearInterval(interval);
  }, [topActive?.id, topActive?.status, topActive?.rider_id]);

  useEffect(() => {
    if (riderLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...riderLocation,
          latitudeDelta: 0.018,
          longitudeDelta: 0.018,
        },
        600,
      );
    }
  }, [riderLocation]);

  useOrderSocket({
    orderId: topActive?.id ?? "",
    onStatusChanged: () => {
      // Refresh order list whenever status changes so the card updates
      qc.invalidateQueries({ queryKey: QK.orders() });
    },
  });

  // ── Bottom sheet ────────────────────────────────────────────────────────
  const sheetY = useRef(new Animated.Value(SNAP_COLLAPSED)).current;
  const lastY = useRef(SNAP_COLLAPSED);

  const snapTo = useCallback(
    (toValue: number) => {
      lastY.current = toValue;
      Animated.spring(sheetY, {
        toValue,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
        mass: 0.8,
      }).start(({ finished }) => {
        if (finished && toValue === SNAP_FULL) {
          sheetY.setValue(SNAP_COLLAPSED);
          lastY.current = SNAP_COLLAPSED;
          navigation.navigate("DeliveryFlow");
        }
      });
    },
    [sheetY, navigation],
  );

  const panResponder = useRef(
    PanResponder.create({
      // Only claim the responder when vertical movement is intentional
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        const isVertical = Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 4;
        if (isVertical) isDragging.current = true;
        return isVertical;
      },
      onStartShouldSetPanResponder: () => false, // never steal taps

      onPanResponderGrant: () => {
        isDragging.current = false;
        sheetY.stopAnimation((val) => {
          lastY.current = val;
          sheetY.setValue(val);
        });
      },

      onPanResponderMove: (_, { dy }) => {
        const next = Math.min(
          Math.max(lastY.current + dy, SNAP_FULL),
          SNAP_COLLAPSED,
        );
        sheetY.setValue(next);
      },

      onPanResponderRelease: (_, { dy, vy }) => {
        isDragging.current = false;
        const current = lastY.current + dy;

        if (vy < -0.5) {
          snapTo(current < SNAP_EXPANDED ? SNAP_FULL : SNAP_EXPANDED);
        } else if (vy > 0.5) {
          snapTo(current > SNAP_EXPANDED ? SNAP_COLLAPSED : SNAP_EXPANDED);
        } else {
          const snaps = [SNAP_COLLAPSED, SNAP_EXPANDED, SNAP_FULL];
          const nearest = snaps.reduce((a, b) =>
            Math.abs(current - a) < Math.abs(current - b) ? a : b,
          );
          snapTo(nearest);
        }
      },

      onPanResponderTerminate: () => {
        isDragging.current = false;
        snapTo(lastY.current); // snap to wherever it was left
      },
    }),
  ).current;

  const handleActivePress = () => {
    if (!topActive) return;

    const sharedParams = {
      orderId: topActive.id,
      pickup: topActive.pickup_address,
      dropoff: topActive.dropoff_address,
      pickupCoords: {
        latitude: parseFloat(String(topActive.pickup_lat)),
        longitude: parseFloat(String(topActive.pickup_lng)),
      },
      dropoffCoords: {
        latitude: parseFloat(String(topActive.dropoff_lat)),
        longitude: parseFloat(String(topActive.dropoff_lng)),
      },
      vehicleType:
        topActive.vehicle_type === "motorcycle" ? "e-motorcycle" : "bicycle",
      price: parseFloat(String(topActive.price_ghs ?? 0)),
      itemType: topActive.item_description ?? "Parcel",
      paymentMethod: topActive.payment_method ?? "bundle",
    };

    if (topActive.status === "searching" || topActive.status === "pending") {
      navigation.navigate("DeliveryFlow", {
        screen: "RiderMatching",
        params: sharedParams,
      });
      return;
    }

    if (topActive.status === "assigned") {
      navigation.navigate("DeliveryFlow", {
        screen: "RiderFound",
        params: {
          ...sharedParams,
          riderName: topActive.rider?.full_name ?? "Your Rider",
          riderPlate: topActive.rider?.vehicle?.plate_no ?? "",
          riderRating: parseFloat(String(topActive.rider?.rating ?? 5)),
        },
      });
      return;
    }

    if (topActive.status === "rider_arriving") {
      navigation.navigate("DeliveryFlow", {
        screen: "RiderArriving",
        params: {
          ...sharedParams,
          riderName: topActive.rider?.full_name ?? "Your Rider",
          riderPlate: topActive.rider?.vehicle?.plate_no ?? "",
          riderRating: parseFloat(String(topActive.rider?.rating ?? 5)),
        },
      });
      return;
    }

    if (topActive.status === "collected" || topActive.status === "in_transit") {
      navigation.navigate("DeliveryFlow", {
        screen: "ActiveDelivery",
        params: {
          ...sharedParams,
          riderName: topActive.rider?.full_name ?? "Your Rider",
          riderPlate: topActive.rider?.vehicle?.plate_no ?? "",
          riderRating: parseFloat(String(topActive.rider?.rating ?? 5)),
          etaMinutes: 15,
        },
      });
      return;
    }

    navigation.navigate("Activities", { initialTab: "active" });
  };

  //   const handleActivePress = () => {
  //   if (!topActive) return;
  //   navigation.navigate("Activities", { initialTab: "active" });
  // };

  const topSafe = insets.top + 12;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ── Map ── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        customMapStyle={CUSTOM_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        mapType="standard"
        zoomEnabled
        scrollEnabled
        pitchEnabled={false}
      >
        {RIDERS.map((rider) => (
          <Marker
            key={rider.id}
            coordinate={{ latitude: rider.lat, longitude: rider.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.markerBubble}>
              {rider.type === "bicycle" ? (
                <BicycleMarkerSvg width={28} height={22} />
              ) : (
                <ScooterMarkerSvg width={28} height={22} />
              )}
            </View>
          </Marker>
        ))}

        {riderLocation && topActive && (
          <Marker
            coordinate={riderLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.liveRiderBubble}>
              {topActive.vehicle_type === "bicycle" ? (
                <BicycleMarkerSvg width={26} height={20} />
              ) : (
                <ScooterMarkerSvg width={26} height={20} />
              )}
            </View>
          </Marker>
        )}

        {/* Dropoff pin for active delivery */}
        {topActive && topActive.dropoff_lat && topActive.dropoff_lng && (
          <Marker
            coordinate={{
              latitude: parseFloat(String(topActive.dropoff_lat)),
              longitude: parseFloat(String(topActive.dropoff_lng)),
            }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <View style={styles.dropoffPin}>
              <View style={styles.dropoffPinCircle} />
              <View style={styles.dropoffPinTail} />
            </View>
          </Marker>
        )}

        {/* Pin dropped by search */}
        {searchPin && (
          <Marker
            coordinate={{
              latitude: searchPin.latitude,
              longitude: searchPin.longitude,
            }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <View style={styles.searchPinOuter}>
              <View style={styles.searchPinInner} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* ── Search FAB — top right ── */}
      {!searchOpen && (
        <TouchableOpacity
          style={[styles.searchFab, { top: topSafe }]}
          onPress={openSearch}
          activeOpacity={0.85}
        >
          <Image
            source={require("../../assets/icons/search.png")}
            style={styles.searchFabIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}

      {/* ── Search overlay ── */}
      {searchOpen && (
        <>
          {/* Soft backdrop */}
          <Animated.View
            style={[styles.searchBackdrop, { opacity: searchFadeBackdrop }]}
            pointerEvents="none"
          />

          {/* Sliding card */}
          <Animated.View
            style={[
              styles.searchPanel,
              { top: topSafe, transform: [{ translateX: searchSlideX }] },
            ]}
          >
            {/* Close */}
            <TouchableOpacity
              style={styles.searchCloseBtn}
              onPress={closeSearch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.75}
            >
              <CloseXSvg width={15} height={15} />
            </TouchableOpacity>

            {/* ── Pickup / Dropoff toggle ── */}
            <View style={styles.targetToggle}>
              <TouchableOpacity
                style={[
                  styles.targetPill,
                  searchTarget === "dropoff" && styles.targetPillActive,
                ]}
                onPress={() => setSearchTarget("dropoff")}
                activeOpacity={0.8}
              >
                <PinLocationSvg
                  width={11}
                  height={11}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.targetPillText,
                    searchTarget === "dropoff" && styles.targetPillTextActive,
                  ]}
                >
                  Drop-off
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.targetPill,
                  searchTarget === "pickup" && styles.targetPillActive,
                ]}
                onPress={() => setSearchTarget("pickup")}
                activeOpacity={0.8}
              >
                <PinOutlineSvg
                  width={11}
                  height={11}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.targetPillText,
                    searchTarget === "pickup" && styles.targetPillTextActive,
                  ]}
                >
                  Pick-up
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Places autocomplete ── */}
            <View style={styles.searchInputWrap}>
              <GooglePlacesAutocomplete
                ref={gpaRef}
                placeholder={
                  searchTarget === "dropoff"
                    ? "Search drop-off location"
                    : "Search pick-up location"
                }
                fetchDetails
                onPress={handleSearchSelect}
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
                  container: gpaStyles.container,
                  textInputContainer: gpaStyles.textInputContainer,
                  textInput: gpaStyles.textInput,
                  listView: gpaStyles.listView,
                  row: gpaStyles.row,
                  separator: gpaStyles.separator,
                  poweredContainer: { display: "none" },
                  powered: { display: "none" },
                }}
                textInputProps={{
                  placeholderTextColor: "#AAAAAA",
                  selectionColor: "#0B1F3A",
                }}
                renderRow={(data: any) => (
                  <View style={gpaStyles.resultRow}>
                    <View
                      style={[
                        gpaStyles.resultDot,
                        searchTarget === "dropoff"
                          ? gpaStyles.resultDotDropoff
                          : gpaStyles.resultDotPickup,
                      ]}
                    />
                    <View style={gpaStyles.resultText}>
                      <Text style={gpaStyles.resultMain} numberOfLines={1}>
                        {data.structured_formatting?.main_text ??
                          data.description}
                      </Text>
                      {data.structured_formatting?.secondary_text ? (
                        <Text style={gpaStyles.resultSub} numberOfLines={1}>
                          {data.structured_formatting.secondary_text}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                )}
                minLength={2}
                debounce={300}
                keyboardShouldPersistTaps="handled"
                keepResultsAfterBlur={false}
              />
            </View>

            {/* ── Confirm pill — appears once result is picked ── */}
            {pendingResult && (
              <View style={styles.confirmWrap}>
                <View style={styles.pendingRow}>
                  <View
                    style={[
                      styles.pendingDot,
                      searchTarget === "dropoff"
                        ? styles.pendingDotDropoff
                        : styles.pendingDotPickup,
                    ]}
                  />
                  <Text style={styles.pendingName} numberOfLines={1}>
                    {pendingResult.name}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleConfirmPin}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmBtnText}>
                    Set as {searchTarget === "dropoff" ? "drop-off" : "pick-up"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </>
      )}

      {/* ── Bottom Sheet ── */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        {/* Send Package row */}
        <TouchableOpacity
          style={styles.sendPackageRow}
          onPress={() => navigation.navigate("DeliveryFlow")}
          activeOpacity={0.82}
        >
          <View style={styles.sendLeft}>
            <View style={styles.packageIconWrap}>
              <ParcelSvg width={40} height={40} />
            </View>
            <Text style={styles.sendLabel}>Send Package</Text>
          </View>
          <TouchableOpacity
            style={styles.calendarBtn}
            onPress={() =>
              navigation.navigate("DeliveryFlow", { screen: "SchedulePickup" })
            }
            activeOpacity={0.7}
          >
            <Calendersvg width={25} height={25} />
          </TouchableOpacity>
        </TouchableOpacity>

        <View
          style={[styles.sheetContent, { paddingBottom: insets.bottom + 12 }]}
        >
          {topActive ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active delivery</Text>
                {activeOrders.length > 1 && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Activities")}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.seeAllText}>
                      See all ({activeOrders.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <ActiveDeliveryCard
                order={topActive}
                onPress={handleActivePress}
              />
              <View style={styles.sectionDivider} />
            </>
          ) : (
            <EmptyState />
          )}
        </View>
      </Animated.View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },

  markerBubble: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  searchPinOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(11,31,61,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchPinInner: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#0B1F3A",
  },

  // ── FAB ──────────────────────────────────────────────────────────────────
  searchFab: {
    position: "absolute",
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 23,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
  },
  searchFabIcon: {
    width: 17,
    height: 17,
  },

  // ── Search panel ──────────────────────────────────────────────────────────
  searchBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11,31,61,0.2)",
    zIndex: 18,
  },
  searchPanel: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    zIndex: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 14,
  },
  searchCloseBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  // ── Toggle ────────────────────────────────────────────────────────────────
  targetToggle: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    marginRight: 44,
  },
  targetPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F2F2F2",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  targetPillActive: {
    backgroundColor: "#EBF0FF",
    borderColor: "#0B1F3A",
  },
  targetPillText: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    color: "#888888",
  },
  targetPillTextActive: {
    color: "#0B1F3A",
    fontFamily: "Poppins-SemiBold",
  },

  // ── Input container ───────────────────────────────────────────────────────
  searchInputWrap: {
    backgroundColor: "#F2F2F2",
    borderRadius: 14,
    overflow: "visible",
    minHeight: 50,
  },

  // ── Confirm section ───────────────────────────────────────────────────────
  confirmWrap: {
    marginTop: 14,
    gap: 10,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 2,
  },
  pendingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  pendingDotDropoff: { backgroundColor: "#4CD964" },
  pendingDotPickup: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#0B1F3A",
  },
  pendingName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: "#0B1F3A",
    flex: 1,
  },
  confirmBtn: {
    backgroundColor: "#0B1F3A",
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.white,
  },

  // ── Bottom sheet ──────────────────────────────────────────────────────────
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    height: height,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Shadow.medium,
  },
  handleArea: { alignItems: "center", paddingVertical: 10 },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: "#D5D5D5" },
  sheetContent: { paddingHorizontal: 20, paddingTop: 4 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Colors.textSecondary ?? "#5A6478",
  },
  seeAllText: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.navy ?? "#0B1F3A",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 14,
  },

  sendPackageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#eeeeee",
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 22,
  },
  sendLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  packageIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sendLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: Colors.textPrimary,
  },
  calendarBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  liveRiderBubble: {
    backgroundColor: Colors.primary, // green = it's YOUR rider
    borderRadius: 10,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
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
});

// ── GPA styles for the search panel ────────────────────────────────────────
const gpaStyles = StyleSheet.create({
  container: { flex: 0 },
  textInputContainer: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 0,
  },
  textInput: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#0B1F3A",
    backgroundColor: "transparent",
    margin: 0,
    paddingHorizontal: 14,
    paddingVertical: 0,
    height: 50,
    borderWidth: 0,
    elevation: 0,
    shadowColor: "transparent",
  },
  listView: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E8EEF4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 10,
    overflow: "hidden",
  },
  row: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F4F8",
    marginHorizontal: 14,
  },

  // Custom row
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },
  resultDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  resultDotDropoff: { backgroundColor: "#4CD964" },
  resultDotPickup: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#0B1F3A",
  },
  resultText: { flex: 1 },
  resultMain: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: "#0B1F3A",
    marginBottom: 2,
  },
  resultSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: "#9CA3AF",
  },
});

const activeStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E8EEF4",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  accentBar: {
    // width: 4,
    // borderTopLeftRadius: 16,
    // borderBottomLeftRadius: 16,
  },
  cardBody: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: "Poppins-SemiBold", fontSize: 11 },
  price: {
    fontFamily: "Poppins-Bold",
    fontSize: 13,
    color: Colors.textPrimary,
  },
  routeRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  routeIconCol: {
    width: 16,
    alignItems: "center",
    paddingTop: 2,
    gap: 2,
  },
  dotGreen: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#4CD964",
  },
  routeLine: {
    width: 1.5,
    height: 14,
    backgroundColor: "#D0D6E0",
  },
  routeAddresses: { flex: 1, gap: 8 },
  routeAddr: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 16,
  },
  chevronWrap: {
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  chevron: {
    fontSize: 22,
    color: "#C0C8D4",
    marginTop: -2,
  },
});

const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  boxBody: {
    alignItems: "center",
    justifyContent: "center",
  },
  boxLid: {
    width: 28,
    height: 8,
    backgroundColor: "#C8D0DC",
    borderRadius: 3,
    marginBottom: 1,
  },
  boxRibbon: {
    width: 28,
    height: 20,
    backgroundColor: "#D8E2ED",
    borderRadius: 3,
  },
  title: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted ?? "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 4,
  },
  liveRiderBubble: {
    backgroundColor: Colors.primary, // green = it's YOUR rider
    borderRadius: 10,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
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
});


