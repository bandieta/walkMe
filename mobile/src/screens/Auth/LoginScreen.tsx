import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { login, register } from '../../store/slices/authSlice';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../utils/theme';

const { height } = Dimensions.get('window');

interface InputFieldProps {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, error,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={inputStyles.wrapper}>
      <View style={[inputStyles.container, focused && inputStyles.focused, !!error && inputStyles.errorBorder]}>
        <TextInput
          style={inputStyles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {!!error && <Text style={inputStyles.errorText}>{error}</Text>}
    </View>
  );
};

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  container: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.cardDark,
    paddingHorizontal: Spacing.md,
  },
  focused: { borderColor: Colors.primary },
  errorBorder: { borderColor: Colors.error },
  input: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },
  errorText: { ...Typography.caption, color: Colors.error, marginTop: 4, marginLeft: 4 },
});

export const LoginScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.auth);

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const tabAnim = useRef(new Animated.Value(0)).current;

  const switchMode = (toRegister: boolean) => {
    setIsRegister(toRegister);
    Animated.timing(tabAnim, {
      toValue: toRegister ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please fill all required fields');
      return;
    }
    if (isRegister) {
      await dispatch(register({ email, displayName, password }));
    } else {
      await dispatch(login({ email, password }));
    }
  };

  const tabIndicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '50%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.backgroundDark} />

      {/* Background glow */}
      <View style={styles.bgGlow} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.iconBox}>
            <Text style={styles.iconEmoji}>🚶</Text>
          </View>
          <Text style={styles.wordmark}>WalkMe</Text>
        </View>

        <Text style={styles.tagline}>Find your walking community</Text>

        {/* Tab switcher */}
        <View style={styles.tabBar}>
          <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
          <TouchableOpacity style={styles.tab} onPress={() => switchMode(false)}>
            <Text style={[styles.tabText, !isRegister && styles.tabTextActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => switchMode(true)}>
            <Text style={[styles.tabText, isRegister && styles.tabTextActive]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          {isRegister && (
            <InputField
              placeholder="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          )}
          <InputField
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* API error toast */}
          {!!error && (
            <View style={styles.errorToast}>
              <Text style={styles.errorToastText}>⚠ {error}</Text>
            </View>
          )}

          {/* Primary button */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isRegister ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Google sign in (placeholder) */}
          <TouchableOpacity style={styles.ghostButton} activeOpacity={0.8}>
            <Text style={styles.ghostButtonText}>🔵  Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostButton} activeOpacity={0.8}>
            <Text style={styles.ghostButtonText}>🍎  Continue with Apple</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => switchMode(!isRegister)}>
          <Text style={styles.switchText}>
            {isRegister
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.cardDark,
    borderRadius: Radius.full,
    padding: 3,
    marginBottom: Spacing.lg,
    position: 'relative',
    height: 44,
  },
  tabIndicator: {
    position: 'absolute',
    top: 3,
    width: '48%',
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { ...Typography.body, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.textPrimary },
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
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing.xs,
    ...Shadow.card,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { ...Typography.bodyLarge, color: Colors.textPrimary, fontWeight: '700' },
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
  ghostButtonText: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500' },
  switchText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
