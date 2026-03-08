import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../utils/theme';

export type InputVariant = 'text' | 'search' | 'password';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  variant?: InputVariant;
  error?: string;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  variant = 'text',
  error,
  containerStyle,
  icon,
  secureTextEntry,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(variant === 'password');
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 150, useNativeDriver: false }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? Colors.error : Colors.border, error ? Colors.error : Colors.primary],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[styles.inputWrapper, { borderColor }]}>
        {!!icon && <View style={styles.iconLeft}>{icon}</View>}
        <TextInput
          style={[styles.input, !!icon && styles.inputWithIcon]}
          placeholderTextColor={Colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isSecure}
          {...textInputProps}
        />
        {variant === 'password' && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setIsSecure(s => !s)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.eyeText}>{isSecure ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    paddingVertical: Spacing.sm,
  },
  inputWithIcon: { marginLeft: Spacing.sm },
  iconLeft: { marginRight: Spacing.xs },
  eyeButton: { padding: Spacing.xs },
  eyeText: { fontSize: 16 },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
