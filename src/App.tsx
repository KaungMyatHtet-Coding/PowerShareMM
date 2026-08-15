import { useState, useCallback, useEffect } from 'react';
import { AppProvider, useApp } from '@/hooks/useApp';
import { Header } from '@/components/layout/Header';
import { ScenarioTab } from '@/components/tabs/ScenarioTab';
import { AnalysisTab } from '@/components/tabs/AnalysisTab';
import { UncertaintyTab } from '@/components/tabs/UncertaintyTab';
import { ArbitrationTab } from '@/components/tabs/ArbitrationTab';
import { SimulationTab } from '@/components/tabs/SimulationTab';
import { ResultsTab } from '@/components/tabs/ResultsTab';
import { Spinner, ErrorState, EmptyState } from '@/components/ui/primitives';
import { createApiClient } from '@/lib/apiClient';
import { mockFullAnalysis } from '@/data/mockData';
import type { ScenarioInput, FullAnalysisResponse } from '@/types';

function Dashboard() {
  const { t, apiMode } = useApp();
  const [activeTab, setActiveTab] = useState('scenario');
  const [scenario, setScenario] = useState<ScenarioInput>(mockFullAnalysis.scenario);
  const [analysis, setAnalysis] = useState<FullAnalysisResponse | null>(mockFullAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(
    async (input: ScenarioInput) => {
      setLoading(true);
      setError(null);
      setScenario(input);
      try {
        const client = createApiClient(apiMode);
        const result = await client.analyze(input);
        setAnalysis(result);
        setActiveTab('analysis');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        // Fallback to last successful analysis if available
      } finally {
        setLoading(false);
      }
    },
    [apiMode],
  );

  // Re-run analysis when API mode changes (if we already have a scenario)
  useEffect(() => {
    if (analysis) {
      runAnalysis(scenario).catch(() => {
        // Error handled in runAnalysis
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiMode]);

  const renderTab = () => {
    if (loading) {
      return <Spinner label={t('loading')} />;
    }
    if (error) {
      return (
        <ErrorState
          title={t('error_title')}
          message={error}
          onRetry={() => runAnalysis(scenario)}
          retryLabel={t('retry')}
        />
      );
    }
    if (!analysis) {
      return <EmptyState title={t('empty_title')} />;
    }

    switch (activeTab) {
      case 'scenario':
        return (
          <ScenarioTab
            onRun={runAnalysis}
            isRunning={loading}
            initialScenario={scenario}
          />
        );
      case 'analysis':
        return <AnalysisTab matrix={analysis.payoffMatrix} />;
      case 'uncertainty':
        return <UncertaintyTab uncertainty={analysis.uncertainty} />;
      case 'arbitration':
        return <ArbitrationTab arbitration={analysis.arbitration} />;
      case 'simulation':
        return (
          <SimulationTab
            repeatedGames={analysis.repeatedGames}
            sequentialGame={analysis.sequentialGame}
          />
        );
      case 'results':
        return <ResultsTab analysis={analysis} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="main-content">
        {renderTab()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
