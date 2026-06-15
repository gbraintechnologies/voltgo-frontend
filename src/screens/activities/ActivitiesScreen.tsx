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
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import FilterIconSvg from "../../assets/icons/filter_icon.svg";
import FilterIconWhiteSvg from "../../assets/icons/filter_icon_white.svg";
import RepeatIconSvg from "../../assets/icons/repeat_icon.svg";
import PinLocationSvg from "../../assets/icons/pin_location.svg";
import BundleCreditsSvg from "../../assets/icons/bundle_credits.svg";
import FilterBottomSheet, { FilterState } from "./FilterBottomSheet";
import { useMyOrders, useCancelOrder } from "../../hooks/useApi";
import { Order } from "../../api/orders";
import { useToast } from "@/components/common/Toast";
import * as Haptics from "expo-haptics";
import CancelReasonModal from "./CancelReasonModal";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
  border: "#EFEFEF",
  inputBg: "#F2F4F7",
  cancelRed: "#EF4444",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })} · ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatScheduledTime(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleString("en", { weekday: "long" });
  const date = d.getDate();
  const month = d.toLocaleString("en", { month: "long" });
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const endH = (d.getHours() + 1).toString().padStart(2, "0");
  return {
    time: `${hh}:${mm} - ${endH}:${mm}`,
    date: `${day}, ${date} ${month}`,
  };
}

function groupByMonth(orders: Order[]) {
  const map: Record<string, Order[]> = {};
  orders.forEach((o) => {
    const d = new Date(o.created_at);
    const key = `${d.toLocaleString("en", { month: "long" })} ${d.getFullYear()}`;
    if (!map[key]) map[key] = [];
    map[key].push(o);
  });
  return map;
}

// Status label map for the live badge on Active cards
const STATUS_STYLE: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Finding rider", color: "#1D4ED8", bg: "#DBEAFE" },
  searching: { label: "Finding rider", color: "#1D4ED8", bg: "#DBEAFE" },
  assigned: { label: "Rider assigned", color: "#065F46", bg: "#D1FAE5" },
  rider_arriving: { label: "Rider arriving", color: "#065F46", bg: "#D1FAE5" },
  collected: { label: "Collected", color: "#1D4ED8", bg: "#DBEAFE" },
  in_transit: { label: "In transit", color: "#1D4ED8", bg: "#DBEAFE" },
};

// ── Section label exactly like ReviewDelivery ──────────────────────────────
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
    <View
      style={{ height: 44, justifyContent: "center", alignItems: "center" }}
    >
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

// ── Pulsing live dot ─────────────────────────────────────────────────────
function LivePulseDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View
      style={{
        width: 8,
        height: 8,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          opacity: 0.35,
          transform: [{ scale: pulse }],
        }}
      />
      <View
        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }}
      />
    </View>
  );
}

