import { useState, useRef, useEffect } from 'react';
import type { PlayerState, EquipmentSet, EquipmentItem, FashionSet, FashionItem, EquipmentSlot, InventoryItem } from '../../App';
import { getProficiencyTier, QUALITY_LABELS, QUALITY_COLORS } from '../../App';
import { SLOT_LABELS } from '../../App';
import { useToast } from '../ui/ToastProvider';
import './PlayerDetailModal.css';

// ── Props ──
interface PlayerDetailModalProps {
  open: boolean;
  onClose: () => void;
  player: PlayerState;
  equipment: EquipmentSet;
  ownedEquipment: EquipmentItem[];
  fashion: FashionSet;
  ownedFashion: FashionItem[];
  fashionNudeSlots: EquipmentSlot[];
  appearanceSummary: string;
  onEquipItem: (item: EquipmentItem, oldItem?: EquipmentItem) => void;
  onUnequipItem: (item: EquipmentItem) => void;
  onDiscardItem: (item: EquipmentItem) => void;
  onEquipFashion: (item: FashionItem, oldItem?: FashionItem) => void;
  onUnequipFashion: (item: FashionItem) => void;
  onDiscardFashion: (item: FashionItem) => void;
  onFashionSave: (nudeSlots: EquipmentSlot[]) => void;
  onRealAvatarChange: (url: string) => void;
  onGameAvatarChange: (url: string) => void;
  inventory: InventoryItem[];
  onUseItem: (item: InventoryItem) => void;
  onDiscardInventoryItem: (item: InventoryItem, count?: number) => void;
}

// ── Constants ──
type DetailTab = 'equipment' | 'fashion' | 'inventory' | 'power';

const TABS: { key: DetailTab; label: string }[] = [
  { key: 'equipment', label: '装备' },
  { key: 'fashion', label: '时装' },
  { key: 'inventory', label: '背包' },
  { key: 'power', label: '力量体系' },
];

const ALL_SLOTS: EquipmentSlot[] = ['weapon', 'helmet', 'armor', 'gloves', 'pants', 'shoes', 'accessory1', 'accessory2'];

// 品质常量从 App.tsx 统一导入（QUALITY_LABELS, QUALITY_COLORS）
function qLabel(q: string) { return (QUALITY_LABELS as Record<string,string>)[q] || q; }
function qColor(q: string) { return (QUALITY_COLORS as Record<string,string>)[q] || '#9ca3af'; }

// ── Helpers ──
function groupBySlot<T extends { slot: EquipmentSlot }>(items: T[]): Map<EquipmentSlot, T[]> {
  const map = new Map<EquipmentSlot, T[]>();
  for (const slot of ALL_SLOTS) map.set(slot, []);
  for (const item of items) map.get(item.slot)!.push(item);
  return map;
}

