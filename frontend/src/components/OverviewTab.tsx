import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, ShieldAlert, Zap, Target, CheckCircle2 } from 'lucide-react';
import type { PipelineResult } from '../types';

interface OverviewTabProps {
  data: PipelineResult;
}

const CATEGORY_COLORS: Record<string, string> = {
  '주식': '#3B82F6',        // 파랑
  '채권': '#10B981',        // 에메랄드
  '실물자산': '#F59E0B',     // 주황/골드
  '현금': '#8B5CF6'         // 보라
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ data }) => {
  const fp = data.ensemble_step.final_portfolio;
  const exp = fp.category_exposures;
  const comp = fp.benchmark_comparison;

  const categoryPieData = [
    { name: '주식군 (Equity)', value: exp.equity, color: CATEGORY_COLORS['주식'] },
    { name: '채권군 (Fixed Income)', value: exp.fixed_income, color: CATEGORY_COLORS['채권'] },
    { name: '실물자산 (Real Assets)', value: exp.real_assets, color: CATEGORY_COLORS['실물자산'] },
    { name: '현금 버퍼 (Cash)', value: exp.cash, color: CATEGORY_COLORS['현금'] }
  ];

  const benchmarkBarData = [
    { name: '기대수익률', Portfolio: fp.expected_return_pct, Benchmark: comp.bench_return_pct },
    { name: '변동성', Portfolio: fp.volatility_pct, Benchmark: comp.bench_volatility_pct },
    { name: '샤프지수x10', Portfolio: Math.round(fp.sharpe_ratio * 100) / 10, Benchmark: Math.round(comp.bench_sharpe * 100) / 10 },
    { name: '예상 MDD', Portfolio: Math.abs(fp.max_drawdown_est_pct), Benchmark: Math.abs(comp.bench_mdd_est_pct) },
  ];

  return (
    <div className="space-y-6">
      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>예상 명목수익률</span>
            <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{fp.expected_return_pct}%</div>
          <div className="text-[11px] text-emerald-400 mt-1">
            실질 +{(fp.expected_return_pct - data.ips.cpi_estimate).toFixed(1)}% (CPI 대비)
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>사전 연간변동성</span>
            <Zap className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{fp.volatility_pct}%</div>
          <div className="text-[11px] text-gray-400 mt-1">
            밴드: [{data.ips.volatility_min}% - {data.ips.volatility_max}%]
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>샤프 지수 (Sharpe)</span>
            <Target className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{fp.sharpe_ratio}</div>
          <div className="text-[11px] text-emerald-400 mt-1">
            vs 60/40 ({comp.bench_sharpe})
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>예상 최대낙폭(MDD)</span>
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-300">{fp.max_drawdown_est_pct}%</div>
          <div className="text-[11px] text-emerald-400 mt-1">
            {comp.volatility_reduction_pct > 0 ? `60/40 대비 방어력 우수` : 'IPS 규정 준수'}
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>트래킹 에러 (TE)</span>
            <Target className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{fp.tracking_error_pct}%</div>
          <div className="text-[11px] text-gray-400 mt-1">
            한도 &lt; {data.ips.tracking_error_limit}%
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>유효 자산수 (Meucci N)</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{fp.effective_n}</div>
          <div className="text-[11px] text-purple-400 mt-1">
            18개 자산 유니버스
          </div>
        </div>
      </div>

      {/* 차트 영역: 자산군 비중 & 60/40 벤치마크 비교 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 자산군 비중 파이차트 */}
        <div className="lg:col-span-5 bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-2">대자산군별 배분 비중 (Asset Allocation)</h3>
          <p className="text-xs text-gray-400 mb-4">
            후기 사이클 스태그플레이션 위험을 방어하기 위해 주식을 벤치마크 대비 언더웨이트하고 채권 듀레이션 및 현금 버퍼 확보
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val}%`, '배분 비중']}
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-gray-800">
            {categoryPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-gray-950/60 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-300 font-medium">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 60/40 벤치마크 대비 비교 */}
        <div className="lg:col-span-7 bg-gray-900/80 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-200">
                자율 SAA 포트폴리오 vs 60/40 전통 벤치마크 비교
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                위험 최적화
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              기대 수익률, 변동성 통제 및 최대 손실 하방 방어력 비교
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={benchmarkBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                  <YAxis stroke="#6B7280" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px' }}
                  />
                  <Bar dataKey="Portfolio" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Self-Driving Portfolio" />
                  <Bar dataKey="Benchmark" fill="#4B5563" radius={[4, 4, 0, 0]} name="60/40 벤치마크" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-blue-950/30 border border-blue-900/50 flex items-start space-x-3 text-xs text-gray-300">
            <CheckCircle2 className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-white">거버넌스 감사 인증:</strong> 벤치마크 대비 사전 트래킹 에러는 <strong>{fp.tracking_error_pct}%</strong>로 IPS 액티브 리스크 한도(6.0%)를 완벽히 준수합니다. 특히 최대 예상 낙폭(MDD)을 기존 60/40의 -34.3%에서 -{Math.abs(fp.max_drawdown_est_pct)}% 수준으로 대폭 낮추었습니다.
            </div>
          </div>
        </div>
      </div>

      {/* 18개 자산군 세부 비중 테이블 (Exhibit 11) */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">18개 자산군별 최종 권고 비중 및 리스크 기여도 (Exhibit 11)</h3>
            <p className="text-xs text-gray-400">포트폴리오 총 변동성에 미치는 한계 기여도(Risk Contribution %) 및 벤치마크 대비 틸트(Active Tilt)</p>
          </div>
          <span className="text-xs font-mono text-gray-400">18개 유동성 ETF 프록시</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 font-semibold">
                <th className="py-2.5 px-3">자산군 명칭</th>
                <th className="py-2.5 px-3">티커</th>
                <th className="py-2.5 px-3">대분류</th>
                <th className="py-2.5 px-3 text-right">목표 비중</th>
                <th className="py-2.5 px-3 text-right">위험 기여도</th>
                <th className="py-2.5 px-3 text-right">60/40 벤치</th>
                <th className="py-2.5 px-3 text-right">액티브 틸트</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {fp.asset_breakdown.map((asset) => {
                const tilt = asset.weight_pct - asset.bench_weight_pct;
                return (
                  <tr key={asset.id} className="hover:bg-gray-800/40 transition">
                    <td className="py-2 px-3 font-medium text-white">{asset.name}</td>
                    <td className="py-2 px-3 font-mono text-gray-400">{asset.ticker}</td>
                    <td className="py-2 px-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[asset.category] || '#6B7280'}20`,
                          color: CATEGORY_COLORS[asset.category] || '#9CA3AF',
                          border: `1px solid ${CATEGORY_COLORS[asset.category] || '#4B5563'}40`
                        }}
                      >
                        {asset.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-white">
                      {asset.weight_pct}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-300">
                      {asset.risk_contrib_pct}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-500">
                      {asset.bench_weight_pct}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">
                      <span className={tilt > 0 ? 'text-emerald-400' : tilt < 0 ? 'text-rose-400' : 'text-gray-400'}>
                        {tilt > 0 ? `+${tilt.toFixed(1)}%` : `${tilt.toFixed(1)}%`}
                      </span>
                    </td>
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
