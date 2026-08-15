import { useApp } from '@/hooks/useApp';
import { Card, Badge, FadeIn } from '@/components/ui/primitives';
import { InfoHelp } from '@/components/ui/InfoHelp';
import { formatMMK } from '@/lib/format';
import type { PayoffMatrix, OutcomeKey } from '@/types';
import { Grid3x3, Scale, Target, AlertCircle } from 'lucide-react';

interface AnalysisTabProps {
  matrix: PayoffMatrix;
}

const OUTCOME_KEYS: OutcomeKey[] = ['CC', 'CM', 'MC', 'MM'];

export function AnalysisTab({ matrix }: AnalysisTabProps) {
  const { t } = useApp();
  const isNash = (k: OutcomeKey) => matrix.nashEquilibria.includes(k);
  const isPareto = (k: OutcomeKey) => matrix.paretoOptimal.includes(k);

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('analysis_title')}</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400 dark:text-slate-500">{t('analysis_desc')}</p>
        </div>
      </FadeIn>

      {/* Legend */}
      <FadeIn delay={0.05}>
        <div className="flex flex-wrap gap-3">
          <Badge color="red">
            <Target size={12} aria-hidden="true" /> {t('nash_equilibrium')}
          </Badge>
          <Badge color="teal">
            <Scale size={12} aria-hidden="true" /> {t('pareto_optimal')}
          </Badge>
        </div>
      </FadeIn>

      {/* Payoff matrix grid */}
      <FadeIn delay={0.1}>
        <Card icon={<Grid3x3 size={20} />} title={t('payoff_matrix')}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <caption className="sr-only">
                {t('payoff_matrix')} — {t('analysis_desc')}
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="p-3 text-left text-sm font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    <span className="sr-only">Strategy</span>
                    <span className="flex items-center gap-1.5">
                      {t('player_mini_market')} \ {t('player_phone_shop')}
                    </span>
                  </th>
                  <th scope="col" className="border-b-2 border-slate-200 dark:border-slate-700 p-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t('strategy_cooperate')}
                  </th>
                  <th scope="col" className="border-b-2 border-slate-200 dark:border-slate-700 p-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t('strategy_monopolize')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Mini Market Cooperate row */}
                <tr>
                  <th scope="row" className="border-r-2 border-slate-200 dark:border-slate-700 p-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t('strategy_cooperate')}
                  </th>
                  <PayoffCell
                    cell={matrix.cells.CC}
                    nash={isNash('CC')}
                    pareto={isPareto('CC')}
                    mmLabel={t('payoff_mm')}
                    psLabel={t('payoff_ps')}
                  />
                  <PayoffCell
                    cell={matrix.cells.CM}
                    nash={isNash('CM')}
                    pareto={isPareto('CM')}
                    mmLabel={t('payoff_mm')}
                    psLabel={t('payoff_ps')}
                  />
                </tr>
                {/* Mini Market Monopolize row */}
                <tr>
                  <th scope="row" className="border-r-2 border-slate-200 dark:border-slate-700 p-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t('strategy_monopolize')}
                  </th>
                  <PayoffCell
                    cell={matrix.cells.MC}
                    nash={isNash('MC')}
                    pareto={isPareto('MC')}
                    mmLabel={t('payoff_mm')}
                    psLabel={t('payoff_ps')}
                  />
                  <PayoffCell
                    cell={matrix.cells.MM}
                    nash={isNash('MM')}
                    pareto={isPareto('MM')}
                    mmLabel={t('payoff_mm')}
                    psLabel={t('payoff_ps')}
                  />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Equilibria summary */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-red-600 dark:text-red-500" aria-hidden="true" />
                <h4 className="text-sm font-semibold text-red-800">{t('nash_equilibrium')}</h4>
              </div>
              <p className="mt-2 text-sm text-red-700 dark:text-red-400">
                {matrix.nashEquilibria.length > 0
                  ? matrix.nashEquilibria.map(formatOutcome).join(', ')
                  : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 p-4">
              <div className="flex items-center gap-2">
                <Scale size={18} className="text-teal-600 dark:text-teal-400" aria-hidden="true" />
                <h4 className="text-sm font-semibold text-teal-800 dark:text-teal-300">{t('pareto_optimal')}</h4>
              </div>
              <p className="mt-2 text-sm text-teal-700 dark:text-teal-400">
                {matrix.paretoOptimal.map(formatOutcome).join(', ')}
              </p>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* Prisoner's Dilemma explanation */}
      <FadeIn delay={0.15}>
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-500" aria-hidden="true" />
            <div>
              <h3 className="flex items-center gap-1.5 text-base font-semibold text-amber-900">
                {t('help_prisoners').split(':')[0]}
                <InfoHelp helpKey="help_prisoners">{null}</InfoHelp>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-amber-800 dark:text-amber-300">
                {t('prisoners_dilemma_explain')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {OUTCOME_KEYS.map((k) => (
                  <span key={k} className="inline-flex items-center gap-1.5 rounded-md bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
                    <span className="font-semibold">{formatOutcome(k)}:</span>
                    {formatMMK(matrix.cells[k].mm)} / {formatMMK(matrix.cells[k].ps)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </FadeIn>
    </div>
  );

  function formatOutcome(k: OutcomeKey): string {
    const map: Record<OutcomeKey, string> = {
      CC: t('strategy_cooperate').split(' ')[0] + '/' + t('strategy_cooperate').split(' ')[0],
      CM: t('strategy_cooperate').split(' ')[0] + '/' + t('strategy_monopolize').split(' ')[0],
      MC: t('strategy_monopolize').split(' ')[0] + '/' + t('strategy_cooperate').split(' ')[0],
      MM: t('strategy_monopolize').split(' ')[0] + '/' + t('strategy_monopolize').split(' ')[0],
    };
    return map[k];
  }
}

interface PayoffCellProps {
  cell: { mm: number; ps: number };
  nash: boolean;
  pareto: boolean;
  mmLabel: string;
  psLabel: string;
}

function PayoffCell({ cell, nash, pareto, mmLabel, psLabel }: PayoffCellProps) {
  let bg = 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-900';
  let border = 'border-slate-200 dark:border-slate-700';
  if (nash) {
    bg = 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100';
    border = 'border-red-300';
  } else if (pareto) {
    bg = 'bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100';
    border = 'border-teal-300';
  }

  return (
    <td
      className={`border ${border} ${bg} p-4 text-center transition-colors`}
      role="cell"
    >
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500">{mmLabel}:</span>
          <span className="text-base font-bold text-slate-800 dark:text-slate-200">{formatMMK(cell.mm)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500">{psLabel}:</span>
          <span className="text-base font-bold text-slate-800 dark:text-slate-200">{formatMMK(cell.ps)}</span>
        </div>
        {(nash || pareto) && (
          <div className="mt-1.5 flex gap-1">
            {nash && (
              <span className="rounded-full bg-red-200 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700 dark:text-red-400">
                Nash
              </span>
            )}
            {pareto && (
              <span className="rounded-full bg-teal-200 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-700 dark:text-teal-400">
                Pareto
              </span>
            )}
          </div>
        )}
      </div>
    </td>
  );
}
