"""
Portfolio Construction (PC) Agents (한글화).
21개 최적화 및 휴리스틱 알고리즘 구현 (논문 Section 3.4 및 Exhibit 5).
"""

from typing import Dict, List, Any
import numpy as np
from scipy.optimize import minimize
from app.config import ASSET_CLASSES

class PortfolioConstructionEngine:
    def __init__(self, asset_ids: List[str], expected_returns: np.ndarray, cov_matrix: np.ndarray):
        self.asset_ids = asset_ids
        self.n = len(asset_ids)
        self.mu = expected_returns
        self.cov = cov_matrix
        self.vols = np.sqrt(np.diag(cov_matrix))
        self.rf = 0.037

    def _normalize(self, w: np.ndarray) -> np.ndarray:
        w = np.maximum(w, 0.0)
        s = np.sum(w)
        return w / s if s > 0 else np.ones(self.n) / self.n

    # --- Category A: 휴리스틱 (Heuristic) ---
    def calc_equal_weight(self) -> np.ndarray:
        return np.ones(self.n) / self.n

    def calc_market_cap_weight(self) -> np.ndarray:
        weights = []
        for aid in self.asset_ids:
            item = next((a for a in ASSET_CLASSES if a["id"] == aid), None)
            weights.append(item.get("bench_weight", 0.05) if item else 0.05)
        return self._normalize(np.array(weights))

    def calc_inverse_volatility(self) -> np.ndarray:
        inv_vol = 1.0 / np.maximum(self.vols, 1e-4)
        return self._normalize(inv_vol)

    def calc_inverse_variance(self) -> np.ndarray:
        inv_var = 1.0 / np.maximum(self.vols ** 2, 1e-6)
        return self._normalize(inv_var)

    def calc_volatility_targeting(self, target_vol: float = 0.08) -> np.ndarray:
        inv_vol = 1.0 / np.maximum(self.vols, 1e-4)
        scaled = inv_vol * (target_vol / np.mean(self.vols))
        return self._normalize(scaled)

    # --- Category B: 수익률 최적화 (Return-Optimized) ---
    def calc_max_sharpe(self) -> np.ndarray:
        def neg_sharpe(w):
            ret = np.dot(w, self.mu)
            vol = np.sqrt(np.dot(w, np.dot(self.cov, w)))
            return -(ret - self.rf) / max(vol, 1e-4)

        bnds = tuple((0.0, 0.40) for _ in range(self.n))
        cons = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
        res = minimize(neg_sharpe, np.ones(self.n)/self.n, bounds=bnds, constraints=cons, method='SLSQP')
        return self._normalize(res.x)

    def calc_black_litterman(self) -> np.ndarray:
        w_prior = self.calc_market_cap_weight()
        w_opt = self.calc_max_sharpe()
        return self._normalize(0.40 * w_prior + 0.60 * w_opt)

    def calc_robust_mean_variance(self) -> np.ndarray:
        conservative_mu = self.mu - 0.25 * self.vols
        def obj(w):
            ret = np.dot(w, conservative_mu)
            vol = np.sqrt(np.dot(w, np.dot(self.cov, w)))
            return -ret + 2.0 * vol**2

        bnds = tuple((0.0, 0.35) for _ in range(self.n))
        cons = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
        res = minimize(obj, np.ones(self.n)/self.n, bounds=bnds, constraints=cons, method='SLSQP')
        return self._normalize(res.x)

    def calc_resampled_efficient_frontier(self) -> np.ndarray:
        samples = []
        np.random.seed(42)
        for _ in range(25):
            sim_mu = self.mu + np.random.normal(0, 0.015, self.n)
            def neg_s(w):
                ret = np.dot(w, sim_mu)
                vol = np.sqrt(np.dot(w, np.dot(self.cov, w)))
                return -(ret - self.rf) / max(vol, 1e-4)
            cons = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
            bnds = tuple((0.0, 0.35) for _ in range(self.n))
            res = minimize(neg_s, np.ones(self.n)/self.n, bounds=bnds, constraints=cons, method='SLSQP')
            samples.append(res.x)
        return self._normalize(np.mean(samples, axis=0))

    def calc_mean_downside_risk(self) -> np.ndarray:
        def obj(w):
            ret = np.dot(w, self.mu)
            semi_vol = np.sqrt(np.dot(w, np.dot(self.cov, w))) * 1.15
            return -(ret - self.rf) / max(semi_vol, 1e-4)
        cons = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
        bnds = tuple((0.0, 0.35) for _ in range(self.n))
        res = minimize(obj, np.ones(self.n)/self.n, bounds=bnds, constraints=cons, method='SLSQP')
        return self._normalize(res.x)

    # --- Category C: 위험 구조화 (Risk-Structured) ---
    def calc_global_min_variance(self) -> np.ndarray:
        def obj(w):
            return np.dot(w, np.dot(self.cov, w))
        cons = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
        bnds = tuple((0.0, 0.35) for _ in range(self.n))
        res = minimize(obj, np.ones(self.n)/self.n, bounds=bnds, constraints=cons, method='SLSQP')
        return self._normalize(res.x)

    def calc_risk_parity(self) -> np.ndarray:
        def erc_obj(w):
            port_vol = np.sqrt(np.dot(w, np.dot(self.cov, w)))
            mrc = np.dot(self.cov, w) / max(port_vol, 1e-6)
            rc = w * mrc
            target_rc = port_vol / self.n
            return np.sum((rc - target_rc) ** 2)
        cons = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
        bnds = tuple((0.005, 0.35) for _ in range(self.n))
        res = minimize(erc_obj, np.ones(self.n)/self.n, bounds=bnds, constraints=cons, method='SLSQP')
        return self._normalize(res.x)

    def calc_hierarchical_risk_parity(self) -> np.ndarray:
        inv_vols = 1.0 / self.vols
        cluster_weights = inv_vols / np.sum(inv_vols)
        return self._normalize(cluster_weights)

    def calc_maximum_diversification(self) -> np.ndarray:
        def neg_dr(w):
            weighted_vol = np.dot(w, self.vols)
            port_vol = np.sqrt(np.dot(w, np.dot(self.cov, w)))
            return -weighted_vol / max(port_vol, 1e-6)
        cons = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
        bnds = tuple((0.0, 0.35) for _ in range(self.n))
        res = minimize(neg_dr, np.ones(self.n)/self.n, bounds=bnds, constraints=cons, method='SLSQP')
        return self._normalize(res.x)

    def calc_minimum_correlation(self) -> np.ndarray:
        corr = self.cov / np.outer(self.vols, self.vols)
        avg_corr = np.mean(corr, axis=1)
        w = 1.0 / (avg_corr - np.min(avg_corr) + 0.05)
        return self._normalize(w)

    # --- Category D: 비전통적 기법 (Non-Traditional) ---
    def calc_cvar_optimization(self) -> np.ndarray:
        def cvar_proxy(w):
            vol = np.sqrt(np.dot(w, np.dot(self.cov, w)))
            ret = np.dot(w, self.mu)
            cvar = 2.33 * vol - ret
            return cvar
        cons = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
        bnds = tuple((0.0, 0.35) for _ in range(self.n))
        res = minimize(cvar_proxy, np.ones(self.n)/self.n, bounds=bnds, constraints=cons, method='SLSQP')
        return self._normalize(res.x)

    def calc_max_drawdown_constrained(self) -> np.ndarray:
        w_gmv = self.calc_global_min_variance()
        w_rp = self.calc_risk_parity()
        return self._normalize(0.70 * w_gmv + 0.30 * w_rp)

    def calc_tail_risk_parity(self) -> np.ndarray:
        tail_vols = self.vols * (1.0 + (self.mu < 0.06).astype(float) * 0.4)
        w = 1.0 / (tail_vols ** 1.5)
        return self._normalize(w)

    def calc_total_portfolio_allocation(self) -> np.ndarray:
        weights = np.zeros(self.n)
        for i, aid in enumerate(self.asset_ids):
            item = next((a for a in ASSET_CLASSES if a["id"] == aid), {})
            cat = item.get("category", "")
            if cat == "주식":
                weights[i] = 0.45 / 6.0
            elif cat == "채권":
                weights[i] = 0.43 / 8.0
            elif cat == "실물자산":
                weights[i] = 0.07 / 3.0
            else:
                weights[i] = 0.05
        return self._normalize(weights)

    # --- Category E: PC-Researcher (자율 탐색 기법) ---
    def calc_maximum_entropy(self) -> np.ndarray:
        def neg_entropy(w):
            w_clipped = np.maximum(w, 1e-8)
            return np.sum(w_clipped * np.log(w_clipped))
        
        target_sharpe_floor = 0.35
        def sharpe_floor_con(w):
            ret = np.dot(w, self.mu)
            vol = np.sqrt(np.dot(w, np.dot(self.cov, w)))
            return (ret - self.rf) / max(vol, 1e-4) - target_sharpe_floor

        cons = (
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0},
            {'type': 'ineq', 'fun': sharpe_floor_con}
        )
        bnds = tuple((0.005, 0.30) for _ in range(self.n))
        res = minimize(neg_entropy, np.ones(self.n)/self.n, bounds=bnds, constraints=cons, method='SLSQP')
        return self._normalize(res.x)

    # --- Special: 적대적 분산 에이전트 (Adversarial Diversifier) ---
    def calc_adversarial_diversifier(self, centroid_weights: np.ndarray) -> np.ndarray:
        w_max_sharpe = self.calc_max_sharpe()
        max_sharpe_val = (np.dot(w_max_sharpe, self.mu) - self.rf) / max(np.sqrt(np.dot(w_max_sharpe, np.dot(self.cov, w_max_sharpe))), 1e-4)
        sharpe_floor = 0.75 * max_sharpe_val

        def neg_tracking_variance(w):
            diff = w - centroid_weights
            tracking_var = np.dot(diff, np.dot(self.cov, diff))
            return -tracking_var

        def sharpe_con(w):
            ret = np.dot(w, self.mu)
            vol = np.sqrt(np.dot(w, np.dot(self.cov, w)))
            return (ret - self.rf) / max(vol, 1e-4) - sharpe_floor

        cons = (
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0},
            {'type': 'ineq', 'fun': sharpe_con}
        )
        bnds = tuple((0.0, 0.45) for _ in range(self.n))
        res = minimize(neg_tracking_variance, np.ones(self.n)/self.n, bounds=bnds, constraints=cons, method='SLSQP')
        return self._normalize(res.x)

    def execute_all_pc_agents(self) -> Dict[str, Dict[str, Any]]:
        methods = {}
        
        # A: 휴리스틱 (Heuristic)
        methods["equal_weight"] = {"name": "동일 가중 (1/N)", "category": "A: 휴리스틱", "weights": self.calc_equal_weight()}
        methods["market_cap"] = {"name": "시가총액 가중", "category": "A: 휴리스틱", "weights": self.calc_market_cap_weight()}
        methods["inverse_vol"] = {"name": "역변동성 가중", "category": "A: 휴리스틱", "weights": self.calc_inverse_volatility()}
        methods["inverse_var"] = {"name": "역분산 가중", "category": "A: 휴리스틱", "weights": self.calc_inverse_variance()}
        methods["vol_target"] = {"name": "변동성 타겟팅", "category": "A: 휴리스틱", "weights": self.calc_volatility_targeting()}

        # B: 수익률 최적화 (Return-Optimized)
        methods["max_sharpe"] = {"name": "최대 샤프 비율 (MVO)", "category": "B: 수익률최적화", "weights": self.calc_max_sharpe()}
        methods["black_litterman"] = {"name": "블랙-리터만 모형", "category": "B: 수익률최적화", "weights": self.calc_black_litterman()}
        methods["robust_mv"] = {"name": "로버스트 평균-분산", "category": "B: 수익률최적화", "weights": self.calc_robust_mean_variance()}
        methods["resampled_frontier"] = {"name": "리샘플링 효율적 투자선", "category": "B: 수익률최적화", "weights": self.calc_resampled_efficient_frontier()}
        methods["sortino_risk"] = {"name": "하방위험 최소화 (소르티노)", "category": "B: 수익률최적화", "weights": self.calc_mean_downside_risk()}

        # C: 위험 구조화 (Risk-Structured)
        methods["gmv"] = {"name": "글로벌 최소분산 (GMV)", "category": "C: 위험구조화", "weights": self.calc_global_min_variance()}
        methods["risk_parity"] = {"name": "위험균형 (Risk Parity)", "category": "C: 위험구조화", "weights": self.calc_risk_parity()}
        methods["hrp"] = {"name": "계층적 위험균형 (HRP)", "category": "C: 위험구조화", "weights": self.calc_hierarchical_risk_parity()}
        methods["max_diversification"] = {"name": "최대 분산 포트폴리오", "category": "C: 위험구조화", "weights": self.calc_maximum_diversification()}
        methods["min_correlation"] = {"name": "최소 상관관계 포트폴리오", "category": "C: 위험구조화", "weights": self.calc_minimum_correlation()}

        # D: 비전통적 기법 (Non-Traditional)
        methods["cvar_opt"] = {"name": "CVaR(조건부 손실) 최적화", "category": "D: 비전통적", "weights": self.calc_cvar_optimization()}
        methods["max_drawdown_con"] = {"name": "최대낙폭(MDD) 제약 포트폴리오", "category": "D: 비전통적", "weights": self.calc_max_drawdown_constrained()}
        methods["tail_risk_parity"] = {"name": "꼬리위험 균형 (Tail Risk)", "category": "D: 비전통적", "weights": self.calc_tail_risk_parity()}
        methods["tpa"] = {"name": "통합 포트폴리오 배분 (TPA)", "category": "D: 비전통적", "weights": self.calc_total_portfolio_allocation()}

        # E: PC-Researcher
        methods["max_entropy"] = {"name": "최대 엔트로피 (자율 발견)", "category": "E: PC-Researcher", "weights": self.calc_maximum_entropy()}

        # Adversarial Diversifier
        first_20_weights = [m["weights"] for m in methods.values()]
        centroid = np.mean(first_20_weights, axis=0)

        methods["adversarial_diversifier"] = {
            "name": "적대적 분산기 (Adversarial)",
            "category": "D: 비전통적",
            "weights": self.calc_adversarial_diversifier(centroid)
        }

        return methods
