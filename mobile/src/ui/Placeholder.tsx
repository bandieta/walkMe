import React, { useState } from 'react';
import { View, Text, ViewStyle, Platform, LayoutChangeEvent } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Ramp } from '../utils/theme';

/**
 * The prototype's striped stand-in for photos (`repeating-linear-gradient(135deg, a 0 8px, b 8px 16px)`)
 * with a tiny monospace caption. Use it wherever a dog/person photo is missing.
 */
export const Placeholder: React.FC<React.PropsWithChildren<{
  label?: string; colors?: [string, string]; stripe?: number; radius?: number; style?: ViewStyle; labelColor?: string;
  labelAlign?: 'bottom' | 'top'; padding?: number;
}>> = ({ label, colors = ['#1f2130', '#262838'], stripe = 8, radius = 0, style, labelColor = Ramp.neutral[500], labelAlign = 'bottom', padding = 6, children }) => {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  return (
    <View style={[{ overflow: 'hidden', borderRadius: radius, backgroundColor: colors[0] }, style]} onLayout={onLayout}>
      {size.w > 0 && (
        <Svg width={size.w} height={size.h} style={{ position: 'absolute' }}>
          {/* CSS repeating-linear-gradient(135deg, c1 0 s, c2 s 2s): "/" bands, c2 centred on x+y = (1.5s + 2s*k)*sqrt(2). */}
          {Array.from({ length: Math.ceil((size.w + size.h) / (stripe * 2 * Math.SQRT2)) + 1 }, (_, k) => {
            const c = (stripe * 1.5 + stripe * 2 * k) * Math.SQRT2;
            return <Line key={k} x1={c + size.h} y1={-size.h} x2={c - size.h} y2={size.h} stroke={colors[1]} strokeWidth={stripe} />;
          })}
        </Svg>
      )}
      {!!label && (
        <View style={{ flex: 1, justifyContent: labelAlign === 'bottom' ? 'flex-end' : 'flex-start', padding }}>
          <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 9, fontWeight: '500', color: labelColor, lineHeight: 12 }}>{label}</Text>
        </View>
      )}
      {children}
    </View>
  );
};
