/**
 * AccountScreen.tsx — FIXED
 *
 * Fixes applied:
 *  1. Replaced Alert.alert logout with ConfirmModal (danger variant)
 *  2. Replaced Alert.alert delete with ConfirmModal (danger variant)
 *  3. Navigation for logout/delete now uses useAuthStore reset instead of
 *     navigation.navigate('PhoneAuth') — conditional rendering in your
 *     root navigator handles the redirect automatically once auth is cleared.
 *     If you DO have a named screen, replace REPLACE_WITH_YOUR_AUTH_SCREEN
 *     with the correct name (e.g. 'Auth', 'Login', 'Onboarding').
 *  4. profile?.full_name (API returns full_name, not fullName)
 */

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ChevronRightSvg from "../../assets/icons/chevron_right.svg";
import PersonIconSvg from "../../assets/icons/person_icon.svg";
import CardIconSvg from "../../assets/icons/card_icon.svg";
import MedalIconSvg from "../../assets/icons/medal_icon2.svg";
import BellIconSvg from "../../assets/icons/bell_icon.svg";
import ShieldIconSvg from "../../assets/icons/shield_icon.svg";
import ChatIconSvg from "../../assets/icons/chat_icon.svg";
import SettingsIconSvg from "../../assets/icons/settings_icon.svg";
import { useCustomerProfile, useLogout } from "../../hooks/useApi";
import { useAuthStore } from "../../stores/authStore";
import ConfirmModal from "../../components/common/ConfirmModal"; // adjust path as needed

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textMuted: "#9CA3AF",
  border: "#EFEFEF",
  inputBg: "#F2F4F7",
  logoutRed: "#EF4444",
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
    label: "Notification Settings",
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

  // ─── Modal state ──────────────────────────────────────────────────────────
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const { data: profileRes, isLoading } = useCustomerProfile();
  const storedCustomer = useAuthStore((s: any) => s.customer);
  const clearAuth = useAuthStore((s: any) => s.clearAuth); // expose this from your store
  const logoutMutation = useLogout();

  // ─── FIX: API returns full_name (snake_case), not fullName ───────────────
  const profile = profileRes?.data ?? storedCustomer;

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
        navigation.navigate("BundlesCredits");
        break;
      case "PaymentMethods":
        navigation.navigate("PaymentMethods");
        break;
      default:
        navigation.navigate(route);
        break;
    }
  };

  // ─── Logout ───────────────────────────────────────────────────────────────
  const handleLogoutConfirm = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setLogoutModalVisible(false);
        // Auth store clears → root navigator redirects automatically.
        // If you need manual navigation, replace with:
        // navigation.reset({ index: 0, routes: [{ name: 'YourAuthScreen' }] });
      },
    });
  };

  // ─── Delete account ───────────────────────────────────────────────────────
  const handleDeleteConfirm = () => {
    // TODO: call your delete-account API mutation here, then clear auth.
    // For now we just clear auth and close:
    setDeleteModalVisible(false);
    clearAuth?.();
    // navigation.reset({ index: 0, routes: [{ name: 'YourAuthScreen' }] });
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
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.navy} />
            ) : (
              <>
                {/* FIX: full_name not fullName */}
                <Text style={styles.userName}>
                  {profile?.full_name ?? profile?.fullName ?? "—"}
                </Text>
                <Text style={styles.userEmail}>{profile?.phone ?? "—"}</Text>
              </>
            )}
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

        {/* Logout button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setLogoutModalVisible(true)}
          activeOpacity={0.75}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />

        {/* Delete account button */}
        {/* <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => setDeleteModalVisible(true)}
          activeOpacity={0.75}
        >
          <Text style={styles.deleteText}>Delete account</Text>
        </TouchableOpacity> */}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* ── Logout confirmation modal ──────────────────────────────────────── */}
      <ConfirmModal
        visible={logoutModalVisible}
        title="Log out"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Log out"
        cancelLabel="Cancel"
        variant="danger"
        loading={logoutMutation.isPending}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutModalVisible(false)}
      />

      {/* ── Delete account confirmation modal ─────────────────────────────── */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete account"
        message={
          "This will permanently delete your account and all your data. This action cannot be undone."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalVisible(false)}
      />
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
    fontFamily: "Poppins-SemiBold",
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
  logoutBtn: {
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: Colors.logoutRed,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  logoutText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.logoutRed,
  },
  deleteBtn: {
    borderWidth: 1.5,
    borderColor: "#E05252",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  deleteText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: "#E05252",
  },
});
