// Core domain types for the PowerShare decision-support dashboard.

export type Strategy = 'C' | 'M'; // Cooperate / Defect (Monopolize)

export interface PlayerInput {
  id: 'mini_market' | 'phone_shop';
  name: string;
  demand: number; // kWh claimed
  costContribution: number; // money contributed to shared resource
  outageLoss: number; // monetary loss per hour without power
}

export interface ScenarioInput {
  capacity: number; // total kWh available
  players: [PlayerInput, PlayerInput];
  outageDurations: number[]; // hours to analyze under uncertainty
  hurwiczAlpha: number; // optimism parameter [0,1]
}

export interface PayoffCell {
  mm: number; // mini market payoff
  ps: number; // phone shop payoff
}

export type OutcomeKey = 'CC' | 'CM' | 'MC' | 'MM';

export interface PayoffMatrix {
  cells: Record<OutcomeKey, PayoffCell>;
  nashEquilibria: OutcomeKey[];
  paretoOptimal: OutcomeKey[];
  nashEquilibriumType: 'prisoners_dilemma' | 'harmony' | 'coordination' | 'other';
}

export interface UncertaintyResult {
  criterion:
    | 'expected_value'
    | 'maximin'
    | 'maximax'
    | 'laplace'
    | 'minimax_regret'
    | 'hurwicz';
  recommendedStrategy: Strategy;
  rationale: string;
  values: Record<Strategy, number>;
}

export interface UncertaintyAnalysis {
  states: number[]; // outage durations (hours)
  payoffTable: Record<Strategy, number[]>; // payoff per strategy per state
  results: UncertaintyResult[];
}

export interface ArbitrationResult {
  disagreementPoint: PayoffCell; // status quo (Nash equilibrium payoffs)
  negotiationSet: { mm: number; ps: number }[];
  maxProductPoint: PayoffCell;
  gainOverDisagreement: PayoffCell;
  feasible: boolean;
}

export interface RepeatedGameTurn {
  day: number;
  miniMarket: Strategy;
  phoneShop: Strategy;
  mmPayoff: number;
  psPayoff: number;
  mmCumulative: number;
  psCumulative: number;
}

export interface RepeatedGameResult {
  strategyName: string;
  turns: RepeatedGameTurn[];
  mmTotal: number;
  psTotal: number;
  cooperationRate: number;
}

export interface SequentialGameNode {
  id: string;
  player: 'mini_market' | 'phone_shop' | 'terminal';
  strategy?: Strategy;
  payoff?: PayoffCell;
  children: SequentialGameNode[];
  isEquilibrium: boolean;
  label: string;
}

export interface TranslatableMessage {
  key: string;
  vars?: Record<string, string | number>;
}

export interface FullAnalysisResponse {
  scenario: ScenarioInput;
  payoffMatrix: PayoffMatrix;
  uncertainty: UncertaintyAnalysis;
  arbitration: ArbitrationResult;
  repeatedGames: RepeatedGameResult[];
  sequentialGame: SequentialGameNode;
  summary: AnalysisSummary;
  warnings: TranslatableMessage[];
  assumptions: TranslatableMessage[];
}

export interface AnalysisSummary {
  headline: TranslatableMessage;
  findings: TranslatableMessage[];
  recommendation: TranslatableMessage;
  riskLevel: 'low' | 'moderate' | 'high';
}

export type Language = 'en' | 'my';

export type ApiMode = 'mock' | 'live';
