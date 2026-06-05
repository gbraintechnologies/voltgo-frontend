import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Svg, { Path, Circle } from "react-native-svg";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textMuted: "#9CA3AF",
  border: "#EFEFEF",
};

const SuccessIcon = () => (
  <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
    <Circle cx={36} cy={36} r={36} fill={Colors.primary} fillOpacity={0.15} />
    <Circle cx={36} cy={36} r={26} fill={Colors.primary} />
    <Path
      d="M24 36L32 44L48 28"
      stroke={Colors.white}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function BundleSuccessScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { plan } = route.params ?? {};

  const scale = useRef(new Animated.Value(0.6)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 55,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <SuccessIcon />
        </Animated.View>
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          Your <Text style={styles.bold}>{plan?.name ?? "Starter Pack"}</Text>{" "}
          has been activated.
          {"\n"}
          {plan?.deliveries ?? 5} deliveries added to your account.
        </Text>

        {/* Summary pill */}
        <View style={styles.summaryPill}>
          <Text style={styles.pillText}>
            {plan?.deliveries ?? 5} deliveries
          </Text>
          <View style={styles.pillDot} />
          <Text style={styles.pillText}>Valid {plan?.expiry ?? "30 days"}</Text>
          <View style={styles.pillDot} />
          <Text style={styles.pillText}>{plan?.price ?? "GHS 75.00"}</Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.homeBtn}
          // Replace the reset call with:
onPress={() =>  navigation.navigate('HomeMap')}
          activeOpacity={0.85}
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() =>
            navigation.navigate("BundlesFlow", { screen: "BundleHistory" })
          }
          activeOpacity={0.75}
        >
          <Text style={styles.historyBtnText}>View History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
    textAlign: "center",
    marginTop: 8,
  },
  subtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  bold: { fontFamily: "Poppins-SemiBold", color: Colors.textPrimary },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    backgroundColor: "#F2F4F7",
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pillText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Colors.textPrimary,
  },
  pillDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 10,
    gap: 10,
  },
  homeBtn: {
    backgroundColor: Colors.navy,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
  },
  homeBtnText: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 17,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  historyBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  historyBtnText: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});
