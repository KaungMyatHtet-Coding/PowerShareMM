import { FormEvent } from 'react';
import type { ClientError } from '../api/client';
import { useI18n } from '../i18n/I18nContext';
import type { Scenario } from '../types';

interface Props { scenario: Scenario; busy: boolean; error: ClientError | null; onChange: (next: Scenario) => void; onSubmit: () => void; }
const num = (value: string) => Number(value);

export function ScenarioForm({ scenario, busy, error, onChange, onSubmit }: Props) {
  const { t } = useI18n();
  const update = (path: string, value: string | number) => { const next = structuredClone(scenario) as Scenario; const keys = path.split('.'); let target = next as unknown as Record<string, unknown>; keys.slice(0, -1).forEach((key) => { target = target[key] as Record<string, unknown>; }); target[keys[keys.length - 1]] = value; onChange(next); };
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit(); };
  return <form className="scenario-form" onSubmit={submit} aria-describedby={error ? 'form-error' : undefined}>
    <section className="card"><h2>{t('scenarioInput')}</h2><p className="muted">{t('exactlyTwoPlayers')}</p><div className="field-grid">
      <Field label={t('name')} value={scenario.name} onChange={(v) => update('name', v)} /><Field label={t('resourceType')} value={scenario.resource.resource_type} onChange={(v) => update('resource.resource_type', v)} />
      <Field label={t('capacity')} type="number" value={scenario.resource.capacity_kwh} onChange={(v) => update('resource.capacity_kwh', num(v))} /><Field label={t('availableHours')} type="number" value={scenario.resource.available_hours} onChange={(v) => update('resource.available_hours', num(v))} />
      <Field label={t('totalCost')} type="number" value={scenario.resource.total_cost_mmk} onChange={(v) => update('resource.total_cost_mmk', num(v))} /><Field label={t('maxSafeLoad')} type="number" value={scenario.resource.max_safe_load_kw} onChange={(v) => update('resource.max_safe_load_kw', num(v))} />
      <Field label={t('slotDuration')} type="number" value={scenario.resource.slot_duration_hours} onChange={(v) => update('resource.slot_duration_hours', num(v))} /><Field label={t('overloadPenalty')} type="number" value={scenario.resource.overload_penalty} onChange={(v) => update('resource.overload_penalty', num(v))} />
      <Field label={t('violationPenalty')} type="number" value={scenario.resource.violation_penalty} onChange={(v) => update('resource.violation_penalty', num(v))} />
    </div></section>
    <div className="player-grid">{scenario.players.map((player, index) => <section className="card" key={player.id}><h2>{player.id}: {player.name}</h2><div className="field-grid">
      <Field label={t('name')} value={player.name} onChange={(v) => update(`players.${index}.name`, v)} /><Field label={t('businessType')} value={player.business_type} onChange={(v) => update(`players.${index}.business_type`, v)} />
      <Field label={t('demand')} type="number" value={player.demand_kwh} onChange={(v) => update(`players.${index}.demand_kwh`, num(v))} /><Field label={t('essential')} type="number" value={player.essential_kwh} onChange={(v) => update(`players.${index}.essential_kwh`, num(v))} />
      <Field label={t('desiredHours')} type="number" value={player.desired_hours} onChange={(v) => update(`players.${index}.desired_hours`, num(v))} /><Field label={t('outageLoss')} type="number" value={player.outage_loss_mmk} onChange={(v) => update(`players.${index}.outage_loss_mmk`, num(v))} />
      <Field label={t('urgency')} type="number" value={player.urgency} onChange={(v) => update(`players.${index}.urgency`, num(v))} /><Field label={t('riskPreference')} type="number" step="0.1" value={player.risk_preference} onChange={(v) => update(`players.${index}.risk_preference`, num(v))} /><Field label={t('preferredCostShare')} type="number" step="0.1" value={player.preferred_cost_share} onChange={(v) => update(`players.${index}.preferred_cost_share`, num(v))} />
    </div></section>)}</div>
    <section className="card"><h2>{t('gamesAgainstNature')}</h2><p className="muted">{t('natureDescription')}</p><div className="field-grid"><Field label={t('hurwiczAlpha')} type="number" step="0.1" value={scenario.uncertainty_fixture.hurwicz_alpha} onChange={(v) => update('uncertainty_fixture.hurwicz_alpha', num(v))} /></div>
      <div className="nature-table"><table><caption className="sr-only">{t('probability')}</caption><thead><tr><th>{t('state')}</th><th>{t('duration')}</th><th>{t('probability')}</th></tr></thead><tbody>{scenario.uncertainty_fixture.nature_states.map((state, index) => <tr key={state.id}><th>{state.id}</th><td>{state.duration_hours} h</td><td><input aria-label={`${state.id} ${t('probability')}`} type="number" step="0.1" value={state.probability} onChange={(e) => update(`uncertainty_fixture.nature_states.${index}.probability`, num(e.target.value))} /></td></tr>)}</tbody></table></div>
    </section>
    {error && <div id="form-error" className="error" role="alert"><strong>{error.kind === 'validation' ? t('inputRejected') : t('analysisFailed')}:</strong> {error.message}{error.field && <span> {error.field}. {error.correction}</span>}</div>}
    <div className="actions"><button className="primary" type="submit" disabled={busy}>{busy ? t('running') : error ? t('retryAnalysis') : t('runFullAnalysis')}</button>{error && <button className="secondary" type="button" onClick={onSubmit} disabled={busy}>{t('retry')}</button>}</div>
  </form>;
}

function Field({ label, value, onChange, type = 'text', step }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; step?: string }) { return <label className="field"><span>{label}</span><input required type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
