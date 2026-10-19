import React from 'react';
import { p5rData } from '../utils/fusionEngine';
import { formatText } from '../utils/i18n';
import { CheckSquare, Square, X } from 'lucide-react';

const DLC_GROUPS: Array<{ label: string; names: string[] }> = [
  { label: '伊邪那岐 & 贼神', names: ['伊邪那岐', '伊邪那岐·贼神'] },
  { label: '俄耳普斯 & 贼神 (男)', names: ['俄耳普斯', '俄耳甫斯·贼神'] },
  { label: '俄耳普斯F & 贼神F (女)', names: ['俄耳普斯F', '俄耳甫斯·贼神F'] },
  { label: '阿里亚德涅 & 贼神', names: ['阿里亚德涅', '阿里亚德涅·贼神'] },
  { label: '辉夜 & 贼神', names: ['辉夜', '辉夜·贼神'] },
  { label: '祸津伊邪那岐 & 贼神', names: ['祸津伊邪那岐', '祸津伊邪那岐·贼神'] },
  { label: '雅典娜 & 贼神', names: ['雅典娜', '雅典娜·贼神'] },
  { label: '月读命 & 贼神', names: ['月读命', '月读命·贼神'] },
  { label: '亚斯泰利欧斯 & 贼神', names: ['亚斯泰利欧斯', '亚斯泰利欧斯·贼神'] },
  { label: '塔纳托斯 & 贼神', names: ['塔纳托斯', '塔纳托斯·贼神'] },
  { label: '劳尔 (Raoul)', names: ['劳尔'] },
  { label: '弥赛亚 & 贼神', names: ['弥赛亚', '弥赛亚·贼神'] },
  { label: '伊邪那岐大神 & 贼神', names: ['伊邪那岐大神', '伊邪那岐大神·贼神'] }
];

export const ALL_DLC_NAMES = p5rData.personas
  .filter((p) => p.isDlc)
  .map((p) => p.name);

export const DlcModal: React.FC<{
  open: boolean;
  onClose: () => void;
  enabledDlc: Set<string>;
  onChangeDlc: (next: Set<string>) => void;
  lang: 'tc' | 'sc';
}> = ({ open, onClose, enabledDlc, onChangeDlc, lang }) => {
  if (!open) return null;

  const toggleGroup = (names: string[]) => {
    const allHas = names.every((n) => enabledDlc.has(n));
    const next = new Set(enabledDlc);
    if (allHas) {
      names.forEach((n) => next.delete(n));
    } else {
      names.forEach((n) => next.add(n));
    }
    onChangeDlc(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-purple-500/50 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white">
              {formatText('DLC 人格面具拥有设定', lang)}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {formatText(
                '勾选状态会动态改变同塔罗牌的合成阶层结果（皇家版移植版预设解锁全部 DLC）',
                lang
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeDlc(new Set(ALL_DLC_NAMES))}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
            >
              {formatText('全选所有 DLC（皇家版/全DLC）', lang)}
            </button>
            <button
              type="button"
              onClick={() => onChangeDlc(new Set())}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition"
            >
              {formatText('全部取消（无 DLC 原版合成表）', lang)}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[55vh] overflow-y-auto pr-1">
            {DLC_GROUPS.map((g) => {
              const checked = g.names.every((n) => enabledDlc.has(n));
              return (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => toggleGroup(g.names)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                    checked
                      ? 'bg-purple-950/35 border-purple-500/60 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-purple-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-600 shrink-0" />
                  )}
                  <span className="text-xs font-semibold">
                    {formatText(g.label, lang)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
