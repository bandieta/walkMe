import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en';
import es from './locales/es';
import de from './locales/de';
import { DEFAULT_LANGUAGE, LanguageCode, isLanguageCode } from './languages';

export const LANGUAGE_STORAGE_KEY = 'appLanguage';

// No native locale-detection module: the app opens in English and the user
// picks a language explicitly (Profile > Language), persisted below. i18next
// itself has no native dependency, so this needs nothing added to the native
// iOS/Android projects.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    de: { translation: de },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes — double-escaping breaks e.g. "Café"
  compatibilityJSON: 'v3', // pluralization without a full Intl.PluralRules (older Hermes/Android)
  returnNull: false,
});

/** Called once at app start (see App.tsx) — swaps in the saved language before the first paint, if there is one. */
export async function restoreLanguage(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguageCode(saved) && saved !== i18n.language) await i18n.changeLanguage(saved);
  } catch {
    // Falls back to DEFAULT_LANGUAGE — never blocks startup on a storage error.
  }
}

/** Used by the language picker (see screens/Profile/LanguageScreen.tsx). */
export async function setAppLanguage(lang: LanguageCode): Promise<void> {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

export default i18n;
