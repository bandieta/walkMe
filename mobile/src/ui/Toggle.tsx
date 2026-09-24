import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Colors, Ramp } from '../utils/theme';

/** 46x28 switch from the prototype: outlined track tinted with the accent when on, 20px knob. */
export const Toggle: React.FC<{ value: boolean; onValueChange: (v: boolean) => void; accessibilityLabel?: string }> = ({
  value, onValueChange, accessibilityLabel,
}) => {
  const left = useRef(new Animated.Value(value ? 21 : 3)).current;
  useEffect(() => {
    Animated.timing(left, { toValue: value ? 21 : 3, duration: 200, useNativeDriver: false }).start();
  }, [value, left]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={[styles.track, { borderColor: value ? Colors.primary : Ramp.neutral[700], backgroundColor: value ? 'rgba(145,132,217,0.22)' : 'transparent' }]}
    >
      <Animated.View style={[styles.knob, { left, backgroundColor: value ? Colors.primary : Ramp.neutral[500] }]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: { width: 46, height: 28, borderRadius: 14, borderWidth: 1 },
  // Like CSS, Yoga measures absolute offsets from inside the border, so the prototype's top:3/left:3|21 carry over.
  knob: { position: 'absolute', top: 3, width: 20, height: 20, borderRadius: 10 },
});
