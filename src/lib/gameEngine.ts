import type {
  ScenarioInput,
  FullAnalysisResponse,
  PayoffMatrix,
  PayoffCell,
  OutcomeKey,
  Strategy,
  UncertaintyAnalysis,
  UncertaintyResult,
  ArbitrationResult,
  RepeatedGameResult,
  RepeatedGameTurn,
  SequentialGameNode,
  AnalysisSummary,
} from '@/types';

/**
 * Game-theory engine — authoritative math layer.
 *
 * The UI NEVER computes payoffs; it only renders what this module (or the
 * backend in Live mode) produces. All formulas follow standard game-theory
 * definitions:
 *
 *  - Payoffs: proportional kWh share when cooperating, grab when monopolizing,
 *    reduced by cost contribution and outage loss.
 *  - Nash equilibrium: best response for both players simultaneously.
 *  - Pareto optimal: no other cell weakly dominates in both components.
 *  - Uncertainty: EV, Maximin, Maximax, Laplace, Minimax Regret, Hurwicz.
 *  - Nash Arbitration: maximize (mm - d_mm) * (ps - d_ps) over feasible set.
 *  - Repeated games: Tit-for-Tat, Always Defect, Grim Trigger over N days.
 *  - Sequential game: backward induction on the 2x2 tree.
 */

const MMK_PER_KWH = 10000; // revenue per kWh delivered (illustrative)

interface ComputedPayoffs {
  cells: Record<OutcomeKey, PayoffCell>;
}

function computePayoffCells(scenario: ScenarioInput): ComputedPayoffs {
  const [mm, ps] = scenario.players;
  const cap = scenario.capacity;
  const totalDemand = mm.demand + ps.demand;

  // Proportional share when cooperating.
  const mmShare = totalDemand > 0 ? (mm.demand / totalDemand) * cap : cap / 2;
  const psShare = totalDemand > 0 ? (ps.demand / totalDemand) * cap : cap / 2;

  // When one monopolizes, they grab up to their demand (bounded by capacity).
  const mmGrab = Math.min(mm.demand, cap);
  const psGrab = Math.min(ps.demand, cap);
  // If one monopolizes and the other cooperates, the monopolizer takes their grab
  // and the cooperator gets the remainder.
  const mmRemainderAfterPsGrab = Math.max(0, cap - psGrab);
  const psRemainderAfterMmGrab = Math.max(0, cap - mmGrab);

  const payoff = (kwh: number, player: typeof mm): number => {
    const revenue = kwh * MMK_PER_KWH;
    return Math.round(revenue - player.costContribution);
  };

  return {
    cells: {
      CC: { mm: payoff(mmShare, mm), ps: payoff(psShare, ps) },
      CM: {
        mm: payoff(mmRemainderAfterPsGrab, mm),
        ps: payoff(psGrab, ps),
      },
      MC: {
        mm: payoff(mmGrab, mm),
        ps: payoff(psRemainderAfterMmGrab, ps),
      },
      // Both monopolize: conflict wastes capacity (each gets half of min grab).
      MM: {
        mm: payoff(Math.min(mm.demand, cap) / 2, mm),
        ps: payoff(Math.min(ps.demand, cap) / 2, ps),
      },
    },
  };
}

function isBestResponse(
  cells: Record<OutcomeKey, PayoffCell>,
  key: OutcomeKey,
  player: 'mm' | 'ps',
): boolean {
  const current = cells[key][player];
  // Find the alternative outcome where the *other* player's strategy is fixed.
  const myStrategy = key[0] === 'C' ? player === 'mm' ? 'M' : key[0] : key[0];
  // Simpler: enumerate the two outcomes for this player given other fixed.
  const otherStrategy = player === 'mm' ? key[1] : key[0];
  const altKey: OutcomeKey =
    player === 'mm'
      ? (`${myStrategy}${otherStrategy}` as OutcomeKey)
      : (`${otherStrategy}${myStrategy}` as OutcomeKey);
  return current >= cells[altKey][player];
}

function findNashEquilibria(
  cells: Record<OutcomeKey, PayoffCell>,
): OutcomeKey[] {
  const keys: OutcomeKey[] = ['CC', 'CM', 'MC', 'MM'];
  return keys.filter(
    (k) =>
      isBestResponse(cells, k, 'mm') && isBestResponse(cells, k, 'ps'),
  );
}

