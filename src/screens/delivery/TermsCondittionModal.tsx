import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  Platform,
} from "react-native";
import CloseXSvg from "../../assets/icons/close_x.svg";
import { useNavigation } from "@react-navigation/native";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
  border: "#EFEFEF",
};

interface TermItem {
  title: string;
  body: string;
}

const SCHEDULED_TERMS: TermItem[] = [
  {
    title: "1. Pick-up window",
    body: "Your rider will arrive within the 30-minute window you selected. Please have your item ready and packaged at least 10 minutes before the start of the window.",
  },
  {
    title: "2. Late arrivals",
    body: "If you're not available when the rider arrives, they'll wait up to 5 minutes before the trip may be marked as a failed pick-up, which could result in a cancellation fee.",
  },
  {
    title: "3. Rescheduling",
    body: "You can reschedule a pick-up time up to 1 hour before the scheduled window at no extra cost. Changes made within 1 hour of the window may incur a small rescheduling fee.",
  },
  {
    title: "4. Cancellations",
    body: "Scheduled deliveries can be cancelled free of charge any time before a rider is assigned. Once a rider has been assigned, a cancellation fee may apply.",
  },
  {
    title: "5. Pricing",
    body: "The price shown at checkout is an estimate based on current rates. Scheduled deliveries are charged at the rate active at the time of pick-up, which may differ slightly.",
  },
  {
    title: "6. Item restrictions",
    body: "Scheduled deliveries are subject to the same prohibited items policy as instant deliveries. Riders may decline pick-up of restricted items without refund of any rescheduling fees.",
  },
  {
    title: "7. Notifications",
    body: "You'll receive a reminder notification shortly before your scheduled pick-up window begins, and updates as your rider is assigned and en route.",
  },
];

export default function TermsConditionsModal() {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 70,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onClose = () => navigation.goBack();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 32 }} />
        <Text style={styles.headerTitle}>Terms &amp; Conditions</Text>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CloseXSvg width={18} height={18} />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.intro}>
            Please review the following terms before confirming your scheduled
            delivery. By confirming, you agree to these terms.
          </Text>

          {SCHEDULED_TERMS.map((term) => (
            <View key={term.title} style={styles.termBlock}>
              <Text style={styles.termTitle}>{term.title}</Text>
              <Text style={styles.termBody}>{term.body}</Text>
            </View>
          ))}

          <View style={{ height: 24 }} />
        </ScrollView>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.gotItBtn}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Text style={styles.gotItBtnText}>Got it</Text>
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 14 : 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingHorizontal: 20, paddingTop: 18 },
  intro: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 22,
  },
  termBlock: { marginBottom: 20 },
  termTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  termBody: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  gotItBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  gotItBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});
