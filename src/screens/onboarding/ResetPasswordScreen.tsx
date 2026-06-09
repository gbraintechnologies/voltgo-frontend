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
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useRoute } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Colors, Radius } from "../../theme";
import { RootStackParamList } from "../../navigation/types";
import { useResetPassword, useForgotPassword } from "../../hooks/useApi";
import { ApiError } from "../../api/client";
import { useToast } from "../../components/common/Toast";

const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.26;
const OTP_LENGTH = 5;
const BOX_SIZE = (width - 48 - 12 * (OTP_LENGTH - 1)) / OTP_LENGTH;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ResetPassword">;
};

export default function ResetPasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const route = useRoute<RouteProp<RootStackParamList, "ResetPassword">>();
  const phone = route.params.phone;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const slideUp = useRef(new Animated.Value(30)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const resetMutation = useResetPassword();
  const resendMutation = useForgotPassword();

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
    ]).start(() => inputRefs.current[0]?.focus());
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const shake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
    if (value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await resendMutation.mutateAsync(phone);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toast.info("A new code has been sent to your phone.");
      setCountdown(30);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error("Could not resend code. Please try again.");
    }
  };

  const handleReset = async () => {
    const code = otp.join("");

    if (code.length < OTP_LENGTH) {
      shake();
      toast.warning("Please enter the 5-digit code.");
      return;
    }
    if (!newPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toast.warning("Please enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toast.warning("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toast.warning("Passwords do not match.");
      return;
    }

    try {
      await resetMutation.mutateAsync({
        phone,
        otp: code,
        new_password: newPassword,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success("Password reset! You can now log in.");
      // Short delay so toast is visible before navigating
      setTimeout(() => navigation.navigate("PhoneAuth"), 1200);
    } catch (err) {
      shake();
      const msg =
        err instanceof ApiError
          ? err.message
          : "Reset failed. Please try again.";
      toast.error(msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { marginTop: insets.top + 12 }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.heroSection}>
        <Text style={styles.watermark}>VoltGO</Text>
        <View style={styles.illustrationWrap}>
          <Image
            source={require("../../../assets/images/notification_bell.png")}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
        >
          <Text style={styles.heading}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to {phone}, then set a new password.
          </Text>

          {/* OTP boxes */}
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
            onPress={handleResend}
            disabled={countdown > 0 || resendMutation.isPending}
            style={{ marginBottom: 20 }}
          >
            <Text
              style={[styles.resend, countdown === 0 && styles.resendActive]}
            >
              {resendMutation.isPending
                ? "Sending..."
                : countdown > 0
                  ? `Resend in ${countdown}s`
                  : "Resend code"}
            </Text>
          </TouchableOpacity>

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.passwordInput, { flex: 1 }]}
              placeholder="New password"
              placeholderTextColor="#AAAAAA"
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((p) => !p)}
              style={{ paddingHorizontal: 14 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Image
                source={
                  showPassword
                    ? require("../../../assets/icons/eye-open.png")
                    : require("../../../assets/icons/eye-closed.png")
                }
                style={{ width: 22, height: 22, tintColor: "#888" }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.passwordInput, { flex: 1 }]}
              placeholder="Confirm new password"
              placeholderTextColor="#AAAAAA"
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, resetMutation.isPending && { opacity: 0.7 }]}
            activeOpacity={0.82}
            onPress={handleReset}
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? (
              <ActivityIndicator color="#0F1F3D" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
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
    width,
    height: HERO_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  illustration: { width: width * 0.52, height: HERO_HEIGHT * 0.88 },
  content: { paddingHorizontal: 24, paddingTop: 4 },
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
    lineHeight: 22,
    marginBottom: 24,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
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
  otpBoxFilled: { backgroundColor: "#F2F2F2" },
  resend: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#AAAAAA",
    textAlign: "center",
  },
  resendActive: { color: Colors.primary },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  passwordInput: {
    paddingHorizontal: 14,
    paddingVertical: 15,
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: "#0F1F3D",
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#0F1F3D",
  },
});
