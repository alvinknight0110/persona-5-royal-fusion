import React, { useState, useMemo } from 'react';
import { Persona, SavedBuild, SkillElement } from '../types/p5r';
import {
  p5rData,
  personaMap,
  skillMap,
  traitMap,
  canPersonaInheritSkill,
  canPersonaHoldTrait,
  generateBuildPlan,
  isPersonaAvailable
} from '../utils/fusionEngine';
import { formatText, matchesSearch } from '../utils/i18n';
import { PersonaDetailCard } from './PersonaDetailCard';
import { ElementBadge } from './ElementBadge';
import { AlarmTipsGuide } from './AlarmTipsGuide';
import {
  Sparkles,
  Plus,
  Trash2,
  Route,
  Save,
  FolderOpen,
  Play,
  Search,
  CheckCircle2,
  AlertCircle,
  Disc,
  ArrowRight,
  Wrench
} from 'lucide-react';

const PRESET_BUILDS: Array<{
  title: string;
  targetPersona: string;
  selectedTrait: string;
  selectedSkills: string[];
}> = [
  {
    title: '义经 — 八艘跳跃蓄力特化',
    targetPersona: '义经',
    selectedTrait: '剑神的意念',
    selectedSkills: [
      '八艘跳跃',
      '蓄力',
      '武道的诀窍',
      '建言',
      '仁王立',
      '大治愈促进',
      '物理吸收',
      '咒怨反弹'
    ]
  },
  {
    title: '爱丽丝 — 0消耗即死特化',
    targetPersona: '爱丽丝',
    selectedTrait: '快去死吧',
    selectedSkills: [
      '可以为我而死吗？',
      '姆多成功率UP',
      '大治愈促进',
      '胜利咆哮',
      '魔术的资质',
      '祝福反弹',
      '专心致志',
      '米吉多拉翁'
    ]
  },
  {
    title: '路西法 — 拂晓明星万能特化',
    targetPersona: '路西法',
    selectedTrait: '异常的魅力',
    selectedSkills: [
      '拂晓明星',
      '专心致志',
      '魔术的资质',
      '高级万能强化',
      '万能强化',
      '魔导才能',
      '大治愈促进',
      '祝福吸收'
    ]
  },
  {
    title: '辉夜 — 辉箭反击3倍祝福特化 (DLC)',
    targetPersona: '辉夜',
    selectedTrait: '不容侵犯的美貌',
    selectedSkills: [
      '辉箭',
      '高级祝福强化',
      '祝福强化',
      '魔术的资质',
      '专心致志',
      '火焰反弹',
      '超反击',
      '大治愈促进'
    ]
  }
];

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

