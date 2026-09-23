import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Shadow, Ramp } from '../utils/theme';

export type CardVariant = 'default' | 'flat' | 'elevated';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: CardVariant;
  style?: ViewStyle;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  style,
  padding = Spacing.md,
}) => {
  const base = [
    styles.base,
    variant === 'default' && styles.edge,
    variant === 'elevated' && styles.elevated,
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [...base, pressed && styles.pressed]} onPress={onPress}>
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
};

// Surface-filled; elevation is a hairline edge plus ambient darkness.
const styles = StyleSheet.create({
  base: { backgroundColor: Colors.surfaceDark, borderRadius: Radius.md },
  edge: { borderWidth: 1, borderColor: Ramp.neutral[800] },
  elevated: { borderWidth: 1, borderColor: Ramp.neutral[700], ...Shadow.card },
  pressed: { backgroundColor: '#2a2c3b' },
});
