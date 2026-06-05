/**
 * DeliveryDetailsScreen
 *
 * Fonts:
 *  - Section labels / bold headings → HelveticaNeue-CondensedBold (or Helvetica-BoldCondensed)
 *  - Body, labels, inputs → Poppins-Regular / Poppins-SemiBold / Poppins-Bold
 *
 * SVG assets used (replace filenames as needed):
 *  - close_x.svg         → X close icon (header)
 *  - pin_location.svg    → Location pin icon (pickup / dropoff fields)
 *  - map_person.svg      → Map person / pedestrian icon (dropoff field right side)
 *
 * Images used:
 *  - (none on this screen)
 */

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  StatusBar,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { SvgXml } from "react-native-svg";
import { DeliveryStackParamList } from "../../navigation/types";
import MapSvg from "../../assets/icons/map_pin_person.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";

const { width } = Dimensions.get("window");

// ─── Inline SVGs (replace with your file imports once assets are ready) ──────

const closeSvg = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1 1L17 17M17 1L1 17" stroke="#1A1A2E" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const pinSvg = `<svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 0C4.03 0 0 4.03 0 9C0 15.75 9 22 9 22C9 22 18 15.75 18 9C18 4.03 13.97 0 9 0ZM9 12C7.34 12 6 10.66 6 9C6 7.34 7.34 6 9 6C10.66 6 12 7.34 12 9C12 10.66 10.66 12 9 12Z" fill="#0B1F3A"/>
</svg>`;

const mapPersonSvg = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="14" cy="14" r="14" fill="#E8EEF4"/>
  <path d="M14 6C15.1 6 16 6.9 16 8C16 9.1 15.1 10 14 10C12.9 10 12 9.1 12 8C12 6.9 12.9 6 14 6Z" fill="#0B1F3A"/>
  <path d="M14 11C11.8 11 10 12.8 10 15V16H12V22H16V16H18V15C18 12.8 16.2 11 14 11Z" fill="#0B1F3A"/>
  <circle cx="20" cy="20" r="4" fill="#3B9EFF" opacity="0.85"/>
  <path d="M19 20L20.5 21.5L22 19" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const mapSvg = ``;

// ─── Theme ────────────────────────────────────────────────────────────────────
const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  inputBg: "#eeeeee",
  border: "#E0E4EA",
  textPrimary: "#1A1A2E",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  placeholder: "#B0B8C4",
  sectionLabel: "#0B1F3A",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type RouteParams = RouteProp<DeliveryStackParamList, "DeliveryDetails">;
type WeightCategory = "lightweight" | "standard" | "heavy";

const WEIGHT_OPTIONS: { key: WeightCategory; label: string }[] = [
  { key: "lightweight", label: "Light weight" },
  { key: "standard", label: "Standard" },
  { key: "heavy", label: "Heavy" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function DeliveryDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const { pickup = "American House", dropoff = "University of Ghana" } =
    route.params ?? {};

  const [itemType, setItemType] = useState("");
  const [weight, setWeight] = useState<WeightCategory>("lightweight");
  const [instructions, setInstructions] = useState("");

  const canProceed = itemType.trim().length > 0;

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    navigation.navigate("SelectVehicle", {
      pickup,
      dropoff,
      itemType,
      weight,
      specialInstructions: instructions,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowBackSvg width={60} height={58} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Route Section ── */}
          <SectionLabel label="Route" />

          {/* Pick-up */}
          <Text style={styles.fieldLabel}>Pick-up</Text>
          <View style={styles.readOnlyInput}>
            <SvgXml
              xml={pinSvg}
              width={16}
              height={20}
              style={styles.pinIcon}
            />
            <Text style={styles.readOnlyText}>{pickup}</Text>
          </View>

          {/* Drop-off */}
          <Text style={styles.fieldLabel}>Drop-off</Text>
          <View style={styles.readOnlyInput}>
            <SvgXml
              xml={pinSvg}
              width={16}
              height={20}
              style={styles.pinIcon}
            />
            <Text style={styles.readOnlyText}>{dropoff}</Text>
            {/* <SvgXml xml={mapPersonSvg} width={34} height={34} /> */}
            <MapSvg width={30} height={26} />
          </View>

          {/* ── Package Details Section ── */}
          <View style={styles.sectionGap} />
          <SectionLabel label="Package Details" />

          {/* Item Type */}
          <Text style={styles.fieldLabel}>Item type</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Describe item"
            placeholderTextColor={Colors.placeholder}
            value={itemType}
            onChangeText={setItemType}
          />

          {/* Weight Category */}
          <Text style={styles.fieldLabel}>Weight category</Text>
          <View style={styles.radioRow}>
            {WEIGHT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.radioOption}
                onPress={() => setWeight(opt.key)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioOuter,
                    weight === opt.key && styles.radioOuterActive,
                  ]}
                >
                  {weight === opt.key && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.radioLabel,
                    weight === opt.key && styles.radioLabelActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Special Instructions */}
          <Text style={styles.fieldLabel}>Special instructions</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Type here.."
            placeholderTextColor={Colors.placeholder}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Continue Button ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueBtn, !canProceed && { opacity: 0.5 }]}
            onPress={handleContinue}
            disabled={!canProceed}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Bottom Tab Bar ── */}
      {/* <BottomTabBar /> */}
    </SafeAreaView>
  );
}

// ─── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.text}>{label}</Text>
      <View style={sectionStyles.line} />
    </View>
  );
}

// ─── Bottom Tab Bar ────────────────────────────────────────────────────────────
/**
 * SVG assets for tab bar:
 *  - tab_home.svg    → house/home icon (active)
 *  - tab_send.svg    → paper-plane / send icon
 *  - tab_profile.svg → person/user icon
 */
// function BottomTabBar() {
//   const homeSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" stroke="#1A1A2E" stroke-width="1.5" stroke-linejoin="round"/>
//   </svg>`;
//   const sendSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <path d="M22 2L11 13" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
//     <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
//   </svg>`;
//   const profileSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <circle cx="12" cy="8" r="4" stroke="#9CA3AF" stroke-width="1.5"/>
//     <path d="M4 20C4 17.8 7.6 16 12 16C16.4 16 20 17.8 20 20" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round"/>
//   </svg>`;

