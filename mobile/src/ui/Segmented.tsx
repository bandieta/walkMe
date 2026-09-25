import React from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { Colors } from '../utils/theme';

const DIV = 'rgba(233,233,237,0.16)';

/** Equal-width segments in a 1px divider frame (radius 8). The active one turns accent with a 1px accent ring. */
export function Segmented<K extends string>({ options, value, onChange, height = 36, fontSize = 13, style }: {
  options: { key: K; label: string }[]; value: K; onChange: (k: K) => void; height?: number; fontSize?: number; style?: ViewStyle;
}) {
  return (
    <View style={[{ flexDirection: 'row', height, borderWidth: 1, borderColor: DIV, borderRadius: 8, overflow: 'hidden' }, style]}>
      {options.map((o, i) => {
        const on = o.key === value;
        // The frame's own borderRadius + overflow:hidden should clip this ring, but Android doesn't reliably
        // clip a child view to a rounded parent that way — the ring's square corners then poke past the
        // frame's rounded ones on the first/last segment. Rounding the ring itself on those two outer corners
        // fixes it regardless of platform clipping.
        const edgeRadius =
          i === 0
            ? { borderTopLeftRadius: 7, borderBottomLeftRadius: 7 }
            : i === options.length - 1
              ? { borderTopRightRadius: 7, borderBottomRightRadius: 7 }
              : null;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderLeftWidth: i ? 1 : 0, borderLeftColor: DIV }}>
            {on && (
              <View
                pointerEvents="none"
                style={[
                  {
                    position: 'absolute',
                    top: 0,
                    left: i ? -1 : 0,
                    right: 0,
                    bottom: 0,
                    borderWidth: 1,
                    borderColor: Colors.primary,
                  },
                  edgeRadius,
                ]}
              />
            )}
            {/* Equal-width segments: a longer translated label shrinks rather than wrapping or clipping. */}
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ fontSize, color: on ? Colors.primary : Colors.textPrimary, paddingHorizontal: 2 }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
