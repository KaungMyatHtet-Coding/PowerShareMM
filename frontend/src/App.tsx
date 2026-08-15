import { useEffect, useMemo, useRef, useState } from 'react';
import { analyzeLive, analyzeMock, ClientError } from './api/client';
import { AnalysisPanels } from './components/AnalysisPanels';
import { LandingPage, PreferenceControls } from './components/LandingPage';
import { ScenarioForm } from './components/ScenarioForm';
import { demoScenario } from './data/mockFixture';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { ThemeProvider } from './i18n/ThemeContext';
import type { ApiMode, FullAnalysisData, Scenario } from './types';

const tabs = [['analysis', 'analysis'], ['uncertainty', 'uncertainty'], ['arbitration', 'arbitration'], ['simulation', 'repeatedGame'], ['results', 'resultsTheory']] as const;

export default function App() { return <ThemeProvider><I18nProvider><AppContent /></I18nProvider></ThemeProvider>; }

function AppContent() {
  const { t } = useI18n();
  // Live mode never falls back silently to mock data; the translated copy is rendered below.
  const [scenario, setScenario] = useState<Scenario>(demoScenario); const [mode, setMode] = useState<ApiMode>(import.meta.env.VITE_DEFAULT_MODE === 'mock' ? 'mock' : 'live');
  const [analysis, setAnalysis] = useState<FullAnalysisData | null>(null); const [tab, setTab] = useState('scenario'); const [busy, setBusy] = useState(false); const [error, setError] = useState<ClientError | null>(null); const [entered, setEntered] = useState(false); const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const modeLabel = useMemo(() => mode === 'mock' ? t('mockDemoData') : t('liveBackend'), [mode, t]);
  const run = async () => { setBusy(true); setError(null); controller.current?.abort(); const next = new AbortController(); controller.current = next; try { const data = mode === 'mock' ? analyzeMock() : await analyzeLive(scenario, next.signal); if (controller.current !== next || next.signal.aborted) return; setAnalysis(data); setTab('analysis'); } catch (cause) { if (controller.current !== next || next.signal.aborted) return; if (cause instanceof DOMException && cause.name === 'AbortError') return; setError(cause instanceof ClientError ? cause : new ClientError('The analysis could not be completed.', 'malformed')); } finally { if (controller.current === next) { controller.current = null; setBusy(false); } } };
  if (!entered) return <div className="app"><a className="skip-link" href="#main-content">{t('skipToContent')}</a><div className="landing-topbar"><div className="brand-mark"><span>ϟ</span> {t('brand')}</div><PreferenceControls /></div><LandingPage onEnter={() => setEntered(true)} /><footer className="landing-footer">{t('footer')}</footer></div>;
  return <div className="app"><a className="skip-link" href="#main-content">{t('skipToContent')}</a><header><div className="header-inner"><button className="brand home-button" type="button" onClick={() => setEntered(false)} aria-label={t('home')}><span className="brand-symbol" aria-hidden="true">ϟ</span><span>{t('brand')}</span></button><div className="header-actions"><PreferenceControls /><div className="mode" role="radiogroup" aria-label={t('dataSource')}><button role="radio" aria-checked={mode === 'live'} onClick={() => { setMode('live'); setAnalysis(null); setError(null); }}>{t('liveBackend')}</button><button role="radio" aria-checked={mode === 'mock'} onClick={() => { setMode('mock'); setAnalysis(null); setError(null); }}>{t('mockDemoData')}</button></div></div></div><div className="mode-status" role="status">{t('source')}: <span className="status-badge">{modeLabel}</span></div><nav aria-label={t('navigation')}><button className={tab === 'scenario' ? 'active' : ''} aria-current={tab === 'scenario' ? 'page' : undefined} onClick={() => setTab('scenario')}>{t('scenario')}</button>{tabs.map(([id, key]) => <button key={id} className={tab === id ? 'active' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>{t(key)}</button>)}</nav></header><main id="main-content" aria-busy={busy}>{tab === 'scenario' ? <><ScenarioForm scenario={scenario} busy={busy} error={error} onChange={setScenario} onSubmit={run} />{busy && mode === 'live' && <AnalysisSkeleton />}</> : analysis ? <AnalysisPanels data={analysis} tab={tab} /> : <div className="card"><h2>{t('noAnalysis')}</h2><p>{t('runScenarioFirst')}</p><button className="primary" onClick={() => setTab('scenario')}>{t('openScenario')}</button>{error && <p className="error" role="alert">{error.message}</p>}</div>}</main><footer><span>{t('footer')}</span><span className="footer-mode" role="status">{t('source')}: {modeLabel}</span></footer></div>;
}

function AnalysisSkeleton() { const { t } = useI18n(); return <section className="skeleton-panel" aria-live="polite"><p className="skeleton-status">{t('calculating')}</p><div className="skeleton-grid" aria-hidden="true"><div className="skeleton-block" /><div className="skeleton-block" /><div className="skeleton-block wide" /></div></section>; }
