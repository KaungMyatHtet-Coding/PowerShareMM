import type { Language } from '@/types';

export type TranslationKey =
  | 'appName'
  | 'appTagline'
  | 'tab_scenario'
  | 'tab_analysis'
  | 'tab_uncertainty'
  | 'tab_arbitration'
  | 'tab_simulation'
  | 'tab_results'
  | 'language_label'
  | 'mode_mock'
  | 'mode_live'
  | 'mode_label'
  | 'loading'
  | 'error_title'
  | 'empty_title'
  | 'retry'
  | 'scenario_title'
  | 'scenario_desc'
  | 'field_capacity'
  | 'field_capacity_help'
  | 'field_demand'
  | 'field_demand_help'
  | 'field_costContribution'
  | 'field_cost_help'
  | 'field_outageLoss'
  | 'field_outageLoss_help'
  | 'field_outageDurations'
  | 'field_outageDurations_help'
  | 'field_hurwiczAlpha'
  | 'field_hurwicz_help'
  | 'player_mini_market'
  | 'player_phone_shop'
  | 'shop_lights_on'
  | 'shop_lights_off'
  | 'run_analysis'
  | 'running'
  | 'analysis_title'
  | 'analysis_desc'
  | 'payoff_matrix'
  | 'strategy_cooperate'
  | 'strategy_monopolize'
  | 'nash_equilibrium'
  | 'pareto_optimal'
  | 'prisoners_dilemma_explain'
  | 'uncertainty_title'
  | 'uncertainty_desc'
  | 'criterion_expected_value'
  | 'criterion_maximin'
  | 'criterion_maximax'
  | 'criterion_laplace'
  | 'criterion_minimax_regret'
  | 'criterion_hurwicz'
  | 'recommended'
  | 'arbitration_title'
  | 'arbitration_desc'
  | 'disagreement_point'
  | 'max_product_point'
  | 'gain_over_disagreement'
  | 'negotiation_set'
  | 'simulation_title'
  | 'simulation_desc'
  | 'repeated_games'
  | 'sequential_game'
  | 'day'
  | 'cumulative'
  | 'cooperation_rate'
  | 'results_title'
  | 'results_desc'
  | 'findings'
  | 'recommendation'
  | 'assumptions'
  | 'warnings'
  | 'risk_low'
  | 'risk_moderate'
  | 'risk_high'
  | 'help_nash'
  | 'help_pareto'
  | 'help_prisoners'
  | 'help_maximin'
  | 'help_hurwicz'
  | 'help_arbitration'
  | 'help_tit_for_tat'
  | 'help_ev'
  | 'payoff_mm'
  | 'payoff_ps'
  | 'error_demand_exceeds'
  | 'error_capacity_zero'
  | 'error_alpha_range'
  | 'error_field_required'
  | 'status_valid'
  | 'status_invalid'
  | 'total_demand'
  | 'shortfall'
  | 'surplus'
  | 'joint_payoff'
  | 'equilibrium_path'
  | 'strategy_name'
  | 'mm_total'
  | 'ps_total'
  | 'refresh'
  | 'footer_note'
  | 'brand_power'
  | 'brand_share'
  | 'headline_pd'
  | 'headline_generic'
  | 'finding_nash'
  | 'finding_coop'
  | 'finding_pareto'
  | 'finding_uncertainty'
  | 'finding_arbitration'
  | 'finding_repeated'
  | 'rec_pd'
  | 'rec_generic'
  | 'warn_illustrative'
  | 'warn_rational'
  | 'warn_divisible'
  | 'warn_horizon'
  | 'assum_two_players'
  | 'assum_knowledge'
  | 'assum_uncertainty'
  | 'assum_linear'
  | 'assum_no_enforcement'
  | 'outcome_CC'
  | 'outcome_CM'
  | 'outcome_MC'
  | 'outcome_MM'
  | 'pareto_optimal_status'
  | 'not_pareto_optimal_status'
  | 'unstable_enforcement';

type TranslationMap = Record<TranslationKey, string>;

