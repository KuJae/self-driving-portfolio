# The Self-Driving Portfolio (자율주행 포트폴리오)
> **기관 자산운용을 위한 멀티 에이전트 아키텍처 (Multi-Agent Architecture for Institutional Asset Management)**  
> 기반 논문: *The Self-Driving Portfolio: Agentic Architecture for Institutional Asset Management* (Andrew Ang, Nazym Azimbayev, Andrey Kim, April 2026)

**🌐 라이브 데모: <https://self-driving-portfolio.onrender.com>** (무료 플랜 — 15분간 접속이 없으면 절전되어 첫 접속에 1분 정도 걸립니다)

---

## 1. 프로젝트 개요 (Overview)

본 프로젝트는 기관 투자자(연기금, 국부펀드 등)의 **전략적 자산배분(SAA, Strategic Asset Allocation)** 프로세스를 13개 전문 AI 에이전트의 6단계(Stage 1~6) 협업 및 견제 파이프라인으로 구현한 **Full-Stack 웹 애플리케이션(FastAPI + React/TypeScript)**입니다.

### 핵심 아키텍처 원칙 (4대 설계 원칙)
1. **전문성 분리 (Specialization)**: 거시경제(Macro), 자산군(Equities/Rates/Credit), 공분산(Covariance), 포트폴리오 구성(PC), 리스크(CRO), 최고투자책임자(CIO)로 역할 분리
2. **도구 결정론 (Tool Determinism)**: LLM의 수학적 환각(Hallucination)을 방지하기 위해 OAS 수축 추정, Black-Litterman 최적화, 몬테카를로 CVaR 시뮬레이션은 순수 Python(`numpy`/`scipy`) 수리 엔진이 전담
3. **적대적 크리틱 루프 (Adversarial Critique Loop)**: CRO 에이전트가 IPS(투자정책서) 한도 위반 시 거부권(Veto)을 행사하고 PC 에이전트에게 재최적화를 강제
4. **투명한 감사 추적 (Audit Trail)**: 12인 위원회 정족수 투표 기록 및 CIO 이사회 투자 메모(Board Memo) 자동 생성

---

## 2. 시스템 아키텍처 및 코드 구조 (Repository Structure)

```text
self-driving-portfolio/
├── README.md                        # 프로젝트 개요 및 실행 가이드
├── CODE_REVIEW_GUIDE.md             # 코드 리뷰어를 위한 파일별·수식별 상세 매핑 가이드
├── run_project.bat                  # 원클릭 로컬 서버 실행 스크립트 (Windows)
├── run_public_tunnel.bat            # 외부 인터넷 공유용 Cloudflare 터널 스크립트
│
├── backend/                         # Python FastAPI 백엔드 및 6단계 에이전트 엔진
│   ├── requirements.txt             # Python 패키지 의존성
│   ├── .env.example                 # 환경변수 예시 파일 (API 키 없이도 100% 동작)
│   └── app/
│       ├── main.py                  # FastAPI 엔드포인트 (/api/state, /api/pipeline/run 등)
│       ├── config.py                # 12개 자산군 정의, 기준년월(2025.12), 기본 IPS 설정
│       ├── data_loader.py           # 12개 자산군 지수 수익률 및 거시경제 시계열 로더
│       ├── pipeline.py              # Stage 1 ~ Stage 6 멀티 에이전트 오케스트레이터
│       └── agents/
│           ├── llm_client.py        # LLM 호출 래퍼 (OpenAI / Gemini / 시뮬레이션 폴백)
│           ├── macro_agent.py       # [Stage 1] 거시경제 레짐 진단 (성장/인플레/정책)
│           ├── asset_class_agent.py # [Stage 2] 3대 자산군(주식·금리·크레딧) 10년 CMA 산출
│           ├── covariance_agent.py  # [Stage 2] 지수가중(EWMA) + OAS Shrinkage 공분산 추정
│           ├── pc_agents.py         # [Stage 3] 3대 철학(시장이유/MV/BL) 포트폴리오 최적화
│           ├── cro_agent.py         # [Stage 4] 몬테카를로 CVaR(95%)/MDD 검증 및 거부권 루프
│           ├── review_voting_agent.py # [Stage 5] 12인 투자위원회 투표 및 조건부 승인 집계
│           └── cio_agent.py         # [Stage 6] 최종 SAA 비중 확정 및 이사회 메모 작성
│
└── frontend/                        # React 19 + TypeScript + Tailwind CSS + Recharts 대시보드
    ├── package.json
    ├── vite.config.ts               # Vite 설정 및 /api 리버스 프록시 구성
    └── src/
        ├── App.tsx                  # 메인 대시보드 상태 관리 및 탭 라우팅
        ├── api.ts                   # 백엔드 REST API 연동 클라이언트
        ├── types.ts                 # 전체 파이프라인 데이터 TypeScript 인터페이스
        └── components/
            ├── Header.tsx           # 상단 상태 바, IPS 설정 버튼, 파이프라인 실행 트리거
            ├── PipelineVisualizer.tsx # 6단계 멀티 에이전트 실행 상태 실시간 시각화
            ├── OverviewTab.tsx      # [종합 대시보드] SAA 비중 비교 차트, 리스크 지표, 거시 요약
            ├──VotingTab.tsx        # [위원회 투표] 12인 위원 찬반 표결, 신뢰도, 조건부 승인 내역
            ├── CmaTab.tsx           # [CMA & 공분산] 12개 자산군 기대수익률·변동성 및 상관계수 히트맵
            ├── BoardMemoTab.tsx     # [이사회 메모] CIO 최종 투자 메모 및 감사 추적 리포트
            └── IpsModal.tsx         # [IPS 설정 모달] 리스크 한도(변동성·CVaR·MDD) 실시간 변경 및 재실행
```

