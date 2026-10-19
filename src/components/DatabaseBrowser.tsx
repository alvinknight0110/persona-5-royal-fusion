import React, { useState, useMemo } from 'react';
import { p5rData } from '../utils/fusionEngine';
import { formatText, matchesSearch } from '../utils/i18n';
import { AffinityBadge, ElementBadge } from './ElementBadge';
import { SkillElement } from '../types/p5r';
import { BookOpen, Search, Sparkles, Disc } from 'lucide-react';

const SKILL_ELEMENTS: Array<'全部' | SkillElement> = [
  '全部',
  '物理',
  '枪击',
  '火焰',
  '冰冻',
  '电击',
  '疾风',
  '念动',
  '核热',
  '祝福',
  '咒怨',
  '异常',
  '恢复',
  '万能',
  '辅助',
  '被动'
];

export const DatabaseBrowser: React.FC<{
  lang: 'tc' | 'sc';
}> = ({ lang }) => {
  const [subTab, setSubTab] = useState<'personas' | 'skills' | 'traits' | 'charts'>(
    'personas'
  );
  const [search, setSearch] = useState<string>('');
  const [arcanaFilter, setArcanaFilter] = useState<string>('全部');
  const [elementFilter, setElementFilter] = useState<'全部' | SkillElement>('全部');

  const filteredPersonas = useMemo(() => {
    return p5rData.personas.filter((p) => {
      if (arcanaFilter !== '全部' && p.arcana !== arcanaFilter) return false;
      if (
        search &&
        !matchesSearch(
          `${p.name} ${p.enName} ${p.jpName} ${p.trait} ${p.skills
            .map((s) => s.name)
            .join(' ')}`,
          search
        )
      ) {
        return false;
      }
      return true;
    });
  }, [arcanaFilter, search]);

  const filteredSkills = useMemo(() => {
    return p5rData.skills.filter((s) => {
      if (elementFilter !== '全部' && s.element !== elementFilter) return false;
      if (
        search &&
        !matchesSearch(
          `${s.name} ${s.enName} ${s.desc} ${s.learners
            .map((l) => l.persona)
            .join(' ')}`,
          search
        )
      ) {
        return false;
      }
      return true;
    });
  }, [elementFilter, search]);

  const filteredTraits = useMemo(() => {
    return p5rData.traits.filter((t) => {
      if (
        search &&
        !matchesSearch(
          `${t.name} ${t.effect} ${t.holders.map((h) => h.name).join(' ')}`,
          search
        )
      ) {
        return false;
      }
      return true;
    });
  }, [search]);

  const matrixArcanas = useMemo(
    () => p5rData.arcanaOrder.filter((a) => a !== '世界'),
    []
  );

  return (
    <div className="space-y-5">
      {/* Sub-navigation & Search */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <BookOpen className="w-5 h-5 text-red-500 mr-1" />
          {[
            { id: 'personas', label: `人格面具图鉴 (${p5rData.personas.length})` },
            { id: 'skills', label: `技能列表 (${p5rData.skills.length})` },
            { id: 'traits', label: `特性逆查 (${p5rData.traits.length})` },
            { id: 'charts', label: '合成范式与宝魔升降表' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as typeof subTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                subTab === t.id
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {formatText(t.label, lang)}
            </button>
          ))}
        </div>

        {subTab !== 'charts' && (
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={formatText('输入关键字搜寻（支援简繁）...', lang)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>
        )}
      </div>

      {/* SubTab 1: Personas */}
      {subTab === 'personas' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap gap-1">
            {['全部', ...p5rData.arcanaOrder].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setArcanaFilter(a)}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  arcanaFilter === a
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                }`}
              >
                {formatText(a, lang)}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-2">{formatText('等级', lang)}</th>
                  <th className="py-2.5 px-2">{formatText('塔罗牌', lang)}</th>
                  <th className="py-2.5 px-2">{formatText('名称', lang)}</th>
                  <th className="py-2.5 px-2">{formatText('继承', lang)}</th>
                  <th className="py-2.5 px-2">{formatText('特性', lang)}</th>
                  <th className="py-2.5 px-1 text-center">{formatText('物', lang)}</th>
                  <th className="py-2.5 px-1 text-center">{formatText('枪', lang)}</th>
                  <th className="py-2.5 px-1 text-center">{formatText('火', lang)}</th>
                  <th className="py-2.5 px-1 text-center">{formatText('冰', lang)}</th>
                  <th className="py-2.5 px-1 text-center">{formatText('电', lang)}</th>
                  <th className="py-2.5 px-1 text-center">{formatText('风', lang)}</th>
                  <th className="py-2.5 px-1 text-center">{formatText('念', lang)}</th>
                  <th className="py-2.5 px-1 text-center">{formatText('核', lang)}</th>
                  <th className="py-2.5 px-1 text-center">{formatText('祝', lang)}</th>
                  <th className="py-2.5 px-1 text-center">{formatText('咒', lang)}</th>
                  <th className="py-2.5 px-2">{formatText('技能', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {filteredPersonas.map((p) => (
                  <tr key={p.name} className="hover:bg-zinc-800/40 transition">
                    <td className="py-2 px-2 font-mono font-bold text-red-400">
                      {p.level}
                    </td>
                    <td className="py-2 px-2 text-zinc-300">
                      {formatText(p.arcana, lang)}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        {p.avatar && (
                          <img
                            src={p.avatar}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded object-cover bg-zinc-950 border border-zinc-700"
                          />
                        )}
                        <div>
                          <div className="font-bold text-white flex items-center gap-1">
                            {formatText(p.name, lang)}
                            {p.isDlc && (
                              <span className="text-[10px] px-1 rounded bg-purple-600/30 text-purple-200">
                                DLC
                              </span>
                            )}
                            {p.isSpecial && (
                              <span className="text-[10px] px-1 rounded bg-rose-600/30 text-rose-200">
                                {formatText('特殊', lang)}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {p.enName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-amber-300">
                      {formatText(p.inheritType, lang)}
                    </td>
                    <td className="py-2 px-2">
                      <div className="font-semibold text-amber-200">
                        {formatText(p.trait, lang)}
                      </div>
                      <div className="text-[10px] text-zinc-400 max-w-[160px] truncate">
                        {formatText(p.traitDesc, lang)}
                      </div>
                    </td>
                    <td className="py-2 px-1 text-center">
                      <AffinityBadge val={p.affinities.phys} lang={lang} />
                    </td>
                    <td className="py-2 px-1 text-center">
                      <AffinityBadge val={p.affinities.gun} lang={lang} />
                    </td>
                    <td className="py-2 px-1 text-center">
                      <AffinityBadge val={p.affinities.fire} lang={lang} />
                    </td>
                    <td className="py-2 px-1 text-center">
                      <AffinityBadge val={p.affinities.ice} lang={lang} />
                    </td>
                    <td className="py-2 px-1 text-center">
                      <AffinityBadge val={p.affinities.elec} lang={lang} />
                    </td>
                    <td className="py-2 px-1 text-center">
                      <AffinityBadge val={p.affinities.wind} lang={lang} />
                    </td>
                    <td className="py-2 px-1 text-center">
                      <AffinityBadge val={p.affinities.psy} lang={lang} />
                    </td>
                    <td className="py-2 px-1 text-center">
                      <AffinityBadge val={p.affinities.nuke} lang={lang} />
                    </td>
                    <td className="py-2 px-1 text-center">
                      <AffinityBadge val={p.affinities.bless} lang={lang} />
                    </td>
                    <td className="py-2 px-1 text-center">
                      <AffinityBadge val={p.affinities.curse} lang={lang} />
                    </td>
                    <td className="py-2 px-2 text-[11px] text-zinc-300 max-w-[240px]">
                      {p.skills
                        .map(
                          (s) =>
                            `${formatText(s.name, lang)}${
                              s.level > 0 ? `(${s.level})` : ''
                            }`
                        )
                        .join('、')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 2: Skills */}
      {subTab === 'skills' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap gap-1">
            {SKILL_ELEMENTS.map((el) => (
              <button
                key={el}
                type="button"
                onClick={() => setElementFilter(el)}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  elementFilter === el
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                }`}
              >
                {formatText(el, lang)}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">{formatText('属性', lang)}</th>
                  <th className="py-2.5 px-3">{formatText('技能名称', lang)}</th>
                  <th className="py-2.5 px-3">{formatText('消耗', lang)}</th>
                  <th className="py-2.5 px-3">{formatText('效果说明', lang)}</th>
                  <th className="py-2.5 px-3">{formatText('习得面具', lang)}</th>
                  <th className="py-2.5 px-3">{formatText('技能卡 / 备注', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {filteredSkills.map((s) => (
                  <tr key={s.name} className="hover:bg-zinc-800/40 transition">
                    <td className="py-2 px-3">
                      <ElementBadge element={s.element} lang={lang} />
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-white">
                        {formatText(s.name, lang)}
                      </div>
                      <div className="text-[10px] text-zinc-500">{s.enName}</div>
                    </td>
                    <td className="py-2 px-3 text-amber-300 font-medium">
                      {s.cost || '-'}
                    </td>
                    <td className="py-2 px-3 text-zinc-300 max-w-xs">
                      {formatText(s.desc, lang)}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-zinc-300 max-w-xs">
                      {s.learners.length > 0
                        ? s.learners
                            .map(
                              (l) =>
                                `${formatText(l.persona, lang)}(${
                                  l.isInnate ? formatText('自带', lang) : l.level
                                })`
                            )
                            .join('、')
                        : '-'}
                    </td>
                    <td className="py-2 px-3 text-[11px]">
                      {s.exclusiveTo ? (
                        <span className="text-red-400 font-semibold">
                          {formatText(
                            `专属技能（${s.exclusiveTo.join('、')}）`,
                            lang
                          )}
                        </span>
                      ) : s.chairCards.length > 0 || s.skillCardRaw ? (
                        <span className="text-purple-300 flex items-center gap-1">
                          <Disc className="w-3.5 h-3.5 shrink-0" />
                          {s.chairCards.length > 0
                            ? s.chairCards
                                .map(
                                  (c) =>
                                    `${formatText(c.persona, lang)}${
                                      c.alarm ? '(警报)' : ''
                                    }`
                                )
                                .join('、')
                            : formatText(s.skillCardRaw, lang)}
                        </span>
                      ) : s.isNetwork ? (
                        <span className="text-sky-300">
                          {formatText('网络合成（公开处刑）', lang)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 3: Traits */}
      {subTab === 'traits' && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">{formatText('特性名称', lang)}</th>
                  <th className="py-2.5 px-3">{formatText('效果', lang)}</th>
                  <th className="py-2.5 px-3">{formatText('持有面具', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {filteredTraits.map((t) => (
                  <tr key={t.name} className="hover:bg-zinc-800/40 transition">
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold flex items-center gap-1.5 ${
                          t.isSpecial
                            ? 'text-red-400'
                            : t.isDlc
                            ? 'text-purple-300'
                            : 'text-amber-300'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        {formatText(t.name, lang)}
                        {t.uninheritable && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 border border-red-600 text-red-300">
                            {formatText('不可继承', lang)}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-200">
                      {formatText(t.effect, lang)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        {t.holders.map((h) => (
                          <span
                            key={h.name}
                            className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px]"
                          >
                            [{formatText(h.arcana, lang)} {h.level}]{' '}
                            {formatText(h.name, lang)}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 4: Fusion Charts */}
      {subTab === 'charts' && (
        <div className="space-y-6">
          {/* Treasure Demon Chart */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-amber-300">
              {formatText('宝魔同塔罗牌升降阶表', lang)}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-[11px]">
                <thead>
                  <tr className="bg-zinc-950 text-zinc-300 border-b border-zinc-800">
                    <th className="p-2 text-left">{formatText('宝魔', lang)}</th>
                    {matrixArcanas.map((a) => (
                      <th key={a} className="p-1.5">
                        {formatText(a, lang)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {Object.entries(p5rData.treasureChart).map(([tdName, row]) => (
                    <tr key={tdName} className="hover:bg-zinc-800/40">
                      <td className="p-2 text-left font-bold text-white whitespace-nowrap">
                        {formatText(tdName, lang)}
                      </td>
                      {matrixArcanas.map((a) => {
                        const mod = row[a];
                        return (
                          <td
                            key={a}
                            className={`p-1.5 font-mono font-bold ${
                              mod === 2
                                ? 'text-amber-300 bg-amber-950/30'
                                : mod === 1
                                ? 'text-red-400'
                                : mod === -2
                                ? 'text-cyan-300 bg-cyan-950/30'
                                : 'text-sky-400'
                            }`}
                          >
                            {mod > 0 ? `+${mod}` : mod}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 23x23 Arcana Fusion Chart */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-red-400">
              {formatText('二体处刑（合成）塔罗牌对照表', lang)}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-[11px]">
                <thead>
                  <tr className="bg-zinc-950 text-red-300 border-b border-zinc-800">
                    <th className="p-1.5"></th>
                    {matrixArcanas.map((a) => (
                      <th key={a} className="p-1.5 whitespace-nowrap">
                        {formatText(a, lang)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {matrixArcanas.map((rA) => (
                    <tr key={rA} className="hover:bg-zinc-800/40">
                      <td className="p-1.5 font-bold text-red-300 bg-zinc-950 whitespace-nowrap">
                        {formatText(rA, lang)}
                      </td>
                      {matrixArcanas.map((cA) => {
                        const res = p5rData.arcanaChart[rA]?.[cA] || '—';
                        return (
                          <td
                            key={cA}
                            className={`p-1.5 whitespace-nowrap ${
                              rA === cA
                                ? 'bg-amber-500/15 text-amber-300 font-bold'
                                : 'text-zinc-300'
                            }`}
                          >
                            {formatText(res, lang)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
