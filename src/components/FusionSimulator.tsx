import React, { useState, useEffect, useMemo } from 'react';
import {
  p5rData,
  personaMap,
  skillMap,
  traitMap,
  fuseTwoPersonas,
  canPersonaInheritSkill,
  canPersonaHoldTrait,
  isPersonaAvailable
} from '../utils/fusionEngine';
import { formatText, matchesSearch } from '../utils/i18n';
import { ElementBadge } from './ElementBadge';
import { PersonaDetailCard } from './PersonaDetailCard';
import {
  Sparkles,
  Plus,
  Trash2,
  ArrowRight,
  Check,
  Lock,
  RefreshCw,
  Layers
} from 'lucide-react';

export interface SimulatorInitialState {
  p1Name: string;
  p2Name: string;
  p1Skills?: string[];
  p2Skills?: string[];
  carriedTrait?: string;
  timestamp: number;
}

export const FusionSimulator: React.FC<{
  lang: 'tc' | 'sc';
  enabledDlc: Set<string>;
  initialState?: SimulatorInitialState | null;
}> = ({ lang, enabledDlc, initialState }) => {
  const [p1Name, setP1Name] = useState<string>('杰克霜精');
  const [p2Name, setP2Name] = useState<string>('杰克灯笼');

  const [p1Trait, setP1Trait] = useState<string>('冰寒的血统');
  const [p2Trait, setP2Trait] = useState<string>('导热的指尖');

  const [p1Skills, setP1Skills] = useState<string[]>([]);
  const [p2Skills, setP2Skills] = useState<string[]>([]);

  const [resultTrait, setResultTrait] = useState<string>('');
  const [resultSkills, setResultSkills] = useState<string[]>([]);

  // Modal for adding a custom inherited skill to Parent A or Parent B
  const [editingParent, setEditingParent] = useState<'p1' | 'p2' | null>(null);
  const [skillSearch, setSkillSearch] = useState<string>('');

  const p1 = useMemo(
    () => personaMap.get(p1Name) || p5rData.personas[0],
    [p1Name]
  );
  const p2 = useMemo(
    () => personaMap.get(p2Name) || p5rData.personas[1],
    [p2Name]
  );

  // Initialize skills when p1 or p2 changes manually
  const resetParentData = (
    which: 'p1' | 'p2',
    personaName: string,
    extraSkills?: string[],
    overrideTrait?: string
  ) => {
    const pObj = personaMap.get(personaName);
    if (!pObj) return;
    const baseSkills = pObj.skills.map((s) => s.name);
    const merged = [...new Set([...(extraSkills || []), ...baseSkills])].slice(
      0,
      8
    );
    if (which === 'p1') {
      setP1Name(personaName);
      setP1Trait(overrideTrait || pObj.trait);
      setP1Skills(merged);
    } else {
      setP2Name(personaName);
      setP2Trait(overrideTrait || pObj.trait);
      setP2Skills(merged);
    }
  };

  useEffect(() => {
    if (initialState) {
      resetParentData(
        'p1',
        initialState.p1Name,
        initialState.p1Skills,
        initialState.carriedTrait
      );
      resetParentData('p2', initialState.p2Name, initialState.p2Skills);
    } else {
      resetParentData('p1', p1Name);
      resetParentData('p2', p2Name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialState]);

  const fusionOutcome = useMemo(
    () => fuseTwoPersonas(p1, p2, enabledDlc),
    [p1, p2, enabledDlc]
  );

  const resultPersona = fusionOutcome?.result || null;

  // Candidate traits for the fused result persona
  const candidateTraits = useMemo(() => {
    if (!resultPersona) return [];
    const list: Array<{ name: string; source: string; allowed: boolean }> = [];
    const seen = new Set<string>();

    const addCandidate = (tName: string, sourceLabel: string) => {
      if (!tName || seen.has(tName)) return;
      seen.add(tName);
      const tObj = traitMap.get(tName);
      const allowed = tObj ? canPersonaHoldTrait(resultPersona, tObj) : true;
      list.push({ name: tName, source: sourceLabel, allowed });
    };

    addCandidate(resultPersona.trait, `${resultPersona.name} (自身)`);
    addCandidate(p1Trait, `${p1.name} (素材A)`);
    addCandidate(p2Trait, `${p2.name} (素材B)`);

    return list;
  }, [resultPersona, p1, p2, p1Trait, p2Trait]);

  // Combined skill pool from P1 + P2 + ResultPersona's own skills
  const combinedSkillPool = useMemo(() => {
    if (!resultPersona) return [];
    const map = new Map<
      string,
      {
        name: string;
        sources: string[];
        isOwnInnate: boolean;
        ownLearnLevel: number | null;
        allowed: boolean;
        blockReason?: string;
      }
    >();

    // 1. Result Persona's own innate & level-up skills
    for (const s of resultPersona.skills) {
      map.set(s.name, {
        name: s.name,
        sources: [
          s.level === 0
            ? `${resultPersona.name}(自带)`
            : `${resultPersona.name}(Lv.${s.level})`
        ],
        isOwnInnate: s.level === 0,
        ownLearnLevel: s.level,
        allowed: true
      });
    }

    // 2. Skills on P1
    for (const sName of p1Skills) {
      const sk = skillMap.get(sName);
      const allowed = sk ? canPersonaInheritSkill(resultPersona, sk) : true;
      const existing = map.get(sName);
      if (existing) {
        existing.sources.push(`${p1.name}(素材A)`);
      } else {
        map.set(sName, {
          name: sName,
          sources: [`${p1.name}(素材A)`],
          isOwnInnate: false,
          ownLearnLevel: null,
          allowed,
          blockReason: !allowed
            ? sk?.exclusiveTo
              ? '专属技能不可继承'
              : `目标不可继承${sk?.element}属性`
            : undefined
        });
      }
    }

    // 3. Skills on P2
    for (const sName of p2Skills) {
      const sk = skillMap.get(sName);
      const allowed = sk ? canPersonaInheritSkill(resultPersona, sk) : true;
      const existing = map.get(sName);
      if (existing) {
        existing.sources.push(`${p2.name}(素材B)`);
      } else {
        map.set(sName, {
          name: sName,
          sources: [`${p2.name}(素材B)`],
          isOwnInnate: false,
          ownLearnLevel: null,
          allowed,
          blockReason: !allowed
            ? sk?.exclusiveTo
              ? '专属技能不可继承'
              : `目标不可继承${sk?.element}属性`
            : undefined
        });
      }
    }

    return [...map.values()];
  }, [resultPersona, p1, p2, p1Skills, p2Skills]);

  // Auto-populate resultTrait and resultSkills when resultPersona changes
  useEffect(() => {
    if (!resultPersona) {
      setResultTrait('');
      setResultSkills([]);
      return;
    }
    const preferred =
      candidateTraits.find(
        (c) => c.allowed && c.name === p1Trait && p1Trait !== p1.trait
      ) ||
      candidateTraits.find((c) => c.allowed && c.name === p1Trait) ||
      candidateTraits[0];
    setResultTrait(preferred ? preferred.name : resultPersona.trait);

    // Pre-select innate skills + valid inherited skills up to 8
    const autoSkills = combinedSkillPool
      .filter((item) => item.allowed)
      .slice(0, 8)
      .map((item) => item.name);
    setResultSkills(autoSkills);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultPersona?.name, p1Name, p2Name]);

  const toggleResultSkill = (skillName: string) => {
    setResultSkills((prev) => {
      if (prev.includes(skillName)) {
        return prev.filter((s) => s !== skillName);
      }
      if (prev.length >= 8) return prev;
      return [...prev, skillName];
    });
  };

  // Chain fusion: set Result Persona C (with its chosen trait & 8 skills) as new Parent A!
  const handleChainAsParentA = () => {
    if (!resultPersona) return;
    setP1Name(resultPersona.name);
    setP1Trait(resultTrait || resultPersona.trait);
    setP1Skills(resultSkills);
  };

  const availPersonas = useMemo(
    () => p5rData.personas.filter((p) => isPersonaAvailable(p, enabledDlc)),
    [enabledDlc]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-red-500" />
            {formatText(
              '二体合成与技能/特性继承模拟器（每个面具最多拥有 8 个技能）',
              lang
            )}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {formatText(
              '自由配置素材面具 A 与素材面具 B 的特性与 8 个技能，合成后可相互继承技能与特性（包含合成目标面具自身的技能），并支援连续合成至下一阶！',
              lang
            )}
          </p>
        </div>
        {resultPersona && (
          <button
            type="button"
            onClick={handleChainAsParentA}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg transition shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            {formatText(
              `将合成结果【${resultPersona.name}】设为素材 A 继续合成`,
              lang
            )}
          </button>
        )}
      </div>

      {/* Parents Row: Parent A + Parent B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parent A */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2.5 py-1 rounded bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-bold">
              {formatText('素材面具 A', lang)}
            </span>
            <select
              value={p1.name}
              onChange={(e) => resetParentData('p1', e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white flex-1 max-w-xs"
            >
              {availPersonas.map((p) => (
                <option key={p.name} value={p.name}>
                  [{formatText(p.arcana, lang)} Lv.{p.level}]{' '}
                  {formatText(p.name, lang)}
                  {p.isTreasure ? formatText(' (宝魔)', lang) : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 shrink-0">
              {formatText('当前持有特性：', lang)}
            </span>
            <select
              value={p1Trait}
              onChange={(e) => setP1Trait(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1 text-xs text-amber-300 font-semibold flex-1"
            >
              {p5rData.traits
                .filter((t) => canPersonaHoldTrait(p1, t))
                .map((t) => (
                  <option key={t.name} value={t.name}>
                    {formatText(t.name, lang)} — {formatText(t.effect, lang)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
              <span>
                {formatText(`素材 A 持有的技能 (${p1Skills.length}/8)：`, lang)}
              </span>
              {p1Skills.length < 8 && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingParent('p1');
                    setSkillSearch('');
                  }}
                  className="text-red-400 hover:underline flex items-center gap-0.5 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {formatText('新增技能至素材 A', lang)}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => {
                const sName = p1Skills[i];
                const sk = sName ? skillMap.get(sName) : undefined;
                if (!sName) {
                  return (
                    <button
                      key={`p1-empty-${i}`}
                      type="button"
                      onClick={() => {
                        setEditingParent('p1');
                        setSkillSearch('');
                      }}
                      className="h-9 rounded border border-dashed border-zinc-800 hover:border-zinc-600 text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {formatText(`槽位 ${i + 1}`, lang)}
                    </button>
                  );
                }
                return (
                  <div
                    key={`p1-${sName}-${i}`}
                    className="h-9 px-2 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {sk && <ElementBadge element={sk.element} lang={lang} />}
                      <span className="text-zinc-200 font-medium truncate">
                        {formatText(sName, lang)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setP1Skills((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="text-zinc-500 hover:text-red-400 ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Parent B */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2.5 py-1 rounded bg-sky-600/20 border border-sky-500/40 text-sky-300 text-xs font-bold">
              {formatText('素材面具 B', lang)}
            </span>
            <select
              value={p2.name}
              onChange={(e) => resetParentData('p2', e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white flex-1 max-w-xs"
            >
              {availPersonas.map((p) => (
                <option key={p.name} value={p.name}>
                  [{formatText(p.arcana, lang)} Lv.{p.level}]{' '}
                  {formatText(p.name, lang)}
                  {p.isTreasure ? formatText(' (宝魔)', lang) : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 shrink-0">
              {formatText('当前持有特性：', lang)}
            </span>
            <select
              value={p2Trait}
              onChange={(e) => setP2Trait(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1 text-xs text-amber-300 font-semibold flex-1"
            >
              {p5rData.traits
                .filter((t) => canPersonaHoldTrait(p2, t))
                .map((t) => (
                  <option key={t.name} value={t.name}>
                    {formatText(t.name, lang)} — {formatText(t.effect, lang)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
              <span>
                {formatText(`素材 B 持有的技能 (${p2Skills.length}/8)：`, lang)}
              </span>
              {p2Skills.length < 8 && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingParent('p2');
                    setSkillSearch('');
                  }}
                  className="text-sky-400 hover:underline flex items-center gap-0.5 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {formatText('新增技能至素材 B', lang)}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => {
                const sName = p2Skills[i];
                const sk = sName ? skillMap.get(sName) : undefined;
                if (!sName) {
                  return (
                    <button
                      key={`p2-empty-${i}`}
                      type="button"
                      onClick={() => {
                        setEditingParent('p2');
                        setSkillSearch('');
                      }}
                      className="h-9 rounded border border-dashed border-zinc-800 hover:border-zinc-600 text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {formatText(`槽位 ${i + 1}`, lang)}
                    </button>
                  );
                }
                return (
                  <div
                    key={`p2-${sName}-${i}`}
                    className="h-9 px-2 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {sk && <ElementBadge element={sk.element} lang={lang} />}
                      <span className="text-zinc-200 font-medium truncate">
                        {formatText(sName, lang)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setP2Skills((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="text-zinc-500 hover:text-red-400 ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Fusion Result & Interactive Skill Inheritance Section */}
      {!resultPersona ? (
        <div className="bg-zinc-900/90 border border-red-700/50 rounded-xl p-8 text-center space-y-2">
          <div className="text-base font-bold text-red-400">
            {formatText('此组合无法进行二体合成', lang)}
          </div>
          <p className="text-xs text-zinc-400">
            {p1.name === p2.name
              ? formatText('相同的人格面具无法互相合成。', lang)
              : p1.isTreasure && p2.isTreasure
              ? formatText('两个宝魔无法互相合成。', lang)
              : formatText(
                  '此塔罗牌组合或同牌降阶无对应的合成结果，请更换其中一个素材面具。',
                  lang
                )}
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900/95 border-2 border-red-600/60 rounded-2xl p-5 space-y-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <span className="px-2.5 py-1 rounded bg-red-600 text-white text-xs">
                {formatText('合成结果', lang)}
              </span>
              <span>{formatText(p1.name, lang)}</span>
              <span className="text-zinc-500">+</span>
              <span>{formatText(p2.name, lang)}</span>
              <ArrowRight className="w-4 h-4 text-red-500" />
              <span className="text-amber-300 text-base">
                {formatText(resultPersona.name, lang)} (Lv.{resultPersona.level})
              </span>
            </div>

            <span className="text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              {fusionOutcome?.type === 'special_2'
                ? formatText('二体特殊合成配方', lang)
                : fusionOutcome?.type === 'treasure'
                ? formatText('宝魔同牌升降阶合成', lang)
                : fusionOutcome?.type === 'same_arcana'
                ? formatText('同塔罗牌降阶合成', lang)
                : formatText('一般异牌二体合成', lang)}
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left: Result Persona Info & Final 8 Slots */}
            <div className="xl:col-span-6 space-y-4">
              <PersonaDetailCard persona={resultPersona} lang={lang} compact />

              {/* Chosen Trait on Result */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {formatText('选择合成后保留的特性（三选一）：', lang)}
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {candidateTraits.map((ct) => {
                    const tObj = traitMap.get(ct.name);
                    const selected = resultTrait === ct.name;
                    return (
                      <button
                        key={ct.name}
                        type="button"
                        disabled={!ct.allowed}
                        onClick={() => setResultTrait(ct.name)}
                        className={`text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${
                          selected
                            ? 'bg-amber-950/40 border-amber-500 text-white'
                            : !ct.allowed
                            ? 'bg-zinc-900/40 border-zinc-800 opacity-45 cursor-not-allowed'
                            : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-amber-300">
                            {formatText(ct.name, lang)}
                          </span>
                          <span className="text-[11px] text-zinc-400 ml-2">
                            [{formatText(ct.source, lang)}]
                          </span>
                          {tObj && (
                            <div className="text-[11px] text-zinc-300 mt-0.5">
                              {formatText(tObj.effect, lang)}
                            </div>
                          )}
                        </div>
                        {selected && (
                          <Check className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Interactive Skill Inheritance Pool (Mutual skills + Target skills -> Pick up to 8) */}
            <div className="xl:col-span-6 space-y-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {formatText(
                        `选择合成后保留的技能（已选 ${resultSkills.length} / 8）`,
                        lang
                      )}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {formatText(
                        '包含素材 A、素材 B 的可继承技能，以及合成目标面具自身的自带/升级技能',
                        lang
                      )}
                    </p>
                  </div>
                </div>

                {/* Pool of skills to toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
                  {combinedSkillPool.map((item) => {
                    const sk = skillMap.get(item.name);
                    const isPicked = resultSkills.includes(item.name);
                    return (
                      <button
                        key={item.name}
                        type="button"
                        disabled={!item.allowed}
                        onClick={() => toggleResultSkill(item.name)}
                        className={`text-left p-2.5 rounded-lg border text-xs transition flex flex-col justify-between gap-1 ${
                          isPicked
                            ? 'bg-red-950/50 border-red-500 text-white'
                            : !item.allowed
                            ? 'bg-zinc-900/40 border-zinc-800/70 opacity-50 cursor-not-allowed'
                            : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 truncate">
                            {sk && (
                              <ElementBadge element={sk.element} lang={lang} />
                            )}
                            <span className="font-bold truncate">
                              {formatText(item.name, lang)}
                            </span>
                          </div>
                          {isPicked ? (
                            <Check className="w-4 h-4 text-red-400 shrink-0" />
                          ) : !item.allowed ? (
                            <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          ) : null}
                        </div>

                        <div className="text-[10px] text-zinc-400 flex flex-wrap items-center justify-between gap-1">
                          <span>
                            {item.sources
                              .map((src) => formatText(src, lang))
                              .join(' / ')}
                          </span>
                          {item.blockReason && (
                            <span className="text-red-400 font-semibold">
                              {formatText(item.blockReason, lang)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Final 8 Skill Summary */}
                <div className="pt-3 border-t border-zinc-800">
                  <div className="text-xs font-bold text-zinc-300 mb-2">
                    {formatText(
                      `【${resultPersona.name}】最终 8 技能栏预览：`,
                      lang
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {Array.from({ length: 8 }).map((_, idx) => {
                      const sName = resultSkills[idx];
                      const sk = sName ? skillMap.get(sName) : undefined;
                      return (
                        <div
                          key={`final-slot-${idx}`}
                          className={`h-9 px-2 rounded border text-xs flex items-center gap-1.5 truncate ${
                            sName
                              ? 'bg-zinc-900 border-red-500/40 text-white font-semibold'
                              : 'bg-zinc-900/40 border-dashed border-zinc-800 text-zinc-600'
                          }`}
                        >
                          <span className="text-[10px] font-mono text-zinc-500">
                            {idx + 1}.
                          </span>
                          {sk && <ElementBadge element={sk.element} lang={lang} />}
                          <span className="truncate">
                            {sName
                              ? formatText(sName, lang)
                              : formatText('空槽位', lang)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal to add skill to Parent A or Parent B */}
      {editingParent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {formatText(
                  `新增技能至 ${
                    editingParent === 'p1' ? `素材 A (${p1.name})` : `素材 B (${p2.name})`
                  }`,
                  lang
                )}
              </h3>
              <button
                type="button"
                onClick={() => setEditingParent(null)}
                className="px-2.5 py-1 rounded bg-zinc-800 text-xs text-zinc-300"
              >
                {formatText('关闭', lang)}
              </button>
            </div>
            <div className="p-3 border-b border-zinc-800">
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder={formatText('搜寻技能名称...', lang)}
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {p5rData.skills
                .filter((s) => {
                  const parentObj = editingParent === 'p1' ? p1 : p2;
                  if (!canPersonaInheritSkill(parentObj, s)) return false;
                  return matchesSearch(`${s.name} ${s.enName} ${s.desc}`, skillSearch);
                })
                .map((s) => {
                  const currentList =
                    editingParent === 'p1' ? p1Skills : p2Skills;
                  const added = currentList.includes(s.name);
                  return (
                    <button
                      key={s.name}
                      type="button"
                      disabled={added || currentList.length >= 8}
                      onClick={() => {
                        if (editingParent === 'p1') {
                          setP1Skills((prev) => [...prev, s.name].slice(0, 8));
                        } else {
                          setP2Skills((prev) => [...prev, s.name].slice(0, 8));
                        }
                        setEditingParent(null);
                      }}
                      className={`text-left p-2.5 rounded-lg border text-xs transition ${
                        added
                          ? 'bg-zinc-950/40 border-zinc-800 opacity-50'
                          : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <ElementBadge element={s.element} lang={lang} />
                        <span className="font-bold">{formatText(s.name, lang)}</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1 truncate">
                        {formatText(s.desc, lang)}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
