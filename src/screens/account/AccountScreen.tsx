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
import ChevronRightSvg from "../../assets/icons/chevron_right.svg";

// ── Import your downloaded SVG icons from Figma ───────────────────────────────
import PersonIconSvg from "../../assets/icons/person_icon.svg";
import CardIconSvg from "../../assets/icons/card_icon.svg";
import MedalIconSvg from "../../assets/icons/medal_icon2.svg";
import BellIconSvg from "../../assets/icons/bell_icon.svg";
import ShieldIconSvg from "../../assets/icons/shield_icon.svg";
import ChatIconSvg from "../../assets/icons/chat_icon.svg";
import SettingsIconSvg from "../../assets/icons/settings_icon.svg";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textMuted: "#9CA3AF",
  border: "#EFEFEF",
  inputBg: "#F2F4F7",
};

const MENU_ITEMS = [
  { id: "profile", label: "Profile", Icon: PersonIconSvg, route: "Profile" },
  {
    id: "payment",
    label: "Payment methods",
    Icon: CardIconSvg,
    route: "PaymentMethods",
  },
  {
    id: "bundles",
    label: "Bundles/Credits",
    Icon: MedalIconSvg,
    route: "BundlesCredits",
  },
  {
    id: "notifications",
    label: "Notifications",
    Icon: BellIconSvg,
    route: "Notifications",
  },
  { id: "security", label: "Security", Icon: ShieldIconSvg, route: "Security" },
  { id: "support", label: "Support", Icon: ChatIconSvg, route: "Support" },
  {
    id: "settings",
    label: "Settings",
    Icon: SettingsIconSvg,
    route: "Settings",
  },
];

export default function AccountScreen() {
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

  const handleMenuPress = (route: string) => {
    switch (route) {
      case "BundlesCredits":
        navigation.navigate("BundlesCredits"); // plain push, no BundlesFlow wrapper
        break;
      case "PaymentMethods":
      // Navigate within DeliveryFlow to PayWith
      case "PaymentMethods":
        navigation.navigate("PaymentMethods"); 
        break;
        break;
      // These all live in AccountStackNavigator — navigate directly by name
      case "Profile":
      case "Notifications":
      case "Security":
      case "Support":
      case "Settings":
        navigation.navigate(route);
        break;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <Image
            source={require("../../assets/images/rider_john.png")}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Cephas Ntiamoah</Text>
            <Text style={styles.userEmail}>cephasntiamoah10@gmail.com</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuRow,
                index < MENU_ITEMS.length - 1 && styles.menuRowBorder,
              ]}
              onPress={() => handleMenuPress(item.route)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <item.Icon width={22} height={22} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronRightSvg width={8} height={14} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 12,
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  title: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 20,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  userInfo: { flex: 1 },
  userName: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  userEmail: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  menuList: { overflow: "hidden" },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    gap: 14,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIconWrap: { width: 26, alignItems: "center", justifyContent: "center" },
  menuLabel: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: Colors.textPrimary,
  },
});
