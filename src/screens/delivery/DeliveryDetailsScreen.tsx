/**
 * DeliveryDetailsScreen.tsx (fixed + functional)
 * ─────────────────────────────────────────────────────────
 * Key fixes:
 *   ✅ Uses toast instead of Alert for validation errors
 *   ✅ Item type validation with inline error state
 *   ✅ Radio buttons show filled circle correctly
 *   ✅ pickupCoords / dropoffCoords forwarded to SelectVehicle
 *   ✅ Scheduled badge shown when isScheduled=true
 *   ✅ Character counter on special instructions
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
import { useToast } from "../../components/common/Toast";

const { width } = Dimensions.get("window");

// ─── Inline SVGs ──────────────────────────────────────────────────────────────
const pinSvg = `<svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 0C4.03 0 0 4.03 0 9C0 15.75 9 22 9 22C9 22 18 15.75 18 9C18 4.03 13.97 0 9 0ZM9 12C7.34 12 6 10.66 6 9C6 7.34 7.34 6 9 6C10.66 6 12 7.34 12 9C12 10.66 10.66 12 9 12Z" fill="#0B1F3A"/>
</svg>`;

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
  error: "#EF4444",
  errorBg: "#FEF2F2",
  scheduled: "#0B3C5D",
  scheduledBg: "#E8F4FF",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type RouteParams = RouteProp<DeliveryStackParamList, "DeliveryDetails">;
type WeightCategory = "lightweight" | "standard" | "heavy";

const WEIGHT_OPTIONS: {
  key: WeightCategory;
  label: string;
  sublabel: string;
}[] = [
  { key: "lightweight", label: "Lightweight", sublabel: "< 2 kg" },
  { key: "standard", label: "Standard", sublabel: "2–10 kg" },
  { key: "heavy", label: "Heavy", sublabel: "> 10 kg" },
];

const MAX_INSTRUCTIONS = 200;

// ─── Component ────────────────────────────────────────────────────────────────
export default function DeliveryDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const toast = useToast();

  const {
    pickup = "Pickup location",
    dropoff = "Dropoff location",
    pickupCoords,
    dropoffCoords,
    isScheduled,
    scheduledTime,
  } = route.params ?? {};

  const [itemType, setItemType] = useState("");
  const [weight, setWeight] = useState<WeightCategory>("lightweight");
  const [instructions, setInstructions] = useState("");
  const [itemTypeError, setItemTypeError] = useState(false);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(18)).current;
  // Shake animation for error
  const shakeAnim = useRef(new Animated.Value(0)).current;

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

  const shakeItemType = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 5,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -5,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 55,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = () => {
    if (!itemType.trim()) {
      setItemTypeError(true);
      shakeItemType();
      toast.error("Please describe the item you're sending.");
      return;
    }

    navigation.navigate("SelectVehicle", {
      pickup,
      dropoff,
      pickupCoords,
      dropoffCoords,
      itemType: itemType.trim(),
      weight,
      specialInstructions: instructions.trim(),
      isScheduled,
      scheduledTime,
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
          {/* ── Scheduled badge ── */}
          {isScheduled && scheduledTime && (
            <View style={styles.scheduledBadge}>
              <Text style={styles.scheduledIcon}>🗓</Text>
              <Text style={styles.scheduledText}>
                Scheduled: {scheduledTime}
              </Text>
            </View>
          )}

          {/* ── Route Section ── */}
          <SectionLabel label="Route" />

          <Text style={styles.fieldLabel}>Pick-up</Text>
          <View style={styles.readOnlyInput}>
            <SvgXml
              xml={pinSvg}
              width={16}
              height={20}
              style={styles.pinIcon}
            />
            <Text style={styles.readOnlyText} numberOfLines={1}>
              {pickup}
            </Text>
          </View>

          <Text style={styles.fieldLabel}>Drop-off</Text>
          <View style={styles.readOnlyInput}>
            <SvgXml
              xml={pinSvg}
              width={16}
              height={20}
              style={styles.pinIcon}
            />
            <Text style={styles.readOnlyText} numberOfLines={1}>
              {dropoff}
            </Text>
            <MapSvg width={30} height={26} />
          </View>

          {/* ── Package Details Section ── */}
          <View style={styles.sectionGap} />
          <SectionLabel label="Package Details" />

          {/* Item Type */}
          <Text style={styles.fieldLabel}>
            Item type <Text style={styles.requiredStar}>*</Text>
          </Text>
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <TextInput
              style={[styles.textInput, itemTypeError && styles.textInputError]}
              placeholder="e.g. Documents, Electronics, Clothing…"
              placeholderTextColor={Colors.placeholder}
              value={itemType}
              onChangeText={(v) => {
                setItemType(v);
                if (v.trim()) setItemTypeError(false);
              }}
              returnKeyType="next"
            />
          </Animated.View>
          {itemTypeError && (
            <Text style={styles.errorHint}>
              Please describe what you're sending.
            </Text>
          )}

          {/* Weight Category */}
          <Text style={[styles.fieldLabel, { marginTop: 4 }]}>
            Weight category
          </Text>
          <View style={styles.weightGrid}>
            {WEIGHT_OPTIONS.map((opt) => {
              const active = weight === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.weightCard, active && styles.weightCardActive]}
                  onPress={() => setWeight(opt.key)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      active && styles.radioOuterActive,
                    ]}
                  >
                    {active && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.weightTextWrap}>
                    <Text
                      style={[
                        styles.weightLabel,
                        active && styles.weightLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.weightSublabel}>{opt.sublabel}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Special Instructions */}
          <View style={styles.instructionsHeader}>
            <Text style={styles.fieldLabel}>Special instructions</Text>
            <Text style={styles.charCount}>
              {instructions.length}/{MAX_INSTRUCTIONS}
            </Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Handle with care, call before delivery, leave at door…"
            placeholderTextColor={Colors.placeholder}
            value={instructions}
            onChangeText={(v) => {
              if (v.length <= MAX_INSTRUCTIONS) setInstructions(v);
            }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Continue Button ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.text}>{label}</Text>
      <View style={sectionStyles.line} />
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
  safeArea: { flex: 1, backgroundColor: Colors.white },

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
  headerSpacer: { width: 32 },

  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  // Scheduled badge
  scheduledBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.scheduledBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  scheduledIcon: { fontSize: 16 },
  scheduledText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Colors.scheduled,
  },

  fieldLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  requiredStar: { color: Colors.error },

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
  pinIcon: { marginRight: 10 },
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
    marginBottom: 6,
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  textInputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorBg,
  },
  errorHint: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.error,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Weight grid: 3 cards side by side
  weightGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  weightCard: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: 6,
  },
  weightCardActive: {
    borderColor: Colors.navy,
    backgroundColor: Colors.white,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#C0C8D4",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: Colors.navy,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.navy,
  },
  weightTextWrap: { alignItems: "center" },
  weightLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  weightLabelActive: {
    fontFamily: "Poppins-SemiBold",
    color: Colors.textPrimary,
  },
  weightSublabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },

  instructionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  charCount: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
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

  sectionGap: { height: 10 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
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
