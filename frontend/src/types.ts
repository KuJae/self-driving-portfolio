export interface IPSConfig {
  universe_ids: string[];
  target_real_return: number;
  cpi_estimate: number;
  volatility_min: number;
  volatility_max: number;
  max_drawdown_limit: number;
  tracking_error_limit: number;
  equity_min: number;
  equity_max: number;
  cash_min: number;
  rebalance_frequency: string;
  autonomy_level: string;
}

export interface MacroStep {
  agent: string;
  regime: string;
  regime_slug: string;
  confidence: number;
  recession_probability: number;
  dimension_scores: {
    growth: number;
    inflation: number;
    monetary_policy: number;
    financial_conditions: number;
  };
  recommendation: string;
  narrative: string;
}

export interface CMACandidate {
  historical_erp: number;
  regime_adjusted: number;
  bl_equilibrium: number;
  inverse_gordon: number;
  implied_erp: number;
  survey_analyst: number;
  auto_blend: number;
}

export interface CMAAsset {
  asset_id: string;
  asset_name: string;
  category: string;
  ticker: string;
  expected_return: number;
  expected_return_pct: number;
  auto_blend_pct: number;
  delta_vs_auto_blend: number;
  rationale: string;
  candidates: CMACandidate;
}

export interface VotingRankItem {
  rank: number;
  method_key: string;
  name: string;
  category: string;
  vote: number;
  metric_score: number;
  composite_score: number;
  sharpe: number;
  volatility: number;
  tracking_error: number;
  effective_n: number;
  is_compliant: boolean;
}

export interface PeerReviewItem {
  reviewer: string;
  reviewer_cat: string;
  target: string;
  review_type: string;
  comment: string;
}

export interface AssetBreakdownItem {
  id: string;
  name: string;
  ticker: string;
  category: string;
  weight_pct: number;
  risk_contrib_pct: number;
  bench_weight_pct: number;
}

export interface FinalPortfolio {
  asset_breakdown: AssetBreakdownItem[];
  weights: Record<string, number>;
  expected_return_pct: number;
  volatility_pct: number;
  sharpe_ratio: number;
  tracking_error_pct: number;
  effective_n: number;
  max_drawdown_est_pct: number;
  category_exposures: {
    equity: number;
    fixed_income: number;
    real_assets: number;
    cash: number;
  };
  benchmark_comparison: {
    benchmark_name: string;
    bench_return_pct: number;
    bench_volatility_pct: number;
    bench_sharpe: number;
    bench_mdd_est_pct: number;
    excess_return_pct: number;
    volatility_reduction_pct: number;
  };
}

export interface PipelineResult {
  ips: IPSConfig;
  macro_step: MacroStep;
  cma_step: {
    cmas: Record<string, CMAAsset>;
    asset_count: number;
  };
  covariance_step: {
    shrinkage_intensity: number;
    regime_stress_factor: number;
    narrative: string;
  };
  pc_step: {
    methods_count: number;
    methods_summary: Array<{ key: string; name: string; category: string }>;
  };
  review_step: {
    rankings: VotingRankItem[];
    top_5: VotingRankItem[];
    peer_reviews: PeerReviewItem[];
    total_reviews_count: number;
    diversity_families_count: number;
    narrative: string;
  };
  ensemble_step: {
    method_weights: Record<string, number>;
    final_portfolio: FinalPortfolio;
  };
  governance?: Governance;
  board_memo: string;
  timestamp: string;
}

export interface Governance {
  status: 'approved' | 'escalated';
  message: string;
  eligible_count: number;
  candidate_count: number;
  eligible: string[];
  excluded: Array<{ key: string; name: string; violations: string[] }>;
  final_check: { is_compliant: boolean; violations: string[] };
}

export interface BacktestRow {
  key: string;
  name: string;
  category: string;
  is_final: boolean;
  is_benchmark: boolean;
  cagr_pct: number;
  volatility_pct: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  final_nav: number;
}

export interface BacktestDataStatus {
  source: string;
  method: string;
  fetched_at: string | null;
  file: string;
  rows: number;
  columns: number;
  missing_values: number;
}

export interface BacktestAsset {
  ticker: string;
  name: string;
  category: string;
  final_weight_pct: number;
  bench_weight_pct: number;
  cagr_pct: number;
  volatility_pct: number;
  max_drawdown_pct: number;
  best_month: { month: string; return_pct: number };
  worst_month: { month: string; return_pct: number };
  yahoo_url: string;
}

export interface BacktestAnnual {
  years: string[];
  months: number[];
  final: number[];
  benchmark: number[];
  by_ticker: Record<string, number[]>;
}

export interface BacktestResult {
  period: { start: string; end: string; months: number };
  rebalance: string;
  risk_free_pct: number;
  data_source: string;
  data: BacktestDataStatus;
  tickers: string[];
  dates: string[];
  series: Record<string, number[]>;
  rows: BacktestRow[];
  assets: BacktestAsset[];
  annual: BacktestAnnual;
}
