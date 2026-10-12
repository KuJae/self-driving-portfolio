# 코드 리뷰 가이드 (Code Review Guide)

이 문서는 **The Self-Driving Portfolio** 웹 애플리케이션의 프론트엔드/백엔드 구현 코드가 원문 논문(*The Self-Driving Portfolio: Agentic Architecture for Institutional Asset Management*, Ang et al., 2026)의 수식 및 아키텍처와 어떻게 1:1로 매핑되어 있는지 검토하기 위한 안내서입니다.

---

## 1. 논문 Stage별 백엔드 핵심 코드 위치

| 논문 단계 (Stage) | 담당 에이전트 | 백엔드 소스 파일 | 핵심 구현 알고리즘 및 검토 포인트 |
| :--- | :--- | :--- | :--- |
| **Stage 1** | Macro Agent (거시경제 분석가) | `backend/app/agents/macro_agent.py` | • 실질 GDP 성장률, 코어 CPI, 기준금리, 재정적자 데이터를 분석하여 거시 레짐(`Soft Landing with Sticky Inflation Bias`) 도출 |
| **Stage 2-A** | Asset Class Agents (주식/금리/크레딧) | `backend/app/agents/asset_class_agent.py` | • 12개 자산군을 주식(Equities), 금리/국채(Rates), 크레딧(Credit) 3개 전문 에이전트로 분할하여 10년 연율화 기대수익률(CMA) 및 신뢰구간 산출 |
| **Stage 2-B** | Covariance Agent (공분산 추정가) | `backend/app/agents/covariance_agent.py` | • **지수가중 이동평균(EWMA, 반감기 $\tau=60$개월)** 표본 공분산 계산<br>• **Oracle Approximating Shrinkage (OAS, Chen et al. 2010)** 수축 계수 $\hat{\alpha}_{OAS}$ 산출 및 정부채 앵커 타겟 행렬($F$) 결합 |
| **Stage 3** | PC Agents (포트폴리오 구성 3인) | `backend/app/agents/pc_agents.py` | • **PC 1 (Market-Proportional)**: 글로벌 시장 시가총액 비중 기반 구성<br>• **PC 2 (Mean-Variance)**: `scipy.optimize.minimize`(SLSQP) 기반 효용 함수 $\max_w w^T\mu - \frac{\gamma}{2}w^T\Sigma w$ 최적화<br>• **PC 3 (Black-Litterman)**: 역최적화 내재 균형수익률 $\Pi = \delta\Sigma w_{mkt}$ 와 Stage 2 뷰($P, Q, \Omega$)를 결합한 베이지안 사후 분포($\mu_{BL}, \Sigma_{BL}$) 최적화 |
| **Stage 4** | CRO Agent (최고리스크책임자) | `backend/app/agents/cro_agent.py` | • **몬테카를로 시뮬레이션(10,000회 경로)**: 95% CVaR(조건부 가치위험) 및 예상 최대낙폭(Max Drawdown) 정량 계산<br>• **거부권(Veto) 및 재최적화 루프**: IPS 한도 초과 시 `pipeline.py`에서 위험회피계수($\gamma$)를 상향하여 Stage 3 재실행 |
| **Stage 5** | 12-Person Voting (투자위원회 표결) | `backend/app/agents/review_voting_agent.py` | • 12명 위원(CIO, CRO, 매크로, 자산군 헤드 3인, PC 매니저 3인, 외부 자문 3인)의 1인 1표 정족수(Quorum $\ge 60\%$) 투표 및 소수 반대 의견(Dissenting Opinion) 보존 |
| **Stage 6** | CIO Agent (최고투자책임자) | `backend/app/agents/cio_agent.py` | • 채택된 후보안(Black-Litterman)에 위원회 부대의견(크레딧 과열 방어를 위한 미국 단기채 2%p 가산 등)을 반영해 최종 SAA 비중 확정 및 한국어 이사회 메모 생성 |

---

## 2. 프론트엔드 UI 컴포넌트별 검토 포인트

| 화면 영역 | 소스 파일 | 주요 기능 |
| :--- | :--- | :--- |
| **전체 상태 및 레이아웃** | `frontend/src/App.tsx` | • 파이프라인 상태 폴링(`/api/state`), 실시간 파이프라인 재실행(`/api/pipeline/run`), 4개 분석 탭 전환 |
| **6단계 파이프라인 배너** | `frontend/src/components/PipelineVisualizer.tsx` | • Stage 1~6 각 에이전트의 완료 상태, 소요 시간, 핵심 산출물 요약 카드 표시 |
| **탭 1: 종합 대시보드** | `frontend/src/components/OverviewTab.tsx` | • 핵심 KPI 카드 4개(기대수익률, 변동성, 샤프비율, 95% CVaR)<br>• 12개 자산군 비중 그룹 막대차트(Recharts) 및 자산군별 상세 비중 증감(`Δ`) 테이블 |
| **탭 2: 위원회 투표 & 거버넌스** | `frontend/src/components/VotingTab.tsx` | • 12인 위원별 찬성/반대 배지, 선호 후보안, 확신도(1~10), 투표 근거 카드 및 5대 조건부 승인 조건 리스트 |
| **탭 3: CMA & 공분산 행렬** | `frontend/src/components/CmaTab.tsx` | • 12개 자산군 기대수익률 vs 변동성 위험-수익 산점도 및 12×12 상관계수 컬러 히트맵 |
| **탭 4: CIO 이사회 메모** | `frontend/src/components/BoardMemoTab.tsx` | • 이사회 보고용 공식 투자 메모(마크다운 렌더링) 및 Stage 1~6 전체 감사 로그(Audit Trail) 타임라인 |
| **IPS 제약조건 설정 모달** | `frontend/src/components/IpsModal.tsx` | • 변동성 한도, CVaR 한도, 최대낙폭 한도, 위험회피계수($\gamma$) 슬라이더 조작 및 즉시 재최적화 트리거 |

---

## 3. API 엔드포인트 명세 (`backend/app/main.py`)

* `GET /api/state` : 현재 실행 완료된 6단계 파이프라인 전체 상태 및 JSON 결과 반환
* `POST /api/pipeline/run` : 사용자 정의 IPS 파라미터(선택)를 입력받아 Stage 1~6 파이프라인을 즉시 재실행하고 결과 반환
* `POST /api/pipeline/reset` : 논문 기본 IPS 설정값으로 파이프라인 초기화
* `GET /api/health` : 서버 상태 및 LLM 모드(`simulation` / `openai` / `gemini`) 확인