const en: TranslationMap = {
  appName: 'PowerShare',
  appTagline: 'Game-theoretic energy sharing for power outages in Myanmar',
  tab_scenario: 'Scenario',
  tab_analysis: 'Analysis',
  tab_uncertainty: 'Uncertainty',
  tab_arbitration: 'Arbitration',
  tab_simulation: 'Simulation',
  tab_results: 'Results / Theory',
  language_label: 'Language',
  mode_mock: 'Mock',
  mode_live: 'Live',
  mode_label: 'API Mode',
  loading: 'Loading analysis\u2026',
  error_title: 'Something went wrong',
  empty_title: 'No data yet',
  retry: 'Retry',
  scenario_title: 'Scenario Setup',
  scenario_desc:
    'Enter each shop\u2019s power demand, cost contribution, and outage loss. The dashboard computes the game-theoretic outcomes.',
  field_capacity: 'Shared capacity (kWh)',
  field_capacity_help: 'Total battery energy available during the outage.',
  field_demand: 'Demand (kWh)',
  field_demand_help: 'How much power the shop claims it needs.',
  field_costContribution: 'Cost contribution (MMK)',
  field_cost_help: 'Money the shop contributed to the shared battery.',
  field_outageLoss: 'Outage loss (MMK/hr)',
  field_outageLoss_help: 'Revenue lost per hour without power.',
  field_outageDurations: 'Outage durations (hours)',
  field_outageDurations_help:
    'Possible outage lengths to evaluate under uncertainty. Separate with commas.',
  field_hurwiczAlpha: 'Hurwicz alpha',
  field_hurwicz_help:
    'Optimism parameter from 0 (fully pessimistic) to 1 (fully optimistic).',
  player_mini_market: 'Mini Market',
  player_phone_shop: 'Phone Shop',
  shop_lights_on: 'Lights on',
  shop_lights_off: 'Lights off',
  run_analysis: 'Run Analysis',
  running: 'Computing\u2026',
  analysis_title: 'Payoff Matrix & Equilibria',
  analysis_desc:
    'Each cell shows the payoff (MMK) for Mini Market and Phone Shop. Highlighted cells mark Nash equilibria and Pareto-optimal outcomes.',
  payoff_matrix: 'Payoff Matrix',
  strategy_cooperate: 'Cooperate (Share)',
  strategy_monopolize: 'Monopolize (Grab)',
  nash_equilibrium: 'Nash Equilibrium',
  pareto_optimal: 'Pareto Optimal',
  prisoners_dilemma_explain:
    'This is an asymmetric Prisoner\u2019s Dilemma. Each shop\u2019s dominant strategy is to monopolize, but when both do, they end up worse than if both had cooperated. The cooperative outcome is Pareto-optimal but unstable without enforcement.',
  uncertainty_title: 'Games Against Nature',
  uncertainty_desc:
    'When outage duration is uncertain, different decision criteria recommend different strategies. Compare six classical criteria below.',
  criterion_expected_value: 'Expected Value',
  criterion_maximin: "Wald\u2019s Maximin",
  criterion_maximax: 'Maximax',
  criterion_laplace: 'Laplace (Principle of Insufficient Reason)',
  criterion_minimax_regret: 'Minimax Regret (Savage)',
  criterion_hurwicz: 'Hurwicz (Optimism-Pessimism)',
  recommended: 'Recommended strategy',
  arbitration_title: 'Nash Arbitration',
  arbitration_desc:
    'A neutral arbitrator allocates gains from cooperation using the Nash Bargaining Solution: maximize the product of each shop\u2019s gain over the disagreement point.',
  disagreement_point: 'Disagreement (status quo)',
  max_product_point: 'Max-product allocation',
  gain_over_disagreement: 'Gain over disagreement',
  negotiation_set: 'Negotiation set',
  simulation_title: 'Repeated & Sequential Games',
  simulation_desc:
    'When the outage game is played repeatedly, cooperation can be sustained. Compare strategies and trace the sequential game tree.',
  repeated_games: 'Repeated-Game Summary',
  sequential_game: 'Sequential Game Tree',
  day: 'Day',
  cumulative: 'Cumulative (MMK)',
  cooperation_rate: 'Cooperation rate',
  results_title: 'Results & Theory',
  results_desc:
    'A consolidated summary of findings, assumptions, and warnings from the full game-theoretic analysis.',
  findings: 'Key findings',
  recommendation: 'Recommendation',
  assumptions: 'Assumptions',
  warnings: 'Warnings',
  risk_low: 'Low risk',
  risk_moderate: 'Moderate risk',
  risk_high: 'High risk',
  help_nash:
    'Nash Equilibrium: A situation where no player can improve their outcome by changing strategy alone, given the other player\u2019s choice.',
  help_pareto:
    'Pareto Optimal: An outcome where no player can be made better off without making the other worse off.',
  help_prisoners:
    'Prisoner\u2019s Dilemma: A game where individual rationality leads to a worse outcome for everyone than cooperation would.',
  help_maximin:
    'Maximin: Choose the strategy with the best worst-case outcome \u2014 the cautious approach.',
  help_hurwicz:
    'Hurwicz: Balance optimism and pessimism using a weight (alpha) between best and worst cases.',
  help_arbitration:
    'Nash Arbitration: A fair division method that maximizes the product of gains over the fallback (disagreement) outcome.',
  help_tit_for_tat:
    'Tit-for-Tat: Start by cooperating, then copy the opponent\u2019s previous move. Simple but effective at sustaining cooperation.',
  help_ev:
    'Expected Value: Weight each outcome by its probability and pick the strategy with the highest average payoff.',
  payoff_mm: 'Mini Market payoff',
  payoff_ps: 'Phone Shop payoff',
  error_demand_exceeds: 'Demand cannot exceed capacity',
  error_capacity_zero: 'Capacity must be greater than 0',
  error_alpha_range: 'Alpha must be between 0 and 1',
  error_field_required: 'This field is required',
  status_valid: 'Inputs valid',
  status_invalid: 'Please fix the errors above',
  total_demand: 'Total demand',
  shortfall: 'Shortfall',
  surplus: 'Surplus',
  joint_payoff: 'Joint payoff',
  equilibrium_path: 'Equilibrium path',
  strategy_name: 'Strategy',
  mm_total: 'Mini Market total',
  ps_total: 'Phone Shop total',
  refresh: 'Refresh data',
  footer_note:
    'PowerShare is a decision-support tool. Payoffs are illustrative and should be validated with real data.',
  brand_power: 'Power',
  brand_share: 'Share',
  headline_pd: 'The energy-sharing game is an asymmetric Prisoner’s Dilemma: rational self-interest leads both shops to monopolize, producing the worst joint outcome.',
  headline_generic: 'The energy-sharing game has been analyzed. See the payoff matrix for equilibria and optimal outcomes.',
  finding_nash: 'The pure-strategy Nash equilibrium is ({{nash}}), yielding {{mm}} / {{ps}} MMK.',
  finding_coop: 'The cooperative outcome ({{mm}} / {{ps}} MMK) is {{paretoStatus}}{{unstable}}.',
  finding_pareto: 'Pareto-optimal outcomes: {{outcomes}}.',
  finding_uncertainty: 'Under uncertainty, Maximin and Minimax-Regret criteria tend to favor cooperation, while Expected-Value and Laplace favor monopolizing.',
  finding_arbitration: 'Nash Arbitration identifies the max-product allocation giving both shops a gain over the disagreement point.',
  finding_repeated: 'In repeated play, Tit-for-Tat and Grim Trigger sustain cooperation, outperforming Always Defect.',
  rec_pd: 'Establish a binding sharing agreement enforced by repeated interaction or a community arbitrator. The proportional split is both fair and jointly optimal.',
  rec_generic: 'Review the payoff matrix and adopt the equilibrium strategy for the current scenario.',
  warn_illustrative: 'Payoffs are illustrative and depend on accurate outage-loss and cost-contribution estimates. Verify with real shop data.',
  warn_rational: 'The model assumes rational, self-interested players. Social norms and trust in Myanmar communities may alter outcomes.',
  warn_divisible: 'Capacity is treated as continuously divisible. Real battery systems have discrete kWh steps.',
  warn_horizon: 'Repeated-game results assume infinite horizon or unknown end date. Finite horizons unravel cooperation.',
  assum_two_players: 'Two players share a single battery resource during an outage.',
  assum_knowledge: 'Each player knows the other’s demand and cost contribution.',
  assum_uncertainty: 'Outage duration is uncertain but bounded within the specified range.',
  assum_linear: 'Payoffs are linear in kWh received and monetary in Myanmar Kyat (MMK).',
  assum_no_enforcement: 'No external enforcement; cooperation is voluntary.',
  outcome_CC: 'Cooperate/Cooperate',
  outcome_CM: 'Cooperate/Monopolize',
  outcome_MC: 'Monopolize/Cooperate',
  outcome_MM: 'Monopolize/Monopolize',
  pareto_optimal_status: 'Pareto-optimal',
  not_pareto_optimal_status: 'not Pareto-optimal',
  unstable_enforcement: ' but unstable without enforcement'
};

