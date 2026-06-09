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
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import FilterIconSvg from "../../assets/icons/filter_icon.svg";
import RepeatIconSvg from "../../assets/icons/repeat_icon.svg";
import PinLocationSvg from "../../assets/icons/pin_location.svg";
import FilterIconWhiteSvg from "../../assets/icons/filter_icon_white.svg";
import FilterBottomSheet, { FilterState } from "./FilterBottomSheet";
import { useMyOrders, useCancelOrder } from "../../hooks/useApi";
import { Order } from "../../api/orders";
import { useToast } from "@/components/common/Toast";
import ConfirmModal from "@/components/common/ConfirmModal";
import * as Haptics from "expo-haptics";

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

// Status label + colour map
const STATUS_STYLE: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pending", color: "#B45309", bg: "#FEF3C7" },
  searching: { label: "Finding rider", color: "#1D4ED8", bg: "#DBEAFE" },
  assigned: { label: "Assigned", color: "#065F46", bg: "#D1FAE5" },
  rider_arriving: { label: "Rider arriving", color: "#065F46", bg: "#D1FAE5" },
  collected: { label: "Collected", color: "#1D4ED8", bg: "#DBEAFE" },
  in_transit: { label: "In transit", color: "#1D4ED8", bg: "#DBEAFE" },
  delivered: { label: "Delivered", color: "#065F46", bg: "#D1FAE5" },
  cancelled: { label: "Cancelled", color: "#991B1B", bg: "#FEE2E2" },
  failed: { label: "Failed", color: "#991B1B", bg: "#FEE2E2" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })} · ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
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

const PAST_STATUSES = ["delivered", "cancelled", "failed"];
const ACTIVE_STATUSES = [
  "pending",
  "searching",
  "assigned",
  "rider_arriving",
  "collected",
  "in_transit",
];

export default function ActivitiesScreen() {
  const toast = useToast();
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<"past" | "upcoming">("past");
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    months: [],
    vehicles: [],
  });

  const { data: allOrdersRes, isLoading: allLoading } = useMyOrders({
    limit: 100,
  });
  const cancelMutation = useCancelOrder();

  const allOrders: Order[] =
    (allOrdersRes?.data as any)?.items ?? allOrdersRes?.data?.orders ?? [];

  const pastOrders = allOrders.filter((o) => PAST_STATUSES.includes(o.status));
  const upcomingOrders = allOrders.filter((o) =>
    ACTIVE_STATUSES.includes(o.status),
  );

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
    if (!["pending", "searching"].includes(order.status)) {
      toast.warning("This order can no longer be cancelled.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCancelTarget(order);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelMutation.mutateAsync({
        id: cancelTarget.id,
        reason: "Cancelled by customer",
      });
      setCancelTarget(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success("Order cancelled");
    } catch {
      setCancelTarget(null);
      toast.error("Could not cancel this order. Please try again.");
    }
  };

  const isLoading = allLoading;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <Text style={styles.title}>Activities</Text>
      </View>

      <View style={styles.tabRow}>
        <View style={styles.tabs}>
          {(["past", "upcoming"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tab}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab && styles.tabLabelActive,
                ]}
              >
                {tab === "past"
                  ? "Past"
                  : `Active${upcomingOrders.length > 0 ? ` (${upcomingOrders.length})` : ""}`}
              </Text>
              {activeTab === tab && <View style={styles.tabUnderline} />}
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
            {hasActiveFilters && <View style={styles.filterBadge} />}
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
          // ── PAST ORDERS TAB ──────────────────────────────────────────────
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
                        GHS {item.price_ghs.toFixed(2)}
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
        ) : // ── ACTIVE / UPCOMING ORDERS TAB ─────────────────────────────────
        upcomingOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No active deliveries</Text>
          </View>
        ) : (
          upcomingOrders.map((item) => {
            const statusStyle =
              STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
            const canCancel = ["pending", "searching"].includes(item.status);

            return (
              <View key={item.id} style={styles.activeCard}>
                {/* Status badge */}
                <View style={styles.activeCardHeader}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusStyle.bg },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: statusStyle.color }]}
                    >
                      {statusStyle.label}
                    </Text>
                  </View>
                  <Text style={styles.activeDate}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>

                {/* Route */}
                <View style={styles.routeRow}>
                  <View style={styles.routeDots}>
                    <View style={styles.dotPickup} />
                    <View style={styles.routeLine} />
                    <PinLocationSvg width={14} height={16} />
                  </View>
                  <View style={styles.routeAddresses}>
                    <Text style={styles.routeAddr}>{item.pickup_address}</Text>
                    <View style={{ height: 12 }} />
                    <Text style={styles.routeAddr}>{item.dropoff_address}</Text>
                  </View>
                </View>

                {/* Footer row */}
                <View style={styles.activeCardFooter}>
                  <Text style={styles.activePrice}>
                    GHS {item.price_ghs.toFixed(2)}
                  </Text>
                  <Text style={styles.activeVehicle}>
                    {item.vehicle_type === "bicycle"
                      ? "🚲 Bicycle"
                      : "🛵 Motorcycle"}
                  </Text>
                  {canCancel && (
                    <TouchableOpacity
                      style={[
                        styles.cancelBtn,
                        cancelMutation.isPending && { opacity: 0.5 },
                      ]}
                      onPress={() => handleCancelOrder(item)}
                      disabled={cancelMutation.isPending}
                      activeOpacity={0.75}
                    >
                      {cancelMutation.isPending &&
                      cancelMutation.variables?.id === item.id ? (
                        <ActivityIndicator
                          size="small"
                          color={Colors.cancelRed}
                        />
                      ) : (
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
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

      <ConfirmModal
        visible={!!cancelTarget}
        title="Cancel delivery"
        message={`Cancel delivery to ${cancelTarget?.dropoff_address ?? "this address"}?`}
        confirmLabel="Cancel order"
        cancelLabel="Keep it"
        variant="danger"
        loading={cancelMutation.isPending}
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </View>
  );
}

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
  filterBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyText: {
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: Colors.textMuted,
  },

  // Past orders
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

  // Active order cards
  activeCard: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  activeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontFamily: "Poppins-SemiBold", fontSize: 12 },
  activeDate: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  routeRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  routeDots: { width: 16, alignItems: "center", paddingTop: 3 },
  dotPickup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.navy,
    marginBottom: 2,
  },
  routeLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 3,
  },
  routeAddresses: { flex: 1, justifyContent: "space-between" },
  routeAddr: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  activeCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  activePrice: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  activeVehicle: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.cancelRed,
  },
  cancelBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Colors.cancelRed,
  },
});
