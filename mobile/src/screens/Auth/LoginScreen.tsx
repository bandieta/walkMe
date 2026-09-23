import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { socialLogin, devLogin } from '../../store/slices/authSlice';
import { signInWithGoogle } from '../../services/auth/google';
import { signInWithFacebook } from '../../services/auth/facebook';
import { signInWithApple } from '../../services/auth/apple';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../utils/theme';

type Provider = 'google' | 'facebook' | 'apple';

export const LoginScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.auth);
  const [pending, setPending] = useState<Provider | 'dev' | null>(null);

  const handleSocialSignIn = async (provider: Provider) => {
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
        Alert.alert('Sign-in failed', String(result.payload ?? 'Please try again.'));
      }
    } catch (err: any) {
      Alert.alert(
        'Sign-in failed',
        err?.message ??
          `Could not sign in with ${provider}. Make sure the app has real ${provider} developer credentials configured (see mobile/README.md).`,
      );
    } finally {
      setPending(null);
    }
  };

  const handleDevLogin = async () => {
    setPending('dev');
    try {
      await dispatch(devLogin('Test User'));
    } finally {
      setPending(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.backgroundDark} />
      <View style={styles.bgGlow} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.logoRow}>
          <View style={styles.iconBox}>
            <Text style={styles.iconEmoji}>🚶</Text>
          </View>
          <Text style={styles.wordmark}>WalkMe</Text>
        </View>

        <Text style={styles.tagline}>Find your walking community</Text>

        <View style={styles.card}>
          {!!error && (
            <View style={styles.errorToast}>
              <Text style={styles.errorToastText}>⚠ {error}</Text>
            </View>
          )}

          <SocialButton
            label="Continue with Google"
            emoji="🔵"
            loading={pending === 'google'}
            disabled={loading || pending !== null}
            onPress={() => handleSocialSignIn('google')}
          />
          <SocialButton
            label="Continue with Facebook"
            emoji="📘"
            loading={pending === 'facebook'}
            disabled={loading || pending !== null}
            onPress={() => handleSocialSignIn('facebook')}
          />
          {Platform.OS === 'ios' && (
            <SocialButton
              label="Continue with Apple"
              emoji="🍎"
              loading={pending === 'apple'}
              disabled={loading || pending !== null}
              onPress={() => handleSocialSignIn('apple')}
            />
          )}

          {__DEV__ && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>dev only</Text>
                <View style={styles.divider} />
              </View>
              <SocialButton
                label="Continue as test user"
                emoji="🧪"
                loading={pending === 'dev'}
                disabled={loading || pending !== null}
                onPress={handleDevLogin}
              />
            </>
          )}
        </View>

        <Text style={styles.footnote}>
          Social sign-in requires real Google/Facebook/Apple developer credentials to be configured on the
          server and in mobile/src/utils/authConfig.ts.
        </Text>
      </ScrollView>
    </View>
  );
};

interface SocialButtonProps {
  label: string;
  emoji: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}

const SocialButton: React.FC<SocialButtonProps> = ({ label, emoji, loading, disabled, onPress }) => (
  <TouchableOpacity
    style={[styles.ghostButton, disabled && styles.ghostButtonDisabled]}
    activeOpacity={0.8}
    disabled={disabled}
    onPress={onPress}
  >
    {loading ? (
      <ActivityIndicator color={Colors.textPrimary} />
    ) : (
      <Text style={styles.ghostButtonText}>
        {emoji}  {label}
      </Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  bgGlow: {
    position: 'absolute',
    top: -100,
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primary,
    opacity: 0.12,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    ...Shadow.card,
  },
  iconEmoji: { fontSize: 26 },
  wordmark: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  errorToast: {
    backgroundColor: 'rgba(253,114,114,0.12)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },
  errorToastText: { ...Typography.body, color: Colors.error, textAlign: 'center' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { ...Typography.caption, color: Colors.textMuted, marginHorizontal: Spacing.sm },
  ghostButton: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: Spacing.sm,
    backgroundColor: Colors.cardDark,
  },
  ghostButtonDisabled: { opacity: 0.5 },
  ghostButtonText: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500' },
  footnote: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
});
