import React, { useState } from 'react';
import { BuildRoutePlanner } from './components/BuildRoutePlanner';
import {
  FusionSimulator,
  SimulatorInitialState
} from './components/FusionSimulator';
import { ForwardReverseLookup } from './components/ForwardReverseLookup';
import { DatabaseBrowser } from './components/DatabaseBrowser';
import { DlcModal, ALL_DLC_NAMES } from './components/DlcModal';
import { formatText } from './utils/i18n';
import {
  Route,
  Layers,
  Compass,
  BookOpen,
  Settings,
  Languages,
  Flame
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'planner' | 'simulator' | 'lookup' | 'database'
  >('planner');
  const [lang, setLang] = useState<'tc' | 'sc'>('tc');
  const [dlcModalOpen, setDlcModalOpen] = useState<boolean>(false);

  const [enabledDlc, setEnabledDlc] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('p5r_enabled_dlc');
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      // ignore
    }
    return new Set(ALL_DLC_NAMES);
  });

  const [simInit, setSimInit] = useState<SimulatorInitialState | null>(null);

  const handleUpdateDlc = (next: Set<string>) => {
    setEnabledDlc(next);
    try {
      localStorage.setItem('p5r_enabled_dlc', JSON.stringify([...next]));
    } catch {
      // ignore
    }
  };

  const handleSendToSimulator = (
    p1Name: string,
    p2Name: string,
    p1Skills?: string[],
    p2Skills?: string[],
    carriedTrait?: string
  ) => {
    setSimInit({
      p1Name,
      p2Name,
      p1Skills,
      p2Skills,
      carriedTrait,
      timestamp: Date.now()
    });
    setActiveTab('simulator');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0e] text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-red-600/40 bg-zinc-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30 -rotate-3">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>PERSONA 5 ROYAL</span>
                <span className="text-xs px-2 py-0.5 rounded bg-red-600/20 border border-red-500/40 text-red-400 font-bold">
                  {formatText('天鹅绒房间合成工具', lang)}
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                {formatText(
                  '特性与 8 技能配招路线规划 · 二体相互继承模拟器 · 正逆向合成公式查询',
                  lang
                )}
              </p>
            </div>
          </div>

          {/* Right Controls: DLC & Language Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDlcModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-semibold transition"
            >
              <Settings className="w-3.5 h-3.5 text-purple-400" />
              {formatText(
                `DLC 设定 (${enabledDlc.size}/${ALL_DLC_NAMES.length})`,
                lang
              )}
            </button>

            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'tc' ? 'sc' : 'tc'))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold transition"
            >
              <Languages className="w-3.5 h-3.5 text-red-400" />
              {lang === 'tc' ? '繁體中文 / 切至簡體' : '简体中文 / 切至繁體'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto gap-1 pb-2">
          {[
            {
              id: 'planner',
              label: '配招与合成路线规划',
              icon: Route
            },
            {
              id: 'simulator',
              label: '二体合成与 8 技能继承模拟',
              icon: Layers
            },
            {
              id: 'lookup',
              label: '正逆向合成公式查询',
              icon: Compass
            },
            {
              id: 'database',
              label: '面具图鉴 / 技能 / 特性 / 范式表',
              icon: BookOpen
            }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  active
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {formatText(tab.label, lang)}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'planner' && (
          <BuildRoutePlanner
            lang={lang}
            enabledDlc={enabledDlc}
            onSendToSimulator={handleSendToSimulator}
          />
        )}

        {activeTab === 'simulator' && (
          <FusionSimulator
            lang={lang}
            enabledDlc={enabledDlc}
            initialState={simInit}
          />
        )}

        {activeTab === 'lookup' && (
          <ForwardReverseLookup
            lang={lang}
            enabledDlc={enabledDlc}
            onSendToSimulator={(p1, p2) => handleSendToSimulator(p1, p2)}
          />
        )}

        {activeTab === 'database' && <DatabaseBrowser lang={lang} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-4 text-center text-xs text-zinc-500">
        {formatText(
          'Persona 5 Royal 人格面具合成与配招规划工具 · 资料来源：Bilibili 女神转生 Wiki (P5R 图鉴/技能/特性/合成范式)',
          lang
        )}
      </footer>

      <DlcModal
        open={dlcModalOpen}
        onClose={() => setDlcModalOpen(false)}
        enabledDlc={enabledDlc}
        onChangeDlc={handleUpdateDlc}
        lang={lang}
      />
    </div>
  );
};

export default App;
