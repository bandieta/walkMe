import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Colors, Ramp } from '../../utils/theme';
import { playTypingClick } from '../../utils/typingSound';

const DOT_SIZE = 7;
const BOUNCE = -5;
const STEP_MS = 300; // one dot's beat — also the "click" cadence, so the sound lands on each bounce

/** One bouncing dot, its rise staggered by `delay` so the three read as a wave, not in lockstep. */
const Dot: React.FC<{ delay: number }> = ({ delay }) => {
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: BOUNCE, duration: STEP_MS * 0.6, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: STEP_MS * 0.6, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(STEP_MS * 3 - STEP_MS * 1.2 - delay),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, y]);

  return (
    <Animated.View
      style={{
        width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2, backgroundColor: Ramp.neutral[300],
        transform: [{ translateY: y }],
      }}
    />
  );
};

/** The thread's "they're typing" bubble: three dots bouncing in sequence, with a soft click on each beat. */
export const TypingDots: React.FC<{ muted?: boolean }> = ({ muted }) => {
  useEffect(() => {
    if (muted) return undefined;
    const id = setInterval(playTypingClick, STEP_MS);
    return () => clearInterval(id);
  }, [muted]);

  return (
    <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', columnGap: 5, paddingVertical: 12, paddingHorizontal: 14,
          backgroundColor: Colors.surfaceDark, borderTopLeftRadius: 16, borderTopRightRadius: 16,
          borderBottomRightRadius: 16, borderBottomLeftRadius: 4,
        }}
      >
        <Dot delay={0} />
        <Dot delay={STEP_MS * 0.4} />
        <Dot delay={STEP_MS * 0.8} />
      </View>
    </View>
  );
};
