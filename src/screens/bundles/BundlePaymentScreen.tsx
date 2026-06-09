import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import WalletSvg from "../../assets/icons/medal_icon.svg";
import { usePurchaseBundle, usePaymentOptions } from "../../hooks/useApi";
import { ApiError } from "../../api/client";
import { BundleProduct } from "../../api/bundles";
import { useToast } from "@/components/common/Toast";
import * as Haptics from "expo-haptics";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
  border: "#EFEFEF",
  inputBg: "#eeeeee",
};

export default function BundlePaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const plan: BundleProduct | undefined = route.params?.plan;

  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null,
  );
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(16)).current;

  const { data: optionsRes, isLoading: optionsLoading } = usePaymentOptions();
  const purchaseMutation = usePurchaseBundle();

  const paymentOptions = optionsRes?.data ?? [];

  const toast = useToast();

  useEffect(() => {
    if (paymentOptions.length && !selectedPaymentId) {
      const def =
        paymentOptions.find((p: any) => p.is_default) ?? paymentOptions[0];
      if (def) setSelectedPaymentId(def.id);
    }
  }, [paymentOptions]);

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

  const handleConfirmPayment = async () => {
    if (!plan) return;
    try {
      await purchaseMutation.mutateAsync({
        bundle_product_id: plan.id,
        auto_renew: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate("BundleSuccess");
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Purchase failed. Please try again.",
      );
    }
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
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan summary */}
        {plan && (
          <View style={styles.planSummary}>
            <WalletSvg width={44} height={44} />
            <View style={styles.planSummaryInfo}>
              <Text style={styles.planSummaryName}>{plan.name}</Text>
              <Text style={styles.planSummaryDetail}>
                {plan.credits} deliveries · {plan.validity_days} days
              </Text>
            </View>
            <Text style={styles.planSummaryPrice}>
              GHS {plan.price_ghs.toFixed(2)}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Pay with</Text>

        {optionsLoading ? (
          <ActivityIndicator
            size="large"
            color={Colors.navy}
            style={{ marginTop: 20 }}
          />
        ) : paymentOptions.length === 0 ? (
          <View style={styles.emptyPayment}>
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
              <WalletSvg width={30} height={30} />
            </View>
            <Text
              style={{
                fontFamily: "HelveticaNeue-CondensedBold",
                fontSize: 17,
                color: Colors.textPrimary,
              }}
            >
              No payment methods
            </Text>
            <Text
              style={[
                styles.emptyPaymentText,
                { textAlign: "center", maxWidth: 210 },
              ]}
            >
              Add a Mobile Money or card to complete your purchase.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: Colors.navy,
                borderRadius: 12,
                paddingVertical: 13,
                paddingHorizontal: 0,
                width: "100%",
                alignItems: "center",
                marginTop: 4,
              }}
              onPress={() =>
                navigation.navigate("DeliveryFlow", {
                  screen: "AddMobileMoney",
                })
              }
            >
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 14,
                  color: Colors.primary,
                }}
              >
                + Add Mobile Money
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                borderWidth: 1.5,
                borderColor: Colors.border,
                borderRadius: 12,
                paddingVertical: 12,
                width: "100%",
                alignItems: "center",
              }}
              onPress={() =>
                navigation.navigate("DeliveryFlow", { screen: "AddCard" })
              }
            >
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 14,
                  color: Colors.textPrimary,
                }}
              >
                + Add Card
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          paymentOptions.map((option: any) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.paymentRow,
                selectedPaymentId === option.id && styles.paymentRowActive,
              ]}
              onPress={() => setSelectedPaymentId(option.id)}
              activeOpacity={0.8}
            >
              <View style={styles.paymentIcon}>
                {option.type === "momo" ? (
                  <Image
                    source={require("../../assets/images/mtn_logo.png")}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
                  />
                ) : option.type === "card" ? (
                  <Image
                    source={require("../../assets/images/visa_logo.png")}
                    style={{ width: 36, height: 24 }}
                    resizeMode="contain"
                  />
                ) : (
                  <WalletSvg width={28} height={28} />
                )}
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>{option.label}</Text>
                {option.sub ? (
                  <Text style={styles.paymentSub}>{option.sub}</Text>
                ) : null}
              </View>
              <View
                style={[
                  styles.radio,
                  selectedPaymentId === option.id && styles.radioActive,
                ]}
              >
                {selectedPaymentId === option.id && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (!selectedPaymentId || purchaseMutation.isPending) && {
              opacity: 0.6,
            },
          ]}
          onPress={handleConfirmPayment}
          activeOpacity={0.85}
          disabled={!selectedPaymentId || purchaseMutation.isPending}
        >
          {purchaseMutation.isPending ? (
            <ActivityIndicator color={Colors.textPrimary} />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Payment</Text>
          )}
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
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  planSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F8FA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  planSummaryInfo: { flex: 1 },
  planSummaryName: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  planSummaryDetail: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  planSummaryPrice: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 16,
    color: Colors.navy,
  },
  sectionTitle: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 16,
    color: Colors.navy,
    marginBottom: 14,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 14,
  },
  paymentRowActive: { borderColor: Colors.navy, backgroundColor: "#F7F8FA" },
  paymentIcon: { width: 40, alignItems: "center" },
  paymentInfo: { flex: 1 },
  paymentLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  paymentSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: Colors.navy },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.navy,
  },
  emptyPayment: { alignItems: "center", paddingVertical: 24, gap: 12 },
  emptyPaymentText: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textMuted,
  },
  addPaymentLink: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.navy,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 10,
    backgroundColor: Colors.white,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
  },
  confirmBtnText: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});
