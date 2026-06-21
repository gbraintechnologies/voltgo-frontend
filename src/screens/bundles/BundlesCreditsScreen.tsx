/**
 * BundlesCreditsScreen.tsx — FIXED
 *
 * Fixes applied:
 *  1. `ordersRes?.data?.items` (was `.orders` — API returns `items`)
 *  2. `useActiveBundle` 404 is now handled gracefully (treat as "no bundle")
 *  3. Guard added so a 404 never surfaces as a red error state
 */

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  CommonActions,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Polyline as SvgPolyline,
} from "react-native-svg";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import TopupIconSvg from "../../assets/icons/topup_icon.svg";
import RenewIconSvg from "../../assets/icons/renew_icon.svg";
import HistoryIconSvg from "../../assets/icons/history_icon.svg";
import { useActiveBundle, useMyOrders } from "../../hooks/useApi";

const { width } = Dimensions.get("window");
const CHART_W = width - 40 - 28;
const CHART_H = 140;

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
  border: "#EFEFEF",
  inputBg: "#F2F4F7",
  red: "#FF6B6B",
  creditRed: "#E05252",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function daysUntil(dateStr: string) {
  const now = new Date();
  const exp = new Date(dateStr);
  return Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / 86400000));
}

export default function BundlesCreditsScreen() {
  const navigation = useNavigation<any>();
  const [period] = useState("Weekly");
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(16)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;

  const route = useRoute<any>();
  const fromFlow = route.params?.fromFlow;

  // ─── FIX 1: handle 404 gracefully ────────────────────────────────────────
  // If useActiveBundle throws on 404, wrap with enabled flag or catch in hook.
  // Here we guard by treating any error as "no bundle" via `isError`.
  const {
    data: activeBundleRes,
    isLoading: bundleLoading,
    isError: bundleError,
  } = useActiveBundle();

  // ─── FIX 2: API returns `items`, not `orders` ─────────────────────────────
  const { data: ordersRes } = useMyOrders({ limit: 50 });

  // 404 means no active bundle — not a real error, just treat as null
  const activeBundle = bundleError ? null : activeBundleRes?.data;

  // API returns data.items (not data.orders)
  const recentOrders =
    (ordersRes?.data as any)?.items ?? (ordersRes?.data as any)?.orders ?? [];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 55,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 60,
        friction: 9,
        delay: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const chartData = React.useMemo(() => {
    const counts = Array(7).fill(0);
    recentOrders.forEach((order: any) => {
      const day = new Date(order.created_at).getDay();
      counts[day]++;
    });
    return counts;
  }, [recentOrders]);

  const hasRealData = recentOrders.length > 0;

  // If no real data, show a gentle dummy curve so the chart isn't empty
  const displayData = hasRealData ? chartData : [1, 2, 1, 3, 2, 4, 3]; // placeholder shape, visually honest

  const maxVal = Math.max(...displayData, 1);
  const points = displayData
    .map((v, i) => {
      const x = (i / (displayData.length - 1)) * CHART_W;
      const y = CHART_H - (v / maxVal) * CHART_H * 0.85;
      return `${x},${y}`;
    })
    .join(" ");

  const expiryDays = activeBundle ? daysUntil(activeBundle.expires_at) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (fromFlow) {
              // Came from purchase flow — jump straight to Account tab, clear stack
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [
                    {
                      name: "MainTabs",
                      params: { screen: "Account" },
                    },
                  ],
                }),
              );
            } else {
              // Came from Account screen — simple back
              navigation.goBack();
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowBackSvg width={60} height={58} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bundles/Credits</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Dark Plan Card */}
        <Animated.View
          style={[styles.planCard, { transform: [{ scale: cardScale }] }]}
        >
          {bundleLoading ? (
            <ActivityIndicator color={Colors.primary} size="large" />
          ) : activeBundle ? (
            <>
              <Text style={styles.planName}>
                {activeBundle.product?.name ?? "Bundle"}
              </Text>
              <Text style={styles.planCount}>
                {activeBundle.credits_remaining}
              </Text>
              <Text style={styles.planSubtitle}>Deliveries left</Text>
              <Text style={styles.planExpiry}>
                Expires in{" "}
                <Text
                  style={[
                    styles.planExpiryRed,
                    expiryDays <= 7 && { color: Colors.red },
                  ]}
                >
                  {expiryDays} day{expiryDays !== 1 ? "s" : ""}
                </Text>
              </Text>
            </>
          ) : (
            // ─── FIX 3: clean empty state instead of error ─────────────────
            <>
              <View
                style={{
                  backgroundColor: "rgba(76,217,100,0.15)",
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 4,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 12,
                    color: Colors.primary,
                  }}
                >
                  No Active Bundle
                </Text>
              </View>
              <Text
                style={[styles.planCount, { color: "rgba(255,255,255,0.15)" }]}
              >
                0
              </Text>
              <Text style={styles.planSubtitle}>
                You have no deliveries left
              </Text>
              <TouchableOpacity
                style={{
                  marginTop: 12,
                  backgroundColor: Colors.primary,
                  borderRadius: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 24,
                }}
                onPress={() =>
                  navigation.navigate("BundlesFlow", { screen: "Topup" })
                }
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 13,
                    color: Colors.navy,
                  }}
                >
                  Get a bundle →
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              navigation.navigate("BundlesFlow", { screen: "Topup" })
            }
            activeOpacity={0.7}
          >
            <TopupIconSvg width={28} height={28} />
            <Text style={styles.actionLabel}>Topup</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              navigation.navigate("BundlesFlow", { screen: "Renew" })
            }
            activeOpacity={0.7}
          >
            <RenewIconSvg width={28} height={28} />
            <Text style={styles.actionLabel}>Renew</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              navigation.navigate("BundlesFlow", { screen: "BundleHistory" })
            }
            activeOpacity={0.7}
          >
            <HistoryIconSvg width={28} height={28} />
            <Text style={styles.actionLabel}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Overview Chart */}
        <View style={styles.overviewSection}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Overview</Text>
            <TouchableOpacity style={styles.periodBtn} activeOpacity={0.75}>
              <Text style={styles.periodText}>{period} ▾</Text>
            </TouchableOpacity>
          </View>

          {/* Add this label when no data */}
          {!hasRealData && (
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 12,
                color: Colors.textMuted,
                marginBottom: 8,
              }}
            >
              Chart will populate once you start making deliveries.
            </Text>
          )}

          <View style={[styles.chartWrap, !hasRealData && { opacity: 0.35 }]}>
            <View style={styles.yLabels}>
              {[...Array(6)].map((_, i) => {
                const val = Math.round((maxVal / 5) * (5 - i));
                return (
                  <Text key={i} style={styles.yLabel}>
                    {val}
                  </Text>
                );
              })}
            </View>
            <View style={{ flex: 1 }}>
              <Svg width={CHART_W} height={CHART_H + 10}>
                <Defs>
                  <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop
                      offset="0"
                      stopColor={Colors.navy}
                      stopOpacity="0.15"
                    />
                    <Stop
                      offset="1"
                      stopColor={Colors.navy}
                      stopOpacity="0.01"
                    />
                  </SvgGradient>
                </Defs>
                <Path
                  d={`M0,${CHART_H} ${points} ${CHART_W},${CHART_H} Z`}
                  fill="url(#areaGrad)"
                />
                <SvgPolyline
                  points={points}
                  fill="none"
                  stroke={Colors.navy}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.xLabels}>
                {DAY_LABELS.map((l, i) => (
                  <Text key={i} style={styles.xLabel}>
                    {l}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Recent deliveries */}
        <Text style={styles.recentTitle}>Recent</Text>
        {recentOrders.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 20, gap: 8 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: Colors.inputBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HistoryIconSvg width={22} height={22} />
            </View>
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 14,
                color: Colors.textPrimary,
              }}
            >
              No deliveries yet
            </Text>
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 12,
                color: Colors.textMuted,
                textAlign: "center",
                maxWidth: 220,
                lineHeight: 18,
              }}
            >
              Your recent deliveries will appear here once you start using a
              bundle.
            </Text>
          </View>
        ) : (
          recentOrders.slice(0, 5).map((item: any, index: any) => (
            <View
              key={item.id}
              style={[
                styles.recentRow,
                index < Math.min(recentOrders.length, 5) - 1 &&
                  styles.recentRowBorder,
              ]}
            >
              <Image
                source={
                  item.vehicle_type === "bicycle"
                    ? require("../../assets/images/bicycle_small.png")
                    : require("../../assets/images/emoto_small.png")
                }
                style={styles.recentVehicleImg}
                resizeMode="contain"
              />
              <View style={styles.recentInfo}>
                <Text style={styles.recentDest}>{item.dropoff_address}</Text>
                <View style={styles.recentMeta}>
                  <Text style={styles.recentDate}>
                    {new Date(item.created_at).toLocaleDateString("en", {
                      day: "numeric",
                      month: "short",
                    })}
                    {" · "}
                    {new Date(item.created_at).toLocaleTimeString("en", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Text style={styles.recentAmount}>
                    GHS {Number(item.price_ghs ?? 0).toFixed(0)}
                  </Text>
                </View>
              </View>
              <Text style={styles.recentCredit}>-1 credit</Text>
            </View>
          ))
        )}
        <View style={{ height: 48 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 14,
    backgroundColor: Colors.white,
  },
  backBtn: {
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
  scroll: { paddingHorizontal: 20, paddingTop: 4 },
  planCard: {
    backgroundColor: Colors.navy,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 16,
    minHeight: 160,
    justifyContent: "center",
  },
  planName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.primary,
    marginBottom: 8,
  },
  planCount: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 80,
    color: Colors.white,
    lineHeight: 86,
    letterSpacing: -2,
  },
  planSubtitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.white,
    marginBottom: 6,
  },
  planExpiry: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
  },
  planExpiryRed: { color: "#FF6B6B", fontFamily: "Poppins-SemiBold" },
  actionsCard: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  actionBtn: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 6 },
  actionLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actionDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  overviewSection: { marginBottom: 24 },
  overviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  overviewTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  periodBtn: {
    backgroundColor: Colors.inputBg,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  periodText: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textPrimary,
  },
  chartWrap: { flexDirection: "row", alignItems: "flex-start" },
  yLabels: {
    width: 28,
    height: CHART_H + 10,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  yLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: "right",
  },
  xLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  xLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: "center",
    flex: 1,
  },
  recentTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  recentRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  recentVehicleImg: { width: 44, height: 36 },
  recentInfo: { flex: 1 },
  recentDest: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  recentMeta: { flexDirection: "row", gap: 8, alignItems: "center" },
  recentDate: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  recentAmount: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 13,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  recentCredit: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Colors.creditRed,
  },
});