export const BuildRoutePlanner: React.FC<{
  lang: 'tc' | 'sc';
  enabledDlc: Set<string>;
  onSendToSimulator: (
    p1Name: string,
    p2Name: string,
    p1Skills?: string[],
    p2Skills?: string[],
    carriedTrait?: string
  ) => void;
}> = ({ lang, enabledDlc, onSendToSimulator }) => {
  const [targetName, setTargetName] = useState<string>('义经');
  const [personaSearch, setPersonaSearch] = useState<string>('');
  const [arcanaFilter, setArcanaFilter] = useState<string>('全部');

  const [selectedTrait, setSelectedTrait] = useState<string>('剑神的意念');
  const [preferredTraitDonor, setPreferredTraitDonor] = useState<string | undefined>(
    undefined
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    '八艘跳跃',
    '蓄力',
    '武道的诀窍',
    '建言',
    '仁王立',
    '冰冻吸收',
    '疾风吸收',
    '咒怨反弹'
  ]);
  const [cardOrGallowsSkills, setCardOrGallowsSkills] = useState<string[]>([]);
  const [preferredDonors, setPreferredDonors] = useState<Record<string, string>>({});

  // Skill picker modal state
  const [pickerSlotIdx, setPickerSlotIdx] = useState<number | null>(null);
  const [skillQuery, setSkillQuery] = useState<string>('');
  const [skillElementFilter, setSkillElementFilter] = useState<'全部' | SkillElement>('全部');
  const [showUninheritable, setShowUninheritable] = useState<boolean>(false);

  // Saved builds in LocalStorage
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>(() => {
    try {
      const raw = localStorage.getItem('p5r_saved_builds');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [buildTitle, setBuildTitle] = useState<string>('義經 — 八艘跳躍蓄力特化');

  const targetPersona = useMemo(
    () => personaMap.get(targetName) || p5rData.personas[0],
    [targetName]
  );

  // When changing target persona, keep valid skills and reset incompatible ones
  const handleSelectTargetPersona = (newPersonaName: string) => {
    const np = personaMap.get(newPersonaName);
    if (!np) return;
    setTargetName(newPersonaName);
    // If current trait is uninheritable by np, switch to np's innate trait
    const curTraitObj = traitMap.get(selectedTrait);
    if (!curTraitObj || !canPersonaHoldTrait(np, curTraitObj)) {
      setSelectedTrait(np.trait);
      setPreferredTraitDonor(undefined);
    }
    // Filter current skills to those valid on np
    setSelectedSkills((prev) =>
      prev.filter((sName) => {
        const sk = skillMap.get(sName);
        return sk && canPersonaInheritSkill(np, sk);
      })
    );
  };

  const filteredPersonas = useMemo(() => {
    return p5rData.personas.filter((p) => {
      if (p.isTreasure) return false;
      if (!isPersonaAvailable(p, enabledDlc)) return false;
      if (arcanaFilter !== '全部' && p.arcana !== arcanaFilter) return false;
      if (
        personaSearch &&
        !matchesSearch(`${p.name} ${p.enName} ${p.jpName} ${p.arcana}`, personaSearch)
      ) {
        return false;
      }
      return true;
    });
  }, [enabledDlc, arcanaFilter, personaSearch]);

  const availableTraits = useMemo(() => {
    return p5rData.traits.filter((t) => canPersonaHoldTrait(targetPersona, t));
  }, [targetPersona]);

  const currentTraitObj = useMemo(
    () => traitMap.get(selectedTrait),
    [selectedTrait]
  );

  const cardSet = useMemo(() => new Set(cardOrGallowsSkills), [cardOrGallowsSkills]);

  const buildPlan = useMemo(() => {
    return generateBuildPlan(
      targetPersona.name,
      selectedTrait,
      selectedSkills,
      cardSet,
      preferredDonors,
      preferredTraitDonor,
      enabledDlc
    );
  }, [
    targetPersona.name,
    selectedTrait,
    selectedSkills,
    cardSet,
    preferredDonors,
    preferredTraitDonor,
    enabledDlc
  ]);

  const handleAddOrReplaceSkill = (skillName: string, slotIndex?: number) => {
    if (selectedSkills.includes(skillName)) {
      setPickerSlotIdx(null);
      return;
    }
    setSelectedSkills((prev) => {
      const next = [...prev];
      if (typeof slotIndex === 'number' && slotIndex < next.length) {
        next[slotIndex] = skillName;
      } else if (next.length < 8) {
        next.push(skillName);
      }
      return next;
    });
    setPickerSlotIdx(null);
  };

  const handleRemoveSkill = (idx: number) => {
    setSelectedSkills((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleSkillCardMode = (skillName: string) => {
    setCardOrGallowsSkills((prev) =>
      prev.includes(skillName)
        ? prev.filter((x) => x !== skillName)
        : [...prev, skillName]
    );
  };

  const handleSaveBuild = () => {
    const newBuild: SavedBuild = {
      id: `${Date.now()}`,
      title: buildTitle.trim() || `${targetPersona.name} 配招`,
      targetPersona: targetPersona.name,
      selectedTrait,
      selectedSkills,
      cardOrGallowsSkills,
      preferredDonors,
      preferredTraitDonor,
      updatedAt: Date.now()
    };
    const next = [newBuild, ...savedBuilds];
    setSavedBuilds(next);
    localStorage.setItem('p5r_saved_builds', JSON.stringify(next));
  };

  const handleLoadBuild = (b: {
    title: string;
    targetPersona: string;
    selectedTrait: string;
    selectedSkills: string[];
    cardOrGallowsSkills?: string[];
    preferredDonors?: Record<string, string>;
    preferredTraitDonor?: string;
  }) => {
    const p = personaMap.get(b.targetPersona);
    if (!p) return;
    setBuildTitle(b.title);
    setTargetName(p.name);
    setSelectedTrait(b.selectedTrait);
    setPreferredTraitDonor(b.preferredTraitDonor);
    setSelectedSkills(
      b.selectedSkills.filter((sName) => {
        const sk = skillMap.get(sName);
        return sk && canPersonaInheritSkill(p, sk);
      })
    );
    setCardOrGallowsSkills(b.cardOrGallowsSkills || []);
    setPreferredDonors(b.preferredDonors || {});
  };

  const handleDeleteSavedBuild = (id: string) => {
    const next = savedBuilds.filter((b) => b.id !== id);
    setSavedBuilds(next);
    localStorage.setItem('p5r_saved_builds', JSON.stringify(next));
  };

  const filteredModalSkills = useMemo(() => {
    return p5rData.skills.filter((s) => {
      const canInherit = canPersonaInheritSkill(targetPersona, s);
      if (!showUninheritable && !canInherit) return false;
      if (skillElementFilter !== '全部' && s.element !== skillElementFilter) {
        return false;
      }
      if (
        skillQuery &&
        !matchesSearch(`${s.name} ${s.enName} ${s.desc}`, skillQuery)
      ) {
        return false;
      }
      return true;
    });
  }, [targetPersona, showUninheritable, skillElementFilter, skillQuery]);

  return (
    <div className="space-y-6">
      {/* Alarm & Fusion Tips Guide (Collapsible + Modal) */}
      <AlarmTipsGuide lang={lang} />

      {/* Top Bar: Preset & Saved Builds */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
            <FolderOpen className="w-4 h-4" />
            {formatText('热门配招范例：', lang)}
          </span>
          {PRESET_BUILDS.map((pb) => (
            <button
              key={pb.title}
              type="button"
              onClick={() => handleLoadBuild(pb)}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 hover:bg-red-600/80 text-zinc-200 hover:text-white border border-zinc-700 transition"
            >
              {formatText(pb.title, lang)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={buildTitle}
            onChange={(e) => setBuildTitle(e.target.value)}
            placeholder={formatText('输入配招方案名称...', lang)}
            className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-red-500"
          />
          <button
            type="button"
            onClick={handleSaveBuild}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition"
          >
            <Save className="w-3.5 h-3.5" />
            {formatText('储存配招', lang)}
          </button>
        </div>
      </div>

      {/* Saved Builds List (if any) */}
      {savedBuilds.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-400 font-semibold">
            {formatText('已储存的方案：', lang)}
          </span>
          {savedBuilds.map((sb) => (
            <div
              key={sb.id}
              className="inline-flex items-center gap-1 bg-zinc-950 border border-zinc-700 rounded-md px-2.5 py-1 text-xs"
            >
              <button
                type="button"
                onClick={() => handleLoadBuild(sb)}
                className="text-amber-300 hover:underline font-medium"
              >
                {formatText(sb.title, lang)} ({formatText(sb.targetPersona, lang)})
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSavedBuild(sb.id)}
                className="text-zinc-500 hover:text-red-400 ml-1"
                title={formatText('删除', lang)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid: Left (Target Persona & Trait & 8 Skills) | Right (Calculated Fusion Routes) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: 7 cols */}
        <div className="xl:col-span-7 space-y-5">
          {/* Step 1: Select Target Persona */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                  1
                </span>
                {formatText('选择合成目标人格面具', lang)}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={arcanaFilter}
                  onChange={(e) => setArcanaFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                >
                  <option value="全部">{formatText('全部塔罗牌', lang)}</option>
                  {p5rData.arcanaOrder.map((a) => (
                    <option key={a} value={a}>
                      {formatText(a, lang)}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={personaSearch}
                    onChange={(e) => setPersonaSearch(e.target.value)}
                    placeholder={formatText('搜寻面具名称...', lang)}
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white w-44 focus:outline-none focus:border-red-500"
                  />
                </div>
                <select
                  value={targetPersona.name}
                  onChange={(e) => handleSelectTargetPersona(e.target.value)}
                  className="bg-zinc-950 border border-red-600/70 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                >
                  {filteredPersonas.map((p) => (
                    <option key={p.name} value={p.name}>
                      [{formatText(p.arcana, lang)} Lv.{p.level}]{' '}
                      {formatText(p.name, lang)}
                      {p.isDlc ? ' (DLC)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <PersonaDetailCard
              persona={targetPersona}
              lang={lang}
              selectedSkills={selectedSkills}
              onAddSkill={(sName) => handleAddOrReplaceSkill(sName)}
            />
          </div>

          {/* Step 2: Select Desired Trait */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                  2
                </span>
                {formatText('选择想要继承的特性（Trait）', lang)}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedTrait(targetPersona.trait);
                  setPreferredTraitDonor(undefined);
                }}
                className="text-xs text-amber-400 hover:underline self-start sm:self-auto"
              >
                {formatText(`使用自身特性（${targetPersona.trait}）`, lang)}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  {formatText('目标特性', lang)}
                </label>
                <select
                  value={selectedTrait}
                  onChange={(e) => {
                    setSelectedTrait(e.target.value);
                    setPreferredTraitDonor(undefined);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold text-amber-300 focus:outline-none focus:border-red-500"
                >
                  {availableTraits.map((t) => (
                    <option key={t.name} value={t.name}>
                      {formatText(t.name, lang)} — {formatText(t.effect, lang)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  {formatText('指定特性来源面具（预设自动搜寻最短路径）', lang)}
                </label>
                <select
                  value={preferredTraitDonor || ''}
                  onChange={(e) =>
                    setPreferredTraitDonor(e.target.value || undefined)
                  }
                  disabled={targetPersona.trait === selectedTrait}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 disabled:opacity-50"
                >
                  <option value="">
                    {targetPersona.trait === selectedTrait
                      ? formatText('目标面具自带此特性（无需继承）', lang)
                      : formatText('自动选择最短合成路径来源', lang)}
                  </option>
                  {currentTraitObj?.holders
                    .filter((h) => {
                      const hp = personaMap.get(h.name);
                      return hp && isPersonaAvailable(hp, enabledDlc);
                    })
                    .map((h) => (
                      <option key={h.name} value={h.name}>
                        [{formatText(h.arcana, lang)} Lv.{h.level}]{' '}
                        {formatText(h.name, lang)}
                        {h.isTreasure ? formatText(' (宝魔)', lang) : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {currentTraitObj && (
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-2.5 text-xs flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-200">
                    {formatText(currentTraitObj.name, lang)}：
                    <span className="font-normal text-zinc-300 ml-1">
                      {formatText(currentTraitObj.effect, lang)}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    {formatText('持有此特性的面具：', lang)}
                    {currentTraitObj.holders
                      .map((h) => `${formatText(h.name, lang)}(Lv.${h.level})`)
                      .join('、')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: 8 Skill Slots */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                  3
                </span>
                {formatText(
                  `配置 8 个技能槽位（已选 ${selectedSkills.length} / 8）`,
                  lang
                )}
              </h2>
              {selectedSkills.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSkills([])}
                  className="text-xs text-zinc-400 hover:text-red-400"
                >
                  {formatText('清空全部技能', lang)}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {Array.from({ length: 8 }).map((_, slotIdx) => {
                const sName = selectedSkills[slotIdx];
                const sk = sName ? skillMap.get(sName) : undefined;
                const plan = sName
                  ? buildPlan.skillPlans.find((sp) => sp.skillName === sName)
                  : undefined;

                if (!sName || !sk) {
                  return (
                    <button
                      key={`empty-${slotIdx}`}
                      type="button"
                      onClick={() => setPickerSlotIdx(slotIdx)}
                      className="h-24 rounded-lg border border-dashed border-zinc-700 hover:border-red-500 bg-zinc-950/50 hover:bg-zinc-950 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-white transition"
                    >
                      <Plus className="w-5 h-5 text-red-500" />
                      <span className="text-xs font-medium">
                        {formatText(`槽位 ${slotIdx + 1}：点击选择技能`, lang)}
                      </span>
                    </button>
                  );
                }

                const isInnate = targetPersona.skills.some(
                  (ls) => ls.name === sName
                );
                const isCardMode = cardSet.has(sName);

                return (
                  <div
                    key={sName}
                    className="rounded-lg border border-zinc-700/90 bg-zinc-950/90 p-3 flex flex-col justify-between gap-2 hover:border-zinc-600 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="flex items-center gap-1.5 cursor-pointer"
                        onClick={() => setPickerSlotIdx(slotIdx)}
                      >
                        <span className="text-[11px] font-mono text-zinc-500">
                          #{slotIdx + 1}
                        </span>
                        <ElementBadge element={sk.element} lang={lang} />
                        <span className="font-bold text-sm text-white hover:text-red-400 transition">
                          {formatText(sk.name, lang)}
                        </span>
                        {sk.cost && (
                          <span className="text-[11px] text-amber-300/90 font-medium">
                            ({sk.cost})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(slotIdx)}
                        className="text-zinc-500 hover:text-red-400"
                        title={formatText('移除此技能', lang)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-1">
                      {formatText(sk.desc, lang)}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-zinc-800/80 text-[11px]">
                      {isInnate ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {formatText('目标面具自身习得', lang)}
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleSkillCardMode(sName)}
                            className={`px-2 py-0.5 rounded border font-medium transition ${
                              isCardMode
                                ? 'bg-purple-950/70 border-purple-500/50 text-purple-200'
                                : 'bg-red-950/50 border-red-600/40 text-red-200 hover:bg-red-900/40'
                            }`}
                          >
                            {isCardMode
                              ? formatText('技能卡 / 绞刑', lang)
                              : formatText(
                                  `合成继承 (${
                                    plan?.chain ? `${plan.chain.length}步` : '无路线'
                                  })`,
                                  lang
                                )}
                          </button>

                          {!isCardMode && sk.learners.length > 0 && (
                            <select
                              value={preferredDonors[sName] || ''}
                              onChange={(e) =>
                                setPreferredDonors((prev) => ({
                                  ...prev,
                                  [sName]: e.target.value
                                }))
                              }
                              className="bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-[11px] text-zinc-300 max-w-[135px]"
                            >
                              <option value="">
                                {formatText(
                                  `来源：${plan?.preferredDonor || '自动'}`,
                                  lang
                                )}
                              </option>
                              {sk.learners
                                .filter((l) => {
                                  const lp = personaMap.get(l.persona);
                                  return lp && isPersonaAvailable(lp, enabledDlc);
                                })
                                .map((l) => (
                                  <option key={l.persona} value={l.persona}>
                                    {formatText(l.persona, lang)} (Lv.{l.level})
                                  </option>
                                ))}
                            </select>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: 5 cols — Full Route & Step-by-Step Inheritance Plan */}
        <div className="xl:col-span-5 space-y-5">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Route className="w-5 h-5 text-red-500" />
                  {formatText('合成路线与技能继承蓝图', lang)}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {formatText(
                    '点击任意合成步骤右侧的「模拟此步」即可将两个素材与技能送入二体合成模拟器！',
                    lang
                  )}
                </p>
              </div>
            </div>

            {/* 1. Special Fusion Notice if Target is Special */}
            {targetPersona.isSpecial && targetPersona.specialRecipe && (
              <div className="bg-rose-950/30 border border-rose-600/40 rounded-lg p-3 space-y-2">
                <div className="text-xs font-bold text-rose-300 flex items-center justify-between">
                  <span>
                    {formatText(
                      `★ ${targetPersona.name} 为特殊合成（集体断头台 ${targetPersona.specialRecipe.length} 体合成）`,
                      lang
                    )}
                  </span>
                  {targetPersona.specialRecipe.length === 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        onSendToSimulator(
                          targetPersona.specialRecipe![0],
                          targetPersona.specialRecipe![1],
                          undefined,
                          undefined,
                          selectedTrait
                        )
                      }
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-[11px]"
                    >
                      <Play className="w-3 h-3" />
                      {formatText('模拟二体特殊合成', lang)}
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-zinc-300">
                  {formatText(
                    '只要将想要的特性与技能先合成到以下任意一个必备素材面具上，最后进行特殊合成即可全部继承至目标面具：',
                    lang
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {targetPersona.specialRecipe.map((ingName) => {
                    const ingP = personaMap.get(ingName);
                    return (
                      <span
                        key={ingName}
                        className="px-2 py-1 rounded bg-zinc-950 border border-rose-500/40 text-xs font-semibold text-rose-200"
                      >
                        {formatText(ingName, lang)}
                        {ingP ? ` (${formatText(ingP.arcana, lang)} Lv.${ingP.level})` : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Trait Inheritance Chain */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                {formatText(`特性路线：【${selectedTrait}】`, lang)}
              </h3>

              {targetPersona.trait === selectedTrait ? (
                <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-3 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {formatText(
                    `${targetPersona.name} 自身即为【${selectedTrait}】特性持有者，无需额外合成传递。`,
                    lang
                  )}
                </div>
              ) : buildPlan.traitChain && buildPlan.traitChain.length > 0 ? (
                <div className="space-y-2">
                  {buildPlan.traitChain.map((step) => (
                    <div
                      key={`trait-step-${step.stepIndex}`}
                      className="bg-zinc-950 border border-amber-500/30 rounded-lg p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-amber-300">
                          {formatText(`步骤 ${step.stepIndex}`, lang)}
                          {step.type === 'treasure'
                            ? formatText('（宝魔升降阶）', lang)
                            : step.type === 'same_arcana'
                            ? formatText('（同牌降阶）', lang)
                            : step.type === 'special'
                            ? formatText('（特殊合成）', lang)
                            : formatText('（二体合成）', lang)}
                        </span>
                        {step.ingredients.length === 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              onSendToSimulator(
                                step.ingredients[0],
                                step.ingredients[1],
                                step.carriedSkills,
                                undefined,
                                selectedTrait
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600/90 hover:bg-red-500 text-white text-[11px] font-semibold transition"
                          >
                            <Play className="w-3 h-3" />
                            {formatText('模拟此步', lang)}
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        {step.ingredients.map((ing, i) => (
                          <React.Fragment key={`${ing}-${i}`}>
                            {i > 0 && <span className="text-zinc-500">+</span>}
                            <span
                              className={`px-2 py-0.5 rounded border font-medium ${
                                i === 0
                                  ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                                  : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                              }`}
                            >
                              {formatText(ing, lang)}
                            </span>
                          </React.Fragment>
                        ))}
                        <ArrowRight className="w-3.5 h-3.5 text-red-400 mx-0.5" />
                        <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-500/60 text-white font-bold">
                          {formatText(step.result, lang)}
                        </span>
                      </div>

                      {step.carriedSkills.length > 0 && (
                        <div className="text-[11px] text-emerald-300/90 pt-1">
                          {formatText('★ 此路线可顺便携带目标技能：', lang)}
                          {step.carriedSkills
                            .map((s) => formatText(s, lang))
                            .join('、')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-950/70 border border-red-800/50 rounded-lg p-3 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formatText(
                    '未找到符合当前 DLC 设定的特性合成路线，请检查 DLC 面具开关。',
                    lang
                  )}
                </div>
              )}
            </div>

            {/* 3. Skill Inheritance Routes */}
            <div className="space-y-2.5 pt-2 border-t border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <Wrench className="w-4 h-4" />
                {formatText('8 技能获取与合成继承路线', lang)}
              </h3>

              {buildPlan.skillPlans.length === 0 ? (
                <div className="text-xs text-zinc-500 py-4 text-center">
                  {formatText('尚未选择任何技能，请从左侧点击技能槽添加。', lang)}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                  {buildPlan.skillPlans.map((sp) => {
                    const sk = skillMap.get(sp.skillName);
                    if (!sk) return null;

                    return (
                      <div
                        key={sp.skillName}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <ElementBadge element={sk.element} lang={lang} />
                            <span className="text-xs font-bold text-white">
                              {formatText(sp.skillName, lang)}
                            </span>
                          </div>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                            {sp.mode === 'innate'
                              ? formatText('目标面具自带/升级习得', lang)
                              : sp.mode === 'card_or_gallows'
                              ? formatText('技能卡 / 绞刑强化', lang)
                              : sp.mode === 'network'
                              ? formatText('网络合成（公开处刑）', lang)
                              : formatText(
                                  `合成继承（由 ${sp.preferredDonor} 起共 ${
                                    sp.chain?.length || 0
                                  } 步）`,
                                  lang
                                )}
                          </span>
                        </div>

                        {sp.mode === 'fusion' && sp.chain && sp.chain.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {sp.chain.map((st) => (
                              <div
                                key={`${sp.skillName}-step-${st.stepIndex}`}
                                className="flex items-center justify-between gap-2 bg-zinc-900/70 rounded px-2.5 py-1.5 text-[11px]"
                              >
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="text-zinc-500 font-mono">
                                    {st.stepIndex}.
                                  </span>
                                  {st.ingredients.map((ing, i) => (
                                    <React.Fragment key={`${ing}-${i}`}>
                                      {i > 0 && (
                                        <span className="text-zinc-500">+</span>
                                      )}
                                      <span
                                        className={
                                          i === 0
                                            ? 'text-amber-300 font-semibold'
                                            : 'text-zinc-300'
                                        }
                                      >
                                        {formatText(ing, lang)}
                                      </span>
                                    </React.Fragment>
                                  ))}
                                  <ArrowRight className="w-3 h-3 text-red-400 mx-0.5" />
                                  <span className="text-white font-bold">
                                    {formatText(st.result, lang)}
                                  </span>
                                </div>
                                {st.ingredients.length === 2 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onSendToSimulator(
                                        st.ingredients[0],
                                        st.ingredients[1],
                                        st.carriedSkills,
                                        undefined,
                                        selectedTrait
                                      )
                                    }
                                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-red-600 text-zinc-200 hover:text-white transition shrink-0"
                                  >
                                    {formatText('模拟', lang)}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {sp.mode === 'card_or_gallows' && (
                          <div className="text-[11px] text-zinc-300 bg-purple-950/20 border border-purple-700/30 rounded p-2 space-y-1">
                            {(sk.chairCards.length > 0 || sk.skillCardRaw) && (
                              <div className="flex items-center gap-1 text-purple-200">
                                <Disc className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                {formatText('电椅技能卡来源：', lang)}
                                {sk.chairCards.length > 0
                                  ? sk.chairCards
                                      .map(
                                        (c) =>
                                          `${formatText(c.persona, lang)}${
                                            c.alarm
                                              ? formatText('(警报电椅)', lang)
                                              : formatText('(一般电椅)', lang)
                                          }`
                                      )
                                      .join('、')
                                  : formatText(sk.skillCardRaw, lang)}
                              </div>
                            )}
                            {sk.learners.length > 0 && (
                              <div className="text-zinc-400">
                                {formatText('绞刑（强化）献祭面具：', lang)}
                                {sk.learners
                                  .map(
                                    (l) =>
                                      `${formatText(l.persona, lang)}(Lv.${l.level})`
                                  )
                                  .join('、')}
                              </div>
                            )}
                          </div>
                        )}

                        {sp.mode === 'network' && (
                          <div className="text-[11px] text-sky-300 bg-sky-950/30 border border-sky-700/30 rounded p-2">
                            {formatText(
                              '此技能需透过天鹅绒房间「网络合成（公开处刑）」机率习得，再经由合成或绞刑继承。',
                              lang
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skill Picker Modal */}
      {pickerSlotIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-600/50 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {formatText(
                    `为【${targetPersona.name}】选择技能（槽位 #${pickerSlotIdx + 1}）`,
                    lang
                  )}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {formatText(
                    `已根据【${targetPersona.name}】的继承类型（${targetPersona.inheritType}）自动过滤不可继承的技能与他人的专属技能`,
                    lang
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerSlotIdx(null)}
                className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200"
              >
                {formatText('关闭', lang)}
              </button>
            </div>

            {/* Filters */}
            <div className="p-3 bg-zinc-900 border-b border-zinc-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={skillQuery}
                    onChange={(e) => setSkillQuery(e.target.value)}
                    placeholder={formatText(
                      '搜寻技能名称、英文名或效果（支援简繁搜寻）...',
                      lang
                    )}
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showUninheritable}
                    onChange={(e) => setShowUninheritable(e.target.checked)}
                    className="rounded border-zinc-600 text-red-600 focus:ring-red-500"
                  />
                  {formatText('显示不可继承 / 专属技能', lang)}
                </label>
              </div>

              <div className="flex flex-wrap gap-1">
                {SKILL_ELEMENTS.map((el) => (
                  <button
                    key={el}
                    type="button"
                    onClick={() => setSkillElementFilter(el)}
                    className={`px-2 py-1 rounded text-xs font-medium transition ${
                      skillElementFilter === el
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    {formatText(el, lang)}
                  </button>
                ))}
              </div>
            </div>

            {/* Skill List */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredModalSkills.map((sk) => {
                const canInherit = canPersonaInheritSkill(targetPersona, sk);
                const alreadyPicked = selectedSkills.includes(sk.name);

                return (
                  <button
                    key={sk.name}
                    type="button"
                    disabled={!canInherit || alreadyPicked}
                    onClick={() => handleAddOrReplaceSkill(sk.name, pickerSlotIdx)}
                    className={`text-left p-3 rounded-xl border transition flex flex-col justify-between gap-1.5 ${
                      alreadyPicked
                        ? 'bg-red-950/30 border-red-600/40 opacity-60 cursor-not-allowed'
                        : !canInherit
                        ? 'bg-zinc-950/40 border-zinc-800/60 opacity-45 cursor-not-allowed'
                        : 'bg-zinc-950 hover:bg-zinc-800/80 border-zinc-800 hover:border-red-500/60 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <ElementBadge element={sk.element} lang={lang} />
                        <span className="font-bold text-sm text-white">
                          {formatText(sk.name, lang)}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {sk.enName}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-amber-300">
                        {sk.cost}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300">
                      {formatText(sk.desc, lang)}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/70">
                      <span className="truncate max-w-[70%]">
                        {sk.learners.length > 0
                          ? `${formatText('习得：', lang)}${sk.learners
                              .slice(0, 4)
                              .map((l) => `${formatText(l.persona, lang)}(${l.level})`)
                              .join('、')}${sk.learners.length > 4 ? '...' : ''}`
                          : sk.isNetwork
                          ? formatText('来源：网络合成（公开处刑）', lang)
                          : formatText('来源：警报合体变异', lang)}
                      </span>
                      {!canInherit && (
                        <span className="text-red-400 font-semibold">
                          {sk.exclusiveTo
                            ? formatText(
                                `${sk.exclusiveTo.join('/')} 专属`,
                                lang
                              )
                            : formatText(`不可继承(${sk.element})`, lang)}
                        </span>
                      )}
                      {alreadyPicked && (
                        <span className="text-emerald-400 font-semibold">
                          {formatText('已选', lang)}
                        </span>
                      )}
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
