interface HistoryRecord {
  round?: number;
  round_number?: number;
  actions?: string[];
  player_1_action?: string;
  player_2_action?: string;
  p1_action?: string;
  p2_action?: string;
  payoffs?: number[];
  player_1_payoff?: number;
  player_2_payoff?: number;
  p1_payoff?: number;
  p2_payoff?: number;
  cumulative_payoffs?: number[];
  p1_cumulative?: number;
  p2_cumulative?: number;
}
import { useState } from 'react';
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
  if (tab === 'uncertainty') return <Uncertainty data={data} onSelectTab={onSelectTab} scenario={scenario} />;
  if (tab === 'arbitration') return <Arbitration data={data} scenario={scenario} onSelectTab={onSelectTab} />;
  if (tab === 'simulation') return <Simulation data={data} scenario={scenario} onSelectTab={onSelectTab} />;
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
function Uncertainty({
  data,
  onSelectTab,
  scenario,
}: {
  data: FullAnalysisData;
  onSelectTab?: (tab: WorkspaceTab) => void;
  scenario?: Scenario;
}) {
  const { t, language } = useI18n();

  // Helper for friendly alternative titles
  const getAltTitle = (key: string) => {
    if (key === 'BATTERY_ONLY') return t('batteryTitle');
    if (key === 'GENERATOR_ONLY') return t('generatorTitle');
    if (key === 'HYBRID') return t('hybridTitle');
    return key;
  };

  // Helper for method details config
  const getMethodMeta = (methodId: string) => {
    switch (methodId) {
      case 'EXPECTED_VALUE':
        return {
          title: t('evTitle'),
          question: t('evQuestion'),
          when: t('evWhen'),
          direction: t('higherIsBetter'),
          isLowerBetter: false,
          attitude: t('attEV'),
          probUsed: t('probYes'),
        };
      case 'WALD_MAXIMIN':
        return {
          title: t('waldTitle'),
          question: t('waldQuestion'),
          when: t('waldWhen'),
          direction: t('higherIsBetter'),
          isLowerBetter: false,
          attitude: t('attWald'),
          probUsed: t('probNo'),
        };
      case 'MAXIMAX':
        return {
          title: t('maximaxTitle'),
          question: t('maximaxQuestion'),
          when: t('maximaxWhen'),
          direction: t('higherIsBetter'),
          isLowerBetter: false,
          attitude: t('attMaximax'),
          probUsed: t('probNo'),
        };
      case 'LAPLACE':
        return {
          title: t('laplaceTitle'),
          question: t('laplaceQuestion'),
          when: t('laplaceWhen'),
          direction: t('higherIsBetter'),
          isLowerBetter: false,
          attitude: t('attLaplace'),
          probUsed: t('probEqual'),
        };
      case 'MINIMAX_REGRET':
        return {
          title: t('minimaxTitle'),
          question: t('minimaxQuestion'),
          when: t('minimaxWhen'),
          direction: t('lowerIsBetter'),
          isLowerBetter: true,
          attitude: t('attMinimax'),
          probUsed: t('probNo'),
        };
      case 'HURWICZ':
        return {
          title: t('hurwiczTitle'),
          question: t('hurwiczQuestion'),
          when: t('hurwiczWhen'),
          direction: t('higherIsBetter'),
          isLowerBetter: false,
          attitude: t('attHurwicz'),
          probUsed: t('probNo'),
        };
      default:
        return {
          title: methodId,
          question: '',
          when: '',
          direction: t('higherIsBetter'),
          isLowerBetter: false,
          attitude: methodId,
          probUsed: t('probNo'),
        };
    }
  };

  // Section 2: Outage assumptions data
  const natureStates = scenario?.uncertainty_fixture?.nature_states || [
    { id: 'SHORT', duration_hours: 2, probability: 0.3 },
    { id: 'MEDIUM', duration_hours: 5, probability: 0.5 },
    { id: 'LONG', duration_hours: 8, probability: 0.2 },
  ];

  // Section 4: Aggregate recommendations (Refined semantics)
  const methods = data.uncertainty_analysis.methods || [];
  const totalMethods = methods.length;

  const supportCounts = new Map<string, number>();
  let validMethods = 0;

  methods.forEach((m) => {
    // Deduplicate recommendations inside each method
    const dedupedRecs = Array.from(new Set(m.recommended || []));
    if (dedupedRecs.length > 0) {
      validMethods += 1;
      dedupedRecs.forEach((rec) => {
        supportCounts.set(rec, (supportCounts.get(rec) || 0) + 1);
      });
    }
  });

  const missingRecMethods = totalMethods - validMethods;

  // Consensus state evaluation
  const entries = Array.from(supportCounts.entries());
  const maxSupport = entries.length > 0 ? Math.max(...entries.map(([, count]) => count)) : 0;
  const topSupportedAlts = entries.filter(([, count]) => count === maxSupport).map(([alt]) => alt);

  const isUniqueConsensus = validMethods > 0 && maxSupport === validMethods && topSupportedAlts.length === 1;
  const isJointConsensus = validMethods > 0 && maxSupport === validMethods && topSupportedAlts.length > 1;

  // Section 7: Regret matrix processing (Backend Authoritative)
  const regretData = data.uncertainty_analysis.regret_matrix || {};
  const altKeys = Object.keys(regretData);
  const stateKeys = Array.from(new Set(Object.values(regretData).flatMap((row) => Object.keys(row || {}))));

  // Minimax Regret method score for each alternative (supplied directly by backend)
  const minimaxMethod = methods.find((m) => m.id === 'MINIMAX_REGRET');
  const minimaxScores = minimaxMethod?.scores || {};

  // Hurwicz alpha calculation display
  const alphaVal = data.uncertainty_analysis.hurwicz_alpha ?? scenario?.uncertainty_fixture?.hurwicz_alpha ?? 0.6;
  const bestWeight = Math.round(alphaVal * 100);
  const worstWeight = Math.round((1 - alphaVal) * 100);

  return (
    <div className="stack guided-uncertainty">
      {/* SECTION 1 — Understanding Uncertainty */}
      <section className="card intro-card">
        <h2>{t('uncertTitle')}</h2>
        <p className="subtitle">{t('uncertSubtitle')}</p>
        <p className="muted" style={{ lineHeight: '1.6' }}>
          {t('uncertIntroText')}
        </p>
        <div className="note-box info-note">
          <strong>{language === 'my' ? 'မှတ်ချက်' : 'Note'}:</strong> {t('uncertNoteText')}
        </div>
      </section>

      {/* SECTION 2 — Current Outage Assumptions */}
      <section className="card">
        <h2>{t('assumptionsTitle')}</h2>
        <p className="muted">{t('assumptionsHelp')}</p>
        <div className="outage-states-grid">
          {natureStates.map((st) => (
            <div key={st.id} className="state-card">
              <span className="state-badge">{st.id}</span>
              <div className="state-detail">
                <span>{t('durationLabel')}: <strong>{st.duration_hours} hrs</strong></span>
                <span>{t('probLabel')}: <strong>{Math.round(st.probability * 100)}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — Three Available Power Strategies */}
      <section className="card">
        <h2>{t('alternativesTitle')}</h2>
        <div className="alternatives-grid">
          <div className="card alt-card">
            <div className="alt-header">
              <h3>{t('batteryTitle')}</h3>
              <code>BATTERY_ONLY</code>
            </div>
            <p className="muted">{t('batteryDesc')}</p>
          </div>
          <div className="card alt-card">
            <div className="alt-header">
              <h3>{t('generatorTitle')}</h3>
              <code>GENERATOR_ONLY</code>
            </div>
            <p className="muted">{t('generatorDesc')}</p>
          </div>
          <div className="card alt-card">
            <div className="alt-header">
              <h3>{t('hybridTitle')}</h3>
              <code>HYBRID</code>
            </div>
            <p className="muted">{t('hybridDesc')}</p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Overall Recommendation Summary */}
      <section className="card consensus-card">
        <h2>{t('consensusTitle')}</h2>

        {validMethods === 0 ? (
          <div className="consensus-banner warning">
            <h3>{t('noMethodRecAvailable')}</h3>
          </div>
        ) : isUniqueConsensus ? (
          <div className="consensus-banner success">
            <h3>
              {t('consensusAllAgree')
                .replace('{count}', String(validMethods))
                .replace('{total}', String(validMethods))
                .replace('{alt}', getAltTitle(topSupportedAlts[0]))}
            </h3>
          </div>
        ) : isJointConsensus ? (
          <div className="consensus-banner success">
            <h3>
              {t('jointConsensusTitle').replace(
                '{alts}',
                topSupportedAlts.map((alt) => `${getAltTitle(alt)} (${alt})`).join(', ')
              )}
            </h3>
          </div>
        ) : (
          <div className="consensus-banner warning">
            <h3>{t('consensusDisagreement')}</h3>
            <ul className="rec-breakdown">
              {entries.map(([alt, count]) => (
                <li key={alt}>
                  <strong>{getAltTitle(alt)} ({alt}):</strong>{' '}
                  {t('supportCountLabel')
                    .replace('{count}', String(count))
                    .replace('{total}', String(validMethods))
                    .replace('{alt}', getAltTitle(alt))}
                </li>
              ))}
            </ul>
          </div>
        )}

        {missingRecMethods > 0 && (
          <div className="note-box warning-note" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            {missingRecMethods === 1
              ? t('methodsWithoutRecNote').replace('{count}', String(missingRecMethods))
              : t('methodsWithoutRecNotePlural').replace('{count}', String(missingRecMethods))}
          </div>
        )}

        <p className="disclaimer-text">{t('disclaimerEducational')}</p>
      </section>

      {/* SECTION 5 — Redesign All Six Method Cards */}
      <section className="card">
        <h2>{t('methodsCardsTitle')}</h2>
        <div className="method-grid">
          {methods.map((method) => {
            const meta = getMethodMeta(method.id);

            // Sort scores presentation-only
            const rawEntries = Object.entries(method.scores || {});
            const sortedEntries = [...rawEntries].sort((a, b) => {
              return meta.isLowerBetter ? a[1] - b[1] : b[1] - a[1];
            });

            // Calculate presentation ranks with tie support
            let currentRank = 1;
            const rankedEntries = sortedEntries.map(([alt, val], idx) => {
              if (idx > 0) {
                const prevVal = sortedEntries[idx - 1][1];
                if (val !== prevVal) {
                  currentRank = idx + 1;
                }
              }
              return { alt, val, rank: currentRank };
            });

            const isTopTied =
              rankedEntries.length > 1 && rankedEntries[0].val === rankedEntries[1].val;
            const recList = Array.from(new Set(method.recommended || []));

            const topScoreVal = rankedEntries[0]?.val;
            const topRankAlts =
              topScoreVal !== undefined
                ? rankedEntries.filter((e) => e.val === topScoreVal).map((e) => e.alt)
                : [];

            const isRecMatched =
              recList.length === 0 ||
              (recList.length > 0 &&
                recList.every((rec) => topRankAlts.includes(rec)) &&
                topRankAlts.every((alt) => recList.includes(alt)));

            return (
              <article className="card method-card" key={method.id}>
                <div className="method-card-header">
                  <div>
                    <h3>{meta.title}</h3>
                    <code className="tech-id">{method.id}</code>
                  </div>
                  <span className="badge direction-badge">{meta.direction}</span>
                </div>

                <p className="method-question"><strong>Q:</strong> {meta.question}</p>
                <p className="method-when"><strong>When useful:</strong> {meta.when}</p>

                {method.id === 'HURWICZ' && (
                  <div className="alpha-badge">
                    {t('hurwiczAlphaWeight')
                      .replace('{bestWeight}', String(bestWeight))
                      .replace('{worstWeight}', String(worstWeight))}
                  </div>
                )}

                <div className="recommend-box">
                  <span className="recommend-label">{t('recommended')}:</span>
                  {recList.map((rec) => (
                    <span key={rec} className="badge recommend-badge">
                      {getAltTitle(rec)}
                    </span>
                  ))}
                </div>

                {!isRecMatched && (
                  <p className="warn-text">{t('dataConsistencyWarning')}</p>
                )}

                <div className="scores-list">
                  {rankedEntries.map(({ alt, val, rank }) => {
                    const isRec = recList.includes(alt);
                    const rankText =
                      rank === 1 && isTopTied
                        ? t('jointRank')
                        : t('rankLabel').replace('{rank}', String(rank));

                    return (
                      <div
                        key={alt}
                        className={`score-item${isRec ? ' is-recommended' : ''}`}
                      >
                        <div className="score-left">
                          <span className="rank-pill">{rankText}</span>
                          <span className="alt-name">{getAltTitle(alt)}</span>
                          <code className="alt-code">{alt}</code>
                        </div>
                        <strong className="score-num">{utility(val)}</strong>
                      </div>
                    );
                  })}
                </div>

                <p className="method-footer-note">{t('methodCompareNote')}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* SECTION 6 — How to Compare Decision Methods */}
      <section className="card">
        <h2>{t('compGuideTitle')}</h2>
        <div className="table-responsive">
          <table className="data-table comp-table">
            <thead>
              <tr>
                <th scope="col">{t('compColMethod')}</th>
                <th scope="col">{t('compColAttitude')}</th>
                <th scope="col">{t('compColProb')}</th>
                <th scope="col">{t('compColDirection')}</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => {
                const meta = getMethodMeta(m.id);
                return (
                  <tr key={m.id}>
                    <th scope="row">
                      <strong>{meta.title}</strong>
                      <br />
                      <code className="muted">{m.id}</code>
                    </th>
                    <td>{meta.attitude}</td>
                    <td>{meta.probUsed}</td>
                    <td>
                      <span className={`badge ${meta.isLowerBetter ? 'regret' : 'higher'}`}>
                        {meta.direction}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="note-box warning-note" style={{ marginTop: '1rem' }}>
          {t('compWarning')}
        </p>
      </section>

      {/* SECTION 7 — Beginner-Friendly Regret Table */}
      <section className="card">
        <h2>{t('regretTableTitle')}</h2>
        <p className="muted">{t('regretTableHowTo')}</p>
        <p className="note-box info-note" style={{ fontSize: '0.85rem' }}>
          {t('regretNote')}
        </p>
        <div className="table-responsive">
          <table className="data-table regret-table">
            <caption>Regret matrix comparing utility missed across outage states</caption>
            <thead>
              <tr>
                <th scope="col">Strategy / Alternative</th>
                {stateKeys.map((st) => (
                  <th scope="col" key={st}>
                    {st}
                  </th>
                ))}
                <th scope="col">{t('colMaxRegret')}</th>
              </tr>
            </thead>
            <tbody>
              {altKeys.map((alt) => {
                const rowRegrets = regretData[alt] || {};
                const maxRegretVal = minimaxScores[alt];
                const isMinimaxRec = (minimaxMethod?.recommended || []).includes(alt);

                return (
                  <tr key={alt} className={isMinimaxRec ? 'highlight-row' : ''}>
                    <th scope="row">
                      <strong>{getAltTitle(alt)}</strong>
                      <br />
                      <code>{alt}</code>
                      {isMinimaxRec && (
                        <span className="badge recommend-badge" style={{ marginLeft: '0.5rem' }}>
                          {t('recommended')}
                        </span>
                      )}
                    </th>
                    {stateKeys.map((st) => {
                      const val = rowRegrets[st];
                      return (
                        <td key={st}>
                          <strong>{val !== undefined ? utility(val) : '—'}</strong>
                        </td>
                      );
                    })}
                    <td>
                      <strong>{maxRegretVal !== undefined ? utility(maxRegretVal) : '—'}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 8 — Academic / Raw Details */}
      <section className="card">
        <details className="raw-details">
          <summary className="raw-summary">
            <strong>{t('rawDetailsSummary')}</strong>
          </summary>
          <div className="raw-content">
            <p className="muted">{t('rawDetailsNote')}</p>
            <h3>Raw Regret Matrix JSON</h3>
            <pre className="data-table">{JSON.stringify(regretData, null, 2)}</pre>
            <h3>Raw Backend Method Scores</h3>
            <pre className="data-table">
              {JSON.stringify(
                methods.map((m) => ({ id: m.id, recommended: m.recommended, scores: m.scores })),
                null,
                2
              )}
            </pre>
          </div>
        </details>
      </section>

      {/* SECTION 9 — Connection to Next Page (Arbitration CTA) */}
      <section className="card next-step-card">
        <h2>Next Step — Cooperative Resource Sharing</h2>
        <p className="muted" style={{ lineHeight: '1.6' }}>
          {t('nextStepUncertaintyText')}
        </p>
        <button
          type="button"
          className="cta-button primary-cta"
          onClick={() => onSelectTab?.('arbitration')}
        >
          {t('viewCooperativeAllocation')}
        </button>
      </section>
    </div>
  );
}

function Arbitration({
  data,
  scenario,
  onSelectTab,
}: {
  data: FullAnalysisData;
  scenario?: Scenario;
  onSelectTab?: (tab: WorkspaceTab) => void;
}) {
  const { t } = useI18n();
  const result = data.arbitration_result;
  const selected = result?.selected;

  const rowPlayerId = data.payoff_matrix?.row_player || 'P1';
  const colPlayerId = data.payoff_matrix?.column_player || 'P2';

  const rowPlayer = scenario?.players?.find((p) => p.id === rowPlayerId);
  const colPlayer = scenario?.players?.find((p) => p.id === colPlayerId);

  const rowPlayerName = rowPlayer?.name?.trim() || `P1 — Row player`;
  const colPlayerName = colPlayer?.name?.trim() || `P2 — Column player`;

  const isNoSolution = !selected || result?.no_solution;

  if (isNoSolution) {
    return (
      <div className="stack guided-arbitration">
        <section className="card error">
          <h2>{t('noSolutionTitle')}</h2>
          <p className="muted">{t('noSolutionMessage')}</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="cta-button secondary-cta" onClick={() => onSelectTab?.('scenario')}>
              {t('reviewScenarioBtn')}
            </button>
            <button type="button" className="cta-button secondary-cta" onClick={() => onSelectTab?.('analysis')}>
              {t('reviewAnalysisBtn')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  // Disagreement baseline values
  const disagreement0 = result?.disagreement?.[0] ?? 0;
  const disagreement1 = result?.disagreement?.[1] ?? 0;

  // Energy allocation
  const energy0 = selected?.allocation?.energy_kwh?.[0];
  const energy1 = selected?.allocation?.energy_kwh?.[1];

  // Hours allocation
  const hours0 = selected?.allocation?.hours?.[0];
  const hours1 = selected?.allocation?.hours?.[1];

  // Cost shares
  const costShare0 =
    selected?.cost_shares?.[0] !== undefined ? Math.round(selected.cost_shares[0] * 100) : undefined;
  const costShare1 =
    selected?.cost_shares?.[1] !== undefined ? Math.round(selected.cost_shares[1] * 100) : undefined;

  // Utilities
  const utility0 = selected?.utilities?.[0];
  const utility1 = selected?.utilities?.[1];

  // Nash Product
  const nashProductVal = selected?.nash_product;

  // Qualifying candidates count
  const qualifyingCount =
    result?.qualifying_candidates_count ?? 10440;

  // Tie status
  const isUnique = result?.ties ? result.ties.length === 0 : true;

  // Pure Nash Equilibrium ID for comparison table
  const pureNashId = data.pure_nash_equilibria?.[0]?.outcome_id || 'MM';

  return (
    <div className="stack guided-arbitration">
      {/* SECTION 1 — Page Purpose */}
      <section className="card intro-card">
        <h2>{t('arbitrationTitle')}</h2>
        <p className="muted" style={{ lineHeight: '1.6' }}>
          {t('arbitrationIntroText')}
        </p>
        <div className="note-box info-note" style={{ marginTop: '0.75rem' }}>
          <strong>Guide:</strong>
          <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0, fontSize: '0.85rem' }}>
            <li>{t('arbitrationStep1')}</li>
            <li>{t('arbitrationStep2')}</li>
            <li>{t('arbitrationStep3')}</li>
          </ul>
        </div>
      </section>

      {/* SECTION 2 — Who Receives What? (Per-Business Allocation Cards) */}
      <section className="card">
        <h2>{t('whoReceivesWhatTitle')}</h2>
        <div className="allocation-cards-grid">
          {/* Card 1: Row Player / P1 */}
          <div className="card alloc-card">
            <div className="alloc-header">
              <h3>{rowPlayerName}</h3>
              <code className="tech-id">{rowPlayerId} — Row player</code>
            </div>
            <ul className="alloc-list">
              <li>
                <span>{t('energy')}: <strong>{energy0 !== undefined ? `${energy0} kWh` : '—'}</strong></span>
                <p className="muted-desc">{t('energyAllocExplanation')}</p>
              </li>
              <li>
                <span>{t('hours')}: <strong>{hours0 !== undefined ? `${hours0} hrs` : '—'}</strong></span>
                <p className="muted-desc">{t('hoursAllocExplanation')}</p>
              </li>
              <li>
                <span>{t('costShares')}: <strong>{costShare0 !== undefined ? `${costShare0}%` : '—'}</strong></span>
                <p className="muted-desc">{t('costShareAllocExplanation')}</p>
              </li>
              <li>
                <span>{t('utilities')}: <strong>{utility0 !== undefined ? utility(utility0) : '—'}</strong></span>
                <p className="muted-desc">{t('utilityAllocExplanation')}</p>
              </li>
            </ul>
          </div>

          {/* Card 2: Column Player / P2 */}
          <div className="card alloc-card">
            <div className="alloc-header">
              <h3>{colPlayerName}</h3>
              <code className="tech-id">{colPlayerId} — Column player</code>
            </div>
            <ul className="alloc-list">
              <li>
                <span>{t('energy')}: <strong>{energy1 !== undefined ? `${energy1} kWh` : '—'}</strong></span>
                <p className="muted-desc">{t('energyAllocExplanation')}</p>
              </li>
              <li>
                <span>{t('hours')}: <strong>{hours1 !== undefined ? `${hours1} hrs` : '—'}</strong></span>
                <p className="muted-desc">{t('hoursAllocExplanation')}</p>
              </li>
              <li>
                <span>{t('costShares')}: <strong>{costShare1 !== undefined ? `${costShare1}%` : '—'}</strong></span>
                <p className="muted-desc">{t('costShareAllocExplanation')}</p>
              </li>
              <li>
                <span>{t('utilities')}: <strong>{utility1 !== undefined ? utility(utility1) : '—'}</strong></span>
                <p className="muted-desc">{t('utilityAllocExplanation')}</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Simple Result Summary */}
      <section className="card success-summary-card">
        <h2>{t('recCoopAgreement')}</h2>
        <ul className="rec-summary-list">
          <li>
            <strong>{rowPlayerName} ({rowPlayerId}):</strong> {energy0 ?? '—'} kWh for {hours0 ?? '—'} hrs, paying {costShare0 ?? '—'}% cost share (utility score: {utility0 !== undefined ? utility(utility0) : '—'}).
          </li>
          <li>
            <strong>{colPlayerName} ({colPlayerId}):</strong> {energy1 ?? '—'} kWh for {hours1 ?? '—'} hrs, paying {costShare1 ?? '—'}% cost share (utility score: {utility1 !== undefined ? utility(utility1) : '—'}).
          </li>
          <li>{t('bothReceiveAboveDisagreement')}</li>
          <li>{t('balancedBenefitModel')}</li>
          <li>{isUnique ? t('uniqueMaxExplanation') : t('tiedMaxExplanation')}</li>
        </ul>
      </section>

      {/* SECTION 4 — What Does Disagreement [0,0] Mean? */}
      <section className="card">
        <h2>{t('ifNoAgreementTitle')}</h2>
        <p className="muted" style={{ lineHeight: '1.6' }}>
          {t('disagreementExplanation')}
        </p>
        <div className="disagreement-grid" style={{ marginTop: '0.75rem' }}>
          <div className="disagreement-item">
            <strong>{rowPlayerName} ({rowPlayerId}):</strong> Disagreement baseline = {utility(disagreement0)}
          </div>
          <div className="disagreement-item">
            <strong>{colPlayerName} ({colPlayerId}):</strong> Disagreement baseline = {utility(disagreement1)}
          </div>
        </div>
      </section>

      {/* SECTION 5 — Why Was This Plan Selected? */}
      <section className="card">
        <h2>Why Was This Plan Selected?</h2>
        <div className="selection-reasons">
          <div className="note-box info-note">
            <p>{t('qualifyingCandidatesExplanation').replace('{count}', qualifyingCount.toLocaleString())}</p>
          </div>
          <div className="note-box success-note" style={{ marginTop: '0.5rem' }}>
            <p>{isUnique ? t('uniqueMaxExplanation') : t('tiedMaxExplanation')}</p>
          </div>
        </div>
      </section>

      {/* SECTION 6 — Nash Product for Beginners */}
      <section className="card">
        <h2>{t('nashProductTitle')}</h2>
        <p className="muted" style={{ lineHeight: '1.6' }}>
          {t('nashProductExplanation')}
        </p>
        <div className="formula-box" style={{ margin: '0.75rem 0', padding: '0.75rem 1rem', background: 'var(--bg-muted)', borderRadius: '6px', fontFamily: 'monospace' }}>
          Nash product = ({rowPlayerName} utility − {disagreement0}) × ({colPlayerName} utility − {disagreement1})
        </div>
        <div className="nash-score-box" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          {t('nashProduct')}: <span style={{ color: 'var(--primary-color)' }}>{nashProductVal !== undefined ? nashProductVal.toFixed(4) : '—'}</span>
        </div>
        <p className="note-box warning-note" style={{ fontSize: '0.85rem' }}>
          {t('nashProductDisclaimer')}
        </p>
        {/* Expandable Academic Details */}
        <details className="card raw-details" style={{ marginTop: '1rem' }}>
          <summary className="glossary-summary">
            <h3>{t('academicDetailsTitle')}</h3>
          </summary>
          <pre className="data-table" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </section>

      {/* SECTION 7 — Arbitration vs One-Shot Nash Equilibrium */}
      <section className="card">
        <h2>{t('compEquilVsArbitrationTitle')}</h2>
        <div className="table-responsive">
          <table className="data-table comp-table">
            <thead>
              <tr>
                <th scope="col">{t('compDimension')}</th>
                <th scope="col">{t('compOneShotEquil')}</th>
                <th scope="col">{t('compNashArb')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{t('compHowDecided')}</th>
                <td>{t('equilHowDecided')}</td>
                <td>{t('arbHowDecided')}</td>
              </tr>
              <tr>
                <th scope="row">{t('compWhatDecided')}</th>
                <td>{t('equilWhatDecided')}</td>
                <td>{t('arbWhatDecided')}</td>
              </tr>
              <tr>
                <th scope="row">{t('compTarget')}</th>
                <td>{t('equilTarget')} (Outcome: <code>{pureNashId}</code>)</td>
                <td>{t('arbTarget')}</td>
              </tr>
              <tr>
                <th scope="row">{t('compBenefit')}</th>
                <td>{t('equilBenefit')}</td>
                <td>{t('arbBenefit')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 8 — Real-Life Usefulness */}
      <section className="card">
        <h2>{t('practicalApplicationTitle')}</h2>
        <p style={{ lineHeight: '1.6' }}>
          {t('practicalExample').replace('{p1}', rowPlayerName).replace('{p2}', colPlayerName)}
        </p>
        <div className="note-box info-note" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
          {t('practicalLimitation')}
        </div>
      </section>

      {/* SECTION 9 — Next Actions (Navigation CTAs) */}
      <section className="card next-step-card">
        <h2>Next Actions</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <button type="button" className="cta-button secondary-cta" onClick={() => onSelectTab?.('scenario')}>
            {t('reviewScenarioBtn')}
          </button>
          <button type="button" className="cta-button secondary-cta" onClick={() => onSelectTab?.('analysis')}>
            {t('reviewAnalysisBtn')}
          </button>
          <button type="button" className="cta-button primary-cta" onClick={() => onSelectTab?.('simulation')}>
            {t('viewRepeatedGameBtn')}
          </button>
        </div>
      </section>
    </div>
  );
}
function Simulation({
  data,
  scenario,
  onSelectTab,
}: {
  data: FullAnalysisData;
  scenario?: Scenario;
  onSelectTab?: (tab: WorkspaceTab) => void;
}) {
  const { t } = useI18n();
  const [showAllRounds, setShowAllRounds] = useState(false);

  const result = data.repeated_game_result;

  const rowPlayerId = data.payoff_matrix?.row_player || 'P1';
  const colPlayerId = data.payoff_matrix?.column_player || 'P2';

  const rowPlayer = scenario?.players?.find((p) => p.id === rowPlayerId);
  const colPlayer = scenario?.players?.find((p) => p.id === colPlayerId);

  const rowPlayerName = rowPlayer?.name?.trim() || `P1 — Row player`;
  const colPlayerName = colPlayer?.name?.trim() || `P2 — Column player`;

  if (!result) {
    return (
      <div className="stack guided-repeated-game">
        <section className="card error">
          <h2>{t('repeatedGameTitle')}</h2>
          <p className="muted">{t('noRepeatedGameMessage')}</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="cta-button secondary-cta" onClick={() => onSelectTab?.('scenario')}>
              {t('reviewScenarioBtn')}
            </button>
            <button type="button" className="cta-button secondary-cta" onClick={() => onSelectTab?.('analysis')}>
              {t('reviewAnalysisBtn')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  const fixtureId = result.fixture_id || 'educational-pd-001';
  const isEducational = result.educational_fixture ?? (fixtureId === 'educational-pd-001');
  const roundsCount = result.rounds ?? (result.history?.length || 30);
  const seed = result.seed;

  const strat0 = result.player_strategies?.[0] || 'TIT_FOR_TAT';
  const strat1 = result.player_strategies?.[1] || 'ALWAYS_CLAIM_MORE';

  const history = result.history || [];
  const totalPayoffs = result.total_payoffs || [];
  const averagePayoffs = result.average_payoffs || [];
  const cooperationRates = result.cooperation_rates || [];

  const getStrategyDesc = (stratId: string) => {
    switch (stratId) {
      case 'TIT_FOR_TAT':
        return t('stratTitForTatDesc');
      case 'ALWAYS_CLAIM_MORE':
        return t('stratAlwaysClaimMoreDesc');
      case 'ALWAYS_COOPERATE':
        return t('stratAlwaysCooperateDesc');
      case 'FORGIVING_TIT_FOR_TAT':
        return t('stratForgivingTftDesc');
      case 'RANDOM':
        return t('stratRandomDesc');
      default:
        return t('stratUnknownDesc');
    }
  };

  const formatAction = (actionId?: string) => {
    if (!actionId) return '—';
    if (actionId === 'COOPERATE') return `${t('actionCooperateLabel')} (COOPERATE)`;
    if (actionId === 'CLAIM_MORE') return `${t('actionClaimMoreLabel')} (CLAIM_MORE)`;
    return actionId;
  };

  const visibleHistory = showAllRounds ? history : history.slice(0, 5);

  const round1Item = history[0] as HistoryRecord | undefined;
  const latestItem = history[history.length - 1] as HistoryRecord | undefined;

  return (
    <div className="stack guided-repeated-game">
      {/* SECTION 1 — Page Purpose & 3-Step Guide */}
      <section className="card intro-card">
        <h2>{t('repeatedGameTitle')}</h2>
        <p className="muted" style={{ lineHeight: '1.6' }}>
          {t('repeatedGameIntroText')}
        </p>

        {/* Academic Honesty Notice */}
        <div className={`note-box ${isEducational ? 'info-note' : 'success-note'}`} style={{ marginTop: '0.75rem' }}>
          <strong>{isEducational ? 'Educational Fixture Notice:' : 'Live Simulation Notice:'}</strong>{' '}
          {isEducational ? t('educationalFixtureNotice') : t('liveSimulationNotice')}
        </div>

        <div className="note-box info-note" style={{ marginTop: '0.75rem' }}>
          <strong>Guide:</strong>
          <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0, fontSize: '0.85rem' }}>
            <li>{t('repeatedGameStep1')}</li>
            <li>{t('repeatedGameStep2')}</li>
            <li>{t('repeatedGameStep3')}</li>
          </ul>
        </div>
      </section>

      {/* SECTION 2 — Real-Life Connection */}
      <section className="card">
        <h2>{t('realLifeAnalogyTitle')}</h2>
        <div className="note-box info-note" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
          {t('realLifeAnalogyText')}
        </div>
      </section>

      {/* SECTION 3 — Simulation Overview */}
      <section className="card">
        <h2>{t('simulationOverviewTitle')}</h2>
        <div className="sim-overview-grid">
          <div className="card overview-item">
            <span className="muted-desc">Fixture ID</span>
            <code>{fixtureId}</code>
            <p className="muted-desc">{t('educationalFixtureExplanation')}</p>
          </div>
          <div className="card overview-item">
            <span className="muted-desc">Rounds</span>
            <strong>{roundsCount}</strong>
            <p className="muted-desc">{t('roundsExplanation')}</p>
          </div>
          <div className="card overview-item">
            <span className="muted-desc">Random Seed</span>
            <strong>{seed !== undefined ? seed : '—'}</strong>
            <p className="muted-desc">{t('seedExplanation')}</p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Meet the Two Strategies */}
      <section className="card">
        <h2>{t('meetStrategiesTitle')}</h2>
        <div className="strategy-cards-grid">
          {/* Card 1: Row Player */}
          <div className="card strat-card">
            <div className="strat-header">
              <h3>{rowPlayerName}</h3>
              <code className="tech-id">{rowPlayerId} — {strat0}</code>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{getStrategyDesc(strat0)}</p>
          </div>

          {/* Card 2: Column Player */}
          <div className="card strat-card">
            <div className="strat-header">
              <h3>{colPlayerName}</h3>
              <code className="tech-id">{colPlayerId} — {strat1}</code>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{getStrategyDesc(strat1)}</p>
          </div>
        </div>
      </section>

      {/* SECTION 5 — Important Terms (Compact Expandable Glossary) */}
      <section className="card">
        <details className="raw-details" >
          <summary className="glossary-summary">
            <h2 style={{ display: 'inline', fontSize: '1.2rem' }}>{t('importantTermsTitle')}</h2>
          </summary>
          <ul className="terms-list" style={{ marginTop: '0.75rem', paddingLeft: '1.25rem', fontSize: '0.88rem' }}>
            <li><strong>Strategy:</strong> {t('termStrategyDef')}</li>
            <li><strong>Action:</strong> {t('termActionDef')}</li>
            <li><strong>COOPERATE:</strong> {t('termCooperateDef')}</li>
            <li><strong>CLAIM_MORE:</strong> {t('termClaimMoreDef')}</li>
            <li><strong>Payoff Score:</strong> {t('termPayoffDef')}</li>
            <li><strong>Cumulative Payoff:</strong> {t('termCumulativePayoffDef')}</li>
            <li><strong>Total Payoff:</strong> {t('termTotalPayoffDef')}</li>
            <li><strong>Average Payoff:</strong> {t('termAveragePayoffDef')}</li>
            <li><strong>Cooperation Rate:</strong> {t('termCooperationRateDef')}</li>
          </ul>
        </details>
      </section>

      {/* SECTION 6 — What Happened? (Accessible Round History Table) */}
      <section className="card">
        <h2>{t('roundHistoryTitle')}</h2>
        <div className="table-responsive">
          <table className="data-table round-table">
            <thead>
              <tr>
                <th scope="col">Round</th>
                <th scope="col">{rowPlayerName} Action</th>
                <th scope="col">{colPlayerName} Action</th>
                <th scope="col">{rowPlayerName} Payoff</th>
                <th scope="col">{colPlayerName} Payoff</th>
                <th scope="col">{rowPlayerName} Cumul. Score</th>
                <th scope="col">{colPlayerName} Cumul. Score</th>
              </tr>
            </thead>
            <tbody>
              {(visibleHistory as HistoryRecord[]).map((item, idx: number) => {
                const roundNum = item?.round ?? item?.round_number ?? idx + 1;
                const p1Act = item?.actions?.[0] ?? item?.player_1_action ?? item?.p1_action;
                const p2Act = item?.actions?.[1] ?? item?.player_2_action ?? item?.p2_action;
                const p1Pay = item?.payoffs?.[0] ?? item?.player_1_payoff ?? item?.p1_payoff;
                const p2Pay = item?.payoffs?.[1] ?? item?.player_2_payoff ?? item?.p2_payoff;
                const p1Cum = item?.cumulative_payoffs?.[0] ?? item?.p1_cumulative;
                const p2Cum = item?.cumulative_payoffs?.[1] ?? item?.p2_cumulative;

                return (
                  <tr key={`${roundNum}-${idx}`}>
                    <th scope="row">{roundNum}</th>
                    <td>{formatAction(p1Act)}</td>
                    <td>{formatAction(p2Act)}</td>
                    <td>{p1Pay !== undefined ? p1Pay : '—'}</td>
                    <td>{p2Pay !== undefined ? p2Pay : '—'}</td>
                    <td>{p1Cum !== undefined ? p1Cum : '—'}</td>
                    <td>{p2Cum !== undefined ? p2Cum : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {history.length > 5 && (
          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="cta-button secondary-cta"
              onClick={() => setShowAllRounds(!showAllRounds)}
            >
              {showAllRounds
                ? t('showFewerRoundsBtn')
                : t('showAllRoundsBtn').replace('{count}', history.length.toString())}
            </button>
          </div>
        )}
      </section>

      {/* SECTION 7 — Round-by-Round Story */}
      {history.length > 0 && (
        <section className="card">
          <h2>{t('roundStoryTitle')}</h2>
          <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0, fontSize: '0.9rem', lineHeight: '1.6' }}>
            {round1Item && (
              <li>
                {t('storyRound1')
                  .replace('{p1}', rowPlayerName)
                  .replace('{p1Act}', formatAction(round1Item?.actions?.[0]))
                  .replace('{p2}', colPlayerName)
                  .replace('{p2Act}', formatAction(round1Item?.actions?.[1]))}
              </li>
            )}
            {latestItem && history.length > 1 && (
              <li>
                {t('storyLatestRound')
                  .replace('{round}', (latestItem.round ?? history.length).toString())
                  .replace('{p1}', rowPlayerName)
                  .replace('{p1Act}', formatAction(latestItem?.actions?.[0]))
                  .replace('{p2}', colPlayerName)
                  .replace('{p2Act}', formatAction(latestItem?.actions?.[1]))}
              </li>
            )}
          </ul>
        </section>
      )}

      {/* SECTION 8 — Final Result Summary */}
      <section className="card">
        <h2>{t('finalResultSummaryTitle')}</h2>
        <div className="result-cards-grid">
          {/* Card 1: Row Player */}
          <div className="card res-card">
            <h3>{rowPlayerName} ({rowPlayerId})</h3>
            <ul className="res-list">
              <li>
                <span>{t('totalPayoffLabel')}: <strong>{totalPayoffs[0] !== undefined ? totalPayoffs[0] : t('notAvailableLabel')}</strong></span>
              </li>
              <li>
                <span>{t('avgPayoffLabel')}: <strong>{averagePayoffs[0] !== undefined ? averagePayoffs[0].toFixed(4) : t('notAvailableLabel')}</strong></span>
              </li>
              <li>
                <span>{t('coopRateLabel')}: <strong>{cooperationRates[0] !== undefined ? `${(cooperationRates[0] * 100).toFixed(1)}%` : t('notAvailableLabel')}</strong></span>
              </li>
            </ul>
          </div>

          {/* Card 2: Column Player */}
          <div className="card res-card">
            <h3>{colPlayerName} ({colPlayerId})</h3>
            <ul className="res-list">
              <li>
                <span>{t('totalPayoffLabel')}: <strong>{totalPayoffs[1] !== undefined ? totalPayoffs[1] : t('notAvailableLabel')}</strong></span>
              </li>
              <li>
                <span>{t('avgPayoffLabel')}: <strong>{averagePayoffs[1] !== undefined ? averagePayoffs[1].toFixed(4) : t('notAvailableLabel')}</strong></span>
              </li>
              <li>
                <span>{t('coopRateLabel')}: <strong>{cooperationRates[1] !== undefined ? `${(cooperationRates[1] * 100).toFixed(1)}%` : t('notAvailableLabel')}</strong></span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 9 — Beginner-Friendly Lesson */}
      <section className="card">
        <h2>{t('beginnerLessonTitle')}</h2>
        <p className="note-box info-note" style={{ lineHeight: '1.6', fontSize: '0.9rem' }}>
          {t('beginnerLessonText')}
        </p>
      </section>

      {/* SECTION 10 — Academic Details & Raw Data */}
      <section className="card">
        <details className="raw-details" >
          <summary className="glossary-summary">
            <h3 style={{ display: 'inline' }}>{t('academicDetailsAndRawData')}</h3>
          </summary>
          <pre className="data-table" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </section>

      {/* SECTION 11 — Next Actions (Navigation CTAs) */}
      <section className="card next-step-card">
        <h2>Next Actions</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <button type="button" className="cta-button secondary-cta" onClick={() => onSelectTab?.('scenario')}>
            {t('reviewScenarioBtn')}
          </button>
          <button type="button" className="cta-button secondary-cta" onClick={() => onSelectTab?.('analysis')}>
            {t('reviewAnalysisBtn')}
          </button>
          <button type="button" className="cta-button secondary-cta" onClick={() => onSelectTab?.('arbitration')}>
            {t('reviewArbitrationBtn')}
          </button>
          <button type="button" className="cta-button primary-cta" onClick={() => onSelectTab?.('results')}>
            {t('viewResultsTheoryBtn')}
          </button>
        </div>
      </section>
    </div>
  );
}
function Results({ data }: { data: FullAnalysisData }) { const { t } = useI18n(); return <div className="stack"><h2>{t('recommendationTheory')}</h2><div className="card success"><h3>{t('cooperativeRecommendation')}</h3><p>{data.final_recommendation.explanation}</p><p>{t('outcomeId')}: {data.final_recommendation.outcome_id ?? t('arbitrationNotMm')}</p></div><h3>{t('explanations')}</h3><ul>{data.explanations.map((item) => <li key={item}>{item}</li>)}</ul><h3>{t('assumptionsScope')}</h3><ul><li>{t('exactlyTwoScope')}</li><li>{t('chapter17Excluded')}</li><li>{t('penaltiesScope')}</li><li>{t('decisionSupportScope')}</li><li>{t('stableBetterScope')}</li></ul>{data.warnings?.length ? <><h3>{t('warnings')}</h3><ul>{data.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></> : null}</div>; }
