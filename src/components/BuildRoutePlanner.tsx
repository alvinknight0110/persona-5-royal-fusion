import React, { useState, useMemo } from 'react';
import { SavedBuild, SkillElement } from '../types/p5r';
import {
  p5rData,
  personaMap,
  skillMap,
  traitMap,
  canPersonaInheritSkill,
  canPersonaHoldTrait,
  findShortestFusionChain,
  getReverseFusions,
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
  Wrench,
  X,
  Zap
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

  // Skill picker modal state
  const [pickerSlotIdx, setPickerSlotIdx] = useState<number | null>(null);
  const [skillQuery, setSkillQuery] = useState<string>('');
  const [skillElementFilter, setSkillElementFilter] = useState<'全部' | SkillElement>('全部');
  const [showUninheritable, setShowUninheritable] = useState<boolean>(false);

  // Modal 1: Single-Skill Guillotine Fusion Inheritance Route Modal („合成繼承“ button)
  const [fusionRouteModalSkill, setFusionRouteModalSkill] = useState<string | null>(
    null
  );
  const [fusionModalDonor, setFusionModalDonor] = useState<string>('');

  // Modal 2: Gallows / Electric Chair Donor Persona Reverse Fusion Recipes Modal
  const [donorRecipeModal, setDonorRecipeModal] = useState<{
    personaName: string;
    skillName: string;
    contextLabel: string;
  } | null>(null);
  const [donorRecipeFilter, setDonorRecipeFilter] = useState<string>('');

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
    const curTraitObj = traitMap.get(selectedTrait);
    if (!curTraitObj || !canPersonaHoldTrait(np, curTraitObj)) {
      setSelectedTrait(np.trait);
      setPreferredTraitDonor(undefined);
    }
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

  // Calculate Trait fusion chain
  const traitChain = useMemo(() => {
    if (!selectedTrait || targetPersona.trait === selectedTrait) return [];
    const traitObj = traitMap.get(selectedTrait);
    if (!traitObj || !canPersonaHoldTrait(targetPersona, traitObj)) return null;
    const holders =
      preferredTraitDonor &&
      traitObj.holders.some((h) => h.name === preferredTraitDonor)
        ? [preferredTraitDonor]
        : traitObj.holders.map((h) => h.name);

    return findShortestFusionChain(
      holders,
      targetPersona.name,
      enabledDlc,
      [],
      selectedTrait,
      selectedSkills
    );
  }, [
    targetPersona,
    selectedTrait,
    preferredTraitDonor,
    enabledDlc,
    selectedSkills
  ]);

  // Calculate Single-Skill Fusion Inheritance Chain when Modal 1 is open
  const activeModalSkillObj = useMemo(
    () => (fusionRouteModalSkill ? skillMap.get(fusionRouteModalSkill) : undefined),
    [fusionRouteModalSkill]
  );

  const singleSkillFusionChain = useMemo(() => {
    if (!activeModalSkillObj) return null;
    const availLearners = activeModalSkillObj.learners
      .map((l) => l.persona)
      .filter((pName) => {
        const p = personaMap.get(pName);
        return p && isPersonaAvailable(p, enabledDlc);
      });
    const sources =
      fusionModalDonor && availLearners.includes(fusionModalDonor)
        ? [fusionModalDonor]
        : availLearners;
    if (sources.length === 0) return null;
    return findShortestFusionChain(
      sources,
      targetPersona.name,
      enabledDlc,
      [activeModalSkillObj],
      selectedTrait,
      [activeModalSkillObj.name]
    );
  }, [
    activeModalSkillObj,
    fusionModalDonor,
    targetPersona.name,
    enabledDlc,
    selectedTrait
  ]);

  // Calculate Reverse Fusions for Donor Persona when Modal 2 is open
  const donorModalPersonaObj = useMemo(
    () =>
      donorRecipeModal ? personaMap.get(donorRecipeModal.personaName) : undefined,
    [donorRecipeModal]
  );

  const donorReverseData = useMemo(() => {
    if (!donorRecipeModal) return { specialRecipe: null, pairs: [] };
    return getReverseFusions(donorRecipeModal.personaName, enabledDlc);
  }, [donorRecipeModal, enabledDlc]);

  const filteredDonorPairs = useMemo(() => {
    return donorReverseData.pairs.filter((item) => {
      if (!donorRecipeFilter) return true;
      return matchesSearch(
        `${item.p1.name} ${item.p1.arcana} ${item.p2.name} ${item.p2.arcana}`,
        donorRecipeFilter
      );
    });
  }, [donorReverseData.pairs, donorRecipeFilter]);

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

  const handleSaveBuild = () => {
    const newBuild: SavedBuild = {
      id: `${Date.now()}`,
      title: buildTitle.trim() || `${targetPersona.name} 配招`,
      targetPersona: targetPersona.name,
      selectedTrait,
      selectedSkills,
      cardOrGallowsSkills: [],
      preferredDonors: {},
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

      {/* Main Grid: Left (Target Persona & Trait & 8 Skills) | Right (Trait Route + Direct Skill Card / Gallows List) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: 6 cols */}
        <div className="xl:col-span-6 space-y-5">
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
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white w-40 focus:outline-none focus:border-red-500"
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

          {/* Step 3: 8 Skill Slots (Simplified, no toggle) */}
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

                const ownLearn = targetPersona.skills.find(
                  (ls) => ls.name === sName
                );
                const hasCard =
                  sk.chairCards.length > 0 || Boolean(sk.skillCardRaw);

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
                      {ownLearn ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {formatText(
                            `目标面具自身习得 (${
                              ownLearn.level === 0 ? '自带' : `Lv.${ownLearn.level}`
                            })`,
                            lang
                          )}
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {hasCard && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-600/40 text-purple-200">
                              {formatText('有技能卡', lang)}
                            </span>
                          )}
                          {sk.learners.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-600/40 text-amber-200">
                              {formatText(`绞刑 (${sk.learners.length})`, lang)}
                            </span>
                          )}
                          {sk.isNetwork && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-600/40 text-sky-200">
                              {formatText('网络处刑', lang)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: 6 cols — Trait Route + Direct Skill Card / Gallows List & Modal Triggers */}
        <div className="xl:col-span-6 space-y-5">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Route className="w-5 h-5 text-red-500" />
                  {formatText('特性合成路线与 8 技能获取指南', lang)}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {formatText(
                    '直接检视各技能的「技能卡（电椅）」与「绞刑（强化）」来源面具（点击面具可查看合成配方），或点击「合成继承」弹窗查看断头台继承路线。',
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
                    '必备合成素材面具（点击任意素材面具可弹窗查看其合成配方）：',
                    lang
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {targetPersona.specialRecipe.map((ingName) => {
                    const ingP = personaMap.get(ingName);
                    return (
                      <button
                        key={ingName}
                        type="button"
                        onClick={() => {
                          setDonorRecipeFilter('');
                          setDonorRecipeModal({
                            personaName: ingName,
                            skillName: targetPersona.name,
                            contextLabel: `特殊合成【${targetPersona.name}】必备素材`
                          });
                        }}
                        className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-rose-900/50 border border-rose-500/40 text-xs font-semibold text-rose-200 transition"
                      >
                        {formatText(ingName, lang)}
                        {ingP
                          ? ` (${formatText(ingP.arcana, lang)} Lv.${ingP.level})`
                          : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Trait Inheritance Chain */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                {formatText(`特性合成路线：【${selectedTrait}】`, lang)}
              </h3>

              {targetPersona.trait === selectedTrait ? (
                <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-3 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {formatText(
                    `${targetPersona.name} 自身即为【${selectedTrait}】特性持有者，无需额外合成传递。`,
                    lang
                  )}
                </div>
              ) : traitChain && traitChain.length > 0 ? (
                <div className="space-y-2">
                  {traitChain.map((step) => (
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

            {/* 3. Direct Skill Cards (Electric Chair) & Gallows List + "合成繼承" Modal Trigger */}
            <div className="space-y-3 pt-3 border-t border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <Wrench className="w-4 h-4" />
                {formatText(
                  '8 技能获取详情（技能卡 / 绞刑面具点击可看合成配方 / 断头台合成继承）',
                  lang
                )}
              </h3>

              {selectedSkills.length === 0 ? (
                <div className="text-xs text-zinc-500 py-4 text-center">
                  {formatText('尚未选择任何技能，请从左侧点击技能槽添加。', lang)}
                </div>
              ) : (
                <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                  {selectedSkills.map((sName) => {
                    const sk = skillMap.get(sName);
                    if (!sk) return null;

                    const ownLearn = targetPersona.skills.find(
                      (ls) => ls.name === sName
                    );
                    const availLearners = sk.learners.filter((l) => {
                      const lp = personaMap.get(l.persona);
                      return lp && isPersonaAvailable(lp, enabledDlc);
                    });
                    const availChairCards = sk.chairCards.filter((c) => {
                      const cp = personaMap.get(c.persona);
                      return cp && isPersonaAvailable(cp, enabledDlc);
                    });

                    return (
                      <div
                        key={sName}
                        className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2.5"
                      >
                        {/* Header row: Skill Name + "合成繼承" Button */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ElementBadge element={sk.element} lang={lang} />
                            <span className="text-sm font-extrabold text-white">
                              {formatText(sk.name, lang)}
                            </span>
                            {sk.cost && (
                              <span className="text-xs text-amber-300 font-medium">
                                ({sk.cost})
                              </span>
                            )}
                          </div>

                          {ownLearn ? (
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {formatText(
                                `自身习得 (${
                                  ownLearn.level === 0
                                    ? '自带'
                                    : `Lv.${ownLearn.level}`
                                })`,
                                lang
                              )}
                            </span>
                          ) : (
                            availLearners.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFusionModalDonor('');
                                  setFusionRouteModalSkill(sName);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow transition"
                              >
                                <Route className="w-3.5 h-3.5" />
                                {formatText('合成继承', lang)}
                              </button>
                            )
                          )}
                        </div>

                        {/* Body: If not innate, directly show Skill Card & Gallows Personas */}
                        {!ownLearn && (
                          <div className="space-y-2 text-xs">
                            {/* Skill Card Section */}
                            <div className="p-2.5 rounded-lg bg-purple-950/20 border border-purple-700/30 space-y-1.5">
                              <div className="font-bold text-purple-300 flex items-center gap-1.5">
                                <Disc className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                {formatText('技能卡（电椅道具化 / 交涉）：', lang)}
                              </div>
                              {availChairCards.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {availChairCards.map((c, idx) => {
                                    const cp = personaMap.get(c.persona);
                                    return (
                                      <button
                                        key={`${c.persona}-${idx}`}
                                        type="button"
                                        onClick={() => {
                                          setDonorRecipeFilter('');
                                          setDonorRecipeModal({
                                            personaName: c.persona,
                                            skillName: sName,
                                            contextLabel: c.alarm
                                              ? `警报电椅道具化产出【${sName}】技能卡`
                                              : `一般电椅道具化产出【${sName}】技能卡`
                                          });
                                        }}
                                        className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-purple-900/60 border border-purple-500/40 text-purple-100 font-medium transition flex items-center gap-1"
                                      >
                                        <span>{formatText(c.persona, lang)}</span>
                                        {cp && (
                                          <span className="text-[10px] text-purple-300">
                                            ({formatText(cp.arcana, lang)} Lv.{cp.level})
                                          </span>
                                        )}
                                        <span
                                          className={`text-[10px] px-1 rounded ${
                                            c.alarm
                                              ? 'bg-red-600/40 text-red-200'
                                              : 'bg-zinc-800 text-zinc-300'
                                          }`}
                                        >
                                          {c.alarm
                                            ? formatText('警报电椅', lang)
                                            : formatText('一般电椅', lang)}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : sk.skillCardRaw ? (
                                <div className="text-purple-200 text-[11px]">
                                  {formatText(sk.skillCardRaw, lang)}
                                </div>
                              ) : (
                                <div className="text-zinc-500 text-[11px]">
                                  {formatText(
                                    '无电椅技能卡（请透过下方绞刑强化或断头台合成继承）',
                                    lang
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Gallows (Strengthening) Section */}
                            <div className="p-2.5 rounded-lg bg-amber-950/15 border border-amber-700/30 space-y-1.5">
                              <div className="font-bold text-amber-300 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  {formatText(
                                    '绞刑（强化继承）献祭面具（点击面具查看合成配方）：',
                                    lang
                                  )}
                                </span>
                              </div>

                              {availLearners.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {availLearners.map((l) => {
                                    const lp = personaMap.get(l.persona);
                                    return (
                                      <button
                                        key={l.persona}
                                        type="button"
                                        onClick={() => {
                                          setDonorRecipeFilter('');
                                          setDonorRecipeModal({
                                            personaName: l.persona,
                                            skillName: sName,
                                            contextLabel: l.isInnate
                                              ? `自带技能【${sName}】（合成出即可直接绞刑）`
                                              : `需升至 Lv.${l.level} 习得技能【${sName}】`
                                          });
                                        }}
                                        className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-amber-900/50 border border-amber-500/40 text-zinc-100 hover:text-white font-medium transition flex items-center gap-1"
                                      >
                                        <span className="font-bold text-amber-200">
                                          {formatText(l.persona, lang)}
                                        </span>
                                        <span className="text-[10px] text-zinc-400">
                                          [{formatText(l.arcana, lang)} Lv.
                                          {lp?.level || l.level}]
                                        </span>
                                        <span className="text-[10px] px-1 rounded bg-zinc-800 text-amber-300">
                                          {l.isInnate
                                            ? formatText('自带', lang)
                                            : formatText(`习得Lv.${l.level}`, lang)}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : sk.isNetwork ? (
                                <div className="text-sky-300 text-[11px]">
                                  {formatText(
                                    '此技能无常规习得面具，需透过「网络合成（公开处刑）」机率取得后再用绞刑继承。',
                                    lang
                                  )}
                                </div>
                              ) : (
                                <div className="text-zinc-500 text-[11px]">
                                  {formatText(
                                    '需透过警报合体技能变异取得。',
                                    lang
                                  )}
                                </div>
                              )}
                            </div>
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

      {/* Modal 1: Single-Skill Guillotine Fusion Route Modal ("合成繼承" Button) */}
      {fusionRouteModalSkill && activeModalSkillObj && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/60 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {formatText(
                      `【${activeModalSkillObj.name}】断头台合成继承路线 → ${targetPersona.name}`,
                      lang
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {formatText(
                      '所有中继面具均已验证可合法继承此技能属性',
                      lang
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFusionRouteModalSkill(null)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Donor selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-300 font-semibold">
                  {formatText('选择起始技能来源面具：', lang)}
                </span>
                <select
                  value={fusionModalDonor}
                  onChange={(e) => setFusionModalDonor(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-bold"
                >
                  <option value="">
                    {formatText('自动选择最短合成路线来源', lang)}
                  </option>
                  {activeModalSkillObj.learners
                    .filter((l) => {
                      const lp = personaMap.get(l.persona);
                      return lp && isPersonaAvailable(lp, enabledDlc);
                    })
                    .map((l) => (
                      <option key={l.persona} value={l.persona}>
                        [{formatText(l.arcana, lang)}] {formatText(l.persona, lang)}{' '}
                        ({l.isInnate ? formatText('自带', lang) : `Lv.${l.level}`})
                      </option>
                    ))}
                </select>
              </div>

              {/* Steps */}
              {singleSkillFusionChain && singleSkillFusionChain.length > 0 ? (
                <div className="space-y-2.5">
                  {singleSkillFusionChain.map((step) => (
                    <div
                      key={`modal-fusion-step-${step.stepIndex}`}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-400">
                          {formatText(`步骤 ${step.stepIndex}`, lang)}
                          {step.type === 'treasure'
                            ? formatText('（宝魔升降阶）', lang)
                            : step.type === 'same_arcana'
                            ? formatText('（同牌降阶）', lang)
                            : step.type === 'special'
                            ? formatText('（特殊合成）', lang)
                            : formatText('（一般二体合成）', lang)}
                        </span>
                        {step.ingredients.length === 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFusionRouteModalSkill(null);
                              onSendToSimulator(
                                step.ingredients[0],
                                step.ingredients[1],
                                [activeModalSkillObj.name],
                                undefined,
                                selectedTrait
                              );
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition"
                          >
                            <Play className="w-3 h-3" />
                            {formatText('送入模拟器演练', lang)}
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        {step.ingredients.map((ing, i) => {
                          const ingP = personaMap.get(ing);
                          return (
                            <React.Fragment key={`${ing}-${i}`}>
                              {i > 0 && <span className="text-zinc-500">+</span>}
                              <button
                                type="button"
                                onClick={() => {
                                  setFusionRouteModalSkill(null);
                                  setDonorRecipeFilter('');
                                  setDonorRecipeModal({
                                    personaName: ing,
                                    skillName: activeModalSkillObj.name,
                                    contextLabel: `合成步骤 ${step.stepIndex} 素材面具`
                                  });
                                }}
                                className={`px-2.5 py-1 rounded border font-semibold transition ${
                                  i === 0
                                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 hover:bg-amber-900/50'
                                    : 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                                }`}
                              >
                                {formatText(ing, lang)}
                                {ingP
                                  ? ` (${formatText(ingP.arcana, lang)} Lv.${ingP.level})`
                                  : ''}
                              </button>
                            </React.Fragment>
                          );
                        })}
                        <ArrowRight className="w-4 h-4 text-red-500 mx-1" />
                        <span className="px-2.5 py-1 rounded bg-red-950/60 border border-red-500/60 text-white font-extrabold">
                          {formatText(step.result, lang)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-zinc-400 bg-zinc-950 rounded-xl border border-zinc-800">
                  {formatText(
                    '未找到可直接传递此技能的断头台合成路径，建议使用「技能卡」或「绞刑」强化！',
                    lang
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Gallows / Electric Chair Donor Persona Reverse Fusion Recipe Modal */}
      {donorRecipeModal && donorModalPersonaObj && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/60 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white text-xs font-bold">
                    Lv.{donorModalPersonaObj.level}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-xs font-semibold">
                    {formatText(donorModalPersonaObj.arcana, lang)}
                  </span>
                  <h3 className="text-base font-extrabold text-white">
                    {formatText(
                      `如何合成【${donorModalPersonaObj.name}】`,
                      lang
                    )}
                  </h3>
                </div>
                <p className="text-xs text-amber-300 mt-1 font-medium">
                  {formatText(donorRecipeModal.contextLabel, lang)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDonorRecipeModal(null)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              {/* If Special Fusion */}
              {donorReverseData.specialRecipe && (
                <div className="bg-rose-950/30 border border-rose-500/50 rounded-xl p-3.5 space-y-2">
                  <div className="text-xs font-bold text-rose-300">
                    {formatText(
                      `★ 【${donorModalPersonaObj.name}】为特殊合成（集体断头台），需使用以下固定素材合成：`,
                      lang
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {donorReverseData.specialRecipe.map((ing) => (
                      <button
                        key={ing.name}
                        type="button"
                        onClick={() =>
                          setDonorRecipeModal({
                            personaName: ing.name,
                            skillName: donorRecipeModal.skillName,
                            contextLabel: `特殊合成【${donorModalPersonaObj.name}】的素材面具`
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-rose-500/40 text-xs text-white font-semibold transition"
                      >
                        {formatText(ing.name, lang)}{' '}
                        <span className="text-zinc-400 font-normal">
                          ({formatText(ing.arcana, lang)} Lv.{ing.level})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* If Treasure Demon */}
              {donorModalPersonaObj.isTreasure && (
                <div className="bg-yellow-950/30 border border-yellow-500/50 rounded-xl p-4 text-xs text-yellow-200">
                  {formatText(
                    `【${donorModalPersonaObj.name}】为宝魔，无法透过合成产出，需于殿堂或印象空间遭遇捕获后登录全书。`,
                    lang
                  )}
                </div>
              )}

              {/* Normal 2-body / Same-Arcana / Treasure Demon Recipes */}
              {!donorModalPersonaObj.isTreasure &&
                donorReverseData.pairs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-zinc-300">
                        {formatText(
                          `共有 ${filteredDonorPairs.length} 组逆向合成配方（依召唤费用由低至高排序）：`,
                          lang
                        )}
                      </span>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
                        <input
                          type="text"
                          value={donorRecipeFilter}
                          onChange={(e) => setDonorRecipeFilter(e.target.value)}
                          placeholder={formatText('筛选素材面具...', lang)}
                          className="pl-8 pr-3 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto border border-zinc-800 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="py-2 px-3">
                              {formatText('素材 A', lang)}
                            </th>
                            <th className="py-2 px-3">
                              {formatText('素材 B', lang)}
                            </th>
                            <th className="py-2 px-3">
                              {formatText('类型', lang)}
                            </th>
                            <th className="py-2 px-3">
                              {formatText('预估费用', lang)}
                            </th>
                            <th className="py-2 px-3 text-right">
                              {formatText('操作', lang)}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/70">
                          {filteredDonorPairs.slice(0, 120).map((pair, idx) => (
                            <tr
                              key={`${pair.p1.name}-${pair.p2.name}-${idx}`}
                              className="hover:bg-zinc-800/50 transition"
                            >
                              <td className="py-2 px-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDonorRecipeModal({
                                      personaName: pair.p1.name,
                                      skillName: donorRecipeModal.skillName,
                                      contextLabel: `合成【${donorModalPersonaObj.name}】的素材面具`
                                    })
                                  }
                                  className="font-semibold text-white hover:text-amber-300"
                                >
                                  {formatText(pair.p1.name, lang)}
                                </button>
                                <span className="text-[11px] text-zinc-400 ml-1">
                                  ({formatText(pair.p1.arcana, lang)} Lv.
                                  {pair.p1.level})
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDonorRecipeModal({
                                      personaName: pair.p2.name,
                                      skillName: donorRecipeModal.skillName,
                                      contextLabel: `合成【${donorModalPersonaObj.name}】的素材面具`
                                    })
                                  }
                                  className="font-semibold text-white hover:text-amber-300"
                                >
                                  {formatText(pair.p2.name, lang)}
                                </button>
                                <span className="text-[11px] text-zinc-400 ml-1">
                                  ({formatText(pair.p2.arcana, lang)} Lv.
                                  {pair.p2.level})
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px]">
                                  {pair.type === 'treasure'
                                    ? formatText('宝魔升降', lang)
                                    : pair.type === 'same_arcana'
                                    ? formatText('同牌降阶', lang)
                                    : pair.type === 'special_2'
                                    ? formatText('二体特殊', lang)
                                    : formatText('一般二体', lang)}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono text-zinc-300">
                                ¥{pair.approxCost.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDonorRecipeModal(null);
                                    onSendToSimulator(pair.p1.name, pair.p2.name);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600/90 hover:bg-red-500 text-white text-[11px] font-semibold"
                                >
                                  <Play className="w-3 h-3" />
                                  {formatText('模拟', lang)}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

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
