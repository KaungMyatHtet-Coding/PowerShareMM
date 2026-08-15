import { useApp } from '@/hooks/useApp';
import { Card, Badge, FadeIn } from '@/components/ui/primitives';
import { InfoHelp } from '@/components/ui/InfoHelp';
import { formatMMK } from '@/lib/format';
import type { ArbitrationResult } from '@/types';
import { Gavel, Handshake, TrendingUp, CheckCircle2 } from 'lucide-react';

interface ArbitrationTabProps {
  arbitration: ArbitrationResult;
}

export function ArbitrationTab({ arbitration }: ArbitrationTabProps) {
  const { t } = useApp();

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('arbitration_title')}
            <span className="ml-2 inline-block align-middle">
              <InfoHelp helpKey="help_arbitration">{null}</InfoHelp>
            </span>
          </h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400 dark:text-slate-500">{t('arbitration_desc')}</p>
        </div>
      </FadeIn>

      {/* Status */}
      <FadeIn delay={0.05}>
        {arbitration.feasible ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 p-4">
            <CheckCircle2 size={20} className="text-green-600 dark:text-green-500" aria-hidden="true" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              {t('max_product_point')}: {formatMMK(arbitration.maxProductPoint.mm)} / {formatMMK(arbitration.maxProductPoint.ps)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4">
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Arbitration not feasible — no mutually beneficial allocation exists.
            </span>
          </div>
        )}
      </FadeIn>

      {/* Key result cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <FadeIn delay={0.1}>
          <Card className="border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 dark:text-slate-500">
              <Gavel size={18} aria-hidden="true" />
              <h3 className="text-sm font-semibold">{t('disagreement_point')}</h3>
            </div>
            <div className="mt-4 space-y-2">
              <PayoffRow label={t('player_mini_market')} value={arbitration.disagreementPoint.mm} />
              <PayoffRow label={t('player_phone_shop')} value={arbitration.disagreementPoint.ps} />
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.15}>
          <Card className="border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20">
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
              <Handshake size={18} aria-hidden="true" />
              <h3 className="text-sm font-semibold">{t('max_product_point')}</h3>
            </div>
            <div className="mt-4 space-y-2">
              <PayoffRow label={t('player_mini_market')} value={arbitration.maxProductPoint.mm} highlight />
              <PayoffRow label={t('player_phone_shop')} value={arbitration.maxProductPoint.ps} highlight />
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card className="border-green-200 bg-green-50">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <TrendingUp size={18} aria-hidden="true" />
              <h3 className="text-sm font-semibold">{t('gain_over_disagreement')}</h3>
            </div>
            <div className="mt-4 space-y-2">
              <PayoffRow label={t('player_mini_market')} value={arbitration.gainOverDisagreement.mm} highlight prefix="+" />
              <PayoffRow label={t('player_phone_shop')} value={arbitration.gainOverDisagreement.ps} highlight prefix="+" />
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Negotiation set visualization */}
      <FadeIn delay={0.25}>
        <Card title={t('negotiation_set')} icon={<TrendingUp size={20} />}>
          <NegotiationSetChart arbitration={arbitration} />
        </Card>
      </FadeIn>
    </div>
  );
}

function PayoffRow({ label, value, highlight, prefix = '' }: { label: string; value: number; highlight?: boolean; prefix?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'}`}>
        {prefix}{formatMMK(value)}
      </span>
    </div>
  );
}

interface NegotiationSetChartProps {
  arbitration: ArbitrationResult;
}

function NegotiationSetChart({ arbitration }: NegotiationSetChartProps) {
  const { t } = useApp();
  // Simple scatter visualization using percentages
  const allPoints = [...arbitration.negotiationSet, arbitration.disagreementPoint, arbitration.maxProductPoint];
  const maxMm = Math.max(...allPoints.map((p) => p.mm));
  const maxPs = Math.max(...allPoints.map((p) => p.ps));

  return (
    <div className="space-y-4">
      <div className="relative mx-auto aspect-square w-full max-w-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg">
        {/* Axes labels */}
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500">
          {t('player_mini_market')} →
        </span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500">
          {t('player_phone_shop')} →
        </span>

        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full p-8" role="img" aria-label="Negotiation set scatter plot">
          {/* Grid lines */}
          {[25, 50, 75].map((v) => (
            <g key={v}>
              <line x1={v} y1={0} x2={v} y2={100} stroke="#e2e8f0" strokeWidth={0.3} />
              <line x1={0} y1={v} x2={100} y2={v} stroke="#e2e8f0" strokeWidth={0.3} />
            </g>
          ))}

          {/* Negotiation set points */}
          {arbitration.negotiationSet.map((p, i) => {
            const x = (p.mm / maxMm) * 100;
            const y = 100 - (p.ps / maxPs) * 100;
            const isMax = p.mm === arbitration.maxProductPoint.mm && p.ps === arbitration.maxProductPoint.ps;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={isMax ? 3 : 1.8}
                fill={isMax ? '#0d9488' : '#94a3b8'}
                stroke={isMax ? '#0f766e' : 'none'}
                strokeWidth={isMax ? 0.8 : 0}
              >
                <title>{`${formatMMK(p.mm)} / ${formatMMK(p.ps)}`}</title>
              </circle>
            );
          })}

          {/* Disagreement point */}
          <circle
            cx={(arbitration.disagreementPoint.mm / maxMm) * 100}
            cy={100 - (arbitration.disagreementPoint.ps / maxPs) * 100}
            r={2.2}
            fill="#ef4444"
            stroke="#dc2626"
            strokeWidth={0.6}
          >
            <title>{`${t('disagreement_point')}: ${formatMMK(arbitration.disagreementPoint.mm)} / ${formatMMK(arbitration.disagreementPoint.ps)}`}</title>
          </circle>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 dark:text-slate-500">
          <span className="h-3 w-3 rounded-full bg-teal-600" /> {t('max_product_point')}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 dark:text-slate-500">
          <span className="h-3 w-3 rounded-full bg-slate-400" /> {t('negotiation_set')}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 dark:text-slate-500">
          <span className="h-3 w-3 rounded-full bg-red-50 dark:bg-red-900/200" /> {t('disagreement_point')}
        </span>
      </div>
    </div>
  );
}
