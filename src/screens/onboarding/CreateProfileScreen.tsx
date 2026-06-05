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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Colors, Spacing, Radius } from "../../theme";
import { RootStackParamList } from "../../navigation/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.34;


type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CreateProfile">;
};

const LANGUAGES = ["English", "French", "Twi", "Hausa", "Ga"];

// SVG icons — replace with require() when you have the files
const personSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
  <circle cx="12" cy="7" r="4"/>
</svg>`;

const mailSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="4" width="20" height="16" rx="2"/>
  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
</svg>`;

const globeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
  <path d="M2 12h20"/>
</svg>`;

const chevronDownSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m6 9 6 6 6-6"/>
</svg>`;

export default function CreateProfileScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState("English");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const insets = useSafeAreaInsets();

  const slideUp = useRef(new Animated.Value(30)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

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
      style={[styles.container, { marginTop: insets.top + 12 }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primary} />

      {/* Hero */}
      <View style={styles.heroSection}>
        <Text style={styles.watermark}>VoltGO</Text>
        <View style={styles.illustrationWrap}>
          {/* REPLACE: assets/images/character_boy.png */}
          <Image
            source={require("../../../assets/images/character_boy.png")}
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
        contentContainerStyle={styles.contentSection}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
        >
          <Text style={styles.heading}>Create Profile</Text>

          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <View style={styles.inputWrap}>
            <SvgXml
              xml={personSvg}
              width={20}
              height={20}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter full name here.."
              placeholderTextColor="#AAAAAA"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>
            Email <Text style={styles.optional}>(Optional)</Text>
          </Text>
          <View style={styles.inputWrap}>
            <SvgXml
              xml={mailSvg}
              width={20}
              height={20}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter email here.."
              placeholderTextColor="#AAAAAA"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Language */}
          <Text style={styles.label}>Preferred Language</Text>
          <TouchableOpacity
            style={styles.inputWrap}
            onPress={() => setShowLangPicker(!showLangPicker)}
            activeOpacity={0.75}
          >
            <SvgXml
              xml={globeSvg}
              width={20}
              height={20}
              style={styles.inputIcon}
            />
            <Text
              style={[
                styles.input,
                styles.selectText,
                { color: language ? "#0F1F3D" : "#AAAAAA" },
              ]}
            >
              {language || "Select preferred language"}
            </Text>
            <SvgXml xml={chevronDownSvg} width={18} height={18} />
          </TouchableOpacity>

          {showLangPicker && (
            <View style={styles.dropdown}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setLanguage(lang);
                    setShowLangPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      language === lang && styles.dropdownItemActive,
                    ]}
                  >
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, { marginTop: 32 }]}
            activeOpacity={0.82}
            onPress={() => navigation.navigate("BiometricSetup")}
          >
            <Text style={styles.buttonText}>Complete</Text>
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
    top: "18%",
    alignSelf: "center",
  },
  illustrationWrap: {
    width: "100%",
    height: HERO_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  illustration: {
    width: width * 0.6,
    height: HERO_HEIGHT * 0.95,
  },

  contentSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  heading: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 26,
    color: "#0F1F3D",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: -0.3,
  },

  label: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: "#0F1F3D",
    marginBottom: 8,
    marginTop: 12,
  },
  optional: {
    fontFamily: "Poppins-Regular",
    color: "#888888",
    fontSize: 13,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 4,
    minHeight: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#0F1F3D",
    paddingVertical: 14,
  },
  selectText: {
    paddingVertical: 16,
  },

  dropdown: {
    backgroundColor: "#F2F2F2", // ← was Colors.white
    borderRadius: 14, // ← was 12, match inputWrap
    borderWidth: 0, // ← remove border
    marginBottom: 12,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8", // ← softer divider on grey bg
  },
  dropdownItemText: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#0F1F3D",
  },
  dropdownItemActive: {
    fontFamily: "Poppins-SemiBold",
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
    color: "#0F1F3D",
  },
});
