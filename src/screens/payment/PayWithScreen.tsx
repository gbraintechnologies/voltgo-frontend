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
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { DeliveryStackParamList } from "../../navigation/types";
import CloseXSvg from "../../assets/icons/arrow_back.svg";
import ChevronRightSvg from "../../assets/icons/chevron_right.svg";
import WalletSvg from "../../assets/icons/topup_icon.svg";
type RouteParams = RouteProp<DeliveryStackParamList, "PayWith">;
type PaymentId = "bundle" | "mtn" | "visa";

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
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const { vehicleType, price, pickup, dropoff } = route.params ?? {};

  const [selected, setSelected] = useState<PaymentId>("bundle");
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CloseXSvg width={60} height={58} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay With</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── VoltGo Bundle Credit Section ── */}
        <Text style={styles.sectionTitle}>VoltGo Bundle Credit</Text>

        <TouchableOpacity
          style={[
            styles.bundleCard,
            selected === "bundle" && styles.bundleCardSelected,
          ]}
          onPress={() => setSelected("bundle")}
          activeOpacity={0.8}
        >
          {/* VoltGo logo */}
          <View style={styles.voltLogoBox}>
            {/*
              Replace with:
            */}
            {/* <Image
              source={{ uri: 'https://via.placeholder.com/46x46/4CD964/0B1F3A.png?text=VG' }}
              style={styles.voltLogoImg}
            /> */}
            <Image
              source={require("../../assets/images/voltgo_logo.png")}
              style={styles.voltLogoImg}
              resizeMode="contain"
            />
          </View>

          <View style={styles.bundleInfo}>
            <Text style={styles.bundleName}>Bundle Credits</Text>
            <Text style={styles.bundleDetail}>3 deliveries left</Text>
          </View>

          {/* Wallet icon + radio */}
          <View style={styles.bundleRight}>
            {/* Replace with: */}
            <View style={styles.walletIconPlaceholder}>
              <WalletSvg width={22} height={20} />
            </View>
            <View
              style={[
                styles.radioOuter,
                selected === "bundle" && styles.radioOuterActive,
              ]}
            >
              {selected === "bundle" && <View style={styles.radioInner} />}
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Payment Methods Section ── */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Payment Methods
        </Text>

        <View style={styles.methodsCard}>
          {/* MTN Row */}
          <TouchableOpacity
            style={[styles.methodRow]}
            onPress={() => setSelected("mtn")}
            activeOpacity={0.75}
          >
            {/* MTN Logo — replace with: <Image source={require('../../assets/images/mtn_logo.png')} style={styles.methodLogoImg} resizeMode="contain" /> */}
            <Image
              source={require("../../assets/images/mtn_logo.png")}
              style={styles.methodLogoImg}
              resizeMode="contain"
            />
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>Cephas Ntiamoah</Text>
              <Text style={styles.methodDetail}>0546785064</Text>
            </View>
            {selected === "mtn" && <View style={styles.selectedDot} />}
          </TouchableOpacity>

          {/* VISA Row */}
          <TouchableOpacity
            style={styles.methodRow}
            onPress={() => setSelected("visa")}
            activeOpacity={0.75}
          >
            {/* VISA Logo — replace with: <Image source={require('../../assets/images/visa_logo.png')} style={styles.methodLogoImg} resizeMode="contain" /> */}
            <Image
              source={require("../../assets/images/visa_logo.png")}
              style={styles.methodLogoImg}
              resizeMode="contain"
            />
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>Cephas Ntiamoah</Text>
              <Text style={styles.methodDetail}>4567 8899 3434 7765</Text>
            </View>
            {selected === "visa" && <View style={styles.selectedDot} />}
          </TouchableOpacity>
        </View>

        {/* ── Add Payment Method ── */}
        <View style={styles.addDivider} />
        <TouchableOpacity
          style={styles.addRow}
          onPress={() => navigation.navigate("AddPaymentMethod")}
          activeOpacity={0.75}
        >
          <Text style={styles.addPlus}>+</Text>
          <Text style={styles.addLabel}>Add payment method</Text>
        </TouchableOpacity>
      </Animated.ScrollView>

      {price !== undefined && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => {
              navigation.navigate("DeliveryFlow", { screen: "RiderMatching" });
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>
              {/* Confirm{price ? ` · GHS ${price}` : ""} */}
               Confirm
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 16,
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
    paddingTop: 8,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 16,
    color: Colors.navy,
    marginBottom: 12,
    letterSpacing: 0.1,
  },

  // Bundle Card
  bundleCard: {
    flexDirection: "row",
    alignItems: "center",
    // borderWidth: 1.5,
    // borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bundleCardSelected: {
    borderColor: Colors.navy,
    borderWidth: 2,
  },
  voltLogoBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
    // backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  voltLogoImg: {
    width: 68,
    height: 68,
    borderRadius: 16,
  },
  bundleInfo: {
    flex: 1,
  },
  bundleName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  bundleDetail: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  bundleRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  walletIconPlaceholder: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#C0C0C0",
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

  // Methods Card
  methodsCard: {
    gap: 12,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
    backgroundColor: Colors.white,
    // borderRadius: 16,
    // borderWidth: 1.5,
    // borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderRadius: 15,
  },

  methodLogoBox: {
    width: 56,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  methodLogoImg: {
    width: 56,
    height: 38,
    borderRadius: 8,
  },
  methodLogoText: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 14,
    color: Colors.navy,
    letterSpacing: 0.5,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  methodDetail: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.navy,
  },

  // Add row
  addDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 24,
    marginBottom: 16,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 6,
  },
  addPlus: {
    fontFamily: "Poppins-Regular",
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  addLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
  },
  confirmBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 17,
    color: " gitblack",
    letterSpacing: 0.3,
  },
  // Update methodLogoBox to be image-only:
});
