import React from 'react';
import { formatText } from '../utils/i18n';

const ELEMENT_COLORS: Record<string, string> = {
  物理: 'bg-orange-600/25 text-orange-300 border-orange-500/40',
  枪击: 'bg-amber-600/25 text-amber-300 border-amber-500/40',
  火焰: 'bg-red-600/25 text-red-300 border-red-500/40',
  冰冻: 'bg-cyan-600/25 text-cyan-300 border-cyan-500/40',
  电击: 'bg-yellow-500/25 text-yellow-200 border-yellow-400/40',
  疾风: 'bg-emerald-600/25 text-emerald-300 border-emerald-500/40',
  念动: 'bg-pink-600/25 text-pink-300 border-pink-500/40',
  核热: 'bg-sky-600/25 text-sky-300 border-sky-500/40',
  祝福: 'bg-yellow-200/20 text-yellow-100 border-yellow-200/40',
  咒怨: 'bg-purple-700/30 text-purple-300 border-purple-500/40',
  异常: 'bg-fuchsia-700/25 text-fuchsia-300 border-fuchsia-500/40',
  恢复: 'bg-lime-600/25 text-lime-300 border-lime-500/40',
  万能: 'bg-slate-200/20 text-white border-slate-300/50',
  辅助: 'bg-blue-600/25 text-blue-300 border-blue-500/40',
  被动: 'bg-amber-800/30 text-amber-200 border-amber-600/40'
};

export const ElementBadge: React.FC<{
  element: string;
  lang: 'tc' | 'sc';
  size?: 'sm' | 'xs';
}> = ({ element, lang, size = 'xs' }) => {
  const cls =
    ELEMENT_COLORS[element] || 'bg-zinc-700/40 text-zinc-300 border-zinc-600';
  return (
    <span
      className={`inline-flex items-center justify-center rounded border font-semibold ${
        size === 'xs' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'
      } ${cls}`}
    >
      {formatText(element, lang)}
    </span>
  );
};

export const AffinityBadge: React.FC<{
  val: string;
  lang: 'tc' | 'sc';
}> = ({ val, lang }) => {
  const v = val || '-';
  let cls = 'text-zinc-500 bg-zinc-900/60';
  if (v === '弱') cls = 'text-red-400 bg-red-950/60 border border-red-700/50 font-bold';
  else if (v === '耐') cls = 'text-sky-300 bg-sky-950/60 border border-sky-700/50 font-semibold';
  else if (v === '无') cls = 'text-zinc-200 bg-zinc-800 border border-zinc-600 font-semibold';
  else if (v === '反') cls = 'text-amber-300 bg-amber-950/60 border border-amber-700/50 font-bold';
  else if (v === '吸') cls = 'text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 font-bold';

  return (
    <span className={`inline-flex items-center justify-center w-7 h-6 rounded text-xs ${cls}`}>
      {formatText(v, lang)}
    </span>
  );
};
