import React, { useRef, useEffect } from "react";
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import { useMyBundles } from "../../hooks/useApi";
import { BundleHistoryItem } from "../../api/bundles";
import HistoryIconSvg from "../../assets/icons/repeat_icon.svg";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textMuted: "#9CA3AF",
  border: "#EFEFEF",
  creditRed: "#E05252",
  creditGreen: "#1A8A3C",
  inputBg: "#F2F4F7",
};

const RenewIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4v5h5M20 20v-5h-5"
      stroke={Colors.creditGreen}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4 9a8 8 0 0114.54-3M20 15a8 8 0 01-14.54 3"
      stroke={Colors.creditGreen}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

const TopupIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z"
      stroke={Colors.creditGreen}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })} · ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function groupByMonth(items: BundleHistoryItem[]) {
  const map: Record<string, BundleHistoryItem[]> = {};
  items.forEach((item) => {
    const d = new Date(item.created_at);
    const key = `${d.toLocaleString("en", { month: "long" })} ${d.getFullYear()}`;
    if (!map[key]) map[key] = [];
    map[key].push(item);
  });
  return map;
}

export default function BundleHistoryScreen() {
  const navigation = useNavigation<any>();
  const fadeIn = useRef(new Animated.Value(0)).current;

  const { data: bundlesRes, isLoading } = useMyBundles();
  const bundles: BundleHistoryItem[] = bundlesRes?.data ?? [];
  const grouped = groupByMonth(bundles);

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowBackSvg width={60} height={58} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bundle History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={Colors.navy} />
        </View>
      ) : (
        <Animated.ScrollView
          style={{ opacity: fadeIn }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {bundles.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: Colors.inputBg,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <HistoryIconSvg width={30} height={30} />
              </View>
              <Text
                style={{
                  fontFamily: "HelveticaNeue-CondensedBold",
                  fontSize: 17,
                  color: Colors.textPrimary,
                }}
              >
                No bundles purchased yet
              </Text>
              <Text
                style={[
                  styles.emptyText,
                  { textAlign: "center", maxWidth: 210, lineHeight: 20 },
                ]}
              >
                Once you buy a bundle, your history will show up here.
              </Text>
              <TouchableOpacity
                style={{
                  marginTop: 8,
                  backgroundColor: Colors.primary,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 28,
                }}
                onPress={() =>
                  navigation.navigate("BundlesFlow", { screen: "Topup" })
                }
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 14,
                    color: Colors.textPrimary,
                  }}
                >
                  Browse bundles
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            Object.entries(grouped).map(([month, items]) => (
              <View key={month}>
                <View style={styles.monthRow}>
                  <Text style={styles.monthHeader}>{month}</Text>
                  <View style={styles.monthLine} />
                </View>
                {items.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.historyRow,
                      index < items.length - 1 && styles.historyRowBorder,
                    ]}
                  >
                    <View
                      style={[styles.iconWrap, { backgroundColor: "#E8F9EE" }]}
                    >
                      <RenewIcon />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyPlan}>
                        {item.product?.name ?? "Bundle"}
                      </Text>
                      <Text style={styles.historyDate}>
                        {formatDate(item.created_at)}
                      </Text>
                      <View style={styles.statusBadge}>
                        <Text
                          style={[
                            styles.statusText,
                            item.status === "active"
                              ? styles.statusActive
                              : styles.statusInactive,
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyAmount}>
                        GHS {item.product?.price_ghs?.toFixed(2) ?? "—"}
                      </Text>
                      <Text
                        style={[
                          styles.historyCredits,
                          { color: Colors.creditGreen },
                        ]}
                      >
                        +{item.credits_total} credits
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
          <View style={{ height: 48 }} />
        </Animated.ScrollView>
      )}
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
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
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
    marginTop: 8,
  },
  monthHeader: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 16,
    color: Colors.textPrimary,
    flexShrink: 0,
  },
  monthLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  historyRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  historyInfo: { flex: 1 },
  historyPlan: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  historyDate: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  statusBadge: { alignSelf: "flex-start" },
  statusText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    textTransform: "capitalize",
  },
  statusActive: { color: Colors.creditGreen },
  statusInactive: { color: Colors.textMuted },
  historyRight: { alignItems: "flex-end", gap: 4 },
  historyAmount: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 14,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  historyCredits: { fontFamily: "Poppins-SemiBold", fontSize: 12 },
});
