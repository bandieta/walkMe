import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, Radius } from '../utils/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

// Nocturne: actions are outlined, never solid-filled. Pressed state is a tint
// of the variant's own colour.
const VARIANT: Record<ButtonVariant, { border: string; text: string; pressed: string }> = {
  primary: { border: Colors.primary, text: Colors.primary, pressed: 'rgba(145,132,217,0.22)' },
  secondary: { border: Colors.borderLight, text: Colors.textPrimary, pressed: 'rgba(233,233,237,0.14)' },
  ghost: { border: 'transparent', text: Colors.primary, pressed: 'rgba(145,132,217,0.18)' },
  danger: { border: Colors.error, text: Colors.error, pressed: 'rgba(224,131,127,0.20)' },
};

const SIZE: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: { container: { paddingVertical: 5, paddingHorizontal: Spacing.md }, text: { fontSize: 12 } },
  md: { container: { paddingVertical: 9, paddingHorizontal: Spacing.lg }, text: { fontSize: 14 } },
  lg: { container: { paddingVertical: 12, paddingHorizontal: Spacing.xl }, text: { fontSize: 15 } },
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
}) => {
  const v = VARIANT[variant];
  const s = SIZE[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { borderColor: v.border, backgroundColor: pressed ? v.pressed : 'transparent' },
        s.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: v.text }, s.text, !!icon && styles.textWithIcon]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: 72,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },
  text: { fontWeight: '500', textAlign: 'center' },
  textWithIcon: { marginLeft: Spacing.sm },
});
