import React, { useState } from 'react';
import { formatText } from '../utils/i18n';
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  ExternalLink,
  AlertTriangle,
  Flame,
  Zap,
  ShieldAlert
} from 'lucide-react';

export const AlarmTipsGuide: React.FC<{
  lang: 'tc' | 'sc';
}> = ({ lang }) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const renderTipsContent = () => (
    <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
      {/* Row 1: Critical Pitfalls */}
      <div className="bg-red-950/35 border border-red-500/40 rounded-xl p-3.5 space-y-2">
        <div className="font-extrabold text-red-300 flex items-center gap-1.5 text-sm">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          {formatText('合成面具与强化前必看四大避坑守则', lang)}
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
          <li className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-2.5">
            <span className="font-bold text-amber-300">
              {formatText('1. 务必最优先搞定「特性」：', lang)}
            </span>
            {formatText(
              '特性只能透过「合体（断头台）」继承，无法靠绞刑或技能卡后天变更！开始灌经验与强化五维 99 之前，一定要先确认目标面具已合成并继承好想要的特性。',
              lang
            )}
          </li>
          <li className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-2.5">
            <span className="font-bold text-amber-300">
              {formatText('2. 继承属性限制 vs 技能卡破限：', lang)}
            </span>
            {formatText(
              '合体与绞刑皆受面具「继承属性」限制（如咒怨系亚森无法靠合体/绞刑学枪击系「至高魔弹」），但「技能卡」无视继承限制，任何面具都能直接吃卡学会！',
              lang
            )}
          </li>
          <li className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-2.5">
            <span className="font-bold text-amber-300">
              {formatText('3. 无技能卡的技能需靠绞刑或合成继承：', lang)}
            </span>
            {formatText(
              '全体特大魔法、万能系被动，以及常用的「念动强化」、「咒怨强化」皆无电椅技能卡（「火焰强化」仅第三学期交涉奇美拉取得），需透过绞刑强化或断头台合成继承。',
              lang
            )}
          </li>
          <li className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-2.5">
            <span className="font-bold text-amber-300">
              {formatText('4. 网络公开处刑（9/19 开放）刷神技：', lang)}
            </span>
            {formatText(
              '「万能强化」、「高级万能强化」、「魔导才能」、「胜利咆哮」等可在公开处刑寻宝；若预览清单没有想要的技能，按 L1 / R1 切换即可刷新清单！',
              lang
            )}
          </li>
        </ul>
      </div>

      {/* Row 2: Three Facilities in Fusion Alarm & 99 Stats SOP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left: Alarm Facilities */}
        <div className="lg:col-span-7 bg-zinc-950/90 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
          <div className="font-extrabold text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm">
              <Flame className="w-4 h-4 text-amber-400" />
              {formatText('合体警报（约 6/21 开放）三大设施变化与事故机制', lang)}
            </span>
            <span className="text-[11px] font-normal text-zinc-400">
              {formatText('※ 同设施执行第 2 次高机率事故并解除警报', lang)}
            </span>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80">
              <span className="font-bold text-yellow-300">
                {formatText('● 断头台（合体）— 产出「黄字面具」：', lang)}
              </span>
              {formatText(
                '警报中合出的面具名字为黄色，且有 1～3 个技能可变异为上位技能。若拿「黄字面具」继续合体，必定触发断头台事故，随机变成其他面具并将全技能替换为特殊套组。',
                lang
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80">
              <span className="font-bold text-red-300">
                {formatText('● 绞刑（约 7/26 或 8/1 开放）— 传授 2 技 & 突破每日限制：', lang)}
              </span>
              {formatText(
                '警报中绞刑经验大增、有机会一次继承 2 个技能，且不受「一天同一只面具只能强化一次」限制（但进警报前若已强化过则无法再强化）。',
                lang
              )}
              <div className="mt-1 text-emerald-300 font-semibold">
                {formatText(
                  '★ 核心机制：将「黄字面具」作为绞刑献祭素材，100% 触发绞刑事故（不加经验与技能，但主力面具随机五维直接 +10 点！白字事故则 +5 点）。',
                  lang
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80">
              <span className="font-bold text-purple-300">
                {formatText('● 电椅（道具化）— 升级高阶技能卡/装备：', lang)}
              </span>
              {formatText(
                '可获得高阶装备与技能卡（例如一般电椅出「XX强化」的面具，警报电椅会升级为「高级XX强化」）。若发生事故则会随机变成熏香等道具。',
                lang
              )}
            </div>
          </div>
        </div>

        {/* Right: 5-Step SOP */}
        <div className="lg:col-span-5 bg-zinc-950/90 border border-amber-500/30 rounded-xl p-3.5 flex flex-col justify-between space-y-2.5">
          <div className="space-y-2">
            <div className="font-extrabold text-white flex items-center gap-1.5 text-sm">
              <Zap className="w-4 h-4 text-amber-400" />
              {formatText('合成面具实战标准 SOP（传技 + 刷五维 99 循环）', lang)}
            </div>
            <ol className="space-y-1.5 text-zinc-300 list-decimal list-inside">
              <li>
                <span className="font-semibold text-white">
                  {formatText('事前准备：', lang)}
                </span>
                {formatText(
                  '进警报前，身上先带好 1 只「持有想传授技能」的白字素材面具。',
                  lang
                )}
              </li>
              <li>
                <span className="font-semibold text-white">
                  {formatText('撞怪触发警报：', lang)}
                </span>
                {formatText(
                  '在印象空间撞怪触发合体警报，顺便多抓 2 只野生杂鱼面具后进天鹅绒房间。',
                  lang
                )}
              </li>
              <li>
                <span className="font-semibold text-amber-300">
                  {formatText('步骤① 白字绞刑（传技＋升等）：', lang)}
                </span>
                {formatText(
                  '先用绞刑把「带技能的白字面具」喂给主力面具，赚取大量经验并继承目标技能。',
                  lang
                )}
              </li>
              <li>
                <span className="font-semibold text-yellow-300">
                  {formatText('步骤② 杂鱼合成黄字面具：', lang)}
                </span>
                {formatText(
                  '拿刚抓的 2 只杂鱼面具随便二体合体，合成出 1 只「黄字面具」。',
                  lang
                )}
              </li>
              <li>
                <span className="font-semibold text-emerald-300">
                  {formatText('步骤③ 黄字绞刑事故（五维 +10）：', lang)}
                </span>
                {formatText(
                  '再次执行绞刑，把「黄字面具」喂给主力面具，必出事故使五维 +10 并解除警报！出房继续撞怪即可无限循环。',
                  lang
                )}
              </li>
            </ol>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              {formatText('整理自巴哈姆特哈啦板（作者：剑宇 zafa）', lang)}
            </span>
            <a
              href="https://forum.gamer.com.tw/C.php?bsn=583&snA=7150"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:underline inline-flex items-center gap-1 font-semibold"
            >
              {formatText('阅读巴哈原文', lang)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Collapsible Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-red-950/30 border border-amber-500/40 rounded-xl overflow-hidden shadow-md">
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex items-center gap-2 text-left group"
          >
            <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Lightbulb className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-amber-300 group-hover:text-amber-200 transition">
              {formatText(
                '【实战 Tips】天鹅绒房间合体警报、合成面具与强化五维 99 指南',
                lang
              )}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              {expanded
                ? formatText('点击收合', lang)
                : formatText('点击展开阅读', lang)}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold transition"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              {formatText('弹出视窗检视', lang)}
            </button>
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="p-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300"
              aria-label="Toggle Tips"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="p-4 pt-2 border-t border-zinc-800/80 bg-zinc-900/95">
            {renderTipsContent()}
          </div>
        )}
      </div>

      {/* Popup Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/50 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">
                  {formatText(
                    '天鹅绒房间合体警报、合成面具与强化五维 99 心得精炼',
                    lang
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">{renderTipsContent()}</div>
          </div>
        </div>
      )}
    </>
  );
};
