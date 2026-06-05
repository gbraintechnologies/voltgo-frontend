import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Colors, Spacing, Radius } from "../../theme";
import { RootStackParamList } from "../../navigation/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.26;
const OTP_LENGTH = 5;
const BOX_SIZE = (width - 48 - 12 * (OTP_LENGTH - 1)) / OTP_LENGTH;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "OTPVerification">;
};

export default function OTPVerificationScreen({ navigation }: Props) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const slideUp = useRef(new Animated.Value(30)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start(() => {
      inputRefs.current[0]?.focus();
    });
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      digits.forEach((d, i) => {
        if (i < OTP_LENGTH) newOtp[i] = d;
      });
      setOtp(newOtp);
      inputRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = () => {
    if (otp.join("").length < OTP_LENGTH) {
      shake();
      return;
    }
    navigation.navigate("CreateProfile");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { marginTop: insets.top + 12 },]}
      
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primary} />

      {/* Hero */}
      <View style={styles.heroSection}>
        <Text style={styles.watermark}>VoltGO</Text>
        <View style={styles.illustrationWrap}>
          {/* REPLACE: assets/images/notification_bell.png */}
          <Image
            source={require("../../../assets/images/notification_bell.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.contentSection,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        <Text style={styles.heading}>Enter the 6-digit code</Text>
        <Text style={styles.subtitle}>
          Check your SMS or Whatsapp for the code
        </Text>

        {/* OTP Boxes */}
        <Animated.View
          style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={(v) => handleOtpChange(v, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              textAlign="center"
              selectionColor={Colors.primary}
              caretHidden
            />
          ))}
        </Animated.View>

        <TouchableOpacity
          onPress={() => {
            if (countdown === 0) setCountdown(30);
          }}
          disabled={countdown > 0}
        >
          <Text style={[styles.resend, countdown === 0 && styles.resendActive]}>
            {countdown > 0 ? `Resend in ${countdown}` : "Resend code"}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.differentMethod}>Try a different method</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.82}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  heroSection: {
    height: HERO_HEIGHT,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
     marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: Radius.md,
  },
  watermark: {
    position: "absolute",
    fontSize: 64,
    fontFamily: "HelveticaNeue-CondensedBold",
    color: "rgba(15,31,61,0.10)",
    letterSpacing: -2,
    top: "20%",
    alignSelf: "center",
  },
  illustrationWrap: {
    width: width,
    height: HERO_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-end",

  },
  illustration: {
    width: width * 0.52,
    height: HERO_HEIGHT * 0.88,
  },

  contentSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  heading: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 26,
    color: "#0F1F3D",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#555555",
    textAlign: "center",
    marginBottom: 24,
  },

  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  otpBox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    backgroundColor: Colors.white,
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    color: "#0F1F3D",
  },
  otpBoxFilled: {
    backgroundColor: "#F2F2F2",
  },

  resend: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 20,
  },
  resendActive: { color: Colors.primary },

  divider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginBottom: 16,
  },
  differentMethod: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },

  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 14,
  },
  buttonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#161616",
  },
});
