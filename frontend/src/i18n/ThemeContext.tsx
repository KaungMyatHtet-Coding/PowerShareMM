/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';
const THEME_KEY = 'powershare-theme';
const validTheme = (value: string | null): Theme | null => value === 'light' || value === 'dark' ? value : null;

interface ThemeValue { theme: Theme; setTheme: (theme: Theme) => void; }
const ThemeContext = createContext<ThemeValue | null>(null);

function systemTheme(): Theme { return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => validTheme(window.localStorage.getItem(THEME_KEY)) ?? systemTheme());
  const setTheme = (next: Theme) => { setThemeState(next); window.localStorage.setItem(THEME_KEY, next); };
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; }, [theme]);
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

export { THEME_KEY, validTheme };
