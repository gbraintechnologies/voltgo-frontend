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
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CloseXSvg from "../../assets/icons/close_x.svg";
import Calendersvg from "../../assets/icons/sendpackage-calender.svg";
import ChevronDownSvg from "../../assets/icons/chevrondown.svg";
import PinOutlineSvg from "../../assets/icons/pin_outline.svg";
import PinActiveSvg from "../../assets/icons/pin_location.svg";
import MapPinPersonSvg from "../../assets/icons/map_pin_person.svg";
import ClockSvg from "../../assets/icons/clock.svg";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useRoute } from "@react-navigation/native";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#AAAAAA",
  border: "#F0F0F0",
  inputBg: "#eeeeee",
  scheduleBg: "#0B3C5D",
};

const RECENT_LOCATIONS = [
  { id: 1, name: "ANYAA NIC BUS STOP", address: "Anyaa Awoshie, Accra" },
  { id: 2, name: "UNIVERSITY OF GHANA", address: "Great Hall Car Park" },
  {
    id: 3,
    name: "MTN KWAME NKRUMAH CIRCLE BRANCH",
    address: "Ring Road Central, Accra, Ghana",
  },
  { id: 4, name: "KWAME NKRUMH AVENUE", address: "Circle" },
];

export default function ChooseRouteScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [pickup] = useState("American House");
  const [dropoff, setDropoff] = useState("");

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;
  const dropoffRef = useRef<TextInput>(null);

  const [scheduledTime, setScheduledTime] = useState<string | null>(null);

  const route = useRoute<any>();

  useEffect(() => {
    if (route.params?.selectedTime) {
      setScheduledTime(route.params.selectedTime);
    }
  }, [route.params?.selectedTime]);

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
    ]).start(() => {
      dropoffRef.current?.focus();
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const params = navigation
        .getState()
        ?.routes?.find((r: any) => r.name === "SchedulePickup")?.params as any;
      if (params?.selectedTime) {
        setScheduledTime(params.selectedTime);
      }
    }, []),
  );

  const handleSelectLocation = (location: (typeof RECENT_LOCATIONS)[0]) => {
    navigation.navigate("DeliveryFlow", {
      screen: "DeliveryDetails",
      params: { pickup, dropoff: location.name },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CloseXSvg width={18} height={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Route</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View
        style={{
          opacity: fadeIn,
          transform: [{ translateY: slideUp }],
          flex: 1,
        }}
      >
        {/* Schedule Pill */}
        <View style={styles.schedulePillWrap}>
          <TouchableOpacity
            style={[
              styles.scheduleBtn,
              scheduledTime
                ? styles.scheduleBtnActive
                : styles.scheduleBtnInactive,
            ]}
            onPress={() => navigation.navigate("SchedulePickup")}
            activeOpacity={0.75}
          >
            <Calendersvg
              width={14}
              height={14}
              color={scheduledTime ? Colors.white : Colors.textSecondary}
            />
            <Text
              style={[
                styles.scheduleText,
                !scheduledTime && styles.scheduleTextInactive,
              ]}
            >
              {scheduledTime ?? "Schedule"}
            </Text>
            <ChevronDownSvg
              width={13}
              height={13}
              color={scheduledTime ? Colors.white : Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Route Inputs */}
        <View style={styles.inputsSection}>
          {/* Pickup — grey/inactive */}
          <View style={styles.inputWrap}>
            <PinOutlineSvg width={18} height={18} style={styles.pinIcon} />
            <Text style={styles.inputText}>{pickup}</Text>
          </View>

          {/* Dropoff — navy border/active */}
          <View style={[styles.inputWrap, styles.inputWrapActive]}>
            <PinActiveSvg width={18} height={18} style={styles.pinIcon} />
            <TextInput
              ref={dropoffRef}
              style={styles.textInput}
              placeholder="Dropoff location"
              placeholderTextColor="#AAAAAA"
              value={dropoff}
              onChangeText={setDropoff}
              returnKeyType="search"
            />
            <MapPinPersonSvg width={20} height={20} />
          </View>
        </View>

        {/* Recent Locations */}
        <ScrollView
          style={styles.listSection}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {RECENT_LOCATIONS.map((loc, index) => (
            <TouchableOpacity
              key={loc.id}
              style={[
                styles.locationRow,
                index < RECENT_LOCATIONS.length - 1 && styles.locationRowBorder,
              ]}
              onPress={() => handleSelectLocation(loc)}
              activeOpacity={0.7}
            >
              <View style={styles.clockIconWrap}>
                <ClockSvg width={20} height={20} />
              </View>
              <View style={styles.locationTextWrap}>
                <Text style={styles.locationName}>{loc.name}</Text>
                <Text style={styles.locationAddress}>{loc.address}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 8 : 12,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  closeBtn: {
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

  schedulePillWrap: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.scheduleBg,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
    gap: 6,
  },
  scheduleText: {
    fontFamily: "Poppins-Medium",
    fontSize: 13,
    color: Colors.white,
  },

  inputsSection: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputWrapActive: {
    borderColor: Colors.navy,
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pinIcon: {
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  textInput: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: Colors.textPrimary,
    padding: 0,
  },

  listSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 15,
  },
  locationRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  clockIconWrap: {
    marginRight: 14,
    marginTop: 1,
  },
  locationTextWrap: {
    flex: 1,
  },
  locationName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  locationAddress: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: Colors.textMuted,
  },
  scheduleBtnActive: {
    backgroundColor: Colors.scheduleBg, // navy blue — time is selected
  },
  scheduleBtnInactive: {
    backgroundColor: Colors.inputBg, // grey — nothing selected yet
  },

  scheduleTextInactive: {
    color: Colors.textSecondary, // grey text when no schedule
  },
});


