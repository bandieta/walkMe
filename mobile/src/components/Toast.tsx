import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../utils/theme';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onHide?: () => void;
}

const VARIANT_CONFIG: Record<ToastVariant, { emoji: string; color: string }> = {
  success: { emoji: '✅', color: Colors.success },
  error: { emoji: '⚠️', color: Colors.error },
  info: { emoji: 'ℹ️', color: Colors.primary },
  warning: { emoji: '🟡', color: Colors.accent },
};

export const Toast: React.FC<ToastProps> = ({
  visible, message, variant = 'info', duration = 2800, onHide,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 250, useNativeDriver: true }),
        ]).start(() => onHide?.());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;
  const cfg = VARIANT_CONFIG[variant];

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }], borderLeftColor: cfg.color }]}>
      <Text style={styles.emoji}>{cfg.emoji}</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 60, left: Spacing.lg, right: Spacing.lg,
    backgroundColor: Colors.cardDark,
    borderRadius: Radius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 4,
    ...Shadow.card,
    zIndex: 9999,
  },
  emoji: { fontSize: 18, marginRight: Spacing.sm },
  message: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
});
