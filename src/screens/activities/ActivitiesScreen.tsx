import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Image,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import FilterIconSvg from "../../assets/icons/filter_icon.svg";
import RepeatIconSvg from "../../assets/icons/repeat_icon.svg";
import PinLocationSvg from "../../assets/icons/pin_location.svg";
import BundleCreditsSvg from "../../assets/icons/bundle_credits.svg";
import FilterBottomSheet, { FilterState } from "./FilterBottomSheet";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
  border: "#EFEFEF",
  inputBg: "#F2F4F7",
  bundleIcon: "#3B9EFF",
  bundleIconBg: "#E8F4FF",
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const PAST_ACTIVITIES = [
  {
    id: "1",
    month: "May 2026",
    destination: "University of Ghana",
    date: "20 May . 12:34",
    amount: "GHS 24",
    vehicle: "bicycle",
  },
  {
    id: "2",
    month: "May 2026",
    destination: "Madina Old Station",
    date: "20 May . 12:34",
    amount: "GHS 33",
    vehicle: "emoto",
  },
  {
    id: "3",
    month: "May 2026",
    destination: "East Legon Americana",
    date: "20 May . 12:34",
    amount: "GHS 33",
    vehicle: "emoto",
  },
  {
    id: "4",
    month: "Feb 2026",
    destination: "University of Ghana",
    date: "20 May . 12:34",
    amount: "GHS 24",
    vehicle: "bicycle",
  },
  {
    id: "5",
    month: "Feb 2026",
    destination: "Madina Old Station",
    date: "20 May . 12:34",
    amount: "GHS 33",
    vehicle: "bicycle",
  },
  {
    id: "6",
    month: "Feb 2026",
    destination: "East Legon Americana",
    date: "20 May . 12:34",
    amount: "GHS 33",
    vehicle: "bicycle",
  },
  {
    id: "7",
    month: "Dec 2025",
    destination: "",
    date: "",
    amount: "",
    vehicle: "bicycle",
  },
];

const UPCOMING_ACTIVITIES = [
  {
    id: "u1",
    month: "May 2026",
    senderName: "John Agyekum Barimah",
    pickup: "American House",
    itemType: "Parcel",
    dropoff: "University of Ghana",
    scheduledTime: "01:00 - 01:30",
    scheduledDate: "Saturday, 24 May",
    paymentMethod: "Bundle Credits",
    price: 24,
  },
];

