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
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import WalletSvg from "../../assets/icons/medal_icon.svg";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
  border: "#EFEFEF",
};

const PAYMENT_OPTIONS = [
  {
    id: "bundle",
    label: "Bundle Credits",
    sub: "3 deliveries left",
    logo: null, // uses WalletSvg
  },
  {
    id: "mtn",
    label: "MTN MoMo",
    sub: "0546785064",
    logo: require("../../assets/images/mtn_logo.png"),
  },
  {
    id: "visa",
    label: "Visa Card",
    sub: "•••• 7765",
    logo: require("../../assets/images/visa_logo.png"),
  },
];

export default function BundlePaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { plan } = route.params ?? {};

  const [selectedPayment, setSelectedPayment] = useState("mtn");
  const [loading, setLoading] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(16)).current;

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

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);
    navigation.navigate("BundleSuccess", { plan });
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
        {/* Order summary */}
        <Text style={styles.sectionTitle}>Order Summary</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan</Text>
            <Text style={styles.summaryValue}>
              {plan?.name ?? "Starter Pack"}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowBorder]}>
            <Text style={styles.summaryLabel}>Deliveries</Text>
            <Text style={styles.summaryValue}>
              {plan?.deliveries ?? 5} deliveries
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowBorder]}>
            <Text style={styles.summaryLabel}>Valid for</Text>
            <Text style={styles.summaryValue}>{plan?.expiry ?? "30 days"}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowBorder]}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryTotal}>
              {plan?.price ?? "GHS 75.00"}
            </Text>
          </View>
        </View>

        {/* Pay with */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Pay With</Text>

        {PAYMENT_OPTIONS.map((opt, index) => (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.paymentRow,
              index < PAYMENT_OPTIONS.length - 1 && styles.paymentRowBorder,
              selectedPayment === opt.id && styles.paymentRowActive,
            ]}
            onPress={() => setSelectedPayment(opt.id)}
            activeOpacity={0.75}
          >
            <View style={styles.paymentIconWrap}>
              {opt.logo ? (
                <Image
                  source={opt.logo}
                  style={styles.paymentLogo}
                  resizeMode="contain"
                />
              ) : (
                <WalletSvg width={30} height={28} />
              )}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>{opt.label}</Text>
              <Text style={styles.paymentSub}>{opt.sub}</Text>
            </View>
            <View
              style={[
                styles.radioOuter,
                selectedPayment === opt.id && styles.radioOuterActive,
              ]}
            >
              {selectedPayment === opt.id && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textPrimary} />
          ) : (
            <Text style={styles.confirmBtnText}>
              Confirm & Pay {plan?.price ?? "GHS 75.00"}
            </Text>
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
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },

  sectionTitle: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 16,
    color: Colors.navy,
    marginBottom: 14,
    letterSpacing: 0.1,
  },

  // Summary — flat, border only
  summaryCard: {
    // borderWidth: 1,
    // borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    //   shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  summaryRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  summaryLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textMuted,
  },
  summaryValue: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  summaryTotal: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 17,
    color: Colors.navy,
    letterSpacing: 0.2,
  },

  // Payment rows — flat
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: Colors.white,
  },
  paymentRowBorder: {},
  paymentRowActive: { borderColor: Colors.navy, borderWidth: 2 },
  paymentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentInfo: { flex: 1 },
  paymentLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  paymentSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
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
  radioOuterActive: { borderColor: Colors.navy, backgroundColor: Colors.navy },
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
  paymentLogo: {
    width: 48,
    height: 30,
    borderRadius: 4,
  },
});