const my: TranslationMap = {
  appName: 'PowerShare',
  appTagline: 'မြန်မာနိုင်ငံ လျှပ်စက်ပြတ်သည့်အချိန် စွမ်းအင်မျှဝေမှု ပြဿနာဖြေရှင်းရန်',
  tab_scenario: 'အခြေအနေ',
  tab_analysis: 'ဆန်းစစ်ခြင်း',
  tab_uncertainty: 'မသေချာမှု',
  tab_arbitration: 'စီရင်ဆုံးဖြတ်ခြင်း',
  tab_simulation: 'ခန့်မှန်းစမ်းသပ်ခြင်း',
  tab_results: 'ရလဒ် / သီအိုရီ',
  language_label: 'ဘာသာစကား',
  mode_mock: 'မောက်ခ်',
  mode_live: 'တိုက်ရိုက်',
  mode_label: 'API မုဒ်',
  loading: 'ဆန်းစစ်နေသည်\u2026',
  error_title: 'တစ်ခုခု မှားသွားသည်',
  empty_title: 'ဒေတာ မရှိသေးပါ',
  retry: 'ပြန်လုပ်ရန်',
  scenario_title: 'အခြေအနေ ပြင်ဆင်ခြင်း',
  scenario_desc:
    'ဆိုင်တစ်ဆိုင်ချင်း၏ လျှပ်စွမ်းတောင်းဆိုမှု၊ ကုန်ကျစရိတ် ထည့်ဝင်မှုနှင့် ပြတ်တောက်ဆုံးရှုံးမှုကို ထည့်သွင်းပါ။ ထို့နောက် ရလဒ်များကို အလိုအလျောက် တွက်ချက်ပြပါမည်။',
  field_capacity: 'မျှဝေသုံးစွဲမှု စွမ်းရည် (kWh)',
  field_capacity_help: 'ပြတ်သည့်အချိန် သုံးစွဲနိုင်သော ဘက်ထရီစွမ်းအင် စုစုပေါင်း။',
  field_demand: 'တောင်းဆိုမှု (kWh)',
  field_demand_help: 'ဆိုင်အတွက် လိုအပ်သော လျှပ်စွမ်းပမာဏ။',
  field_costContribution: 'ကုန်ကျစရိတ် ထည့်ဝင်မှု (MMK)',
  field_cost_help: 'မျှဝေဘက်ထရီအတွက် ဆိုင်က ထည့်ဝင်သော ငွေကြေး။',
  field_outageLoss: 'ပြတ်တောက်ဆုံးရှုံးမှု (MMK/နာရီ)',
  field_outageLoss_help: 'လျှပ်မရသော နာရီတိုင်း ဆုံးရှုံးသည့် ဝင်ငွေ။',
  field_outageDurations: 'ပြတ်တောက်သည့် အချိန်ကြာမြင့်မှု (နာရီ)',
  field_outageDurations_help:
    'မသေချာမှုအောက်တွက် စစ်ဆေးမည့် အချိန်အမျိုးမျိုး။ ကော်မာခွဲခြားပါ။',
  field_hurwiczAlpha: 'Hurwicz အယ်ဖာ',
  field_hurwicz_help:
    '၀ ဆိုလျှင် အလွန်သံသယ၊ ၁ ဆိုလျှင် အလွန်မျှော်လင့်သော အညွှန်းကိန်း။',
  player_mini_market: 'မီနီမာကတ်',
  player_phone_shop: 'ဖုန်းဆိုင်',
  shop_lights_on: 'မီးထိုးထား',
  shop_lights_off: 'မီးပိတ်ထား',
  run_analysis: 'ဆန်းစစ်မှု လုပ်ဆောင်ရန်',
  running: 'တွက်ချက်နေသည်\u2026',
  analysis_title: 'ရလဒ်ဇယားနှင့် ချိန်ညှိမှုများ',
  analysis_desc:
    'အကွက်တိုင်းတွင် မီနီမာကတ်နှင့် ဖုန်းဆိုင်၏ ရလဒ် (MMK) ပြသထားသည်။ အရေးပါသော အကွက်များကို အရောင်ဖြင့် ပိုင်းခြားပြသည်။',
  payoff_matrix: 'ရလဒ် ဇယား',
  strategy_cooperate: 'ပူးပေါင်းဆောင်ရွက် (မျှဝေ)',
  strategy_monopolize: 'တစ်ဦးတည်းသိမ်းဆည်း (ခိုးယူ)',
  nash_equilibrium: 'Nash ချိန်ညှိမှု',
  pareto_optimal: 'Pareto အကောင်းဆုံး',
  prisoners_dilemma_explain:
    'ဤသည်မှာ မညီမျှသော အကျဉ်းသားပြဿနာ ဖြစ်သည်။ ဆိုင်တိုင်း၏ အကောင်းဆုံး ရွေးချယ်မှုမှာ တစ်ဦးတည်း သိမ်းဆည်းခြင်းဖြစ်သော်လည်း နှစ်ဦးစလုံး ထိုသို့ လုပ်ကြသောအခါ ပူးပေါင်းဆောင်ရွက်ကြသည့်အခါထက် ပို၍ ဆုံးရှုံးကြသည်။',
  uncertainty_title: 'သဘာဝနှင့် ကစားခြင်း',
  uncertainty_desc:
    'ပြတ်တောက်သည့် အချိန်ကြာမြင့်မှု မသေချာသောအခါ ဆုံးဖြတ်ရန် စည်းမျဉ်းများ ကွဲပြားသည်။ အောက်ပါ စည်းမျဉ်းခြောက်မျိုးကို နှိုင်းယှဉ်ကြည့်ပါ။',
  criterion_expected_value: 'မျှော်လင့်တန်ဖိုး',
  criterion_maximin: 'Wald ၏ Maximin',
  criterion_maximax: 'Maximax',
  criterion_laplace: 'Laplace (မလုံလောက်သော အကြောင်းအရာ နည်းဥပဒေ)',
  criterion_minimax_regret: 'Minimax နောင်တ (Savage)',
  criterion_hurwicz: 'Hurwicz (မျှော်လင့်-သံသယ)',
  recommended: 'အကြံပြု မဟာဗျူဟာ',
  arbitration_title: 'Nash စီရင်ဆုံးဖြတ်ခြင်း',
  arbitration_desc:
    'ကြားဝင်စီရင်သူတစ်ဦးက ပူးပေါင်းဆောင်ရွက်မှုမှ ရရှိသော အကျိုးခံစားခွင့်ကို Nash စည်းလုံးမှုဖြေရှင်းနည်းဖြင့် ခွဲဝေပေးသည်။',
  disagreement_point: 'သဘောမတူညီမှု (လက်ရှိအခြေအနေ)',
  max_product_point: 'အများဆုံး-မြှောက်ဖွဲ့ ခွဲဝေမှု',
  gain_over_disagreement: 'သဘောမတူညီမှုထက် တိုးတက်မှု',
  negotiation_set: 'ဆွေးနွေးနိုင်သော အုပ်စု',
  simulation_title: 'ထပ်ခါထပ်ခါနှင့် အဆင့်ဆင့် ကစားနည်း',
  simulation_desc:
    'ပြဿနာကို ထပ်ခါထပ်ခါ ကစားသောအခါ ပူးပေါင်းဆောင်ရွက်မှု ရှိနိုင်သည်။ မဟာဗျူဟာများကို နှိုင်းယှဉ်ကာ အဆင့်ဆင့် ကစားပင်များကို လိုက်ကြည့်ပါ။',
  repeated_games: 'ထပ်ခါထပ်ခါ ကစားနည်း အကျဉ်းချုပ်',
  sequential_game: 'အဆင့်ဆင့် ကစားပင်',
  day: 'နေ့',
  cumulative: 'စုစုပေါင်း (MMK)',
  cooperation_rate: 'ပူးပေါင်းဆောင်ရွက်မှု နှုန်း',
  results_title: 'ရလဒ်နှင့် သီအိုရီ',
  results_desc:
    'ဆန်းစစ်မှုတစ်ခုလုံးမှ ရရှိသော တွေ့ရှိချက်များ၊ ယူဆချက်များနှင့် သတိပေးချက်များ၏ အကျဉ်းချုပ်။',
  findings: 'အဓိက တွေ့ရှိချက်များ',
  recommendation: 'အကြံပြုချက်',
  assumptions: 'ယူဆချက်များ',
  warnings: 'သတိပေးချက်များ',
  risk_low: 'အန္ယ်အန္တ္ရာယ်',
  risk_moderate: 'အန္တ်ရာယ် အသင့်အတင့်',
  risk_high: 'အန္တ်ရာယ် မြင့်',
  help_nash:
    'Nash ချိန်ညှိမှု \u2014 အခြားကစားသမား၏ ရွေးချယ်မှု ပြောင်းမသွားဘဲ မိမိတစ်ဦးတည်း ပြောင်းလဲခြင်းဖြင့် ပိုကောင်းအောင် မလုပ်နိုင်သော အခြေအနေ။',
  help_pareto:
    'Pareto အကောင်းဆုံး \u2014 အခြားသူကို ပိုဆုံးရှုံးစေဘဲ မိမိကို ပိုကောင်းအောင် မလုပ်နိုင်သော အခြေအနေ။',
  help_prisoners:
    'အကျဉ်းသားပြဿနာ \u2014 တစ်ဦးချင်းစီ ဆင်ခြင်တုံတရားရှိမှုက လူတိုင်းအတွက် ပိုဆိုးသော ရလဒ်သို့ ဦးတည်စေသော ကစားနည်း။',
  help_maximin:
    'Maximin \u2014 အဆိုးဆုံးအခြေအနေတွင် အကောင်းဆုံးဖြစ်သော မဟာဗျူဟာကို ရွေးချယ်ခြင်း \u2014 သတိထားသော နည်းလမ်း။',
  help_hurwicz:
    'Hurwicz \u2014 အကောင်းဆုံးနှင့် အဆိုးဆုံးအခြေအနေကြား အလေးချိန် (alpha) ဖြင့် မျှတစေသော နည်းလမ်း။',
  help_arbitration:
    'Nash စီရင်ဆုံးဖြတ်ခြင်း \u2014 သဘောမတူညီမှု အခြေအနေထက် ရရှိသော အကျိုးခံစားခွင့် မြှောက်ဖွဲ့မှုကို အများဆုံးလုပ်ပေးသော တရားမျှတသည့် ခွဲဝေနည်း။',
  help_tit_for_tat:
    'Tit-for-Tat \u2014 ပထမစတင်၍ ပူးပေါင်းဆောင်ရွက်ပြီး ထို့နောက် ပြိုင်ဘက်၏ နောက်ဆုံးလှုပ်ရှားမှုကို အတုခိုးခြင်း \u2014 ရိုးရှင်းသော်လည်း ထိရောက်သည်။',
  help_ev:
    'မျှော်လင့်တန်ဖိုး \u2014 ရလဒ်တစ်ခုစီကို ၎င်း၏ဖြစ်နိုင်ခြေဖြင့် မျှချေးပြီး ပျမ်းမျှတန်ဖိုး အများဆုံး မဟာဗျူဟာကို ရွေးချယ်ခြင်း။',
  payoff_mm: 'မီနီမာကတ် ရလဒ်',
  payoff_ps: 'ဖုန်းဆိုင် ရလဒ်',
  error_demand_exceeds: 'တောင်းဆိုမှုသည် စွမ်းရည်ကို မကျော်လွှန်ရပါ',
  error_capacity_zero: 'စွမ်းရည်သည် 0 ထက် ကြီးရမည်',
  error_alpha_range: 'အယ်ဖာသည် 0 နှင့် 1 ကြား ဖြစ်ရမည်',
  error_field_required: 'ဤနေရာကို ဖြည့်ရမည်',
  status_valid: 'ထည့်သွင်းမှုများ မှန်ကန်ပါသည်',
  status_invalid: 'အပေါ်ပါ အမှားများကို ပြင်ပါ',
  total_demand: 'စုစုပေါင်း တောင်းဆိုမှု',
  shortfall: 'လိုနေသည်',
  surplus: 'ပိုနေသည်',
  joint_payoff: 'ပေါင်းစပ် ရလဒ်',
  equilibrium_path: 'ချိန်ညှိမှု လမ်းကြောင်း',
  strategy_name: 'မဟာဗျူဟာ',
  mm_total: 'မီနီမာကတ် စုစုပေါင်း',
  ps_total: 'ဖုန်းဆိုင် စုစုပေါင်း',
  refresh: 'ဒေတာ ပြန်ရွှင်းရန်',
  footer_note:
    'PowerShare သည် ဆုံးဖြတ်ရန် အကူအညီပေးသော ကိရိယာဖြစ်သည်။ ရလဒ်များသည် နမူနာဖြစ်ပြီး တကယ့်ဒေတာဖြင့် စစ်ဆေးသင့်ပါသည်။',
  brand_power: 'Power',
  brand_share: 'Share',
  headline_pd: 'စွမ်းအင်မျှဝေမှု ကစားနည်းသည် မညီမျှသော အကျဉ်းသားပြဿနာ ဖြစ်သည် - ကိုယ်ကျိုးရှာမှုကြောင့် ဆိုင်နှစ်ဆိုင်စလုံး တစ်ဦးတည်းသိမ်းဆည်းရန် ရွေးချယ်ကြသဖြင့် အဆိုးဆုံးရလဒ်ကို ရရှိသည်။',
  headline_generic: 'စွမ်းအင်မျှဝေမှု ကစားနည်းကို ဆန်းစစ်ပြီးပါပြီ။ ချိန်ညှိမှုများနှင့် အကောင်းဆုံး ရလဒ်များအတွက် ရလဒ်ဇယားကို ကြည့်ပါ။',
  finding_nash: 'Nash ချိန်ညှိမှုမှာ ({{nash}}) ဖြစ်ပြီး၊ ရလဒ်မှာ {{mm}} / {{ps}} MMK ဖြစ်သည်။',
  finding_coop: 'ပူးပေါင်းဆောင်ရွက်မှု ရလဒ် ({{mm}} / {{ps}} MMK) သည် {{paretoStatus}}{{unstable}}။',
  finding_pareto: 'Pareto အကောင်းဆုံး ရလဒ်များ - {{outcomes}}။',
  finding_uncertainty: 'မသေချာမှုအောက်တွင် Maximin နှင့် Minimax-Regret စည်းမျဉ်းများက ပူးပေါင်းဆောင်ရွက်မှုကို အားပေးပြီး Expected-Value နှင့် Laplace တို့က တစ်ဦးတည်းသိမ်းဆည်းမှုကို အားပေးသည်။',
  finding_arbitration: 'Nash စီရင်ဆုံးဖြတ်ခြင်းသည် ဆိုင်နှစ်ဆိုင်စလုံးကို သဘောမတူညီမှုအခြေအနေထက် ပိုမိုအကျိုးအမြတ်ရစေမည့် အကောင်းဆုံး ခွဲဝေမှုကို ဖော်ထုတ်ပေးသည်။',
  finding_repeated: 'ထပ်ခါထပ်ခါ ကစားရာတွင် Tit-for-Tat နှင့် Grim Trigger တို့က ပူးပေါင်းဆောင်ရွက်မှုကို ထိန်းသိမ်းနိုင်ပြီး Always Defect ထက် သာလွန်သည်။',
  rec_pd: 'အသိုင်းအဝိုင်း၏ ကြားဝင်စီရင်သူ သို့မဟုတ် အကြိမ်ကြိမ်တွေ့ဆုံမှုဖြင့် ခိုင်မာသော မျှဝေရေး သဘောတူညီချက်ကို တည်ဆောက်ပါ။ အချိုးကျ ခွဲဝေမှုသည် တရားမျှတပြီး နှစ်ဦးစလုံးအတွက် အကောင်းဆုံးဖြစ်သည်။',
  rec_generic: 'ရလဒ်ဇယားကို ပြန်လည်သုံးသပ်ပြီး လက်ရှိအခြေအနေအတွက် ချိန်ညှိမှု မဟာဗျူဟာကို ကျင့်သုံးပါ။',
  warn_illustrative: 'ရလဒ်များသည် ဥပမာသာဖြစ်ပြီး တိကျသော ပြတ်တောက်မှု ဆုံးရှုံးငွေနှင့် ကုန်ကျစရိတ် ထည့်ဝင်မှုများအပေါ် မူတည်သည်။ အမှန်တကယ် ဆိုင်ဒေတာဖြင့် စစ်ဆေးပါ။',
  warn_rational: 'ဤမော်ဒယ်သည် အကျိုးအမြတ်ကို ကြည့်သော ကစားသမားများကို အခြေခံထားသည်။ မြန်မာ့အသိုင်းအဝိုင်း၏ လူမှုရေးစံနှုန်းများနှင့် ယုံကြည်မှုတို့က ရလဒ်များကို ပြောင်းလဲစေနိုင်သည်။',
  warn_divisible: 'စွမ်းရည်ကို အကန့်အသတ်မရှိ ခွဲဝေနိုင်သည်ဟု ယူဆထားသည်။ လက်တွေ့ ဘက်ထရီများတွင် သတ်မှတ်ထားသော kWh အတိုင်းအတာများ ရှိသည်။',
  warn_horizon: 'ထပ်ခါထပ်ခါ ကစားခြင်း ရလဒ်များသည် အဆုံးသတ်မရှိဟု ယူဆထားသည်။ အဆုံးသတ်ရှိပါက ပူးပေါင်းဆောင်ရွက်မှု ပျက်ပြားနိုင်သည်။',
  assum_two_players: 'ပြတ်တောက်ချိန်အတွင်း ကစားသမားနှစ်ဦးက ဘက်ထရီတစ်လုံးကို မျှဝေသုံးစွဲသည်။',
  assum_knowledge: 'ကစားသမားတိုင်းသည် အခြားသူ၏ တောင်းဆိုမှုနှင့် ကုန်ကျစရိတ်ကို သိရှိသည်။',
  assum_uncertainty: 'ပြတ်တောက်မှု ကြာချိန်ကို မသေချာသော်လည်း သတ်မှတ်ထားသော အတိုင်းအတာအတွင်း ရှိသည်။',
  assum_linear: 'ရလဒ်များသည် ရရှိသော kWh နှင့် အချိုးကျပြီး မြန်မာကျပ်ငွေ (MMK) ဖြင့် တွက်ချက်သည်။',
  assum_no_enforcement: 'ပြင်ပမှ ဖိအားပေးမှု မရှိပါ - ပူးပေါင်းဆောင်ရွက်မှုသည် မိမိဆန္ဒအလျောက်ဖြစ်သည်။',
  outcome_CC: 'ပူးပေါင်းဆောင်ရွက်/ပူးပေါင်းဆောင်ရွက်',
  outcome_CM: 'ပူးပေါင်းဆောင်ရွက်/တစ်ဦးတည်းသိမ်းဆည်း',
  outcome_MC: 'တစ်ဦးတည်းသိမ်းဆည်း/ပူးပေါင်းဆောင်ရွက်',
  outcome_MM: 'တစ်ဦးတည်းသိမ်းဆည်း/တစ်ဦးတည်းသိမ်းဆည်း',
  pareto_optimal_status: 'Pareto အကောင်းဆုံး ဖြစ်သည်',
  not_pareto_optimal_status: 'Pareto အကောင်းဆုံး မဟုတ်ပါ',
  unstable_enforcement: ' သို့သော် ဖိအားပေးမှု မရှိဘဲ မတည်ငြိမ်ပါ'
};

export const translations: Record<Language, TranslationMap> = { en, my };

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang][key] ?? key;
}

export function t_format(lang: Language, key: TranslationKey, vars?: Record<string, string | number>): string {
  let str = translations[lang][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
  }
  return str;
}