// ── Main Component ──
export default function PlayerDetailModal(props: PlayerDetailModalProps) {
  const {
    open, onClose, player,
    equipment, ownedEquipment,
    fashion, ownedFashion,
    fashionNudeSlots, appearanceSummary,
    onEquipItem, onUnequipItem, onDiscardItem,
    onEquipFashion, onUnequipFashion, onDiscardFashion,
    onFashionSave, onRealAvatarChange, onGameAvatarChange,
    inventory, onUseItem, onDiscardInventoryItem,
  } = props;

  const [tab, setTab] = useState<DetailTab>('equipment');
  const [selectedEquip, setSelectedEquip] = useState<EquipmentItem | null>(null);
  const [selectedOwned, setSelectedOwned] = useState<EquipmentItem | null>(null);
  const [selectedFashion, setSelectedFashion] = useState<FashionItem | null>(null);
  const [selectedOwnedFashion, setSelectedOwnedFashion] = useState<FashionItem | null>(null);
  const [localNudeSlots, setLocalNudeSlots] = useState<EquipmentSlot[]>(fashionNudeSlots);
  const [equippingSlot, setEquippingSlot] = useState<EquipmentSlot | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState<EquipmentItem | null>(null);
  const [confirmDiscardFashion, setConfirmDiscardFashion] = useState<FashionItem | null>(null);
  const { addToast } = useToast();

  // Refs for auto-scroll
  const ownedDetailRef = useRef<HTMLDivElement>(null);
  const ownedFashionDetailRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to owned detail card when opened
  useEffect(() => {
    if (selectedOwned && ownedDetailRef.current) {
      ownedDetailRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedOwned]);

  useEffect(() => {
    if (selectedOwnedFashion && ownedFashionDetailRef.current) {
      ownedFashionDetailRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedOwnedFashion]);

  if (!open) return null;

  const handleDiscard = (item: EquipmentItem) => {
    onDiscardItem(item);
    setSelectedOwned(null);
    setConfirmDiscard(null);
    addToast(`已丢弃 ${item.name}`, 'info');
  };

  const handleDiscardFashionLocal = (item: FashionItem) => {
    onDiscardFashion(item);
    setSelectedOwnedFashion(null);
    setConfirmDiscardFashion(null);
    addToast(`已丢弃 ${item.name}`, 'info');
  };

  const ownedGroup = groupBySlot(ownedEquipment);
  const ownedFashionGroup = groupBySlot(ownedFashion);

  // Equip from owned detail
  const handleEquip = (item: EquipmentItem) => {
    const old = equipment[item.slot];
    onEquipItem(item, old);
    setEquippingSlot(item.slot);
    setTimeout(() => setEquippingSlot(null), 600);
    setSelectedOwned(null);
    if (old && selectedEquip?.id === old.id) setSelectedEquip(null);
    addToast(old ? `已装备 ${item.name}，${old.name} 已卸下` : `已装备 ${item.name}`, 'success');
  };

  // Unequip from slot detail — pass the item, not the slot
  const handleUnequip = (item: EquipmentItem) => {
    onUnequipItem(item);
    setSelectedEquip(null);
    addToast(`已卸下 ${item.name}`, 'info');
  };

  const handleFashionEquip = (item: FashionItem) => {
    const old = fashion[item.slot];
    onEquipFashion(item, old);
    setEquippingSlot(item.slot);
    setTimeout(() => setEquippingSlot(null), 600);
    setSelectedOwnedFashion(null);
    if (old && selectedFashion?.id === old.id) setSelectedFashion(null);
    addToast(old ? `已穿戴 ${item.name}，${old.name} 已换下` : `已穿戴 ${item.name}`, 'success');
  };

  const handleFashionUnequip = (item: FashionItem) => {
    onUnequipFashion(item);
    setSelectedFashion(null);
    addToast(`已卸下 ${item.name}`, 'info');
  };

  const clearAllSelections = () => {
    setSelectedEquip(null); setSelectedOwned(null);
    setSelectedFashion(null); setSelectedOwnedFashion(null);
  };

  const handleFashionSaveLocal = () => {
    onFashionSave(localNudeSlots);
    addToast('外观已保存，将影响正文描写', 'success');
  };

  const handleAvatarUpload = (target: 'real' | 'game') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        if (target === 'real') onRealAvatarChange(url);
        else onGameAvatarChange(url);
        addToast(target === 'real' ? '现实头像已更新' : '游戏头像已更新', 'success');
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const toggleNude = (slot: EquipmentSlot) => {
    setLocalNudeSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);
  };

  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="dm-header">
          <div className="dm-header-left">
            <div className="dm-avatars">
              {/* Game avatar */}
              <button className="dm-avatar-upload" onClick={() => handleAvatarUpload('game')} title="上传游戏头像">
                {player.gameAvatarUrl ? <img src={player.gameAvatarUrl} alt="游戏头像" />
                  : <div className="dm-avatar-upload-placeholder"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>}
                <span className="dm-avatar-label">游戏</span>
              </button>
              {/* Real avatar */}
              <button className="dm-avatar-upload" onClick={() => handleAvatarUpload('real')} title="上传现实头像">
                {player.realAvatarUrl ? <img src={player.realAvatarUrl} alt="现实头像" />
                  : <div className="dm-avatar-upload-placeholder"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>}
                <span className="dm-avatar-label">现实</span>
              </button>
            </div>
            <div className="dm-player-info">
              <span className="dm-game-name">{player.gameName}</span>
              <span className="dm-real-name">{player.realName}</span>
              <span className="dm-meta">{player.gameClass} · Lv.{player.level} · 战力 {player.powerLevel.toLocaleString()}</span>
            </div>
          </div>
          <button className="dm-close" onClick={onClose} aria-label="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* ── Tabs ── */}
        <nav className="dm-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`dm-tab${tab === t.key ? ' dm-tab--active' : ''}`}
              onClick={() => { setTab(t.key); clearAllSelections(); }}>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="dm-content">

          {/* ═══════════════ EQUIPMENT TAB ═══════════════ */}
          {tab === 'equipment' && (
            <div className="dm-equip">
              {/* Slot Grid */}
              <div className="dm-section-label">装备中</div>
              <div className="dm-equip-slots">
                {ALL_SLOTS.map(slot => {
                  const item = equipment[slot];
                  const isSelected = selectedEquip?.id === item?.id;
                  const isEquipping = equippingSlot === slot;
                  return (
                    <div key={slot}
                      className={`dm-equip-slot${item ? ' dm-equip-slot--filled' : ''}${isSelected ? ' dm-equip-slot--selected' : ''}${isEquipping ? ' dm-equip-slot--equipping' : ''}`}
                      onClick={() => item && setSelectedEquip(prev => prev?.id === item.id ? null : item)}>
                      <span className="dm-slot-label">{SLOT_LABELS[slot]}</span>
                      {item ? (
                        <div className="dm-slot-item">
                          <span className="dm-slot-name" style={{ color: qColor(item.quality) }}>{item.name}</span>
                          <span className="dm-slot-power font-mono">
                            {item.basePower + item.enhanceBonus + item.gemBonus}
                            {item.enhanceLevel > 0 && <span className="dm-slot-plus">+{item.enhanceLevel}</span>}
                          </span>
                        </div>
                      ) : <span className="dm-slot-empty">空</span>}
                    </div>
                  );
                })}
              </div>

              {/* Detail Card */}
              {selectedEquip && (
                <div className="dm-equip-detail">
                  <div className="dm-equip-detail-header">
                    <span className="dm-equip-name" style={{ color: qColor(selectedEquip.quality) }}>{selectedEquip.name}</span>
                    <button className="dm-equip-close-detail" onClick={() => setSelectedEquip(null)} aria-label="关闭详情">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div className="dm-equip-detail-body">
                    <div className="dm-equip-quality" style={{ color: qColor(selectedEquip.quality) }}>{qLabel(selectedEquip.quality)}</div>
                    <div className="dm-equip-power-row font-mono">
                      装等 {selectedEquip.basePower + selectedEquip.enhanceBonus + selectedEquip.gemBonus}
                      {selectedEquip.enhanceLevel > 0 && <span className="dm-slot-plus">+{selectedEquip.enhanceLevel}</span>}
                      <span className="dm-equip-enhance-detail">（基础 {selectedEquip.basePower} + 强化 {selectedEquip.enhanceBonus} + 镶嵌 {selectedEquip.gemBonus}）</span>
                    </div>
                    <div className="dm-equip-desc">{selectedEquip.sourceDetail}</div>
                    {selectedEquip.extraEffect && (
                      <div className="dm-equip-effect"><span className="dm-effect-label">附加效果</span>{selectedEquip.extraEffect}</div>
                    )}
                    {selectedEquip.socketedGems.length > 0 && (
                      <div className="dm-equip-effect">
                        <span className="dm-effect-label">镶嵌宝石</span>
                        {selectedEquip.socketedGems.map((g, i) => <span key={i}>{g.name}（+{g.powerBonus}·{g.effect}）</span>)}
                      </div>
                    )}
                    <button className="dm-unequip-btn" onClick={() => handleUnequip(selectedEquip)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg>卸下
                    </button>
                  </div>
                </div>
              )}

              {/* Owned Item Detail */}
              {selectedOwned && (
                <div className="dm-equip-detail" ref={ownedDetailRef}>
                  <div className="dm-equip-detail-header">
                    <span className="dm-equip-name" style={{ color: qColor(selectedOwned.quality) }}>{selectedOwned.name}</span>
                    <button className="dm-equip-close-detail" onClick={() => { setSelectedOwned(null); setConfirmDiscard(null); }} aria-label="关闭详情">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div className="dm-equip-detail-body">
                    <div className="dm-equip-quality" style={{ color: qColor(selectedOwned.quality) }}>{qLabel(selectedOwned.quality)}</div>
                    <div className="dm-equip-power-row font-mono">
                      装等 {selectedOwned.basePower + selectedOwned.enhanceBonus + selectedOwned.gemBonus}
                      <span className="dm-equip-enhance-detail">（基础 {selectedOwned.basePower} + 强化 {selectedOwned.enhanceBonus} + 镶嵌 {selectedOwned.gemBonus}）</span>
                    </div>
                    <div className="dm-equip-desc">{selectedOwned.sourceDetail}</div>
                    {selectedOwned.extraEffect && (
                      <div className="dm-equip-effect"><span className="dm-effect-label">附加效果</span>{selectedOwned.extraEffect}</div>
                    )}
                    <div className="dm-equip-actions">
                      <button className="dm-equip-btn" onClick={() => handleEquip(selectedOwned)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9,18 15,12 9,6"/></svg>装备
                      </button>
                      {confirmDiscard?.id === selectedOwned.id ? (
                        <div className="dm-discard-confirm">
                          <span>确定丢弃？</span>
                          <button className="dm-discard-yes" onClick={() => handleDiscard(selectedOwned)}>丢弃</button>
                          <button className="dm-discard-no" onClick={() => setConfirmDiscard(null)}>取消</button>
                        </div>
                      ) : (
                        <button className="dm-discard-btn" onClick={() => setConfirmDiscard(selectedOwned)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>丢弃
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Owned Equipment */}
              <div className="dm-section-label">装备仓库</div>
              {ownedEquipment.length === 0 ? (
                <div className="dm-owned-empty">装备仓库为空</div>
              ) : (
                <div className="dm-owned-list">
                  {ALL_SLOTS.map(slot => {
                    const items = ownedGroup.get(slot)!;
                    if (items.length === 0) return null;
                    return (
                      <div key={slot} className="dm-owned-group">
                        <div className="dm-owned-group-header">
                          <span>{SLOT_LABELS[slot]}</span>
                          <span className="dm-owned-count">{items.length}件</span>
                        </div>
                        <div className="dm-owned-items">
                          {items.map(item => (
                            <button key={item.id} className="dm-owned-item" onClick={() => setSelectedOwned(prev => prev?.id === item.id ? null : item)}>
                              <span className="dm-owned-item-quality" style={{ background: qColor(item.quality) }} />
                              <div className="dm-owned-item-info">
                                <span className="dm-owned-item-name">{item.name}{item.enhanceLevel > 0 && <span className="dm-slot-plus dm-slot-plus--inline">+{item.enhanceLevel}</span>}</span>
                                <span className="dm-owned-item-stat font-mono">{qLabel(item.quality)} · 装等 {item.basePower + item.enhanceBonus + item.gemBonus}</span>
                              </div>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="dm-owned-item-arrow"><polyline points="9,18 15,12 9,6"/></svg>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ FASHION TAB ═══════════════ */}
          {tab === 'fashion' && (
            <div className="dm-equip">
              <div className="dm-fashion-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>时装不影响战斗力，仅改变外观。未装备时装的部位可选择裸露或显示装备。</span>
              </div>

              {/* Fashion Slot Grid */}
              <div className="dm-section-label">当前时装</div>
              <div className="dm-equip-slots">
                {ALL_SLOTS.map(slot => {
                  const item = fashion[slot];
                  const isNude = localNudeSlots.includes(slot);
                  const hasEquip = !!equipment[slot];
                  const isSelected = selectedFashion?.id === item?.id;
                  const isEquipping = equippingSlot === slot;
                  return (
                    <div key={slot}
                      className={`dm-equip-slot${item ? ' dm-equip-slot--filled' : ''}${!item && isNude ? ' dm-equip-slot--nude' : ''}${!item && !isNude && hasEquip ? ' dm-equip-slot--show-equip' : ''}${isSelected ? ' dm-equip-slot--selected' : ''}${isEquipping ? ' dm-equip-slot--equipping' : ''}`}>
                      <span className="dm-slot-label">{SLOT_LABELS[slot]}</span>
                      {item ? (
                        <div className="dm-slot-item" onClick={() => setSelectedFashion(prev => prev?.id === item.id ? null : item)}>
                          <span className="dm-slot-name" style={{ color: qColor(item.quality) }}>{item.name}</span>
                          <span className="dm-slot-visual">{item.visualEffect}</span>
                        </div>
                      ) : (
                        <div className="dm-slot-nude-choice">
                          <span className={`dm-slot-empty${isNude ? ' dm-slot-empty--nude' : ''}`}>
                            {isNude ? '裸露' : (hasEquip ? '显示装备' : '裸露')}
                          </span>
                          <button className="dm-nude-toggle" onClick={(e) => { e.stopPropagation(); toggleNude(slot); }}>
                            {isNude ? (hasEquip ? '改为显示装备' : '取消裸露') : (hasEquip ? '改为裸露' : '标记裸露')}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Fashion Detail */}
              {selectedFashion && (
                <div className="dm-equip-detail">
                  <div className="dm-equip-detail-header">
                    <span className="dm-equip-name" style={{ color: qColor(selectedFashion.quality) }}>{selectedFashion.name}</span>
                    <button className="dm-equip-close-detail" onClick={() => setSelectedFashion(null)} aria-label="关闭详情">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div className="dm-equip-detail-body">
                    <div className="dm-equip-quality" style={{ color: qColor(selectedFashion.quality) }}>{qLabel(selectedFashion.quality)} 时装</div>
                    <div className="dm-equip-desc">{selectedFashion.description}</div>
                    <div className="dm-equip-effect"><span className="dm-effect-label">视觉表现</span>{selectedFashion.visualEffect}</div>
                    <button className="dm-unequip-btn" onClick={() => handleFashionUnequip(selectedFashion)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg>卸下
                    </button>
                  </div>
                </div>
              )}

              {/* Owned Fashion Detail */}
              {selectedOwnedFashion && (
                <div className="dm-equip-detail" ref={ownedFashionDetailRef}>
                  <div className="dm-equip-detail-header">
                    <span className="dm-equip-name" style={{ color: qColor(selectedOwnedFashion.quality) }}>{selectedOwnedFashion.name}</span>
                    <button className="dm-equip-close-detail" onClick={() => { setSelectedOwnedFashion(null); setConfirmDiscardFashion(null); }} aria-label="关闭详情">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div className="dm-equip-detail-body">
                    <div className="dm-equip-quality" style={{ color: qColor(selectedOwnedFashion.quality) }}>{qLabel(selectedOwnedFashion.quality)} 时装</div>
                    <div className="dm-equip-desc">{selectedOwnedFashion.description}</div>
                    <div className="dm-equip-effect"><span className="dm-effect-label">视觉表现</span>{selectedOwnedFashion.visualEffect}</div>
                    <div className="dm-equip-actions">
                      <button className="dm-equip-btn" onClick={() => handleFashionEquip(selectedOwnedFashion)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9,18 15,12 9,6"/></svg>穿戴
                      </button>
                      {confirmDiscardFashion?.id === selectedOwnedFashion.id ? (
                        <div className="dm-discard-confirm">
                          <span>确定丢弃？</span>
                          <button className="dm-discard-yes" onClick={() => handleDiscardFashionLocal(selectedOwnedFashion)}>丢弃</button>
                          <button className="dm-discard-no" onClick={() => setConfirmDiscardFashion(null)}>取消</button>
                        </div>
                      ) : (
                        <button className="dm-discard-btn" onClick={() => setConfirmDiscardFashion(selectedOwnedFashion)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>丢弃
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Owned Fashion */}
              <div className="dm-section-label">时装仓库</div>
              {ownedFashion.length === 0 ? (
                <div className="dm-owned-empty">时装仓库为空</div>
              ) : (
                <div className="dm-owned-list">
                  {ALL_SLOTS.map(slot => {
                    const items = ownedFashionGroup.get(slot)!;
                    if (items.length === 0) return null;
                    return (
                      <div key={slot} className="dm-owned-group">
                        <div className="dm-owned-group-header">
                          <span>{SLOT_LABELS[slot]}</span>
                          <span className="dm-owned-count">{items.length}件</span>
                        </div>
                        <div className="dm-owned-items">
                          {items.map(item => (
                            <button key={item.id} className="dm-owned-item" onClick={() => setSelectedOwnedFashion(prev => prev?.id === item.id ? null : item)}>
                              <span className="dm-owned-item-quality" style={{ background: qColor(item.quality) }} />
                              <div className="dm-owned-item-info">
                                <span className="dm-owned-item-name">{item.name}</span>
                                <span className="dm-owned-item-stat">{qLabel(item.quality)} · {item.visualEffect.slice(0, 20)}…</span>
                              </div>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="dm-owned-item-arrow"><polyline points="9,18 15,12 9,6"/></svg>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Appearance + Save */}
              <div className="dm-appearance">
                <div className="dm-appearance-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>外观总结（将影响正文描写）</span>
                </div>
                <p className="dm-appearance-text">{appearanceSummary}</p>
                <button className="dm-fashion-save-btn" onClick={handleFashionSaveLocal}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>
                  <span>保存外观</span>
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════ INVENTORY TAB ═══════════════ */}
          {tab === 'inventory' && (
            <InventoryTab
              inventory={inventory}
              onUseItem={onUseItem}
              onDiscardItem={onDiscardInventoryItem}
              addToast={addToast}
            />
          )}

          {tab === 'power' && (
            <div className="dm-power">
              {/* Level + XP */}
              <div className="dm-power-level">
                <div className="dm-power-level-top">
                  <span className="dm-power-lv font-mono">Lv.{player.level}</span>
                  <span className="dm-power-class">{player.gameClass}</span>
                </div>
                <div className="dm-power-xp-bar">
                  <div className="dm-power-xp-fill" style={{ width: `${(player.xp / player.xpToNext) * 100}%` }} />
                </div>
                <span className="dm-power-xp-text font-mono">{player.xp.toLocaleString()} / {player.xpToNext.toLocaleString()} XP</span>
              </div>

              {/* Core Path */}
              <div className="dm-section-label">成长路径</div>
              <div className="dm-power-core">
                <div className="dm-power-core-top">
                  <span className="dm-power-core-name">{player.corePathName}</span>
                  <span className="dm-power-core-tier">{player.corePathTier}</span>
                </div>
                <div className="dm-power-core-bar">
                  <div className="dm-power-core-fill" style={{ width: `${player.corePathProgress}%` }} />
                </div>
                <span className="dm-power-core-desc">{player.corePathDesc}</span>
              </div>

              {/* Rank — only if applicable */}
              {player.currentRank && (
                <>
                  <div className="dm-section-label">当前阶位</div>
                  <div className="dm-power-rank">
                    <div className="dm-power-rank-top">
                      <span className="dm-power-rank-cur">{player.currentRank}</span>
                      {player.nextRank && (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="dm-power-rank-arrow"><polyline points="9,18 15,12 9,6"/></svg>
                          <span className="dm-power-rank-next">{player.nextRank}</span>
                        </>
                      )}
                    </div>
                    {player.rankProgress !== undefined && (
                      <div className="dm-power-core-bar">
                        <div className="dm-power-core-fill" style={{ width: `${player.rankProgress}%` }} />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Skills */}
              <div className="dm-section-label">
                技能
                <span className="dm-section-label-note">熟练度影响成功率</span>
              </div>
              <div className="dm-power-skills">
                {(['offense', 'defense', 'utility'] as const).map(type => {
                  const skills = player.skills.filter(s => s.type === type);
                  if (skills.length === 0) return null;
                  const typeLabel = type === 'offense' ? '进攻' : type === 'defense' ? '防御' : '功能';
                  const typeIcon = type === 'offense' ? '⚔' : type === 'defense' ? '🛡' : '✦';
                  return (
                    <div key={type} className="dm-power-skill-group">
                      <div className="dm-power-skill-type">
                        <span>{typeIcon}</span>
                        <span>{typeLabel}</span>
                      </div>
                      {skills.map(skill => {
                        const tier = getProficiencyTier(skill.proficiency);
                        return (
                          <div key={skill.id} className="dm-power-skill">
                            <div className="dm-power-skill-top">
                              <span className="dm-power-skill-name">{skill.name}</span>
                              <span className="dm-power-skill-source">
                                {skill.source === 'class' ? '职业' : skill.source === 'learned' ? '学习' : '自创'}
                              </span>
                            </div>
                            <div className="dm-power-skill-bar-row">
                              <div className="dm-power-skill-bar">
                                <div className="dm-power-skill-fill" style={{ width: `${skill.proficiency}%` }} />
                              </div>
                              <span className="dm-power-skill-tier">{tier.name}</span>
                              <span className="dm-power-skill-rate font-mono">{tier.baseRate}%</span>
                            </div>
                            <span className="dm-power-skill-desc">{skill.description}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Inventory Tab sub-component
// ────────────────────────────────────────────
type InvFilter = 'all' | 'consumable' | 'material' | 'key';

const INV_FILTERS: { key: InvFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'consumable', label: '消耗品' },
  { key: 'material', label: '材料' },
  { key: 'key', label: '关键道具' },
];

const TYPE_LABELS: Record<string, string> = {
  consumable: '消耗品', material: '材料', key: '关键道具',
};

function InventoryTab({ inventory, onUseItem, onDiscardItem, addToast }: {
  inventory: InventoryItem[];
  onUseItem: (item: InventoryItem) => void;
  onDiscardItem: (item: InventoryItem, count?: number) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}) {
  const [filter, setFilter] = useState<InvFilter>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedItem && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedItem]);

  const filtered = filter === 'all' ? inventory : inventory.filter(i => i.type === filter);
  const typeCounts = {
    all: inventory.reduce((s, i) => s + i.quantity, 0),
    consumable: inventory.filter(i => i.type === 'consumable').reduce((s, i) => s + i.quantity, 0),
    material: inventory.filter(i => i.type === 'material').reduce((s, i) => s + i.quantity, 0),
    key: inventory.filter(i => i.type === 'key').reduce((s, i) => s + i.quantity, 0),
  };

  const handleUse = (item: InventoryItem) => {
    onUseItem(item);
    const newQty = item.quantity - 1;
    if (newQty <= 0) setSelectedItem(null);
    addToast(`使用了 ${item.name}${item.effect ? '：' + item.effect : ''}`, 'success');
  };

  const handleDiscard = (item: InventoryItem, count: number) => {
    onDiscardItem(item, count);
    if (count >= item.quantity) setSelectedItem(null);
    setConfirmDiscard(null);
    addToast(count >= item.quantity ? `丢弃了全部 ${item.name}` : `丢弃了 ${count} 个 ${item.name}`, 'info');
  };

  return (
    <div className="dm-inv">
      {/* Filter bar */}
      <div className="dm-inv-filters">
        {INV_FILTERS.map(f => (
          <button key={f.key} className={`dm-inv-filter${filter === f.key ? ' dm-inv-filter--active' : ''}`}
            onClick={() => { setFilter(f.key); setSelectedItem(null); }}>
            {f.label}
            <span className="dm-inv-filter-count">{typeCounts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="dm-inv-stats">
        {filter === 'all'
          ? `共 ${inventory.length} 种物品 · 总数量 ${typeCounts.all}`
          : `${INV_FILTERS.find(f => f.key === filter)?.label} · ${filtered.length} 种 · ${typeCounts[filter]} 个`}
      </div>

      {/* Item list */}
      {filtered.length === 0 ? (
        <div className="dm-owned-empty">背包中暂无此类物品</div>
      ) : (
        <div className="dm-inv-list">
          {filtered.map(item => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <button key={item.id}
                className={`dm-inv-item${isSelected ? ' dm-inv-item--selected' : ''}`}
                onClick={() => setSelectedItem(prev => prev?.id === item.id ? null : item)}>
                <span className="dm-inv-item-bar" style={{ background: qColor(item.quality) }} />
                <div className="dm-inv-item-info">
                  <span className="dm-inv-item-name">{item.name}</span>
                  <span className="dm-inv-item-meta">
                    {TYPE_LABELS[item.type]} · {qLabel(item.quality)}
                  </span>
                  {item.effect && <span className="dm-inv-item-effect">{item.effect}</span>}
                </div>
                <span className="dm-inv-item-qty font-mono">×{item.quantity}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail card */}
      {selectedItem && (
        <div className="dm-equip-detail" ref={detailRef}>
          <div className="dm-equip-detail-header">
            <span className="dm-equip-name" style={{ color: qColor(selectedItem.quality) }}>{selectedItem.name}</span>
            <button className="dm-equip-close-detail" onClick={() => { setSelectedItem(null); setConfirmDiscard(null); }} aria-label="关闭详情">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="dm-equip-detail-body">
            <div className="dm-equip-quality" style={{ color: qColor(selectedItem.quality) }}>
              {TYPE_LABELS[selectedItem.type]} · {qLabel(selectedItem.quality)} · 持有 {selectedItem.quantity} 个
            </div>
            <div className="dm-equip-desc">{selectedItem.description}</div>
            {selectedItem.effect && (
              <div className="dm-equip-effect"><span className="dm-effect-label">使用效果</span>{selectedItem.effect}</div>
            )}
            <div className="dm-equip-actions">
              {selectedItem.usable && (
                <button className="dm-inv-use-btn" onClick={() => handleUse(selectedItem)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5,3 19,12 5,21"/></svg>使用
                </button>
              )}
              {confirmDiscard === selectedItem.id ? (
                <div className="dm-discard-confirm">
                  <span>丢弃多少？</span>
                  {selectedItem.quantity > 1 && (
                    <button className="dm-discard-yes" onClick={() => handleDiscard(selectedItem, 1)}>×1</button>
                  )}
                  <button className="dm-discard-yes" onClick={() => handleDiscard(selectedItem, selectedItem.quantity)}>全部</button>
                  <button className="dm-discard-no" onClick={() => setConfirmDiscard(null)}>取消</button>
                </div>
              ) : (
                <button className="dm-discard-btn" onClick={() => setConfirmDiscard(selectedItem.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>丢弃
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
