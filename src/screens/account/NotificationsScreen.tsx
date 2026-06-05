import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar, Switch, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ArrowBackSvg from '../../assets/icons/arrow_back.svg';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const Colors = {
  white: '#FFFFFF', navy: '#0B1F3A', primary: '#4CD964',
  textPrimary: '#1A1A2E', textMuted: '#9CA3AF', border: '#EFEFEF',
};

// Push notification bell icon
const PushIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M6 10a6 6 0 0112 0v4l2 2H4l2-2v-4z"
      stroke={Colors.navy} strokeWidth={1.6} strokeLinejoin="round" />
    <Path d="M10 20a2 2 0 004 0"
      stroke={Colors.navy} strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);

// Email icon
const EmailIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Rect x={2} y={4} width={20} height={16} rx={2}
      stroke={Colors.navy} strokeWidth={1.6} />
    <Path d="M2 7l10 7 10-7"
      stroke={Colors.navy} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// SMS icon
const SmsIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
      stroke={Colors.navy} strokeWidth={1.6} strokeLinejoin="round" />
    <Circle cx={9} cy={10} r={1} fill={Colors.navy} />
    <Circle cx={12} cy={10} r={1} fill={Colors.navy} />
    <Circle cx={15} cy={10} r={1} fill={Colors.navy} />
  </Svg>
);

const NOTIFICATION_CHANNELS = [
  {
    id: 'push',
    label: 'Push notifications',
    sub: 'Delivery updates, alerts and reminders on your device',
    Icon: PushIcon,
  },
  {
    id: 'email',
    label: 'Email notifications',
    sub: 'Receipts, summaries and account updates to your inbox',
    Icon: EmailIcon,
  },
  {
    id: 'sms',
    label: 'SMS notifications',
    sub: 'Critical delivery updates sent to your phone number',
    Icon: SmsIcon,
  },
];

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    push: true,
    email: false,
    sms: true,
  });

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const toggle = (id: string) => setEnabled(p => ({ ...p, [id]: !p[id] }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowBackSvg width={60} height={58} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView style={{ opacity: fadeIn }}
        contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.hint}>
          Choose how you'd like to receive updates from VoltGo.
        </Text>

        <Text style={styles.sectionTitle}>Channels</Text>

        <View style={styles.card}>
          {NOTIFICATION_CHANNELS.map((item, index) => (
            <View
              key={item.id}
              style={[styles.row, index < NOTIFICATION_CHANNELS.length - 1 && styles.rowBorder]}
            >
              <View style={styles.iconWrap}>
                <item.Icon />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowSub}>{item.sub}</Text>
              </View>
              <Switch
                value={enabled[item.id]}
                onValueChange={() => toggle(item.id)}
                trackColor={{ false: '#E0E4EA', true: Colors.primary }}
                thumbColor={Colors.white}
                ios_backgroundColor="#E0E4EA"
              />
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 14,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1, textAlign: 'center', fontFamily: 'HelveticaNeue-CondensedBold',
    fontSize: 19, color: Colors.textPrimary, letterSpacing: 0.2,
  },
  headerSpacer: { width: 32 },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  hint: {
    fontFamily: 'Poppins-Regular', fontSize: 13,
    color: Colors.textMuted, marginBottom: 20, lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: 'HelveticaNeue-CondensedBold', fontSize: 15,
    color: Colors.navy, marginBottom: 10, letterSpacing: 0.1,
  },
  card: { borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16,
    backgroundColor: Colors.white, gap: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F2F4F7',
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: Colors.textPrimary },
  rowSub: {
    fontFamily: 'Poppins-Regular', fontSize: 12,
    color: Colors.textMuted, marginTop: 2, lineHeight: 17,
  },
});