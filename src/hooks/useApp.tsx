import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Language, ApiMode } from '@/types';
import { t as translate, t_format as translate_format, type TranslationKey } from '@/i18n/translations';

export type Theme = 'light' | 'dark';

interface AppState {
  lang: Language;
  setLang: (l: Language) => void;
  apiMode: ApiMode;
  setApiMode: (m: ApiMode) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  t: (key: TranslationKey) => string;
  t_format: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');
  const [apiMode, setApiMode] = useState<ApiMode>('mock');
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const t = useCallback(
    (key: TranslationKey) => translate(lang, key),
    [lang],
  );

  const t_format = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      translate_format(lang, key, vars),
    [lang],
  );

  return (
    <AppContext.Provider value={{ lang, setLang, apiMode, setApiMode, theme, setTheme, t, t_format }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
