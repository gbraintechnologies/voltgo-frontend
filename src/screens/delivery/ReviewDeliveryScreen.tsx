import React, { useEffect, useRef } from "react";
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
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { DeliveryStackParamList } from "../../navigation/types";
import CloseXSvg from "../../assets/icons/close_x.svg";
import PinLocationSvg from "../../assets/icons/pin_location.svg";
import BundleCreditsSvg from "../../assets/icons/bundle_credits.svg";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(18)).current;

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

  const handleConfirm = () =>
    navigation.navigate("RiderMatching", route.params);

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

        {/* Sender row */}
        <View style={styles.routeRow}>
          <View style={styles.routeIconWrap}>
            {/*
              Replace with:
              <Image source={require('../../assets/images/parcel_box.png')} style={styles.routeIconImg} />
            */}
            {/* <Image
              source={{
                uri: "https://via.placeholder.com/40x40/F2F4F7/1A1A2E.png?text=📦",
              }}
              style={styles.routeIconImg}
            /> */}
                          <Image source={require('../../assets/images/parcel_box.png')} style={styles.routeIconImg} />

          </View>
          <View style={styles.routeTextWrap}>
            <Text style={styles.routePrimary}>{senderName}</Text>
            <Text style={styles.routeSecondary}>{pickup}</Text>
            <Text style={styles.routeSecondary}>{itemType}</Text>
          </View>
        </View>

        {/* Dashed connector */}
        <View style={styles.dashedLineWrap}>
          <DashedLine />
        </View>

        {/* Recipient row */}
        <View style={styles.routeRow}>
          <View style={styles.routeIconWrap}>
            <PinLocationSvg width={20} height={24} />
          </View>
          <View style={styles.routeTextWrap}>
            <Text style={styles.routePrimary}>Recipient</Text>
            <Text style={styles.routeSecondary}>{dropoff}</Text>
          </View>
        </View>

        {/* ── Pick-up Time ── */}
        <View style={styles.sectionGap} />
        <SectionLabel label="Pick - up time" />

        <View style={styles.pickupRow}>
          {/*
            Replace with:
          */}
          {/* <Image
            source={{
              uri: "https://via.placeholder.com/60x44/F2F4F7/1A1A2E.png?text=🚲",
            }}
            style={styles.pickupVehicleImg}
          /> */}
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

        {/* ── Payment Mode ── */}
        <View style={styles.sectionGap} />
        <SectionLabel label="Payment mode" />

        <View style={styles.paymentCard}>
          <View style={styles.paymentIconWrap}>
            <BundleCreditsSvg width={50} height={46} />
          </View>
          <Text style={styles.paymentLabel}>{paymentMethod}</Text>
          <Text style={styles.paymentPrice}>GHS {price}.00</Text>
        </View>

        <View style={{ height: 28 }} />

        <TouchableOpacity>
          <Text style={styles.termsLink}>
            Scheduled delivery{"\n"}terms and conditions
          </Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm delivery</Text>
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
    paddingLeft: 20,
    marginVertical: -4,
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
    // backgroundColor: Colors.bundleIconBg,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  paymentIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    // backgroundColor: Colors.bundleIcon,
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: 500,
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
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});
