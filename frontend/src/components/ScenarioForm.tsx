import { FormEvent } from 'react';
import type { ClientError } from '../api/client';
import type { Scenario } from '../types';

interface Props { scenario: Scenario; busy: boolean; error: ClientError | null; onChange: (next: Scenario) => void; onSubmit: () => void; }
const num = (value: string) => Number(value);

export function ScenarioForm({ scenario, busy, error, onChange, onSubmit }: Props) {
  const update = (path: string, value: string | number) => {
    const next = structuredClone(scenario) as Scenario;
    const keys = path.split('.'); let target = next as unknown as Record<string, unknown>;
    keys.slice(0, -1).forEach((key) => { target = target[key] as Record<string, unknown>; }); target[keys[keys.length - 1]] = value;
    onChange(next);
  };
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit(); };
  return <form className="scenario-form" onSubmit={submit} aria-describedby={error ? 'form-error' : undefined}>
    <section className="card"><h2>Scenario input</h2><p className="muted">Exactly two players; the backend remains authoritative.</p>
      <div className="field-grid"><Field label="Scenario name" value={scenario.name} onChange={(v) => update('name', v)} />
        <Field label="Resource type" value={scenario.resource.resource_type} onChange={(v) => update('resource.resource_type', v)} />
        <Field label="Capacity (kWh)" type="number" value={scenario.resource.capacity_kwh} onChange={(v) => update('resource.capacity_kwh', num(v))} />
        <Field label="Available hours" type="number" value={scenario.resource.available_hours} onChange={(v) => update('resource.available_hours', num(v))} />
        <Field label="Total cost (MMK)" type="number" value={scenario.resource.total_cost_mmk} onChange={(v) => update('resource.total_cost_mmk', num(v))} />
        <Field label="Max safe load (kW)" type="number" value={scenario.resource.max_safe_load_kw} onChange={(v) => update('resource.max_safe_load_kw', num(v))} />
        <Field label="Slot duration (hours)" type="number" value={scenario.resource.slot_duration_hours} onChange={(v) => update('resource.slot_duration_hours', num(v))} />
        <Field label="Overload penalty" type="number" value={scenario.resource.overload_penalty} onChange={(v) => update('resource.overload_penalty', num(v))} />
        <Field label="Violation penalty" type="number" value={scenario.resource.violation_penalty} onChange={(v) => update('resource.violation_penalty', num(v))} />
      </div></section>
    <div className="player-grid">{scenario.players.map((player, index) => <section className="card" key={player.id}><h2>{player.id}: {player.name}</h2><div className="field-grid">
      <Field label="Name" value={player.name} onChange={(v) => update(`players.${index}.name`, v)} /><Field label="Business type" value={player.business_type} onChange={(v) => update(`players.${index}.business_type`, v)} />
      <Field label="Demand (kWh)" type="number" value={player.demand_kwh} onChange={(v) => update(`players.${index}.demand_kwh`, num(v))} /><Field label="Essential (kWh)" type="number" value={player.essential_kwh} onChange={(v) => update(`players.${index}.essential_kwh`, num(v))} />
      <Field label="Desired hours" type="number" value={player.desired_hours} onChange={(v) => update(`players.${index}.desired_hours`, num(v))} /><Field label="Outage loss (MMK)" type="number" value={player.outage_loss_mmk} onChange={(v) => update(`players.${index}.outage_loss_mmk`, num(v))} />
      <Field label="Urgency (1–5)" type="number" value={player.urgency} onChange={(v) => update(`players.${index}.urgency`, num(v))} /><Field label="Risk preference (0–1)" type="number" step="0.1" value={player.risk_preference} onChange={(v) => update(`players.${index}.risk_preference`, num(v))} />
      <Field label="Preferred cost share" type="number" step="0.1" value={player.preferred_cost_share} onChange={(v) => update(`players.${index}.preferred_cost_share`, num(v))} />
    </div></section>)}</div>
    <section className="card"><h2>Games Against Nature</h2><p className="muted">Nature states and utilities are sent unchanged to the API.</p><div className="field-grid"><Field label="Hurwicz alpha" type="number" step="0.1" value={scenario.uncertainty_fixture.hurwicz_alpha} onChange={(v) => update('uncertainty_fixture.hurwicz_alpha', num(v))} /></div>
      <div className="nature-table"><table><caption className="sr-only">Nature-state probabilities</caption><thead><tr><th>State</th><th>Duration</th><th>Probability</th></tr></thead><tbody>{scenario.uncertainty_fixture.nature_states.map((state, index) => <tr key={state.id}><th>{state.id}</th><td>{state.duration_hours} h</td><td><input aria-label={`${state.id} probability`} type="number" step="0.1" value={state.probability} onChange={(e) => update(`uncertainty_fixture.nature_states.${index}.probability`, num(e.target.value))} /></td></tr>)}</tbody></table></div>
    </section>
    {error && <div id="form-error" className="error" role="alert"><strong>{error.kind === 'validation' ? 'Input rejected' : 'Analysis failed'}:</strong> {error.message}{error.field && <span> Field: {error.field}. {error.correction}</span>}</div>}
    <button className="primary" type="submit" disabled={busy}>{busy ? 'Running…' : 'Run full analysis'}</button>
  </form>;
}

function Field({ label, value, onChange, type = 'text', step }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; step?: string }) {
  return <label className="field"><span>{label}</span><input required type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}
