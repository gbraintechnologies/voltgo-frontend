/**
 * ScreenHeader — top header bar used across all main screens
 * Supports back arrow (←) or close (×) icon
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';

interface Props {
  title: string;
  onBack?: () => void;
  /** 'back' shows ← arrow, 'close' shows × */
  backIcon?: 'back' | 'close';
  rightElement?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  onBack,
  backIcon = 'back',
  rightElement,
}: Props) {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <View style={styles.container}>
        {/* Left */}
        <View style={styles.side}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.iconBtn} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.icon}>{backIcon === 'close' ? '✕' : '←'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Centre */}
        <Text style={styles.title}>{title}</Text>

        {/* Right */}
        <View style={styles.side}>
          {rightElement || null}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  side: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  iconBtn: {
    padding: 4,
  },
  icon: {
    fontSize: 20,
    color: Colors.textPrimary,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Nunito-ExtraBold',
    fontSize: Typography.lg,
    color: Colors.textPrimary,
  },
});
