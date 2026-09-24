import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Icon, IconName } from '../../components/Icon';
import { Colors, Ramp } from '../../utils/theme';

/**
 * Preview card shown above the sheet when a pin is selected: --color-bg fill, radius 14, a 1px neutral-700 ring,
 * 42px accent tile + title/subtitle + close, and a full-width outlined CTA. Pops in (opacity + scale .94 -> 1, 200ms).
 */
export const WalkPreviewCard: React.FC<{
  bottom: Animated.AnimatedInterpolation<number> | Animated.Value | number;
  icon: IconName; title: string; sub: string; cta: string; onClose: () => void; onOpen: () => void;
}> = ({ bottom, icon, title, sub, cta, onClose, onOpen }) => {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    pop.setValue(0);
    Animated.timing(pop, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  }, [pop, title]);

  return (
    <Animated.View
      style={{
        position: 'absolute', left: 16, right: 16, bottom: bottom as any,
        opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
      }}
    >
      <View
        style={{
          padding: 14, borderRadius: 14, backgroundColor: Colors.backgroundDark, rowGap: 10,
          shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.55, shadowRadius: 9,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: 12 }}>
          <Pressable onPress={onOpen} style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', columnGap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: Ramp.accent[900], alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icon} size={19} color={Ramp.accent[300]} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 15, fontWeight: '500' }}>{title}</Text>
              <Text style={{ fontSize: 12, color: Ramp.neutral[400] }}>{sub}</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close"
            style={{ width: 32, height: 32, marginTop: -6, marginRight: -6, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="x" size={15} color={Ramp.neutral[400]} />
          </Pressable>
        </View>
        <Pressable
          onPress={onOpen}
          style={({ pressed }) => ({
            height: 44, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? 'rgba(145,132,217,0.12)' : 'transparent',
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.primary }}>{cta}</Text>
        </Pressable>
      </View>
      {/* box-shadow: 0 0 0 1px #595d6c — a ring just outside the card */}
      <View pointerEvents="none" style={{ position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderRadius: 15, borderWidth: 1, borderColor: Ramp.neutral[700] }} />
    </Animated.View>
  );
};
