import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Colors, Spacing, Radius } from "../../theme";
import { RootStackParamList } from "../../navigation/types";

const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.58;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Onboarding">;
};

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const slideUp = useRef(new Animated.Value(40)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const imgScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(imgScale, {
        toValue: 1,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 55,
        friction: 9,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primary} />

      {/* Hero */}
      <View style={[styles.heroSection, { marginTop: insets.top + 12 }]}>
        {/* <Text style={styles.watermark}>VoltGO</Text> */}
        <Animated.View
          style={[
            styles.illustrationWrap,
            { transform: [{ scale: imgScale }] },
          ]}
        >
          <Image
            source={require("../../../assets/images/OB1.png")}
            style={{
              width: width * 1.2,
              height: HERO_HEIGHT * 1.1,
            }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.contentSection,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        <Text style={styles.heading}>
          Student Commerce{"\n"}And Mobility Made Efficient!
        </Text>
        <Text style={styles.subtitle}>
          Deliver, track, and pay seamlessly with one smart app built for campus
          convenience.
        </Text>
        <TouchableOpacity
          style={[styles.button, { marginBottom: insets.bottom + 16 }]}
          activeOpacity={0.82}
          onPress={() => navigation.navigate("PhoneAuth")}
        >
          <Text style={styles.buttonText}>Get started</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  heroSection: {
    height: HERO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  illustrationWrap: {
    width: "100%",
    height: HERO_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  watermark: {
    position: "absolute",
    fontSize: 72,
    fontFamily: "HelveticaNeue-CondensedBold",
    color: "rgba(15,31,61,0.10)",
    letterSpacing: -2,
    top: "28%",
    alignSelf: "center",
  },

  illustration: {
    width: width * 0.9,
    height: HERO_HEIGHT * 0.92,
  },

  contentSection: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingTop: 28,
    alignItems: "center",
  },
  heading: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 26,
    color: "#000000",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#3F3F3F",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 17,
    width: "100%",
    alignItems: "center",
    marginTop: "auto",
  },
  buttonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: "#161616",
  },
});




