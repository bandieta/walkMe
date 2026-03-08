import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../utils/theme';

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

const VARIANT_STYLES: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: Colors.primary, ...Shadow.card },
    text: { color: '#fff' },
  },
  secondary: {
    container: { backgroundColor: Colors.surfaceDark, borderWidth: 1.5, borderColor: Colors.primary },
    text: { color: Colors.primary },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: Colors.textSecondary },
  },
  danger: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.error },
    text: { color: Colors.error },
  },
};

const SIZE_STYLES: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: { container: { paddingVertical: Spacing.xs + 2, paddingHorizontal: Spacing.md }, text: { fontSize: 13 } },
  md: { container: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg }, text: { fontSize: 15 } },
  lg: { container: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl }, text: { fontSize: 17 } },
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
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyle.container,
        sizeStyle.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#fff' : Colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              variantStyle.text,
              sizeStyle.text,
              !!icon && styles.textWithIcon,
              isDisabled && styles.textDisabled,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xl,
    minWidth: 80,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },
  text: { fontWeight: '700' as const, textAlign: 'center' },
  textWithIcon: { marginLeft: Spacing.xs },
  textDisabled: {},
});
