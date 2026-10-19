import React, { useState, useMemo } from 'react';
import {
  p5rData,
  personaMap,
  getReverseFusions,
  getForwardFusions,
  isPersonaAvailable
} from '../utils/fusionEngine';
import { formatText, matchesSearch } from '../utils/i18n';
import { PersonaDetailCard } from './PersonaDetailCard';
import { Search, Play, ArrowRight, Compass } from 'lucide-react';

export const ForwardReverseLookup: React.FC<{
  lang: 'tc' | 'sc';
  enabledDlc: Set<string>;
  onSendToSimulator: (p1Name: string, p2Name: string) => void;
}> = ({ lang, enabledDlc, onSendToSimulator }) => {
  const [selectedName, setSelectedName] = useState<string>('齐格飞');
  const [mode, setMode] = useState<'reverse' | 'forward'>('reverse');
  const [filterText, setFilterText] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const selectedPersona = useMemo(
    () => personaMap.get(selectedName) || p5rData.personas[0],
    [selectedName]
  );

  const reverseData = useMemo(
    () =>
      mode === 'reverse'
        ? getReverseFusions(selectedPersona.name, enabledDlc)
        : { specialRecipe: null, pairs: [] },
    [mode, selectedPersona.name, enabledDlc]
  );

  const forwardData = useMemo(
    () =>
      mode === 'forward'
        ? getForwardFusions(selectedPersona.name, enabledDlc)
        : { pairs: [], specialTargets: [] },
    [mode, selectedPersona.name, enabledDlc]
  );

  const activePairs = mode === 'reverse' ? reverseData.pairs : forwardData.pairs;

  const filteredPairs = useMemo(() => {
    return activePairs.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (
        filterText &&
        !matchesSearch(
          `${item.p1.name} ${item.p1.arcana} ${item.p2.name} ${item.p2.arcana} ${item.result.name} ${item.result.arcana}`,
          filterText
        )
      ) {
        return false;
      }
      return true;
    });
  }, [activePairs, typeFilter, filterText]);

  const availPersonas = useMemo(
    () => p5rData.personas.filter((p) => isPersonaAvailable(p, enabledDlc)),
    [enabledDlc]
  );

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-extrabold text-white">
              {formatText('正逆向合成公式查询器', lang)}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedPersona.name}
              onChange={(e) => setSelectedName(e.target.value)}
              className="bg-zinc-950 border border-red-600/70 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
            >
              {availPersonas.map((p) => (
                <option key={p.name} value={p.name}>
                  [{formatText(p.arcana, lang)} Lv.{p.level}]{' '}
                  {formatText(p.name, lang)}
                  {p.isTreasure ? formatText(' (宝魔)', lang) : ''}
                  {p.isSpecial ? formatText(' (特殊)', lang) : ''}
                </option>
              ))}
            </select>

            <div className="inline-flex rounded-lg bg-zinc-950 p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => setMode('reverse')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                  mode === 'reverse'
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {formatText('逆向合成（如何合出此面具）', lang)}
              </button>
              <button
                type="button"
                onClick={() => setMode('forward')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                  mode === 'forward'
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {formatText('正向合成（作为素材可合出）', lang)}
              </button>
            </div>
          </div>
        </div>

        <PersonaDetailCard persona={selectedPersona} lang={lang} compact />
      </div>

      {/* Special Fusion Recipe Notice */}
      {mode === 'reverse' && reverseData.specialRecipe && (
        <div className="bg-rose-950/30 border border-rose-600/50 rounded-xl p-5 space-y-3">
          <div className="text-sm font-extrabold text-rose-300">
            {formatText(
              `★ 【${selectedPersona.name}】为特殊处刑（集体断头台）专属合成面具`,
              lang
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {reverseData.specialRecipe.map((ing) => (
              <button
                key={ing.name}
                type="button"
                onClick={() => setSelectedName(ing.name)}
                className="px-3 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-rose-500/40 text-left transition"
              >
                <div className="text-xs font-bold text-white">
                  {formatText(ing.name, lang)}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {formatText(ing.arcana, lang)} Lv.{ing.level} ·{' '}
                  {formatText(ing.trait, lang)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-300">
              {formatText(`共找到 ${filteredPairs.length} 组合成配方`, lang)}
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200"
            >
              <option value="all">{formatText('全部合成类型', lang)}</option>
              <option value="normal">{formatText('一般异牌二体', lang)}</option>
              <option value="same_arcana">{formatText('同塔罗牌降阶', lang)}</option>
              <option value="treasure">{formatText('宝魔升降阶', lang)}</option>
              <option value="special_2">{formatText('二体特殊合成', lang)}</option>
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={formatText('筛选面具或塔罗牌...', lang)}
              className="pl-8 pr-3 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[540px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-zinc-950 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-3">{formatText('素材 A', lang)}</th>
                <th className="py-2.5 px-3">{formatText('素材 B', lang)}</th>
                <th className="py-2.5 px-3">{formatText('合成目标', lang)}</th>
                <th className="py-2.5 px-3">{formatText('类型', lang)}</th>
                <th className="py-2.5 px-3">{formatText('预估书价', lang)}</th>
                <th className="py-2.5 px-3 text-right">
                  {formatText('操作', lang)}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {filteredPairs.slice(0, 200).map((item, idx) => (
                <tr
                  key={`${item.p1.name}-${item.p2.name}-${idx}`}
                  className="hover:bg-zinc-800/50 transition"
                >
                  <td className="py-2 px-3">
                    <button
                      type="button"
                      onClick={() => setSelectedName(item.p1.name)}
                      className="font-semibold text-white hover:text-red-400"
                    >
                      {formatText(item.p1.name, lang)}
                    </button>
                    <span className="text-[11px] text-zinc-400 ml-1.5">
                      ({formatText(item.p1.arcana, lang)} Lv.{item.p1.level})
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <button
                      type="button"
                      onClick={() => setSelectedName(item.p2.name)}
                      className="font-semibold text-white hover:text-red-400"
                    >
                      {formatText(item.p2.name, lang)}
                    </button>
                    <span className="text-[11px] text-zinc-400 ml-1.5">
                      ({formatText(item.p2.arcana, lang)} Lv.{item.p2.level})
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-300">
                      <ArrowRight className="w-3.5 h-3.5 text-red-400" />
                      {formatText(item.result.name, lang)} (Lv.{item.result.level})
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px]">
                      {item.type === 'treasure'
                        ? formatText('宝魔升降阶', lang)
                        : item.type === 'same_arcana'
                        ? formatText('同牌降阶', lang)
                        : item.type === 'special_2'
                        ? formatText('二体特殊', lang)
                        : formatText('一般合成', lang)}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-zinc-300">
                    ¥{item.approxCost.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        onSendToSimulator(item.p1.name, item.p2.name)
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-600/90 hover:bg-red-500 text-white text-[11px] font-semibold transition"
                    >
                      <Play className="w-3 h-3" />
                      {formatText('模拟继承', lang)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
