import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Image,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";

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

const CURRENT_PLAN = {
  id: "starter",
  name: "Starter Pack",
  deliveries: "5 Deliveries",
  expiry: "Expires in 30 days",
  price: "GHS 75.00",
  priceNum: 75,
};

export default function TopupScreen() {
  const navigation = useNavigation<any>();
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

  const handleProceed = () => {
    navigation.navigate("DeliveryFlow", {
      screen: "PayWith",
      params: {
        vehicleType: "bicycle",
        price: CURRENT_PLAN.priceNum,
        pickup: "",
        dropoff: "",
      },
    });
  };

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
          <ArrowBackSvg width={60} height={60} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top up</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.subtitle}>Current Plan</Text>

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        <View style={styles.planCard}>
          {/*
            Replace with:
          */}
          {/* <Image
            source={{ uri: 'https://via.placeholder.com/56x56/F5F5F5/888.png?text=🏅' }}
            style={styles.medalImg}
            resizeMode="contain"
          /> */}
          <Image
            source={require("../../assets/images/medal_icon.png")}
            style={styles.medalImg}
            resizeMode="contain"
          />

          <View style={styles.planInfo}>
            <Text style={styles.planName}>{CURRENT_PLAN.name}</Text>
            <Text style={styles.planDeliveries}>{CURRENT_PLAN.deliveries}</Text>
            <Text style={styles.planExpiry}>{CURRENT_PLAN.expiry}</Text>
          </View>

          <Text style={styles.planPrice}>{CURRENT_PLAN.price}</Text>

          {/* Always-selected radio */}
          <View style={styles.radioOuter}>
            <View style={styles.radioInner} />
          </View>
        </View>
      </Animated.View>

      <View style={{ flex: 1 }} />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.proceedBtn}
          onPress={handleProceed}
          activeOpacity={0.85}
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

  content: {
    paddingHorizontal: 20,
  },

  planCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.navy,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: Colors.white,
  },
  medalImg: {
    width: 56,
    height: 56,
  },
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
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});