export default function ActivitiesScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<"past" | "upcoming">("past");
  const fadeIn = useRef(new Animated.Value(0)).current;

  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    months: [],
    vehicles: [],
  });

  // Replace the grouped computation with a filtered version
  const availableMonths = [...new Set(PAST_ACTIVITIES.map((a) => a.month))];

  const filteredActivities = PAST_ACTIVITIES.filter((item) => {
    const monthMatch =
      filters.months.length === 0 || filters.months.includes(item.month);
    const vehicleMatch =
      filters.vehicles.length === 0 || filters.vehicles.includes(item.vehicle);
    return monthMatch && vehicleMatch;
  });

  // Group past activities by month
  const grouped = filteredActivities.reduce<
    Record<string, typeof PAST_ACTIVITIES>
  >((acc, item) => {
    if (!acc[item.month]) acc[item.month] = [];
    acc[item.month].push(item);
    return acc;
  }, {});

  const hasActiveFilters =
    filters.months.length > 0 || filters.vehicles.length > 0;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activities</Text>
      </View>

      {/* Tab Row */}
      <View style={styles.tabRow}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab("past")}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === "past" && styles.tabLabelActive,
              ]}
            >
              Past
            </Text>
            {activeTab === "past" && <View style={styles.tabUnderline} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab("upcoming")}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === "upcoming" && styles.tabLabelActive,
              ]}
            >
              Upcoming
            </Text>
            {activeTab === "upcoming" && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        </View>

        {/* Filter button */}
        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={() => setFilterVisible(true)}
          activeOpacity={0.7}
        >
          <FilterIconSvg width={20} height={20} />
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "past"
          ? // ── Past: grouped list ──────────────────────────────────────────────
            Object.entries(grouped).map(([month, items]) => (
              <View key={month}>
                {/* Month header with line */}
                <View style={styles.monthRow}>
                  <Text style={styles.monthHeader}>{month}</Text>
                  <View style={styles.monthLine} />
                </View>

                {items.map((item, index) =>
                  item.destination ? (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.pastRow,
                        index < items.length - 1 && styles.pastRowBorder,
                      ]}
                      onPress={() =>
                        navigation.navigate("ActivityDetail", {
                          activity: item,
                        })
                      }
                      activeOpacity={0.7}
                    >
                      {/* Vehicle icon */}
                      <View style={styles.vehicleIconWrap}>
                        {/*
                        Replace with:
                        <Image
                          source={item.vehicle === 'bicycle'
                            ? require('../../assets/images/bicycle_small.png')
                            : require('../../assets/images/emoto_small.png')}
                          style={styles.vehicleIcon}
                          resizeMode="contain"
                        />
                      */}
                        <Image
                          source={
                            item.vehicle === "bicycle"
                              ? require("../../assets/images/bicycle_small.png")
                              : require("../../assets/images/emoto_small.png")
                          }
                          style={styles.vehicleIcon}
                          resizeMode="contain"
                        />
                      </View>

                      {/* Info */}
                      <View style={styles.pastInfo}>
                        <Text style={styles.pastDestination}>
                          {item.destination}
                        </Text>
                        <Text style={styles.pastDate}>{item.date}</Text>
                        <Text style={styles.pastAmount}>{item.amount}</Text>
                      </View>

                      {/* Repeat icon */}
                      <TouchableOpacity
                        style={styles.repeatBtn}
                        activeOpacity={0.7}
                      >
                        <RepeatIconSvg width={20} height={20} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ) : null,
                )}
              </View>
            ))
          : // ── Upcoming: full delivery detail card ─────────────────────────────
            UPCOMING_ACTIVITIES.map((item) => (
              <View key={item.id}>
                {/* Month header */}
                <View style={styles.monthRow}>
                  <Text style={styles.monthHeader}>{item.month}</Text>
                  <View style={styles.monthLine} />
                </View>

                {/* Route section */}
                <SectionLabel label="Route" />

                <View style={styles.routeRow}>
                  <View style={styles.routeIconWrap}>
                    {/*
                    Replace with:
                  */}
                    {/* <Image
                    source={{ uri: 'https://via.placeholder.com/40x40/F2F4F7/1A1A2E.png?text=📦' }}
                    style={styles.routeIconImg}
                  /> */}
                    <Image
                      source={require("../../assets/images/parcel_box.png")}
                      style={styles.routeIconImg}
                    />
                  </View>
                  <View style={styles.routeTextWrap}>
                    <Text style={styles.routePrimary}>{item.senderName}</Text>
                    <Text style={styles.routeSecondary}>{item.pickup}</Text>
                    <Text style={styles.routeSecondary}>{item.itemType}</Text>
                  </View>
                </View>

                {/* Dashed line */}
                <View style={styles.dashedWrap}>
                  <DashedLine />
                </View>

                <View style={styles.routeRow}>
                  <View style={styles.routeIconWrap}>
                    <PinLocationSvg width={20} height={24} />
                  </View>
                  <View style={styles.routeTextWrap}>
                    <Text style={styles.routePrimary}>Recipient</Text>
                    <Text style={styles.routeSecondary}>{item.dropoff}</Text>
                  </View>
                </View>

                {/* Pick-up time */}
                <View style={styles.sectionGap} />
                <SectionLabel label="Pick - up time" />

                <View style={styles.pickupRow}>
                  {/*
                  Replace with:
                  <Image source={require('../../assets/images/bicycle_small.png')} style={styles.pickupVehicleImg} />
                */}
                  <Image
                    source={{
                      uri: "https://via.placeholder.com/52x38/F2F4F7/888.png?text=🚲",
                    }}
                    style={styles.pickupVehicleImg}
                    resizeMode="contain"
                  />
                  <View>
                    <Text style={styles.pickupLabel}>Scheduled pick - up</Text>
                    <Text style={styles.pickupTime}>{item.scheduledTime}</Text>
                    <Text style={styles.pickupDate}>{item.scheduledDate}</Text>
                  </View>
                </View>

                {/* Payment mode */}
                <View style={styles.sectionGap} />
                <SectionLabel label="Payment mode" />

                <View style={styles.paymentCard}>
                  <View style={styles.paymentIconWrap}>
                    <BundleCreditsSvg width={50} height={48} />
                  </View>
                  <Text style={styles.paymentLabel}>{item.paymentMethod}</Text>
                  <Text style={styles.paymentPrice}>GHS {item.price}.00</Text>
                </View>
              </View>
            ))}

        <View style={{ height: 32 }} />
      </Animated.ScrollView>

      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={setFilters}
        current={filters}
        availableMonths={availableMonths}
      />
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.text}>{label}</Text>
      <View style={sectionStyles.line} />
    </View>
  );
}

function DashedLine() {
  return (
    <View style={{ height: 52, justifyContent: "center", paddingLeft: 19 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 1.5,
            height: 5,
            backgroundColor: "#C8D0DC",
            marginVertical: 2,
          }}
        />
      ))}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  text: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 15,
    color: Colors.navy,
    flexShrink: 0,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  header: {
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 12,
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  title: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 20,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabs: {
    flex: 1,
    flexDirection: "row",
  },
  tab: {
    paddingVertical: 12,
    paddingRight: 28,
    position: "relative",
  },
  tabLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: Colors.textMuted,
  },
  tabLabelActive: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 16,
    color: Colors.navy,
    letterSpacing: 0.1,
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 28,
    height: 2.5,
    backgroundColor: Colors.navy,
    borderRadius: 2,
  },
  filterBtn: {
    padding: 8,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Month group
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    marginTop: 6,
  },
  monthHeader: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 16,
    color: Colors.textPrimary,
    flexShrink: 0,
  },
  monthLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },

  // Past list row
  pastRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  pastRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  vehicleIconWrap: {
    width: 48,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleIcon: {
    width: 48,
    height: 38,
  },
  pastInfo: {
    flex: 1,
  },
  pastDestination: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  pastDate: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  pastAmount: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 14,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  repeatBtn: {
    padding: 6,
  },

  // Upcoming detail
  routeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  routeIconWrap: {
    width: 40,
    alignItems: "center",
    paddingTop: 2,
  },
  routeIconImg: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    borderRadius: 8,
  },
  routeTextWrap: { flex: 1 },
  routePrimary: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  routeSecondary: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
  },
  dashedWrap: {
    paddingLeft: 20,
    marginVertical: -4,
  },
  sectionGap: { height: 22 },

  pickupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  pickupVehicleImg: {
    width: 52,
    height: 38,
  },
  pickupLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  pickupTime: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  pickupDate: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Colors.textPrimary,
    marginTop: 1,
  },

  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: Colors.bundleIconBg,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  paymentIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    // backgroundColor: Colors.bundleIcon,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentLabel: {
    flex: 1,
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  paymentPrice: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },

  filterBtnActive: {
    backgroundColor: Colors.navy,
    borderRadius: 8,
  },
  filterBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
