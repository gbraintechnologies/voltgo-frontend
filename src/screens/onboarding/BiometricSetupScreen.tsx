import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Image,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { Colors, Radius } from "../../theme";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { useBiometrics } from "@/hooks/useBiometrics";
import { useToast } from "../../components/common/Toast";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "BiometricSetup">;
};

export default function BiometricSetupScreen({ navigation }: Props) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.82)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const { biometricType, label, enable, isReady } = useBiometrics();

  const pendingPhone = useAuthStore((s) => s.pendingPhone);
  const pendingPassword = useAuthStore((s) => s.pendingPassword);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 55,
        friction: 9,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isReady && !biometricType) {
      goToHome();
    }
  }, [isReady, biometricType]);

  const goToHome = () => {
    navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
  };

  const handleEnableBiometric = async () => {
    if (!pendingPhone || !pendingPassword) {
      goToHome();
      return;
    }
    setLoading(true);
    try {
      const success = await enable(pendingPhone, pendingPassword);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      toast.error(
        "Could not enable biometrics",
        "You can turn it on later in Settings.",
      );
    } finally {
      setLoading(false);
      goToHome();
    }
  };

  const iconSource =
    biometricType === "face"
      ? require("../../../assets/images/biometric_face_touch.png")
      : require("../../../assets/images/biometric_icon.png");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.topSection}>
        <Animated.View style={{ opacity: fadeIn, transform: [{ scale }] }}>
          <Image
            source={iconSource}
            style={styles.biometricImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.contentSection,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        <Text style={styles.heading}>Make Sign-in Easier</Text>
        <Text style={styles.subtitle}>
          Use your device's {label} to sign in instantly next time you open
          VoltGo.
        </Text>
      </Animated.View>

      <View style={{ flex: 1 }} />

      <Animated.View style={[styles.buttonsSection, { opacity: fadeIn }]}>
        <TouchableOpacity
          style={styles.biometricButton}
          activeOpacity={0.75}
          onPress={handleEnableBiometric}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0F1F3D" />
          ) : (
            <Text style={styles.biometricButtonText}>Use {label}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.remindButton}
          activeOpacity={0.75}
          onPress={goToHome}
        >
          <Text style={styles.remindButtonText}>Remind me later</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  topSection: { alignItems: "center", marginTop: 90, marginBottom: 32 },
  biometricImage: { width: 160, height: 140 },
  contentSection: { alignItems: "center", paddingHorizontal: 8 },
  heading: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 26,
    color: "#0F1F3D",
    textAlign: "center",
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#555555",
    textAlign: "center",
    lineHeight: 23,
  },
  buttonsSection: { gap: 12, marginBottom: 30 },
  biometricButton: {
    backgroundColor: "#0F1F3D",
    borderRadius: Radius.md,
    paddingVertical: 17,
    alignItems: "center",
  },
  biometricButtonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.white,
  },
  remindButton: {
    backgroundColor: "#F2F2F2",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
  },
  remindButtonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: "#0F1F3D",
  },
});
