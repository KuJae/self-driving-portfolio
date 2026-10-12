"""
Macro Agent: 거시 경제 및 시장 지표를 기반으로 경제 국면을 판정.
Based on Section 3.1 & Section 4.1 of the paper.
"""

from typing import Dict, Any

class MacroAgent:
    def __init__(self):
        self.role = "거시 경제 국면 분류 에이전트 (Macro Regime Classifier)"
        self.description = "성장률, 인플레이션, 통화정책, 금융상황 지표를 다차원 분석하여 경제 국면을 판정합니다."

    def run(self, custom_inputs: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        거시 경제 국면 분류 로직.
        지표:
          - 성장률 (-1 ~ +1): 경기 감속/침체 시그널 vs 가속
          - 인플레이션 (-1 ~ +1): 디스인플레이션 vs 스태그플레이션/재상승 압력
          - 통화정책 (-1 ~ +1): 완화 vs 긴축/고금리 장기화
          - 금융여건 (-1 ~ +1): 완화적 vs 신용 스프레드 확대/긴축적
        """
        inputs = {
            "gdp_growth_revision": -0.35, # 성장 둔화
            "payroll_trend": -0.40,       # 고용 지표 둔화
            "cpi_inflation": 0.45,        # 원자재 공급 충격 및 서비스 물가 경직성
            "monetary_policy_stance": 0.20, # 고금리 유지/금리 인하 지연
            "financial_conditions": -0.15 # 신용 스프레드 축소 제한
        }
        if custom_inputs:
            inputs.update(custom_inputs)

        growth_score = (inputs["gdp_growth_revision"] + inputs["payroll_trend"]) / 2.0
        inflation_score = inputs["cpi_inflation"]
        monetary_score = inputs["monetary_policy_stance"]
        financial_score = inputs["financial_conditions"]

        # 논문 4.1절 국면 판정 로직
        if growth_score < 0 and inflation_score > 0.2:
            regime = "후기 사이클 (스태그플레이션 위험)"
            regime_slug = "late-cycle"
            recession_prob = 0.32
            confidence = 0.82
            recommendation = "밸류에이션 규율 강화, 고평가 성장주 비중 축소, 실물자산(금·원자재) 및 방어적 유동성 확대."
        elif growth_score < -0.4:
            regime = "침체 국면 (Recession)"
            regime_slug = "recession"
            recession_prob = 0.68
            confidence = 0.85
            recommendation = "안전자산 선호, 미국 장기국채 및 현금 비중 대폭 확대, 주식 축소."
        elif growth_score > 0.2 and inflation_score < 0.2:
            regime = "확장 국면 (Expansion)"
            regime_slug = "expansion"
            recession_prob = 0.12
            confidence = 0.88
            recommendation = "경기 순응적 포지션, 주식 비중 확대 및 시가총액 가중 최적화 적용."
        else:
            regime = "회복 국면 (Recovery)"
            regime_slug = "recovery"
            recession_prob = 0.20
            confidence = 0.75
            recommendation = "초기 경기 회복, 가치주 및 중소형주 주식 비중 확대."

        narrative = (
            f"거시 분석 에이전트(Macro Agent)는 현재 경제 국면을 {int(confidence*100)}%의 신뢰도로 "
            f"'{regime}'으로 판정했습니다. 미국 실질 GDP 성장이 하향 조정되고 고용 지표가 둔화되는 추세이며(성장 지표: {growth_score:+.2f}), "
            f"유가 및 지정학적 공급망 충격으로 인해 인플레이션 반등 리스크가 잔존합니다(물가 지표: {inflation_score:+.2f}). "
            f"향후 12개월 내 기본 경기침체 확률은 {int(recession_prob*100)}%로 산출되었습니다. "
            f"이에 따라 후속 자산군(AC) 및 포트폴리오 최적화(PC) 에이전트들은 과거 단순 추세 추종을 지양하고, "
            f"공분산 강건성과 밸류에이션 안전마진을 최우선으로 반영하도록 지시되었습니다."
        )

        return {
            "agent": "macro-agent",
            "regime": regime,
            "regime_slug": regime_slug,
            "confidence": confidence,
            "recession_probability": recession_prob,
            "dimension_scores": {
                "growth": round(growth_score, 2),
                "inflation": round(inflation_score, 2),
                "monetary_policy": round(monetary_score, 2),
                "financial_conditions": round(financial_score, 2)
            },
            "recommendation": recommendation,
            "narrative": narrative
        }
