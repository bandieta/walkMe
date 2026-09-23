import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../utils/theme';
import { Button } from './Button';
import { Icon, IconName } from './Icon';

interface EmptyStateProps {
  icon?: IconName;
  /** Legacy: an emoji instead of an icon. Prefer `icon`. */
  emoji?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, emoji, title, subtitle, ctaLabel, onCta }) => (
  <View style={styles.container}>
    {icon ? (
      <View style={styles.iconWrap}>
        <Icon name={icon} size={30} color={Colors.primary} />
      </View>
    ) : (
      !!emoji && <Text style={styles.emoji}>{emoji}</Text>
    )}
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    {ctaLabel && onCta && <Button label={ctaLabel} onPress={onCta} />}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.borderLight, marginBottom: Spacing.lg,
  },
  emoji: { fontSize: 44, marginBottom: Spacing.lg },
  title: { ...Typography.h3, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 },
});
