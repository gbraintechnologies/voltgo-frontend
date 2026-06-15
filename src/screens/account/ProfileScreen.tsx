import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  StatusBar,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import { useCustomerProfile, useUpdateProfile } from "../../hooks/useApi";
import { useAuthStore } from "../../stores/authStore";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
  border: "#E8E8E8",
  inputBg: "#F2F4F7",
};

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const fadeIn = useRef(new Animated.Value(0)).current;

  const { data, isLoading } = useCustomerProfile();
  const storedCustomer = useAuthStore((s: any) => s.customer);
  const setCustomer = useAuthStore((s: any) => s.setCustomer);

  const profile = data?.data ?? storedCustomer;

  const [name, setName] = useState(profile?.fullName ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");

  const updateMutation = useUpdateProfile();

  // Sync fields when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.fullName ?? "");
      setEmail(profile.email ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile?.id]);

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  // Profile editing is not yet in the API - show placeholder save
  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        full_name: name || undefined,
        email: email || undefined,
      });
      Alert.alert("Saved", "Profile updated successfully.");
      navigation.navigate('Account')
    } catch (_) {
      Alert.alert("Error", "Could not save profile. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowBackSvg width={60} height={58} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={Colors.navy} />
        </View>
      ) : (
        <Animated.ScrollView
          style={{ opacity: fadeIn }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <Image
                source={require("../../assets/images/rider_john.png")}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8}>
                <View style={styles.cameraDot} />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarName}>{name || "User"}</Text>
          </View>

          <View style={styles.fieldsSection}>
            <FieldLabel label="Full name" />
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <FieldLabel label="Email address" />
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Add email address" // add this
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <FieldLabel label="Phone number" />
            <View style={[styles.inputWrap, { backgroundColor: "#F8F8F8" }]}>
              <TextInput
                style={[styles.input, { color: Colors.textMuted }]}
                value={phone}
                editable={false}
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          disabled={updateMutation.isPending}
          activeOpacity={0.85}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>Save changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <Text
      style={{
        fontFamily: "Poppins-SemiBold",
        fontSize: 13,
        color: Colors.textPrimary,
        marginBottom: 6,
        marginTop: 16,
      }}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 14,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 19,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  headerSpacer: { width: 32 },
  scroll: { paddingHorizontal: 20 },
  avatarSection: { alignItems: "center", paddingTop: 16, paddingBottom: 8 },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.navy,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  cameraDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.white,
  },
  avatarName: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  fieldsSection: { paddingTop: 8 },
  inputWrap: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 2,
    backgroundColor: Colors.white,
  },
  input: {
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 10,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
  },
  saveBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});
