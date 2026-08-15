import { useApp } from '@/hooks/useApp';
import { Card, Badge, FadeIn } from '@/components/ui/primitives';
import { InfoHelp } from '@/components/ui/InfoHelp';
import { formatMMK } from '@/lib/format';
import type { UncertaintyAnalysis, UncertaintyResult, Strategy } from '@/types';
import type { TranslationKey } from '@/i18n/translations';
import { CloudRain, TrendingUp, Shield, Flame, Dices, Sliders } from 'lucide-react';

interface UncertaintyTabProps {
  uncertainty: UncertaintyAnalysis;
}

const criterionIcons: Record<UncertaintyResult['criterion'], typeof TrendingUp> = {
  expected_value: TrendingUp,
  maximin: Shield,
  maximax: Flame,
  laplace: Dices,
  minimax_regret: CloudRain,
  hurwicz: Sliders,
};

const criterionLabels: Record<UncertaintyResult['criterion'], TranslationKey> = {
  expected_value: 'criterion_expected_value',
  maximin: 'criterion_maximin',
  maximax: 'criterion_maximax',
  laplace: 'criterion_laplace',
  minimax_regret: 'criterion_minimax_regret',
  hurwicz: 'criterion_hurwicz',
};

const criterionHelp: Record<UncertaintyResult['criterion'], TranslationKey> = {
  expected_value: 'help_ev',
  maximin: 'help_maximin',
  maximax: 'help_maximin',
  laplace: 'help_ev',
  minimax_regret: 'help_maximin',
  hurwicz: 'help_hurwicz',
};

export function UncertaintyTab({ uncertainty }: UncertaintyTabProps) {
  const { t } = useApp();

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('uncertainty_title')}</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400 dark:text-slate-500">{t('uncertainty_desc')}</p>
        </div>
      </FadeIn>

      {/* Payoff table */}
      <FadeIn delay={0.05}>
        <Card title="Payoff table" icon={<CloudRain size={20} />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Payoff table for each strategy across outage durations</caption>
              <thead>
                <tr>
                  <th scope="col" className="border-b-2 border-slate-200 dark:border-slate-700 p-3 text-left font-semibold text-slate-600 dark:text-slate-400 dark:text-slate-500">
                    {t('strategy_name')}
                  </th>
                  {uncertainty.states.map((s, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="border-b-2 border-slate-200 dark:border-slate-700 p-3 text-center font-semibold text-slate-600 dark:text-slate-400 dark:text-slate-500"
                    >
                      {s}h
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(['C', 'M'] as Strategy[]).map((strat) => (
                  <tr key={strat}>
                    <th scope="row" className="border-b border-slate-100 p-3 text-left font-medium text-slate-700 dark:text-slate-300">
                      {strat === 'C' ? t('strategy_cooperate') : t('strategy_monopolize')}
                    </th>
                    {uncertainty.payoffTable[strat].map((val, i) => (
                      <td key={i} className="border-b border-slate-100 p-3 text-center font-medium text-slate-700 dark:text-slate-300">
                        {formatMMK(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </FadeIn>

      {/* Criterion cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {uncertainty.results.map((result, idx) => {
          const Icon = criterionIcons[result.criterion];
          const labelKey = criterionLabels[result.criterion];
          const helpKey = criterionHelp[result.criterion];
          const isC = result.recommendedStrategy === 'C';

          return (
            <FadeIn key={result.criterion} delay={0.1 + idx * 0.05}>
              <Card className={`h-full ${isC ? 'border-teal-200 dark:border-teal-800' : 'border-amber-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${isC ? 'bg-teal-100 text-teal-600 dark:text-teal-400' : 'bg-amber-100 text-amber-600 dark:text-amber-500'}`}>
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t(labelKey)}
                      <span className="ml-1.5 inline-block align-middle">
                        <InfoHelp helpKey={helpKey}>{null}</InfoHelp>
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('recommended')}:</span>
                  <Badge color={isC ? 'teal' : 'amber'}>
                    {isC ? t('strategy_cooperate') : t('strategy_monopolize')}
                  </Badge>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400 dark:text-slate-500">{result.rationale}</p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2.5 text-center">
                    <p className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500">
                      {t('strategy_cooperate').split(' ')[0]}
                    </p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {result.criterion === 'minimax_regret' ? '' : formatMMK(result.values.C)}
                      {result.criterion === 'minimax_regret' ? formatMMK(result.values.C) : ''}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2.5 text-center">
                    <p className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500">
                      {t('strategy_monopolize').split(' ')[0]}
                    </p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {result.criterion === 'minimax_regret' ? '' : formatMMK(result.values.M)}
                      {result.criterion === 'minimax_regret' ? formatMMK(result.values.M) : ''}
                    </p>
                  </div>
                </div>
              </Card>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}
