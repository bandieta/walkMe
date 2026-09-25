import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppDispatch } from '../../store';
import { startEmailAuth } from '../../store/slices/authSlice';
import { Icon } from '../../components/Icon';
import { Btn, useScreenInsets } from '../../ui';
import { useToast } from '../../components/Toast';
import { Colors, Ramp } from '../../utils/theme';

const DIV = 'rgba(233,233,237,0.16)';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const backIcon = Platform.OS === 'ios' ? 'caret-left' : 'arrow-left';

/** Step 1 of email sign-in (SignInSheet's "Continue with email"): collect the address, request a code. */
export const EmailAuthScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { top, bottom } = useScreenInsets();
  const { show: showToast, element: toast } = useToast();
  const mode: 'new' | 'existing' = route.params?.mode ?? 'new';
  const accountType: 'person' | 'shelter' = route.params?.accountType ?? 'person';
  const shelterConfirmed: boolean = route.params?.shelterConfirmed ?? false;

  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);

  const valid = EMAIL_RE.test(email.trim());

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      const result = await dispatch(startEmailAuth(email.trim())).unwrap();
      navigation.navigate('EmailCode', { email: email.trim(), mode, devCode: result.devCode, accountType, shelterConfirmed });
    } catch (err) {
      showToast(typeof err === 'string' ? err : t('auth.emailAuth.couldNotSend'), 'error');
    } finally {
      setBusy(false);
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
          {mode === 'existing' ? t('auth.emailAuth.titleExisting') : t('auth.emailAuth.titleNew')}
        </Text>
        <Text style={{ fontSize: 13, color: Ramp.neutral[400], lineHeight: 19, marginBottom: 24 }}>{t('auth.emailAuth.subtitle')}</Text>

        <View
          style={{
            height: 46, borderRadius: 8, backgroundColor: Colors.surfaceDark, borderWidth: 1,
            borderColor: focused ? Colors.primary : DIV, paddingHorizontal: 12, justifyContent: 'center',
          }}
        >
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailAuth.placeholder')}
            placeholderTextColor={Ramp.neutral[600]}
            selectionColor={Colors.primary}
            cursorColor={Colors.primary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            autoFocus
            returnKeyType="send"
            onSubmitEditing={submit}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ fontSize: 15, lineHeight: 18, height: 44, padding: 0, color: Colors.textPrimary }}
          />
        </View>
        {email.length > 0 && !valid && (
          <Text style={{ fontSize: 12, color: Ramp.accent[300], marginTop: 6 }}>{t('auth.emailAuth.invalidEmail')}</Text>
        )}
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: bottom + 4 }}>
        <Btn label={t('auth.emailAuth.sendCode')} shape="pill" height={52} fontSize={16} onPress={submit} disabled={!valid} loading={busy} />
      </View>

      {toast}
    </KeyboardAvoidingView>
  );
};
