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
import { useNavigation } from "@react-navigation/native";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import { useBundleProducts, useActiveBundle } from "../../hooks/useApi";
import { BundleProduct } from "../../api/bundles";
import RenewIconSvg from "../../assets/icons/renew_icon.svg";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
  border: "#E8E8E8",
  inputBg: "#F2F4F7",
};

function formatPrice(price: string | number | undefined): string {
  if (price == null) return "—";
  const n = parseFloat(String(price));
  return isNaN(n) ? "—" : n.toFixed(2);
}

function toNumber(val: string | number | undefined): number {
  return parseFloat(String(val ?? 0));
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RenewScreen() {
  const navigation = useNavigation<any>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(16)).current;

  const { data: activeBundleRes, isLoading: activeBundleLoading } = useActiveBundle();
  const { data: productsRes, isLoading: productsLoading } = useBundleProducts();

  const isLoading = activeBundleLoading || productsLoading;
  const activeBundle = activeBundleRes?.data ?? null;
  const activePlanId: string | undefined = activeBundle?.product?.id;
  const products: BundleProduct[] = productsRes?.data ?? [];

  // Auto-select: prefer active bundle's product, then first in list
  useEffect(() => {
    if (selectedId) return;
    if (activePlanId) {
      setSelectedId(activePlanId);
    } else if (products.length) {
      setSelectedId(products[0].id);
    }
  }, [activePlanId, products]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleProceed = () => {
    const plan = products.find((p) => p.id === selectedId);
    if (!plan) return;
    navigation.navigate("BundlesFlow", {
      screen: "BundlePayment",
      params: { plan },
    });
  };

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
        <Text style={styles.headerTitle}>Renew</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View
        style={[{ flex: 1 }, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}
      >
        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={Colors.navy} />
          </View>
        ) : (
          <>
            {/* Active bundle info card */}
            {activeBundle && (
              <View style={styles.activeBanner}>
                <View style={styles.activeBannerLeft}>
                  <Text style={styles.activeBannerLabel}>Current bundle</Text>
                  <Text style={styles.activeBannerName}>
                    {activeBundle.product?.name ?? "Bundle"}
                  </Text>
                  <Text style={styles.activeBannerDetail}>
                    {activeBundle.credits_remaining} of {activeBundle.credits_total} credits remaining
                  </Text>
                  {activeBundle.expires_at && (
                    <Text style={styles.activeBannerExpiry}>
                      Expires {formatExpiry(activeBundle.expires_at)}
                    </Text>
                  )}
                </View>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Active</Text>
                </View>
              </View>
            )}

            <Text style={styles.subtitle}>
              {activeBundle ? "Choose a plan to renew with" : "Select a plan"}
            </Text>

            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
            >
              {products.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIconRing}>
                    <RenewIconSvg width={30} height={30} />
                  </View>
                  <Text style={styles.emptyTitle}>No plans right now</Text>
                  <Text style={styles.emptyDesc}>
                    Bundle renewal plans are not available yet. Check back soon.
                  </Text>
                </View>
              ) : (
                products.map((plan) => {
                  const isCurrentPlan = plan.id === activePlanId;
                  const isSelected = selectedId === plan.id;
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={[styles.planCard, isSelected && styles.planCardSelected]}
                      onPress={() => setSelectedId(plan.id)}
                      activeOpacity={0.82}
                    >
                      <Image
                        source={require("../../assets/images/medal_icon.png")}
                        style={styles.medalImg}
                        resizeMode="contain"
                      />
                      <View style={styles.planInfo}>
                        <View style={styles.planNameRow}>
                          <Text style={styles.planName}>{plan.name}</Text>
                          {isCurrentPlan && (
                            <View style={styles.currentBadge}>
                              <Text style={styles.currentBadgeText}>Current</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.planDeliveries}>{plan.credits} deliveries</Text>
                        <Text style={styles.planExpiry}>{plan.validity_days} days validity</Text>
                        {toNumber(plan.discount_percent) > 0 && (
                          <Text style={styles.discountBadge}>
                            {formatPrice(plan.discount_percent)}% off
                          </Text>
                        )}
                      </View>
                      <View style={styles.planRight}>
                        <Text style={styles.planPrice}>
                          GHS {formatPrice(plan.price_ghs)}
                        </Text>
                        <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
              <View style={{ height: 100 }} />
            </ScrollView>

            {products.length > 0 && (
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.proceedBtn, (!selectedId || isLoading) && { opacity: 0.6 }]}
                  onPress={handleProceed}
                  activeOpacity={0.85}
                  disabled={!selectedId || isLoading}
                >
                  <Text style={styles.proceedBtnText}>
                    {activeBundle ? "Renew Plan" : "Proceed"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </Animated.View>
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
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 19,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  headerSpacer: { width: 32 },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#EEF6FF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#C7DFFB",
  },
  activeBannerLeft: { flex: 1 },
  activeBannerLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: "#3B7DD8",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  activeBannerName: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  activeBannerDetail: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  activeBannerExpiry: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  activePill: {
    backgroundColor: "#D1FAE5",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activePillText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    color: "#065F46",
  },
  subtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  emptyWrap: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F0FBF3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 17,
    color: Colors.textPrimary,
  },
  emptyDesc: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 210,
    lineHeight: 20,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
    backgroundColor: Colors.white,
  },
  planCardSelected: { borderColor: Colors.navy, borderWidth: 2 },
  medalImg: { width: 56, height: 56 },
  planInfo: { flex: 1 },
  planNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  planName: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  currentBadge: {
    backgroundColor: "#E0F2FE",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  currentBadgeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 10,
    color: "#0369A1",
  },
  planDeliveries: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  planExpiry: { fontFamily: "Poppins-Regular", fontSize: 12, color: Colors.textMuted },
  discountBadge: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    color: Colors.primary,
    marginTop: 3,
  },
  planRight: { alignItems: "center", gap: 8 },
  planPrice: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
    textAlign: "right",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: { borderColor: Colors.navy, backgroundColor: Colors.white },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.navy },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 10,
    backgroundColor: Colors.white,
  },
  proceedBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  proceedBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});