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
        cio_agent = CIOAgent(self.ips, asset_ids, expected_returns, cov_matrix)
        method_weights = cio_agent.calculate_ensemble_weights(pc_methods, cro_reports)
        portfolio_result = cio_agent.synthesize_portfolio(pc_methods, method_weights)
        board_memo = cio_agent.generate_board_memo(portfolio_result, macro_result, review_result)

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
            "board_memo": board_memo,
            "timestamp": "March 2026 / Active Run"
        }
