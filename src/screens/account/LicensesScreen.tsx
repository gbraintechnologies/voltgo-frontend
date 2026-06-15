/**
 * LicensesScreen.tsx
 * Open-source licences used in VoltGo
 */

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  TextInput,
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
  border: "#EFEFEF",
  sectionBg: "#F8F9FB",
  codeBg: "#0B1F3A",
  mitBg: "#EBF5FF",
  mitText: "#1D4ED8",
  apacheBg: "#FFF7ED",
  apacheText: "#C2410C",
  bsdBg: "#F5F3FF",
  bsdText: "#7C3AED",
  isaBg: "#F0FBF2",
  isaText: "#16A34A",
};

type LicenceType = "MIT" | "Apache-2.0" | "BSD-3-Clause" | "ISC" | "CC0";

interface Package {
  name: string;
  version: string;
  licence: LicenceType;
  description: string;
}

const PACKAGES: Package[] = [
  { name: "react-native", version: "0.76.x", licence: "MIT", description: "Framework for building native apps using React" },
  { name: "react", version: "18.x", licence: "MIT", description: "JavaScript library for building user interfaces" },
  { name: "@react-navigation/native", version: "7.x", licence: "MIT", description: "Routing and navigation for React Native apps" },
  { name: "@react-navigation/native-stack", version: "7.x", licence: "MIT", description: "Native stack navigator for React Navigation" },
  { name: "@react-navigation/bottom-tabs", version: "7.x", licence: "MIT", description: "Bottom tab navigator for React Navigation" },
  { name: "react-native-maps", version: "1.x", licence: "MIT", description: "Map components for iOS and Android" },
  { name: "react-native-google-places-autocomplete", version: "2.x", licence: "MIT", description: "Customisable Google Places autocomplete component" },
  { name: "@tanstack/react-query", version: "5.x", licence: "MIT", description: "Async state management for server data" },
  { name: "zustand", version: "5.x", licence: "MIT", description: "Lightweight state management library" },
  { name: "react-native-safe-area-context", version: "4.x", licence: "MIT", description: "Handles safe area insets for notched devices" },
  { name: "react-native-svg", version: "15.x", licence: "MIT", description: "SVG library for React Native" },
  { name: "react-native-reanimated", version: "3.x", licence: "MIT", description: "Declarative animations for React Native" },
  { name: "react-native-gesture-handler", version: "2.x", licence: "MIT", description: "Native touch gesture handling" },
  { name: "react-native-bottom-sheet", version: "5.x", licence: "MIT", description: "Performant interactive bottom sheet component" },
  { name: "axios", version: "1.x", licence: "MIT", description: "Promise-based HTTP client" },
  { name: "react-hook-form", version: "7.x", licence: "MIT", description: "Performant, flexible form state management" },
  { name: "date-fns", version: "3.x", licence: "MIT", description: "Modern JavaScript date utility library" },
  { name: "@react-native-async-storage/async-storage", version: "2.x", licence: "MIT", description: "Asynchronous key-value storage for React Native" },
  { name: "react-native-mmkv", version: "3.x", licence: "MIT", description: "Extremely fast key-value storage" },
  { name: "expo-location", version: "17.x", licence: "MIT", description: "Library for reading geolocation on device" },
  { name: "expo-image", version: "2.x", licence: "MIT", description: "Fast, cross-platform image component" },
  { name: "lottie-react-native", version: "7.x", licence: "Apache-2.0", description: "Renders Adobe After Effects animations natively" },
  { name: "react-native-vector-icons", version: "10.x", licence: "MIT", description: "Customisable icon sets for React Native" },
  { name: "react-native-linear-gradient", version: "3.x", licence: "MIT", description: "Linear gradient component" },
  { name: "react-native-skeleton-placeholder", version: "5.x", licence: "MIT", description: "Skeleton loading placeholder" },
  { name: "react-native-toast-message", version: "2.x", licence: "MIT", description: "Customisable toast notifications" },
  { name: "react-native-phone-number-input", version: "2.x", licence: "MIT", description: "Phone number input with country code picker" },
];

const LICENCE_BADGE: Record<LicenceType, { bg: string; color: string }> = {
  "MIT": { bg: Colors.mitBg, color: Colors.mitText },
  "Apache-2.0": { bg: Colors.apacheBg, color: Colors.apacheText },
  "BSD-3-Clause": { bg: Colors.bsdBg, color: Colors.bsdText },
  "ISC": { bg: Colors.isaBg, color: Colors.isaText },
  "CC0": { bg: Colors.sectionBg, color: Colors.textSecondary },
};

export default function LicensesScreen() {
  const navigation = useNavigation<any>();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [query, setQuery] = useState("");

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const filtered = query.trim()
    ? PACKAGES.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.licence.toLowerCase().includes(query.toLowerCase())
      )
    : PACKAGES;

  // Group by licence type for the summary row
  const licenceCounts = PACKAGES.reduce<Record<string, number>>((acc, p) => {
    acc[p.licence] = (acc[p.licence] ?? 0) + 1;
    return acc;
  }, {});

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
        <Text style={styles.headerTitle}>Licences</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View style={{ opacity: fadeIn, flex: 1 }}>
        {/* Summary row */}
        <View style={styles.summaryRow}>
          {Object.entries(licenceCounts).map(([lic, count]) => {
            const badge = LICENCE_BADGE[lic as LicenceType] ?? { bg: Colors.sectionBg, color: Colors.textSecondary };
            return (
              <View key={lic} style={[styles.summaryBadge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.summaryBadgeText, { color: badge.color }]}>
                  {lic} ×{count}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search packages or licences…"
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.countLabel}>
            {filtered.length} package{filtered.length !== 1 ? "s" : ""}
          </Text>

          <View style={styles.card}>
            {filtered.map((pkg, i) => {
              const badge = LICENCE_BADGE[pkg.licence] ?? { bg: Colors.sectionBg, color: Colors.textSecondary };
              return (
                <View
                  key={pkg.name}
                  style={[
                    styles.row,
                    i < filtered.length - 1 && styles.rowBorder,
                  ]}
                >
                  <View style={styles.rowTop}>
                    <Text style={styles.pkgName}>{pkg.name}</Text>
                    <View style={[styles.licBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.licBadgeText, { color: badge.color }]}>
                        {pkg.licence}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rowBottom}>
                    <Text style={styles.pkgDescription}>{pkg.description}</Text>
                    <Text style={styles.pkgVersion}>v{pkg.version}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={styles.footer}>
            VoltGo is grateful to all the open-source contributors who made these libraries possible.
          </Text>

          <View style={{ height: 48 }} />
        </ScrollView>
      </Animated.View>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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

  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  summaryBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  summaryBadgeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.sectionBg,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 12,
    gap: 8,
    height: 46,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    fontSize: 13,
    color: Colors.textMuted,
    paddingHorizontal: 4,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 12 },

  countLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    backgroundColor: Colors.white,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 8,
  },
  pkgName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  licBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  licBadgeText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 10,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
  },
  pkgDescription: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  pkgVersion: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: Colors.textMuted,
    flexShrink: 0,
  },

  footer: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 20,
    paddingHorizontal: 16,
  },
});