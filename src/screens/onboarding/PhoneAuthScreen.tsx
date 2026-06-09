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
import { SvgXml } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, Radius } from "../../theme";
import { RootStackParamList } from "../../navigation/types";
import { useRegister, useLogin, useSendOtp } from "../../hooks/useApi";
import { useAuthStore } from "../../stores/authStore";
import { ApiError } from "../../api/client";
import { useToast } from "../../components/common/Toast";
import ConfirmModal from "../../components/common/ConfirmModal";

const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.34;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PhoneAuth">;
};

const googleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
</svg>`;

type AuthMode = "phone" | "login" | "register";

export default function PhoneAuthScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<AuthMode>("phone");
  const [showPassword, setShowPassword] = useState(false);

  // Modal state for "account already exists" prompt
  const [accountExistsModal, setAccountExistsModal] = useState(false);

  const slideUp = useRef(new Animated.Value(30)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  const registerMutation = useRegister();
  const loginMutation = useLogin();

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
    ]).start();
  }, []);

  const isLoading = registerMutation.isPending || loginMutation.isPending;

  const handleContinuePhone = () => {
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length < 9) {
      // Light warning haptic — user made an input error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toast.warning("Please enter a valid phone number.");
      return;
    }
    // Subtle tap feedback on successful step progression
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode("login");
  };

  const handleLogin = async () => {
    if (!password) return;
    const cleaned = phone.replace(/\s/g, "");
    try {
      await loginMutation.mutateAsync({ phone: cleaned, password });
      // Success haptic — auth store update triggers navigation
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      // Error haptic — login failed
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg =
        err instanceof ApiError
          ? err.message
          : "Login failed. Please try again.";
      toast.error(msg);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !password) return;
    const cleaned = phone.replace(/\s/g, "");
    try {
      await registerMutation.mutateAsync({
        fullName: fullName.trim(),
        phone: cleaned,
        password,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate("OTPVerification", { phone: cleaned });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg =
        err instanceof ApiError ? err.message : "Registration failed.";
      if (err instanceof ApiError && err.status === 409) {
        setAccountExistsModal(true);
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar barStyle="dark-content" backgroundColor={Colors.primary} />

        <View style={[styles.heroSection, { marginTop: insets.top + 12 }]}>
          <Text style={styles.watermark}>VoltGO</Text>
          <View style={styles.illustrationWrap}>
            <Image
              source={require("../../../assets/images/postal_worker.png")}
              style={{ width: width * 0.9, height: HERO_HEIGHT * 1 }}
              resizeMode="contain"
            />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.contentSection,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
          >
            <Text style={styles.heading}>
              {mode === "phone"
                ? "Enter your number"
                : mode === "login"
                  ? "Welcome back"
                  : "Create account"}
            </Text>
            <Text style={styles.subtitle}>
              {mode === "phone"
                ? "We will send you a verification code on this number as SMS."
                : mode === "login"
                  ? "Enter your password to continue."
                  : "Fill in your details to get started."}
            </Text>

            {mode === "register" && (
              <View style={[styles.inputRow, { marginBottom: 12 }]}>
                <TextInput
                  style={[styles.phoneInput, { flex: 1 }]}
                  placeholder="Full name"
                  placeholderTextColor="#AAAAAA"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.countryPicker}>
                <Text style={styles.flagEmoji}>🇬🇭</Text>
                <Text style={styles.chevron}>▾</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.phoneInput}
                placeholder="+233"
                placeholderTextColor="#AAAAAA"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                editable={mode === "phone"}
              />
              {mode !== "phone" && (
                <TouchableOpacity
                  onPress={() => {
                    setMode("phone");
                    setPassword("");
                  }}
                  style={{ paddingHorizontal: 12 }}
                >
                  <Text
                    style={{
                      color: "#888",
                      fontSize: 13,
                      fontFamily: "Poppins-Regular",
                    }}
                  >
                    Edit
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {(mode === "login" || mode === "register") && (
              <View style={[styles.inputRow, { marginTop: 0 }]}>
                <TextInput
                  style={[styles.phoneInput, { flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor="#AAAAAA"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
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
            )}

            {mode === "login" && (
              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
                style={{
                  alignSelf: "flex-end",
                  marginBottom: 8,
                  marginTop: -4,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 13,
                    color: Colors.primary,
                  }}
                >
                  Forgot password?
                </Text>
              </TouchableOpacity>
            )}

            {mode !== "phone" && (
              <TouchableOpacity
                onPress={() => setMode(mode === "login" ? "register" : "login")}
                style={{ alignItems: "center", marginBottom: 8 }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-Regular",
                    fontSize: 13,
                    color: "#555",
                  }}
                >
                  {mode === "login"
                    ? "Don't have an account? "
                    : "Already have an account? "}
                  <Text
                    style={{
                      color: Colors.primary,
                      fontFamily: "Poppins-SemiBold",
                    }}
                  >
                    {mode === "login" ? "Register" : "Log in"}
                  </Text>
                </Text>
              </TouchableOpacity>
            )}

            {mode === "phone" && (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Or</Text>
                  <View style={styles.dividerLine} />
                </View>
                <SocialButton
                  svgXml={googleSvg}
                  label="Sign in with Google"
                  onPress={() => {}}
                />
                <TouchableOpacity
                  style={socialStyles.button}
                  activeOpacity={0.75}
                  onPress={() => {}}
                >
                  <View style={socialStyles.iconWrap}>
                    <Image
                      source={require("../../../assets/icons/fingerprint.png")}
                      style={{ width: 22, height: 22 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={socialStyles.label}>Biometric Sign in</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={[styles.button, isLoading && { opacity: 0.7 }]}
              activeOpacity={0.82}
              onPress={
                mode === "phone"
                  ? handleContinuePhone
                  : mode === "login"
                    ? handleLogin
                    : handleRegister
              }
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#0F1F3D" />
              ) : (
                <Text style={styles.buttonText}>
                  {mode === "phone"
                    ? "Continue"
                    : mode === "login"
                      ? "Log in"
                      : "Register"}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.terms}>
              By continuing, you agree to our{" "}
              <Text style={styles.termsLink}>
                terms and conditions and privacy policies
              </Text>
              .
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Account already exists modal */}
      <ConfirmModal
        visible={accountExistsModal}
        title="Account exists"
        message="This number is already registered. Would you like to log in instead?"
        confirmLabel="Log in"
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={() => {
          setAccountExistsModal(false);
          setMode("login");
        }}
        onCancel={() => setAccountExistsModal(false)}
      />
    </>
  );
}

function SocialButton({
  svgXml,
  label,
  onPress,
}: {
  svgXml: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={socialStyles.button}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={socialStyles.iconWrap}>
        <SvgXml xml={svgXml} width={22} height={22} />
      </View>
      <Text style={socialStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const socialStyles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.white,
  },
  iconWrap: { width: 28, alignItems: "center", marginRight: 10 },
  label: { fontFamily: "Poppins-Medium", fontSize: 15, color: "#0F1F3D" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  heroSection: {
    height: HERO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  watermark: {
    position: "absolute",
    fontSize: 64,
    fontFamily: "HelveticaNeue-CondensedBold",
    color: "rgba(15,31,61,0.10)",
    letterSpacing: -2,
    top: "22%",
    alignSelf: "center",
  },
  illustrationWrap: {
    width: "100%",
    height: HERO_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  contentSection: { paddingHorizontal: 24, paddingTop: 28 },
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
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  countryPicker: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderRightWidth: 1,
    borderRightColor: "#E5E5E5",
  },
  flagEmoji: { fontSize: 20, marginRight: 4 },
  chevron: { fontSize: 11, color: "#888888" },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 15,
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: "#0F1F3D",
  },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E5E5" },
  dividerText: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#888888",
    marginHorizontal: 12,
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
    color: "#0F1F3D",
  },
  terms: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#888888",
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: { color: "#555555", textDecorationLine: "underline" },
});
