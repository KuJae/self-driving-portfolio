"""
Chief Risk Officer (CRO) Agent (한글화).
후보 포트폴리오에 대한 독립 정량적 리스크 심사 및 IPS 준수 감사 (논문 Section 3.5).
"""

from typing import Dict, List, Any
import numpy as np
from app.config import IPSConfig, ASSET_CLASSES

class CROAgent:
    def __init__(self, ips: IPSConfig, asset_ids: List[str], expected_returns: np.ndarray, cov_matrix: np.ndarray):
        self.ips = ips
        self.asset_ids = asset_ids
        self.mu = expected_returns
        self.cov = cov_matrix
        self.rf = 0.037
        
        # 60/40 벤치마크 가중치
        self.bench_weights = np.zeros(len(asset_ids))
        for i, aid in enumerate(asset_ids):
            item = next((a for a in ASSET_CLASSES if a["id"] == aid), None)
            if item:
                self.bench_weights[i] = item.get("bench_weight", 0.0)
        s = np.sum(self.bench_weights)
        if s > 0:
            self.bench_weights /= s

    def evaluate_portfolio(self, method_key: str, name: str, category: str, weights: np.ndarray) -> Dict[str, Any]:
        ret = float(np.dot(weights, self.mu))
        vol = float(np.sqrt(np.dot(weights, np.dot(self.cov, weights))))
        sharpe = (ret - self.rf) / max(vol, 1e-4)

        # 60/40 벤치마크 대비 트래킹 에러
        diff = weights - self.bench_weights
        tracking_error = float(np.sqrt(np.dot(diff, np.dot(self.cov, diff))))

        # 95% Parametric VaR 및 CVaR
        var_95 = -(ret - 1.645 * vol)
        cvar_95 = -(ret - 2.063 * vol)

        # 예상 최대 낙폭 (MDD)
        est_mdd = -vol * 2.2

        # Meucci 유효 자산 수 (Effective N)
        w_clean = np.maximum(weights, 1e-8)
        entropy = -np.sum(w_clean * np.log(w_clean))
        eff_n = float(np.exp(entropy))

        # 자산군별 비중 집계
        eq_weight = 0.0
        fi_weight = 0.0
        ra_weight = 0.0
        cash_weight = 0.0

        for i, aid in enumerate(self.asset_ids):
            item = next((a for a in ASSET_CLASSES if a["id"] == aid), {})
            c = item.get("category", "")
            if c == "주식": eq_weight += weights[i]
            elif c == "채권": fi_weight += weights[i]
            elif c == "실물자산": ra_weight += weights[i]
            elif c == "현금": cash_weight += weights[i]

        # IPS 규정 위반 검사
        violations = []
        if tracking_error * 100 > self.ips.tracking_error_limit:
            violations.append(f"트래킹 에러({tracking_error*100:.1f}%)가 IPS 한도({self.ips.tracking_error_limit}%)를 초과함")
        if (vol * 100) < self.ips.volatility_min or (vol * 100) > self.ips.volatility_max:
            violations.append(f"변동성({vol*100:.1f}%)이 허용 밴드[{self.ips.volatility_min}% - {self.ips.volatility_max}%]를 벗어남")
        if (est_mdd * 100) < self.ips.max_drawdown_limit:
            violations.append(f"예상 MDD({est_mdd*100:.1f}%)가 허용치({self.ips.max_drawdown_limit}%)보다 큼")
        if (eq_weight * 100) < self.ips.equity_min or (eq_weight * 100) > self.ips.equity_max:
            violations.append(f"주식 비중({eq_weight*100:.1f}%)이 허용 범위[{self.ips.equity_min}% - {self.ips.equity_max}%]를 벗어남")

        is_compliant = len(violations) == 0

        # CRO 객관적 지표 점수 (0 ~ 1)
        metric_score = 0.40 * max(0.0, min(1.0, (sharpe + 0.2) / 0.8)) + \
                       0.25 * (1.0 if is_compliant else 0.4) + \
                       0.20 * min(1.0, eff_n / 14.0) + \
                       0.15 * max(0.0, 1.0 - (tracking_error / 0.10))

        return {
            "method_key": method_key,
            "name": name,
            "category": category,
            "weights": {aid: round(float(w), 4) for aid, w in zip(self.asset_ids, weights)},
            "expected_return": round(ret * 100, 2),
            "volatility": round(vol * 100, 2),
            "sharpe_ratio": round(sharpe, 3),
            "tracking_error": round(tracking_error * 100, 2),
            "var_95": round(var_95 * 100, 2),
            "cvar_95": round(cvar_95 * 100, 2),
            "estimated_mdd": round(est_mdd * 100, 2),
            "effective_n": round(eff_n, 2),
            "exposures": {
                "equity": round(eq_weight * 100, 2),
                "fixed_income": round(fi_weight * 100, 2),
                "real_assets": round(ra_weight * 100, 2),
                "cash": round(cash_weight * 100, 2)
            },
            "is_compliant": is_compliant,
            "violations": violations,
            "cro_metric_score": round(metric_score, 3)
        }

    def audit_all_candidates(self, pc_methods: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        reports = {}
        for key, m in pc_methods.items():
            reports[key] = self.evaluate_portfolio(key, m["name"], m["category"], m["weights"])
        return reports
