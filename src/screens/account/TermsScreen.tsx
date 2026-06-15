/**
 * TermsScreen.tsx
 * Terms & Conditions screen for VoltGo
 */

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
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
  border: "#EFEFEF",
  sectionBg: "#F8F9FB",
};

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: `By downloading, installing, or using VoltGo, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the app.\n\nThese terms apply to all users of VoltGo, including senders, recipients, and any other persons who access or use the service.`,
  },
  {
    title: "2. Description of Service",
    body: `VoltGo is a last-mile delivery platform that connects individuals and businesses with independent delivery riders. We facilitate the booking and tracking of deliveries but do not ourselves provide delivery services.\n\nRiders on the platform operate as independent contractors. VoltGo is not responsible for the actions, conduct, or performance of riders beyond what is set out in these terms.`,
  },
  {
    title: "3. User Accounts",
    body: `You must create an account to use VoltGo. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.\n\nYou must provide accurate and complete information when creating your account. You may not use another person's account without permission.`,
  },
  {
    title: "4. Prohibited Items",
    body: `You may not use VoltGo to send:\n\n• Illegal substances, drugs, or controlled items\n• Weapons, firearms, or explosives\n• Hazardous or flammable materials\n• Live animals\n• Perishable items without prior arrangement\n• Any item prohibited by Ghanaian law\n\nVoltGo reserves the right to refuse or cancel any delivery at its discretion.`,
  },
  {
    title: "5. Pricing & Payments",
    body: `Delivery fees are calculated based on distance, package size, and demand at the time of booking. Prices are shown before you confirm a delivery.\n\nPayment is due at the time of booking. We accept mobile money (MTN, Vodafone, AirtelTigo) and card payments. All prices are in Ghana Cedis (GHS).`,
  },
  {
    title: "6. Cancellations & Refunds",
    body: `You may cancel a delivery before a rider is assigned at no charge. Once a rider is assigned and en route, a cancellation fee may apply.\n\nRefunds for service failures are assessed on a case-by-case basis. Please contact support within 24 hours of the delivery date to raise a dispute.`,
  },
  {
    title: "7. Limitation of Liability",
    body: `VoltGo's liability for any loss or damage arising from a delivery is limited to the declared value of the item or GHS 500, whichever is lower.\n\nWe are not liable for indirect, incidental, or consequential damages, including loss of income or business opportunity.`,
  },
  {
    title: "8. Changes to Terms",
    body: `We may update these Terms & Conditions from time to time. Continued use of VoltGo after changes are posted constitutes your acceptance of the revised terms.\n\nMaterial changes will be communicated via in-app notification or email.`,
  },
  {
    title: "9. Governing Law",
    body: `These terms are governed by the laws of the Republic of Ghana. Any disputes shall be resolved in the courts of Ghana.`,
  },
  {
    title: "10. Contact",
    body: `Questions about these terms? Reach us at:\n\nlegal@voltgo.com\nVoltGo Technologies Ltd\nAccra, Ghana`,
  },
];

export default function TermsScreen() {
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Last updated pill */}
        <View style={styles.updatedPill}>
          <Text style={styles.updatedText}>Last updated: June 2025</Text>
        </View>

        <Text style={styles.intro}>
          Please read these terms carefully before using the VoltGo delivery service.
        </Text>

        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
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

  intro: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },

  section: {
    marginBottom: 24,
    backgroundColor: Colors.sectionBg,
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.navy,
    marginBottom: 8,
  },
  sectionBody: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
});