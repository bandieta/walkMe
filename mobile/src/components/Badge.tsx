import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../utils/theme';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: `${Colors.primary}30`, text: Colors.primary },
  success: { bg: `${Colors.success}30`, text: Colors.success },
  warning: { bg: `${Colors.warning}30`, text: Colors.warning },
  error: { bg: `${Colors.error}30`, text: Colors.error },
  neutral: { bg: Colors.border, text: Colors.textSecondary },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', size = 'md' }) => {
  const colors = VARIANT_COLORS[variant];

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors.bg },
        size === 'sm' && styles.sm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors.text },
          size === 'sm' && styles.textSm,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
  },
  sm: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs + 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  textSm: { fontSize: 10 },
});
