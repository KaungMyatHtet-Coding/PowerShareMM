import { useState, useCallback, useMemo } from 'react';
import { useApp } from '@/hooks/useApp';
import { Button, Card, Badge, FadeIn } from '@/components/ui/primitives';
import { InfoHelp } from '@/components/ui/InfoHelp';
import type { ScenarioInput, PlayerInput } from '@/types';
import { defaultScenario } from '@/data/mockData';
import {
  Zap,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Store,
  Smartphone,
  Battery,
  Play,
} from 'lucide-react';

interface ScenarioTabProps {
  onRun: (scenario: ScenarioInput) => void;
  isRunning: boolean;
  initialScenario: ScenarioInput;
}

interface FieldErrors {
  capacity?: string;
  mmDemand?: string;
  psDemand?: string;
  mmCost?: string;
  psCost?: string;
  mmLoss?: string;
  psLoss?: string;
  durations?: string;
  alpha?: string;
}

function validate(
  scenario: ScenarioInput,
  t: (k: never) => string,
): FieldErrors {
  const errors: FieldErrors = {};
  const tt = t as (k: keyof typeof import('@/i18n/translations').translations.en) => string;

  if (scenario.capacity <= 0) errors.capacity = tt('error_capacity_zero');
  if (scenario.players[0].demand > scenario.capacity)
    errors.mmDemand = tt('error_demand_exceeds');
  if (scenario.players[1].demand > scenario.capacity)
    errors.psDemand = tt('error_demand_exceeds');
  if (scenario.players[0].demand <= 0) errors.mmDemand = tt('error_field_required');
  if (scenario.players[1].demand <= 0) errors.psDemand = tt('error_field_required');
  if (scenario.players[0].costContribution < 0) errors.mmCost = tt('error_field_required');
  if (scenario.players[1].costContribution < 0) errors.psCost = tt('error_field_required');
  if (scenario.players[0].outageLoss < 0) errors.mmLoss = tt('error_field_required');
  if (scenario.players[1].outageLoss < 0) errors.psLoss = tt('error_field_required');
  if (scenario.outageDurations.length === 0 || scenario.outageDurations.some((d) => d <= 0))
    errors.durations = tt('error_field_required');
  if (scenario.hurwiczAlpha < 0 || scenario.hurwiczAlpha > 1)
    errors.alpha = tt('error_alpha_range');
  return errors;
}

