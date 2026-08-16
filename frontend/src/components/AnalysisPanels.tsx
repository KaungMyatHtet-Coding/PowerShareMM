import { useI18n } from '../i18n/I18nContext';
import type { FullAnalysisData, PayoffCell, Scenario, WorkspaceTab } from '../types';
const utility = (value: number) => Number(value).toFixed(2);
export function AnalysisPanels({
  data,
  tab,
  onSelectTab,
  scenario,
}: {
  data: FullAnalysisData;
  tab: string;
  onSelectTab?: (tab: WorkspaceTab) => void;
  scenario?: Scenario;
}) {
  if (tab === 'analysis') return <Analysis data={data} onSelectTab={onSelectTab} scenario={scenario} />;
  if (tab === 'uncertainty') return <Uncertainty data={data} />;
  if (tab === 'arbitration') return <Arbitration data={data} />;
  if (tab === 'simulation') return <Simulation data={data} />;
  return <Results data={data} />;
}
function Analysis({
  data,
  onSelectTab,
  scenario,
}: {
  data: FullAnalysisData;
  onSelectTab?: (tab: WorkspaceTab) => void;
  scenario?: Scenario;
}) {
  const { t, language } = useI18n();
  // 1. Authoritative Player Resolution by ID
  const rowPlayerId = data.payoff_matrix.row_player;
  const colPlayerId = data.payoff_matrix.column_player;
  const rowPlayerObj = scenario?.players.find((p) => p.id === rowPlayerId);
  const colPlayerObj = scenario?.players.find((p) => p.id === colPlayerId);
  const defaultRowRole = t('rowPlayerFallback');
  const defaultColRole = t('colPlayerFallback');
  const rowFallback = rowPlayerId ? `${rowPlayerId} — ${defaultRowRole}` : defaultRowRole;
  const colFallback = colPlayerId ? `${colPlayerId} — ${defaultColRole}` : defaultColRole;
  const rowPlayerName = rowPlayerObj?.name && rowPlayerObj.name.trim() !== ''
    ? rowPlayerObj.name
    : rowFallback;
  const colPlayerName = colPlayerObj?.name && colPlayerObj.name.trim() !== ''
    ? colPlayerObj.name
    : colFallback;
  // Sets for Nash & Pareto
  const nashSet = new Set((data.pure_nash_equilibria || []).map((item) => item.outcome_id));
  const paretoSet = new Set((data.pareto_optimal_outcomes || []).map((item) => item.outcome_id));
  // Map cells by outcome_id
  const cellMap = new Map<string, PayoffCell>();
  (data.payoff_matrix.cells || []).forEach((cell) => {
    if (cell.outcome_id) {
      cellMap.set(cell.outcome_id, cell);
    }
  });
  const outcomesConfig = [
    { id: 'CC', titleKey: 'outcomeCC' as const, descKey: 'outcomeCCDesc' as const, rowAct: 'COOPERATE', colAct: 'COOPERATE' },
    { id: 'CM', titleKey: 'outcomeCM' as const, descKey: 'outcomeCMDesc' as const, rowAct: 'COOPERATE', colAct: 'CLAIM_MORE' },
    { id: 'MC', titleKey: 'outcomeMC' as const, descKey: 'outcomeMCDesc' as const, rowAct: 'CLAIM_MORE', colAct: 'COOPERATE' },
    { id: 'MM', titleKey: 'outcomeMM' as const, descKey: 'outcomeMMDesc' as const, rowAct: 'CLAIM_MORE', colAct: 'CLAIM_MORE' },
  ];
  return (
    <div className="stack guided-analysis">
      {/* SECTION 1 — Quick Overview & Player Identification */}
      <section className="card intro-card">
        <h2>{t('analysisIntroTitle')}</h2>
        <p className="muted" style={{ lineHeight: '1.6' }}>{t('analysisIntroText')}</p>
        <div className="player-identity-grid">
          <div className="player-box">
            <span className="player-badge row-badge">{t('rowPlayerLabel')}</span>
            <h3>{rowPlayerName}</h3>
            <p className="muted" style={{ fontSize: '0.85rem' }}>ID: <code>{rowPlayerId}</code></p>
          </div>
          <div className="player-box">
            <span className="player-badge col-badge">{t('colPlayerLabel')}</span>
            <h3>{colPlayerName}</h3>
            <p className="muted" style={{ fontSize: '0.85rem' }}>ID: <code>{colPlayerId}</code></p>
          </div>
        </div>
        <div className="action-legend-grid">
          <div>
            <strong>COOPERATE:</strong> <span className="muted">{t('actionCooperateHelp')}</span>
          </div>
          <div>
            <strong>CLAIM_MORE:</strong> <span className="muted">{t('actionClaimMoreHelp')}</span>
          </div>
        </div>
      </section>
      {/* SECTION 2 — Four Outcome Cards */}
      <section className="card">
        <h2>{t('outcomeCardsTitle')}</h2>
        <div className="outcome-cards-grid">
          {outcomesConfig.map(({ id, titleKey, descKey, rowAct, colAct }) => {
            const cell = cellMap.get(id);
            const isNash = nashSet.has(id);
            const isPareto = paretoSet.has(id);
            if (!cell) {
              return (
                <div key={id} className="card outcome-card missing-card">
                  <h3>{t(titleKey)}</h3>
                  <p className="error">{t('outcomeUnavailable')}</p>
                </div>
              );
            }
            const rowScore = utility(cell.utilities[0]);
            const colScore = utility(cell.utilities[1]);
            return (
              <div key={id} className={`card outcome-card${isNash ? ' is-nash' : ''}${isPareto ? ' is-pareto' : ''}`}>
                <div className="outcome-card-header">
                  <h3>{t(titleKey)}</h3>
                  <div className="badge-row">
                    {isNash && <span className="badge nash">{t('nash')}</span>}
                    {isPareto && <span className="badge pareto">{t('pareto')}</span>}
                  </div>
                </div>
                <div className="outcome-actions">
                  <span>{rowPlayerName}: <strong>{rowAct}</strong></span>
                  <span>{colPlayerName}: <strong>{colAct}</strong></span>
                </div>
                <div className="outcome-utilities">
                  <div className="util-score">
                    <span className="score-label">{rowPlayerName}</span>
                    <span className="score-val">{rowScore}</span>
                  </div>
                  <div className="util-score">
                    <span className="score-label">{colPlayerName}</span>
                    <span className="score-val">{colScore}</span>
                  </div>
                </div>
                <p className="outcome-desc">{t(descKey)}</p>
              </div>
            );
          })}
        </div>
      </section>
      {/* SECTION 3 — Key Strategic Conclusions & Arbitration Transition */}
      <section className="card conclusion-card">
        <h2>{t('strategicConclusionsTitle')}</h2>
        <div className="conclusions-grid">
          <div className="conclusion-box">
            <h3>{t('stableOutcomesTitle')}</h3>
            <p className="badge-wrapper">
              {Array.from(nashSet).length > 0
                ? Array.from(nashSet).map((outcomeId) => (
                    <span key={outcomeId} className="badge nash big-badge">{outcomeId}</span>
                  ))
                : <span className="muted">{t('none')}</span>}
            </p>
          </div>
          <div className="conclusion-box">
            <h3>{t('paretoOutcomesTitle')}</h3>
            <p className="badge-wrapper">
              {Array.from(paretoSet).length > 0
                ? Array.from(paretoSet).map((outcomeId) => (
                    <span key={outcomeId} className="badge pareto big-badge">{outcomeId}</span>
                  ))
                : <span className="muted">{t('none')}</span>}
            </p>
          </div>
        </div>
        {/* Prisoner's Dilemma Status */}
        <div className="pd-status-box">
          <h3>{t('glossaryPDTitle')}</h3>
          <p className="explanation">
            {language === 'my'
              ? (data.prisoners_dilemma.detected ? t('pdMyStatus') : t('pdNotDetectedMy'))
              : (data.prisoners_dilemma.explanation || (data.prisoners_dilemma.detected ? t('pdDetected') : t('pdNotDetected')))}
          </p>
        </div>
        {/* Utility Score Clarification */}
        <div className="utility-clarification">
          <h4>{t('utilityExplanationTitle')}</h4>
          <p>{t('utilityExplanationText')}</p>
        </div>
        {/* Transition to Arbitration CTA */}
        <div className="arbitration-cta-box">
          <p>{t('arbitrationTransitionText')}</p>
          {onSelectTab && (
            <button
              type="button"
              className="primary cta-btn"
              onClick={() => onSelectTab('arbitration')}
            >
              {t('goToArbitration')}
            </button>
          )}
        </div>
      </section>
      {/* SECTION 4 — Academic 2x2 Payoff Matrix */}
      <section className="card academic-matrix-card">
        <h2>{t('payoffMatrix')}</h2>
        <p className="muted">
          {t('rows')}: <strong>{rowPlayerName}</strong> ({rowPlayerId}). {t('columns')}: <strong>{colPlayerName}</strong> ({colPlayerId}). {t('utilitiesBackend')}
        </p>
        <div className="matrix-wrap">
          <table className="matrix">
            <caption>{t('matrixCaption')}</caption>
            <thead>
              <tr>
                <th></th>
                {data.payoff_matrix.column_strategies.map((strategy) => (
                  <th key={strategy}>
                    <div>{colPlayerName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{strategy}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.payoff_matrix.row_strategies.map((rowStrat) => (
                <tr key={rowStrat}>
                  <th>
                    <div>{rowPlayerName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rowStrat}</div>
                  </th>
                  {data.payoff_matrix.cells
                    .filter((cell) => cell.row_strategy === rowStrat)
                    .map((cell) => (
                      <MatrixCell
                        key={cell.outcome_id || `${cell.row_strategy}-${cell.column_strategy}`}
                        cell={cell}
                        rowPlayerName={rowPlayerName}
                        colPlayerName={colPlayerName}
                        isNash={nashSet.has(cell.outcome_id)}
                        isPareto={paretoSet.has(cell.outcome_id)}
                      />
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {/* SECTION 5 — Collapsible Game Theory Glossary */}
      <details className="card glossary-details">
        <summary className="glossary-summary">
          <h3>{t('glossaryTitle')}</h3>
        </summary>
        <div className="glossary-body">
          <dl className="glossary-list">
            <div>
              <dt>{t('glossaryUtilityTitle')}</dt>
              <dd>{t('glossaryUtilityDesc')}</dd>
            </div>
            <div>
              <dt>{t('glossaryNashTitle')}</dt>
              <dd>{t('glossaryNashDesc')}</dd>
            </div>
            <div>
              <dt>{t('glossaryParetoTitle')}</dt>
              <dd>{t('glossaryParetoDesc')}</dd>
            </div>
            <div>
              <dt>{t('glossaryDominanceTitle')}</dt>
              <dd>
                {t('glossaryDominanceDesc')}
                {data.dominated_strategies && data.dominated_strategies.length > 0 && (
                  <ul className="dominated-list">
                    {data.dominated_strategies.map((item, idx) => (
                      <li key={idx}>
                        <code>{item.player_id}</code>: <strong>{item.strategy}</strong> is {item.kind.toLowerCase()} {t('dominatedBy')} <strong>{item.dominated_by}</strong>.
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
            <div>
              <dt>{t('glossaryPDTitle')}</dt>
              <dd>{t('glossaryPDDesc')}</dd>
            </div>
          </dl>
        </div>
      </details>
    </div>
  );
}
function MatrixCell({
  cell,
  rowPlayerName,
  colPlayerName,
  isNash,
  isPareto,
}: {
  cell: PayoffCell;
  rowPlayerName: string;
  colPlayerName: string;
  isNash: boolean;
  isPareto: boolean;
}) {
  const { t } = useI18n();
  const u0 = utility(cell.utilities[0]);
  const u1 = utility(cell.utilities[1]);
  return (
    <td className={`${isNash ? 'nash-cell' : ''} ${isPareto ? 'pareto-cell' : ''}`}>
      <div className="cell-outcome-id">{cell.outcome_id}</div>
      <div className="cell-scores">
        <span className="row-score">{rowPlayerName}: <strong>{u0}</strong></span>
        <span className="col-score">{colPlayerName}: <strong>{u1}</strong></span>
      </div>
      <div className="cell-badges">
        {isNash && <span className="cell-label nash">{t('nash')}</span>}
        {isPareto && <span className="cell-label pareto">{t('pareto')}</span>}
      </div>
    </td>
  );
}
function Uncertainty({ data }: { data: FullAnalysisData }) { const { t } = useI18n(); return <div className="stack"><h2>{t('gamesAgainstNature')}</h2><p className="muted">{t('allSixCriteria')}</p><div className="method-grid">{data.uncertainty_analysis.methods.map((method) => <article className="card" key={method.id}><h3>{method.id}</h3><p className="recommend">{t('recommended')}: {method.recommended.join(', ')}</p><p>{method.explanation}</p><dl>{Object.entries(method.scores).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{utility(value)}</dd></div>)}</dl></article>)}</div><h3>{t('regretMatrix')}</h3><pre className="data-table">{JSON.stringify(data.uncertainty_analysis.regret_matrix, null, 2)}</pre></div>; }
function Arbitration({ data }: { data: FullAnalysisData }) { const { t } = useI18n(); const result = data.arbitration_result; const selected = result.selected; return <div className="stack"><h2>{t('nashArbitration')}</h2><p className="muted">{t('arbitrationDescription')}</p><div className="allocation-grid"><div className="card"><h3>{t('disagreement')}</h3><p>[{result.disagreement.join(', ')}]</p><p>{t('qualifyingCandidates')}: {result.qualifying_candidates_count.toLocaleString()}</p></div>{selected ? <div className="card success"><h3>{t('selectedAllocation')}</h3><p>{t('energy')}: {selected.allocation.energy_kwh.join(', ')} kWh</p><p>{t('hours')}: {selected.allocation.hours.join(', ')}</p><p>{t('costShares')}: {selected.cost_shares.map((share) => `${(share * 100).toFixed(0)}%`).join(' / ')}</p><p>{t('utilities')}: {selected.utilities.map(utility).join(' / ')}</p><p>{t('nashProduct')}: {selected.nash_product.toFixed(4)}</p><p>{result.ties.length ? `${t('ties')}: ${result.ties.join(', ')}` : t('uniqueMaximum')}</p></div> : <div className="card error"><h3>{t('noQualifyingAgreement')}</h3></div>}</div><ul>{result.explanations.map((text) => <li key={text}>{text}</li>)}</ul></div>; }
function Simulation({ data }: { data: FullAnalysisData }) { const { t } = useI18n(); return <div className="stack"><h2>{t('repeatedGameTitle')}</h2>{data.repeated_game_result ? <pre className="data-table">{JSON.stringify(data.repeated_game_result, null, 2)}</pre> : <div className="card"><p>{t('noRepeatedGame')}</p><p>{t('supportedStrategies')}: ALWAYS_COOPERATE, ALWAYS_CLAIM_MORE, TIT_FOR_TAT, FORGIVING_TIT_FOR_TAT, RANDOM.</p></div>}</div>; }
function Results({ data }: { data: FullAnalysisData }) { const { t } = useI18n(); return <div className="stack"><h2>{t('recommendationTheory')}</h2><div className="card success"><h3>{t('cooperativeRecommendation')}</h3><p>{data.final_recommendation.explanation}</p><p>{t('outcomeId')}: {data.final_recommendation.outcome_id ?? t('arbitrationNotMm')}</p></div><h3>{t('explanations')}</h3><ul>{data.explanations.map((item) => <li key={item}>{item}</li>)}</ul><h3>{t('assumptionsScope')}</h3><ul><li>{t('exactlyTwoScope')}</li><li>{t('chapter17Excluded')}</li><li>{t('penaltiesScope')}</li><li>{t('decisionSupportScope')}</li><li>{t('stableBetterScope')}</li></ul>{data.warnings?.length ? <><h3>{t('warnings')}</h3><ul>{data.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></> : null}</div>; }
