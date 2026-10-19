import React from 'react';
import { Persona, SkillElement } from '../types/p5r';
import { formatText } from '../utils/i18n';
import { AffinityBadge, ElementBadge } from './ElementBadge';
import { skillMap } from '../utils/fusionEngine';
import { Shield, Zap, Sparkles, Plus } from 'lucide-react';

const AFFINITY_KEYS: Array<{ key: keyof Persona['affinities']; label: string }> = [
  { key: 'phys', label: '物' },
  { key: 'gun', label: '枪' },
  { key: 'fire', label: '火' },
  { key: 'ice', label: '冰' },
  { key: 'elec', label: '电' },
  { key: 'wind', label: '风' },
  { key: 'psy', label: '念' },
  { key: 'nuke', label: '核' },
  { key: 'bless', label: '祝' },
  { key: 'curse', label: '咒' }
];

const INHERIT_ELEMENTS: SkillElement[] = [
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
  '恢复'
];

export const PersonaDetailCard: React.FC<{
  persona: Persona;
  lang: 'tc' | 'sc';
  onAddSkill?: (skillName: string) => void;
  selectedSkills?: string[];
  compact?: boolean;
}> = ({ persona, lang, onAddSkill, selectedSkills = [], compact = false }) => {
  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-lg">
      {/* Top header */}
      <div className="flex items-start gap-3.5">
        {persona.avatar ? (
          <img
            src={persona.avatar}
            alt={persona.name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-lg object-cover bg-zinc-950 border border-red-600/50 shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-zinc-950 border border-red-600/50 flex items-center justify-center text-red-500 font-bold text-lg shrink-0">
            {formatText(persona.arcana.slice(0, 2), lang)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-600 text-white">
              Lv.{persona.level}
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
              {formatText(persona.arcana, lang)}
            </span>
            <span className="px-2 py-0.5 text-xs rounded bg-amber-950/60 text-amber-300 border border-amber-700/40">
              {formatText(`继承类型：${persona.inheritType || '万能'}`, lang)}
            </span>
            {persona.isDlc && (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-purple-600/30 text-purple-200 border border-purple-500/50">
                DLC
              </span>
            )}
            {persona.isSpecial && (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-600/30 text-rose-200 border border-rose-500/50">
                {formatText('特殊合成', lang)}
              </span>
            )}
            {persona.isTreasure && (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-yellow-500/30 text-yellow-200 border border-yellow-400/50">
                {formatText('宝魔', lang)}
              </span>
            )}
          </div>
          <h3 className="text-lg font-extrabold text-white mt-1 truncate">
            {formatText(persona.name, lang)}{' '}
            <span className="text-xs font-normal text-zinc-400">
              {persona.enName} / {persona.jpName}
            </span>
          </h3>
          <div className="mt-1 text-xs text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-amber-300">
              {formatText(persona.trait, lang)}：
            </span>
            <span className="text-zinc-400 truncate">
              {formatText(persona.traitDesc, lang)}
            </span>
          </div>
        </div>
      </div>

      {/* Affinities row */}
      <div className="mt-3 pt-3 border-t border-zinc-800/80">
        <div className="text-[11px] text-zinc-400 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1 font-medium">
            <Shield className="w-3.5 h-3.5 text-red-400" />
            {formatText('属性抗性（物/枪/火/冰/电/风/念/核/祝/咒）', lang)}
          </span>
          <span className="text-zinc-400">
            {formatText(
              `五维：力${persona.stats.st} 魔${persona.stats.ma} 耐${persona.stats.en} 速${persona.stats.ag} 运${persona.stats.lu}`,
              lang
            )}
          </span>
        </div>
        <div className="grid grid-cols-10 gap-1 text-center">
          {AFFINITY_KEYS.map((item) => (
            <div
              key={item.key}
              className="flex flex-col items-center bg-zinc-950/70 rounded py-1 border border-zinc-800/60"
            >
              <span className="text-[10px] text-zinc-400 mb-0.5">
                {formatText(item.label, lang)}
              </span>
              <AffinityBadge val={persona.affinities[item.key]} lang={lang} />
            </div>
          ))}
        </div>
      </div>

      {/* Inheritance permissions */}
      {!compact && (
        <div className="mt-3 pt-3 border-t border-zinc-800/80">
          <div className="text-[11px] text-zinc-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {formatText('可继承技能属性（万能/辅助/被动皆可继承）', lang)}
            </span>
            {persona.itemization.normal && (
              <span className="text-[11px] text-zinc-400">
                {formatText(
                  `电椅：${persona.itemization.normal}（警报：${persona.itemization.alarm}）`,
                  lang
                )}
              </span>
            )}
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 text-center">
            {INHERIT_ELEMENTS.map((el) => {
              const ok = persona.inheritance[el];
              return (
                <div
                  key={el}
                  className={`rounded py-1 text-[11px] border ${
                    ok
                      ? 'bg-emerald-950/30 border-emerald-700/40 text-emerald-300'
                      : 'bg-red-950/30 border-red-800/40 text-red-400 opacity-60'
                  }`}
                >
                  <div>{formatText(el.slice(0, 1), lang)}</div>
                  <div className="font-bold">{ok ? '○' : '×'}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Innate & Level-up Skills */}
      <div className="mt-3 pt-3 border-t border-zinc-800/80">
        <div className="text-[11px] text-zinc-400 mb-1.5 font-medium">
          {formatText('自身习得技能（点击可加入配招）', lang)}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {persona.skills.map((s, idx) => {
            const skObj = skillMap.get(s.name);
            const isSelected = selectedSkills.includes(s.name);
            return (
              <button
                key={`${s.name}-${idx}`}
                type="button"
                onClick={() => onAddSkill && onAddSkill(s.name)}
                disabled={!onAddSkill || isSelected}
                title={skObj ? formatText(skObj.desc, lang) : ''}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border transition ${
                  isSelected
                    ? 'bg-red-950/60 border-red-500/60 text-red-200 cursor-default'
                    : onAddSkill
                    ? 'bg-zinc-950 hover:bg-zinc-800 border-zinc-700 text-zinc-200 cursor-pointer'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 cursor-default'
                }`}
              >
                {skObj && <ElementBadge element={skObj.element} lang={lang} />}
                <span className="font-medium">{formatText(s.name, lang)}</span>
                <span className="text-[10px] text-zinc-400">
                  ({s.level === 0 ? formatText('自带', lang) : `Lv.${s.level}`})
                </span>
                {onAddSkill && !isSelected && (
                  <Plus className="w-3 h-3 text-zinc-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
