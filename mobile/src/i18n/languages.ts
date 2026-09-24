export type LanguageCode = 'en' | 'es' | 'de' | 'pl';

/** `nativeName` is what's shown in the picker — always in that language, never translated. */
export const LANGUAGES: { code: LanguageCode; nativeName: string; englishName: string }[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish' },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German' },
  { code: 'pl', nativeName: 'Polski', englishName: 'Polish' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function isLanguageCode(v: string | null | undefined): v is LanguageCode {
  return !!v && LANGUAGES.some((l) => l.code === v);
}
