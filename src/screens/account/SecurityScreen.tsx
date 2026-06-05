import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, StatusBar, Switch, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import ArrowBackSvg from '../../assets/icons/arrow_back.svg';
import ChevronRightSvg from '../../assets/icons/chevron_right.svg';

const Colors = {
  white: '#FFFFFF', navy: '#0B1F3A', primary: '#4CD964',
  textPrimary: '#1A1A2E', textSecondary: '#5A6478',
  textMuted: '#9CA3AF', border: '#EFEFEF', inputBg: '#F2F4F7',
  successBg: '#E8F5ED', successText: '#1A7A3C',
};

export default function SecurityScreen() {
  const navigation = useNavigation<any>();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowBackSvg width={60} height={58} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView style={{ opacity: fadeIn }}
        contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Status badge */}
        <View style={styles.statusBadge}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3L4 6v6c0 4.42 3.58 8 8 9 4.42-1 8-4.58 8-9V6l-8-3z"
              stroke={Colors.successText} strokeWidth={1.8} strokeLinejoin="round" />
            <Path d="M9 12l2 2 4-4" stroke={Colors.successText}
              strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={styles.statusText}>Your account is secure</Text>
        </View>

        {/* Authentication section */}
        <Text style={styles.sectionTitle}>Authentication</Text>
        <View style={styles.card}>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Face ID / Biometrics</Text>
              <Text style={styles.rowSub}>Use face or fingerprint to log in</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#E0E4EA', true: Colors.primary }}
              thumbColor={Colors.white}
              ios_backgroundColor="#E0E4EA"
            />
          </View>
          <TouchableOpacity style={[styles.row, styles.rowBorder]} activeOpacity={0.7}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Change Password</Text>
              <Text style={styles.rowSub}>Update password</Text>
            </View>
            <ChevronRightSvg width={8} height={14} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} activeOpacity={0.7}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Change phone number</Text>
              <Text style={styles.rowSub}>+233 054 ••• 5064</Text>
            </View>
            <ChevronRightSvg width={8} height={14} />
          </TouchableOpacity>
        </View>

        {/* Sessions section */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Active sessions</Text>
        <View style={styles.card}>
          <View style={[styles.sessionRow, styles.rowBorder]}>
            <View style={styles.sessionDotActive} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>iPhone 14 Pro · Accra, GH</Text>
              <Text style={styles.rowSub}>Current session</Text>
            </View>
          </View>
          <View style={styles.sessionRow}>
            <View style={styles.sessionDotInactive} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>iPhone 13 · Kumasi, GH</Text>
              <Text style={styles.rowSub}>Last seen 3 days ago</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.revokeText}>Revoke</Text>
            </TouchableOpacity>
          </View>
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
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.successBg, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16, marginBottom: 24,
  },
  statusText: {
    fontFamily: 'Poppins-SemiBold', fontSize: 14, color: Colors.successText,
  },
  sectionTitle: {
    fontFamily: 'HelveticaNeue-CondensedBold', fontSize: 15,
    color: Colors.navy, marginBottom: 10, letterSpacing: 0.1,
  },
  card: { borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16,
    backgroundColor: Colors.white, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowText: { flex: 1 },
  rowLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: Colors.textPrimary },
  rowSub: { fontFamily: 'Poppins-Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  sessionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16, gap: 12,
    backgroundColor: Colors.white,
  },
  sessionDotActive: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary,
  },
  sessionDotInactive: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.textMuted,
  },
  revokeText: {
    fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#E05252',
  },
  dangerBtn: {
    borderRadius: 14, borderWidth: 1.5, borderColor: '#E05252',
    paddingVertical: 16, alignItems: 'center',
  },
  dangerText: {
    fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#E05252',
  },
});