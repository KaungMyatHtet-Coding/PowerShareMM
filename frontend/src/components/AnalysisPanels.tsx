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

  // Section 4: Aggregate recommendations
  const methods = data.uncertainty_analysis.methods || [];
  const recCounts = new Map<string, number>();
  methods.forEach((m) => {
    (m.recommended || []).forEach((rec) => {
      recCounts.set(rec, (recCounts.get(rec) || 0) + 1);
    });
  });

  const totalMethods = methods.length;
  const topRec = Array.from(recCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  const isConsensus = topRec && topRec[1] === totalMethods;

  // Section 7: Regret matrix processing
  const regretData = data.uncertainty_analysis.regret_matrix || {};
  const altKeys = Object.keys(regretData);
  const stateKeys = altKeys.length > 0 ? Object.keys(regretData[altKeys[0]] || {}) : [];

  // Find lowest regret in each state column
  const minRegretPerState = new Map<string, number>();
  stateKeys.forEach((st) => {
    let minVal = Infinity;
    altKeys.forEach((alt) => {
      const val = regretData[alt]?.[st];
      if (val !== undefined && val < minVal) {
        minVal = val;
      }
    });
    minRegretPerState.set(st, minVal);
  });

  // Find Minimax Regret method score for each alternative (backend provided)
  const minimaxMethod = methods.find((m) => m.id === 'MINIMAX_REGRET');
  const minimaxScores = minimaxMethod?.scores || {};
  let minMaxRegretVal = Infinity;
  Object.values(minimaxScores).forEach((val) => {
    if (val < minMaxRegretVal) minMaxRegretVal = val;
  });

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
        {isConsensus ? (
          <div className="consensus-banner success">
            <h3>
              {t('consensusAllAgree')
                .replace('{count}', String(totalMethods))
                .replace('{total}', String(totalMethods))
                .replace('{alt}', getAltTitle(topRec[0]))}
            </h3>
          </div>
        ) : (
          <div className="consensus-banner warning">
            <h3>{t('consensusDisagreement')}</h3>
            <ul className="rec-breakdown">
              {Array.from(recCounts.entries()).map(([alt, count]) => (
                <li key={alt}>
                  <strong>{getAltTitle(alt)} ({alt}):</strong> {count} method{count > 1 ? 's' : ''}
                </li>
              ))}
            </ul>
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
            const topAlt = rankedEntries[0]?.alt;
            const recList = method.recommended || [];
            const isRecMatched = topAlt && recList.includes(topAlt);

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
          {t('regretExplain')}
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
                      const isBestInState = val === minRegretPerState.get(st);
                      return (
                        <td key={st} className={isBestInState ? 'cell-best-state' : ''}>
                          <strong>{val !== undefined ? utility(val) : '—'}</strong>
                          {isBestInState && (
                            <span className="cell-tag">{t('bestInStateBadge')}</span>
                          )}
                        </td>
                      );
                    })}
                    <td
                      className={
                        maxRegretVal === minMaxRegretVal ? 'cell-lowest-max-regret' : ''
                      }
                    >
                      <strong>{maxRegretVal !== undefined ? utility(maxRegretVal) : '—'}</strong>
                      {maxRegretVal === minMaxRegretVal && (
                        <span className="cell-tag lowest-tag">{t('lowestRegretBadge')}</span>
                      )}
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

function Arbitration({ data }: { data: FullAnalysisData }) { const { t } = useI18n(); const result = data.arbitration_result; const selected = result.selected; return <div className="stack"><h2>{t('nashArbitration')}</h2><p className="muted">{t('arbitrationDescription')}</p><div className="allocation-grid"><div className="card"><h3>{t('disagreement')}</h3><p>[{result.disagreement.join(', ')}]</p><p>{t('qualifyingCandidates')}: {result.qualifying_candidates_count.toLocaleString()}</p></div>{selected ? <div className="card success"><h3>{t('selectedAllocation')}</h3><p>{t('energy')}: {selected.allocation.energy_kwh.join(', ')} kWh</p><p>{t('hours')}: {selected.allocation.hours.join(', ')}</p><p>{t('costShares')}: {selected.cost_shares.map((share) => `${(share * 100).toFixed(0)}%`).join(' / ')}</p><p>{t('utilities')}: {selected.utilities.map(utility).join(' / ')}</p><p>{t('nashProduct')}: {selected.nash_product.toFixed(4)}</p><p>{result.ties.length ? `${t('ties')}: ${result.ties.join(', ')}` : t('uniqueMaximum')}</p></div> : <div className="card error"><h3>{t('noQualifyingAgreement')}</h3></div>}</div><ul>{result.explanations.map((text) => <li key={text}>{text}</li>)}</ul></div>; }
function Simulation({ data }: { data: FullAnalysisData }) { const { t } = useI18n(); return <div className="stack"><h2>{t('repeatedGameTitle')}</h2>{data.repeated_game_result ? <pre className="data-table">{JSON.stringify(data.repeated_game_result, null, 2)}</pre> : <div className="card"><p>{t('noRepeatedGame')}</p><p>{t('supportedStrategies')}: ALWAYS_COOPERATE, ALWAYS_CLAIM_MORE, TIT_FOR_TAT, FORGIVING_TIT_FOR_TAT, RANDOM.</p></div>}</div>; }
function Results({ data }: { data: FullAnalysisData }) { const { t } = useI18n(); return <div className="stack"><h2>{t('recommendationTheory')}</h2><div className="card success"><h3>{t('cooperativeRecommendation')}</h3><p>{data.final_recommendation.explanation}</p><p>{t('outcomeId')}: {data.final_recommendation.outcome_id ?? t('arbitrationNotMm')}</p></div><h3>{t('explanations')}</h3><ul>{data.explanations.map((item) => <li key={item}>{item}</li>)}</ul><h3>{t('assumptionsScope')}</h3><ul><li>{t('exactlyTwoScope')}</li><li>{t('chapter17Excluded')}</li><li>{t('penaltiesScope')}</li><li>{t('decisionSupportScope')}</li><li>{t('stableBetterScope')}</li></ul>{data.warnings?.length ? <><h3>{t('warnings')}</h3><ul>{data.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></> : null}</div>; }
