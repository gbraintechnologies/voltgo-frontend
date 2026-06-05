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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
// Replace placeholder with:
// import CameraSvg from '../../assets/icons/camera.svg';

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
  const [name, setName] = useState("Cephas Ntiamoah");
  const [email, setEmail] = useState("cephasntiamoah10@gmail.com");
  const [phone, setPhone] = useState("+233 054 678 5064");

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

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

      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {/*
              Replace with:
              <Image source={require('../../assets/images/avatar_user.jpg')} style={styles.avatar} />
            */}
            <Image
              source={require("../../assets/images/rider_john.png")}
              style={styles.avatar}
            />

            <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8}>
              {/* Replace with: <CameraSvg width={16} height={16} /> */}
              <View style={styles.cameraDot} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarName}>{name}</Text>
        </View>

        {/* Fields */}
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
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <FieldLabel label="Phone number" />
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85}>
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
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});