function findParetoOptimal(
  cells: Record<OutcomeKey, PayoffCell>,
): OutcomeKey[] {
  const keys: OutcomeKey[] = ['CC', 'CM', 'MC', 'MM'];
  return keys.filter((k) => {
    const cell = cells[k];
    return !keys.some((other) => {
      if (other === k) return false;
      const oc = cells[other];
      // Pareto-dominated if another cell is >= in both and > in at least one.
      return (
        oc.mm >= cell.mm &&
        oc.ps >= cell.ps &&
        (oc.mm > cell.mm || oc.ps > cell.ps)
      );
    });
  });
}

function classifyGame(
  nash: OutcomeKey[],
  pareto: OutcomeKey[],
): PayoffMatrix['nashEquilibriumType'] {
  if (nash.length === 1 && nash[0] === 'MM' && pareto.includes('CC')) {
    return 'prisoners_dilemma';
  }
  if (nash.length === 1 && pareto.includes(nash[0])) return 'harmony';
  if (nash.length >= 2) return 'coordination';
  return 'other';
}

function computePayoffMatrix(scenario: ScenarioInput): PayoffMatrix {
  const { cells } = computePayoffCells(scenario);
  const nashEquilibria = findNashEquilibria(cells);
  const paretoOptimal = findParetoOptimal(cells);
  return {
    cells,
    nashEquilibria,
    paretoOptimal,
    nashEquilibriumType: classifyGame(nashEquilibria, paretoOptimal),
  };
}

function computeUncertainty(
  scenario: ScenarioInput,
  cells: Record<OutcomeKey, PayoffCell>,
): UncertaintyAnalysis {
  const states = scenario.outageDurations;
  // Payoff per strategy scales linearly with outage duration.
  // Use the single-shot payoffs as per-hour-of-outage benefits.
  const perHour: Record<Strategy, number> = {
    C: (cells.CC.mm + cells.CC.ps) / 2, // average coop payoff as per-hour proxy
    M: (cells.MC.mm + cells.CM.ps) / 2, // average defect payoff as per-hour proxy
  };

  const payoffTable: Record<Strategy, number[]> = {
    C: states.map((h) => Math.round(perHour.C * h)),
    M: states.map((h) => Math.round(perHour.M * h)),
  };

  const results: UncertaintyResult[] = [];

  // Expected Value (assume uniform probabilities).
  const evC = avg(payoffTable.C);
  const evM = avg(payoffTable.M);
  results.push({
    criterion: 'expected_value',
    recommendedStrategy: evM >= evC ? 'M' : 'C',
    rationale:
      evM >= evC
        ? 'Monopolizing yields the highest expected payoff across equally likely outage durations.'
        : 'Cooperating yields the highest expected payoff across equally likely outage durations.',
    values: { C: Math.round(evC), M: Math.round(evM) },
  });

  // Maximin (Wald)
  const maxMinC = Math.min(...payoffTable.C);
  const maxMinM = Math.min(...payoffTable.M);
  results.push({
    criterion: 'maximin',
    recommendedStrategy: maxMinC >= maxMinM ? 'C' : 'M',
    rationale:
      maxMinC >= maxMinM
        ? "Cooperating has the best worst-case outcome (Wald's pessimistic criterion)."
        : 'Monopolizing has the best worst-case outcome.',
    values: { C: maxMinC, M: maxMinM },
  });

  // Maximax
  const maxMaxC = Math.max(...payoffTable.C);
  const maxMaxM = Math.max(...payoffTable.M);
  results.push({
    criterion: 'maximax',
    recommendedStrategy: maxMaxM >= maxMaxC ? 'M' : 'C',
    rationale: 'Monopolizing has the highest best-case outcome.',
    values: { C: maxMaxC, M: maxMaxM },
  });

  // Laplace
  const lapC = avg(payoffTable.C);
  const lapM = avg(payoffTable.M);
  results.push({
    criterion: 'laplace',
    recommendedStrategy: lapM >= lapC ? 'M' : 'C',
    rationale:
      'Under equal probability assumption, the recommended strategy has the higher average.',
    values: { C: Math.round(lapC), M: Math.round(lapM) },
  });

  // Minimax Regret (Savage)
  const regretsC = states.map((_, i) => Math.max(payoffTable.C[i], payoffTable.M[i]) - payoffTable.C[i]);
  const regretsM = states.map((_, i) => Math.max(payoffTable.C[i], payoffTable.M[i]) - payoffTable.M[i]);
  const maxRegretC = Math.max(...regretsC);
  const maxRegretM = Math.max(...regretsM);
  results.push({
    criterion: 'minimax_regret',
    recommendedStrategy: maxRegretC <= maxRegretM ? 'C' : 'M',
    rationale:
      maxRegretC <= maxRegretM
        ? 'Cooperating minimizes the maximum regret across all outage states.'
        : 'Monopolizing minimizes the maximum regret across all outage states.',
    values: { C: maxRegretC, M: maxRegretM },
  });

  // Hurwicz
  const alpha = scenario.hurwiczAlpha;
  const hurC = alpha * maxMaxC + (1 - alpha) * Math.min(...payoffTable.C);
  const hurM = alpha * maxMaxM + (1 - alpha) * Math.min(...payoffTable.M);
  results.push({
    criterion: 'hurwicz',
    recommendedStrategy: hurM >= hurC ? 'M' : 'C',
    rationale: `With alpha=${alpha}, the recommended strategy has the higher weighted value.`,
    values: { C: Math.round(hurC), M: Math.round(hurM) },
  });

  return { states, payoffTable, results };
}

