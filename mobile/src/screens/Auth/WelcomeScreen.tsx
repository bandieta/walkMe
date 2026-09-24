import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing, StyleSheet, StatusBar, Platform, Settings } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { socialLogin, devLogin } from '../../store/slices/authSlice';
import { signInWithGoogle } from '../../services/auth/google';
import { signInWithFacebook } from '../../services/auth/facebook';
import { signInWithApple } from '../../services/auth/apple';
import { Colors, Ramp } from '../../utils/theme';
import { Btn, Placeholder, useScreenInsets } from '../../ui';
import { useToast } from '../../components/Toast';
import { SignInSheet, Provider, SheetMode } from './SignInSheet';

// Copy of the prototype's three onboarding slides (static design copy).
const SLIDES = [
  { title: 'Every good walk starts nearby.', body: 'See who’s out with their dog right now, and join them.', img: 'full-bleed photo — dog mid-stride, park at night' },
  { title: 'Match on the\ndogs first.', body: 'Browse dogs nearby. When you both want to walk, start a chat.', img: 'photo — two dogs greeting on a path' },
  { title: 'Plan the walk in a minute.', body: 'Pick a park, a time and how many can come. Neighbours join from the map.', img: 'photo — small group walking at dusk' },
];
const SLIDE_MS = 4500 * 1000; // TEMP-MEASURE revert to 4500
const PROVIDER_NAME: Record<Provider, string> = { google: 'Google', facebook: 'Facebook', apple: 'Apple' };

/** Progress mark: 22px accent bar for the current slide, 8px neutral-700 bars for the others (animates like `transition: all .25s`). */
const Dot: React.FC<{ active: boolean; onPress: () => void }> = ({ active, onPress }) => {
  const v = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: active ? 1 : 0, duration: 250, useNativeDriver: false }).start();
  }, [active, v]);
  return (
    <Pressable onPress={onPress} accessibilityLabel="Slide" hitSlop={{ left: 3, right: 3 }} style={{ paddingVertical: 10 }}>
      <Animated.View
        style={{
          height: 2,
          width: v.interpolate({ inputRange: [0, 1], outputRange: [8, 22] }),
          backgroundColor: v.interpolate({ inputRange: [0, 1], outputRange: [Ramp.neutral[700], Colors.primary] }),
        }}
      />
    </Pressable>
  );
};

