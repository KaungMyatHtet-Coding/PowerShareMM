import { useState, type ReactNode } from 'react';
import { useApp } from '@/hooks/useApp';
import type { TranslationKey } from '@/i18n/translations';

interface InfoHelpProps {
  helpKey: TranslationKey;
  children: ReactNode;
}

/** Renders a help icon that toggles a Myanmar/English explanation tooltip. */
export function InfoHelp({ helpKey, children }: InfoHelpProps) {
  const { t, lang } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-label="Help"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2.5 text-xs leading-relaxed text-white shadow-lg"
        >
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-teal-300">
            {lang === 'my' ? 'ရှင်းလင်းချက် (မြန်မာ)' : 'Explanation'}
          </span>
          {t(helpKey)}
          {children}
        </span>
      )}
    </span>
  );
}
