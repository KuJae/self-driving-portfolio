import React from 'react';
import { Activity, Layers, Shuffle, PieChart, Users, Award } from 'lucide-react';
import type { PipelineResult } from '../types';

interface PipelineVisualizerProps {
  data: PipelineResult | null;
  activeStage: number;
  onSelectStage: (stage: number) => void;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  data,
  activeStage,
  onSelectStage,
}) => {
  const stages = [
    {
      id: 1,
      title: "1. 거시 국면 에이전트",
      subtitle: data ? data.macro_step.regime : "거시 국면 판정",
      badge: "1개 에이전트",
      icon: Activity,
      desc: data ? `신뢰도 ${Math.round(data.macro_step.confidence * 100)}% • 침체확률 ${Math.round(data.macro_step.recession_probability * 100)}%` : "성장률 및 물가 다차원 진단"
    },
    {
      id: 2,
      title: "2. 자산군 CMA 에이전트",
      subtitle: data ? `${data.cma_step.asset_count}개 자산군 분석` : "기대수익률(CMA) 산출",
      badge: "18개 에이전트",
      icon: Layers,
      desc: "7가지 모델 + LLM 심사역(Judge)"
    },
    {
      id: 3,
      title: "3. 공분산 행렬 에이전트",
      subtitle: "Ledoit-Wolf 축약 추정",
      badge: "1개 에이전트",
      icon: Shuffle,
      desc: data ? `축약 강도: ${data.covariance_step.shrinkage_intensity * 100}%` : "국면 반영 위험 모델링"
    },
    {
      id: 4,
      title: "4. 포트폴리오 구성 (PC)",
      subtitle: "21개 최적화 경쟁 모델",
      badge: "21개 에이전트",
      icon: PieChart,
      desc: "4대 패밀리 + 리서처 + 적대적분산"
    },
    {
      id: 5,
      title: "5. 전략 심의 및 투표",
      subtitle: "수정 보르다 카운트 투표",
      badge: "CRO + 21개 심사역",
      icon: Users,
      desc: data ? `1위: ${data.review_step.top_5[0]?.name}` : "이종/동일 패밀리 상호 피어리뷰"
    },
    {
      id: 6,
      title: "6. CIO 앙상블 및 보고서",
      subtitle: "역추적오차(Inverse TE) 결합",
      badge: "1개 메타 에이전트",
      icon: Award,
      desc: data ? `목표 기대수익률 ${data.ensemble_step.final_portfolio.expected_return_pct}%` : "이사회 제출 거버넌스 메모"
    }
  ];

  return (
    <div className="w-full bg-[#111827] border border-gray-800 rounded-2xl p-5 mb-8 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">
            자율 에이전트 파이프라인 오케스트레이션 흐름 (Pipeline Stepper)
          </h2>
          <p className="text-xs text-gray-400">
            약 50개의 전문 에이전트가 순차 추론, 구조화된 상호 비판 및 투표를 통해 IPS 규정 내에서 최적안을 도출합니다
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
          파이프라인 상태: 실시간 정상 작동
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isSelected = activeStage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(stage.id)}
              className={`text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-950/60 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                  : 'bg-gray-900/70 border-gray-800/80 hover:bg-gray-850 hover:border-gray-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                    {stage.badge}
                  </span>
                </div>
                <div className="text-xs font-bold text-gray-100">{stage.title}</div>
                <div className="text-xs font-medium text-blue-400 truncate mt-0.5">
                  {stage.subtitle}
                </div>
              </div>
              <div className="text-[11px] text-gray-400 mt-2 truncate pt-2 border-t border-gray-800/60">
                {stage.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
