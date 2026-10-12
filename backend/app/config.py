"""
Configuration and IPS (Investment Policy Statement) definitions
Based on 'The Self-Driving Portfolio: Agentic Architecture for Institutional Asset Management'
by Andrew Ang, Nazym Azimbayev, Andrey Kim (2026).
"""

from typing import List, Dict, Any
from pydantic import BaseModel, Field

# 18 Liquid Asset Classes described in Section 4 & Exhibit 11 of the paper (with Korean labels)
ASSET_CLASSES: List[Dict[str, Any]] = [
    # 주식군 (6)
    {"id": "us_large_cap", "name": "미국 대형주 (S&P 500)", "ticker": "SPY", "category": "주식", "bench_weight": 0.35, "cape_historical": 25.4},
    {"id": "us_growth", "name": "미국 성장주", "ticker": "VUG", "category": "주식", "bench_weight": 0.10, "cape_historical": 31.2},
    {"id": "us_value", "name": "미국 가치주", "ticker": "VTV", "category": "주식", "bench_weight": 0.10, "cape_historical": 18.5},
    {"id": "us_small_cap", "name": "미국 중소형주 (러셀 2000)", "ticker": "IWM", "category": "주식", "bench_weight": 0.05, "cape_historical": 19.8},
    {"id": "intl_dev", "name": "선진국 주식 (EAFE)", "ticker": "EFA", "category": "주식", "bench_weight": 0.00, "cape_historical": 15.2},
    {"id": "emg_mkts", "name": "신흥국 주식 (EM)", "ticker": "EEM", "category": "주식", "bench_weight": 0.00, "cape_historical": 13.1},
    
    # 채권군 (8)
    {"id": "sh_treas", "name": "미국 단기국채 (1-3년)", "ticker": "SHY", "category": "채권", "bench_weight": 0.05, "duration": 1.9},
    {"id": "int_treas", "name": "미국 중기국채 (7-10년)", "ticker": "IEF", "category": "채권", "bench_weight": 0.20, "duration": 7.4},
    {"id": "lt_treas", "name": "미국 장기국채 (20년+)", "ticker": "TLT", "category": "채권", "bench_weight": 0.05, "duration": 16.8},
    {"id": "ig_corps", "name": "투자등급 회사채 (IG)", "ticker": "LQD", "category": "채권", "bench_weight": 0.05, "duration": 8.1},
    {"id": "hy_corps", "name": "하이일드 회사채 (HY)", "ticker": "HYG", "category": "채권", "bench_weight": 0.02, "duration": 3.8},
    {"id": "intl_sov", "name": "해외 선진국 국채", "ticker": "BNDX", "category": "채권", "bench_weight": 0.03, "duration": 7.0},
    {"id": "intl_corps", "name": "해외 회사채", "ticker": "PICB", "category": "채권", "bench_weight": 0.00, "duration": 6.5},
    {"id": "usd_em_debt", "name": "신흥국 달러표시 채권", "ticker": "EMB", "category": "채권", "bench_weight": 0.00, "duration": 6.9},
    
    # 실물자산 및 현금 (4)
    {"id": "gold", "name": "금 (Gold)", "ticker": "GLD", "category": "실물자산", "bench_weight": 0.00},
    {"id": "commodities", "name": "원자재 (Commodities)", "ticker": "DBC", "category": "실물자산", "bench_weight": 0.00},
    {"id": "reits", "name": "글로벌 리츠 (부동산)", "ticker": "VNQ", "category": "실물자산", "bench_weight": 0.00, "cape_historical": 22.0},
    {"id": "cash", "name": "현금성 자산 (초단기채)", "ticker": "BIL", "category": "현금", "bench_weight": 0.00, "duration": 0.1},
]

class IPSConfig(BaseModel):
    """Investment Policy Statement governing the autonomous multi-agent pipeline"""
    universe_ids: List[str] = Field(
        default_factory=lambda: [a["id"] for a in ASSET_CLASSES],
        description="포트폴리오 투자 가능 자산군 유니버스"
    )
    target_real_return: float = Field(default=3.5, description="목표 실질 수익률 (CPI + X%)")
    cpi_estimate: float = Field(default=2.5, description="예상 기준 CPI 인플레이션율 (%)")
    volatility_min: float = Field(default=8.0, description="최소 허용 변동성 (%)")
    volatility_max: float = Field(default=12.0, description="최대 허용 변동성 (%)")
    max_drawdown_limit: float = Field(default=-25.0, description="최대 허용 낙폭(MDD) 한도 (%)")
    tracking_error_limit: float = Field(default=6.0, description="60/40 벤치마크 대비 사전 트래킹 에러 한도 (%)")
    equity_min: float = Field(default=25.0, description="최소 주식 비중 (%)")
    equity_max: float = Field(default=65.0, description="최대 주식 비중 (%)")
    cash_min: float = Field(default=2.0, description="최소 현금 버퍼 비중 (%)")
    rebalance_frequency: str = Field(default="분기별 (Quarterly)", description="정기 리밸런싱 주기")
    autonomy_level: str = Field(default="L3 (조건부 자율화 - 이사회 승인)", description="SAE J3016 자율주행 단계")

DEFAULT_IPS = IPSConfig()
