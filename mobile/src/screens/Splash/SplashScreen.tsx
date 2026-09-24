import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Colors, Ramp } from '../../utils/theme';
import { Icon } from '../../components/Icon';
import { useScreenInsets } from '../../ui';

/** The prototype holds the splash for 1.7 s: a 0.4 s fade-in, the 1.5 s progress bar (ease-out) and a short beat. */
const HOLD_MS = 1700;
const BAR_MS = 1500;
const BAR_WIDTH = 120;

interface SplashScreenProps {
  onFinish: (isAuthenticated: boolean) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { t } = useTranslation();
  const { bottom } = useScreenInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let alive = true;
    let hold: ReturnType<typeof setTimeout> | undefined;

    Animated.timing(fade, { toValue: 1, duration: 400, easing: Easing.bezier(0, 0, 0.58, 1), useNativeDriver: true }).start();
    Animated.timing(bar, { toValue: BAR_WIDTH, duration: BAR_MS, easing: Easing.bezier(0, 0, 0.58, 1), useNativeDriver: false }).start();

    const held = new Promise<void>((resolve) => {
      hold = setTimeout(resolve, HOLD_MS);
    });
    const tokenPromise = AsyncStorage.getItem('accessToken').catch(() => null);

    Promise.all([held, tokenPromise]).then(([, token]) => {
      if (alive) onFinish(!!token);
    });

    return () => {
      alive = false;
      if (hold) clearTimeout(hold);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fade, paddingBottom: bottom + 96 }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.backgroundDark} />

      {/* 56px glyph tile: the accent glow is an outer shadow only (the tile itself stays ground-coloured). */}
      <View style={styles.tile}>
        <Icon name="paw-print" size={28} color={Colors.primary} weight="fill" />
      </View>
      <Text style={styles.wordmark}>WalkMe</Text>
      <Text style={styles.tagline}>{t('splash.tagline')}</Text>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: bar }]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
    rowGap: 14,
  },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    // box-shadow: 0 0 48px rgba(145,132,217,.28)
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
  },
  // measured against the reference: the tile sits 1px lower than a 1.55 line box (55.8) would place it
  wordmark: { fontSize: 36, lineHeight: 54.8, fontWeight: '500', letterSpacing: -0.9 },
  tagline: { fontSize: 14, color: Ramp.neutral[400] },
  barTrack: { width: BAR_WIDTH, height: 2, backgroundColor: Ramp.neutral[900], marginTop: 26, overflow: 'hidden' },
  barFill: { height: 2, backgroundColor: Colors.primary },
});
