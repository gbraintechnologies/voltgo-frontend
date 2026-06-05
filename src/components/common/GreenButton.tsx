import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '../../theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: object;
}

export default function GreenButton({ label, onPress, loading, disabled, style }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={onPress}
      activeOpacity={0.82}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={Colors.navy} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xl,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: 'Nunito-Bold',
    fontSize: Typography.md,
    color: Colors.navy,
  },
});
