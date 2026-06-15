import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  StatusBar,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";
import { useAddMomo } from "../../hooks/useApi";
import { MomoProvider } from "../../api/payments";
import { ApiError } from "../../api/client";
import * as Haptics from "expo-haptics";
import { useToast } from "@/components/common/Toast";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E8E8E8",
  borderFocus: "#0B1F3A",
  error: "#EF4444",
  inputBg: "#F2F4F7",
};

const NETWORKS: {
  id: MomoProvider;
  label: string;
  display: string;
  color: string;
  textColor: string;
}[] = [
  {
    id: "mtn_momo",
    label: "MTN",
    display: "MTN",        // unchanged
    color: "#FFCB00",
    textColor: "#0B1F3A",
  },
  {
    id: "vodafone_cash",
    label: "Tel",
    display: "Tel",        // was "Telecel"
    color: "#E2001A",
    textColor: "#FFFFFF",
  },
  {
    id: "airteltigo",
    label: "AT",
    display: "AT",         // was "AirtelTigo"
    color: "#0066B3",
    textColor: "#FFFFFF",
  },
];

function validatePhone(phone: string) {
  return /^0[235]\d{8}$/.test(phone.replace(/\s/g, ""));
}

export default function AddMobileMoneyScreen() {
  const toast = useToast();
  const navigation = useNavigation<any>();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  const [network, setNetwork] = useState<MomoProvider>("mtn_momo");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState({ name: false, phone: false });

  const nameFocus = useRef(new Animated.Value(0)).current;
  const phoneFocus = useRef(new Animated.Value(0)).current;

  const addMomoMutation = useAddMomo();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateFocus = (anim: Animated.Value, focused: boolean) => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const nameError =
    touched.name && name.trim().length < 3 ? "Enter a valid full name" : "";
  const phoneError =
    touched.phone && !validatePhone(phone)
      ? "Enter a valid Ghana mobile number"
      : "";
  const isValid = name.trim().length >= 3 && validatePhone(phone);

  const handleSave = async () => {
    setTouched({ name: true, phone: true });
    if (!isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    try {
      await addMomoMutation.mutateAsync({
        type: "momo",
        provider: network,
        account_name: name.trim(),
        account_number: phone.replace(/\s/g, ""),
        is_default: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success("Mobile Money added");
      navigation.navigate("PaymentMethods");
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(
        err instanceof ApiError ? err.message : "Failed to add payment method.",
      );
    }
  };

  const borderColor = (anim: Animated.Value, hasError: boolean) =>
    hasError
      ? Colors.error
      : anim.interpolate({
          inputRange: [0, 1],
          outputRange: [Colors.border, Colors.borderFocus],
        });

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
        <Text style={styles.headerTitle}>Mobile Money</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Network</Text>
        <View style={styles.networkRow}>
          {NETWORKS.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[
                styles.networkChip,
                network === n.id && styles.networkChipActive,
              ]}
              onPress={() => setNetwork(n.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.networkBadge, { backgroundColor: n.color }]}>
                <Text style={[styles.networkBadgeText, { color: n.textColor }]}>
                  {n.label}
                </Text>
              </View>
              <Text
                style={[
                  styles.networkLabel,
                  network === n.id && styles.networkLabelActive,
                ]}
              >
                {n.display}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Account Name</Text>
        <Animated.View
          style={[
            styles.inputWrap,
            { borderColor: borderColor(nameFocus, !!nameError) },
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="Full name on account"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            onFocus={() => animateFocus(nameFocus, true)}
            onBlur={() => {
              animateFocus(nameFocus, false);
              setTouched((t) => ({ ...t, name: true }));
            }}
            autoCapitalize="words"
          />
        </Animated.View>
        {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          Phone Number
        </Text>
        <Animated.View
          style={[
            styles.inputWrap,
            { borderColor: borderColor(phoneFocus, !!phoneError) },
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="e.g. 0546785064"
            placeholderTextColor={Colors.textMuted}
            value={phone}
            onChangeText={setPhone}
            onFocus={() => animateFocus(phoneFocus, true)}
            onBlur={() => {
              animateFocus(phoneFocus, false);
              setTouched((t) => ({ ...t, phone: true }));
            }}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </Animated.View>
        {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!isValid || addMomoMutation.isPending) && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={addMomoMutation.isPending}
        >
          {addMomoMutation.isPending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Mobile Money</Text>
          )}
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 16,
    backgroundColor: Colors.white,
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
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  sectionTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
    color: Colors.navy,
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  networkRow: { 
    flexDirection: "row", 
    gap: 10, 
    marginBottom: 24,
  },
  networkChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,   // reduced from 12
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 2,                    // always reserve border space
    borderColor: "transparent",        // invisible by default — no layout shift
    // removed all shadow props
  },
  networkChipActive: { borderColor: Colors.navy},
  networkBadge: {
    width: 34,
    height: 22,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  networkBadgeText: { fontFamily: "HelveticaNeue-CondensedBold", fontSize: 9 },
  networkLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  networkLabelActive: {
    fontFamily: "Poppins-SemiBold",
    color: Colors.textPrimary,
  },
  inputWrap: {
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },
  errorText: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.error,
    marginTop: 6,
    marginLeft: 4,
  },
  spacer: { height: 32 },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
