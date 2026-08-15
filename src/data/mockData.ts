import type {
  ScenarioInput,
  FullAnalysisResponse,
  PayoffMatrix,
  PayoffCell,
  OutcomeKey,
} from '@/types';

// Base scenario mirroring sample-data/mock-full-analysis-response.json:
// Mini Market claims 6 kWh, Phone Shop claims 7 kWh, shared capacity = 10 kWh.
export const defaultScenario: ScenarioInput = {
  capacity: 10,
  players: [
    {
      id: 'mini_market',
      name: 'Mini Market',
      demand: 6,
      costContribution: 30000,
      outageLoss: 15000,
    },
    {
      id: 'phone_shop',
      name: 'Phone Shop',
      demand: 7,
      costContribution: 35000,
      outageLoss: 18000,
    },
  ],
  outageDurations: [2, 4, 6, 8],
  hurwiczAlpha: 0.4,
};

// Precomputed payoff matrix for the default scenario.
// C = Cooperate (share fairly), M = Monopolize (grab as much as possible).
// Payoffs are in MMK (Myanmar Kyat), net of outage loss and cost.
const payoffCells: Record<OutcomeKey, PayoffCell> = {
  CC: { mm: 60000, ps: 70000 }, // both cooperate: fair proportional share
  CM: { mm: 45000, ps: 90000 }, // MM cooperates, PS monopolizes: PS grabs more
  MC: { mm: 95000, ps: 40000 }, // MM monopolizes, PS cooperates: MM grabs more
  MM: { mm: 20000, ps: 22000 }, // both monopolize: conflict, wasted capacity
};

const payoffMatrix: PayoffMatrix = {
  cells: payoffCells,
  nashEquilibria: ['MM'],
  paretoOptimal: ['CC', 'CM', 'MC'],
  nashEquilibriumType: 'prisoners_dilemma',
};

