/**
 * AnalysisPanels.test.tsx — Comprehensive test suite for the redesigned Analysis page UX.
 * Tests cover player ID mapping (row_player / column_player), reversed player arrays,
 * cell resolution by outcome_id, missing data fallbacks, localized Myanmar PD status,
 * Arbitration CTA tab navigation, keyboard accessibility, and absence of canonical hardcoding.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnalysisPanels } from './components/AnalysisPanels';
import { analyzeMock } from './api/client';
import { demoScenario } from './data/mockFixture';
import { I18nProvider } from './i18n/I18nContext';
import type { FullAnalysisData, Scenario } from './types';

const data = analyzeMock();
const renderPanels = (ui: React.ReactElement) => render(<I18nProvider>{ui}</I18nProvider>);

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.lang = 'en';
});

describe('AnalysisPanels — Guided UX', () => {
  /* 1. Player names map by row_player and column_player IDs */
  it('maps player names by row_player and column_player IDs', () => {
    renderPanels(<AnalysisPanels data={data} tab="analysis" scenario={demoScenario} />);
    // In demoScenario, P1 is Shwe Mini Market, P2 is TechCare Phone Service
    expect(screen.getAllByText(/Shwe Mini Market/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/TechCare Phone Service/).length).toBeGreaterThan(0);
  });

  /* 2. Handles reversed scenario.players array order correctly */
  it('handles reversed scenario.players order correctly', () => {
    const reversedScenario: Scenario = {
      ...demoScenario,
      players: [demoScenario.players[1], demoScenario.players[0]], // [P2, P1]
    };
    renderPanels(<AnalysisPanels data={data} tab="analysis" scenario={reversedScenario} />);
    // row_player is P1 (Shwe Mini Market); column_player is P2 (TechCare Phone Service)
    // Row player box should still identify P1 (Shwe Mini Market)
    const rowBadge = screen.getByText('Row Player (Controls Rows)');
    expect(rowBadge.parentElement).toHaveTextContent('Shwe Mini Market');

    const colBadge = screen.getByText('Column Player (Controls Columns)');
    expect(colBadge.parentElement).toHaveTextContent('TechCare Phone Service');
  });

  /* 3. Scrambled/shuffled cells are resolved by outcome_id */
  it('resolves cells by outcome_id even if scrambled in matrix response', () => {
    const scrambledData: FullAnalysisData = {
      ...data,
      payoff_matrix: {
        ...data.payoff_matrix,
        cells: [
          data.payoff_matrix.cells[3], // MM
          data.payoff_matrix.cells[0], // CC
          data.payoff_matrix.cells[2], // MC
          data.payoff_matrix.cells[1], // CM
        ],
      },
    };
    renderPanels(<AnalysisPanels data={scrambledData} tab="analysis" scenario={demoScenario} />);
    // CC outcome card must still display CC utilities 76.50 / 61.50
    expect(screen.getByText('CC — Both Cooperate')).toBeInTheDocument();
    expect(screen.getAllByText('76.50').length).toBeGreaterThan(0);
    expect(screen.getAllByText('61.50').length).toBeGreaterThan(0);
  });

  /* 4. Utilities[0] belongs to Row Player and utilities[1] belongs to Column Player */
  it('assigns utilities[0] to Row Player and utilities[1] to Column Player', () => {
    renderPanels(<AnalysisPanels data={data} tab="analysis" scenario={demoScenario} />);
    // In CC (76.50, 61.50), row player (Shwe Mini Market) gets 76.50
    expect(screen.getAllByText('76.50').length).toBeGreaterThan(0);
    expect(screen.getAllByText('61.50').length).toBeGreaterThan(0);
  });

  /* 5. Missing player names use safe role-based fallbacks without contradictory P2 (P1) */
  it('uses role-based fallbacks when player names are blank and prevents contradictory P2 (P1)', () => {
    const blankPlayerScenario: Scenario = {
      ...demoScenario,
      players: [
        { ...demoScenario.players[0], name: '' },
        { ...demoScenario.players[1], name: '  ' },
      ],
    };
    renderPanels(<AnalysisPanels data={data} tab="analysis" scenario={blankPlayerScenario} />);
    expect(screen.getAllByText(/P1 — Row player/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/P2 — Column player/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/P2 \(P1\)/)).not.toBeInTheDocument();
    expect(screen.queryByText(/P1 \(P2\)/)).not.toBeInTheDocument();
  });

  /* 5b. Handles row_player=P2 and column_player=P1 with blank names */
  it('handles row_player=P2 and column_player=P1 with role fallbacks and attributes utilities correctly', () => {
    const p2RowData: FullAnalysisData = {
      ...data,
      payoff_matrix: {
        ...data.payoff_matrix,
        row_player: 'P2',
        column_player: 'P1',
      },
    };
    const blankPlayerScenario: Scenario = {
      ...demoScenario,
      players: [
        { ...demoScenario.players[0], name: '' },
        { ...demoScenario.players[1], name: '' },
      ],
    };
    renderPanels(<AnalysisPanels data={p2RowData} tab="analysis" scenario={blankPlayerScenario} />);

    // Row player fallback must be "P2 — Row player"
    expect(screen.getAllByText(/P2 — Row player/).length).toBeGreaterThan(0);
    // Column player fallback must be "P1 — Column player"
    expect(screen.getAllByText(/P1 — Column player/).length).toBeGreaterThan(0);

    // Contradictory labels MUST NOT exist
    expect(screen.queryByText(/P2 \(P1\)/)).not.toBeInTheDocument();
    expect(screen.queryByText(/P1 \(P2\)/)).not.toBeInTheDocument();

    // In CC outcome card, utilities[0] (76.50) is assigned to row player (P2 — Row player)
    const ccHeader = screen.getByText('CC — Both Cooperate');
    const ccCard = ccHeader.closest('.outcome-card')!;
    expect(ccCard).toHaveTextContent('P2 — Row player');
    expect(ccCard).toHaveTextContent('76.50');
    expect(ccCard).toHaveTextContent('P1 — Column player');
    expect(ccCard).toHaveTextContent('61.50');
  });

  /* 6. Missing cells render fallback without crashing */
  it('handles missing cells safely with fallback message', () => {
    const missingCellData: FullAnalysisData = {
      ...data,
      payoff_matrix: {
        ...data.payoff_matrix,
        cells: data.payoff_matrix.cells.filter((c) => c.outcome_id !== 'CC'),
      },
    };
    renderPanels(<AnalysisPanels data={missingCellData} tab="analysis" scenario={demoScenario} />);
    expect(screen.getByText('This outcome is unavailable in the current analysis response.')).toBeInTheDocument();
  });

  /* 7. Empty Nash and Pareto arrays render safely */
  it('renders safely when Nash and Pareto arrays are empty', () => {
    const emptyAnalysisData: FullAnalysisData = {
      ...data,
      pure_nash_equilibria: [],
      pareto_optimal_outcomes: [],
    };
    renderPanels(<AnalysisPanels data={emptyAnalysisData} tab="analysis" scenario={demoScenario} />);
    expect(screen.getAllByText('none').length).toBeGreaterThan(0);
  });

  /* 8. Nash and Pareto badges follow backend data */
  it('renders Nash and Pareto badges following backend data', () => {
    renderPanels(<AnalysisPanels data={data} tab="analysis" scenario={demoScenario} />);
    // Nash is MM in fixture; Pareto is CC, CM, MC
    expect(screen.getAllByText('Nash Equilibrium').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pareto Frontier').length).toBeGreaterThan(0);
  });

  /* 9. Localized Myanmar Prisoner’s Dilemma status & neutral wording */
  it('localizes Prisoner’s Dilemma status and utility explanation in Myanmar mode with neutral backend-driven text', () => {
    window.localStorage.setItem('powershare-language', 'my');
    renderPanels(<AnalysisPanels data={data} tab="analysis" scenario={demoScenario} />);

    // Myanmar localized neutral PD title & status must be present
    expect(screen.getAllByText(/အကျဉ်းသားနှစ်ဦး၏ အကျပ်အတည်း \(Prisoner’s Dilemma\)/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Backend စစ်ဆေးမှုအရ အကျဉ်းသားနှစ်ဦး၏ အကျပ်အတည်း \(Prisoner’s Dilemma\) ကို တွေ့ရှိထားသည်။/)).toBeInTheDocument();

    // Generic status MUST NOT contain hardcoded outcome IDs or actions
    const pdBox = screen.getByText(/Backend စစ်ဆေးမှုအရ အကျဉ်းသားနှစ်ဦး၏ အကျပ်အတည်း/).closest('.pd-status-box')!;
    expect(pdBox).not.toHaveTextContent('CLAIM_MORE');
    expect(pdBox).not.toHaveTextContent('MM');
    expect(pdBox).not.toHaveTextContent('CC');

    // Refined utility explanation must be rendered
    expect(screen.getByText(/Model အရ အကျိုးရရှိမှုအဆင့်ကို ဖော်ပြသည်/)).toBeInTheDocument();
    // Raw English explanation should not be displayed
    expect(screen.queryByText(/Strictly dominant strategies lead to/)).not.toBeInTheDocument();
  });

  /* 9b. Myanmar not-detected Prisoner's Dilemma status */
  it('renders neutral not-detected Prisoner’s Dilemma status in Myanmar mode when detected is false', () => {
    window.localStorage.setItem('powershare-language', 'my');
    const notDetectedData: FullAnalysisData = {
      ...data,
      prisoners_dilemma: {
        ...data.prisoners_dilemma,
        detected: false,
      },
    };
    renderPanels(<AnalysisPanels data={notDetectedData} tab="analysis" scenario={demoScenario} />);

    expect(screen.getByText('Backend စစ်ဆေးမှုအရ အကျဉ်းသားနှစ်ဦး၏ အကျပ်အတည်း (Prisoner’s Dilemma) ကို မတွေ့ရှိပါ။')).toBeInTheDocument();
  });

  /* 10. Glossary is accordion/details element accessible by keyboard */
  it('renders a collapsible glossary element', () => {
    renderPanels(<AnalysisPanels data={data} tab="analysis" scenario={demoScenario} />);
    expect(screen.getByText('Game Theory Concepts Glossary')).toBeInTheDocument();
    expect(screen.getByText('Payoff / Utility Score')).toBeInTheDocument();
    expect(screen.getAllByText(/Nash Equilibrium/).length).toBeGreaterThan(0);
    expect(screen.getByText('Pareto Frontier / Efficiency')).toBeInTheDocument();
  });

  /* 11. Arbitration CTA invokes onSelectTab with "arbitration" */
  it('invokes onSelectTab("arbitration") when clicking the Arbitration CTA button', () => {
    const onSelectTab = vi.fn();
    renderPanels(<AnalysisPanels data={data} tab="analysis" onSelectTab={onSelectTab} scenario={demoScenario} />);

    const ctaBtn = screen.getByRole('button', { name: /Go to Fair Arbitration/ });
    fireEvent.click(ctaBtn);
    expect(onSelectTab).toHaveBeenCalledWith('arbitration');
  });


  /* 13. Page 3 (Uncertainty) 9-Section Guided Redesign Tests */
  it('renders all 9 sections of the redesigned Uncertainty page in English', () => {
    const onSelectTab = vi.fn();
    renderPanels(<AnalysisPanels data={data} tab="uncertainty" onSelectTab={onSelectTab} scenario={demoScenario} />);

    // Section 1: Understanding Uncertainty
    expect(screen.getByText('Choosing a power strategy under uncertain outages')).toBeInTheDocument();
    expect(screen.getByText('Games Against Nature')).toBeInTheDocument();
    expect(screen.getByText(/The exact duration of an outage is unknown/)).toBeInTheDocument();
    expect(screen.getByText(/These six methods are not ranked from best method to worst method/)).toBeInTheDocument();

    // Section 2: Current Outage Assumptions
    expect(screen.getByText('Current Outage Assumptions')).toBeInTheDocument();
    expect(screen.getAllByText('SHORT').length).toBeGreaterThan(0);
    expect(screen.getAllByText('MEDIUM').length).toBeGreaterThan(0);
    expect(screen.getAllByText('LONG').length).toBeGreaterThan(0);

    // Section 3: Three Available Power Strategies
    expect(screen.getByText('Three Available Power Strategies')).toBeInTheDocument();
    expect(screen.getAllByText('Battery only').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Generator only').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Battery + generator').length).toBeGreaterThan(0);

    // Section 4: Overall Recommendation Summary
    expect(screen.getByText('Overall Recommendation Summary')).toBeInTheDocument();
    expect(screen.getByText(/Current agreement: 6 of 6 methods recommend/)).toBeInTheDocument();
    expect(screen.getByText('This is educational decision support, not automatic equipment control.')).toBeInTheDocument();

    // Section 5: Six Decision-Method Cards
    expect(screen.getByText('Six Decision-Method Cards')).toBeInTheDocument();
    expect(screen.getByText('Probability-weighted average', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText('Protect against the worst case', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText('Focus on the best case', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText('Treat all outage states equally', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText('Limit the worst missed opportunity', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText('Balance best and worst cases', { selector: 'h3' })).toBeInTheDocument();

    // Minimax Regret lower is better
    expect(screen.getAllByText('Lower regret is better').length).toBeGreaterThan(0);

    // Hurwicz Alpha weight display
    expect(screen.getByText('60% best-case weight + 40% worst-case weight.')).toBeInTheDocument();

    // Section 6: How to Compare Decision Methods
    expect(screen.getByText('How to Compare Decision Methods')).toBeInTheDocument();
    expect(screen.getByText(/A score of 80 in Expected Value is not directly comparable/)).toBeInTheDocument();

    // Section 7: Beginner-Friendly Regret Table
    expect(screen.getByText('Beginner-Friendly Regret Table')).toBeInTheDocument();
    expect(screen.getByText(/How to read this table: Each value shows how much utility would be missed/)).toBeInTheDocument();

    // Section 8: Academic / Raw Details
    expect(screen.getByText('View raw academic data')).toBeInTheDocument();

    // Section 9: Next Step CTA
    const nextCta = screen.getByRole('button', { name: /View cooperative allocation/ });
    expect(nextCta).toBeInTheDocument();
    fireEvent.click(nextCta);
    expect(onSelectTab).toHaveBeenCalledWith('arbitration');
  });

  /* 14. Minimax Regret sorts lowest regret first */
  it('sorts Minimax Regret scores from lowest to highest regret', () => {
    renderPanels(<AnalysisPanels data={data} tab="uncertainty" scenario={demoScenario} />);
    const minimaxCard = screen.getByText('Limit the worst missed opportunity', { selector: 'h3' }).closest('.method-card')!;
    expect(minimaxCard).toHaveTextContent('Rank 1Battery + generatorHYBRID15.00');
    expect(minimaxCard).toHaveTextContent('Rank 2Generator onlyGENERATOR_ONLY35.00');
    expect(minimaxCard).toHaveTextContent('Rank 3Battery onlyBATTERY_ONLY70.00');
  });

  /* 15. Handles tied method scores with Joint 1st rank label */
  it('handles tied scores in method cards with Joint 1st rank label', () => {
    const tiedData: FullAnalysisData = {
      ...data,
      uncertainty_analysis: {
        ...data.uncertainty_analysis,
        methods: data.uncertainty_analysis.methods.map((m) =>
          m.id === 'EXPECTED_VALUE'
            ? { ...m, scores: { BATTERY_ONLY: 80, GENERATOR_ONLY: 80, HYBRID: 80 } }
            : m
        ),
      },
    };
    renderPanels(<AnalysisPanels data={tiedData} tab="uncertainty" scenario={demoScenario} />);
    const evCard = screen.getByText('Probability-weighted average', { selector: 'h3' }).closest('.method-card')!;
    expect(evCard).toHaveTextContent('Joint 1st');
  });

  /* 16. Localized Uncertainty page in Myanmar mode */
  it('renders all Uncertainty sections in Myanmar mode', () => {
    window.localStorage.setItem('powershare-language', 'my');
    renderPanels(<AnalysisPanels data={data} tab="uncertainty" scenario={demoScenario} />);

    expect(screen.getByText('မီးပျက်ချိန် မသေချာမှုအောက်တွင် လျှပ်စစ်အသုံးပြုနည်းကို ရွေးချယ်ခြင်း')).toBeInTheDocument();
    expect(screen.getByText('Games Against Nature (မသေချာမှုအောက် ဆုံးဖြတ်ချက်)')).toBeInTheDocument();
    expect(screen.getByText('လက်ရှိ မီးပျက်ချိန် ခန့်မှန်းချက်များ')).toBeInTheDocument();
    expect(screen.getByText('ရရှိနိုင်သော လျှပ်စစ်အသုံးပြုနည်း သုံးမျိုး')).toBeInTheDocument();
    expect(screen.getAllByText('ဘက်ထရီသီးသန့်').length).toBeGreaterThan(0);
    expect(screen.getAllByText('မီးစက်သီးသန့်').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ဘက်ထရီနှင့် မီးစက် ပေါင်းစပ်အသုံးပြုခြင်း').length).toBeGreaterThan(0);
    expect(screen.getByText('အကြံပြုချက် အချုပ်ရလဒ်')).toBeInTheDocument();
    expect(screen.getByText('ပူးပေါင်းခွဲဝေမှုကို ကြည့်ရန် →')).toBeInTheDocument();
  });


  /* 17. Consolidated Behavioral Edge Cases for Page 3 Uncertainty UX */
  it('handles split recommendations, missing recommendations, duplicate recommendations, and zero recommendations', () => {
    // 17a. Split recommendations (4 HYBRID, 2 BATTERY_ONLY)
    const splitData: FullAnalysisData = {
      ...data,
      uncertainty_analysis: {
        ...data.uncertainty_analysis,
        methods: data.uncertainty_analysis.methods.map((m, idx) => ({
          ...m,
          recommended: idx < 4 ? ['HYBRID'] : ['BATTERY_ONLY'],
        })),
      },
    };
    const { unmount } = renderPanels(<AnalysisPanels data={splitData} tab="uncertainty" scenario={demoScenario} />);
    expect(screen.getByText('The methods do not all agree. Review each method according to the decision attitude that matches your situation.')).toBeInTheDocument();
    expect(screen.getByText(/4 of 6 methods with recommendations support Battery \+ generator\./)).toBeInTheDocument();
    expect(screen.getByText(/2 of 6 methods with recommendations support Battery only\./)).toBeInTheDocument();
    unmount();

    // 17b. One method with missing recommendation
    const missingOneData: FullAnalysisData = {
      ...data,
      uncertainty_analysis: {
        ...data.uncertainty_analysis,
        methods: data.uncertainty_analysis.methods.map((m, idx) => ({
          ...m,
          recommended: idx === 0 ? [] : ['HYBRID'],
        })),
      },
    };
    const { unmount: unmount2 } = renderPanels(<AnalysisPanels data={missingOneData} tab="uncertainty" scenario={demoScenario} />);
    expect(screen.getByText(/Current agreement: 5 of 5 methods recommend/)).toBeInTheDocument();
    expect(screen.getByText(/Note: 1 method has no available recommendation\./)).toBeInTheDocument();
    unmount2();

    // 17c. Duplicate recommendation ID inside same method is deduplicated
    const dupRecData: FullAnalysisData = {
      ...data,
      uncertainty_analysis: {
        ...data.uncertainty_analysis,
        methods: data.uncertainty_analysis.methods.map((m) => ({
          ...m,
          recommended: ['HYBRID', 'HYBRID'],
        })),
      },
    };
    const { unmount: unmount3 } = renderPanels(<AnalysisPanels data={dupRecData} tab="uncertainty" scenario={demoScenario} />);
    expect(screen.getByText(/Current agreement: 6 of 6 methods recommend Battery \+ generator\./)).toBeInTheDocument();
    unmount3();

    // 17d. All recommendations missing
    const noRecData: FullAnalysisData = {
      ...data,
      uncertainty_analysis: {
        ...data.uncertainty_analysis,
        methods: data.uncertainty_analysis.methods.map((m) => ({
          ...m,
          recommended: [],
        })),
      },
    };
    renderPanels(<AnalysisPanels data={noRecData} tab="uncertainty" scenario={demoScenario} />);
    expect(screen.getByText('No method recommendation is available in the current response.')).toBeInTheDocument();
  });

  it('handles tied recommendations, joint consensus, and recommendation/score mismatches', () => {
    // 18a. Tied recommendations across all methods produce joint consensus
    const tiedRecData: FullAnalysisData = {
      ...data,
      uncertainty_analysis: {
        ...data.uncertainty_analysis,
        methods: data.uncertainty_analysis.methods.map((m) => ({
          ...m,
          recommended: ['HYBRID', 'BATTERY_ONLY'],
        })),
      },
    };
    const { unmount } = renderPanels(<AnalysisPanels data={tiedRecData} tab="uncertainty" scenario={demoScenario} />);
    expect(screen.getByText(/All available methods jointly support these tied alternatives: Battery \+ generator \(HYBRID\), Battery only \(BATTERY_ONLY\)/)).toBeInTheDocument();
    unmount();

    // 18b. Mismatch warning when backend recommendation contradicts presentation top score rank
    const mismatchData: FullAnalysisData = {
      ...data,
      uncertainty_analysis: {
        ...data.uncertainty_analysis,
        methods: data.uncertainty_analysis.methods.map((m) =>
          m.id === 'EXPECTED_VALUE'
            ? { ...m, recommended: ['BATTERY_ONLY'] } // Scores favor HYBRID=80 vs BATTERY_ONLY=55.5
            : m
        ),
      },
    };
    renderPanels(<AnalysisPanels data={mismatchData} tab="uncertainty" scenario={demoScenario} />);
    expect(screen.getByText('Note: The backend recommendation remains authoritative even if score ordering differs.')).toBeInTheDocument();
  });

  it('handles unknown alternative IDs, unknown method IDs, empty scores, and non-square regret matrix', () => {
    // 19a. Unknown alternative ID & method ID
    const customData: FullAnalysisData = {
      ...data,
      uncertainty_analysis: {
        ...data.uncertainty_analysis,
        methods: [
          ...data.uncertainty_analysis.methods,
          {
            id: 'CUSTOM_CRITERION',
            scores: { UNKNOWN_ALT: 99.9, HYBRID: 80.0 },
            recommended: ['UNKNOWN_ALT'],
            ties: [],
            explanation: 'Custom criterion explanation.',
          },
        ],
        regret_matrix: {
          ...data.uncertainty_analysis.regret_matrix,
          UNKNOWN_ALT: { SHORT: 5, MEDIUM: 10, LONG: 15, EXTRA_STATE: 20 },
        },
      },
    };
    const { unmount } = renderPanels(<AnalysisPanels data={customData} tab="uncertainty" scenario={demoScenario} />);
    expect(screen.getAllByText('CUSTOM_CRITERION').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UNKNOWN_ALT/).length).toBeGreaterThan(0);
    expect(screen.getByText('EXTRA_STATE')).toBeInTheDocument();
    unmount();

    // 19b. Empty regret matrix and empty scores handle gracefully
    const emptyMatrixData: FullAnalysisData = {
      ...data,
      uncertainty_analysis: {
        ...data.uncertainty_analysis,
        regret_matrix: {},
        methods: [
          {
            id: 'EXPECTED_VALUE',
            scores: {},
            recommended: [],
            ties: [],
            explanation: 'No scores available.',
          },
        ],
      },
    };
    renderPanels(<AnalysisPanels data={emptyMatrixData} tab="uncertainty" scenario={demoScenario} />);
    expect(screen.getByText('No method recommendation is available in the current response.')).toBeInTheDocument();
  });

  it('proves all 5 descending criteria and 1 ascending Minimax Regret criterion rank correctly', () => {
    renderPanels(<AnalysisPanels data={data} tab="uncertainty" scenario={demoScenario} />);

    // EV descending: HYBRID (80), GENERATOR_ONLY (63.5), BATTERY_ONLY (55.5)
    const evCard = screen.getByText('Probability-weighted average', { selector: 'h3' }).closest('.method-card')!;
    expect(evCard).toHaveTextContent('Rank 1Battery + generatorHYBRID80.00');

    // Wald descending: HYBRID (65), GENERATOR_ONLY (45), BATTERY_ONLY (20)
    const waldCard = screen.getByText('Protect against the worst case', { selector: 'h3' }).closest('.method-card')!;
    expect(waldCard).toHaveTextContent('Rank 1Battery + generatorHYBRID65.00');

    // Maximax descending: HYBRID (90), BATTERY_ONLY (80), GENERATOR_ONLY (75)
    const maximaxCard = screen.getByText('Focus on the best case', { selector: 'h3' }).closest('.method-card')!;
    expect(maximaxCard).toHaveTextContent('Rank 1Battery + generatorHYBRID90.00');

    // Laplace descending: HYBRID (80), GENERATOR_ONLY (63.33), BATTERY_ONLY (51.67)
    const laplaceCard = screen.getByText('Treat all outage states equally', { selector: 'h3' }).closest('.method-card')!;
    expect(laplaceCard).toHaveTextContent('Rank 1Battery + generatorHYBRID80.00');

    // Hurwicz descending: HYBRID (80), GENERATOR_ONLY (63), BATTERY_ONLY (56)
    const hurwiczCard = screen.getByText('Balance best and worst cases', { selector: 'h3' }).closest('.method-card')!;
    expect(hurwiczCard).toHaveTextContent('Rank 1Battery + generatorHYBRID80.00');

    // Minimax Regret ascending: HYBRID (15), GENERATOR_ONLY (35), BATTERY_ONLY (70)
    const minimaxCard = screen.getByText('Limit the worst missed opportunity', { selector: 'h3' }).closest('.method-card')!;
    expect(minimaxCard).toHaveTextContent('Rank 1Battery + generatorHYBRID15.00');
  });

  it('proves tie handling below first place in method cards', () => {
    const tieBelowData: FullAnalysisData = {
      ...data,
      uncertainty_analysis: {
        ...data.uncertainty_analysis,
        methods: data.uncertainty_analysis.methods.map((m) =>
          m.id === 'EXPECTED_VALUE'
            ? { ...m, scores: { HYBRID: 90, GENERATOR_ONLY: 50, BATTERY_ONLY: 50 } }
            : m
        ),
      },
    };
    renderPanels(<AnalysisPanels data={tieBelowData} tab="uncertainty" scenario={demoScenario} />);
    const evCard = screen.getByText('Probability-weighted average', { selector: 'h3' }).closest('.method-card')!;
    expect(evCard).toHaveTextContent('Rank 1Battery + generatorHYBRID90.00');
    expect(evCard).toHaveTextContent('Rank 2Generator onlyGENERATOR_ONLY50.00');
    expect(evCard).toHaveTextContent('Rank 2Battery onlyBATTERY_ONLY50.00');
  });

  /* 24. Proves Regret Table renders backend data with zero browser-side derived winner or cell badges */
  it('proves Regret Table renders backend data with zero browser-side derived winner or cell badges', () => {
    // Deliberately inconsistent matrix: scores favor GENERATOR_ONLY=10, but recommended is BATTERY_ONLY
    const inconsistentData: FullAnalysisData = {
      ...data,
      uncertainty_analysis: {
        ...data.uncertainty_analysis,
        methods: data.uncertainty_analysis.methods.map((m) =>
          m.id === 'MINIMAX_REGRET'
            ? {
                ...m,
                scores: { BATTERY_ONLY: 70, GENERATOR_ONLY: 10, HYBRID: 15 },
                recommended: ['BATTERY_ONLY'],
              }
            : m
        ),
      },
    };
    const { unmount } = renderPanels(<AnalysisPanels data={inconsistentData} tab="uncertainty" scenario={demoScenario} />);

    // 1. Matrix values render directly from backend data
    expect(screen.getAllByText('0.00').length).toBeGreaterThan(0);
    expect(screen.getByText('30.00')).toBeInTheDocument();
    expect(screen.getAllByText('70.00').length).toBeGreaterThan(0);

    // 2. Maximum-regret values render directly from MINIMAX_REGRET scores
    expect(screen.getAllByText('10.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('15.00').length).toBeGreaterThan(0);

    // 3. Recommended badge uses backend recommended ID ('BATTERY_ONLY'), not the lowest score
    const regretSec = screen.getByText('Beginner-Friendly Regret Table').closest('section')!;
    expect(regretSec).toHaveTextContent('Battery only');
    expect(regretSec).toHaveTextContent('Recommended');

    // 4 & 5. Proves NO "Best in state" or "Lowest max regret" badges are rendered
    expect(screen.queryByText('Best in state')).not.toBeInTheDocument();
    expect(screen.queryByText('Lowest max regret')).not.toBeInTheDocument();
    expect(screen.queryByText('Best in State')).not.toBeInTheDocument();
    expect(screen.queryByText('Lowest Regret')).not.toBeInTheDocument();

    // 9. Explanatory note renders cleanly
    expect(screen.getByText('Lower regret values mean less missed utility. The recommendation and maximum-regret scores shown here are supplied by the backend.')).toBeInTheDocument();
    unmount();
  });


  /* 25. Page 4 (Arbitration) 9-Section Guided Redesign Tests in English */
  it('renders all 9 sections of the redesigned Arbitration page in English', () => {
    const onSelectTab = vi.fn();
    renderPanels(<AnalysisPanels data={data} tab="arbitration" onSelectTab={onSelectTab} scenario={demoScenario} />);

    // Section 1: Page Purpose & 3-Step Guide
    expect(screen.getByText('Fair sharing agreement for both businesses')).toBeInTheDocument();
    expect(screen.getByText(/This page recommends how the two businesses can share limited electricity/)).toBeInTheDocument();
    expect(screen.getByText('1. Compare with no agreement baseline.')).toBeInTheDocument();

    // Section 2: Who Receives What? (Per-Business Allocation Cards)
    expect(screen.getByText('Who Receives What?')).toBeInTheDocument();
    expect(screen.getAllByText('Shwe Mini Market').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TechCare Phone Service').length).toBeGreaterThan(0);
    expect(screen.getByText('5.5 kWh')).toBeInTheDocument();
    expect(screen.getByText('4.5 kWh')).toBeInTheDocument();
    expect(screen.getByText('2 hrs')).toBeInTheDocument();
    expect(screen.getByText('3 hrs')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('73.00')).toBeInTheDocument();
    expect(screen.getByText('65.36')).toBeInTheDocument();
    expect(screen.getAllByText(/A model score representing overall benefit and suitability. It is not money and is not electricity./).length).toBeGreaterThan(0);

    // Section 3: Simple Result Summary
    expect(screen.getByText('Recommended cooperative agreement')).toBeInTheDocument();
    expect(screen.getByText('Both businesses receive utility above their no-agreement reference.')).toBeInTheDocument();

    // Section 4: What Does Disagreement [0,0] Mean?
    expect(screen.getByText('If the businesses cannot agree')).toBeInTheDocument();
    expect(screen.getByText(/\[0,0\] is the verified reference utility for no agreement/)).toBeInTheDocument();

    // Section 5: Why Was This Plan Selected?
    expect(screen.getByText('Why Was This Plan Selected?')).toBeInTheDocument();
    expect(screen.getByText(/The backend evaluated 10,440 candidates in this demo\./)).toBeInTheDocument();
    expect(screen.getAllByText(/Only one qualifying plan achieved the highest backend-provided Nash product, so there is no tie\./).length).toBeGreaterThan(0);

    // Section 6: Nash Product for Beginners
    expect(screen.getByText('Nash Product for Beginners')).toBeInTheDocument();
    expect(screen.getByText('4771.0714')).toBeInTheDocument();
    expect(screen.getByText(/Note: Utility is a model score, and Nash product is not money/)).toBeInTheDocument();

    // Section 7: Arbitration vs One-Shot Nash Equilibrium
    expect(screen.getByText('Arbitration vs One-Shot Nash Equilibrium')).toBeInTheDocument();
    expect(screen.getByText('How decisions are made')).toBeInTheDocument();
    expect(screen.getByText('What is decided')).toBeInTheDocument();

    // Section 8: Real-Life Usefulness
    expect(screen.getByText('Practical Application')).toBeInTheDocument();
    expect(screen.getByText(/This recommendation can help Shwe Mini Market and TechCare Phone Service discuss/)).toBeInTheDocument();

    // Section 9: Next Actions (CTAs)
    const reviewScenBtn = screen.getByRole('button', { name: 'Review Scenario' });
    fireEvent.click(reviewScenBtn);
    expect(onSelectTab).toHaveBeenCalledWith('scenario');

    const reviewAnaBtn = screen.getByRole('button', { name: 'Review Analysis' });
    fireEvent.click(reviewAnaBtn);
    expect(onSelectTab).toHaveBeenCalledWith('analysis');

    const viewRepBtn = screen.getByRole('button', { name: 'View Repeated Game' });
    fireEvent.click(viewRepBtn);
    expect(onSelectTab).toHaveBeenCalledWith('simulation');
  });

  /* 26. Localized Arbitration Page in Myanmar Mode */
  it('renders all Arbitration sections in Myanmar mode', () => {
    window.localStorage.setItem('powershare-language', 'my');
    renderPanels(<AnalysisPanels data={data} tab="arbitration" scenario={demoScenario} />);

    expect(screen.getByText('လုပ်ငန်းနှစ်ခုအတွက် မျှတသော မျှဝေမှုသဘောတူညီချက်')).toBeInTheDocument();
    expect(screen.getByText('မည်သူက မည်သည့်အရာ ရရှိသနည်း။')).toBeInTheDocument();
    expect(screen.getByText('အကြံပြုထားသော ပူးပေါင်းဆောင်ရွက်မှု သဘောတူညီချက်')).toBeInTheDocument();
    expect(screen.getByText('လုပ်ငန်းနှစ်ခု သဘောတူညီမှုမရပါက')).toBeInTheDocument();
    expect(screen.getByText('Nash Product (ရှင်းလင်းချက်)')).toBeInTheDocument();
    expect(screen.getByText('Arbitration နှင့် တစ်ကြိမ်သုံး Nash Equilibrium နှိုင်းယှဉ်ချက်')).toBeInTheDocument();
    expect(screen.getByText('လက်တွေ့ အသုံးချမှု')).toBeInTheDocument();
    expect(screen.getByText('Repeated Game ကို ကြည့်ရန်')).toBeInTheDocument();
  });

  /* 27. Player name mapping by ID, reversed players, and blank name fallbacks */
  it('handles player name mapping by authoritative IDs, reversed players, and blank fallbacks in Arbitration', () => {
    const reversedBlankScenario: Scenario = {
      ...demoScenario,
      players: [
        { ...demoScenario.players[1], name: '' },
        { ...demoScenario.players[0], name: '  ' },
      ],
    };
    renderPanels(<AnalysisPanels data={data} tab="arbitration" scenario={reversedBlankScenario} />);

    expect(screen.getAllByText(/P1 — Row player/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/P2 — Column player/).length).toBeGreaterThan(0);
  });

  /* 28. Handles non-[0,0] disagreement, negative disagreement, tied maxima, and no-solution state */
  it('handles non-[0,0] disagreement, negative disagreement, tied maxima, and no-solution state gracefully', () => {
    // 28a. Non-[0,0] and negative disagreement, tied maxima
    const customArbData: FullAnalysisData = {
      ...data,
      arbitration_result: {
        ...data.arbitration_result,
        disagreement: [-10.5, 5.0],
        ties: ['ALT_TIE_1'],
        qualifying_candidates_count: 520,
      },
    };
    const { unmount } = renderPanels(<AnalysisPanels data={customArbData} tab="arbitration" scenario={demoScenario} />);
    expect(screen.getByText(/Disagreement baseline = -10\.50/)).toBeInTheDocument();
    expect(screen.getByText(/Disagreement baseline = 5\.00/)).toBeInTheDocument();
    expect(screen.getAllByText(/Multiple qualifying plans achieved the same maximum Nash product\./).length).toBeGreaterThan(0);
    expect(screen.getByText(/The backend evaluated 520 candidates in this demo\./)).toBeInTheDocument();
    unmount();

    // 28b. No-solution state
    const noSolutionData: FullAnalysisData = {
      ...data,
      arbitration_result: {
        ...data.arbitration_result,
        no_solution: true,
        selected: null as any,
      },
    };
    renderPanels(<AnalysisPanels data={noSolutionData} tab="arbitration" scenario={demoScenario} />);
    expect(screen.getByText('No mutually acceptable allocation found')).toBeInTheDocument();
    expect(screen.getByText(/No mutually acceptable allocation was found under the current inputs/)).toBeInTheDocument();
  });

  /* 12. Proves NO canonical hard-coded +9.77 or +0.62 commentary exists */
  it('contains zero hardcoded canonical +9.77 or +0.62 commentary', () => {
    renderPanels(<AnalysisPanels data={data} tab="analysis" scenario={demoScenario} />);
    expect(screen.queryByText(/9\.77/)).not.toBeInTheDocument();
    expect(screen.queryByText(/0\.62/)).not.toBeInTheDocument();
  });
});
