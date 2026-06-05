import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ArrowBackSvg from '../../assets/icons/arrow_back.svg';

const Colors = {
  white: '#FFFFFF',
  navy: '#0B1F3A',
  primary: '#4CD964',
  textPrimary: '#1A1A2E',
  textSecondary: '#5A6478',
  textMuted: '#9CA3AF',
  border: '#E8E8E8',
  inputBg: '#F2F4F7',
};

const PLANS = [
  { id: 'starter',      name: 'Starter Pack',       deliveries: 5,   expiry: '30 days',  price: 'GHS 75.00',    priceRaw: 75 },
  { id: 'business_lite',name: 'Business Lite',       deliveries: 15,  expiry: '60 days',  price: 'GHS 200.00',   priceRaw: 200 },
  { id: 'business_pro', name: 'Business Pro',        deliveries: 40,  expiry: '90 days',  price: 'GHS 480.00',   priceRaw: 480 },
  { id: 'enterprise',   name: 'Enterprise',          deliveries: 100, expiry: '180 days', price: 'GHS 1000.00',  priceRaw: 1000 },
  { id: 'custom',       name: 'Custom\nNegotiated',  deliveries: null,expiry: 'Custom',   price: 'Custom',       priceRaw: null },
];

export default function RenewScreen() {
  const navigation = useNavigation<any>();
  const [selected, setSelected] = useState('starter');
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleProceed = () => {
    const plan = PLANS.find((p) => p.id === selected);
    navigation.navigate('BundlesFlow', { screen: 'BundlePayment', params: { plan } });
  };

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
        <Text style={styles.headerTitle}>Renew</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.View style={[{ flex: 1 }, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        <Text style={styles.subtitle}>Select plan</Text>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, selected === plan.id && styles.planCardSelected]}
              onPress={() => setSelected(plan.id)}
              activeOpacity={0.82}
            >
              {/*
                Replace with:
              */}
              {/* <Image
                source={{ uri: 'https://via.placeholder.com/56x56/F5F5F5/888.png?text=🏅' }}
                style={styles.medalImg}
                resizeMode="contain"
              /> */}
                              <Image source={require('../../assets/images/medal_icon.png')} style={styles.medalImg} resizeMode="contain" />


              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.name}</Text>
                {plan.deliveries !== null && (
                  <Text style={styles.planDeliveries}>{plan.deliveries} Deliveries</Text>
                )}
                <Text style={styles.planExpiry}>
                  {plan.expiry === 'Custom' ? 'Custom' : `Expires in ${plan.expiry}`}
                </Text>
              </View>

              <View style={styles.planRight}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <View style={[styles.radioOuter, selected === plan.id && styles.radioOuterActive]}>
                  {selected === plan.id && <View style={styles.radioInner} />}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Proceed button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed} activeOpacity={0.85}>
            <Text style={styles.proceedBtnText}>Proceed</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
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

  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
    backgroundColor: Colors.white,
  },
  planCardSelected: {
    borderColor: Colors.navy,
    borderWidth: 2,
  },
  medalImg: {
    width: 56,
    height: 56,
  },
  planInfo: { flex: 1 },
  planName: {
    fontFamily: 'HelveticaNeue-CondensedBold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  planDeliveries: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  planExpiry: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  planRight: {
    alignItems: 'center',
    gap: 8,
  },
  planPrice: {
    fontFamily: 'HelveticaNeue-CondensedBold',
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
    textAlign: 'right',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: Colors.navy,
    backgroundColor: Colors.navy,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 10,
    backgroundColor: Colors.white,
  },
  proceedBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedBtnText: {
    fontFamily: 'HelveticaNeue-CondensedBold',
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});