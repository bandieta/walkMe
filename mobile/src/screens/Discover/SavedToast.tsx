import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Icon } from '../../components/Icon';
import { Colors, Ramp } from '../../utils/theme';

/** The prototype's toast: a 12px-radius surface card near the top, accent check, gone after 2.3 s. */
export const SavedToast: React.FC<{ text: string | null; onDone: () => void; top: number }> = ({ text, onDone, top }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!text) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const t = setTimeout(() => done.current(), 2300);
    return () => clearTimeout(t);
  }, [text, anim]);

  if (!text) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', left: 16, right: 16, top, opacity: anim,
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
        borderRadius: 12, backgroundColor: Colors.surfaceDark,
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.55, shadowRadius: 9,
      }}
    >
      <View style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
        <Icon name="check-circle" size={18} color={Colors.primary} weight="fill" />
        <Text style={{ fontSize: 14 }}>{text}</Text>
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderRadius: 13, borderWidth: 1, borderColor: Ramp.neutral[700] }} />
    </Animated.View>
  );
};
