import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Image,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { DeliveryStackParamList } from "../../navigation/types";
import Svg, { Path, Circle } from "react-native-svg";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textMuted: "#9CA3AF",
  border: "#E8E8E8",
  inputBg: "#F2F4F7",
  successBg: "#E8F5ED",
  successText: "#1A7A3C",
};

type RouteParams = RouteProp<DeliveryStackParamList, "DeliveryComplete">;

export default function DeliveryCompleteScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const {
    riderName = "John Cena",
    riderRating = 4.5,
    itemType = "Parcel",
    isScheduled,
    scheduledTime,
  } = route.params ?? {};
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.7)).current;
  const [rating, setRating] = React.useState(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleIn, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeIn, transform: [{ scale: scaleIn }] },
        ]}
      >
        {/* Success icon */}
        <View style={styles.successCircle}>
          <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20 6L9 17L4 12"
              stroke={Colors.successText}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        <Text style={styles.heading}>Delivered!</Text>
        <Text style={styles.subheading}>
          Your {itemType.toLowerCase()} has been{"\n"}successfully delivered.
        </Text>

        {!isScheduled && (
          <>
            {/* Rider summary */}
            <View style={styles.riderCard}>
              {/*
            Replace with:
          */}
              {/* <Image
            source={{ uri: 'https://via.placeholder.com/52x52/0B1F3A/FFFFFF.png?text=J' }}
            style={styles.avatar}
          /> */}
              <Image
                source={require("../../assets/images/rider_john.png")}
                style={styles.avatar}
              />

              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{riderName}</Text>
                <Text style={styles.riderSub}>Your rider</Text>
              </View>
              <View style={styles.ratingDisplay}>
                <Svg width={14} height={14} viewBox="0 0 10 10" fill="none">
                  <Path
                    d="M5 1L6.18 3.64L9 4.07L7 6.12L7.47 9L5 7.64L2.53 9L3 6.12L1 4.07L3.82 3.64L5 1Z"
                    fill="#FFB800"
                  />
                </Svg>
                <Text style={styles.ratingNum}>{riderRating}</Text>
              </View>
            </View>

            {/* Rate rider */}
            <Text style={styles.rateLabel}>Rate your experience</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.8}
                >
                  <Svg width={36} height={36} viewBox="0 0 10 10" fill="none">
                    <Path
                      d="M5 1L6.18 3.64L9 4.07L7 6.12L7.47 9L5 7.64L2.53 9L3 6.12L1 4.07L3.82 3.64L5 1Z"
                      fill={star <= rating ? "#FFB800" : "#E0E4EA"}
                    />
                  </Svg>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fadeIn }]}>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.navigate("MainTabs")}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.newDeliveryBtn}
          onPress={() => navigation.navigate("DeliveryFlow")}
          activeOpacity={0.8}
        >
          <Text style={styles.newDeliveryText}>Send another parcel</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 80 : 60,
  },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  heading: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 32,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  subheading: {
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  riderCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    width: "100%",
    marginBottom: 32,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  riderInfo: { flex: 1 },
  riderName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  riderSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  ratingDisplay: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingNum: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  rateLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  starsRow: { flexDirection: "row", gap: 8 },
  footer: {
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 10,
    gap: 10,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
  },
  doneBtnText: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  newDeliveryBtn: {
    backgroundColor: Colors.inputBg,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
  },
  newDeliveryText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
});