---

## 3. 빠른 실행 방법 (Quick Start)

### 방법 A: Windows 원클릭 실행
프로젝트 루트 폴더의 `run_project.bat` 파일을 더블클릭하면 백엔드(`8000` 포트)와 프론트엔드(`5173` 포트)가 동시에 실행됩니다.

### 방법 B: 터미널 수동 실행 (권장 리뷰 방식)

#### 1) 백엔드(FastAPI) 실행
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* 백엔드 Swagger API 문서 확인: `http://localhost:8000/docs`

#### 2) 프론트엔드(React + Vite) 실행
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```
* 웹 대시보드 접속: `http://localhost:5173`

### 방법 C: Docker 한 번에 실행 (배포와 같은 구성)
백엔드가 빌드된 대시보드까지 함께 제공하므로 주소 하나로 접속합니다.
```bash
docker build -t self-driving-portfolio .
docker run -p 8000:8000 self-driving-portfolio
```
* 웹 대시보드 + API: `http://localhost:8000`

### 배포 (Render)
루트의 `render.yaml`이 Render Blueprint 설정입니다. Render 대시보드 → **New → Blueprint** → 이 저장소 선택 → **Apply**.
`main`에 푸시하면 자동으로 다시 배포됩니다. 무료 플랜은 15분간 접속이 없으면 절전되어 다음 첫 접속에 1분 정도 걸립니다.

### 실데이터 백테스트 탭
다섯 번째 탭 **실데이터 백테스트**는 파이프라인이 낸 최종 SAA·21개 후보·60/40 벤치마크 비중을
18개 ETF의 실제 월간 총수익률(2013-07 ~ 2026-09, 분기 리밸런싱)에 적용한 결과를 보여줍니다
(`GET /api/backtest`, `backend/app/backtest.py`). 주소 끝에 `#backtest`를 붙이면 이 탭이 바로 열립니다.

탭 안에서 데이터 연결 상태(출처·받은 날짜·결측값), ETF별 적용 비중과 실제 성과, ETF별 연도 수익률 원자료를
함께 보여주며, 원본 CSV는 `GET /api/backtest/data.csv`로 내려받을 수 있습니다.

데이터는 `backend/data/etf_monthly_returns.csv`(+ 받은 날짜·출처를 적은 `.meta.json`)에 들어 있어 서버가 인터넷에서 받지 않습니다. 갱신하려면:
```bash
pip install yfinance
cd backend && python scripts/fetch_returns.py
```

---

## 4. 주요 인터랙티브 검토 포인트 (How to Test)

1. **초기 논문 베이스라인 확인**: 접속 즉시 논문 기준일(`2025-12-31`)의 6단계 에이전트 실행 결과(최종 승인 포트폴리오: **기대수익률 6.66%, 변동성 9.65%, 샤프비율 0.30, CVaR 13.78%**)가 로드됩니다.
2. **IPS 제약조건 변경 및 CRO 거부권(Veto) 테스트**:
   * 우측 상단 **`IPS 제약조건 설정`** 버튼 클릭
   * `최대 허용 변동성`을 기존 `12.0%`에서 `8.5%`로 낮춘 뒤 **`적용 및 파이프라인 재실행`** 클릭
   * Stage 4의 **CRO 에이전트**가 위반을 감지하고 거부권(Revision Loop)을 발동하여 안전자산 비중을 높이는 과정을 확인할 수 있습니다.
3. **4개 전문 탭 검토**:
   * **종합 대시보드**: 현재 기준 포트폴리오 vs 3개 후보(시장가치·평균분산·블랙리터만) vs 최종 SAA 비중 비교
   * **위원회 투표 & 거버넌스**: 12인 위원의 찬성/반대 투표 결과(찬성 11표, 반대 1표 - 크레딧 리서치 헤드) 및 5대 조건부 승인 부대의견
   * **CMA & 공분산 행렬**: 12개 자산군 기대수익률/변동성 및 OAS 수축 공분산 상관계수 히트맵
   * **CIO 이사회 메모**: 최종 채택 사유 및 리스크 관리 계획이 담긴 이사회 보고서 전문
