import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Ramp } from '../utils/theme';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

// Nocturne tags: tinted from the ramps, small radius (6), sentence case.
const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: Ramp.accent[800], text: Ramp.accent[100] },
  neutral: { bg: Ramp.neutral[800], text: Ramp.neutral[100] },
  success: { bg: `${Colors.success}26`, text: Colors.success },
  warning: { bg: `${Colors.warning}26`, text: Colors.warning },
  error: { bg: `${Colors.error}26`, text: Colors.error },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', size = 'md' }) => {
  const colors = VARIANT_COLORS[variant] ?? VARIANT_COLORS.neutral;
  return (
    <View style={[styles.base, { backgroundColor: colors.bg }, size === 'sm' && styles.sm]}>
      <Text style={[styles.text, { color: colors.text }, size === 'sm' && styles.textSm]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 6 },
  sm: { paddingVertical: 2, paddingHorizontal: Spacing.sm },
  text: { fontSize: 11, fontWeight: '500', letterSpacing: 0.2 },
  textSm: { fontSize: 10 },
});
