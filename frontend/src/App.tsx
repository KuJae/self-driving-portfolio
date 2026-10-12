import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { OverviewTab } from './components/OverviewTab';
import { VotingTab } from './components/VotingTab';
import { CmaTab } from './components/CmaTab';
import { BoardMemoTab } from './components/BoardMemoTab';
import { BacktestTab } from './components/BacktestTab';
import { GovernanceBanner } from './components/GovernanceBanner';
import { IpsModal } from './components/IpsModal';
import type { PipelineResult, IPSConfig } from './types';
import { LayoutDashboard, Users, Scale, FileText, History, AlertCircle, RefreshCw } from 'lucide-react';

const API_BASE_URL = '';

export function App() {
  const [data, setData] = useState<PipelineResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);
  // 주소 끝에 #backtest 를 붙이면 백테스트 탭이 바로 열림 (발표용 링크)
  const [activeTab, setActiveTab] = useState<'overview' | 'voting' | 'cma' | 'memo' | 'backtest'>(
    () => (window.location.hash === '#backtest' ? 'backtest' : 'overview')
  );
  const [activeStage, setActiveStage] = useState<number>(6);
  const [isIpsOpen, setIsIpsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestRun = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/pipeline/latest`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.warn("Backend not reachable directly, trying retry or showing connection guidance:", err);
      setError("로컬 백엔드 서버(http://127.0.0.1:8000)와 통신 중입니다...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestRun();
  }, []);

  const handleRunPipeline = async (customIps?: IPSConfig) => {
    try {
      setRunning(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/pipeline/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ips: customIps || (data?.ips) })
      });
      if (!res.ok) throw new Error(`실행 실패: ${res.statusText}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError("파이프라인 실행 중 오류 발생: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleStageSelect = (stageId: number) => {
    setActiveStage(stageId);
    if (stageId === 1 || stageId === 2 || stageId === 3) {
      setActiveTab('cma');
    } else if (stageId === 4 || stageId === 5) {
      setActiveTab('voting');
    } else {
      setActiveTab('overview');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col font-sans">
      <Header
        onOpenIps={() => setIsIpsOpen(true)}
        onRunPipeline={() => handleRunPipeline()}
        isRunning={running}
        autonomyLevel={data?.ips.autonomy_level || "L3 (조건부 자율화)"}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchLatestRun}
              className="px-3 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-white font-medium flex items-center space-x-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>재시도</span>
            </button>
          </div>
        )}

        <GovernanceBanner governance={data?.governance} />

        <PipelineVisualizer
          data={data}
          activeStage={activeStage}
          onSelectStage={handleStageSelect}
        />

        <div className="flex border-b border-gray-800 mb-6 space-x-1 sm:space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 py-3 px-3 sm:px-4 border-b-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>최종 배분안 및 성과 진단</span>
          </button>

          <button
            onClick={() => setActiveTab('voting')}
            className={`flex items-center space-x-2 py-3 px-3 sm:px-4 border-b-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'voting'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>전략 심의 및 보르다 투표 (Exhibit 9)</span>
          </button>

          <button
            onClick={() => setActiveTab('cma')}
            className={`flex items-center space-x-2 py-3 px-3 sm:px-4 border-b-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'cma'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
            }`}
          >
            <Scale className="h-4 w-4" />
            <span>거시 국면 & CMA 밸류에이션 심사 (Exhibit 8)</span>
          </button>

          <button
            onClick={() => setActiveTab('memo')}
            className={`flex items-center space-x-2 py-3 px-3 sm:px-4 border-b-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'memo'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>CIO 이사회 거버넌스 메모</span>
          </button>

          <button
            onClick={() => setActiveTab('backtest')}
            className={`flex items-center space-x-2 py-3 px-3 sm:px-4 border-b-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'backtest'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
            }`}
          >
            <History className="h-4 w-4" />
            <span>실데이터 백테스트</span>
          </button>
        </div>

        {loading && !data ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-400">자율 에이전트 파이프라인 연산 중...</p>
          </div>
        ) : data ? (
          <div>
            {activeTab === 'overview' && <OverviewTab data={data} />}
            {activeTab === 'voting' && <VotingTab data={data} />}
            {activeTab === 'cma' && <CmaTab data={data} />}
            {activeTab === 'memo' && <BoardMemoTab data={data} />}
            {activeTab === 'backtest' && <BacktestTab data={data} />}
          </div>
        ) : null}
      </main>

      {data && (
        <IpsModal
          isOpen={isIpsOpen}
          onClose={() => setIsIpsOpen(false)}
          ips={data.ips}
          onSaveAndRun={(newIps) => handleRunPipeline(newIps)}
        />
      )}

      <footer className="border-t border-gray-800/80 bg-[#0A0E17] py-6 px-6 mt-12 text-center text-xs text-gray-500">
        <p>
          자율주행 포트폴리오 시스템 (The Self-Driving Portfolio System) • Andrew Ang, Nazym Azimbayev, Andrey Kim (Columbia University & Altbridge, 2026).
        </p>
        <p className="mt-1 text-[11px] text-gray-600">
          SAE J3016 자율주행 표준에 대응하는 투자원칙보고서(IPS) 거버넌스 경계 하에서 작동합니다.
        </p>
      </footer>
    </div>
  );
}

export default App;
