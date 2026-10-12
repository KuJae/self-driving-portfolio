"""
Covariance Agent: Estimates and conditions the asset class covariance matrix.
Applies shrinkage estimation and regime adjustments as described in Section 3.1 & 3.2.
"""

from typing import Dict, List, Any
import numpy as np
from app.data_loader import get_market_dataset

class CovarianceAgent:
    def __init__(self):
        self.role = "Covariance Matrix Estimator"

    def estimate(self, asset_ids: List[str], macro_regime: str) -> Dict[str, Any]:
        """
        Calculates shrinkage covariance matrix conditioned on macro regime.
        In late-cycle / recession, equity-equity correlations rise, while duration hedge (treasuries) strengthens.
        """
        data = get_market_dataset(asset_ids)
        base_cov = data["covariance_matrix"]
        base_corr = data["correlation_matrix"]
        vols = data["volatilities"]

        # Regime adjustment factor
        regime_factor = 1.10 if "Late-Cycle" in macro_regime or "Recession" in macro_regime else 1.0

        # Ledoit-Wolf-style shrinkage toward structured constant-correlation target
        n = len(asset_ids)
        mean_corr = np.mean(base_corr[np.triu_indices(n, k=1)])
        target_corr = np.full((n, n), mean_corr)
        np.fill_diagonal(target_corr, 1.0)
        
        shrinkage_intensity = 0.20
        shrunk_corr = (1 - shrinkage_intensity) * base_corr + shrinkage_intensity * target_corr
        
        # Conditioned covariance
        shrunk_vols = vols * np.sqrt(regime_factor)
        shrunk_cov = np.outer(shrunk_vols, shrunk_vols) * shrunk_corr

        return {
            "covariance_matrix": shrunk_cov,
            "correlation_matrix": shrunk_corr,
            "volatilities": shrunk_vols,
            "shrinkage_intensity": shrinkage_intensity,
            "regime_stress_factor": regime_factor,
            "narrative": f"Covariance matrix conditioned under {macro_regime}. Applied 20% shrinkage toward constant correlation to reduce out-of-sample estimation risk."
        }
