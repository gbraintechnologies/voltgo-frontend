import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, StatusBar, Switch, Platform, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import ArrowBackSvg from '../../assets/icons/arrow_back.svg';
import ChevronRightSvg from '../../assets/icons/chevron_right.svg';
import { useBiometrics } from '../../hooks/useBiometrics';
import { biometricStorage } from '../../utils/biometrics';
import { useAuthStore } from '../../stores/authStore';
import * as Haptics from 'expo-haptics';

const Colors = {
  white: '#FFFFFF', navy: '#0B1F3A', primary: '#4CD964',
  textPrimary: '#1A1A2E', textSecondary: '#5A6478',
  textMuted: '#9CA3AF', border: '#EFEFEF', inputBg: '#F2F4F7',
  successBg: '#E8F5ED', successText: '#1A7A3C',
};

export default function SecurityScreen() {
  const navigation = useNavigation<any>();
  const fadeIn = useRef(new Animated.Value(0)).current;

  const { biometricType, isEnabled, isReady, label, enable, disable } = useBiometrics();
  const [toggling, setToggling] = useState(false);

  // We need the stored credentials to re-enable biometrics from settings
  const customer = useAuthStore((s) => s.customer);

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    if (toggling) return;
    setToggling(true);
    try {
      if (value) {
        // To enable from Settings we need stored credentials
        const creds = await biometricStorage.getCredentials();
        if (!creds) {
          Alert.alert(
            'Re-login Required',
            'Please log out and log in again to set up biometrics.',
          );
          setToggling(false);
          return;
        }
        const success = await enable(creds.phone, creds.password);
        if (success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } else {
        Alert.alert(
          `Disable ${label}?`,
          `You'll need to use your password to sign in.`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setToggling(false) },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                await disable();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setToggling(false);
              },
            },
          ],
        );
        return; // setToggling handled in alert callbacks
      }
    } catch {
      Alert.alert('Error', 'Could not update biometric setting.');
    }
    setToggling(false);
  };

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

        <View style={styles.statusBadge}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3L4 6v6c0 4.42 3.58 8 8 9 4.42-1 8-4.58 8-9V6l-8-3z"
              stroke={Colors.successText} strokeWidth={1.8} strokeLinejoin="round" />
            <Path d="M9 12l2 2 4-4" stroke={Colors.successText}
              strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={styles.statusText}>Your account is secure</Text>
        </View>

        <Text style={styles.sectionTitle}>Authentication</Text>
        <View style={styles.card}>

          {/* Biometric row — only shown if device supports it */}
          {isReady && biometricType && (
            <View style={[styles.row, styles.rowBorder]}>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowSub}>
                  {isEnabled
                    ? `${label} is active for sign-in`
                    : `Use ${label} to sign in faster`}
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={handleBiometricToggle}
                disabled={toggling}
                trackColor={{ false: '#E0E4EA', true: Colors.primary }}
                thumbColor={Colors.white}
                ios_backgroundColor="#E0E4EA"
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.row, styles.rowBorder]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Change Password</Text>
              <Text style={styles.rowSub}>Update your password</Text>
            </View>
            <ChevronRightSvg width={8} height={14} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} activeOpacity={0.7}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Change phone number</Text>
              <Text style={styles.rowSub}>
                {customer?.phone
                  ? customer.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1••••$2')
                  : '+233 054 ••• 5064'}
              </Text>
            </View>
            <ChevronRightSvg width={8} height={14} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Active sessions</Text>
        <View style={styles.card}>
          <View style={[styles.sessionRow, styles.rowBorder]}>
            <View style={styles.sessionDotActive} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>This device · Accra, GH</Text>
              <Text style={styles.rowSub}>Current session</Text>
            </View>
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
  statusText: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: Colors.successText },
  sectionTitle: {
    fontFamily: 'Poppins-Bold', fontSize: 15,
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
    paddingVertical: 16, paddingHorizontal: 16,
    gap: 12, backgroundColor: Colors.white,
  },
  sessionDotActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
});