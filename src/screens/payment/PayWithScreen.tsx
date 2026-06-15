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
import {
  useNavigation,
  useRoute,
  RouteProp,
  CommonActions,
} from "@react-navigation/native";
import { DeliveryStackParamList } from "../../navigation/types";
import CloseXSvg from "../../assets/icons/arrow_back.svg";
import ChevronRightSvg from "../../assets/icons/chevron_right.svg";
import WalletSvg from "../../assets/icons/topup_icon.svg";
import { usePaymentOptions, useBookDelivery } from "../../hooks/useApi";
import { ApiError } from "../../api/client";
import { useToast } from "@/components/common/Toast";
import * as Haptics from "expo-haptics";

type RouteParams = RouteProp<DeliveryStackParamList, "PayWith">;

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

export default function PayWithScreen() {
  const toast = useToast();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  const { data: optionsRes, isLoading } = usePaymentOptions();
  const bookMutation = useBookDelivery();

  const {
    vehicleType,
    price,
    pickup,
    dropoff,
    pickupCoords,
    dropoffCoords,
    returnTo,
  } = route.params ?? {};

  const rawData = optionsRes?.data as any;
  const paymentOptions: any[] = [
    ...(rawData?.bundle_credit
      ? [
          {
            id: "bundle_credit",
            type: "bundle_credit",
            label: "Bundle Credit",
            sub: `${rawData.bundle_credit.credits_remaining ?? 0} deliveries remaining`,

            is_default: false,
          },
        ]
      : []),
    ...(rawData?.payment_methods ?? []).map((m: any) => ({
      ...m,
      label:
        m.account_name ??
        (m.type === "card" ? `Card ····${m.card_last4}` : "Mobile Money"),
      sub: m.account_number ?? m.provider ?? "",
    })),
  ];

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

  // Auto-select default or first option
  useEffect(() => {
    if (paymentOptions.length && !selectedId) {
      const availableOptions = paymentOptions.filter((p: any) => {
        if (p.type === "bundle_credit") {
          return (rawData?.bundle_credit?.credits_remaining ?? 0) > 0; // ← fix here too
        }
        return true;
      });
      const def =
        availableOptions.find((p: any) => p.is_default) ?? availableOptions[0];
      if (def) setSelectedId(def.id);
    }
  }, [paymentOptions]);

  const selected = paymentOptions.find((p: any) => p.id === selectedId);

  const handleProceed = async () => {
    console.log("handleProceed fired", { selected, returnTo, selectedId });

    if (!selected) {
      toast.warning("Please select a payment method.");
      return;
    }

    if (returnTo === "ReviewDelivery") {
      const paymentMethod = {
        id: selected.id,
        label: selected.label,
        method:
          selected.type === "bundle_credit"
            ? "bundle" // ← was "bundle_credit"
            : selected.provider,
        payment_method_id:
          selected.type !== "bundle_credit" ? selected.id : undefined,
      };

      const state = navigation.getState();
      const reviewRoute = state.routes
        .slice()
        .reverse()
        .find((r: any) => r.name === "ReviewDelivery");

      if (reviewRoute) {
        navigation.dispatch({
          ...CommonActions.setParams({ selectedPaymentMethod: paymentMethod }),
          source: reviewRoute.key,
        });
      }

      navigation.goBack();
      return;
    }
    // Normal PayWith flow: book directly
    try {
      const res = await bookMutation.mutateAsync({
        pickup_address: pickup ?? "Unknown",
        pickup_lat: pickupCoords?.latitude ?? 5.6501,
        pickup_lng: pickupCoords?.longitude ?? -0.1862,
        dropoff_address: dropoff ?? "Unknown",
        dropoff_lat: dropoffCoords?.latitude ?? 5.6508,
        dropoff_lng: dropoffCoords?.longitude ?? -0.187,
        item_description: "Package",
        vehicle_type: vehicleType === "bicycle" ? "bicycle" : "motorcycle",
        payment_method:
          selected.type === "bundle_credit"
            ? "bundle" // ← fix
            : selected.provider,
        payment_method_id:
          selected.type !== "bundle_credit" ? selected.id : undefined,
        price_ghs: Number(price ?? 0),
      });

      navigation.navigate("RiderMatching", {
        pickup,
        dropoff,
        vehicleType,
        paymentMethod: selected.label,
        orderId: res.data.id,
        pickupCoords,
        dropoffCoords,
      });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(
        err instanceof ApiError ? err.message : "Failed to book delivery.",
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
          <CloseXSvg width={60} height={58} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay with</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.amountLabel}>
          Total:{" "}
          <Text style={styles.amountValue}>
            GHS {price?.toFixed(2) ?? "0.00"}
          </Text>
        </Text>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={Colors.navy}
            style={{ marginTop: 40 }}
          />
        ) : paymentOptions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No payment methods saved</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate("AddPaymentMethod")}
            >
              <Text style={styles.addBtnText}>Add Payment Method</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {paymentOptions.map((option: any) => {
              const isExhausted =
                option.type === "bundle_credit" &&
                (rawData?.bundle_credit?.credits_remaining ?? 0) <= 0;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionRow,
                    selectedId === option.id && styles.optionRowActive,
                    isExhausted && styles.optionRowDisabled,
                  ]}
                  onPress={() => {
                    if (isExhausted) return;
                    setSelectedId(option.id);
                  }}
                  activeOpacity={isExhausted ? 1 : 0.8}
                >
                  <View style={styles.optionIcon}>
                    {option.type === "bundle_credit" ? (
                      <WalletSvg width={24} height={24} />
                    ) : option.type === "momo" ? (
                      <Image
                        source={require("../../assets/images/mtn_logo.png")}
                        style={{ width: 32, height: 32 }}
                        resizeMode="contain"
                      />
                    ) : (
                      <Image
                        source={require("../../assets/images/visa_logo.png")}
                        style={{ width: 36, height: 24 }}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    {option.sub ? (
                      <Text style={styles.optionSub}>{option.sub}</Text>
                    ) : null}
                    {isExhausted && (
                      <Text style={styles.exhaustedLabel}>No credits left</Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.radio,
                      selectedId === option.id && styles.radioActive,
                    ]}
                  >
                    {selectedId === option.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.addMethodRow}
              onPress={() => navigation.navigate("AddPaymentMethod")}
              activeOpacity={0.7}
            >
              <Text style={styles.addMethodText}>+ Add Payment Method</Text>
              <ChevronRightSvg width={18} height={18} />
            </TouchableOpacity>
          </>
        )}
      </Animated.ScrollView>

      {price !== undefined && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              (!selectedId || bookMutation.isPending) && { opacity: 0.6 },
            ]}
            onPress={handleProceed}
            activeOpacity={0.85}
            disabled={!selectedId || bookMutation.isPending}
          >
            {bookMutation.isPending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.confirmBtnText}>
                {returnTo === "ReviewDelivery"
                  ? "Use this payment method"
                  : `Confirm · GHS ${price?.toFixed(2) ?? "0.00"}`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
    paddingBottom: 16,
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
  amountValue: {},
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  amountLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
  },

  sectionTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: Colors.navy,
  },
  optionRow: {
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
  optionRowActive: { borderColor: Colors.navy, backgroundColor: "#F7F8FA" },
  optionIcon: { width: 40, alignItems: "center" },
  optionInfo: { flex: 1 },
  optionLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  optionSub: {
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
  addMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 4,
  },
  addMethodText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.navy,
  },
  emptyState: { alignItems: "center", paddingTop: 40, gap: 16 },
  emptyText: {
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: Colors.textMuted,
  },
  addBtn: {
    backgroundColor: Colors.navy,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.white,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 8,
    backgroundColor: Colors.white,
  },
  confirmBtn: {
    backgroundColor: Colors.navy,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
  },
  confirmBtnText: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 17,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  optionRowDisabled: {
    opacity: 0.45,
    borderColor: Colors.border,
  },
  exhaustedLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: "#EF4444",
    marginTop: 3,
  },
});



