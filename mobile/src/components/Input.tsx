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
import { Colors, Spacing, Radius } from '../utils/theme';
import { Icon } from './Icon';

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
  const [isSecure, setIsSecure] = useState(variant === 'password');
  const borderAnim = useRef(new Animated.Value(0)).current;

  const animate = (to: number) =>
    Animated.timing(borderAnim, { toValue: to, duration: 150, useNativeDriver: false }).start();

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? Colors.error : Colors.borderLight, error ? Colors.error : Colors.primary],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[styles.inputWrapper, { borderColor }]}>
        {!!icon && <View style={styles.iconLeft}>{icon}</View>}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.primary}
          cursorColor={Colors.primary}
          onFocus={() => animate(1)}
          onBlur={() => animate(0)}
          secureTextEntry={isSecure}
          {...textInputProps}
        />
        {variant === 'password' && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setIsSecure((s) => !s)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name={isSecure ? 'eye' : 'eyeOff'} size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </Animated.View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { fontSize: 12, color: Colors.textSecondary, marginBottom: 5 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    minHeight: 40,
  },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 14, paddingVertical: 6 },
  iconLeft: { marginRight: Spacing.sm },
  eyeButton: { padding: Spacing.xs },
  errorText: { fontSize: 12, color: Colors.error, marginTop: Spacing.xs },
});
