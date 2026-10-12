import React, { useState } from 'react';
import { ThumbsDown, Sparkles, AlertCircle, MessageSquareQuote, CheckCircle2 } from 'lucide-react';
import type { PipelineResult } from '../types';

interface VotingTabProps {
  data: PipelineResult;
}

export const VotingTab: React.FC<VotingTabProps> = ({ data }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('전체');
  const review = data.review_step;
  // 하이라이트 카드의 순위·득표·앙상블 비중은 실행 결과에서 가져온다
  const rankOf = (key: string) => review.rankings.find((r) => r.method_key === key);
  const weightOf = (key: string) => (data.ensemble_step.method_weights[key] ?? 0) * 100;
  const adv = rankOf('adversarial_diversifier');
  const advW = weightOf('adversarial_diversifier');
  const ent = rankOf('max_entropy');
  const entW = weightOf('max_entropy');

  const filteredRankings = review.rankings.filter(item => {
    if (selectedFilter === '전체') return true;
    return item.category.includes(selectedFilter);
  });

  return (
    <div className="space-y-6">
      {/* 핵심 에이전트 하이라이트 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 적대적 분산 에이전트 (Adversarial Diversifier) */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-rose-950/40 to-gray-900 border border-rose-900/40 relative overflow-hidden">
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ThumbsDown className="h-4 w-4" />
            <span>적대적 분산 에이전트 (이의 제기 메커니즘)</span>
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">
            동료 투표 최하위({adv?.vote ?? '-'}표){advW > 0 ? `, 그러나 CIO 앙상블 ${advW.toFixed(1)}% 배정` : ' · 이번 앙상블에서는 IPS 적격 심사로 제외'}
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed">
            이 에이전트는 컨센서스 중심점과 가장 직교(orthogonal)하는 포트폴리오를 탐색하도록 설계되었습니다.
            동료 에이전트들은 공유된 패러다임을 벗어났다는 이유로 최하위로 투표했으나, <strong>이 거부는 결함이 아니라 의도된 특성입니다.</strong>{' '}
            {advW > 0
              ? `CIO 에이전트는 머신러닝의 부스팅(Boosting) 원리를 활용하여 컨센서스의 사각지대를 방어하기 위해 ${advW.toFixed(1)}%의 전략적 비중을 배정했습니다.`
              : '다만 이번 실행에서는 CRO의 IPS 적격 심사를 통과하지 못해 앙상블에 편입되지 않았습니다.'}
          </p>
        </div>

        {/* PC-리서처 에이전트 (PC-Researcher) */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 to-gray-900 border border-indigo-900/40 relative overflow-hidden">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-4 w-4" />
            <span>자율 PC-리서처 에이전트의 신규 모델 발견</span>
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">
            최대 엔트로피(Maximum Entropy) 포트폴리오 ({ent?.rank ?? '-'}위, {entW > 0 ? `앙상블 비중 ${entW.toFixed(1)}%` : 'IPS 적격 심사로 제외'})
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed">
            리서처 에이전트는 기존 파이프라인에 없는 금융 문헌을 자율 탐색하여 최소 샤프지수 제약 하에서 섀넌 엔트로피를 극대화하는 신규 최적화 수식을 도입했습니다.{' '}
            {entW > 0
              ? `동료 심의를 통과하여 최종 CIO 앙상블에 ${entW.toFixed(1)}% 비중으로 정식 채택되었습니다.`
              : '이번 실행에서는 CRO의 IPS 적격 심사를 통과하지 못해 앙상블에 편입되지 않았습니다.'}
          </p>
        </div>
      </div>

      {/* 21개 포트폴리오 기법 보르다 투표 순위표 (Exhibit 9) */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">
              전략 심의: 수정 보르다 카운트(Modified Borda Count) 투표 결과 (Exhibit 9)
            </h3>
            <p className="text-xs text-gray-400">
              종합 점수 = 55% 동료 에이전트 보르다 투표 + 45% CRO 객관적 정량 지표 점수
            </p>
          </div>

          {/* 필터 탭 */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {['전체', '휴리스틱', '수익률최적화', '위험구조화', '비전통적'].map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                  selectedFilter === filter
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 font-semibold">
                <th className="py-2 px-2 text-center">순위</th>
                <th className="py-2 px-3">최적화 모델명</th>
                <th className="py-2 px-3">패밀리 분류</th>
                <th className="py-2 px-2 text-right">보르다 득표</th>
                <th className="py-2 px-2 text-right">정량 지표</th>
                <th className="py-2 px-2 text-right">종합 점수</th>
                <th className="py-2 px-2 text-right">샤프</th>
                <th className="py-2 px-2 text-right">변동성</th>
                <th className="py-2 px-2 text-right">유효 N</th>
                <th className="py-2 px-2 text-center">IPS 적격성</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredRankings.map((item) => {
                const isTop5 = item.rank <= 5;
                const isBottom = item.vote < 0;
                return (
                  <tr
                    key={item.method_key}
                    className={`hover:bg-gray-800/50 transition ${
                      isTop5 ? 'bg-blue-950/20' : isBottom ? 'bg-rose-950/10' : ''
                    }`}
                  >
                    <td className="py-2 px-2 text-center">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-mono text-[11px] font-bold ${
                        item.rank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        item.rank <= 3 ? 'bg-blue-500/20 text-blue-300' :
                        'text-gray-400'
                      }`}>
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-white flex items-center space-x-1.5">
                      <span>{item.name}</span>
                      {isTop5 && <span className="text-[10px] px-1 rounded bg-blue-900 text-blue-300 font-sans">Top 5</span>}
                    </td>
                    <td className="py-2 px-3 text-gray-400">{item.category}</td>
                    <td className={`py-2 px-2 text-right font-mono font-bold ${
                      item.vote > 0 ? 'text-emerald-400' : item.vote < 0 ? 'text-rose-400' : 'text-gray-400'
                    }`}>
                      {item.vote > 0 ? `+${item.vote}` : item.vote}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-gray-300">
                      {item.metric_score.toFixed(3)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-blue-300">
                      {item.composite_score.toFixed(3)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-gray-300">
                      {item.sharpe.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-gray-300">
                      {item.volatility.toFixed(1)}%
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-purple-300">
                      {item.effective_n}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {item.is_compliant ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 inline" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-400 inline" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 에이전트 간 피어 리뷰 피드 */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center space-x-2 mb-3">
          <MessageSquareQuote className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-200">
            에이전트 상호 피어 리뷰 피드 (42건 감사 기록 중 발췌)
          </h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          투표 전 각 에이전트가 동일 패밀리 1건, 타 패밀리 1건의 후보안을 무작위 배정받아 수학적 정합성 및 가정을 교차 검증
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {review.peer_reviews.slice(0, 6).map((rev, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-gray-950/70 border border-gray-800 text-xs">
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="font-semibold text-blue-400">{rev.reviewer}</span>
                <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-mono text-[10px]">
                  {rev.review_type}
                </span>
              </div>
              <div className="text-gray-400 text-[11px] mb-1">
                심사 대상 모델: <span className="text-gray-200 font-medium">{rev.target}</span>
              </div>
              <p className="text-gray-300 italic text-[11px] mt-1 border-t border-gray-800/60 pt-1.5">
                "{rev.comment}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
