import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../utils/theme';

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  emoji, title, subtitle, ctaLabel, onCta,
}) => (
  <View style={styles.container}>
    <Text style={styles.emoji}>{emoji}</Text>
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    {ctaLabel && onCta && (
      <TouchableOpacity style={styles.btn} onPress={onCta} activeOpacity={0.85}>
        <Text style={styles.btnText}>{ctaLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emoji: { fontSize: 56, marginBottom: Spacing.lg },
  title: { ...Typography.h2, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    ...Shadow.card,
  },
  btnText: { ...Typography.body, color: '#fff', fontWeight: '700' },
});
