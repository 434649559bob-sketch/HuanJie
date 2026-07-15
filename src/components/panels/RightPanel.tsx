import { useState, type ReactNode } from 'react';
import ContactsPanel from './ContactsPanel';
import ForgePanel from './ForgePanel';
import WorldPanel from './WorldPanel';
import QuestPanel from './QuestPanel';
import DungeonPanel from './DungeonPanel';
import SettingsPanel from './SettingsPanel';
import type { EquipmentItem, EquipmentSet, Gem, InventoryItem, EquipmentSlot, Quest } from '../../App';
import './RightPanel.css';

type FuncCategory = 'game' | 'real';

interface FuncDef { id: string; label: string; category: FuncCategory; icon: ReactNode; }

const FUNCTIONS: FuncDef[] = [
  { id: 'world', label: '世界', category: 'game', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
  { id: 'characters', label: '角色', category: 'game', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 'quests', label: '任务', category: 'game', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { id: 'dungeons', label: '副本', category: 'game', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
  { id: 'forge', label: '锻造', category: 'game', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  { id: 'save', label: '存档', category: 'real', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg> },
  { id: 'settings', label: '设置', category: 'real', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

const PLACEHOLDER_CONTENT: Record<string, string> = {
  save: '存档 — 保存与加载游戏进度',
  settings: '设置 — API 配置、颜色主题、偏好选项',
};

interface RightPanelProps {
  isInGame: boolean;
  playerMoney: number;
  equipment: EquipmentSet;
  ownedEquipment: EquipmentItem[];
  onEnhance: (item: EquipmentItem) => { success: boolean; newLevel: number; cost: number };
  onMoneyChange: (delta: number) => void;
  ownedGems: Gem[];
  onSocketGem: (item: EquipmentItem, gem: Gem, socketIndex: number) => void;
  onRemoveGem: (item: EquipmentItem, socketIndex: number) => void;
  inventory: InventoryItem[];
  onCraft: (slot: EquipmentSlot, materials: InventoryItem[]) => EquipmentItem;
  quests: Quest[];
}

export default function RightPanel({ isInGame: _isInGame, playerMoney, equipment, ownedEquipment, onEnhance, onMoneyChange, ownedGems, onSocketGem, onRemoveGem, inventory, onCraft, quests }: RightPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [activeFunc, setActiveFunc] = useState<string | null>(null);
  const activeDef = FUNCTIONS.find(f => f.id === activeFunc);

  return (
    <>
      <aside className={`right-panel${collapsed ? ' right-panel--collapsed' : ''}`}>
        <button className="right-panel__toggle" onClick={() => setCollapsed(prev => !prev)} aria-label={collapsed ? '展开右侧面板' : '收起右侧面板'}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d={collapsed ? 'M10 4L6 8L10 12' : 'M6 4L10 8L6 12'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="right-panel__inner">
          {FUNCTIONS.map(f => {
            const isActive = activeFunc === f.id;
            return (
              <button key={f.id} className={`rp-slot${isActive ? ' rp-slot--active' : ''}`} onClick={() => setActiveFunc(prev => prev === f.id ? null : f.id)}>
                <span className="rp-slot-icon">{f.icon}</span>
                <span className="rp-slot-label">{f.label}</span>
              </button>
            );
          })}
        </div>
      </aside>
      <div className={`rp-overlay${activeFunc ? ' rp-overlay--open' : ''}`}>
        {activeDef && (
          <div className="rp-overlay-inner">
            <div className="rp-overlay-header">
              <span className="rp-overlay-icon">{activeDef.icon}</span>
              <span className="rp-overlay-title">{activeDef.label}</span>
              <button className="rp-overlay-close" onClick={() => setActiveFunc(null)} aria-label="关闭"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="rp-overlay-body">
              {activeFunc === 'world' ? <WorldPanel />
              : activeFunc === 'dungeons' ? <DungeonPanel />
              : activeFunc === 'quests' ? <QuestPanel quests={quests} />
              : activeFunc === 'characters' ? <ContactsPanel />
              : activeFunc === 'forge' ? <ForgePanel playerMoney={playerMoney} equipment={equipment} ownedEquipment={ownedEquipment} onEnhance={onEnhance} onMoneyChange={onMoneyChange} ownedGems={ownedGems} onSocketGem={onSocketGem} onRemoveGem={onRemoveGem} inventory={inventory} onCraft={onCraft} />
              : activeFunc === 'settings' ? <SettingsPanel />
              : (<div className="rp-placeholder"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg><p>{PLACEHOLDER_CONTENT[activeDef.id]}</p></div>)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
