import { useApp } from '@/hooks/useApp';
import { Card, Badge, FadeIn } from '@/components/ui/primitives';
import { InfoHelp } from '@/components/ui/InfoHelp';
import { formatMMK, formatPercent } from '@/lib/format';
import type { RepeatedGameResult, SequentialGameNode, Strategy } from '@/types';
import { Repeat, GitBranch, Users, TrendingUp } from 'lucide-react';

interface SimulationTabProps {
  repeatedGames: RepeatedGameResult[];
  sequentialGame: SequentialGameNode;
}

export function SimulationTab({ repeatedGames, sequentialGame }: SimulationTabProps) {
  const { t } = useApp();

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('simulation_title')}</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400 dark:text-slate-500">{t('simulation_desc')}</p>
        </div>
      </FadeIn>

      {/* Repeated games */}
      <FadeIn delay={0.05}>
        <Card title={t('repeated_games')} icon={<Repeat size={20} />}>
          <div className="grid gap-4 lg:grid-cols-3">
            {repeatedGames.map((game, idx) => (
              <RepeatedGameCard key={game.strategyName} game={game} isFirst={idx === 0} />
            ))}
          </div>
        </Card>
      </FadeIn>

      {/* Sequential game tree */}
      <FadeIn delay={0.1}>
        <Card title={t('sequential_game')} icon={<GitBranch size={20} />}>
          <div className="flex items-center gap-2 mb-4">
            <Badge color="red">{t('equilibrium_path')}</Badge>
          </div>
          <GameTree node={sequentialGame} depth={0} />
        </Card>
      </FadeIn>
    </div>
  );
}

function RepeatedGameCard({ game, isFirst }: { game: RepeatedGameResult; isFirst: boolean }) {
  const { t } = useApp();
  const isTitForTat = game.strategyName === 'Tit-for-Tat';

  return (
    <div className={`rounded-xl border p-4 ${isTitForTat ? 'border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <Users size={16} className="text-slate-500 dark:text-slate-400 dark:text-slate-500" aria-hidden="true" />
          {game.strategyName}
          {isTitForTat && (
            <span className="ml-1">
              <InfoHelp helpKey="help_tit_for_tat">{null}</InfoHelp>
            </span>
          )}
        </h4>
        <Badge color={game.cooperationRate >= 0.8 ? 'green' : game.cooperationRate >= 0.5 ? 'amber' : 'red'}>
          {formatPercent(game.cooperationRate)}
        </Badge>
      </div>

      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('cooperation_rate')}</p>

      {/* Mini turn table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 dark:text-slate-500">
              <th className="p-1.5 text-left font-medium">{t('day')}</th>
              <th className="p-1.5 text-center font-medium">MM</th>
              <th className="p-1.5 text-center font-medium">PS</th>
              <th className="p-1.5 text-right font-medium">{t('cumulative').split(' ')[0]}</th>
            </tr>
          </thead>
          <tbody>
            {game.turns.map((turn) => (
              <tr key={turn.day} className="border-t border-slate-100">
                <td className="p-1.5 text-left font-medium text-slate-600 dark:text-slate-400 dark:text-slate-500">{turn.day}</td>
                <td className="p-1.5 text-center">
                  <StrategyBadge s={turn.miniMarket} />
                </td>
                <td className="p-1.5 text-center">
                  <StrategyBadge s={turn.phoneShop} />
                </td>
                <td className="p-1.5 text-right text-slate-600 dark:text-slate-400 dark:text-slate-500">
                  {turn.mmCumulative >= 1000 ? `${(turn.mmCumulative / 1000).toFixed(0)}k` : turn.mmCumulative}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
        <div className="text-center">
          <p className="text-[10px] font-medium uppercase text-slate-400 dark:text-slate-500">{t('mm_total')}</p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatMMK(game.mmTotal)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-medium uppercase text-slate-400 dark:text-slate-500">{t('ps_total')}</p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatMMK(game.psTotal)}</p>
        </div>
      </div>
    </div>
  );
}

function StrategyBadge({ s }: { s: Strategy }) {
  const { t } = useApp();
  return (
    <span
      className={`inline-block w-5 rounded px-1 py-0.5 text-[10px] font-bold ${
        s === 'C' ? 'bg-teal-100 text-teal-700 dark:text-teal-400' : 'bg-amber-100 text-amber-700 dark:text-amber-400'
      }`}
      aria-label={s === 'C' ? t('strategy_cooperate') : t('strategy_monopolize')}
    >
      {s}
    </span>
  );
}

function GameTree({ node, depth }: { node: SequentialGameNode; depth: number }) {
  const { t } = useApp();

  if (node.player === 'terminal' && node.payoff) {
    return (
      <div
        className={`mt-2 rounded-lg border p-2.5 text-xs ${
          node.isEquilibrium ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{node.label}</span>
          {node.isEquilibrium && <Badge color="red">Nash</Badge>}
        </div>
        <div className="mt-1 text-slate-600 dark:text-slate-400 dark:text-slate-500">
          {formatMMK(node.payoff.mm)} / {formatMMK(node.payoff.ps)}
        </div>
      </div>
    );
  }

  return (
    <div className={depth > 0 ? 'ml-4 border-l-2 border-slate-200 dark:border-slate-700 pl-4' : ''}>
      {depth > 0 && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{node.label}</span>
          {node.isEquilibrium && <Badge color="red">{t('equilibrium_path')}</Badge>}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {node.children.map((child) => (
          <GameTree key={child.id} node={child} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}
