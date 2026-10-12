import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import type { Governance } from '../types';

interface GovernanceBannerProps {
  governance?: Governance;
}

// IPS 적격 심사 결과: 적격 후보만 결합했는지, 위원회 개입이 필요한지
export const GovernanceBanner: React.FC<GovernanceBannerProps> = ({ governance }) => {
  const [open, setOpen] = useState(false);
  if (!governance) return null;

  const approved = governance.status === 'approved';
  const Icon = approved ? ShieldCheck : ShieldAlert;
  const tone = approved
    ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
    : 'bg-rose-950/40 border-rose-700/70 text-rose-100';

  return (
    <div className={`mb-6 rounded-xl border p-4 text-xs ${tone}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start space-x-2.5">
          <Icon className={`h-5 w-5 flex-shrink-0 ${approved ? 'text-emerald-400' : 'text-rose-400'}`} />
          <div>
            <div className="text-sm font-bold text-white">
              {approved ? 'IPS 적격 심사 통과 — 승인 권고안' : '위원회 개입 필요 — 승인 권고안 없음'}
            </div>
            <p className="mt-0.5 leading-relaxed">{governance.message}</p>
            {approved && (
              <p className="mt-1 text-emerald-300/80">결합된 후보: {governance.eligible.join(', ')}</p>
            )}
            {!approved && governance.final_check.violations.length > 0 && (
              <p className="mt-1 text-rose-300">최종안 위반: {governance.final_check.violations.join(' · ')}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0">
          <span className="font-mono text-sm font-bold text-white">
            적격 {governance.eligible_count}/{governance.candidate_count}
          </span>
          {governance.excluded.length > 0 && (
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gray-900/60 hover:bg-gray-800 border border-gray-700 text-gray-200"
            >
              <span>제외된 {governance.excluded.length}개 사유</span>
              {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>
      {open && (
        <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 border-t border-gray-700/60 pt-3 text-gray-300">
          {governance.excluded.map((e) => (
            <li key={e.key}>
              <span className="font-semibold text-white">{e.name}</span>
              <span className="text-gray-400"> — {e.violations.join(' · ')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
