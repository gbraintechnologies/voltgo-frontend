import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import CloseXSvg from "../../assets/icons/close_x.svg";

const Colors = {
  white: "#FFFFFF",
  navy: "#0B1F3A",
  primary: "#4CD964",
  textPrimary: "#1A1A2E",
  textSecondary: "#5A6478",
  textMuted: "#9CA3AF",
  border: "#E8E8E8",
  inputBg: "#F2F4F7",
  radioInactive: "#D0D6E0",
};

function getDates(showAll: boolean) {
  const today = new Date();
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const dayName = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "long" });

  const base = [
    { id: "0", label: "Today", sub: fmt(today) },
    {
      id: "1",
      label: "Tomorrow",
      sub: fmt(new Date(today.getTime() + 86400000)),
    },
  ];

  const extra = [2, 3, 4, 5, 6].map((i) => {
    const d = new Date(today.getTime() + i * 86400000);
    return { id: String(i), label: dayName(d), sub: fmt(d) };
  });

  return showAll ? [...base, ...extra] : [...base, extra[0]];
}

function getTimeSlots() {
  const slots = [];
  for (let h = 1; h <= 23; h++) {
    const start = `${String(h).padStart(2, "0")}:00`;
    const end = `${String(h).padStart(2, "0")}:30`;
    slots.push({ id: String(h), label: `${start} - ${end}` });
  }
  return slots;
}

const TIME_SLOTS = getTimeSlots();

export default function SchedulePickupScreen() {
  const navigation = useNavigation<any>();
  const [showAllDates, setShowAllDates] = useState(false);
  const DATES = getDates(showAllDates);
  const [selectedDate, setSelectedDate] = useState("0");
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0].id);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

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

  const handleSelectTime = () => {
    const date = DATES.find((d) => d.id === selectedDate);
    const slot = TIME_SLOTS.find((s) => s.id === selectedSlot);
    navigation.navigate("ChooseRoute", {
      selectedTime: `${date?.label}, ${slot?.label}`,
    });
  };

  return (
    <View style={styles.container}>
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
        <Text style={styles.headerTitle}>Schedule Pick - up</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        {/* Date Pills */}
        <View style={styles.datePillsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datePillsContainer}
          >
            {DATES.map((date) => (
              <TouchableOpacity
                key={date.id}
                style={[
                  styles.datePill,
                  selectedDate === date.id && styles.datePillSelected,
                ]}
                onPress={() => setSelectedDate(date.id)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.datePillLabel,
                    selectedDate === date.id && styles.datePillLabelSelected,
                  ]}
                >
                  {date.label}
                </Text>
                <Text
                  style={[
                    styles.datePillSub,
                    selectedDate === date.id && styles.datePillSubSelected,
                  ]}
                >
                  {date.sub}
                </Text>
              </TouchableOpacity>
            ))}

            {/* More / Less toggle */}
            <TouchableOpacity
              style={styles.datePill}
              activeOpacity={0.75}
              onPress={() => setShowAllDates((prev) => !prev)}
            >
              <Text style={styles.morePillText}>
                {showAllDates ? "‹ Less" : "More ›"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Time Slots */}
        <ScrollView
          style={styles.slotList}
          showsVerticalScrollIndicator={false}
        >
          {TIME_SLOTS.map((slot, index) => (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.slotRow,
                index < TIME_SLOTS.length - 1 && styles.slotRowBorder,
              ]}
              onPress={() => setSelectedSlot(slot.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.slotLabel}>{slot.label}</Text>
              <View
                style={[
                  styles.radioOuter,
                  selectedSlot === slot.id && styles.radioOuterActive,
                ]}
              >
                {selectedSlot === slot.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={handleSelectTime}
          activeOpacity={0.85}
        >
          <Text style={styles.selectBtnText}>Select time</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
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
  content: { flex: 1 },
  datePillsWrapper: { height: 96 },
  datePillsContainer: {
    paddingHorizontal: 20,
    gap: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  datePill: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 86,
    alignItems: "center",
    justifyContent: "center",
  },
  datePillSelected: {
    borderColor: Colors.navy,
    borderWidth: 2,
    backgroundColor: Colors.navy, // ← filled when selected
  },
  datePillLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  datePillLabelSelected: { color: Colors.white }, // ← white text when selected
  datePillSub: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: "center",
  },
  datePillSubSelected: { color: "rgba(255,255,255,0.75)" }, // ← dimmed white
  morePillText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: Colors.textSecondary,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  slotList: { flex: 1, paddingHorizontal: 20 },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 19,
  },
  slotRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  slotLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: Colors.textPrimary,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.radioInactive,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: Colors.navy,
    backgroundColor: Colors.navy,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.white,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 10,
    gap: 10,
    backgroundColor: Colors.white,
  },
  selectBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  selectBtnText: {
    fontFamily: "HelveticaNeue-CondensedBold",
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  cancelBtn: {
    backgroundColor: Colors.inputBg,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
  },
  cancelText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
  },
});


