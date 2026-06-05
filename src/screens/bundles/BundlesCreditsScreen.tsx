import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Polyline as SvgPolyline } from 'react-native-svg';
import ArrowBackSvg from '../../assets/icons/arrow_back.svg';
import TopupIconSvg from '../../assets/icons/topup_icon.svg';
import RenewIconSvg from '../../assets/icons/renew_icon.svg';
import HistoryIconSvg from '../../assets/icons/history_icon.svg';

const { width } = Dimensions.get('window');
const CHART_W = width - 40 - 28;
const CHART_H = 140;

const Colors = {
  white: '#FFFFFF',
  navy: '#0B1F3A',
  primary: '#4CD964',
  textPrimary: '#1A1A2E',
  textSecondary: '#5A6478',
  textMuted: '#9CA3AF',
  border: '#EFEFEF',
  inputBg: '#F2F4F7',
  red: '#FF6B6B',
  creditRed: '#E05252',
};

const CHART_DATA = [2200, 1800, 2500, 3800, 5500, 6200, 7800, 9000, 8500, 10500, 11200, 12800, 11500, 13500];
const DAY_LABELS = ['Mon\n15', 'Tue\n16', 'Wed\n17', 'Thu\n18', 'Fri\n19', 'Sat\n20', 'Sun\n21', 'Mon\n22'];

const RECENT = [
  { id: '1', destination: 'University of Ghana', date: '20 May . 12:34', amount: 'GHS 24', credit: '1 credit' },
  { id: '2', destination: 'ANYAA NIC BUS STOP', date: '18 May . 09:15', amount: 'GHS 24', credit: '1 credit' },
];

export default function BundlesCreditsScreen() {
  const navigation = useNavigation<any>();
  const [period] = useState('Weekly');
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(16)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, tension: 60, friction: 9, delay: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const maxVal = Math.max(...CHART_DATA);
  const points = CHART_DATA.map((v, i) => {
    const x = (i / (CHART_DATA.length - 1)) * CHART_W;
    const y = CHART_H - (v / maxVal) * CHART_H * 0.85;
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowBackSvg width={60} height={58} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bundles/Credits</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Dark Plan Card */}
        <Animated.View style={[styles.planCard, { transform: [{ scale: cardScale }] }]}>
          <Text style={styles.planName}>Starter Plan</Text>
          <Text style={styles.planCount}>3</Text>
          <Text style={styles.planSubtitle}>Deliveries left</Text>
          <Text style={styles.planExpiry}>
            Expires in <Text style={styles.planExpiryRed}>10 days</Text>
          </Text>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('BundlesFlow', { screen: 'Topup' })}
            activeOpacity={0.7}
          >
            {/* Replace with: <TopupIconSvg width={28} height={28} /> */}
            <TopupIconSvg width={28} height={28} />
            <Text style={styles.actionLabel}>Topup</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('BundlesFlow', { screen: 'Renew' })}
            activeOpacity={0.7}
          >
            <RenewIconSvg width={28} height={28} />
            <Text style={styles.actionLabel}>Renew</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('BundlesFlow', { screen: 'BundleHistory' })}activeOpacity={0.7}>
            <HistoryIconSvg width={28} height={28} />
            <Text style={styles.actionLabel}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Overview Chart */}
        <View style={styles.overviewSection}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Overview</Text>
            <TouchableOpacity style={styles.periodBtn} activeOpacity={0.75}>
              <Text style={styles.periodText}>{period}  ▾</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chartWrap}>
            {/* Y labels */}
            <View style={styles.yLabels}>
              {['15k', '12k', '9k', '6k', '3k', '0k'].map((l) => (
                <Text key={l} style={styles.yLabel}>{l}</Text>
              ))}
            </View>

            {/* Chart */}
            <View style={{ flex: 1 }}>
              <Svg width={CHART_W} height={CHART_H + 10}>
                <Defs>
                  <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={Colors.navy} stopOpacity="0.15" />
                    <Stop offset="1" stopColor={Colors.navy} stopOpacity="0.01" />
                  </SvgGradient>
                </Defs>
                <Path
                  d={`M0,${CHART_H} ${points} ${CHART_W},${CHART_H} Z`}
                  fill="url(#areaGrad)"
                />
                <SvgPolyline
                  points={points}
                  fill="none"
                  stroke={Colors.navy}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </Svg>

              {/* X labels */}
              <View style={styles.xLabels}>
                {DAY_LABELS.map((l, i) => (
                  <Text key={i} style={styles.xLabel}>{l}</Text>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Recent */}
        <Text style={styles.recentTitle}>Recent</Text>
        {RECENT.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.recentRow,
              index < RECENT.length - 1 && styles.recentRowBorder,
            ]}
          >
            {/*
              Replace with:
              <Image source={require('../../assets/images/bicycle_small.png')} style={styles.recentVehicleImg} resizeMode="contain" />
            */}
            <Image
              source={{ uri: 'https://via.placeholder.com/44x36/F5F5F5/888.png?text=🚲' }}
              style={styles.recentVehicleImg}
              resizeMode="contain"
            />
            <View style={styles.recentInfo}>
              <Text style={styles.recentDest}>{item.destination}</Text>
              <View style={styles.recentMeta}>
                <Text style={styles.recentDate}>{item.date}</Text>
                <Text style={styles.recentAmount}>{item.amount}</Text>
              </View>
            </View>
            <Text style={styles.recentCredit}>{item.credit}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 14,
    backgroundColor: Colors.white,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'HelveticaNeue-CondensedBold',
    fontSize: 19,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  headerSpacer: { width: 32 },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  // Plan card
  planCard: {
    backgroundColor: Colors.navy,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: Colors.primary,
    marginBottom: 8,
  },
  planCount: {
    fontFamily: 'HelveticaNeue-CondensedBold',
    fontSize: 80,
    color: Colors.white,
    lineHeight: 86,
    letterSpacing: -2,
  },
  planSubtitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: Colors.white,
    marginBottom: 6,
  },
  planExpiry: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  planExpiryRed: {
    color: Colors.red,
    fontFamily: 'Poppins-SemiBold',
  },

  // Actions
  actionsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  actionLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actionDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },

  // Chart
  overviewSection: { marginBottom: 24 },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  overviewTitle: {
    fontFamily: 'HelveticaNeue-CondensedBold',
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  periodBtn: {
    backgroundColor: Colors.inputBg,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  periodText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  chartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yLabels: {
    width: 28,
    height: CHART_H + 10,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  yLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  xLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    flex: 1,
  },

  // Recent
  recentTitle: {
    fontFamily: 'HelveticaNeue-CondensedBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  recentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recentVehicleImg: {
    width: 44,
    height: 36,
  },
  recentInfo: { flex: 1 },
  recentDest: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  recentMeta: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  recentDate: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  recentAmount: {
    fontFamily: 'HelveticaNeue-CondensedBold',
    fontSize: 13,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  recentCredit: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: Colors.creditRed,
  },
});

