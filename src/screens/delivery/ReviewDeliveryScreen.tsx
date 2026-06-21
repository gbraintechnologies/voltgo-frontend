import React, { useEffect, useRef, useState } from "react";
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
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
import { DeliveryStackParamList } from "../../navigation/types";
import CloseXSvg from "../../assets/icons/close_x.svg";
import PinLocationSvg from "../../assets/icons/pin_location.svg";
import BundleCreditsSvg from "../../assets/icons/bundle_credits.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBookDelivery, usePaymentOptions } from "@/hooks/useApi";
import TermsConditionsModal from "./TermsCondittionModal";
import ChevronRightSvg from "../../assets/icons/chevron_right.svg";
import WalletSvg from "../../assets/icons/topup_icon.svg";
import { useToast } from "@/components/common/Toast";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B3C5D",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
  border: "#E0E4EA",
  bundleIcon: "#3B9EFF",
  bundleIconBg: "#E8F4FF",
};

type RouteParams = RouteProp<DeliveryStackParamList, "ReviewDelivery">;

// Add this helper above the component
function buildScheduledAt(
  scheduledDate?: string,
  scheduledTime?: string,
): string | undefined {
  if (!scheduledDate || !scheduledTime) return undefined;

  // scheduledTime format: "01:00 - 01:30" — take the start time
  const startTime = scheduledTime.split(" - ")[0].trim(); // "01:00"
  const [hours, minutes] = startTime.split(":").map(Number);

  // scheduledDate format: "Saturday, 24 May" — parse it
  const currentYear = new Date().getFullYear();
  const dateStr = scheduledDate.replace(/^[^,]+,\s*/, ""); // "24 May"
  const parsed = new Date(`${dateStr} ${currentYear}`);

  if (isNaN(parsed.getTime())) return undefined;

  parsed.setHours(hours, minutes, 0, 0);
  return parsed.toISOString();
}

function PaymentIcon({
  method,
}: {
  method: { id: string; method: string; label: string } | null;
}) {
  if (!method) {
    return <BundleCreditsSvg width={50} height={46} />;
  }

  if (method.id === "bundle_credit" || method.method === "bundle") {
    return <BundleCreditsSvg width={50} height={46} />;
  }

  // MTN MoMo or any momo type
  if (
    method.method === "mtn" ||
    method.method === "vodafone" ||
    method.method === "airteltigo" ||
    method.label?.toLowerCase().includes("momo") ||
    method.label?.toLowerCase().includes("mtn")
  ) {
    return (
      <Image
        source={require("../../assets/images/mtn_logo.png")}
        style={{ width: 32, height: 32 }}
        resizeMode="contain"
      />
    );
  }

  // Generic fallback
  return <WalletSvg width={24} height={24} />;
}