function computeArbitration(
  cells: Record<OutcomeKey, PayoffCell>,
  nash: OutcomeKey[],
): ArbitrationResult {
  const disagreement = nash.includes('MM') ? cells.MM : cells[nash[0] ?? 'MM'];
  // Build negotiation set from all Pareto-optimal cells.
  const paretoKeys = findParetoOptimal(cells);
  const negotiationSet = paretoKeys.map((k) => cells[k]);

  // Max-product point: maximize (mm - d.mm) * (ps - d.ps) over negotiation set.
  let best = cells.CC;
  let bestProduct = -Infinity;
  for (const point of negotiationSet) {
    const gainMm = point.mm - disagreement.mm;
    const gainPs = point.ps - disagreement.ps;
    if (gainMm <= 0 || gainPs <= 0) continue;
    const product = gainMm * gainPs;
    if (product > bestProduct) {
      bestProduct = product;
      best = point;
    }
  }

  return {
    disagreementPoint: disagreement,
    negotiationSet,
    maxProductPoint: best,
    gainOverDisagreement: {
      mm: best.mm - disagreement.mm,
      ps: best.ps - disagreement.ps,
    },
    feasible: bestProduct > 0,
  };
}

function computeRepeatedGames(
  cells: Record<OutcomeKey, PayoffCell>,
  days = 5,
): RepeatedGameResult[] {
  const strategies: {
    name: string;
    mmStrat: (day: number, oppPrev: Strategy) => Strategy;
    psStrat: (day: number, oppPrev: Strategy) => Strategy;
    isGrim?: boolean;
  }[] = [
    {
      name: 'Tit-for-Tat',
      mmStrat: (day, oppPrev) => (day === 1 ? 'C' : oppPrev),
      psStrat: (day, oppPrev) => (day === 1 ? 'C' : oppPrev),
    },
    {
      name: 'Always Defect',
      mmStrat: () => 'M',
      psStrat: () => 'M',
    },
    {
      name: 'Grim Trigger',
      mmStrat: () => 'C',
      psStrat: () => 'C',
      isGrim: true,
    },
  ];

  return strategies.map((strat) => {
    const turns: RepeatedGameTurn[] = [];
    let mmCum = 0;
    let psCum = 0;
    let mmPrev: Strategy = 'C';
    let psPrev: Strategy = 'C';
    let mmEverDefected = false;
    let psEverDefected = false;
    let coopCount = 0;

    for (let day = 1; day <= days; day++) {
      const mmMove: Strategy =
        strat.isGrim
          ? psEverDefected
            ? 'M'
            : 'C'
          : strat.mmStrat(day, psPrev);
      const psMove: Strategy =
        strat.isGrim
          ? mmEverDefected
            ? 'M'
            : 'C'
          : strat.psStrat(day, mmPrev);

      if (mmMove === 'M') mmEverDefected = true;
      if (psMove === 'M') psEverDefected = true;

      const key = `${mmMove}${psMove}` as OutcomeKey;
      const cell = cells[key];
      mmCum += cell.mm;
      psCum += cell.ps;
      if (mmMove === 'C' && psMove === 'C') coopCount++;
      turns.push({
        day,
        miniMarket: mmMove,
        phoneShop: psMove,
        mmPayoff: cell.mm,
        psPayoff: cell.ps,
        mmCumulative: mmCum,
        psCumulative: psCum,
      });
      mmPrev = mmMove;
      psPrev = psMove;
    }

    return {
      strategyName: strat.name,
      turns,
      mmTotal: mmCum,
      psTotal: psCum,
      cooperationRate: coopCount / days,
    };
  });
}