export const mockFullAnalysis: FullAnalysisResponse = {
  scenario: defaultScenario,
  payoffMatrix,
  uncertainty: {
    states: defaultScenario.outageDurations,
    payoffTable: {
      C: [60000, 90000, 120000, 150000],
      M: [75000, 100000, 125000, 150000],
    },
    results: [
      {
        criterion: 'expected_value',
        recommendedStrategy: 'M',
        rationale:
          'Monopolizing yields the highest expected payoff across equally likely outage durations.',
        values: { C: 105000, M: 112500 },
      },
      {
        criterion: 'maximin',
        recommendedStrategy: 'C',
        rationale:
          "Cooperating has the best worst-case outcome (Wald's pessimistic criterion).",
        values: { C: 60000, M: 75000 },
      },
      {
        criterion: 'maximax',
        recommendedStrategy: 'M',
        rationale: 'Monopolizing has the highest best-case outcome.',
        values: { C: 150000, M: 150000 },
      },
      {
        criterion: 'laplace',
        recommendedStrategy: 'M',
        rationale:
          'Under equal probability assumption, monopolizing has the higher average.',
        values: { C: 105000, M: 112500 },
      },
      {
        criterion: 'minimax_regret',
        recommendedStrategy: 'C',
        rationale:
          'Cooperating minimizes the maximum regret across all outage states.',
        values: { C: 15000, M: 22500 },
      },
      {
        criterion: 'hurwicz',
        recommendedStrategy: 'M',
        rationale:
          'With alpha=0.4 (slightly pessimistic), monopolizing has the higher weighted value.',
        values: { C: 102000, M: 111000 },
      },
    ],
  },
  arbitration: {
    disagreementPoint: { mm: 20000, ps: 22000 },
    negotiationSet: [
      { mm: 20000, ps: 22000 },
      { mm: 30000, ps: 70000 },
      { mm: 40000, ps: 60000 },
      { mm: 60000, ps: 50000 },
      { mm: 60000, ps: 70000 },
      { mm: 70000, ps: 55000 },
      { mm: 80000, ps: 45000 },
    ],
    maxProductPoint: { mm: 60000, ps: 70000 },
    gainOverDisagreement: { mm: 40000, ps: 48000 },
    feasible: true,
  },
  repeatedGames: [
    {
      strategyName: 'Tit-for-Tat',
      turns: [
        { day: 1, miniMarket: 'C', phoneShop: 'C', mmPayoff: 60000, psPayoff: 70000, mmCumulative: 60000, psCumulative: 70000 },
        { day: 2, miniMarket: 'C', phoneShop: 'C', mmPayoff: 60000, psPayoff: 70000, mmCumulative: 120000, psCumulative: 140000 },
        { day: 3, miniMarket: 'M', phoneShop: 'C', mmPayoff: 95000, psPayoff: 40000, mmCumulative: 215000, psCumulative: 180000 },
        { day: 4, miniMarket: 'C', phoneShop: 'M', mmPayoff: 45000, psPayoff: 90000, mmCumulative: 260000, psCumulative: 270000 },
        { day: 5, miniMarket: 'C', phoneShop: 'C', mmPayoff: 60000, psPayoff: 70000, mmCumulative: 320000, psCumulative: 340000 },
      ],
      mmTotal: 320000,
      psTotal: 340000,
      cooperationRate: 0.8,
    },
    {
      strategyName: 'Always Defect',
      turns: [
        { day: 1, miniMarket: 'M', phoneShop: 'M', mmPayoff: 20000, psPayoff: 22000, mmCumulative: 20000, psCumulative: 22000 },
        { day: 2, miniMarket: 'M', phoneShop: 'M', mmPayoff: 20000, psPayoff: 22000, mmCumulative: 40000, psCumulative: 44000 },
        { day: 3, miniMarket: 'M', phoneShop: 'M', mmPayoff: 20000, psPayoff: 22000, mmCumulative: 60000, psCumulative: 66000 },
        { day: 4, miniMarket: 'M', phoneShop: 'M', mmPayoff: 20000, psPayoff: 22000, mmCumulative: 80000, psCumulative: 88000 },
        { day: 5, miniMarket: 'M', phoneShop: 'M', mmPayoff: 20000, psPayoff: 22000, mmCumulative: 100000, psCumulative: 110000 },
      ],
      mmTotal: 100000,
      psTotal: 110000,
      cooperationRate: 0.0,
    },
    {
      strategyName: 'Grim Trigger',
      turns: [
        { day: 1, miniMarket: 'C', phoneShop: 'C', mmPayoff: 60000, psPayoff: 70000, mmCumulative: 60000, psCumulative: 70000 },
        { day: 2, miniMarket: 'C', phoneShop: 'C', mmPayoff: 60000, psPayoff: 70000, mmCumulative: 120000, psCumulative: 140000 },
        { day: 3, miniMarket: 'C', phoneShop: 'C', mmPayoff: 60000, psPayoff: 70000, mmCumulative: 180000, psCumulative: 210000 },
        { day: 4, miniMarket: 'C', phoneShop: 'C', mmPayoff: 60000, psPayoff: 70000, mmCumulative: 240000, psCumulative: 280000 },
        { day: 5, miniMarket: 'C', phoneShop: 'C', mmPayoff: 60000, psPayoff: 70000, mmCumulative: 300000, psCumulative: 350000 },
      ],
      mmTotal: 300000,
      psTotal: 350000,
      cooperationRate: 1.0,
    },
  ],
  sequentialGame: {
    id: 'root',
    player: 'mini_market',
    children: [
      {
        id: 'c',
        player: 'phone_shop',
        strategy: 'C',
        label: 'Cooperate',
        isEquilibrium: false,
        children: [
          {
            id: 'cc',
            player: 'terminal',
            strategy: 'C',
            label: 'Cooperate',
            isEquilibrium: false,
            payoff: payoffCells.CC,
            children: [],
          },
          {
            id: 'cm',
            player: 'terminal',
            strategy: 'M',
            label: 'Monopolize',
            isEquilibrium: false,
            payoff: payoffCells.CM,
            children: [],
          },
        ],
      },
      {
        id: 'm',
        player: 'phone_shop',
        strategy: 'M',
        label: 'Monopolize',
        isEquilibrium: false,
        children: [
          {
            id: 'mc',
            player: 'terminal',
            strategy: 'C',
            label: 'Cooperate',
            isEquilibrium: false,
            payoff: payoffCells.MC,
            children: [],
          },
          {
            id: 'mm',
            player: 'terminal',
            strategy: 'M',
            label: 'Monopolize',
            isEquilibrium: true,
            payoff: payoffCells.MM,
            children: [],
          },
        ],
      },
    ],
    label: 'Mini Market moves first',
    isEquilibrium: false,
  },
  summary: {
    headline: { key: 'headline_pd' },
    findings: [
      {
        key: 'finding_nash',
        vars: {
          nash: 'outcome_MM',
          mm: '20,000',
          ps: '22,000'
        }
      },
      {
        key: 'finding_coop',
        vars: {
          mm: '60,000',
          ps: '70,000',
          paretoStatus: 'pareto_optimal_status',
          unstable: 'unstable_enforcement'
        }
      },
      { key: 'finding_uncertainty' },
      { key: 'finding_arbitration' },
      { key: 'finding_repeated' },
    ],
    recommendation: { key: 'rec_pd' },
    riskLevel: 'high',
  },
  warnings: [
    { key: 'warn_illustrative' },
    { key: 'warn_rational' },
    { key: 'warn_divisible' },
    { key: 'warn_horizon' },
  ],
  assumptions: [
    { key: 'assum_two_players' },
    { key: 'assum_knowledge' },
    { key: 'assum_uncertainty' },
    { key: 'assum_linear' },
    { key: 'assum_no_enforcement' },
  ],
};
