import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../../i18n';
import { LANGUAGES } from '../../i18n/languages';
import { Icon } from '../../components/Icon';
import { useScreenInsets } from '../../ui';
import { Colors, Ramp } from '../../utils/theme';

const backIcon = Platform.OS === 'ios' ? 'caret-left' : 'arrow-left';

/** Profile > Language — picks the app's display language (English, Spanish, German or Polish for now). */
export const LanguageScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { top } = useScreenInsets();
  const [changing, setChanging] = useState<string | null>(null);

  const pick = async (code: (typeof LANGUAGES)[number]['code']) => {
    if (code === i18n.language || changing) return;
    setChanging(code);
    try {
      await setAppLanguage(code);
    } finally {
      setChanging(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4, paddingTop: 52, paddingRight: 16, paddingBottom: 4, paddingLeft: 8 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('common.back')}
          style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent' })}
        >
          <Icon name={backIcon} size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '500', flex: 1 }}>{t('settings.language.title')}</Text>
      </View>
      <Text style={{ fontSize: 13, color: Ramp.neutral[400], paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 }}>
        {t('settings.language.subtitle')}
      </Text>

      <View style={{ paddingHorizontal: 20, rowGap: 10 }}>
        {LANGUAGES.map((lang) => {
          const active = lang.code === i18n.language;
          return (
            <Pressable
              key={lang.code}
              onPress={() => pick(lang.code)}
              disabled={!!changing}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                {
                  flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 16, borderRadius: 12,
                  borderWidth: 1, borderColor: active ? Colors.primary : 'rgba(233,233,237,0.16)',
                  backgroundColor: active ? 'rgba(145,132,217,0.10)' : Colors.surfaceDark,
                },
                pressed && { backgroundColor: 'rgba(233,233,237,0.06)' },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '500' }}>{lang.nativeName}</Text>
                {lang.nativeName !== lang.englishName && (
                  <Text style={{ fontSize: 12, color: Ramp.neutral[500], marginTop: 1 }}>{lang.englishName}</Text>
                )}
              </View>
              {active && <Icon name="check" size={18} color={Colors.primary} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