export function ScenarioTab({ onRun, isRunning, initialScenario }: ScenarioTabProps) {
  const { t } = useApp();
  const [scenario, setScenario] = useState<ScenarioInput>(initialScenario);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = useMemo(() => validate(scenario, t as never), [scenario, t]);
  const isValid = Object.keys(errors).length === 0;

  const totalDemand = scenario.players[0].demand + scenario.players[1].demand;
  const balance = scenario.capacity - totalDemand;

  const updatePlayer = useCallback(
    (idx: 0 | 1, field: keyof PlayerInput, value: number) => {
      setScenario((prev) => {
        const players = [...prev.players] as [PlayerInput, PlayerInput];
        players[idx] = { ...players[idx], [field]: value };
        return { ...prev, players };
      });
    },
    [],
  );

  const updateField = useCallback(
    <K extends keyof ScenarioInput>(field: K, value: ScenarioInput[K]) => {
      setScenario((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleDurations = (text: string) => {
    const parts = text
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0);
    updateField('outageDurations', parts);
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = () => {
    if (isValid) onRun(scenario);
  };

  const playerIcon = (idx: number) =>
    idx === 0 ? <Store size={20} aria-hidden="true" /> : <Smartphone size={20} aria-hidden="true" />;

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('scenario_title')}</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400 dark:text-slate-500">{t('scenario_desc')}</p>
        </div>
      </FadeIn>

      {/* Capacity card */}
      <FadeIn delay={0.05}>
        <Card className="border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <label
                htmlFor="capacity"
                className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                <Battery size={16} className="text-teal-600 dark:text-teal-400" aria-hidden="true" />
                {t('field_capacity')}
                <InfoHelp helpKey="help_nash">{null}</InfoHelp>
              </label>
              <p className="mb-2 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('field_capacity_help')}</p>
              <div className="relative">
                <input
                  id="capacity"
                  type="number"
                  min={0}
                  step={0.5}
                  value={scenario.capacity}
                  onChange={(e) => updateField('capacity', Number(e.target.value))}
                  onBlur={() => handleBlur('capacity')}
                  aria-invalid={!!errors.capacity && touched.capacity}
                  aria-describedby={errors.capacity ? 'capacity-error' : undefined}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus-visible:ring-2 ${
                    errors.capacity && touched.capacity
                      ? 'border-red-400 focus-visible:ring-red-500'
                      : 'border-slate-300 dark:border-slate-600 focus-visible:ring-teal-500'
                  }`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 dark:text-slate-500">
                  kWh
                </span>
              </div>
              {errors.capacity && touched.capacity && (
                <p id="capacity-error" role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-500">
                  {errors.capacity}
                </p>
              )}
            </div>

            {/* Demand balance indicator */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('total_demand')}</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{totalDemand} kWh</p>
              <div className="mt-1">
                {balance >= 0 ? (
                  <Badge color="green">
                    {t('surplus')}: {balance} kWh
                  </Badge>
                ) : (
                  <Badge color="amber">
                    {t('shortfall')}: {Math.abs(balance)} kWh
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* Player cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {scenario.players.map((player, idx) => {
          const errDemand = idx === 0 ? errors.mmDemand : errors.psDemand;
          const errCost = idx === 0 ? errors.mmCost : errors.psCost;
          const errLoss = idx === 0 ? errors.mmLoss : errors.psLoss;
          const touchDemand = touched[`p${idx}_demand`];
          const touchCost = touched[`p${idx}_cost`];
          const touchLoss = touched[`p${idx}_loss`];
          const hasError = (errDemand && touchDemand) || (errCost && touchCost) || (errLoss && touchLoss);

          return (
            <FadeIn key={player.id} delay={0.1 + idx * 0.05}>
              <Card className={hasError ? 'border-red-200' : ''}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 dark:text-slate-500">
                      {playerIcon(idx)}
                    </span>
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                      {idx === 0 ? t('player_mini_market') : t('player_phone_shop')}
                    </h3>
                  </div>
                  {/* Shop lights status indicator */}
                  <ShopLight hasError={!!hasError} onLabel={t('shop_lights_on')} offLabel={t('shop_lights_off')} />
                </div>

                <div className="space-y-4">
                  <Field
                    id={`p${idx}_demand`}
                    label={t('field_demand')}
                    help={t('field_demand_help')}
                    value={player.demand}
                    unit="kWh"
                    error={errDemand}
                    touched={!!touchDemand}
                    onChange={(v) => updatePlayer(idx as 0 | 1, 'demand', v)}
                    onBlur={() => handleBlur(`p${idx}_demand`)}
                  />
                  <Field
                    id={`p${idx}_cost`}
                    label={t('field_costContribution')}
                    help={t('field_cost_help')}
                    value={player.costContribution}
                    unit="MMK"
                    error={errCost}
                    touched={!!touchCost}
                    onChange={(v) => updatePlayer(idx as 0 | 1, 'costContribution', v)}
                    onBlur={() => handleBlur(`p${idx}_cost`)}
                  />
                  <Field
                    id={`p${idx}_loss`}
                    label={t('field_outageLoss')}
                    help={t('field_outageLoss_help')}
                    value={player.outageLoss}
                    unit="MMK/hr"
                    error={errLoss}
                    touched={!!touchLoss}
                    onChange={(v) => updatePlayer(idx as 0 | 1, 'outageLoss', v)}
                    onBlur={() => handleBlur(`p${idx}_loss`)}
                  />
                </div>
              </Card>
            </FadeIn>
          );
        })}
      </div>

      {/* Uncertainty parameters */}
      <FadeIn delay={0.2}>
        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-200">
            <Zap size={18} className="text-teal-600 dark:text-teal-400" aria-hidden="true" />
            {t('tab_uncertainty')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="durations" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t('field_outageDurations')}
              </label>
              <p className="mb-2 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('field_outageDurations_help')}</p>
              <input
                id="durations"
                type="text"
                defaultValue={scenario.outageDurations.join(', ')}
                onChange={(e) => handleDurations(e.target.value)}
                onBlur={() => handleBlur('durations')}
                aria-invalid={!!errors.durations && touched.durations}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus-visible:ring-2 ${
                  errors.durations && touched.durations
                    ? 'border-red-400 focus-visible:ring-red-500'
                    : 'border-slate-300 dark:border-slate-600 focus-visible:ring-teal-500'
                }`}
                placeholder="2, 4, 6, 8"
              />
              {errors.durations && touched.durations && (
                <p role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-500">{errors.durations}</p>
              )}
            </div>
            <div>
              <label htmlFor="alpha" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t('field_hurwiczAlpha')}
                <InfoHelp helpKey="help_hurwicz">{null}</InfoHelp>
              </label>
              <p className="mb-2 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{t('field_hurwicz_help')}</p>
              <input
                id="alpha"
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={scenario.hurwiczAlpha}
                onChange={(e) => updateField('hurwiczAlpha', Number(e.target.value))}
                onBlur={() => handleBlur('alpha')}
                aria-invalid={!!errors.alpha && touched.alpha}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus-visible:ring-2 ${
                  errors.alpha && touched.alpha
                    ? 'border-red-400 focus-visible:ring-red-500'
                    : 'border-slate-300 dark:border-slate-600 focus-visible:ring-teal-500'
                }`}
              />
              {errors.alpha && touched.alpha && (
                <p role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-500">{errors.alpha}</p>
              )}
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* Status & Run */}
      <FadeIn delay={0.25}>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2.5">
            {isValid ? (
              <>
                <CheckCircle2 size={20} className="text-green-600 dark:text-green-500" aria-hidden="true" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">{t('status_valid')}</span>
              </>
            ) : (
              <>
                <AlertTriangle size={20} className="text-amber-600 dark:text-amber-500" aria-hidden="true" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">{t('status_invalid')}</span>
              </>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={!isValid || isRunning} className="min-w-40">
            <Play size={16} aria-hidden="true" />
            {isRunning ? t('running') : t('run_analysis')}
          </Button>
        </div>
      </FadeIn>
    </div>
  );
}

function ShopLight({ hasError, onLabel, offLabel }: { hasError: boolean; onLabel: string; offLabel: string }) {
  const on = !hasError;
  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: on ? 'rgb(187 247 208)' : 'rgb(254 226 226)',
        color: on ? 'rgb(22 101 52)' : 'rgb(153 27 27)',
      }}
      role="status"
      aria-label={on ? onLabel : offLabel}
    >
      <Lightbulb
        size={14}
        aria-hidden="true"
        className={on ? 'text-green-600 dark:text-green-500' : 'text-red-500'}
      />
      {on ? onLabel : offLabel}
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  help: string;
  value: number;
  unit: string;
  error?: string;
  touched: boolean;
  onChange: (value: number) => void;
  onBlur: () => void;
}

function Field({ id, label, help, value, unit, error, touched, onChange, onBlur }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <p className="mb-1.5 text-xs text-slate-400 dark:text-slate-500">{help}</p>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onBlur={onBlur}
          aria-invalid={!!error && touched}
          aria-describedby={error && touched ? `${id}-error` : undefined}
          className={`w-full rounded-lg border px-3.5 py-2.5 pr-16 text-slate-800 dark:text-slate-200 focus:outline-none focus-visible:ring-2 ${
            error && touched
              ? 'border-red-400 focus-visible:ring-red-500'
              : 'border-slate-300 dark:border-slate-600 focus-visible:ring-teal-500'
          }`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 dark:text-slate-500">
          {unit}
        </span>
      </div>
      {error && touched && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
