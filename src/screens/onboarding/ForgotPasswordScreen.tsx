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
import * as Haptics from "expo-haptics";
import { Colors, Radius } from "../../theme";
import { RootStackParamList } from "../../navigation/types";
import { useForgotPassword } from "../../hooks/useApi";
import { ApiError } from "../../api/client";
import { useToast } from "../../components/common/Toast";

const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.34;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ForgotPassword">;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [phone, setPhone] = useState("");
  const slideUp = useRef(new Animated.Value(30)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  const forgotMutation = useForgotPassword();

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

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length < 9) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toast.warning("Please enter a valid phone number.");
      return;
    }
    try {
      await forgotMutation.mutateAsync(cleaned);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toast.success("Reset code sent! Check your SMS.");
      navigation.navigate("ResetPassword", { phone: cleaned });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg =
        err instanceof ApiError
          ? err.message
          : "Could not send reset code. Please try again.";
      toast.error(msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={[styles.heroSection, { marginTop: insets.top + 12 }]}>
        <Text style={styles.watermark}>VoltGO</Text>
        <View style={styles.illustrationWrap}>
          <Image
            source={require("../../../assets/images/notification_bell.png")}
            style={{ width: width * 0.55, height: HERO_HEIGHT * 0.85 }}
            resizeMode="contain"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
        >
          <Text style={styles.heading}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter the phone number linked to your account and we'll send you a
            reset code.
          </Text>

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
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              forgotMutation.isPending && { opacity: 0.7 },
            ]}
            activeOpacity={0.82}
            onPress={handleSendOtp}
            disabled={forgotMutation.isPending}
          >
            {forgotMutation.isPending ? (
              <ActivityIndicator color="#0F1F3D" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backRow}
          >
            <Text style={styles.backText}>
              Back to <Text style={styles.backLink}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
  content: { paddingHorizontal: 24, paddingTop: 28 },
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
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#0F1F3D",
  },
  backRow: { alignItems: "center" },
  backText: { fontFamily: "Poppins-Regular", fontSize: 13, color: "#555" },
  backLink: { fontFamily: "Poppins-SemiBold", color: Colors.primary },
});
