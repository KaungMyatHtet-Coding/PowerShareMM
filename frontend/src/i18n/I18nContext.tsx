/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translations, type Language, type TranslationKey } from './translations';

const LANGUAGE_KEY = 'powershare-language';
const validLanguage = (value: string | null): Language => value === 'my' ? 'my' : 'en';

interface I18nValue { language: Language; setLanguage: (language: Language) => void; t: (key: TranslationKey) => string; }
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => validLanguage(window.localStorage.getItem(LANGUAGE_KEY)));
  const setLanguage = (next: Language) => { setLanguageState(next); window.localStorage.setItem(LANGUAGE_KEY, next); };
  useEffect(() => { document.documentElement.lang = language; document.title = language === 'my' ? 'PowerShare MM — စွမ်းအင်မျှဝေဆုံးဖြတ်ချက်' : 'PowerShare MM — Energy Sharing Decision Support'; }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (key: TranslationKey) => translations[language][key] ?? translations.en[key] }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}

export { LANGUAGE_KEY, validLanguage };
