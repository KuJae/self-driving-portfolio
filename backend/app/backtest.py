"""
Real-Data Backtest: 파이프라인이 낸 최종 SAA·21개 PC 후보·60/40 벤치마크 비중을
18개 ETF의 실제 월간 총수익률에 적용한 사후 시뮬레이션 (발표 로드맵 Phase 3).

에이전트 계산 로직은 건드리지 않고, 파이프라인 결과의 비중만 읽어 사용합니다.
데이터: backend/data/etf_monthly_returns.csv (scripts/fetch_returns.py 로 갱신)
"""

from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd

from app.config import ASSET_CLASSES

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "etf_monthly_returns.csv"
REBALANCE_EVERY_MONTHS = 3  # 분기별 — IPS 기본 리밸런싱 주기와 동일
TICKER_BY_ID = {a["id"]: a["ticker"] for a in ASSET_CLASSES}


@lru_cache(maxsize=1)
def load_returns() -> pd.DataFrame:
    """월간 총수익률 패널 [월 × 18 ETF]. 서버 실행 중 한 번만 읽습니다."""
    return pd.read_csv(DATA_PATH, index_col="month")


def _to_vector(weights: Dict[str, float], tickers: List[str]) -> np.ndarray:
    """자산군 id 기준 비중을 티커 순서 벡터로 바꾸고 합 1로 정규화합니다."""
    col = {t: i for i, t in enumerate(tickers)}
    w = np.zeros(len(tickers))
    for aid, v in weights.items():
        if aid in TICKER_BY_ID:
            w[col[TICKER_BY_ID[aid]]] += float(v)
    s = w.sum()
    return w / s if s > 0 else w


def _simulate(target: np.ndarray, returns: np.ndarray) -> np.ndarray:
    """분기마다 목표 비중으로 되돌리고, 그 사이에는 시장 움직임대로 비중이 변하는 NAV 경로 (시작 100)."""
    nav = [100.0]
    w = target.copy()
    for t, r in enumerate(returns):
        if t % REBALANCE_EVERY_MONTHS == 0:
            w = target.copy()
        grown = w * (1.0 + r)
        gross = grown.sum()
        nav.append(nav[-1] * gross)
        w = grown / gross
    return np.array(nav)


def _metrics(nav: np.ndarray, rf: float) -> Dict[str, float]:
    rets = nav[1:] / nav[:-1] - 1.0
    years = len(rets) / 12.0
    cagr = (nav[-1] / nav[0]) ** (1.0 / years) - 1.0
    vol = float(rets.std(ddof=1) * np.sqrt(12))
    mdd = float((nav / np.maximum.accumulate(nav) - 1.0).min())
    return {
        "cagr_pct": round(cagr * 100, 2),
        "volatility_pct": round(vol * 100, 2),
        "sharpe_ratio": round((cagr - rf) / vol, 3) if vol > 0 else 0.0,
        "max_drawdown_pct": round(mdd * 100, 2),
        "final_nav": round(float(nav[-1]), 1),
    }


def run_backtest(result: Dict[str, Any]) -> Dict[str, Any]:
    panel = load_returns()
    tickers = list(panel.columns)
    returns = panel.values
    months = list(panel.index)
    rf = float((1.0 + panel["BIL"]).prod() ** (12.0 / len(panel)) - 1.0)  # 같은 기간 초단기채 실현 연율

    bench = {a["id"]: a.get("bench_weight", 0.0) for a in ASSET_CLASSES}
    portfolios = [
        ("final", "최종 SAA (CIO 앙상블)", "최종안", result["ensemble_step"]["final_portfolio"]["weights"]),
        ("benchmark", "60/40 벤치마크", "벤치마크", bench),
    ] + [(k, rep["name"], rep["category"], rep["weights"]) for k, rep in result["cro_reports"].items()]

    series, rows = {}, []
    for key, name, category, weights in portfolios:
        nav = _simulate(_to_vector(weights, tickers), returns)
        series[key] = [round(float(x), 2) for x in nav]
        rows.append({"key": key, "name": name, "category": category,
                     "is_final": key == "final", "is_benchmark": key == "benchmark",
                     **_metrics(nav, rf)})
    rows.sort(key=lambda r: r["sharpe_ratio"], reverse=True)

    start_label = str(pd.Period(months[0], freq="M") - 1)  # NAV 100 = 첫 달 직전 월말
    return {
        "period": {"start": months[0], "end": months[-1], "months": len(months)},
        "rebalance": f"{REBALANCE_EVERY_MONTHS}개월마다 목표 비중으로 복원 (분기별)",
        "risk_free_pct": round(rf * 100, 2),
        "data_source": "Yahoo Finance 배당 포함 수정주가 월봉 (yfinance)",
        "tickers": tickers,
        "dates": [start_label] + months,
        "series": series,
        "rows": rows,
    }
