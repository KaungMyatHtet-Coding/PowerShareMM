export type ApiMode = 'live' | 'mock';

export interface Player {
  id: 'P1' | 'P2';
  name: string;
  business_type: string;
  demand_kwh: number;
  essential_kwh: number;
  desired_hours: number;
  outage_loss_mmk: number;
  urgency: number;
  risk_preference: number;
  preferred_cost_share: number;
}

export interface NatureState { id: string; duration_hours: number; probability: number; }
export interface Decision { id: string; utilities: Record<string, number>; }
export interface Scenario {
  id: string;
  name: string;
  players: [Player, Player];
  resource: {
    resource_type: string; capacity_kwh: number; available_hours: number;
    total_cost_mmk: number; max_safe_load_kw: number; slot_duration_hours: number;
    overload_penalty: number; violation_penalty: number;
  };
  uncertainty_fixture: {
    fixture_type: string; nature_states: NatureState[]; decisions: Decision[]; hurwicz_alpha: number;
  };
}

export interface Outcome { id: string; strategies?: string[]; allocation?: { energy_kwh: number[]; hours: number[] }; cost?: { shares: number[]; amounts_mmk: number[] }; penalties?: { overload: number[]; violation: number[] }; utilities: number[]; display_utilities?: number[]; feasible?: boolean; }
export interface PayoffCell { outcome_id: string; row_strategy?: string; column_strategy?: string; utilities: number[]; }
export interface PayoffMatrix { row_player: string; column_player: string; row_strategies: string[]; column_strategies: string[]; cells: PayoffCell[]; }
export interface MethodResult { id: string; scores: Record<string, number>; recommended: string[]; ties: string[]; explanation: string; score_direction?: string; }
export interface UncertaintyAnalysis { fixture_type: string; probability_total: number; hurwicz_alpha: number; regret_matrix: Record<string, Record<string, number>>; methods: MethodResult[]; }
export interface ArbitrationSelection { candidate_id: string; allocation: { energy_kwh: number[]; hours: number[] }; cost_shares: number[]; utilities: number[]; gains: number[]; nash_product: number; }
export interface ArbitrationResult { disagreement: number[]; selected: ArbitrationSelection | null; ties: string[]; qualifying_candidates_count: number; no_solution: boolean; verification_status: string; temporary_mock?: boolean; explanations: string[]; }
export interface RepeatedResult { fixture_id: string; rounds: number; seed: number; player_strategies: string[]; history: unknown[]; total_payoffs: number[]; average_payoffs: number[]; cooperation_rates: number[]; educational_fixture: boolean; }
export interface FinalRecommendation { outcome_id: string | null; energy_kwh: number[]; hours: number[]; cost_shares: number[]; matrix_basis_status: string; arbitration_status: string; explanation: string; }
export interface FullAnalysisData {
  scenario_id: string; analysis_status?: string; strategies?: string[]; outcomes: Outcome[]; payoff_matrix: PayoffMatrix;
  dominated_strategies: Array<{ player_id: string; strategy: string; dominated_by: string; kind: string }>;
  best_responses: Record<string, Record<string, string[]>>;
  pure_nash_equilibria: Array<{ outcome_id: string; utilities: number[] }>;
  pareto_optimal_outcomes: Array<{ outcome_id: string; utilities: number[] }>;
  prisoners_dilemma: { detected: boolean; type?: string | null; failed_conditions: string[]; explanation?: string };
  uncertainty_analysis: UncertaintyAnalysis; arbitration_result: ArbitrationResult;
  repeated_game_result: RepeatedResult | null; final_recommendation: FinalRecommendation; explanations: string[]; warnings?: string[];
}
export interface Envelope<T> { data: T; warnings: string[]; meta: { method: string; version: string; [key: string]: unknown } }
export interface ApiErrorBody { error: { code: string; message: string; field?: string | null; correction?: string | null } }