export const WelcomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { bottom } = useScreenInsets();
  const { show: showToast, element: toast } = useToast();
  const [slide, setSlide] = useState(0);
  // Dev-only launch arguments (like AppNavigator's -devLogin): `-devSheet new|existing`, `-devPending google`, `-devToast "text"`
  // let scripts capture the sheet / spinner / toast states without tapping. Ignored in release builds.
  const devArg = (k: string) => (__DEV__ ? (Settings.get(k) as string | null) || null : null);
  const [sheet, setSheet] = useState<SheetMode | null>(() => devArg('devSheet') as SheetMode | null);
  const [pending, setPending] = useState<Provider | 'dev' | null>(() => devArg('devPending') as Provider | null);
  const alive = useRef(true);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const devToast = devArg('devToast');
    if (devToast) showToast(devToast, (devArg('devToastVariant') as any) || 'success', 120000);
    Animated.timing(fade, { toValue: 1, duration: 350, easing: Easing.bezier(0, 0, 0.58, 1), useNativeDriver: true }).start();
    return () => {
      alive.current = false;
    };
  }, [fade]);

  // Slides advance on their own every 4.5 s while no sheet is open; any manual change restarts the clock.
  useEffect(() => {
    if (sheet) return undefined;
    const t = setTimeout(() => setSlide((s) => (s + 1) % SLIDES.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [slide, sheet]);

  const closeSheet = useCallback(() => setSheet(null), []);

  const handleProvider = async (provider: Provider) => {
    setPending(provider);
    try {
      let token: string | null = null;
      let displayName: string | undefined;

      if (provider === 'google') {
        token = await signInWithGoogle();
      } else if (provider === 'facebook') {
        token = await signInWithFacebook();
      } else {
        const result = await signInWithApple();
        token = result?.token ?? null;
        displayName = result?.displayName;
      }

      if (!token) return; // user cancelled

      const result = await dispatch(socialLogin({ provider, token, displayName }));
      if (socialLogin.rejected.match(result)) {
        showToast(String(result.payload ?? 'Sign-in failed. Please try again.'), 'error');
      }
    } catch (err: any) {
      // Apple reports a dismissed sheet as error 1001 - that is not a failure worth a toast.
      const cancelled = err?.code === '1001' || err?.code === 'ERR_CANCELED' || /cancel/i.test(String(err?.message ?? ''));
      if (!cancelled) showToast(err?.message ?? `Could not sign in with ${PROVIDER_NAME[provider]}.`, 'error');
    } finally {
      if (alive.current) setPending(null);
    }
  };

  const handleDevLogin = async () => {
    setPending('dev');
    try {
      const result = await dispatch(devLogin('Test User'));
      if (devLogin.rejected.match(result)) showToast(String(result.payload ?? 'Dev login failed.'), 'error');
    } finally {
      if (alive.current) setPending(null);
    }
  };

  const s = SLIDES[slide];

  return (
    <Animated.View style={[styles.screen, { opacity: fade }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.backgroundDark} />

      {/* full-bleed photo stand-in; tap = next slide */}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setSlide((i) => (i + 1) % SLIDES.length)} accessibilityLabel="Next slide">
        <Placeholder colors={['#1c1e2c', '#212332']} stripe={10} style={StyleSheet.absoluteFillObject}>
          <Text style={styles.photoLabel}>{s.img}</Text>
        </Placeholder>
        <Svg width="100%" height={540} style={styles.fade} pointerEvents="none">
          <Defs>
            <LinearGradient id="wf" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Colors.backgroundDark} stopOpacity={0} />
              <Stop offset="0.55" stopColor={Colors.backgroundDark} stopOpacity={1} />
              <Stop offset="1" stopColor={Colors.backgroundDark} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="540" fill="url(#wf)" />
        </Svg>
      </Pressable>

      <View style={[styles.content, { paddingBottom: bottom + 12 }]} pointerEvents="box-none">
        <Text style={styles.overline}>WalkMe</Text>
        <Text style={styles.title}>{s.title}</Text>
        <Text style={styles.body}>{s.body}</Text>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Dot key={i} active={i === slide} onPress={() => setSlide(i)} />
          ))}
        </View>
        <Btn label="Get started" shape="pill" height={52} fontSize={16} onPress={() => setSheet('new')} />
        <Pressable onPress={() => setSheet('existing')} style={styles.existing}>
          {({ pressed }) => (
            <Text style={{ fontSize: 14, color: pressed ? Colors.textPrimary : Ramp.neutral[300] }}>I already have an account</Text>
          )}
        </Pressable>
      </View>

      <SignInSheet mode={sheet} pending={pending} onProvider={handleProvider} onDevLogin={handleDevLogin} onClose={closeSheet} />
      {toast}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.backgroundDark, justifyContent: 'flex-end' },
  photoLabel: {
    position: 'absolute',
    left: 28,
    top: 150,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    fontWeight: '400', // CSS 500 on Menlo (Regular/Bold only) renders Regular
    color: Ramp.neutral[500],
  },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  content: { paddingHorizontal: 28, rowGap: 12 },
  overline: { fontSize: 11, letterSpacing: 1.32, textTransform: 'uppercase', color: Ramp.accent[300] },
  // lineHeight (1.06) is below Inter's natural line box, where iOS sits the glyphs ~2.3px higher than CSS does: nudge back (no layout effect).
  title: { fontSize: 36, lineHeight: 38.16, letterSpacing: -0.9, fontWeight: '500', minHeight: 76, position: 'relative', top: 2.33 },
  body: { fontSize: 15, color: Ramp.neutral[400], minHeight: 46 },
  dots: { flexDirection: 'row', columnGap: 6, marginTop: 4, marginBottom: 10 },
  existing: { height: 44, alignItems: 'center', justifyContent: 'center' },
});
