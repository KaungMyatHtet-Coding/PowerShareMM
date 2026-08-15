import { useApp } from '@/hooks/useApp';
import { Card, Badge, FadeIn } from '@/components/ui/primitives';
import type { FullAnalysisResponse } from '@/types';
import type { TranslationKey } from '@/i18n/translations';
import {
  BookOpen,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Flag,
  FileText,
} from 'lucide-react';

interface ResultsTabProps {
  analysis: FullAnalysisResponse;
}

export function ResultsTab({ analysis }: ResultsTabProps) {
  const { t, t_format } = useApp();

  const riskColor: Record<string, 'green' | 'amber' | 'red'> = {
    low: 'green',
    moderate: 'amber',
    high: 'red',
  };
  const riskLabel: Record<string, TranslationKey> = {
    low: 'risk_low',
    moderate: 'risk_moderate',
    high: 'risk_high',
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{t('results_title')}</h2>
          <p className="mt-1 text-slate-600">{t('results_desc')}</p>
        </div>
      </FadeIn>

      {/* Headline */}
      <FadeIn delay={0.05}>
        <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white">
          <div className="flex items-start gap-3">
            <BookOpen size={24} className="mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge color={riskColor[analysis.summary.riskLevel]}>
                  <Flag size={11} aria-hidden="true" /> {t(riskLabel[analysis.summary.riskLevel])}
                </Badge>
              </div>
              <p className="text-base font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                {t_format(analysis.summary.headline.key as TranslationKey, analysis.summary.headline.vars)}
              </p>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* Findings */}
      <FadeIn delay={0.1}>
        <Card title={t('findings')} icon={<Lightbulb size={20} />}>
          <ul className="space-y-3">
            {analysis.summary.findings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30 text-xs font-bold text-teal-700 dark:text-teal-400">
                  {idx + 1}
                </span>
                <span className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {t_format(finding.key as TranslationKey, finding.vars)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </FadeIn>

      {/* Recommendation */}
      <FadeIn delay={0.15}>
        <Card className="border-teal-200 bg-teal-50 dark:border-teal-900 dark:bg-teal-900/10" title={t('recommendation')} icon={<CheckCircle2 size={20} />}>
          <p className="text-sm leading-relaxed text-teal-900 dark:text-teal-100">
            {t_format(analysis.summary.recommendation.key as TranslationKey, analysis.summary.recommendation.vars)}
          </p>
        </Card>
      </FadeIn>

      {/* Assumptions */}
      <FadeIn delay={0.2}>
        <Card title={t('assumptions')} icon={<FileText size={20} />}>
          <ul className="space-y-2">
            {analysis.assumptions.map((assumption, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                {t_format(assumption.key as TranslationKey, assumption.vars)}
              </li>
            ))}
          </ul>
        </Card>
      </FadeIn>

      {/* Warnings */}
      <FadeIn delay={0.25}>
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10" title={t('warnings')} icon={<AlertTriangle size={20} />}>
          <ul className="space-y-2.5">
            {analysis.warnings.map((warning, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-amber-800 dark:text-amber-200">
                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-500" aria-hidden="true" />
                {t_format(warning.key as TranslationKey, warning.vars)}
              </li>
            ))}
          </ul>
        </Card>
      </FadeIn>

      <FadeIn delay={0.3}>
        <p className="text-center text-xs text-slate-400">{t('footer_note')}</p>
      </FadeIn>
    </div>
  );
}
