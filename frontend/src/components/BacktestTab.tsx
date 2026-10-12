import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { History, AlertCircle, RefreshCw, Info, Database, Download, CheckCircle2, ExternalLink } from 'lucide-react';
import type { PipelineResult, BacktestResult, BacktestRow } from '../types';

interface BacktestTabProps {
  data: PipelineResult;
}

const COLORS = { final: '#3B82F6', benchmark: '#9CA3AF', overlay: '#F59E0B' };
const TOOLTIP_STYLE = { backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px' };

const fmtPct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

// 연도별 수익률 표의 칸 색: 오르면 초록, 내리면 빨강, 크기만큼 진하게 (±30%에서 최대)
const heatColor = (v: number) => {
  const a = Math.min(Math.abs(v) / 30, 1) * 0.55 + 0.08;
  return v >= 0 ? `rgba(16, 185, 129, ${a})` : `rgba(244, 63, 94, ${a})`;
};

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

  const navData = useMemo(() => {
    if (!bt) return [];
    return bt.dates.map((date, i) => ({
      date,
      final: bt.series.final[i],
      benchmark: bt.series.benchmark[i],
      ...(overlay ? { overlay: bt.series[overlay][i] } : {}),
    }));
  }, [bt, overlay]);

  // 고점 대비 낙폭(%) — 누적 성과에서 바로 계산
  const drawdownData = useMemo(() => {
    if (!bt) return [];
    let peakF = 0;
    let peakB = 0;
    return bt.dates.map((date, i) => {
      peakF = Math.max(peakF, bt.series.final[i]);
      peakB = Math.max(peakB, bt.series.benchmark[i]);
      return {
        date,
        final: Math.round((bt.series.final[i] / peakF - 1) * 10000) / 100,
        benchmark: Math.round((bt.series.benchmark[i] / peakB - 1) * 10000) / 100,
      };
    });
  }, [bt]);

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
  const ann = bt.annual;
  // 첫해·마지막 해가 12개월이 안 되면 주석으로 표시
  const partialNote = ann.years
    .map((y, i) => ({ y, i }))
    .filter(({ i }) => ann.months[i] < 12)
    .map(({ y, i }) => `${y}년은 ${ann.months[i]}개월(${
      i === 0 ? `${Number(bt.period.start.slice(5))}월부터` : `${Number(bt.period.end.slice(5))}월까지`
    })`)
    .join(', ');
  const annualData = ann.years.map((y, i) => ({
    year: ann.months[i] < 12 ? `${y}*` : y,
    final: ann.final[i],
    benchmark: ann.benchmark[i],
  }));
  const connected = bt.data.missing_values === 0 && bt.data.columns === bt.tickers.length;

  const kpis = [
    { label: '연평균 수익률 (CAGR)', f: fmtPct(final.cagr_pct), b: fmtPct(bench.cagr_pct) },
    { label: '연 변동성', f: `${final.volatility_pct.toFixed(2)}%`, b: `${bench.volatility_pct.toFixed(2)}%` },
    { label: `샤프 비율 (무위험 ${bt.risk_free_pct}%)`, f: final.sharpe_ratio.toFixed(2), b: bench.sharpe_ratio.toFixed(2) },
    { label: '최대 낙폭 (MDD)', f: `${final.max_drawdown_pct.toFixed(2)}%`, b: `${bench.max_drawdown_pct.toFixed(2)}%` },
  ];

  const dataFacts = [
    { label: '출처', value: bt.data.source },
    { label: '받은 날짜', value: bt.data.fetched_at ?? '—' },
    { label: '기간', value: `${bt.period.start} ~ ${bt.period.end}` },
    { label: '관측치', value: `${bt.data.rows}개월 × ${bt.data.columns}개 ETF` },
    { label: '결측값', value: `${bt.data.missing_values}개` },
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
          리밸런싱: {bt.rebalance}.
        </p>
        <p className="flex items-start space-x-1.5 text-[11px] text-amber-300/90 mt-2">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>지금 정한 비중을 과거 구간에 고정 적용한 사후 시뮬레이션이며, 미래 성과를 뜻하지 않습니다.</span>
        </p>
      </div>

      {/* 데이터 연결 상태 */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-emerald-400" />
            <h4 className="text-sm font-semibold text-white">데이터 연결 상태</h4>
            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              connected ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
            }`}>
              {connected ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              <span>{connected ? '실데이터 연결됨' : '데이터 확인 필요'}</span>
            </span>
          </div>
          <a
            href="/api/backtest/data.csv"
            download
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 border border-gray-700"
          >
            <Download className="h-3.5 w-3.5" />
            <span>원본 CSV 내려받기</span>
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {dataFacts.map((f) => (
            <div key={f.label} className="bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2">
              <div className="text-[10px] text-gray-500">{f.label}</div>
              <div className="text-sm font-semibold text-gray-100 font-mono">{f.value}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
          수집 방식: {bt.data.method}. 서버는 인터넷에서 받지 않고 <span className="font-mono">{bt.data.file}</span> 만 읽습니다.
          아래 "ETF별 연도 수익률" 표의 값은 각 티커의 Yahoo Finance History 페이지와 대조할 수 있습니다.
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
            {overlayRow ? `비교 중: ${overlayRow.name} · ` : ''}아래 포트폴리오 표에서 후보를 누르면 겹쳐 볼 수 있습니다
          </span>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={navData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={11} minTickGap={40} />
              <YAxis stroke="#6B7280" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#E5E7EB' }} />
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

      {/* 낙폭 · 연도별 수익률 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-white mb-1">고점 대비 낙폭 (%)</h4>
          <p className="text-[11px] text-gray-500 mb-3">
            최대 낙폭: 최종 SAA {final.max_drawdown_pct.toFixed(2)}% · 60/40 {bench.max_drawdown_pct.toFixed(2)}%
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdownData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={11} minTickGap={50} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#E5E7EB' }} formatter={(v) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="benchmark" name="60/40 벤치마크" stroke={COLORS.benchmark} fill={COLORS.benchmark} fillOpacity={0.15} isAnimationActive={false} />
                <Area type="monotone" dataKey="final" name="최종 SAA" stroke={COLORS.final} fill={COLORS.final} fillOpacity={0.3} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-white mb-1">연도별 수익률 (%)</h4>
          <p className="text-[11px] text-gray-500 mb-3">{partialNote ? `* ${partialNote}` : '달력 연도 기준'}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="year" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#E5E7EB' }} formatter={(v) => `${v}%`} cursor={{ fill: '#1F2937' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={0} stroke="#4B5563" />
                <Bar dataKey="final" name="최종 SAA" fill={COLORS.final} isAnimationActive={false} />
                <Bar dataKey="benchmark" name="60/40 벤치마크" fill={COLORS.benchmark} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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

      {/* 적용 비중과 ETF별 실제 성과 */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-white mb-1">적용 비중과 ETF별 실제 성과</h4>
        <p className="text-[11px] text-gray-500 mb-3">
          파이프라인의 자산군 비중이 어느 ETF에 얼마나 들어갔는지, 그 ETF가 같은 기간 실제로 어땠는지. 티커를 누르면 Yahoo Finance로 이동합니다.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-gray-400 border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">자산군</th>
                <th className="py-2.5 px-3">티커</th>
                <th className="py-2.5 px-3 text-right">최종 SAA 비중</th>
                <th className="py-2.5 px-3 text-right">60/40 비중</th>
                <th className="py-2.5 px-3 text-right">연평균 수익률</th>
                <th className="py-2.5 px-3 text-right">연 변동성</th>
                <th className="py-2.5 px-3 text-right">최대 낙폭</th>
                <th className="py-2.5 px-3 text-right">최고의 달</th>
                <th className="py-2.5 px-3 text-right">최악의 달</th>
              </tr>
            </thead>
            <tbody>
              {bt.assets.map((a) => (
                <tr key={a.ticker} className="border-b border-gray-800/60 hover:bg-gray-800/30">
                  <td className="py-2 px-3 text-white">
                    {a.name}
                    <span className="ml-1.5 text-[10px] text-gray-500">{a.category}</span>
                  </td>
                  <td className="py-2 px-3">
                    <a href={a.yahoo_url} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 font-mono text-blue-400 hover:text-blue-300">
                      <span>{a.ticker}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-blue-300">{a.final_weight_pct.toFixed(2)}%</td>
                  <td className="py-2 px-3 text-right font-mono text-gray-400">{a.bench_weight_pct.toFixed(2)}%</td>
                  <td className="py-2 px-3 text-right font-mono text-gray-200">{fmtPct(a.cagr_pct)}</td>
                  <td className="py-2 px-3 text-right font-mono text-gray-300">{a.volatility_pct.toFixed(2)}%</td>
                  <td className="py-2 px-3 text-right font-mono text-rose-300">{a.max_drawdown_pct.toFixed(2)}%</td>
                  <td className="py-2 px-3 text-right font-mono text-emerald-300">
                    {fmtPct(a.best_month.return_pct)} <span className="text-gray-500">{a.best_month.month}</span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-rose-300">
                    {fmtPct(a.worst_month.return_pct)} <span className="text-gray-500">{a.worst_month.month}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ETF별 연도 수익률 (원자료 확인용) */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
        <h4 className="text-sm font-semibold text-white mb-1">ETF별 연도 수익률 (%) — 원자료</h4>
        <p className="text-[11px] text-gray-500 mb-3">
          배당 포함 총수익률.{partialNote ? ` * ${partialNote}.` : ''} 맨 아래 두 줄은 위 값들로 계산한 포트폴리오 수익률입니다.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="text-gray-400 border-b border-gray-800">
              <tr>
                <th className="py-2 px-2 text-left font-sans">티커</th>
                {ann.years.map((y, i) => (
                  <th key={y} className="py-2 px-2 text-right">{ann.months[i] < 12 ? `${y}*` : y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bt.tickers.map((t) => (
                <tr key={t} className="border-b border-gray-800/40">
                  <td className="py-1.5 px-2 text-gray-300">{t}</td>
                  {ann.by_ticker[t].map((v, i) => (
                    <td key={ann.years[i]} className="py-1.5 px-2 text-right text-gray-100" style={{ backgroundColor: heatColor(v) }}>
                      {v.toFixed(1)}
                    </td>
                  ))}
                </tr>
              ))}
              {[
                { label: '최종 SAA', values: ann.final, cls: 'text-blue-300' },
                { label: '60/40', values: ann.benchmark, cls: 'text-gray-300' },
              ].map((row) => (
                <tr key={row.label} className="border-t-2 border-gray-700">
                  <td className={`py-1.5 px-2 font-sans font-semibold ${row.cls}`}>{row.label}</td>
                  {row.values.map((v, i) => (
                    <td key={ann.years[i]} className="py-1.5 px-2 text-right font-semibold text-white" style={{ backgroundColor: heatColor(v) }}>
                      {v.toFixed(1)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
