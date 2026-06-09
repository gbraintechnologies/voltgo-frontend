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
import { useBundleProducts } from "../../hooks/useApi";
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

export default function RenewScreen() {
  const navigation = useNavigation<any>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(16)).current;

  const { data: productsRes, isLoading } = useBundleProducts();
  const products: BundleProduct[] = productsRes?.data ?? [];

  // Auto-select first plan
  useEffect(() => {
    if (products.length > 0 && !selectedId) {
      setSelectedId(products[0].id);
    }
  }, [products, selectedId]);

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
        style={[
          { flex: 1 },
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        <Text style={styles.subtitle}>Select plan</Text>

        {isLoading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator size="large" color={Colors.navy} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {products.length === 0 && !isLoading && (
              <View style={{ alignItems: "center", paddingTop: 40, gap: 10 }}>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: "#F0FBF3",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 6,
                  }}
                >
                  <RenewIconSvg width={30} height={30} />
                </View>
                <Text
                  style={{
                    fontFamily: "HelveticaNeue-CondensedBold",
                    fontSize: 17,
                    color: Colors.textPrimary,
                  }}
                >
                  No plans right now
                </Text>
                <Text
                  style={{
                    fontFamily: "Poppins-Regular",
                    fontSize: 13,
                    color: Colors.textMuted,
                    textAlign: "center",
                    maxWidth: 210,
                    lineHeight: 20,
                  }}
                >
                  Bundle renewal plans aren't available yet. Check back soon.
                </Text>
              </View>
            )}
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
                  <Text style={styles.planExpiry}>
                    Expires in {plan.validity_days} days
                  </Text>
                  {plan.discount_percent > 0 && (
                    <Text style={styles.discountBadge}>
                      {plan.discount_percent}% off
                    </Text>
                  )}
                </View>
                <View style={styles.planRight}>
                  <Text style={styles.planPrice}>
                    GHS {plan.price_ghs.toFixed(2)}
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
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {products.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.proceedBtn,
                (!selectedId || isLoading) && { opacity: 0.6 },
              ]}
              onPress={handleProceed}
              activeOpacity={0.85}
              disabled={!selectedId || isLoading}
            >
              <Text style={styles.proceedBtnText}>Proceed</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 16,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
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
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.navy,
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
});
