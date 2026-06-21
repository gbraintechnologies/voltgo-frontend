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
import WalletSvg from "../../assets/icons/medal_icon.svg";

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

// API returns price_ghs as a string e.g. "0.99" — always parse before calling
// .toFixed() or doing arithmetic.
function formatPrice(price: string | number): string {
  return parseFloat(String(price)).toFixed(2);
}

export default function TopupScreen() {
  const navigation = useNavigation<any>();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(16)).current;

  // 404 from /bundles/my/active is expected when rider has no bundle — treat
  // it as null rather than a hard error by ignoring the error state.
  const { data: activeBundleRes } = useActiveBundle();
  const { data: productsRes, isLoading } = useBundleProducts();

  // data will be null when the API returns 404 with data: null
  const activeBundle = activeBundleRes?.data ?? null;
  const products: BundleProduct[] = productsRes?.data ?? [];

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (activeBundle?.product?.id) {
      setSelectedId(activeBundle.product.id);
    } else if (products.length) {
      setSelectedId(products[0].id);
    }
  }, [activeBundle, products]);

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
    ]).start();
  }, []);

  const selectedPlan = products.find((p) => p.id === selectedId);

  const handleProceed = () => {
    if (!selectedPlan) return;
    navigation.navigate("BundlesFlow", {
      screen: "BundlePayment",
      params: { plan: selectedPlan },
    });
  };

  // Only fall back to activeBundle.product if nothing is selected from the
  // products list — avoids showing a stale plan when fresh data has loaded.
  const displayPlan: BundleProduct | undefined =
    selectedPlan ?? (activeBundle?.product as BundleProduct | undefined);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowBackSvg width={60} height={60} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top up</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.subtitle}>
        {activeBundle ? "Current Plan" : "Choose a Plan"}
      </Text>

      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={Colors.navy} />
        </View>
      ) : (
        <Animated.View
          style={[
            { flex: 1, paddingHorizontal: 20 },
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          {products.length > 1 ? (
            // Multiple plans — scrollable picker
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {products.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    selectedId === plan.id && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedId(plan.id)}
                  activeOpacity={0.82}
                >
                  <Image
                    source={require("../../assets/images/medal_icon.png")}
                    style={styles.medalImg}
                    resizeMode="contain"
                  />
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDeliveries}>
                      {plan.credits} Deliveries
                    </Text>
                    {/* <Text style={styles.planExpiry}>
                      Expires in {plan.validity_days} days
                    </Text> */}
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 8 }}>
                    {/* formatPrice handles both string and number from API */}
                    <Text style={styles.planPrice}>
                      GHS {formatPrice(plan.price_ghs)}
                    </Text>
                    <View
                      style={[
                        styles.radioOuter,
                        selectedId === plan.id && styles.radioOuterActive,
                      ]}
                    >
                      {selectedId === plan.id && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : products.length === 1 && displayPlan ? (
            // Single plan — static selected card
            <View style={[styles.planCard, styles.planCardSelected]}>
              <Image
                source={require("../../assets/images/medal_icon.png")}
                style={styles.medalImg}
                resizeMode="contain"
              />
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{displayPlan.name}</Text>
                <Text style={styles.planDeliveries}>
                  {displayPlan.credits} Deliveries
                </Text>
                {/* <Text style={styles.planExpiry}>
                  Expires in {displayPlan.validity_days} days
                </Text> */}
              </View>
              <View style={{ alignItems: "flex-end", gap: 8 }}>
                <Text style={styles.planPrice}>
                  GHS {formatPrice(displayPlan.price_ghs)}
                </Text>
                <View style={[styles.radioOuter, styles.radioOuterActive]}>
                  <View style={styles.radioInner} />
                </View>
              </View>
            </View>
          ) : (
            // No plans available
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconRing}>
                <WalletSvg width={38} height={38} />
              </View>
              <Text style={styles.emptyTitle}>No plans available</Text>
              <Text style={styles.emptyDesc}>
                Bundle plans aren't set up yet.{"\n"}Check back soon or contact
                support.
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.getParent("AccountStack")?.navigate("Support")
                }
                style={styles.emptyCta}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyCtaText}>Contact support</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.proceedBtn, !selectedPlan && { opacity: 0.6 }]}
          onPress={handleProceed}
          activeOpacity={0.85}
          disabled={!selectedPlan}
        >
          <Text style={styles.proceedBtnText}>Proceed</Text>
        </TouchableOpacity>
      </View>
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
  subtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
    backgroundColor: Colors.white,
  },
  planCardSelected: { borderColor: Colors.navy, borderWidth: 2 },
  medalImg: { width: 56, height: 56 },
  planInfo: { flex: 1 },
  planName: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  planDeliveries: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  planExpiry: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  planPrice: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.navy,
    backgroundColor: Colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: Colors.navy,
    backgroundColor: Colors.navy,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
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
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  emptyIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEF1F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 220,
    marginBottom: 28,
  },
  emptyCta: {
    backgroundColor: Colors.navy,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 32,
  },
  emptyCtaText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.primary,
    letterSpacing: 0.2,
  },
});