// ── Shared delivery card — used for both Upcoming and Active ──────────────
function DeliveryCard({
  item,
  variant,
  onCancel,
  onTrack,
  cancelling,
}: {
  item: Order;
  variant: "upcoming" | "active";
  onCancel?: () => void;
  onTrack?: () => void;
  cancelling?: boolean;
}) {
  const scheduled = item.scheduled_at
    ? formatScheduledTime(item.scheduled_at)
    : null;
  const status = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;

  // Glow animation for the whole card border when active
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (variant !== "active") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [variant]);

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E8EEF4", status.color],
  });

  const CardWrapper = variant === "active" ? Animated.View : View;

  return (
    <CardWrapper
      style={[
        upcomingStyles.card,
        variant === "active" && {
          borderWidth: 1.5,
          borderColor: borderColor as any,
          borderRadius: 16,
          paddingHorizontal: 12,
        },
      ]}
    >
      {/* Live status badge for active deliveries */}
      {variant === "active" && (
        <View style={upcomingStyles.liveBadgeRow}>
          <View
            style={[upcomingStyles.liveBadge, { backgroundColor: status.bg }]}
          >
            <LivePulseDot color={status.color} />
            <Text
              style={[upcomingStyles.liveBadgeText, { color: status.color }]}
            >
              {status.label}
            </Text>
          </View>
        </View>
      )}

      {/* Route */}
      <SectionLabel label="Route" />

      <View style={{ flexDirection: "row", gap: 14 }}>
        {/* Left icon column: box → dashed line → pin */}
        <View style={{ width: 40, alignItems: "center" }}>
          <Image
            source={require("../../assets/images/parcel_box.png")}
            style={upcomingStyles.routeIconImg}
            resizeMode="contain"
          />
          <DashedLine />
          <PinLocationSvg width={20} height={24} />
        </View>

        {/* Right text column */}
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          {/* Pickup — aligned with box icon */}
          <View style={{ paddingTop: 2, height: 40 }}>
            <Text style={upcomingStyles.routePrimary}>
              {item.item_description ?? "Package"}
            </Text>
            <Text style={upcomingStyles.routeSecondary} numberOfLines={1}>
              {item.pickup_address}
            </Text>
          </View>

          {/* Spacer matches DashedLine height */}
          <View style={{ height: 44 }} />

          {/* Dropoff — aligned with pin icon */}
          <View style={{ paddingBottom: 2 }}>
            <Text style={upcomingStyles.routePrimary}>Recipient</Text>
            <Text style={upcomingStyles.routeSecondary} numberOfLines={1}>
              {item.dropoff_address}
            </Text>
          </View>
        </View>
      </View>

      {/* Pick-up time — only for scheduled (upcoming) deliveries */}
      {variant === "upcoming" && scheduled && (
        <>
          <View style={{ height: 20 }} />
          <SectionLabel label="Pick - up time" />
          <View style={upcomingStyles.pickupRow}>
            <Image
              source={require("../../assets/images/bicycle_vehicle.png")}
              style={upcomingStyles.vehicleImg}
              resizeMode="contain"
            />
            <View>
              <Text style={upcomingStyles.pickupLabel}>
                Scheduled pick - up
              </Text>
              <Text style={upcomingStyles.pickupTime}>{scheduled.time}</Text>
              <Text style={upcomingStyles.pickupDate}>{scheduled.date}</Text>
            </View>
          </View>
        </>
      )}

      {/* Payment mode */}
      <View style={{ height: 20 }} />
      <SectionLabel label="Payment mode" />
      <View style={upcomingStyles.paymentRow}>
        <View style={upcomingStyles.paymentIconWrap}>
          <BundleCreditsSvg width={50} height={46} />
        </View>
        <Text style={upcomingStyles.paymentLabel}>
          {item.payment_method === "bundle_credit"
            ? "Bundle Credits"
            : (item.payment_method ?? "—")}
        </Text>
        <Text style={upcomingStyles.paymentPrice}>
          GHS {Number(item.price_ghs ?? 0).toFixed(2)}
        </Text>
      </View>

      {/* Action button */}
      {variant === "upcoming" && onCancel && (
        <TouchableOpacity
          style={[upcomingStyles.cancelBtn, cancelling && { opacity: 0.5 }]}
          onPress={onCancel}
          disabled={cancelling}
          activeOpacity={0.75}
        >
          {cancelling ? (
            <ActivityIndicator size="small" color={Colors.cancelRed} />
          ) : (
            <Text style={upcomingStyles.cancelBtnText}>Cancel delivery</Text>
          )}
        </TouchableOpacity>
      )}

      {variant === "active" && onTrack && (
        <TouchableOpacity
          style={upcomingStyles.trackBtn}
          onPress={onTrack}
          activeOpacity={0.85}
        >
          <Text style={upcomingStyles.trackBtnText}>Track delivery</Text>
        </TouchableOpacity>
      )}
    </CardWrapper>
  );
}

const PAST_STATUSES = ["delivered", "cancelled", "failed"];
const ACTIVE_STATUSES = [
  "searching",
  "assigned",
  "rider_arriving",
  "collected",
  "in_transit",
];

