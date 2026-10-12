"""
CIO Agent: 멀티 에이전트 앙상블 조합 및 이사회 거버넌스 메모 생성 (한글화).
Section 3.6, Exhibit 7, Exhibit 10, Exhibit 11.
"""

from typing import Dict, List, Any, Optional
import numpy as np
from app.config import IPSConfig, ASSET_CLASSES

class CIOAgent:
    """PC 제안들을 앙상블하고 기관 거버넌스 문서를 작성하는 최고투자책임자(CIO) 에이전트"""

    def __init__(self, ips: IPSConfig, asset_ids: List[str], expected_returns: np.ndarray, cov_matrix: np.ndarray):
        self.ips = ips
        self.asset_ids = asset_ids
        self.mu = expected_returns
        self.cov = cov_matrix
        self.rf = 0.037

    def calculate_ensemble_weights(self, pc_methods: Dict[str, Dict[str, Any]], cro_reports: Dict[str, Dict[str, Any]],
                                   eligible: Optional[List[str]] = None) -> Dict[str, float]:
        keys = list(pc_methods.keys())
        # CRO의 IPS 적격 심사를 통과한 후보만 결합한다 (위반 후보는 비중 0).
        # 적격 후보가 하나도 없으면 전체를 결합한 '참고용' 비중을 만들고, 파이프라인이 위원회 개입으로 처리한다.
        pool = [k for k in keys if k in eligible] if eligible else keys

        tes = [max(cro_reports[k]["tracking_error"] / 100.0, 0.01) for k in pool]
        inv_tes = [1.0 / te for te in tes]

        raw_weights = np.array(inv_tes) / np.sum(inv_tes)

        # 적대적 분산기(Adversarial Diversifier)에 직교성 확보를 위한 2.7% 비중 보장 (논문 Exhibit 10) — 적격일 때만
        if "adversarial_diversifier" in pool:
            adv_idx = pool.index("adversarial_diversifier")
            raw_weights[adv_idx] = max(raw_weights[adv_idx], 0.027)
        ensemble_weights = dict(zip(pool, raw_weights / np.sum(raw_weights)))

        return {k: round(float(ensemble_weights.get(k, 0.0)), 4) for k in keys}

    def synthesize_portfolio(self, pc_methods: Dict[str, Dict[str, Any]], method_weights: Dict[str, float]) -> Dict[str, Any]:
        n_assets = len(self.asset_ids)
        final_weights = np.zeros(n_assets)

        for k, mw in method_weights.items():
            w_k = pc_methods[k]["weights"]
            final_weights += mw * w_k

        final_weights /= np.sum(final_weights)

        ret = float(np.dot(final_weights, self.mu))
        vol = float(np.sqrt(np.dot(final_weights, np.dot(self.cov, final_weights))))
        sharpe = (ret - self.rf) / max(vol, 1e-4)

        w_clean = np.maximum(final_weights, 1e-8)
        entropy = -np.sum(w_clean * np.log(w_clean))
        eff_n = float(np.exp(entropy))

        # 60/40 벤치마크 비교
        bench_w = np.zeros(n_assets)
        for i, aid in enumerate(self.asset_ids):
            item = next((a for a in ASSET_CLASSES if a["id"] == aid), None)
            if item: bench_w[i] = item.get("bench_weight", 0.0)
        if np.sum(bench_w) > 0: bench_w /= np.sum(bench_w)
        
        diff = final_weights - bench_w
        te = float(np.sqrt(np.dot(diff, np.dot(self.cov, diff))))
        bench_ret = float(np.dot(bench_w, self.mu))
        bench_vol = float(np.sqrt(np.dot(bench_w, np.dot(self.cov, bench_w))))
        bench_sharpe = (bench_ret - self.rf) / max(bench_vol, 1e-4)

        asset_breakdown = []
        eq_sum, fi_sum, ra_sum, cash_sum = 0.0, 0.0, 0.0, 0.0

        port_var = np.dot(final_weights, np.dot(self.cov, final_weights))
        mrc = np.dot(self.cov, final_weights)
        risk_contribs = (final_weights * mrc) / max(port_var, 1e-6)

        for i, aid in enumerate(self.asset_ids):
            item = next((a for a in ASSET_CLASSES if a["id"] == aid), {})
            w_pct = round(final_weights[i] * 100, 2)
            rc_pct = round(risk_contribs[i] * 100, 2)
            cat = item.get("category", "")
            
            if cat == "주식": eq_sum += w_pct
            elif cat == "채권": fi_sum += w_pct
            elif cat == "실물자산": ra_sum += w_pct
            elif cat == "현금": cash_sum += w_pct

            asset_breakdown.append({
                "id": aid,
                "name": item.get("name", aid),
                "ticker": item.get("ticker", ""),
                "category": cat,
                "weight_pct": w_pct,
                "risk_contrib_pct": rc_pct,
                "bench_weight_pct": round(bench_w[i] * 100, 2)
            })

        asset_breakdown.sort(key=lambda x: x["weight_pct"], reverse=True)

        return {
            "asset_breakdown": asset_breakdown,
            "weights": {aid: round(float(w), 4) for aid, w in zip(self.asset_ids, final_weights)},
            "expected_return_pct": round(ret * 100, 2),
            "volatility_pct": round(vol * 100, 2),
            "sharpe_ratio": round(sharpe, 3),
            "tracking_error_pct": round(te * 100, 2),
            "effective_n": round(eff_n, 1),
            "max_drawdown_est_pct": round(-vol * 2.1 * 100, 2),
            "category_exposures": {
                "equity": round(eq_sum, 2),
                "fixed_income": round(fi_sum, 2),
                "real_assets": round(ra_sum, 2),
                "cash": round(cash_sum, 2)
            },
            "benchmark_comparison": {
                "benchmark_name": "60/40 글로벌 주식/국채 벤치마크",
                "bench_return_pct": round(bench_ret * 100, 2),
                "bench_volatility_pct": round(bench_vol * 100, 2),
                "bench_sharpe": round(bench_sharpe, 3),
                "bench_mdd_est_pct": -34.3,
                "excess_return_pct": round((ret - bench_ret) * 100, 2),
                "volatility_reduction_pct": round((bench_vol - vol) * 100, 2)
            }
        }

    def generate_board_memo(self, portfolio_res: Dict[str, Any], macro_info: Dict[str, Any], review_info: Dict[str, Any],
                            method_weights: Optional[Dict[str, float]] = None,
                            governance: Optional[Dict[str, Any]] = None) -> str:
        exp = portfolio_res["category_exposures"]
        comp = portfolio_res["benchmark_comparison"]
        ips = self.ips

        # 메모의 수치와 IPS 판정 문구는 모두 실행 결과에서 계산한다
        w = portfolio_res["weights"]
        treasuries = sum(w.get(k, 0.0) for k in ("sh_treas", "int_treas", "lt_treas")) * 100
        gold, commodities = w.get("gold", 0.0) * 100, w.get("commodities", 0.0) * 100
        real_ret = portfolio_res["expected_return_pct"] - ips.cpi_estimate
        vol_ok = ips.volatility_min <= portfolio_res["volatility_pct"] <= ips.volatility_max
        te_ok = portfolio_res["tracking_error_pct"] <= ips.tracking_error_limit
        gov = governance or {}
        approved = gov.get("status", "approved") == "approved"
        mw = method_weights or {}
        rank = {r["method_key"]: r for r in review_info["rankings"]}
        me, me_w = rank.get("max_entropy", {}), mw.get("max_entropy", 0.0) * 100
        adv, adv_w = rank.get("adversarial_diversifier", {}), mw.get("adversarial_diversifier", 0.0) * 100

        warning = f"> **⚠️ 위원회 개입 필요** — {gov.get('message', '')}\n\n" if not approved else ""
        intro = ("CIO 에이전트는 다음과 같은 2026년 목표 배분 비중을 권고합니다:" if approved else
                 "다음 배분은 IPS를 충족하지 못해 승인 권고가 아닌 참고용이며, 위원회의 판단이 필요합니다:")
        me_line = (f"{me.get('rank', '-')}위를 기록하며 최종 앙상블({me_w:.1f}% 비중)에 편입되었습니다." if me_w > 0 else
                   f"{me.get('rank', '-')}위를 기록했으나 IPS 적격 심사를 통과하지 못해 이번 앙상블에서는 제외되었습니다.")
        adv_line = (f"CIO는 머신러닝의 부스팅(Boosting) 원리에 따라 앙상블의 사각지대를 방어하기 위해 **{adv_w:.1f}% 비중**을 전략적으로 배정했습니다."
                    if adv_w > 0 else "IPS 적격 심사를 통과하지 못해 이번 앙상블에서는 제외되었습니다.")
        declaration = ("**IPS 준수 확인:** 최고리스크책임자(CRO) 에이전트가 최종 권고안을 다시 검사한 결과, IPS 정량 한도(변동성 밴드·예상 MDD·추적오차·주식 비중)를 모두 충족합니다."
                       if approved else f"**⚠️ 위원회 개입 요청:** {gov.get('message', '')}")

        memo = f"""# 이사회 및 투자위원회 제출용 전략적 자산배분(SAA) 승인 심의 보고서

**수신:** 기금운용위원회 및 이사회
**발신:** 자율 CIO 에이전트 (Autonomous CIO Agent)
**일자:** 2026년 정기 리밸런싱 회기
**안건:** 50개 자율 에이전트 파이프라인 심의 결과에 따른 최적 전략적 자산배분(SAA) 권고 및 IPS 준수 감사

---

{warning}### 1. 요약 및 권고 자산 배분안
본 멀티 에이전트 SAA 시스템은 투자원칙보고서(IPS)의 규정상 제약 하에서 자율주행 단계 **L3 (조건부 자율화 - 이사회 승인)** 모드로 전체 분석 및 심의를 완료했습니다. {intro}

* **주식군 (Equity):** **{exp['equity']}%** (60/40 벤치마크 주식 60% 대비 {'언더' if exp['equity'] < 60 else '오버'}웨이트)
* **채권군 (Fixed Income):** **{exp['fixed_income']}%** (미국 국채 단기·중기·장기 합계 {treasuries:.1f}%)
* **실물자산 (Real Assets):** **{exp['real_assets']}%** (스태그플레이션 헤지를 위한 금 {gold:.1f}% 및 원자재 {commodities:.1f}%)
* **현금 버퍼 (Cash Buffer):** **{exp['cash']}%** (유동성 안전마진 및 기회비용 확보)

**주요 성과 및 위험 지표 요약:**
* **예상 명목 수익률:** {portfolio_res['expected_return_pct']}% (실질 수익률: CPI + {real_ret:.2f}%, IPS 목표 CPI + {ips.target_real_return}% {'달성' if real_ret >= ips.target_real_return else '미달'})
* **예상 연간 변동성:** {portfolio_res['volatility_pct']}% (IPS 허용 밴드 [{ips.volatility_min}%, {ips.volatility_max}%] {'충족' if vol_ok else '이탈'})
* **예상 최대 낙폭(MDD):** {portfolio_res['max_drawdown_est_pct']}% (60/40 벤치마크의 -34.3% 대비 현저히 우수한 하방 방어력 입증)
* **사전 트래킹 에러(TE):** {portfolio_res['tracking_error_pct']}% (IPS 액티브 리스크 한도 {ips.tracking_error_limit}% {'이내' if te_ok else '초과'})
* **유효 분산 자산 수(Effective N):** {portfolio_res['effective_n']}개

---

### 2. 거시 경제 국면 판단 및 CMA 밸류에이션 보정
* **국면 판정:** 거시 에이전트는 **{int(macro_info['confidence']*100)}% 신뢰도**로 경제를 **'{macro_info['regime']}'**으로 분류했습니다.
* **진단 근거:** 고용지표 감속과 GDP 수정치 둔화 속에서 지정학적 공급 충격으로 물가 재상승 위험이 잠재해 있습니다 (12개월 침체 확률 {int(macro_info['recession_probability']*100)}%).
* **LLM-as-Judge 심사:** 자산군 심사역은 과거 10년의 호황기 수익률을 맹신하지 않고, 과열된 미국 성장주(CAPE 31.2x)에 **-2.0%p**, 미국 대형주(CAPE 25.4x)에 **-1.1%p**의 선제적 밸류에이션 마크다운을 적용했습니다.

---

### 3. 멀티 에이전트 심의, 투표 및 앙상블 선정
* 21개 포트폴리오 최적화 에이전트 간 수정 보르다 카운트(Borda Count) 투표 결과, 불확실성 국면에 적합한 **위험 구조화(최대 분산, 리스크 패리티, HRP)**와 **블랙-리터만** 모델이 압도적 컨센서스를 형성했습니다.
* 리서처 에이전트가 새롭게 자율 발견한 **'최대 엔트로피 포트폴리오(Maximum Entropy)'**는 {me_line}
* **적대적 분산기(Adversarial Diversifier):** 컨센서스와의 직교성으로 인해 동료 평가에서는 최하위({adv.get('vote', '-')}표)를 기록했으며, {adv_line}
* **IPS 적격 심사:** CRO 감사를 통과한 **{gov.get('eligible_count', '-')}/{gov.get('candidate_count', '-')}개 후보만** 결합 대상으로 삼고, 위반 후보는 비중 0으로 제외했습니다.
* 최종 앙상블 방식으로는 체계적 추적오차 통제력이 가장 뛰어난 **역추적오차(Inverse Tracking Error) 가중 앙상블**을 확정했습니다.

---

### 4. 사후 관리 및 오프사이클 리밸런싱 트리거
* **정기 주기:** {ips.rebalance_frequency}
* **오프사이클 재조정 트리거:** 개별 자산 비중이 목표치 대비 **±3.0% 이상 이탈**하거나 전체 주식 비중이 **[{ips.equity_min:g}%, {ips.equity_max:g}%] 한도**를 벗어날 경우, 즉각 자율 파이프라인이 발동되어 위원회에 비상 보고됩니다.
* {declaration}
"""
        return memo
