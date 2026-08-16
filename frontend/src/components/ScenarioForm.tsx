import { type FormEvent, useState } from 'react';
import type { ClientError } from '../api/client';
import { demoScenario } from '../data/mockFixture';
import { useI18n } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';
import type { Scenario } from '../types';

/* ─── Props (unchanged from original) ─────────────────────────────────── */
interface Props {
  scenario: Scenario;
  busy: boolean;
  error: ClientError | null;
  onChange: (next: Scenario) => void;
  onSubmit: () => void;
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */
const num = (v: string) => Number(v);

/** Deep-clone the scenario, set a nested value at dot-path, notify parent. */
function makeUpdater(scenario: Scenario, onChange: (next: Scenario) => void) {
  return (path: string, value: string | number) => {
    const next = structuredClone(scenario) as Scenario;
    const keys = path.split('.');
    let target = next as unknown as Record<string, unknown>;
    keys.slice(0, -1).forEach((k) => { target = target[k] as Record<string, unknown>; });
    target[keys[keys.length - 1]] = value;
    onChange(next);
  };
}

/* ─── Field ────────────────────────────────────────────────────────────── */
interface FieldProps {
  id: string;
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
  min?: string;
  unit?: string;
  helpText?: string;
  errorText?: string;
  readOnly?: boolean;
}

function Field({ id, label, value, onChange, type = 'text', step, min, unit, helpText, errorText, readOnly }: FieldProps) {
  const helpId = helpText ? `${id}-help` : undefined;
  const errId  = errorText ? `${id}-err` : undefined;
  const desc   = [helpId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field${errorText ? ' field-invalid' : ''}`}>
      <label htmlFor={id}>
        {label}{unit && <span className="field-unit"> ({unit})</span>}
      </label>
      {readOnly
        ? <div className="field-readonly" id={id} aria-describedby={desc}>{value}</div>
        : <input
            id={id} required type={type} step={step} min={min}
            value={value}
            readOnly={readOnly}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={desc}
            aria-invalid={errorText ? 'true' : undefined}
          />
      }
      {helpText  && <p id={helpId} className="field-helper">{helpText}</p>}
      {errorText && <p id={errId}  className="field-error" role="alert">{errorText}</p>}
    </div>
  );
}

/* ─── Urgency segmented control ────────────────────────────────────────── */
function UrgencyControl({ value, onChange, id, t }: {
  value: number; onChange: (v: number) => void; id: string; t: (k: TranslationKey) => string;
}) {
  const labels: TranslationKey[] = ['urgency1', 'urgency2', 'urgency3', 'urgency4', 'urgency5'];
  return (
    <fieldset className="urgency-fieldset">
      <legend className="sr-only">{t('urgency')}</legend>
      <div className="urgency-group">
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <label key={n} htmlFor={`${id}-${n}`} className={`urgency-btn${value === n ? ' selected' : ''}`}>
            <input
              type="radio"
              id={`${id}-${n}`}
              name={`urgency-${id}`}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            <span className="urgency-num">{n}</span>
            <span className="urgency-lbl">{t(labels[n - 1])}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* ─── Risk preference slider ───────────────────────────────────────────── */
function RiskSlider({ value, onChange, id, t }: {
  value: number; onChange: (v: number) => void; id: string; t: (k: TranslationKey) => string;
}) {
  const anchors: Array<{ threshold: number; key: TranslationKey }> = [
    { threshold: 0,    key: 'risk0'   },
    { threshold: 0.25, key: 'risk25'  },
    { threshold: 0.5,  key: 'risk50'  },
    { threshold: 0.75, key: 'risk75'  },
    { threshold: 1,    key: 'risk100' },
  ];
  const nearest = anchors.reduce((prev, curr) =>
    Math.abs(curr.threshold - value) < Math.abs(prev.threshold - value) ? curr : prev);
  const descId = `${id}-cat`;
  return (
    <div className="slider-wrapper">
      <div className="range-row">
        <input id={id} type="range" min="0" max="1" step="0.05"
          value={value} onChange={(e) => onChange(Number(e.target.value))}
          aria-describedby={descId} />
        <span className="range-value">{value.toFixed(2)}</span>
      </div>
      <p id={descId} className="range-desc">{t(nearest.key)}</p>
      <div className="range-anchors" aria-hidden="true">
        <span>0 — {t('risk0')}</span><span>0.5 — {t('risk50')}</span><span>1 — {t('risk100')}</span>
      </div>
    </div>
  );
}

/* ─── Hurwicz alpha slider ─────────────────────────────────────────────── */
function HurwiczSlider({ value, onChange, t }: {
  value: number; onChange: (v: number) => void; t: (k: TranslationKey) => string;
}) {
  const bestPct  = Math.round(value * 100);
  const worstPct = 100 - bestPct;
  return (
    <div className="slider-wrapper">
      <div className="range-row">
        <input id="hurwicz-alpha" type="range" min="0" max="1" step="0.05"
          value={value} onChange={(e) => onChange(Number(e.target.value))}
          aria-describedby="hurwicz-weight" />
        <span className="range-value">{value.toFixed(2)}</span>
      </div>
      <p id="hurwicz-weight" className="range-desc">
        {bestPct}% best-case + {worstPct}% worst-case
      </p>
      <div className="range-anchors" aria-hidden="true">
        <span>0 — {t('hurwiczConservative')}</span>
        <span>0.5 — {t('hurwiczBalanced')}</span>
        <span>1 — {t('hurwiczOptimistic')}</span>
      </div>
    </div>
  );
}

/* ─── Intro panel ──────────────────────────────────────────────────────── */
function IntroPanel({ t }: { t: (k: TranslationKey) => string }) {
  const steps: Array<{ title: TranslationKey; desc: TranslationKey; icon: string }> = [
    { title: 'step1Title', desc: 'step1Desc', icon: '⚡' },
    { title: 'step2Title', desc: 'step2Desc', icon: '🏪' },
    { title: 'step3Title', desc: 'step3Desc', icon: '📊' },
  ];
  return (
    <section className="card intro-panel" aria-labelledby="intro-heading">
      <h2 id="intro-heading">{t('howThisPageWorks')}</h2>
      <p className="intro-text">{t('howThisPageWorksText')}</p>
      <div className="step-guide">
        {steps.map(({ title, desc, icon }, i) => (
          <div key={i} className="step-card">
            <span className="step-icon" aria-hidden="true">{icon}</span>
            <strong className="step-title">{t(title)}</strong>
            <p className="step-desc">{t(desc)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Example summary (static, no game theory) ─────────────────────────── */
function ExampleSummary({ t, scenario }: { t: (k: TranslationKey) => string; scenario: Scenario }) {
  const cap    = scenario.resource.capacity_kwh;
  const demand = scenario.players.reduce((s, p) => s + p.demand_kwh, 0);
  const diff   = cap - demand;
  return (
    <section className="card example-summary" aria-labelledby="example-heading">
      <h3 id="example-heading">{t('exampleScenarioTitle')}</h3>
      <p className="field-helper">{t('exampleNote')}</p>
      <dl className="example-stats">
        <div><dt>{t('reviewEnergy')}</dt><dd>{cap} kWh</dd></div>
        <div><dt>{t('reviewDemand')}</dt><dd>{demand} kWh</dd></div>
        <div><dt>{diff < 0 ? t('reviewShortage') : t('reviewSurplus')}</dt>
          <dd className={diff < 0 ? 'ex-shortage' : 'ex-surplus'}>{Math.abs(diff)} kWh</dd></div>
      </dl>
    </section>
  );
}

/* ─── How your info is used ────────────────────────────────────────────── */
function HowInfoIsUsed({ t }: { t: (k: TranslationKey) => string }) {
  const rows: TranslationKey[] = [
    'infoUsedResource', 'infoUsedNeeds', 'infoUsedUrgency',
    'infoUsedCost', 'infoUsedProbabilities', 'infoUsedAlpha', 'infoUsedAll',
  ];
  return (
    <section className="card info-used-panel" aria-labelledby="info-used-heading">
      <h3 id="info-used-heading">{t('howInfoIsUsedTitle')}</h3>
      <ul className="info-used-list">
        {rows.map((key) => <li key={key}>{t(key)}</li>)}
      </ul>
    </section>
  );
}

/* ─── Review summary ───────────────────────────────────────────────────── */
function ReviewSummary({ t, scenario, costShareError, probError, p1EssErr, p2EssErr, hasErrors }: {
  t: (k: TranslationKey) => string;
  scenario: Scenario;
  costShareError: boolean;
  probError: boolean;
  p1EssErr: boolean;
  p2EssErr: boolean;
  hasErrors: boolean;
}) {
  const cap     = scenario.resource.capacity_kwh;
  const demand  = scenario.players.reduce((s, p) => s + p.demand_kwh, 0);
  const diff    = cap - demand;
  const csPct   = Math.round((scenario.players[0].preferred_cost_share + scenario.players[1].preferred_cost_share) * 100);
  const probPct = Math.round(scenario.uncertainty_fixture.nature_states.reduce((s, n) => s + n.probability, 0) * 100);
  return (
    <section className="card review-summary" aria-labelledby="review-heading">
      <h3 id="review-heading">{t('reviewSummaryTitle')}</h3>
      <dl className="review-list">
        <div className="review-row"><dt>{t('reviewEnergy')}</dt><dd>{cap} kWh</dd></div>
        <div className="review-row"><dt>{t('reviewDemand')}</dt><dd>{demand} kWh</dd></div>
        <div className="review-row">
          <dt>{diff < 0 ? t('reviewShortage') : t('reviewSurplus')}</dt>
          <dd className={diff < 0 ? 'review-shortage' : 'review-surplus'}>{Math.abs(diff).toFixed(1)} kWh</dd>
        </div>
        <div className={`review-row${costShareError ? ' review-invalid' : ' review-ok'}`}>
          <dt>{t('reviewCostShares')}</dt>
          <dd>{csPct}% — {costShareError ? t('costShareInvalid') : t('costShareValid')}</dd>
        </div>
        <div className={`review-row${probError ? ' review-invalid' : ' review-ok'}`}>
          <dt>{t('reviewProbTotal')}</dt>
          <dd>{probPct}% — {probError ? t('probInvalid') : t('probValid')}</dd>
        </div>
        {(p1EssErr || p2EssErr) && (
          <div className="review-row review-invalid">
            <dt className="review-error-note">{t('essentialExceedsDemand')}</dt><dd />
          </div>
        )}
      </dl>
      <p className={hasErrors ? 'review-not-ready' : 'review-ready'} aria-live="polite">
        {hasErrors ? t('reviewNotReady') : t('reviewReady')}
      </p>
    </section>
  );
}

/* ─── Main form ─────────────────────────────────────────────────────────── */
export function ScenarioForm({ scenario, busy, error, onChange, onSubmit }: Props) {
  const { t } = useI18n();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const update = makeUpdater(scenario, onChange);

  const submit = (e: FormEvent) => { e.preventDefault(); onSubmit(); };

  /* Validation */
  const p1 = scenario.players[0];
  const p2 = scenario.players[1];
  const capErr       = scenario.resource.capacity_kwh <= 0;
  const hoursErr     = scenario.resource.available_hours <= 0;
  const loadErr      = scenario.resource.max_safe_load_kw <= 0;
  const slotErr      = scenario.resource.slot_duration_hours <= 0;
  const p1DemandErr  = p1.demand_kwh <= 0;
  const p2DemandErr  = p2.demand_kwh <= 0;
  const p1HoursErr   = p1.desired_hours <= 0;
  const p2HoursErr   = p2.desired_hours <= 0;

  const p1EssErr    = p1.essential_kwh > p1.demand_kwh;
  const p2EssErr    = p2.essential_kwh > p2.demand_kwh;
  const csSum       = p1.preferred_cost_share + p2.preferred_cost_share;
  const probSum     = scenario.uncertainty_fixture.nature_states.reduce((s, n) => s + n.probability, 0);
  const costShareError = Math.abs(csSum - 1.0) > 0.001;
  const probError      = Math.abs(probSum - 1.0) > 0.001;
  const posError     = capErr || hoursErr || loadErr || slotErr || p1DemandErr || p2DemandErr || p1HoursErr || p2HoursErr;
  const hasErrors      = posError || p1EssErr || p2EssErr || costShareError || probError;

  /* Probability state labels */
  const stateLabels: Record<string, TranslationKey> = {
    SHORT: 'stateShort', MEDIUM: 'stateMedium', LONG: 'stateLong',
  };

  return (
    <form className="scenario-form guided-form" onSubmit={submit}
          aria-describedby={error ? 'form-api-error' : undefined}>
      <h1 className="sr-only">{t('scenarioInput')}</h1>

      {/* 1 — How this page works */}
      <IntroPanel t={t} />

      {/* 2 — Example summary */}
      <ExampleSummary t={t} scenario={scenario} />

      {/* 3 — BASIC INFORMATION ──────────────────────────────────────────── */}
      <section className="card guided-section" aria-labelledby="basic-heading">
        <h2 id="basic-heading">{t('basicInformation')}</h2>

        {/* Shared resource */}
        <fieldset className="sub-card">
          <legend>{t('scenario')}</legend>
          <div className="field-grid">
            <Field id="sf-name" label={t('name')} value={scenario.name}
              onChange={(v) => update('name', v)} />

            {/* Resource type — read-only */}
            <div className="field">
              <span className="field-label-text" id="resource-type-lbl">{t('resourceType')}</span>
              <div className="field-readonly" aria-labelledby="resource-type-lbl"
                   aria-describedby="resource-type-help">
                {t('resourceTypeDisplay')}
              </div>
              <p id="resource-type-help" className="field-helper">{t('resourceTypeHelp')}</p>
              {/* Hidden so the real value is still part of scenario state */}
            </div>

            <Field id="sf-capacity" label={t('capacity')} type="number" step="0.1"
              value={scenario.resource.capacity_kwh} unit="kWh"
              onChange={(v) => update('resource.capacity_kwh', num(v))}
              helpText={t('capacityHelp')}
              errorText={capErr ? t('mustBeGreaterThanZero') : undefined} />

            <Field id="sf-avail-hours" label={t('availableHours')} type="number" step="0.5"
              value={scenario.resource.available_hours} unit={t('hoursUnit')}
              onChange={(v) => update('resource.available_hours', num(v))}
              helpText={t('availableHoursHelp')}
              errorText={hoursErr ? t('mustBeGreaterThanZero') : undefined} />

            <Field id="sf-total-cost" label={t('totalCost')} type="number"
              value={scenario.resource.total_cost_mmk} unit="MMK"
              onChange={(v) => update('resource.total_cost_mmk', num(v))}
              helpText={t('totalCostHelp')} />
          </div>
        </fieldset>

        {/* Players */}
        <div className="player-grid" style={{ marginTop: '1rem' }}>
          {scenario.players.map((player, idx) => (
            <fieldset key={player.id} className="sub-card player-card">
              <legend>{player.id}: {player.name}</legend>
              <div className="field-grid">
                <Field id={`${player.id}-name`} label={t('name')} value={player.name}
                  onChange={(v) => update(`players.${idx}.name`, v)} />

                <Field id={`${player.id}-biz`} label={t('businessType')} value={player.business_type}
                  onChange={(v) => update(`players.${idx}.business_type`, v)} />

                <Field id={`${player.id}-demand`} label={t('demand')} type="number" step="0.5"
                  value={player.demand_kwh} unit="kWh"
                  onChange={(v) => update(`players.${idx}.demand_kwh`, num(v))}
                  helpText={t('demandHelp')}
                  errorText={(idx === 0 ? p1DemandErr : p2DemandErr) ? t('mustBeGreaterThanZero') : undefined} />

                <Field id={`${player.id}-essential`} label={t('essential')} type="number" step="0.5"
                  value={player.essential_kwh} unit="kWh"
                  onChange={(v) => update(`players.${idx}.essential_kwh`, num(v))}
                  helpText={t('essentialHelp')}
                  errorText={(idx === 0 ? p1EssErr : p2EssErr) ? t('essentialExceedsDemand') : undefined} />

                <Field id={`${player.id}-dhours`} label={t('desiredHours')} type="number" step="0.5"
                  value={player.desired_hours} unit={t('hoursUnit')}
                  onChange={(v) => update(`players.${idx}.desired_hours`, num(v))}
                  helpText={t('desiredHoursHelp')}
                  errorText={(idx === 0 ? p1HoursErr : p2HoursErr) ? t('mustBeGreaterThanZero') : undefined} />

                <Field id={`${player.id}-loss`} label={t('outageLoss')} type="number"
                  value={player.outage_loss_mmk} unit="MMK"
                  onChange={(v) => update(`players.${idx}.outage_loss_mmk`, num(v))}
                  helpText={t('outageLossHelp')} />

                {/* Urgency — segmented */}
                <div className="field field-full">
                  <span className="field-label-text">{t('urgency')}</span>
                  <p className="field-helper">{t('urgencyHelp')}</p>
                  <UrgencyControl
                    value={player.urgency}
                    onChange={(v) => update(`players.${idx}.urgency`, v)}
                    id={`${player.id}-urgency`}
                    t={t} />
                </div>
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      {/* 4 — ADVANCED MODEL SETTINGS (collapsed by default) ─────────────── */}
      <details className="card advanced-details"
        open={advancedOpen}
        onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}>
        <summary className="advanced-summary" onClick={(e) => { e.preventDefault(); setAdvancedOpen((o) => !o); }}>
          <span className="advanced-title">{t('advancedModelSettings')}</span>
          <span className="advanced-chevron" aria-hidden="true">{advancedOpen ? '▲' : '▼'}</span>
        </summary>

        {advancedOpen && (
          <div className="advanced-body">
            <div className="advanced-warning" role="note">
              ⚠ {t('advancedWarning')}
            </div>

            {/* Resource — advanced fields */}
            <fieldset className="sub-card">
              <legend>{t('scenario')}</legend>
              <div className="field-grid">
                <Field id="sf-max-load" label={t('maxSafeLoad')} type="number"
                  value={scenario.resource.max_safe_load_kw} unit="kW"
                  onChange={(v) => update('resource.max_safe_load_kw', num(v))}
                  helpText={t('maxSafeLoadHelp')}
                  errorText={loadErr ? t('mustBeGreaterThanZero') : undefined} />

                <Field id="sf-slot" label={t('slotDuration')} type="number" step="0.5"
                  value={scenario.resource.slot_duration_hours} unit={t('hoursUnit')}
                  onChange={(v) => update('resource.slot_duration_hours', num(v))}
                  helpText={t('slotDurationHelp')}
                  errorText={slotErr ? t('mustBeGreaterThanZero') : undefined} />

                <Field id="sf-overload" label={t('overloadPenalty')} type="number"
                  value={scenario.resource.overload_penalty}
                  onChange={(v) => update('resource.overload_penalty', num(v))}
                  helpText={t('overloadPenaltyHelp')} />

                <Field id="sf-violation" label={t('violationPenalty')} type="number"
                  value={scenario.resource.violation_penalty}
                  onChange={(v) => update('resource.violation_penalty', num(v))}
                  helpText={t('violationPenaltyHelp')} />
              </div>
            </fieldset>

            {/* Per-player advanced fields */}
            <div className="player-grid" style={{ marginTop: '1rem' }}>
              {scenario.players.map((player, idx) => (
                <fieldset key={player.id} className="sub-card player-card">
                  <legend>{player.id}: {player.name}</legend>

                  {/* Risk preference */}
                  <div className="field">
                    <label htmlFor={`${player.id}-risk`}>{t('riskPreference')}</label>
                    <p className="field-helper">{t('riskPreferenceHelp')}</p>
                    <RiskSlider
                      id={`${player.id}-risk`}
                      value={player.risk_preference}
                      onChange={(v) => update(`players.${idx}.risk_preference`, v)}
                      t={t} />
                  </div>

                  {/* Preferred cost share */}
                  <div className="field">
                    <label htmlFor={`${player.id}-cs`}>{t('preferredCostShare')}</label>
                    <p className="field-helper">{t('preferredCostShareHelp')}</p>
                    <div className="cost-share-row">
                      <input id={`${player.id}-cs`} type="number" min="0" max="1" step="0.05"
                        value={player.preferred_cost_share}
                        onChange={(e) => update(`players.${idx}.preferred_cost_share`, num(e.target.value))}
                        aria-describedby="cs-sum-status" />
                      <span className="cost-share-pct" aria-hidden="true">
                        ({Math.round(player.preferred_cost_share * 100)}%)
                      </span>
                    </div>
                  </div>
                </fieldset>
              ))}
            </div>

            {/* Cost share live total */}
            <p id="cs-sum-status"
              className={costShareError ? 'validation-msg error-msg' : 'validation-msg ok-msg'}
              role={costShareError ? 'alert' : 'status'} aria-live="polite">
              {t('reviewCostShares')}: {Math.round(csSum * 100)}% —{' '}
              {costShareError ? t('costShareInvalid') : t('costShareValid')}
            </p>

            {/* Hurwicz alpha */}
            <fieldset className="sub-card" style={{ marginTop: '1rem' }}>
              <legend>{t('hurwiczLabel')}</legend>
              <p className="field-helper">{t('hurwiczHelp')}</p>
              <HurwiczSlider
                value={scenario.uncertainty_fixture.hurwicz_alpha}
                onChange={(v) => update('uncertainty_fixture.hurwicz_alpha', v)}
                t={t} />
            </fieldset>

            {/* Outage probabilities */}
            <fieldset className="sub-card" style={{ marginTop: '1rem' }}>
              <legend>{t('possibleOutageConditions')}</legend>
              <p className="section-subtitle muted">{t('outageConditionsSubtitle')}</p>
              <p className="field-helper">{t('probabilityExplanation')}</p>
              <div className="nature-table">
                <table>
                  <caption className="sr-only">{t('gamesAgainstNature')}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t('state')}</th>
                      <th scope="col">{t('duration')}</th>
                      <th scope="col">{t('probability')} (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenario.uncertainty_fixture.nature_states.map((state, i) => {
                      const labelKey = (stateLabels[state.id] ?? 'state') as TranslationKey;
                      const displayPct = Math.round(state.probability * 100);
                      return (
                        <tr key={state.id}>
                          <th scope="row">{t(labelKey)}</th>
                          <td>{state.duration_hours} h</td>
                          <td>
                            <div className="prob-input-wrap">
                              <input
                                aria-label={`${t(labelKey)} ${t('probability')}`}
                                type="number" min="0" max="100" step="1"
                                value={displayPct}
                                onChange={(e) =>
                                  update(
                                    `uncertainty_fixture.nature_states.${i}.probability`,
                                    Math.max(0, Math.min(100, Math.round(Number(e.target.value)))) / 100,
                                  )
                                }
                                aria-describedby="prob-sum-status" />
                              <span className="pct-suffix" aria-hidden="true">%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p id="prob-sum-status"
                className={probError ? 'validation-msg error-msg' : 'validation-msg ok-msg'}
                role={probError ? 'alert' : 'status'} aria-live="polite">
                {t('reviewProbTotal')}: {Math.round(probSum * 100)}% —{' '}
                {probError ? t('probInvalid') : t('probValid')}
              </p>
            </fieldset>
          </div>
        )}
      </details>

      {/* 5 — How info is used */}
      <HowInfoIsUsed t={t} />

      {/* 6 — API error */}
      {error && (
        <div id="form-api-error" className="error" role="alert">
          <strong>{error.kind === 'validation' ? t('inputRejected') : t('analysisFailed')}:</strong>{' '}
          {error.message}
          {error.field && <span> [{error.field}]{error.correction ? ` — ${error.correction}` : ''}</span>}
        </div>
      )}

      {/* 7 — Review summary */}
      <ReviewSummary t={t} scenario={scenario}
        costShareError={costShareError} probError={probError}
        p1EssErr={p1EssErr} p2EssErr={p2EssErr} hasErrors={hasErrors} />

      {/* 8 — Actions */}
      <div className="guided-actions">
        <div className="primary-action-wrap">
          <button id="btn-find-sharing" className="primary" type="submit" disabled={busy || hasErrors}>
            {busy ? t('running') : error ? t('retryAnalysis') : t('findSharingRecommendation')}
          </button>
          <p className="action-help muted">{t('findSharingHelp')}</p>
        </div>
        <button id="btn-reset" className="secondary" type="button"
          onClick={() => onChange(demoScenario)}>
          {t('resetToExample')}
        </button>
        <button id="btn-toggle-advanced" className="secondary" type="button"
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen((o) => !o)}>
          {advancedOpen ? '▲ ' : '▼ '}{t('advancedModelSettings')}
        </button>
      </div>
    </form>
  );
}