export default function ActivitiesScreen() {
  const toast = useToast();
  const route = useRoute<any>();
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const navigation = useNavigation<any>();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    months: [],
    vehicles: [],
  });

  const { data: allOrdersRes, isLoading } = useMyOrders({ limit: 100 });
  const cancelMutation = useCancelOrder();

  const allOrders: Order[] =
    (allOrdersRes?.data as any)?.items ?? allOrdersRes?.data?.orders ?? [];

  const pastOrders = allOrders.filter((o) => PAST_STATUSES.includes(o.status));

  // Upcoming = scheduled deliveries not yet started
  const upcomingOrders = allOrders.filter(
    (o) => o.status === "pending" && !!o.scheduled_at,
  );

  // Active = deliveries currently in progress (or pending without a schedule)
  const activeOrders = allOrders.filter(
    (o) =>
      ACTIVE_STATUSES.includes(o.status) ||
      (o.status === "pending" && !o.scheduled_at),
  );

  const hasActive = activeOrders.length > 0;

  type Tab = "past" | "upcoming" | "active";
  const [activeTab, setActiveTab] = useState<Tab>(
    route.params?.initialTab ?? "past",
  );

  // If we land on "active" but there's nothing active (e.g. it just finished),
  // fall back to Past.
  useEffect(() => {
    if (activeTab === "active" && !hasActive) {
      setActiveTab("past");
    }
  }, [activeTab, hasActive]);

  useEffect(() => {
    if (activeOrders.length > 0 && !route.params?.initialTab) {
      setActiveTab("active");
    }
  }, [activeOrders.length]);

  const filteredPast = pastOrders.filter((o) => {
    const d = new Date(o.created_at);
    const month = `${d.toLocaleString("en", { month: "long" })} ${d.getFullYear()}`;
    const monthMatch =
      filters.months.length === 0 || filters.months.includes(month);
    const vehicleMatch =
      filters.vehicles.length === 0 ||
      filters.vehicles.includes(o.vehicle_type);
    return monthMatch && vehicleMatch;
  });

  const grouped = groupByMonth(filteredPast);
  const availableMonths = [
    ...new Set(
      pastOrders.map((o) => {
        const d = new Date(o.created_at);
        return `${d.toLocaleString("en", { month: "long" })} ${d.getFullYear()}`;
      }),
    ),
  ];

  const hasActiveFilters =
    filters.months.length > 0 || filters.vehicles.length > 0;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleCancelOrder = (order: Order) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCancelTarget(order);
  };

  const confirmCancel = async (reason: string) => {
    if (!cancelTarget) return;
    try {
      await cancelMutation.mutateAsync({
        id: cancelTarget.id,
        reason,
      });
      setCancelTarget(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success("Order cancelled");
    } catch {
      setCancelTarget(null);
      toast.error("Could not cancel this order. Please try again.");
    }
  };

  const handleTrack = (order: Order) => {
    if (order.status === "rider_arriving") {
      navigation.navigate("DeliveryFlow", { screen: "RiderArriving" });
    } else if (["collected", "in_transit"].includes(order.status)) {
      navigation.navigate("DeliveryFlow", { screen: "ActiveDelivery" });
    } else {
      // searching / pending — go back to map where the search/match UI lives
      navigation.navigate("HomeMap");
    }
  };

  const tabs: { key: Tab; label: string }[] = [];
  if (hasActive) {
    tabs.push({ key: "active", label: "Active" });
  }
  tabs.push(
    {
      key: "upcoming",
      label: `Upcoming${upcomingOrders.length > 0 ? ` (${upcomingOrders.length})` : ""}`,
    },
    { key: "past", label: "Past" },
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <Text style={styles.title}>Activities</Text>
      </View>

      <View style={styles.tabRow}>
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <View style={styles.tabLabelRow}>
                {tab.key === "active" && (
                  <View style={{ marginRight: 6 }}>
                    <LivePulseDot color={Colors.primary} />
                  </View>
                )}
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab.key && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
              {activeTab === tab.key && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>
        {activeTab === "past" && (
          <TouchableOpacity
            style={[
              styles.filterBtn,
              hasActiveFilters && styles.filterBtnActive,
            ]}
            onPress={() => setFilterVisible(true)}
            activeOpacity={0.7}
          >
            {hasActiveFilters ? (
              <FilterIconWhiteSvg width={20} height={20} />
            ) : (
              <FilterIconSvg width={20} height={20} />
            )}
          </TouchableOpacity>
        )}
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ paddingTop: 60, alignItems: "center" }}>
            <ActivityIndicator size="large" color={Colors.navy} />
          </View>
        ) : activeTab === "past" ? (
          filteredPast.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No past deliveries yet</Text>
            </View>
          ) : (
            Object.entries(grouped).map(([month, items]) => (
              <View key={month}>
                <View style={styles.monthRow}>
                  <Text style={styles.monthHeader}>{month}</Text>
                  <View style={styles.monthLine} />
                </View>
                {items.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.pastRow,
                      index < items.length - 1 && styles.pastRowBorder,
                    ]}
                    onPress={() =>
                      navigation.navigate("ActivityDetail", { activity: item })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.vehicleIconWrap}>
                      <Image
                        source={
                          item.vehicle_type === "bicycle"
                            ? require("../../assets/images/bicycle_small.png")
                            : require("../../assets/images/emoto_small.png")
                        }
                        style={styles.vehicleIcon}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.pastInfo}>
                      <Text style={styles.pastDestination}>
                        {item.dropoff_address}
                      </Text>
                      <Text style={styles.pastDate}>
                        {formatDate(item.created_at)}
                      </Text>
                      <Text style={styles.pastAmount}>
                        GHS {Number(item.price_ghs ?? 0).toFixed(2)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.repeatBtn}
                      activeOpacity={0.7}
                    >
                      <RepeatIconSvg width={20} height={20} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )
        ) : activeTab === "upcoming" ? (
          upcomingOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No upcoming deliveries</Text>
            </View>
          ) : (
            (() => {
              const groupedUpcoming = groupByMonth(upcomingOrders);
              return Object.entries(groupedUpcoming).map(([month, items]) => (
                <View key={month}>
                  <View style={styles.monthRow}>
                    <Text style={styles.monthHeader}>{month}</Text>
                    <View style={styles.monthLine} />
                  </View>
                  {items.map((item) => (
                    <DeliveryCard
                      key={item.id}
                      item={item}
                      variant="upcoming"
                      onCancel={() => handleCancelOrder(item)}
                      cancelling={
                        cancelMutation.isPending &&
                        (cancelMutation.variables as any)?.id === item.id
                      }
                    />
                  ))}
                </View>
              ));
            })()
          )
        ) : // ── ACTIVE TAB ─────────────────────────────────────────────────
        activeOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No active deliveries</Text>
          </View>
        ) : (
          activeOrders.map((item) => (
            <DeliveryCard
              key={item.id}
              item={item}
              variant="active"
              onTrack={() => handleTrack(item)}
            />
          ))
        )}
        <View style={{ height: 32 }} />
      </Animated.ScrollView>

      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={setFilters}
        current={filters}
        availableMonths={availableMonths}
      />

      <CancelReasonModal
        visible={!!cancelTarget}
        order={cancelTarget}
        loading={cancelMutation.isPending}
        onConfirm={confirmCancel}
        onClose={() => setCancelTarget(null)}
      />
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const sectionStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  text: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 15,
    color: Colors.navy,
    flexShrink: 0,
    letterSpacing: 0.1,
  },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
});

const upcomingStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  liveBadgeRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveBadgeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
  },
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
    borderRadius: 8,
  },
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
  pickupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  vehicleImg: {
    width: 60,
    height: 44,
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
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
  },
  paymentIconWrap: {
    width: 42,
    height: 42,
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
  cancelBtn: {
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#EF4444",
  },
  cancelBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#EF4444",
  },
  trackBtn: {
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: Colors.navy,
  },
  trackBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.white,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
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
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabs: { flex: 1, flexDirection: "row" },
  tab: { paddingVertical: 12, paddingRight: 28, position: "relative" },
  tabLabelRow: { flexDirection: "row", alignItems: "center" },
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
  filterBtn: { padding: 8 },
  filterBtnActive: { backgroundColor: Colors.navy, borderRadius: 8 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyText: {
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: Colors.textMuted,
  },
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
  monthLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  pastRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  pastRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  vehicleIconWrap: {
    width: 48,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleIcon: { width: 48, height: 38 },
  pastInfo: { flex: 1 },
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
  repeatBtn: { padding: 6 },
});


