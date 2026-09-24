import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Ramp } from '../utils/theme';
import { cssLine } from '../ui/cssLine';

const DIVIDER = 'rgba(233,233,237,0.16)';

type Tone = 'accent' | 'danger';
const TONE: Record<Tone, { border: string; color: string; pressed: string }> = {
  accent: { border: Colors.primary, color: Colors.primary, pressed: 'rgba(145,132,217,0.12)' },
  danger: { border: Colors.error, color: Colors.error, pressed: 'rgba(224,131,127,0.12)' },
};

/**
 * The prototype's confirm dialog (overlays -> "Sign out?"): a centred 342px surface card (radius 14, 1px neutral-500 ring,
 * 0 16 40 shadow) over a neutral-900 @ 60% scrim that also covers the tab bar. 19px title, 14px neutral-300 message and two
 * outlined 42px buttons, right-aligned (Cancel = divider outline, confirm = accent outline). Fades in 200ms, card pops from .94.
 */
export const ConfirmDialog: React.FC<{
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** accent (default, as in the prototype) or danger (red outline) */
  tone?: Tone;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ visible, title, message, confirmLabel, cancelLabel, tone = 'accent', onConfirm, onCancel }) => {
  const { t } = useTranslation();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [visible, anim]);

  const toneColors = TONE[tone];
  const button = (label: string, onPress: () => void, border: string, color: string, pressed: string) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed: down }) => ({
        height: 42, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: border,
        alignItems: 'center', justifyContent: 'center', backgroundColor: down ? pressed : 'transparent',
      })}
    >
      <Text style={{ fontSize: 14, lineHeight: cssLine(14), color }}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      <Animated.View
        style={{ flex: 1, backgroundColor: 'rgba(41,43,49,0.6)', justifyContent: 'center', padding: 24, opacity: anim }}
      >
        <Animated.View
          style={{
            padding: 18, borderRadius: 14, backgroundColor: Colors.surfaceDark, rowGap: 10,
            shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.65, shadowRadius: 20, elevation: 24,
            transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
          }}
        >
          {/* box-shadow: 0 0 0 1px #9397ab */}
          <View pointerEvents="none" style={{ position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderRadius: 15, borderWidth: 1, borderColor: Ramp.neutral[500] }} />
          <Text accessibilityRole="header" style={{ fontSize: 19, lineHeight: cssLine(19), fontWeight: '500' }}>{title}</Text>
          {!!message && <Text style={{ fontSize: 14, lineHeight: cssLine(14), color: Ramp.neutral[300] }}>{message}</Text>}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', columnGap: 8, marginTop: 8 }}>
            {button(cancelLabel ?? t('common.cancel'), onCancel, DIVIDER, Colors.textPrimary, 'rgba(233,233,237,0.07)')}
            {button(confirmLabel, onConfirm, toneColors.border, toneColors.color, toneColors.pressed)}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};
