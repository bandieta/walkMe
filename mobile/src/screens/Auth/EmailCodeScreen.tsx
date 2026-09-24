import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppDispatch } from '../../store';
import { startEmailAuth, verifyEmailCode } from '../../store/slices/authSlice';
import { Icon } from '../../components/Icon';
import { Btn, useScreenInsets } from '../../ui';
import { useToast } from '../../components/Toast';
import { Colors, Ramp } from '../../utils/theme';

const DIV = 'rgba(233,233,237,0.16)';
const RESEND_COOLDOWN_S = 30;
const backIcon = Platform.OS === 'ios' ? 'caret-left' : 'arrow-left';

/** Step 2 of email sign-in: the 6-digit code from EmailAuthScreen. Verifying logs in (and creates the account, first time). */
export const EmailCodeScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { top, bottom } = useScreenInsets();
  const { show: showToast, element: toast } = useToast();
  const email: string = route.params?.email ?? '';
  const devCode: string | undefined = route.params?.devCode;

  // Dev/test only — see server/src/lib/email.ts: `devCode` is only ever present when there's no real email
  // service configured, so this never shows on a properly configured production server.
  const [code, setCode] = useState(__DEV__ && devCode ? devCode : '');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const valid = /^\d{6}$/.test(code);

  const verify = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      const result = await dispatch(verifyEmailCode({ email, code }));
      if (verifyEmailCode.rejected.match(result)) {
        showToast(String(result.payload ?? t('auth.emailCode.wrongCode')), 'error');
      }
      // On success authSlice's user/token update; AppNavigator switches away from the auth stack on its own.
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || busy) return;
    setCooldown(RESEND_COOLDOWN_S);
    try {
      const result = await dispatch(startEmailAuth(email)).unwrap();
      if (__DEV__ && result.devCode) setCode(result.devCode);
    } catch (err) {
      showToast(typeof err === 'string' ? err : t('auth.emailAuth.couldNotSend'), 'error');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.backgroundDark }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: top - 4, paddingBottom: 4, paddingLeft: 8, paddingRight: 16 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('common.back')}
          style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent' })}
        >
          <Icon name={backIcon} size={20} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 12 }}>
        <Text style={{ fontSize: 26, fontWeight: '500', lineHeight: 26 * 1.12, letterSpacing: -0.39, marginBottom: 8 }}>
          {t('auth.emailCode.title')}
        </Text>
        <Text style={{ fontSize: 13, color: Ramp.neutral[400], lineHeight: 19, marginBottom: 24 }}>
          {t('auth.emailCode.subtitle', { email })}
        </Text>

        <View style={{ height: 58, borderRadius: 8, backgroundColor: Colors.surfaceDark, borderWidth: 1, borderColor: DIV, alignItems: 'center', justifyContent: 'center' }}>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            placeholder={t('auth.emailCode.placeholder')}
            placeholderTextColor={Ramp.neutral[700]}
            selectionColor={Colors.primary}
            cursorColor={Colors.primary}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={verify}
            style={{ fontSize: 26, letterSpacing: 10, textAlign: 'center', width: '100%', padding: 0, color: Colors.textPrimary }}
          />
        </View>

        {__DEV__ && devCode && (
          <Text style={{ fontSize: 11, color: Ramp.accent[300], marginTop: 8 }}>{t('auth.emailCode.devCodeHint', { code: devCode })}</Text>
        )}

        <Pressable onPress={resend} disabled={cooldown > 0} hitSlop={8} style={{ marginTop: 20, alignSelf: 'center' }}>
          <Text style={{ fontSize: 13, color: cooldown > 0 ? Ramp.neutral[600] : Colors.primary }}>
            {cooldown > 0 ? t('auth.emailCode.resendIn', { seconds: cooldown }) : t('auth.emailCode.resend')}
          </Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: bottom + 4 }}>
        <Btn label={t('auth.emailCode.verify')} shape="pill" height={52} fontSize={16} onPress={verify} disabled={!valid} loading={busy} />
      </View>

      {toast}
    </KeyboardAvoidingView>
  );
};
