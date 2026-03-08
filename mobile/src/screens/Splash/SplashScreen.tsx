import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing } from '../../utils/theme';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: (isAuthenticated: boolean) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const barOpacity = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let token: string | null = null;

    const animationPromise = new Promise<void>(resolve => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(logoScale, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(barOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
          Animated.timing(barWidth, { toValue: width * 0.6, duration: 1200, useNativeDriver: false }),
        ]),
        Animated.timing(screenOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start(() => resolve());
    });

    const tokenPromise = AsyncStorage.getItem('accessToken').then(t => { token = t; });

    Promise.all([animationPromise, tokenPromise]).then(() => {
      onFinish(!!token);
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.backgroundDark} />

      {/* Radial glow */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      {/* Icon + wordmark */}
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.iconWrapper}>
          <View style={styles.iconGradient}>
            <Text style={styles.iconEmoji}>🚶</Text>
          </View>
        </View>
        <Text style={styles.wordmark}>WalkMe</Text>
      </Animated.View>

      {/* Progress bar */}
      <Animated.View style={[styles.progressContainer, { opacity: barOpacity }]}>
        <Animated.View style={[styles.progressBar, { width: barWidth }]} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.primary,
    opacity: 0,
    // Simulate radial glow via scale + blur (approximated)
    transform: [{ scale: 1.5 }],
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: Spacing.md,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...require('../../utils/theme').Shadow.card,
  },
  iconEmoji: {
    fontSize: 48,
  },
  wordmark: {
    ...Typography.display,
    color: Colors.textPrimary,
    letterSpacing: -0.02 * 40,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 120,
    height: 3,
    width: width * 0.6,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
});
