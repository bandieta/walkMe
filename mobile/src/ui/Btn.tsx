import React from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { Colors, Ramp } from '../utils/theme';
import { Icon, IconName } from '../components/Icon';

type Variant = 'accent' | 'neutral' | 'ghost' | 'danger';

const TONE: Record<Variant, { border: string; color: string; hover: string; active: string }> = {
  accent: { border: Colors.primary, color: Colors.primary, hover: 'rgba(145,132,217,0.12)', active: 'rgba(145,132,217,0.22)' },
  neutral: { border: 'rgba(233,233,237,0.16)', color: Colors.textPrimary, hover: 'rgba(233,233,237,0.07)', active: 'rgba(233,233,237,0.14)' },
  ghost: { border: 'transparent', color: Ramp.accent[300], hover: 'rgba(145,132,217,0.10)', active: 'rgba(145,132,217,0.18)' },
  danger: { border: Colors.error, color: Colors.error, hover: 'rgba(224,131,127,0.12)', active: 'rgba(224,131,127,0.22)' },
};

/**
 * Nocturne buttons are outlined, never solid. `shape="md"` is the 8px-radius 48px button; `shape="pill"` the 50px
 * fully-rounded one used on onboarding. Text is Inter Medium 15 (set fontSize for the smaller in-card buttons).
 */
export const Btn: React.FC<{
  label: string; onPress?: () => void; variant?: Variant; shape?: 'md' | 'pill'; height?: number; fontSize?: number;
  icon?: IconName; iconWeight?: 'regular' | 'fill'; loading?: boolean; disabled?: boolean; style?: ViewStyle; textStyle?: TextStyle;
  paddingHorizontal?: number;
}> = ({ label, onPress, variant = 'accent', shape = 'md', height, fontSize = 15, icon, iconWeight = 'regular', loading, disabled, style, textStyle, paddingHorizontal = 16 }) => {
  const t = TONE[variant];
  const h = height ?? (shape === 'pill' ? 50 : 48);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        { height: h, borderRadius: shape === 'pill' ? h / 2 : 8, borderWidth: 1, borderColor: t.border, paddingHorizontal,
          alignItems: 'center', justifyContent: 'center', flexDirection: 'row', backgroundColor: pressed ? t.active : 'transparent', opacity: disabled ? 0.45 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={t.color} />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}><Icon name={icon} size={fontSize + 3} color={t.color} weight={iconWeight} /></View>}
          <Text style={[{ fontSize, fontWeight: '500', color: t.color }, textStyle]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};