function computeSequentialGame(
  cells: Record<OutcomeKey, PayoffCell>,
): SequentialGameNode {
  // Mini Market moves first; Phone Shop responds.
  // Backward induction: PS picks best response to MM's move.
  const psBestToC: Strategy = cells.CC.ps >= cells.CM.ps ? 'C' : 'M';
  const psBestToM: Strategy = cells.MC.ps >= cells.MM.ps ? 'C' : 'M';
  // MM anticipates PS's response.
  const mmOutcomeIfC = cells[`${'C'}${psBestToC}` as OutcomeKey];
  const mmOutcomeIfM = cells[`${'M'}${psBestToM}` as OutcomeKey];
  const mmBest: Strategy = mmOutcomeIfM.mm >= mmOutcomeIfC.mm ? 'M' : 'C';
  const eqKey = `${mmBest}${mmBest === 'C' ? psBestToC : psBestToM}` as OutcomeKey;

  const buildTerminal = (mmStrat: Strategy, psStrat: Strategy): SequentialGameNode => {
    const key = `${mmStrat}${psStrat}` as OutcomeKey;
    return {
      id: key.toLowerCase(),
      player: 'terminal',
      strategy: psStrat,
      label: psStrat === 'C' ? 'Cooperate' : 'Monopolize',
      payoff: cells[key],
      children: [],
      isEquilibrium: key === eqKey,
    };
  };

  const buildPSNode = (mmStrat: Strategy): SequentialGameNode => {
    const best = mmStrat === 'C' ? psBestToC : psBestToM;
    return {
      id: mmStrat.toLowerCase(),
      player: 'phone_shop',
      strategy: mmStrat,
      label: mmStrat === 'C' ? 'Cooperate' : 'Monopolize',
      isEquilibrium: false,
      children: [
        buildTerminal(mmStrat, 'C'),
        buildTerminal(mmStrat, 'M'),
      ].map((c) => ({
        ...c,
        isEquilibrium: c.isEquilibrium && (mmStrat === 'C' ? best === 'C' : best === 'M') && c.strategy === best,
      })),
    };
  };

  return {
    id: 'root',
    player: 'mini_market',
    label: 'Mini Market moves first',
    isEquilibrium: false,
    children: [
      { ...buildPSNode('C'), isEquilibrium: mmBest === 'C' },
      { ...buildPSNode('M'), isEquilibrium: mmBest === 'M' },
    ],
  };
}

function computeSummary(
  matrix: PayoffMatrix,
  nash: OutcomeKey[],
): AnalysisSummary {
  const isPD = matrix.nashEquilibriumType === 'prisoners_dilemma';
  return {
    headline: { key: isPD ? 'headline_pd' : 'headline_generic' },
    findings: [
      {
        key: 'finding_nash',
        vars: {
          nash: nash.map((k) => labelOutcome(k)).join(', '),
          mm: matrix.cells[nash[0] ?? 'MM'].mm.toLocaleString(),
          ps: matrix.cells[nash[0] ?? 'MM'].ps.toLocaleString()
        }
      },
      {
        key: 'finding_coop',
        vars: {
          mm: matrix.cells.CC.mm.toLocaleString(),
          ps: matrix.cells.CC.ps.toLocaleString(),
          paretoStatus: matrix.paretoOptimal.includes('CC') ? 'pareto_optimal_status' : 'not_pareto_optimal_status',
          unstable: isPD ? 'unstable_enforcement' : ''
        }
      },
      {
        key: 'finding_pareto',
        vars: {
          outcomes: matrix.paretoOptimal.map((k) => labelOutcome(k)).join(', ')
        }
      },
      { key: 'finding_uncertainty' },
      { key: 'finding_arbitration' },
      { key: 'finding_repeated' },
    ],
    recommendation: { key: isPD ? 'rec_pd' : 'rec_generic' },
    riskLevel: isPD ? 'high' : 'moderate',
  };
}

function labelOutcome(k: OutcomeKey): string {
  const map: Record<OutcomeKey, string> = {
    CC: 'outcome_CC',
    CM: 'outcome_CM',
    MC: 'outcome_MC',
    MM: 'outcome_MM',
  };
  return map[k];
}

function avg(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function computeFullAnalysis(
  scenario: ScenarioInput,
): FullAnalysisResponse {
  const matrix = computePayoffMatrix(scenario);
  const uncertainty = computeUncertainty(scenario, matrix.cells);
  const arbitration = computeArbitration(matrix.cells, matrix.nashEquilibria);
  const repeatedGames = computeRepeatedGames(matrix.cells);
  const sequentialGame = computeSequentialGame(matrix.cells);
  const summary = computeSummary(matrix, matrix.nashEquilibria);

  return {
    scenario,
    payoffMatrix: matrix,
    uncertainty,
    arbitration,
    repeatedGames,
    sequentialGame,
    summary,
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
}
