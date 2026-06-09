import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Animated, StatusBar, Linking, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import ArrowBackSvg from '../../assets/icons/arrow_back.svg';
import ChevronRightSvg from '../../assets/icons/chevron_right.svg';

const Colors = {
  white: '#FFFFFF', navy: '#0B1F3A', primary: '#4CD964',
  textPrimary: '#1A1A2E', textSecondary: '#5A6478',
  textMuted: '#9CA3AF', border: '#EFEFEF', inputBg: '#F2F4F7',
};

const FAQS = [
  { id: '1', q: 'How do I track my delivery?', a: 'Once a rider is assigned, the map updates in real time from the Active Delivery screen.' },
  { id: '2', q: 'Can I cancel an order?', a: 'You can cancel before a rider is assigned. Once matched, a cancellation fee may apply.' },
  { id: '3', q: 'How do Bundle Credits work?', a: 'Bundle Credits are pre-paid delivery packs. Each delivery costs 1 credit, deducted automatically at checkout.' },
  { id: '4', q: 'What if my parcel is damaged?', a: 'Contact support immediately with photos. We\'ll review and resolve within 48 hours.' },
];

export default function SupportScreen() {
  const navigation = useNavigation<any>();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [message, setMessage] = useState('');

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
        <Text style={styles.headerTitle}>Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView style={{ opacity: fadeIn }}
        contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Quick contact */}
        <Text style={styles.sectionTitle}>Contact us</Text>
        <View style={styles.contactCard}>
          <TouchableOpacity style={[styles.contactRow, styles.rowBorder]}
            onPress={() => Linking.openURL('tel:+233302000000')} activeOpacity={0.7}>
            <View style={[styles.contactIcon, { backgroundColor: '#E8F5ED' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M4 2h4l2 5-2.5 1.5C8.57 10.67 13.33 15.43 15.5 17.5L17 15l5 2v4c0 1.1-.9 2-2 2C9.16 22 2 14.84 2 6c0-1.1.9-2 2-2z"
                  stroke="#1A7A3C" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>Call support</Text>
              <Text style={styles.contactSub}>+233 302 000 000  ·  8am–8pm</Text>
            </View>
            <ChevronRightSvg width={8} height={14} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.contactRow, styles.rowBorder]}
            onPress={() => Linking.openURL('https://wa.me/233302000000')} activeOpacity={0.7}>
            <View style={[styles.contactIcon, { backgroundColor: '#E8F5ED' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M21 12c0 4.97-4.03 9-9 9a8.96 8.96 0 01-4.5-1.2L3 21l1.2-4.5A8.96 8.96 0 013 12c0-4.97 4.03-9 9-9s9 4.03 9 9z"
                  stroke="#1A7A3C" strokeWidth={1.8} strokeLinejoin="round" fill="none" />
              </Svg>
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>WhatsApp</Text>
              <Text style={styles.contactSub}>Usually replies within minutes</Text>
            </View>
            <ChevronRightSvg width={8} height={14} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactRow}
            onPress={() => Linking.openURL('mailto:support@voltgo.app')} activeOpacity={0.7}>
            <View style={[styles.contactIcon, { backgroundColor: '#E8F4FF' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  stroke="#185FA5" strokeWidth={1.8} strokeLinejoin="round" fill="none" />
                <Path d="M22 6L12 13 2 6" stroke="#185FA5" strokeWidth={1.8} strokeLinecap="round" />
              </Svg>
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactSub}>support@voltgo.app</Text>
            </View>
            <ChevronRightSvg width={8} height={14} />
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>FAQs</Text>
        <View style={styles.faqCard}>
          {FAQS.map((faq, index) => (
            <View key={faq.id}
              style={[styles.faqItem, index < FAQS.length - 1 && styles.rowBorder]}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                activeOpacity={0.7}>
                <Text style={styles.faqQ}>{faq.q}</Text>
                <Text style={styles.faqChevron}>{openFaq === faq.id ? '−' : '+'}</Text>
              </TouchableOpacity>
              {openFaq === faq.id && (
                <Text style={styles.faqA}>{faq.a}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Send message */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Send a message</Text>
        <View style={styles.messageWrap}>
          <TextInput
            style={styles.messageInput}
            placeholder="Describe your issue..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={[styles.sendBtn, !message.trim() && { opacity: 0.5 }]}
          activeOpacity={0.85} disabled={!message.trim()}>
          <Text style={styles.sendBtnText}>Send message</Text>
        </TouchableOpacity>

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
  sectionTitle: {
    fontFamily: 'Poppins-Bold', fontSize: 15,
    color: Colors.navy, marginBottom: 10, letterSpacing: 0.1,
  },
  contactCard: { borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: Colors.white, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  contactIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  contactText: { flex: 1 },
  contactLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: Colors.textPrimary },
  contactSub: { fontFamily: 'Poppins-Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  faqCard: { borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  faqItem: { backgroundColor: Colors.white, paddingHorizontal: 16 },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 8 },
  faqQ: { flex: 1, fontFamily: 'Poppins-SemiBold', fontSize: 14, color: Colors.textPrimary },
  faqChevron: { fontFamily: 'Poppins-Regular', fontSize: 18, color: Colors.textMuted },
  faqA: {
    fontFamily: 'Poppins-Regular', fontSize: 13, color: Colors.textSecondary,
    lineHeight: 20, paddingBottom: 14,
  },
  messageWrap: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 4, marginBottom: 14,
  },
  messageInput: {
    fontFamily: 'Poppins-Regular', fontSize: 14,
    color: Colors.textPrimary, minHeight: 100, paddingVertical: 12,
  },
  sendBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 17, alignItems: 'center',
  },
  sendBtnText: {
    fontFamily: 'Poppins-SemiBold', fontSize: 15,
    color: Colors.textPrimary, letterSpacing: 0.3,
  },
});