//   return (
//     <View style={tabStyles.bar}>
//       <TouchableOpacity style={tabStyles.tab} activeOpacity={0.7}>
//         <SvgXml xml={homeSvg} width={24} height={24} />
//       </TouchableOpacity>
//       <TouchableOpacity style={tabStyles.tab} activeOpacity={0.7}>
//         <SvgXml xml={sendSvg} width={24} height={24} />
//       </TouchableOpacity>
//       <TouchableOpacity style={tabStyles.tab} activeOpacity={0.7}>
//         <SvgXml xml={profileSvg} width={24} height={24} />
//       </TouchableOpacity>
//     </View>
//   );
// }

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
    backgroundColor: Colors.white,
    paddingBottom: 8,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

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
    color: Colors.sectionLabel,
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

  // Header
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
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  headerSpacer: {
    width: 32,
  },

  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  fieldLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
  },

  readOnlyInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    minHeight: 52,
  },
  pinIcon: {
    marginRight: 10,
  },
  readOnlyText: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textPrimary,
  },

  textInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 14,
    minHeight: 52,
  },

  radioRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 18,
    flexWrap: "wrap",
    alignItems: "center",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  radioOuter: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    // borderWidth: 1.5,
    // borderColor: "#C0C8D4",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: Colors.navy,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.navy,
  },
  radioLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  radioLabelActive: {
    fontFamily: "Poppins-SemiBold",
    color: Colors.textPrimary,
  },

  textArea: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textPrimary,
    height: 110,
    marginBottom: 14,
  },

  sectionGap: {
    height: 10,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: Colors.white,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});
