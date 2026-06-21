import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  Image,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import PinLocationSvg from "../../assets/icons/pin_location.svg";
import BundleCreditsSvg from "../../assets/icons/bundle_credits.svg";
import { Order } from "../../api/orders";
import { useOrderPolling } from "@/hooks/useApi";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
  border: "#EFEFEF",
  successBg: "#EDFBF1",
  successText: "#1A8A3C",
  bundleIcon: "#3B9EFF",
  bundleIconBg: "#E8F4FF",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString("en", { month: "long" })} ${d.getFullYear()} · ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function PastActivityDetailScreen() {
  const navigation = useNavigation<any>();
  const route =
    useRoute<RouteProp<{ params: { activity: Order } }, "params">>();
  const { activity: paramActivity } = route.params;

  const { data: liveOrder } = useOrderPolling(paramActivity.id);
  const activity = liveOrder ?? paramActivity;

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 320,
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

  const status = activity.status === "delivered" ? "delivered" : "cancelled";
  const amountFormatted = `GHS ${Number(activity.price_ghs ?? 0).toFixed(2)}`;
  const vehicleLabel =
    activity.vehicle_type === "bicycle" ? "Bicycle" : "E-Moto";
  const isDelivered = status === "delivered";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowBackSvg width={60} height={58} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            isDelivered ? styles.statusDelivered : styles.statusCancelled,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isDelivered ? Colors.successText : "#EF4444",
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isDelivered ? Colors.successText : "#EF4444" },
            ]}
          >
            {isDelivered ? "Delivered" : "Cancelled"}
          </Text>
        </View>

        {/* Amount hero */}
        <View style={styles.amountHero}>
          <Text style={styles.amountValue}>{amountFormatted}</Text>
          <Text style={styles.amountDate}>
            {formatDate(activity.created_at)}
          </Text>
        </View>

        {/* Vehicle + Delivery ID row */}
        <View style={styles.metaRow}>
          <View style={styles.vehicleChip}>
            <Image
              source={
                activity.vehicle_type === "bicycle"
                  ? require("../../assets/images/bicycle_small.png")
                  : require("../../assets/images/emoto_small.png")
              }
              style={styles.vehicleImg}
              resizeMode="contain"
            />
            <Text style={styles.vehicleLabel}>{vehicleLabel}</Text>
          </View>
          <Text style={styles.deliveryId}>
            #{activity.id.slice(-8).toUpperCase()}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Route */}
        <SectionLabel label="Route" />

        <View style={styles.routeCard}>
          {/* Pickup row */}
          <View style={styles.routeRow}>
            <View style={styles.routeDotWrap}>
              <View style={styles.routeDotGreen} />
            </View>
            <View style={styles.routeTextWrap}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeValue}>{activity.pickup_address}</Text>
            </View>
          </View>

          {/* Dashed connector */}
          <View style={styles.routeConnector}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={styles.dashSegment} />
            ))}
          </View>

          {/* Dropoff row */}
          <View style={styles.routeRow}>
            <View style={styles.routeDotWrap}>
              <PinLocationSvg width={18} height={22} />
            </View>
            <View style={styles.routeTextWrap}>
              <Text style={styles.routeLabel}>Drop-off</Text>
              <Text style={styles.routeValue}>{activity.dropoff_address}</Text>
            </View>
          </View>
        </View>

        {/* Package Details */}
        <View style={styles.sectionGap} />
        <SectionLabel label="Package" />

        <View style={styles.detailCard}>
          <DetailRow
            label="Item type"
            value={activity.item_description ?? "Parcel"}
          />
          {activity.special_instructions ? (
            <DetailRow
              label="Instructions"
              value={activity.special_instructions}
              last
            />
          ) : (
            <DetailRow label="Recipient" value="N/A" last />
          )}
        </View>

        {/* Payment */}
        <View style={styles.sectionGap} />
        <SectionLabel label="Payment" />

        <View style={styles.paymentCard}>
          <View style={styles.paymentIconWrap}>
            <BundleCreditsSvg width={60} height={56} />
          </View>
          <Text style={styles.paymentLabel}>
            {activity.payment_method === "bundle_credit"
              ? "Bundle Credits"
              : (activity.payment_method ?? "—")}
          </Text>
          <Text style={styles.paymentPrice}>{amountFormatted}</Text>
        </View>

        {/* Repeat CTA — only for delivered orders */}
        {isDelivered && (
          <>
            <View style={styles.sectionGap} />
            <TouchableOpacity
              style={styles.repeatBtn}
              onPress={() =>
                navigation.navigate("ChooseRoute", {
                  prefillPickup: activity.pickup_address,
                  prefillDropoff: activity.dropoff_address,
                })
              }
              activeOpacity={0.85}
            >
              <Image
                source={require("../../assets/images/repeat.png")}
                style={{ width: 18, height: 18 }}
              />
              <Text style={styles.repeatBtnText}>Repeat delivery</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.ScrollView>
    </View>
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

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[detailStyles.row, !last && detailStyles.rowBorder]}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  text: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 15,
    color: Colors.navy,
    flexShrink: 0,
  },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
});

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  value: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 16,
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
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48 },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusDelivered: { backgroundColor: Colors.successBg },
  statusCancelled: { backgroundColor: "#FEF2F2" },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: "Poppins-SemiBold", fontSize: 13 },

  amountHero: { marginBottom: 16 },
  amountValue: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 38,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  amountDate: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  vehicleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#eee",
  },
  vehicleImg: { width: 36, height: 28 },
  vehicleLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Colors.textPrimary,
  },
  deliveryId: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },

  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 24 },

  routeCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  routeRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  routeDotWrap: { width: 20, alignItems: "center", paddingTop: 3 },
  routeDotGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  routeTextWrap: { flex: 1 },
  routeLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  routeValue: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  routeConnector: { paddingLeft: 9, marginVertical: 6, gap: 3 },
  dashSegment: {
    width: 1.5,
    height: 5,
    backgroundColor: "#C8D0DC",
    marginVertical: 1.5,
  },

  detailCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
  },

  sectionGap: { height: 24 },

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
  paymentLabel: {
    flex: 1,
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  paymentPrice: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },

  repeatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
  },
  repeatBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});


