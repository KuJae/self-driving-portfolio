import React from 'react';
import { Cpu, RefreshCw, Sliders, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenIps: () => void;
  onRunPipeline: () => void;
  isRunning: boolean;
  autonomyLevel: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenIps,
  onRunPipeline,
  isRunning,
  autonomyLevel,
}) => {
  return (
    <header className="border-b border-gray-800 bg-[#0d131f]/90 backdrop-blur sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Self-Driving Portfolio</h1>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-950 text-blue-400 border border-blue-800">
                자율 에이전트 자산배분
              </span>
            </div>
            <p className="text-xs text-gray-400">
              기관 투자자를 위한 자율 에이전트 SAA 아키텍처 • <span className="text-gray-300">Andrew Ang, Nazym Azimbayev, Andrey Kim (2026)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>거버넌스: <strong className="text-white">{autonomyLevel.split(' ')[0]}</strong></span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <button
            onClick={onOpenIps}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-gray-200 bg-gray-800/80 hover:bg-gray-700 rounded-lg border border-gray-700 transition"
          >
            <Sliders className="h-4 w-4 text-blue-400" />
            <span>투자원칙 (IPS) 설정</span>
          </button>

          <button
            onClick={onRunPipeline}
            disabled={isRunning}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-blue-600/30 transition"
          >
            <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? '에이전트 심의 중 (50개)...' : '자율 SAA 파이프라인 가동'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
