import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  PanResponder,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { SvgXml } from "react-native-svg";
import { Colors, Radius, Shadow } from "../../theme";
import ParcelSvg from "../../assets/icons/package.svg";
import Calendersvg from "../../assets/icons/sendpackage-calender.svg";
import { Image } from "react-native";

const { height } = Dimensions.get("window");

const INITIAL_REGION = {
  latitude: 5.878,
  longitude: 0.0555,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

const RIDERS = [
  { id: 1, lat: 5.878, lng: 0.058, type: "bicycle" },
  { id: 2, lat: 5.882, lng: 0.051, type: "scooter" },
  { id: 3, lat: 5.875, lng: 0.062, type: "scooter" },
  { id: 4, lat: 5.87, lng: 0.055, type: "bicycle" },
  { id: 5, lat: 5.884, lng: 0.059, type: "bicycle" },
  { id: 6, lat: 5.876, lng: 0.048, type: "scooter" },
];

// ── Snap points (module-level constants, defined once) ──────────────────────
const SNAP_COLLAPSED = height * 0.73; // send package always visible (~22% of screen)
const SNAP_EXPANDED  = height * 0.52; // expanded to roughly half screen
const SNAP_FULL      = height * 0.52; // same as expanded — reaching here triggers navigation

const bicycleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3EE06A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="18.5" cy="17.5" r="3.5"/>
  <circle cx="5.5" cy="17.5" r="3.5"/>
  <circle cx="15" cy="5" r="1"/>
  <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
</svg>`;

const scooterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="7" cy="17" r="2"/>
  <circle cx="17" cy="17" r="2"/>
  <path d="M5 17H3v-4h8l2-4h3l1 4h1"/>
  <path d="M14 7h2"/>
</svg>`;

export default function HomeMapScreen() {
  const USE_STATIC_MAP = true;

  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

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
      // When fully expanded, navigate to ChooseRoute
      if (finished && toValue === SNAP_FULL) {
        // Reset sheet back to collapsed before navigating
        sheetY.setValue(SNAP_COLLAPSED);
        lastY.current = SNAP_COLLAPSED;
        navigation.navigate('DeliveryFlow');
      }
    });
  },
  [sheetY, navigation],
);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 5,

      onPanResponderGrant: () => {
        sheetY.stopAnimation((val) => {
          lastY.current = val;
          sheetY.setValue(val);
        });
      },

      onPanResponderMove: (_, { dy }) => {
        // ← updated ceiling to SNAP_FULL so it can drag all the way up
        const next = Math.min(
          Math.max(lastY.current + dy, SNAP_FULL),
          SNAP_COLLAPSED,
        );
        sheetY.setValue(next);
      },

      onPanResponderRelease: (_, { dy, vy }) => {
        const current = lastY.current + dy;

        if (vy < -0.5) {
          snapTo(current < SNAP_EXPANDED ? SNAP_FULL : SNAP_EXPANDED);
        } else if (vy > 0.5) {
          snapTo(current > SNAP_EXPANDED ? SNAP_COLLAPSED : SNAP_EXPANDED);
        } else {
          const distances = [SNAP_COLLAPSED, SNAP_EXPANDED, SNAP_FULL].map(
            (snap) => Math.abs(current - snap),
          );
          const nearest = [SNAP_COLLAPSED, SNAP_EXPANDED, SNAP_FULL][
            distances.indexOf(Math.min(...distances))
          ];
          snapTo(nearest);
        }
      },
    }),
  ).current;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {USE_STATIC_MAP ? (
        <Image
          source={require("../../assets/images/map_long.png")}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : (
        <MapView
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_DEFAULT}
          initialRegion={INITIAL_REGION}
          showsUserLocation
          showsMyLocationButton={false}
          mapType="standard"
        >
          {RIDERS.map((rider) => (
            <Marker
              key={rider.id}
              coordinate={{ latitude: rider.lat, longitude: rider.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.markerContainer}>
                <SvgXml
                  xml={rider.type === "bicycle" ? bicycleSvg : scooterSvg}
                  width={32}
                  height={32}
                />
              </View>
            </Marker>
          ))}
        </MapView>
      )}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}
      >
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        <View
          style={[styles.sheetContent, { paddingBottom: insets.bottom + 8 }]}
        >
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
                navigation.navigate("DeliveryFlow", {
                  screen: "SchedulePickup",
                })
              }
              activeOpacity={0.7}
            >
              <Calendersvg width={25} height={25} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  markerContainer: { alignItems: "center", justifyContent: "center" },
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
  sheetContent: { paddingHorizontal: 24, paddingTop: 0 },
  sendPackageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#eeeeee",
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 12,
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
});
