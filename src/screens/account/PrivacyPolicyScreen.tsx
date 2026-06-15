/**
 * PrivacyPolicyScreen.tsx
 * Privacy Policy screen for VoltGo
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
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import ChevronRightSvg from "../../assets/icons/chevron_right.svg";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
  border: "#EFEFEF",
  sectionBg: "#F8F9FB",
  greenBg: "#F0FBF2",
};

const SECTIONS = [
  {
    id: "collect",
    title: "What we collect",
    icon: "📋",
    body: `We collect information you provide directly:\n\n• Name, phone number, and email address\n• Delivery pickup and drop-off addresses\n• Payment information (processed securely — we do not store card numbers)\n• Profile photo (optional)\n\nWe also collect information automatically:\n\n• Device location (when the app is in use) for routing and rider matching\n• Device type, OS version, and app version for diagnostics\n• Usage data such as delivery history and app interactions`,
  },
  {
    id: "use",
    title: "How we use it",
    icon: "⚙️",
    body: `Your information is used to:\n\n• Match you with available riders and calculate routes\n• Process payments and send receipts\n• Send delivery status notifications\n• Improve the reliability and accuracy of our service\n• Detect fraud and maintain security\n• Respond to support requests\n\nWe do not sell your personal data to third parties.`,
  },
  {
    id: "share",
    title: "Who we share it with",
    icon: "🤝",
    body: `We share limited data with:\n\n• Riders: your pickup address, package description, and first name so they can complete your delivery\n• Payment processors (Paystack, MTN MoMo, Vodafone Cash) to handle transactions\n• Analytics providers to understand how the app is used (anonymised)\n• Regulatory authorities if required by Ghanaian law\n\nAll third-party partners are bound by data processing agreements.`,
  },
  {
    id: "location",
    title: "Location data",
    icon: "📍",
    body: `VoltGo uses your device location while the app is in use to:\n\n• Show nearby available riders\n• Pre-fill your pickup address\n• Provide accurate route and ETA estimates\n\nWe do not access your location when the app is closed or in the background. You can revoke location permission at any time in your device settings, though this will limit certain features.`,
  },
  {
    id: "retention",
    title: "How long we keep data",
    icon: "🗓️",
    body: `Delivery records are retained for 24 months to support disputes and receipts. Account data is kept as long as your account is active.\n\nWhen you delete your account, your personal data is removed within 30 days, except where retention is required by law (e.g. payment records for tax purposes, which are kept for 7 years).`,
  },
  {
    id: "rights",
    title: "Your rights",
    icon: "✅",
    body: `Under Ghana's Data Protection Act, 2012 (Act 843), you have the right to:\n\n• Access the personal data we hold about you\n• Correct inaccurate information\n• Request deletion of your account and data\n• Object to certain uses of your data\n• Receive a copy of your data in a portable format\n\nTo exercise these rights, contact us at privacy@voltgo.com.`,
  },
  {
    id: "security",
    title: "Security",
    icon: "🔒",
    body: `We use industry-standard security measures including:\n\n• TLS encryption for all data in transit\n• Encrypted storage for sensitive data at rest\n• Regular security reviews and penetration testing\n• Strict access controls for staff\n\nNo system is completely secure. If you believe your account has been compromised, contact support immediately.`,
  },
  {
    id: "contact",
    title: "Contact us",
    icon: "✉️",
    body: `For privacy-related questions or to exercise your rights:\n\nprivacy@voltgo.com\nVoltGo Technologies Ltd\nAccra, Ghana\n\nWe aim to respond to all requests within 5 business days.`,
  },
];

function AccordionSection({
  section,
}: {
  section: (typeof SECTIONS)[0];
}) {
  const [open, setOpen] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rotateAnim, {
      toValue: open ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    setOpen((v) => !v);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <View style={accStyles.wrapper}>
      <TouchableOpacity
        style={accStyles.header}
        onPress={toggle}
        activeOpacity={0.75}
      >
        {/* <Text style={accStyles.icon}>{section.icon}</Text> */}
        <Text style={accStyles.title}>{section.title}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronRightSvg width={8} height={14} />
        </Animated.View>
      </TouchableOpacity>
      {open && (
        <View style={accStyles.body}>
          <Text style={accStyles.bodyText}>{section.body}</Text>
        </View>
      )}
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<any>();
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.updatedPill}>
          <Text style={styles.updatedText}>Last updated: June 2025</Text>
        </View>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🔐</Text>
          <Text style={styles.heroTitle}>Your data, your control</Text>
          <Text style={styles.heroSub}>
            VoltGo collects only what's needed to get your package delivered safely.
            We never sell your data.
          </Text>
        </View>

        <Text style={styles.tapHint}>Tap a section to expand</Text>

        {SECTIONS.map((s) => (
          <AccordionSection key={s.id} section={s} />
        ))}

        <View style={{ height: 48 }} />
      </Animated.ScrollView>
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

  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  updatedPill: {
    alignSelf: "flex-start",
    backgroundColor: Colors.sectionBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  updatedText: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },

  heroCard: {
    backgroundColor: Colors.greenBg,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  heroEmoji: { fontSize: 32, marginBottom: 10 },
  heroTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: Colors.navy,
    marginBottom: 6,
    textAlign: "center",
  },
  heroSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  tapHint: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
});

const accStyles = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    gap: 12,
  },
  icon: { fontSize: 18 },
  title: {
    flex: 1,
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    backgroundColor: Colors.sectionBg,
  },
  bodyText: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
});