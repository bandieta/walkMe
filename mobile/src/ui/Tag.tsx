import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Colors, Ramp } from '../utils/theme';

const TONES = {
  accent: { bg: Ramp.accent[800], fg: Ramp.accent[100], border: 'transparent' },
  neutral: { bg: Ramp.neutral[800], fg: Ramp.neutral[100], border: 'transparent' },
  outline: { bg: 'transparent', fg: Colors.primary, border: Colors.primary },
  ghost: { bg: 'transparent', fg: Ramp.neutral[300], border: 'rgba(233,233,237,0.16)' },
};

/** Small label: 11px, padding 3/9, radius 6 (the prototype's `.tag`). `dot` adds the 6px live indicator. */
export const Tag: React.FC<{ label: string; tone?: keyof typeof TONES; dot?: boolean; fontSize?: number; paddingV?: number; paddingH?: number; style?: ViewStyle }> = ({
  label, tone = 'accent', dot, fontSize = 11, paddingV = 3, paddingH = 9, style,
}) => {
  const t = TONES[tone];
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: paddingV, paddingHorizontal: paddingH, borderRadius: 6, backgroundColor: t.bg, borderWidth: t.border === 'transparent' ? 0 : 1, borderColor: t.border }, style]}>
      {dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Ramp.accent[300], marginRight: 6 }} />}
      <Text style={{ fontSize, color: t.fg }}>{label}</Text>
    </View>
  );
};
