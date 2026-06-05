import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar, Platform, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import ArrowBackSvg from '../../assets/icons/arrow_back.svg';

const Colors = {
  white: '#FFFFFF', navy: '#0B1F3A', primary: '#4CD964',
  textPrimary: '#1A1A2E', textMuted: '#9CA3AF',
  border: '#EFEFEF', creditRed: '#E05252', creditGreen: '#1A8A3C',
};

// Topup bolt icon
const TopupIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z"
      stroke={Colors.creditGreen}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Renew/refresh icon
const RenewIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4v5h5M20 20v-5h-5"
      stroke={Colors.creditGreen}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4 9a8 8 0 0114.54-3M20 15a8 8 0 01-14.54 3"
      stroke={Colors.creditGreen}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

const HISTORY = [
  {
    id: 'h1', month: 'May 2026', type: 'renewal',
    plan: 'Starter Pack', date: '20 May · 10:15',
    amount: 'GHS 75.00', credits: '+5 credits', positive: true,
  },
  {
    id: 'h2', month: 'May 2026', type: 'usage',
    plan: 'University of Ghana', date: '20 May · 12:34',
    amount: 'GHS 24.00', credits: '-1 credit', positive: false,
  },
  {
    id: 'h3', month: 'May 2026', type: 'usage',
    plan: 'Madina Old Station', date: '18 May · 09:15',
    amount: 'GHS 24.00', credits: '-1 credit', positive: false,
  },
  {
    id: 'h4', month: 'Feb 2026', type: 'topup',
    plan: 'Top-up · 3 credits', date: '14 Feb · 14:00',
    amount: 'GHS 45.00', credits: '+3 credits', positive: true,
  },
  {
    id: 'h5', month: 'Feb 2026', type: 'usage',
    plan: 'East Legon Americana', date: '10 Feb · 08:50',
    amount: 'GHS 24.00', credits: '-1 credit', positive: false,
  },
];

export default function BundleHistoryScreen() {
  const navigation = useNavigation<any>();
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  const grouped = HISTORY.reduce<Record<string, typeof HISTORY>>((acc, item) => {
    if (!acc[item.month]) acc[item.month] = [];
    acc[item.month].push(item);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowBackSvg width={60} height={58} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(grouped).map(([month, items]) => (
          <View key={month}>
            <View style={styles.monthRow}>
              <Text style={styles.monthHeader}>{month}</Text>
              <View style={styles.monthLine} />
            </View>

            {items.map((item, index) => (
              <View
                key={item.id}
                style={[styles.row, index < items.length - 1 && styles.rowBorder]}
              >
                <View style={[
                  styles.iconWrap,
                  { backgroundColor: item.positive ? '#EDFBF1' : '#FFF4F4' },
                ]}>
                  {item.type === 'usage' ? (
                    <Image
                      source={require('../../assets/images/bicycle_small.png')}
                      style={styles.vehicleImg}
                      resizeMode="contain"
                    />
                  ) : item.type === 'topup' ? (
                    <TopupIcon />
                  ) : (
                    <RenewIcon />
                  )}
                </View>

                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{item.plan}</Text>
                  <Text style={styles.rowDate}>{item.date}</Text>
                </View>

                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>{item.amount}</Text>
                  <Text style={[
                    styles.rowCredits,
                    { color: item.positive ? Colors.creditGreen : Colors.creditRed },
                  ]}>
                    {item.credits}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
        <View style={{ height: 48 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 14, backgroundColor: Colors.white,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontFamily: 'HelveticaNeue-CondensedBold', fontSize: 19,
    color: Colors.textPrimary, letterSpacing: 0.2,
  },
  headerSpacer: { width: 32 },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  monthRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 14, marginTop: 6,
  },
  monthHeader: {
    fontFamily: 'HelveticaNeue-CondensedBold', fontSize: 16,
    color: Colors.textPrimary, flexShrink: 0,
  },
  monthLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  vehicleImg: { width: 36, height: 28 },
  rowInfo: { flex: 1 },
  rowTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 2 },
  rowDate: { fontFamily: 'Poppins-Regular', fontSize: 12, color: Colors.textMuted },
  rowRight: { alignItems: 'flex-end', gap: 3 },
  rowAmount: {
    fontFamily: 'HelveticaNeue-CondensedBold', fontSize: 14,
    color: Colors.textPrimary, letterSpacing: 0.1,
  },
  rowCredits: { fontFamily: 'Poppins-SemiBold', fontSize: 12 },
});