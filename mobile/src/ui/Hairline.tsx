import React, { useState } from 'react';
import { View, ViewStyle, LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

/**
 * Nocturne's signature rule: fades to transparent over 48px at each end (short marks stay solid).
 * tone "faint" = list-row separators (text @ 8%), "divider" = --color-divider (text @ 16%).
 * Use it where the prototype paints a `linear-gradient(to right, transparent, rgba(233,233,237,.08) 48px, ...)` 1px strip.
 */
export const Hairline: React.FC<{ tone?: 'faint' | 'divider'; style?: ViewStyle }> = ({ tone = 'faint', style }) => {
  const [w, setW] = useState(0);
  const alpha = tone === 'faint' ? 0.08 : 0.16;
  const edge = w > 96 ? 48 / w : 0.5;
  return (
    <View style={[{ height: 1, alignSelf: 'stretch' }, style]} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} pointerEvents="none">
      {w > 0 && (
        <Svg width={w} height={1}>
          <Defs>
            <LinearGradient id="hl" x1="0" y1="0" x2={String(w)} y2="0" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#e9e9ed" stopOpacity={0} />
              <Stop offset={String(edge)} stopColor="#e9e9ed" stopOpacity={alpha} />
              <Stop offset={String(1 - edge)} stopColor="#e9e9ed" stopOpacity={alpha} />
              <Stop offset="1" stopColor="#e9e9ed" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={w} height={1} fill="url(#hl)" />
        </Svg>
      )}
    </View>
  );
};
