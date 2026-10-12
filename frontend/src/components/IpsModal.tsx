import React, { useState } from 'react';
import { X, Sliders, CheckCircle2 } from 'lucide-react';
import type { IPSConfig } from '../types';

interface IpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ips: IPSConfig;
  onSaveAndRun: (newIps: IPSConfig) => void;
}

export const IpsModal: React.FC<IpsModalProps> = ({
  isOpen,
  onClose,
  ips,
  onSaveAndRun,
}) => {
  const [form, setForm] = useState<IPSConfig>({ ...ips });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAndRun(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/60">
          <div className="flex items-center space-x-2">
            <Sliders className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">투자원칙보고서 (IPS) 제약조건 설정</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          <p className="text-gray-400 leading-relaxed">
            자율주행의 운행설계영역(ODD)과 마찬가지로, 인간 포트폴리오 관리자는 계산 대신 IPS를 통해 자율 에이전트들의 활동 경계와 위험 예산을 규정하는 최고 거버넌스 설계자 역할을 수행합니다.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-medium mb-1">목표 실질 수익률 (CPI + %)</label>
              <input
                type="number"
                step="0.1"
                value={form.target_real_return}
                onChange={(e) => setForm({ ...form, target_real_return: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-medium mb-1">기준 CPI 예상 인플레이션 (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.cpi_estimate}
                onChange={(e) => setForm({ ...form, cpi_estimate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-medium mb-1">최소 허용 변동성 (%)</label>
              <input
                type="number"
                step="0.5"
                value={form.volatility_min}
                onChange={(e) => setForm({ ...form, volatility_min: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-medium mb-1">최대 허용 변동성 (%)</label>
              <input
                type="number"
                step="0.5"
                value={form.volatility_max}
                onChange={(e) => setForm({ ...form, volatility_max: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-medium mb-1">최대 허용 낙폭(MDD) 한도 (%)</label>
              <input
                type="number"
                step="1"
                value={form.max_drawdown_limit}
                onChange={(e) => setForm({ ...form, max_drawdown_limit: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-medium mb-1">60/40 대비 트래킹 에러 한도 (%)</label>
              <input
                type="number"
                step="0.5"
                value={form.tracking_error_limit}
                onChange={(e) => setForm({ ...form, tracking_error_limit: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-medium mb-1">최소 주식 비중 (%)</label>
              <input
                type="number"
                step="1"
                value={form.equity_min}
                onChange={(e) => setForm({ ...form, equity_min: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-medium mb-1">최대 주식 비중 (%)</label>
              <input
                type="number"
                step="1"
                value={form.equity_max}
                onChange={(e) => setForm({ ...form, equity_max: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">자율주행 거버넌스 단계 (SAE J3016)</label>
            <select
              value={form.autonomy_level}
              onChange={(e) => setForm({ ...form, autonomy_level: e.target.value })}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="L2 (증강 통제 - 각 단계별 인간 승인)">L2 (증강 통제 - 각 단계별 인간 승인)</option>
              <option value="L3 (조건부 자율화 - 이사회 최종 승인)">L3 (조건부 자율화 - 이사회 최종 승인, 권장 표준)</option>
              <option value="L4 (고도 자율화 - IPS 경계 내 자율 리밸런싱)">L4 (고도 자율화 - IPS 경계 내 자율 리밸런싱)</option>
              <option value="L5 (완전 자율화 - 메타 에이전트 자율 진화)">L5 (완전 자율화 - 메타 에이전트 자율 진화)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>적용 및 파이프라인 재실행</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
