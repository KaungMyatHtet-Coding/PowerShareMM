import { useApp } from '@/hooks/useApp';
import type { TranslationKey } from '@/i18n/translations';
import { Zap, Globe, Database, FlaskConical, Moon, Sun } from 'lucide-react';

type TabKey = TranslationKey & string;

interface TabDef {
  key: TabKey;
  id: string;
}

const TABS: TabDef[] = [
  { key: 'tab_scenario', id: 'scenario' },
  { key: 'tab_analysis', id: 'analysis' },
  { key: 'tab_uncertainty', id: 'uncertainty' },
  { key: 'tab_arbitration', id: 'arbitration' },
  { key: 'tab_simulation', id: 'simulation' },
  { key: 'tab_results', id: 'results' },
];

interface HeaderProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { t, lang, setLang, apiMode, setApiMode, theme, setTheme } = useApp();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-sm">
              <Zap size={22} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight text-slate-900 dark:text-slate-100">
                <span className="text-teal-600 dark:text-teal-400">{t('brand_power')}</span>
                <span className="text-slate-700 dark:text-slate-300">{t('brand_share')}</span>
              </h1>
              <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                {t('appTagline')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* API Mode toggle */}
            <div
              role="radiogroup"
              aria-label={t('mode_label')}
              className="hidden items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 sm:flex"
            >
              <span className="px-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                <Database size={14} className="inline" aria-hidden="true" />
              </span>
              <button
                role="radio"
                aria-checked={apiMode === 'mock'}
                onClick={() => setApiMode('mock')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  apiMode === 'mock'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <FlaskConical size={13} aria-hidden="true" />
                {t('mode_mock')}
              </button>
              <button
                role="radio"
                aria-checked={apiMode === 'live'}
                onClick={() => setApiMode('live')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  apiMode === 'live'
                    ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <Database size={13} aria-hidden="true" />
                {t('mode_live')}
              </button>
            </div>

            {/* Language toggle */}
            <div
              role="radiogroup"
              aria-label={t('language_label')}
              className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5"
            >
              <Globe size={14} className="ml-2 text-slate-400 dark:text-slate-500" aria-hidden="true" />
              <button
                role="radio"
                aria-checked={lang === 'en'}
                onClick={() => setLang('en')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  lang === 'en'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                EN
              </button>
              <button
                role="radio"
                aria-checked={lang === 'my'}
                onClick={() => setLang('my')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  lang === 'my'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                မြန်မာ
              </button>
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors hover:text-teal-600 dark:hover:text-teal-400"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <nav aria-label="Sections" className="flex gap-1 overflow-x-auto pb-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t(tab.key as TranslationKey)}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
