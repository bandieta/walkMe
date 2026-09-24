import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing, StyleSheet, Platform, BackHandler } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Ramp } from '../../utils/theme';
import { Icon, IconName } from '../../components/Icon';
import { useScreenInsets } from '../../ui';

export type Provider = 'google' | 'facebook' | 'apple' | 'email';
export type SheetMode = 'new' | 'existing';

const DIVIDER = 'rgba(233,233,237,0.16)';

// Apple leads on iOS (the accent-outlined primary action), like the prototype; elsewhere Google does.
// Email is always last: a fallback for anyone without (or not wanting to use) a social account.
const PROVIDERS: { key: Provider; labelKey: string; icon: IconName; weight: 'fill' | 'regular' }[] = [
  ...(Platform.OS === 'ios' ? [{ key: 'apple' as const, labelKey: 'auth.continueWithApple', icon: 'apple-logo' as IconName, weight: 'fill' as const }] : []),
  { key: 'google', labelKey: 'auth.continueWithGoogle', icon: 'google-logo', weight: 'regular' },
  { key: 'facebook', labelKey: 'auth.continueWithFacebook', icon: 'facebook-logo', weight: 'regular' },
  { key: 'email', labelKey: 'auth.continueWithEmail', icon: 'envelope-simple', weight: 'regular' },
];

/** The prototype's 18px spinner: neutral-700 ring with an accent leading edge, one turn every 0.7 s. */
const Spinner: React.FC = () => {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  return (
    <Animated.View
      style={{
        width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Ramp.neutral[700], borderTopColor: Colors.primary,
        transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
      }}
    />
  );
};

interface Props {
  /** null = closed. `new` titles the sheet "Create your account", `existing` "Welcome back". */
  mode: SheetMode | null;
  /** Provider whose sign-in is in flight; every other option dims and all are disabled. */
  pending: Provider | null;
  onProvider: (provider: Provider) => void;
  onClose: () => void;
}

/** Bottom sheet from the overlays spec ("auth sheet"): dimmed backdrop + 22px-radius surface sheet with the provider buttons. */
export const SignInSheet: React.FC<Props> = ({ mode, pending, onProvider, onClose }) => {
  const { t } = useTranslation();
  const { bottom } = useScreenInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(mode !== null);
  const [shownMode, setShownMode] = useState<SheetMode>(mode ?? 'new');
  const [sheetH, setSheetH] = useState(420);

  useEffect(() => {
    if (mode) {
      setShownMode(mode);
      setMounted(true);
      Animated.timing(anim, { toValue: 1, duration: 280, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [mode, anim]);

  // Android back closes the sheet (unless a sign-in is running).
  useEffect(() => {
    if (!mode) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!pending) onClose();
      return true;
    });
    return () => sub.remove();
  }, [mode, pending, onClose]);

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: anim }]}>
        <Pressable style={styles.backdrop} onPress={() => !pending && onClose()} accessibilityLabel="Close" />
      </Animated.View>

      <Animated.View
        onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
        style={[styles.sheet, { paddingBottom: bottom + 6, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [sheetH, 0] }) }] }]}
      >
        {/* box-shadow ring: 0 0 0 1px neutral-500 */}
        <View pointerEvents="none" style={styles.ring} />
        <View style={styles.handle} />
        <Text style={styles.title}>{shownMode === 'existing' ? t('auth.welcomeBack') : t('auth.createAccount')}</Text>
        <Text style={styles.sub}>{t('auth.noPasswords')}</Text>

        {PROVIDERS.map((p, i) => {
          const primary = i === 0;
          const isPending = pending === p.key;
          const fg = primary ? Colors.primary : Colors.textPrimary;
          const label = t(p.labelKey);
          return (
            <Pressable
              key={p.key}
              onPress={() => onProvider(p.key)}
              disabled={!!pending}
              accessibilityRole="button"
              accessibilityLabel={label}
              style={({ pressed }) => [
                styles.provider,
                { borderColor: primary ? Colors.primary : DIVIDER, opacity: pending && !isPending ? 0.45 : 1 },
                pressed && { backgroundColor: 'rgba(233,233,237,0.06)' },
              ]}
            >
              {isPending ? <Spinner /> : <Icon name={p.icon} size={19} color={fg} weight={p.weight} />}
              {/* Fixed-height row: a longer translated provider name shrinks rather than wrapping. */}
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: 15, fontWeight: '500', color: fg }}>
                {label}
              </Text>
            </Pressable>
          );
        })}

        <Text style={styles.terms}>{t('auth.termsNotice')}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(41,43,49,0.6)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 24,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: Colors.surfaceDark,
    rowGap: 10,
    // box-shadow: 0 -16px 40px rgba(0,0,0,.65)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.65,
    shadowRadius: 20,
    elevation: 24,
  },
  ring: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    borderWidth: 1,
    borderColor: Ramp.neutral[500],
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Ramp.neutral[700], alignSelf: 'center', marginBottom: 10 },
  title: { fontSize: 21, fontWeight: '500' },
  sub: { fontSize: 13, color: Ramp.neutral[400], marginBottom: 8 },
  provider: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 10,
  },
  terms: { fontSize: 11, color: Ramp.neutral[500], marginTop: 4 },
});
