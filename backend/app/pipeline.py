"""
Pipeline Orchestrator: Chains all 6 stages of the Self-Driving Portfolio Agentic Architecture.
"""

from typing import Dict, Any, Optional
import numpy as np
from app.config import IPSConfig, DEFAULT_IPS, ASSET_CLASSES
from app.agents.macro_agent import MacroAgent
from app.agents.asset_class_agent import AssetClassManager
from app.agents.covariance_agent import CovarianceAgent
from app.agents.pc_agents import PortfolioConstructionEngine
from app.agents.cro_agent import CROAgent
from app.agents.review_voting_agent import StrategyReviewEngine
from app.agents.cio_agent import CIOAgent

class SelfDrivingPortfolioPipeline:
    def __init__(self, ips: Optional[IPSConfig] = None):
        self.ips = ips or DEFAULT_IPS
        self.macro_agent = MacroAgent()
        self.ac_manager = AssetClassManager()
        self.cov_agent = CovarianceAgent()

    def run(self, custom_macro: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Step 1: Macro Agent
        macro_result = self.macro_agent.run(custom_macro)
        macro_regime = macro_result["regime"]

        # Step 2: Asset Class Agents & CMA Judge
        cma_results = self.ac_manager.generate_all_cmas(macro_regime)
        
        asset_ids = self.ips.universe_ids
        expected_returns = np.array([cma_results[aid]["expected_return"] for aid in asset_ids])

        # Step 3: Covariance Agent
        cov_result = self.cov_agent.estimate(asset_ids, macro_regime)
        cov_matrix = cov_result["covariance_matrix"]

        # Step 4: Portfolio Construction (PC) Agents (21 Methods)
        pc_engine = PortfolioConstructionEngine(asset_ids, expected_returns, cov_matrix)
        pc_methods = pc_engine.execute_all_pc_agents()

        # Step 5: CRO Agent Risk Audit & Multi-Agent Strategy Review
        cro_agent = CROAgent(self.ips, asset_ids, expected_returns, cov_matrix)
        cro_reports = cro_agent.audit_all_candidates(pc_methods)

        review_engine = StrategyReviewEngine(macro_regime)
        review_result = review_engine.run_review_and_voting(cro_reports)

        # Step 6: CIO Agent Ensemble Combination & Board Memo
        # IPS 적격 후보만 결합하고, 결합안을 CRO 기준으로 다시 검사한다.
        # 적격 후보가 없거나 결합안이 위반이면 승인하지 않고 위원회 개입으로 넘긴다.
        eligible = [k for k, rep in cro_reports.items() if rep["is_compliant"]]
        cio_agent = CIOAgent(self.ips, asset_ids, expected_returns, cov_matrix)
        method_weights = cio_agent.calculate_ensemble_weights(pc_methods, cro_reports, eligible)
        portfolio_result = cio_agent.synthesize_portfolio(pc_methods, method_weights)
        final_vec = np.array([portfolio_result["weights"][aid] for aid in asset_ids])
        final_check = cro_agent.evaluate_portfolio("final", "최종 SAA", "최종안", final_vec)
        governance = self._governance(cro_reports, eligible, final_check)
        board_memo = cio_agent.generate_board_memo(portfolio_result, macro_result, review_result,
                                                   method_weights, governance)

        return {
            "ips": self.ips.dict(),
            "macro_step": macro_result,
            "cma_step": {
                "cmas": cma_results,
                "asset_count": len(cma_results),
            },
            "covariance_step": {
                "shrinkage_intensity": cov_result["shrinkage_intensity"],
                "regime_stress_factor": cov_result["regime_stress_factor"],
                "narrative": cov_result["narrative"]
            },
            "pc_step": {
                "methods_count": len(pc_methods),
                "methods_summary": [
                    {"key": k, "name": v["name"], "category": v["category"]}
                    for k, v in pc_methods.items()
                ]
            },
            "cro_reports": cro_reports,
            "review_step": review_result,
            "ensemble_step": {
                "method_weights": method_weights,
                "final_portfolio": portfolio_result
            },
            "governance": governance,
            "board_memo": board_memo,
            "timestamp": "March 2026 / Active Run"
        }

    @staticmethod
    def _governance(cro_reports: Dict[str, Any], eligible: list, final_check: Dict[str, Any]) -> Dict[str, Any]:
        """IPS 적격 심사 결과와 최종안 재검사를 묶어 승인/위원회 개입 상태를 정한다."""
        n, total = len(eligible), len(cro_reports)
        approved = n > 0 and final_check["is_compliant"]
        if approved:
            message = f"IPS 적격 후보 {n}/{total}개만 결합했으며, 최종안도 IPS 한도를 충족합니다."
        elif n == 0:
            message = (f"IPS를 충족하는 후보가 {total}개 중 하나도 없어 권고안을 만들지 않았습니다. "
                       "위원회 개입이 필요합니다. 화면의 배분은 전체 후보를 결합한 참고용이며 IPS를 충족하지 않습니다.")
        else:
            message = (f"적격 후보 {n}개를 결합했지만 최종안이 IPS를 위반합니다 "
                       f"({'; '.join(final_check['violations'])}). 위원회 개입이 필요합니다.")
        return {
            "status": "approved" if approved else "escalated",
            "message": message,
            "eligible_count": n,
            "candidate_count": total,
            "eligible": [cro_reports[k]["name"] for k in eligible],
            "excluded": [{"key": k, "name": rep["name"], "violations": rep["violations"]}
                         for k, rep in cro_reports.items() if not rep["is_compliant"]],
            "final_check": {"is_compliant": final_check["is_compliant"],
                            "violations": final_check["violations"]},
        }
