"""
18개 자산군 ETF의 월간 총수익률을 받아 '실데이터 백테스트' 탭이 읽는 CSV로 저장합니다.

  pip install yfinance
  cd backend && python scripts/fetch_returns.py

배당 포함 수정주가(auto_adjust=True) 월봉을 받아 월간 수익률(소수)로 바꿉니다.
진행 중인 이번 달은 버리고, 18개 ETF 모두 값이 있는 달만 남깁니다.
배포 서버는 인터넷에서 받지 않고 이 스크립트가 만든 CSV만 읽습니다.
"""

import json
import sys
import time
from datetime import date
from pathlib import Path

import pandas as pd
import yfinance as yf

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
from app.config import ASSET_CLASSES  # noqa: E402

OUT = BACKEND / "data" / "etf_monthly_returns.csv"
META = BACKEND / "data" / "etf_monthly_returns.meta.json"
START = "2013-01-01"


def main() -> None:
    tickers = [a["ticker"] for a in ASSET_CLASSES]
    for attempt in range(1, 6):
        try:
            px = yf.download(tickers, start=START, interval="1mo", auto_adjust=True,
                             progress=False, threads=False)["Close"]
            if px.dropna(how="all").empty:
                raise RuntimeError("빈 응답")
            break
        except Exception as e:
            print(f"  시도 {attempt} 실패: {e}")
            time.sleep(5 * attempt)
    else:
        sys.exit("데이터를 받지 못했습니다.")

    px = px[tickers]
    px = px[px.index < pd.Timestamp(date.today().replace(day=1))]   # 진행 중인 달 제외
    ret = px.pct_change(fill_method=None).dropna(how="any")          # 18개 모두 값이 있는 달만
    ret.index = ret.index.strftime("%Y-%m")
    ret.index.name = "month"

    OUT.parent.mkdir(exist_ok=True)
    ret.round(6).to_csv(OUT)
    META.write_text(json.dumps({
        "source": "Yahoo Finance",
        "method": "yfinance download(interval='1mo', auto_adjust=True) — 배당·분할 반영 수정주가 월말 종가의 월간 변화율",
        "fetched_at": date.today().isoformat(),
        "tickers": tickers,
        "first_month": ret.index[0],
        "last_month": ret.index[-1],
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  저장: {OUT.relative_to(BACKEND)}, {META.relative_to(BACKEND)}")
    print(f"  기간: {ret.index[0]} ~ {ret.index[-1]} · {len(ret)}개월 · {ret.shape[1]}개 ETF")


if __name__ == "__main__":
    main()
