import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { History, AlertCircle, RefreshCw, Info } from 'lucide-react';
import type { PipelineResult, BacktestResult, BacktestRow } from '../types';

interface BacktestTabProps {
  data: PipelineResult;
}

const COLORS = { final: '#3B82F6', benchmark: '#9CA3AF', overlay: '#F59E0B' };

const fmtPct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

export const BacktestTab: React.FC<BacktestTabProps> = ({ data }) => {
  const [bt, setBt] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<string | null>(null);

  // 파이프라인을 재실행해 data 가 바뀌면 그 결과 비중으로 다시 백테스트
  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch('/api/backtest')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: BacktestResult) => {
        if (!cancelled) setBt(json);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [data]);

  const chartData = useMemo(() => {
    if (!bt) return [];
    return bt.dates.map((date, i) => ({
      date,
      final: bt.series.final[i],
      benchmark: bt.series.benchmark[i],
      ...(overlay ? { overlay: bt.series[overlay][i] } : {}),
    }));
  }, [bt, overlay]);

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center space-x-2 text-xs text-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-400" />
        <span>백테스트를 불러오지 못했습니다: {error}</span>
      </div>
    );
  }

  if (!bt) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
        <p className="text-sm text-gray-400">실제 수익률로 백테스트 계산 중...</p>
      </div>
    );
  }

  const final = bt.rows.find((r) => r.is_final) as BacktestRow;
  const bench = bt.rows.find((r) => r.is_benchmark) as BacktestRow;
  const overlayRow = overlay ? bt.rows.find((r) => r.key === overlay) : undefined;

  const kpis = [
    { label: '연평균 수익률 (CAGR)', f: fmtPct(final.cagr_pct), b: fmtPct(bench.cagr_pct) },
    { label: '연 변동성', f: `${final.volatility_pct.toFixed(2)}%`, b: `${bench.volatility_pct.toFixed(2)}%` },
    { label: `샤프 비율 (무위험 ${bt.risk_free_pct}%)`, f: final.sharpe_ratio.toFixed(2), b: bench.sharpe_ratio.toFixed(2) },
    { label: '최대 낙폭 (MDD)', f: `${final.max_drawdown_pct.toFixed(2)}%`, b: `${bench.max_drawdown_pct.toFixed(2)}%` },
  ];

  return (
    <div className="space-y-6">
      {/* 개요 배너 */}
      <div className="bg-gradient-to-r from-blue-950/40 via-gray-900 to-indigo-950/30 border border-blue-900/40 rounded-2xl p-5">
        <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
          <History className="h-4 w-4" />
          <span>실데이터 백테스트 (Real-Data Backtest)</span>
        </div>
        <h3 className="text-lg font-bold text-white">
          {bt.period.start} ~ {bt.period.end} · {bt.period.months}개월 · ETF {bt.tickers.length}개
        </h3>
        <p className="text-xs text-gray-300 mt-1 leading-relaxed">
          파이프라인이 낸 최종 SAA·21개 PC 후보·60/40 벤치마크 비중을 실제 월간 총수익률에 적용했습니다.
          리밸런싱: {bt.rebalance}. 데이터: {bt.data_source}.
        </p>
        <p className="flex items-start space-x-1.5 text-[11px] text-amber-300/90 mt-2">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>지금 정한 비중을 과거 구간에 고정 적용한 사후 시뮬레이션이며, 미래 성과를 뜻하지 않습니다.</span>
        </p>
      </div>

      {/* KPI: 최종안 vs 60/40 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{k.label}</div>
            <div className="text-2xl font-bold text-white">{k.f}</div>
            <div className="text-[11px] text-gray-400 mt-1">60/40 벤치마크: {k.b}</div>
          </div>
        ))}
      </div>

      {/* 누적 성과 */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white">누적 성과 (시작 = 100)</h4>
          <span className="text-[11px] text-gray-500">
            {overlayRow ? `비교 중: ${overlayRow.name} · ` : ''}아래 표에서 후보를 누르면 겹쳐 볼 수 있습니다
          </span>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={11} minTickGap={40} />
              <YAxis stroke="#6B7280" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px' }}
                labelStyle={{ color: '#E5E7EB' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="final" name="최종 SAA" stroke={COLORS.final} strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="benchmark" name="60/40 벤치마크" stroke={COLORS.benchmark} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              {overlayRow && (
                <Line type="monotone" dataKey="overlay" name={overlayRow.name} stroke={COLORS.overlay} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 23개 포트폴리오 성과 표 */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-white mb-3">포트폴리오별 실현 성과 (샤프 비율 순)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-gray-400 border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">순위</th>
                <th className="py-2.5 px-3">포트폴리오</th>
                <th className="py-2.5 px-3">분류</th>
                <th className="py-2.5 px-3 text-right">연평균 수익률</th>
                <th className="py-2.5 px-3 text-right">연 변동성</th>
                <th className="py-2.5 px-3 text-right">샤프</th>
                <th className="py-2.5 px-3 text-right">최대 낙폭</th>
                <th className="py-2.5 px-3 text-right">최종 NAV</th>
              </tr>
            </thead>
            <tbody>
              {bt.rows.map((r, i) => {
                const fixed = r.is_final || r.is_benchmark;
                const selected = r.key === overlay;
                const rowClass = r.is_final
                  ? 'bg-blue-950/40'
                  : r.is_benchmark
                    ? 'bg-gray-800/40'
                    : selected
                      ? 'bg-amber-950/40 cursor-pointer'
                      : 'hover:bg-gray-800/30 cursor-pointer';
                return (
                  <tr
                    key={r.key}
                    className={`border-b border-gray-800/60 ${rowClass}`}
                    onClick={() => !fixed && setOverlay(selected ? null : r.key)}
                  >
                    <td className="py-2 px-3 font-mono text-gray-500">{i + 1}</td>
                    <td className={`py-2 px-3 font-medium ${r.is_final ? 'text-blue-300' : 'text-white'}`}>{r.name}</td>
                    <td className="py-2 px-3 text-gray-400">{r.category}</td>
                    <td className="py-2 px-3 text-right font-mono text-gray-200">{fmtPct(r.cagr_pct)}</td>
                    <td className="py-2 px-3 text-right font-mono text-gray-300">{r.volatility_pct.toFixed(2)}%</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-white">{r.sharpe_ratio.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono text-rose-300">{r.max_drawdown_pct.toFixed(2)}%</td>
                    <td className="py-2 px-3 text-right font-mono text-gray-300">{r.final_nav.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
