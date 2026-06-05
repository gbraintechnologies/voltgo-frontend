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
} from "react-native";
import { SvgXml } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Colors, Spacing, Radius } from "../../theme";
import { RootStackParamList } from "../../navigation/types";

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

const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path fill="#000000" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
</svg>`;

export default function PhoneAuthScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const slideUp = useRef(new Animated.Value(30)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  // Load fingerprint SVG from file
  const [fingerprintXml, setFingerprintXml] = useState<string | null>(null);
  useEffect(() => {
    // We read the downloaded SVG file as a module
    // REPLACE this xml string with your actual downloaded fingerprint svg content
    setFingerprintXml(require("../../../assets/icons/fingerprint.svg"));
  }, []);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primary} />

      {/* Hero */}
      <View style={[styles.heroSection, { marginTop: insets.top + 12 }]}>
        <Text style={styles.watermark}>VoltGO</Text>
        <View style={styles.illustrationWrap}>
          <Image
            source={require("../../../assets/images/postal_worker.png")}
            style={{
              width: width * 0.9,
              height: HERO_HEIGHT * 1,
            }}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Form */}
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
          <Text style={styles.heading}>Enter your number</Text>
          <Text style={styles.subtitle}>
            We will send you a verification code on this number as SMS.
          </Text>

          {/* Phone Input */}
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
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <SocialButton
            svgXml={googleSvg}
            label="Sign in with Google"
            onPress={() => {}}
          />
          <SocialButton
            svgXml={appleSvg}
            label="Sign in with Apple"
            onPress={() => {}}
          />

          {/* Fingerprint button uses downloaded SVG file directly */}
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

          {/* Continue */}
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.82}
            onPress={() =>
              navigation.navigate({
                name: "OTPVerification",
                params: { phone },
              })
            }
          >
            <Text style={styles.buttonText}>Continue</Text>
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
  iconWrap: {
    width: 28,
    alignItems: "center",
    marginRight: 10,
  },
  label: {
    fontFamily: "Poppins-Medium",
    fontSize: 15,
    color: "#0F1F3D",
  },
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
  illustration: {
    width: width * 0.72,
    height: HERO_HEIGHT * 0.92,
  },

  contentSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
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
    lineHeight: 22,
    marginBottom: 20,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 14,
    marginBottom: 20,
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

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
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
  termsLink: {
    color: "#555555",
    textDecorationLine: "underline",
  },
});
