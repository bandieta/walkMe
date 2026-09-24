import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, StyleSheet, View } from 'react-native';
import { Colors, Ramp } from '../utils/theme';
import { Icon, IconName } from './Icon';
import { useScreenInsets } from '../ui/useScreenInsets';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onHide?: () => void;
}

// The prototype's toast is a filled check-circle in the accent colour; errors and warnings swap in a filled
// warning-circle so a failure never reads as a success.
const VARIANT_CONFIG: Record<ToastVariant, { icon: IconName; color: string }> = {
  success: { icon: 'check-circle', color: Colors.primary },
  info: { icon: 'info', color: Colors.primary },
  error: { icon: 'warning', color: Colors.error },
  warning: { icon: 'warning', color: Colors.warning },
};

/**
 * Nocturne toast: 16px from the sides, 54px from the top of the frame, surface fill, radius 12, a 1px neutral-700
 * ring plus a soft drop shadow, 18px filled icon and 14px text. Pops in (opacity + scale .94 -> 1, 200ms), leaves after `duration`.
 */
export const Toast: React.FC<ToastProps> = ({ visible, message, variant = 'success', duration = 2300, onHide }) => {
  const { top } = useScreenInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return undefined;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
        if (finished) onHide?.();
      });
    }, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, message]);

  if (!visible) return null;
  const cfg = VARIANT_CONFIG[variant];

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { top: top - 2, opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }]}
    >
      <View pointerEvents="none" style={styles.ring} />
      <Icon name={cfg.icon} size={18} color={cfg.color} weight="fill" />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

/** `const { show, element } = useToast();` render `{element}` once near the root of the screen, call `show('Saved')`. */
export function useToast() {
  const [state, setState] = useState<{ id: number; text: string; variant: ToastVariant; duration?: number } | null>(null);
  const show = useCallback((text: string, variant: ToastVariant = 'success', duration?: number) => {
    setState((s) => ({ id: (s?.id ?? 0) + 1, text, variant, duration }));
  }, []);
  const hide = useCallback(() => setState(null), []);
  const element = state ? <Toast key={state.id} visible message={state.text} variant={state.variant} duration={state.duration} onHide={hide} /> : null;
  return { show, hide, element };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 30,
    elevation: 30,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.surfaceDark,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    // box-shadow: 0 0 0 1px #595d6c, 0 6px 18px rgba(0,0,0,.55)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 9,
  },
  ring: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Ramp.neutral[700],
  },
  message: { flexShrink: 1, fontSize: 14 },
});
