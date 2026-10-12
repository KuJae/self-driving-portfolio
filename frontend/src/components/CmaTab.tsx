import React from 'react';
import { Scale } from 'lucide-react';
import type { PipelineResult } from '../types';

interface CmaTabProps {
  data: PipelineResult;
}

export const CmaTab: React.FC<CmaTabProps> = ({ data }) => {
  const cmas = data.cma_step.cmas;
  const macro = data.macro_step;

  const equityAssets = Object.values(cmas).filter(a => a.category === '주식' || a.asset_id === 'reits');

  return (
    <div className="space-y-6">
      {/* 거시 국면 배너 */}
      <div className="bg-gradient-to-r from-blue-950/40 via-gray-900 to-indigo-950/30 border border-blue-900/40 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <Scale className="h-4 w-4" />
              <span>거시 경제 국면 진단 결과 (Macro Conditioning)</span>
            </div>
            <h3 className="text-lg font-bold text-white">{macro.regime}</h3>
            <p className="text-xs text-gray-300 mt-1 max-w-3xl leading-relaxed">
              {macro.narrative}
            </p>
          </div>
          <div className="flex items-center space-x-4 bg-gray-950/60 p-3 rounded-xl border border-gray-800 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px]">진단 신뢰도</span>
              <span className="text-base font-bold text-emerald-400">{Math.round(macro.confidence * 100)}%</span>
            </div>
            <div className="border-l border-gray-800 pl-4">
              <span className="text-gray-400 block text-[10px]">12개월 침체확률</span>
              <span className="text-base font-bold text-amber-400">{Math.round(macro.recession_probability * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exhibit 8: CMA 7개 후보 모델 및 심사역 선정표 */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">
              주식형 자산군 CMA 모델별 기대수익률 및 LLM 심사역 선정 결과 (Exhibit 8)
            </h3>
            <p className="text-xs text-gray-400">
              3년 투자 시계 명목 기대수익률(%), 6개 기초 모델과 Auto-Blend 및 LLM 심사역(Judge)의 최종 결정 비교
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-blue-950 text-blue-400 border border-blue-800">
            LLM-as-Judge 심사 프로토콜
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 font-semibold">
                <th className="py-2.5 px-3">자산군 명칭</th>
                <th className="py-2.5 px-2 text-right">역사적 ERP</th>
                <th className="py-2.5 px-2 text-right">국면 조정</th>
                <th className="py-2.5 px-2 text-right">블랙-리터만</th>
                <th className="py-2.5 px-2 text-right">역고든 모형</th>
                <th className="py-2.5 px-2 text-right">내재 ERP</th>
                <th className="py-2.5 px-2 text-right">Auto-Blend</th>
                <th className="py-2.5 px-2 text-right text-blue-400">심사역 최종</th>
                <th className="py-2.5 px-2 text-right">조정폭 (Δ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {equityAssets.map((asset) => {
                const c = asset.candidates;
                const delta = asset.delta_vs_auto_blend;
                return (
                  <tr key={asset.asset_id} className="hover:bg-gray-800/40 transition">
                    <td className="py-2.5 px-3 font-sans font-medium text-white">
                      {asset.asset_name}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-300">{c.historical_erp}%</td>
                    <td className="py-2 px-2 text-right text-gray-300">{c.regime_adjusted}%</td>
                    <td className="py-2 px-2 text-right text-gray-300">{c.bl_equilibrium}%</td>
                    <td className="py-2 px-2 text-right text-gray-300">{c.inverse_gordon}%</td>
                    <td className="py-2 px-2 text-right text-gray-300">{c.implied_erp}%</td>
                    <td className="py-2 px-2 text-right text-gray-400">{asset.auto_blend_pct}%</td>
                    <td className="py-2 px-2 text-right font-bold text-blue-300">
                      {asset.expected_return_pct}%
                    </td>
                    <td className="py-2 px-2 text-right font-bold">
                      <span className={delta < 0 ? 'text-rose-400 flex items-center justify-end' : 'text-gray-400'}>
                        {delta < 0 ? `${delta.toFixed(1)}%` : delta > 0 ? `+${delta.toFixed(1)}%` : '0.0%'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CMA 심사역 자연어 감사 증적 (Audit Trail) */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-1">
          CMA 심사역 의사결정 근거 및 감사 증적 (Exhibit 4 규칙 준수)
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          각 자산군 심사역이 [최소값, 최대값] 제약조건 내에서 밸류에이션 왜곡을 보정한 자연어 설명문
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {equityAssets.map((asset) => (
            <div key={asset.asset_id} className="p-3.5 rounded-xl bg-gray-950/70 border border-gray-800 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-white">{asset.asset_name}</span>
                <span className="text-[11px] font-mono font-semibold text-blue-400">
                  최종 CMA: {asset.expected_return_pct}% ({asset.delta_vs_auto_blend < 0 ? `${asset.delta_vs_auto_blend}%p 할인` : '중립'})
                </span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                {asset.rationale}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
