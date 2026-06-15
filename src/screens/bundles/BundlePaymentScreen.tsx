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
  Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import WalletSvg from "../../assets/icons/medal_icon.svg";
import {
  usePurchaseBundle,
  usePaymentMethods,
  useVerifyPaystack,
} from "../../hooks/useApi";
import { ApiError } from "../../api/client";
import { BundleProduct } from "../../api/bundles";
import { useToast } from "@/components/common/Toast";
import * as Haptics from "expo-haptics";
import WebView from "react-native-webview";

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

// API returns price_ghs as a string e.g. "0.99" — always parse before toFixed
function formatPrice(price: string | number | undefined): string {
  if (price == null) return "—";
  const n = parseFloat(String(price));
  return isNaN(n) ? "—" : n.toFixed(2);
}

export default function BundlePaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const plan: BundleProduct | undefined = route.params?.plan;

  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const verifyMutation = useVerifyPaystack();

  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null,
  );
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(16)).current;

  // usePaymentMethods → GET /payment-methods (works reliably)
  // usePaymentOptions → GET /payment-methods/options (unreliable, skip it)
  const { data: methodsRes, isLoading: optionsLoading } = usePaymentMethods();
  const purchaseMutation = usePurchaseBundle();
  const toast = useToast();

  // Normalise PaymentMethod[] into the shape the UI expects
  const methodsData = methodsRes?.data as any;

  const rawMethods: any[] = Array.isArray(methodsData)
    ? methodsData
    : Array.isArray(methodsData?.data)
      ? methodsData.data
      : [];
  const paymentOptions: any[] = rawMethods.map((m: any) => ({
    ...m,
    label:
      m.account_name ??
      (m.type === "card" ? `Card ····${m.card_last4 ?? ""}` : "Mobile Money"),
    sub: m.account_number ?? m.provider ?? "",
  }));

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
    if (!plan || !selectedPaymentId) return;
    try {
      const res = await purchaseMutation.mutateAsync({
        bundle_product_id: plan.id,
        payment_method_id: selectedPaymentId,
        auto_renew: false,
      });
      const { authorization_url, reference } = res.data.checkout;
      setPendingReference(reference);
      setPaystackUrl(authorization_url);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Purchase failed. Please try again.",
      );
    }
  };

  const handleWebViewNav = async (navState: { url: string }) => {
    if (
      navState.url.includes("voltgoapp.com") ||
      !navState.url.includes("paystack")
    ) {
      setPaystackUrl(null);
      if (pendingReference) {
        try {
          await verifyMutation.mutateAsync(pendingReference);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          navigation.navigate("BundleSuccess");
        } catch (err) {
          toast.error(
            err instanceof ApiError
              ? err.message
              : "Payment verification failed.",
          );
        }
        setPendingReference(null);
      }
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
            {/* formatPrice handles string or number from API */}
            <Text style={styles.planSummaryPrice}>
              GHS {formatPrice(plan.price_ghs)}
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
            <View style={styles.emptyIconRing}>
              <WalletSvg width={30} height={30} />
            </View>
            <Text style={styles.emptyTitle}>No payment methods</Text>
            <Text style={styles.emptyPaymentText}>
              Add a Mobile Money or card to complete your purchase.
            </Text>
            <TouchableOpacity
              style={styles.addMomoBtn}
              onPress={() =>
                navigation.navigate("DeliveryFlow", {
                  screen: "AddMobileMoney",
                })
              }
            >
              <Text style={styles.addMomoBtnText}>+ Add Mobile Money</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addCardBtn}
              onPress={() =>
                navigation.navigate("DeliveryFlow", { screen: "AddCard" })
              }
            >
              <Text style={styles.addCardBtnText}>+ Add Card</Text>
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

      {/* Paystack WebView Modal */}
      <Modal
        visible={!!paystackUrl}
        animationType="slide"
        onRequestClose={() => setPaystackUrl(null)}
      >
        <View style={{ flex: 1, paddingTop: Platform.OS === "ios" ? 50 : 30 }}>
          <TouchableOpacity
            onPress={() => setPaystackUrl(null)}
            style={{ padding: 16 }}
          >
            <Text style={styles.cancelPaymentText}>✕ Cancel Payment</Text>
          </TouchableOpacity>
          {paystackUrl && (
            <WebView
              source={{ uri: paystackUrl }}
              onNavigationStateChange={handleWebViewNav}
              startInLoadingState
            />
          )}
        </View>
      </Modal>
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
  emptyIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 17,
    color: Colors.textPrimary,
  },
  emptyPaymentText: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 210,
  },
  addMomoBtn: {
    backgroundColor: Colors.navy,
    borderRadius: 12,
    paddingVertical: 13,
    width: "100%",
    alignItems: "center",
  },
  addMomoBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },
  addCardBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  addCardBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
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
  cancelPaymentText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.navy,
  },
});
