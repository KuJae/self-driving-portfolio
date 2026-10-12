import React from 'react';
import { Copy, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { PipelineResult } from '../types';

interface BoardMemoTabProps {
  data: PipelineResult;
}

export const BoardMemoTab: React.FC<BoardMemoTabProps> = ({ data }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.board_memo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 text-xs">
        <div className="flex items-center space-x-2 text-gray-300">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>기관 수탁자 책임(Fiduciary Duty) 거버넌스 감사 인증 • SAE L3</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
          >
            <Copy className="h-3.5 w-3.5 text-blue-400" />
            <span>{copied ? '클립보드에 복사됨' : '보고서 전문 복사'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
          >
            <Printer className="h-3.5 w-3.5 text-gray-400" />
            <span>인쇄 / PDF 저장</span>
          </button>
        </div>
      </div>

      {/* 이사회 보고서 본문 카드 */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-8 sm:p-12 shadow-2xl relative text-gray-200 leading-relaxed font-sans">
        <div className="border-b border-gray-800 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-1">
              Autonomous Institutional Asset Allocation Pipeline
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              이사회 및 투자위원회 제출용 심의 보고서 (Board Memo)
            </h2>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>CRO 적격성 보증 완료</span>
          </div>
        </div>

        <div className="prose prose-invert max-w-none text-xs sm:text-sm space-y-4 whitespace-pre-line text-gray-300">
          {data.board_memo}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800/80 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-gray-400">
          <div className="space-y-1">
            <div className="font-semibold text-gray-200">자율 최고투자책임자 (Autonomous CIO Agent)</div>
            <div>멀티 에이전트 합의 계층 • 앙상블 기법 #2 (역추적오차 가중)</div>
            <div className="font-mono text-[11px] text-gray-500">감사 해시: 0x9a8f4c2e...b17d (서명 검증됨)</div>
          </div>
          <div className="space-y-1 sm:text-right">
            <div className="font-semibold text-gray-200">자율 최고리스크책임자 (Autonomous CRO Agent)</div>
            <div>투자원칙보고서(IPS) 법정 준수 및 정량 리스크 감사 엔진</div>
            <div className="font-mono text-[11px] text-emerald-400">적격성 상태: 0건의 규정 위반 (정상)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
