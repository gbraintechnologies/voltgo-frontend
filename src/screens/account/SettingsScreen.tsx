/**
 * SettingsScreen.tsx — FIXED
 *
 * Fixes applied:
 *  1. Replaced Alert.alert for logout with ConfirmModal
 *  2. Replaced Alert.alert for delete with ConfirmModal
 *  3. Removed navigation.navigate('PhoneAuth') — auth store clears and
 *     root navigator redirects automatically. Add manual reset if needed.
 */

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import ChevronRightSvg from "../../assets/icons/chevron_right.svg";
import { useLogout } from "../../hooks/useApi";
import { useAuthStore } from "../../stores/authStore";
import ConfirmModal from "../../components/common/ConfirmModal"; // adjust path as needed

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textMuted: "#9CA3AF",
  border: "#EFEFEF",
};

const ABOUT_ITEMS = [
  { label: "Terms & Conditions" },
  { label: "Privacy Policy" },
  { label: "Licences" },
];

export default function SettingsScreen() {
  const navigation    = useNavigation<any>();
  const fadeIn        = useRef(new Animated.Value(0)).current;
  const logoutMutation = useLogout();
  const clearAuth      = useAuthStore((s: any) => s.clearAuth);

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const handleLogoutConfirm = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setLogoutModalVisible(false);
        // Auth store clears → root navigator redirects automatically.
        // Manual override if needed:
        // navigation.reset({ index: 0, routes: [{ name: 'YourAuthScreen' }] });
      },
    });
  };

  const handleDeleteConfirm = () => {
    // TODO: wire up delete-account API call here
    setDeleteModalVisible(false);
    clearAuth?.();
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          {ABOUT_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.row, index < ABOUT_ITEMS.length - 1 && styles.rowBorder]}
              activeOpacity={0.7}
            >
              <Text style={[styles.rowLabel, { flex: 1 }]}>{item.label}</Text>
              <ChevronRightSvg width={8} height={14} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.version}>VoltGo v1.0.0</Text>

        {/* <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={() => setLogoutModalVisible(true)}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity> */}

        <View style={{ height: 16 }} />

        <TouchableOpacity
          style={styles.dangerBtn}
          activeOpacity={0.8}
          onPress={() => setDeleteModalVisible(true)}
        >
          <Text style={styles.dangerText}>Delete account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* ── Logout modal ──────────────────────────────────────────────────── */}
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

      {/* ── Delete account modal ──────────────────────────────────────────── */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete account"
        message="This will permanently delete your account and all your data. This action cannot be undone."
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 14,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 19,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  headerSpacer: { width: 32 },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  sectionTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
    color: Colors.navy,
    marginBottom: 10,
    letterSpacing: 0.1,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  version: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  logoutBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 17,
    alignItems: "center",
  },
  logoutText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  dangerBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E05252",
    paddingVertical: 17,
    alignItems: "center",
  },
  dangerText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: "#E05252",
  },
});