export default function ReviewDeliveryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const {
    senderName = "John Agyekum Barimah",
    pickup = "American House",
    dropoff = "University of Ghana",
    itemType = "Parcel",
    scheduledTime = "01:00 - 01:30",
    scheduledDate = "Saturday, 24 May",
    price = 24,
    paymentMethod = "Bundle Credits",
  } = route.params ?? {};

  const toast = useToast();

  const { data: paymentOptionsRes, isLoading: isLoadingPayments } =
    usePaymentOptions();

  const paymentOptions = paymentOptionsRes?.data ?? [];

  const [selectedPayment, setSelectedPayment] = useState<{
    id: string;
    label: string;
    method: string;
    payment_method_id?: string;
  } | null>(null);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(18)).current;
  const [termsVisible, setTermsVisible] = useState(false);

  const { isScheduled } = route.params ?? {};

  const { mutateAsync: bookDelivery, isPending: isBooking } = useBookDelivery();

  useEffect(() => {
    if (selectedPayment) return; // already set (e.g. came back from PayWith)

    const rawData = paymentOptionsRes?.data as any;
    if (!rawData) return;

    // Build the same options list PayWith uses
    const bundleCredit = rawData.bundle_credit;
    const hasCredits = (bundleCredit?.credits_remaining ?? 0) > 0;

    if (bundleCredit && hasCredits) {
      setSelectedPayment({
        id: "bundle_credit",
        label: "Bundle Credit",
        method: "bundle",
        payment_method_id: undefined,
      });
      return;
    }

    // Fall back to first saved payment method
    const methods: any[] = rawData.payment_methods ?? [];
    if (methods.length > 0) {
      const first = methods[0];
      setSelectedPayment({
        id: first.id,
        label: first.account_name ?? "Mobile Money",
        method: first.provider ?? first.type,
        payment_method_id: first.id,
      });
    }
  }, [paymentOptionsRes, selectedPayment]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 340,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 62,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log("ReviewDelivery focused, params:", route.params);
      if (route.params?.selectedPaymentMethod) {
        console.log(
          "Setting selectedPayment:",
          route.params.selectedPaymentMethod,
        );
        setSelectedPayment(route.params.selectedPaymentMethod);
      }
    }, [route.params?.selectedPaymentMethod]),
  );

  const handleConfirm = async () => {
    if (!selectedPayment) {
      toast.error(
        "Payment required",
        "Please select a payment method to continue.",
      );
      return;
    }

    console.log("selectedPayment state:", JSON.stringify(selectedPayment));

    try {
      const res = await bookDelivery({
        pickup_address: route.params?.pickup ?? "",
        pickup_lat: route.params?.pickupCoords?.latitude ?? 0,
        pickup_lng: route.params?.pickupCoords?.longitude ?? 0,
        dropoff_address: route.params?.dropoff ?? "",
        dropoff_lat: route.params?.dropoffCoords?.latitude ?? 0,
        dropoff_lng: route.params?.dropoffCoords?.longitude ?? 0,
        item_description: route.params?.itemType ?? "",
        vehicle_type: (route.params?.vehicleType === "e-motorcycle"
          ? "motorcycle"
          : "bicycle") as any,
        special_instructions: route.params?.specialInstructions,
        payment_method:
          selectedPayment.method === "bundle_credit"
            ? "bundle"
            : selectedPayment.method,
        payment_method_id: selectedPayment.payment_method_id, // ← add this
        price_ghs: route.params?.price ?? 0,
        ...(isScheduled
          ? {
              scheduled_at: buildScheduledAt(
                route.params?.scheduledDate,
                route.params?.scheduledTime,
              ),
            }
          : {}),
      });

      const orderId =
        (res as any)?.data?.order?.id ?? (res as any)?.data?.data?.order?.id;

      if (isScheduled) {
        navigation.navigate("DeliveryComplete", {
          ...route.params,
          isScheduled: true,
        });
      } else {
        navigation.navigate("RiderMatching", { ...route.params, orderId });
      }
    } catch (err: any) {
      toast.error(
        "Booking failed",
        err?.message ?? "Could not place order. Please try again.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CloseXSvg width={18} height={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Delivery</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Route ── */}
        <SectionLabel label="Route" />

        {/* Route rows */}
        <View style={{ flexDirection: "row", gap: 14 }}>
          {/* Left icon column: box → dashed line → pin */}
          <View style={{ width: 40, alignItems: "center" }}>
            <Image
              source={require("../../assets/images/parcel_box.png")}
              style={styles.routeIconImg}
              resizeMode="contain"
            />
            <DashedLine />
            <PinLocationSvg width={20} height={24} />
          </View>

          {/* Right text column */}
          <View style={{ flex: 1, justifyContent: "space-between" }}>
            {/* Pickup — aligned with box icon */}
            <View style={{ paddingTop: 2, height: 40 }}>
              <Text style={styles.routePrimary}>{senderName}</Text>
              <Text style={styles.routeSecondary}>{pickup}</Text>
              <Text style={styles.routeSecondary}>{itemType}</Text>
            </View>

            {/* Spacer matches DashedLine height */}
            <View style={{ height: 44 }} />

            {/* Dropoff — aligned with pin icon */}
            <View style={{ paddingBottom: 2 }}>
              <Text style={styles.routePrimary}>Recipient</Text>
              <Text style={styles.routeSecondary}>{dropoff}</Text>
            </View>
          </View>
        </View>

        {/* ── Pick-up Time ── */}
        {isScheduled && (
          <>
            <View style={styles.sectionGap} />
            <SectionLabel label="Pick - up time" />
            <View style={styles.pickupRow}>
              <Image
                source={require("../../assets/images/bicycle_vehicle.png")}
                style={styles.pickupVehicleImg}
              />
              <View>
                <Text style={styles.pickupLabel}>Scheduled pick - up</Text>
                <Text style={styles.pickupTime}>{scheduledTime}</Text>
                <Text style={styles.pickupDate}>{scheduledDate}</Text>
              </View>
            </View>
          </>
        )}

        {/* ── Payment Mode ── */}
        <View style={styles.sectionGap} />
        <SectionLabel label="Payment mode" />

        <TouchableOpacity
          style={styles.paymentCard}
          onPress={() =>
            navigation.navigate("PayWith", {
              ...route.params,
              returnTo: "ReviewDelivery",
            })
          }
          activeOpacity={0.75}
        >
          <View style={styles.paymentIconWrap}>
            <PaymentIcon method={selectedPayment} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentLabel}>
              {selectedPayment?.label ??
                paymentMethod ??
                "Select payment method"}
            </Text>
            <Text style={styles.paymentChangeHint}>Tap to change</Text>
          </View>
          <Text style={styles.paymentPrice}>GHS {price}.00</Text>
          <ChevronRightSvg width={8} height={14} />
        </TouchableOpacity>

        <View style={{ height: 28 }} />

        {/* Terms & Conditions — only relevant for scheduled deliveries */}
        {isScheduled && (
          <TouchableOpacity
            onPress={() => navigation.navigate("TermsCondition")}
            activeOpacity={0.7}
          >
            <Text style={styles.termsLink}>
              Scheduled delivery{"\n"}terms and conditions
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (!selectedPayment || isBooking || isLoadingPayments) && {
              opacity: 0.5,
            },
          ]}
          onPress={handleConfirm}
          disabled={!selectedPayment || isBooking || isLoadingPayments}
          activeOpacity={0.85}
        >
          {isBooking ? (
            <ActivityIndicator color={Colors.textPrimary} />
          ) : (
            <Text style={styles.confirmBtnText}>
              {isScheduled ? "Reserve Courier" : "Confirm Booking"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.text}>{label}</Text>
      <View style={sectionStyles.line} />
    </View>
  );
}

function DashedLine() {
  return (
    <View
      style={{ height: 44, justifyContent: "center", alignItems: "center" }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 1.5,
            height: 5,
            backgroundColor: "#C8D0DC",
            marginVertical: 2,
          }}
        />
      ))}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  text: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 15,
    color: Colors.navy,
    flexShrink: 0,
    letterSpacing: 0.1,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.white,
  },
  closeBtn: {
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

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },

  routeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  routeIconWrap: {
    width: 40,
    alignItems: "center",
    paddingTop: 2,
  },
  routeIconImg: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    borderRadius: 8,
  },
  routeTextWrap: { flex: 1 },
  routePrimary: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  routeSecondary: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
  },

  dashedLineWrap: {
    // paddingLeft: 20,
    // marginVertical: -4,
  },

  sectionGap: { height: 24 },

  pickupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  pickupVehicleImg: {
    width: 60,
    height: 44,
    resizeMode: "contain",
  },
  pickupLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  pickupTime: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  pickupDate: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Colors.textPrimary,
    marginTop: 1,
  },

  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  paymentIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentChangeHint: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  paymentLabel: {
    flex: 1,
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  paymentPrice: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },

  termsLink: {
    fontFamily: "Poppins-ExtraBold",
    fontWeight: "500",
    fontSize: 14,
    color: Colors.navy,
    lineHeight: 22,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
    paddingTop: 8,
    backgroundColor: Colors.white,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});
