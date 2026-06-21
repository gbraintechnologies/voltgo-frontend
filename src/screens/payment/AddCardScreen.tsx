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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ArrowBackSvg from "../../assets/icons/arrow_back.svg";

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
};

function formatCardNumber(val: string) {
  return val
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}
function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}
function getCardType(num: string) {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "VISA";
  if (/^5[1-5]/.test(n)) return "MC";
  return null;
}
function validateExpiry(val: string) {
  const [mm, yy] = val.split("/");
  if (!mm || !yy || yy.length < 2) return false;
  const month = parseInt(mm, 10);
  const year = 2000 + parseInt(yy, 10);
  const now = new Date();
  if (month < 1 || month > 12) return false;
  return (
    new Date(year, month - 1) >= new Date(now.getFullYear(), now.getMonth())
  );
}

export default function AddCardScreen() {
  const navigation = useNavigation<any>();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [touched, setTouched] = useState({
    cardNumber: false,
    cardName: false,
    expiry: false,
    cvv: false,
  });
  const [loading, setLoading] = useState(false);

  const cardNumFocus = useRef(new Animated.Value(0)).current;
  const cardNameFocus = useRef(new Animated.Value(0)).current;
  const expiryFocus = useRef(new Animated.Value(0)).current;
  const cvvFocus = useRef(new Animated.Value(0)).current;

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

  const cardType = getCardType(cardNumber);
  const rawCard = cardNumber.replace(/\s/g, "");

  const errors = {
    cardNumber:
      touched.cardNumber && rawCard.length !== 16
        ? "Enter a valid 16-digit card number"
        : "",
    cardName:
      touched.cardName && cardName.trim().length < 3
        ? "Enter the name on your card"
        : "",
    expiry:
      touched.expiry && !validateExpiry(expiry)
        ? "Enter a valid expiry date"
        : "",
    cvv: touched.cvv && cvv.length < 3 ? "CVV must be 3–4 digits" : "",
  };
  const isValid =
    rawCard.length === 16 &&
    cardName.trim().length >= 3 &&
    validateExpiry(expiry) &&
    cvv.length >= 3;

  const borderColor = (anim: Animated.Value, hasError: boolean) =>
    hasError
      ? Colors.error
      : anim.interpolate({
          inputRange: [0, 1],
          outputRange: [Colors.border, Colors.borderFocus],
        });

  const handleSave = async () => {
    setTouched({ cardNumber: true, cardName: true, expiry: true, cvv: true });
    if (!isValid) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    navigation.navigate("PaymentMethods"); // ← was 'PayWith'
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
        <Text style={styles.headerTitle}>Add Card</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card Preview */}
        <View style={styles.cardPreview}>
          <View style={styles.cardPreviewTop}>
            <View style={styles.cardChip} />
            {cardType && (
              <View
                style={[
                  styles.cardTypeBadge,
                  {
                    backgroundColor:
                      cardType === "VISA" ? "#1A1F71" : "#EB001B",
                  },
                ]}
              >
                <Text style={styles.cardTypeBadgeText}>{cardType}</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardPreviewNumber}>
            {cardNumber || "•••• •••• •••• ••••"}
          </Text>
          <View style={styles.cardPreviewBottom}>
            <View>
              <Text style={styles.cardPreviewLabel}>CARD HOLDER</Text>
              <Text style={styles.cardPreviewValue}>{cardName || "—"}</Text>
            </View>
            <View>
              <Text style={styles.cardPreviewLabel}>EXPIRES</Text>
              <Text style={styles.cardPreviewValue}>{expiry || "MM/YY"}</Text>
            </View>
          </View>
        </View>

        {/* Card Number */}
        <Text style={styles.sectionTitle}>Card Number</Text>
        <Animated.View
          style={[
            styles.inputWrap,
            { borderColor: borderColor(cardNumFocus, !!errors.cardNumber) },
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={Colors.textMuted}
            value={cardNumber}
            onChangeText={(v) => setCardNumber(formatCardNumber(v))}
            onFocus={() => animateFocus(cardNumFocus, true)}
            onBlur={() => {
              animateFocus(cardNumFocus, false);
              setTouched((t) => ({ ...t, cardNumber: true }));
            }}
            keyboardType="numeric"
            maxLength={19}
          />
        </Animated.View>
        {!!errors.cardNumber && (
          <Text style={styles.errorText}>{errors.cardNumber}</Text>
        )}

        {/* Card Name */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          Name on Card
        </Text>
        <Animated.View
          style={[
            styles.inputWrap,
            { borderColor: borderColor(cardNameFocus, !!errors.cardName) },
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="As printed on your card"
            placeholderTextColor={Colors.textMuted}
            value={cardName}
            onChangeText={setCardName}
            onFocus={() => animateFocus(cardNameFocus, true)}
            onBlur={() => {
              animateFocus(cardNameFocus, false);
              setTouched((t) => ({ ...t, cardName: true }));
            }}
            autoCapitalize="characters"
          />
        </Animated.View>
        {!!errors.cardName && (
          <Text style={styles.errorText}>{errors.cardName}</Text>
        )}

        {/* Expiry + CVV row */}
        <View style={styles.halfRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Expiry Date</Text>
            <Animated.View
              style={[
                styles.inputWrap,
                { borderColor: borderColor(expiryFocus, !!errors.expiry) },
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="MM/YY"
                placeholderTextColor={Colors.textMuted}
                value={expiry}
                onChangeText={(v) => setExpiry(formatExpiry(v))}
                onFocus={() => animateFocus(expiryFocus, true)}
                onBlur={() => {
                  animateFocus(expiryFocus, false);
                  setTouched((t) => ({ ...t, expiry: true }));
                }}
                keyboardType="numeric"
                maxLength={5}
              />
            </Animated.View>
            {!!errors.expiry && (
              <Text style={styles.errorText}>{errors.expiry}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>CVV</Text>
            <Animated.View
              style={[
                styles.inputWrap,
                { borderColor: borderColor(cvvFocus, !!errors.cvv) },
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="•••"
                placeholderTextColor={Colors.textMuted}
                value={cvv}
                onChangeText={(v) => setCvv(v.replace(/\D/g, "").slice(0, 4))}
                onFocus={() => animateFocus(cvvFocus, true)}
                onBlur={() => {
                  animateFocus(cvvFocus, false);
                  setTouched((t) => ({ ...t, cvv: true }));
                }}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </Animated.View>
            {!!errors.cvv && <Text style={styles.errorText}>{errors.cvv}</Text>}
          </View>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Card</Text>
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

  // Card Preview
  cardPreview: {
    backgroundColor: Colors.navy,
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  cardPreviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  cardChip: {
    width: 36,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#C8A951",
  },
  cardTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardTypeBadgeText: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 14,
    color: Colors.white,
    letterSpacing: 1,
  },
  cardPreviewNumber: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 22,
    color: Colors.white,
    letterSpacing: 3,
    marginBottom: 24,
  },
  cardPreviewBottom: { flexDirection: "row", justifyContent: "space-between" },
  cardPreviewLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 2,
    letterSpacing: 1,
  },
  cardPreviewValue: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: Colors.white,
  },

  sectionTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
    color: Colors.navy,
    marginBottom: 10,
    letterSpacing: 0.1,
  },
  inputWrap: {
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 16,
    paddingVertical: 4,
    // shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
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
  halfRow: { flexDirection: "row", gap: 12, marginTop: 20 },
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


