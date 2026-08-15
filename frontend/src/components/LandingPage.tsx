import { useI18n } from '../i18n/I18nContext';
import { useTheme, type Theme } from '../i18n/ThemeContext';
import type { Language } from '../i18n/translations';

export function PreferenceControls() {
  const { language, setLanguage, t } = useI18n();
  const { theme, setTheme } = useTheme();
  return <div className="preference-controls">
    <div className="control-group" role="group" aria-label={t('language')}><span className="control-label">{t('language')}</span><div className="segmented">
      <button type="button" className={language === 'en' ? 'selected' : ''} aria-pressed={language === 'en'} onClick={() => setLanguage('en' as Language)}>EN</button>
      <button type="button" className={language === 'my' ? 'selected' : ''} aria-pressed={language === 'my'} onClick={() => setLanguage('my' as Language)}>မနမ</button>
    </div></div>
    <div className="control-group" role="group" aria-label={t('theme')}><span className="control-label">{t('theme')}</span><div className="segmented">
      <button type="button" className={theme === 'light' ? 'selected' : ''} aria-pressed={theme === 'light'} onClick={() => setTheme('light' as Theme)}>{t('light')}</button>
      <button type="button" className={theme === 'dark' ? 'selected' : ''} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark' as Theme)}>{t('dark')}</button>
    </div></div>
  </div>;
}

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const { t } = useI18n();
  return <main className="landing" id="main-content">
    <div className="energy-orbit orbit-one" aria-hidden="true" /><div className="energy-orbit orbit-two" aria-hidden="true" />
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="hero-copy"><p className="eyebrow">{t('landingEyebrow')}</p><h1 id="landing-title">{t('landingTitle')}</h1><p className="hero-subtitle">{t('landingSubtitle')}</p><p className="context-note">{t('landingMyanmarContext')}</p><button className="hero-action" type="button" onClick={onEnter}>{t('enterWorkspace')} <span aria-hidden="true">→</span></button></div>
      <div className="hero-mark" aria-label={t('brand')}><span className="bolt" aria-hidden="true">ϟ</span><span>PS</span></div>
    </section>
    <section className="feature-grid" aria-labelledby="feature-title"><h2 id="feature-title" className="sr-only">{t('brand')}</h2><Feature icon="01" title={t('strategicAnalysis')} text={t('strategicAnalysisText')} /><Feature icon="02" title={t('fairArbitration')} text={t('fairArbitrationText')} /><Feature icon="03" title={t('decisionsUncertainty')} text={t('decisionsUncertaintyText')} /></section>
    <div className="landing-indicators"><span>● {t('cpuOnly')}</span><span>◌ {t('offlineReady')}</span><span>◇ {t('noGpu')}</span></div>
  </main>;
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) { return <article className="feature-card"><span className="feature-number">{icon}</span><h3>{title}</h3><p>{text}</p></article>; }
