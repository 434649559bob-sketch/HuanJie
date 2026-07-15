import { useState } from 'react';
import type { EquipmentItem, EquipmentSet, Gem, InventoryItem, EquipmentSlot, Quality } from '../../App';
import { SLOT_LABELS, QUALITY_LABELS, QUALITY_COLORS, ENHANCE_COST } from '../../App';
import './ForgePanel.css';

// ── Formulas ── (品质常量从 App.tsx 统一导入)
function enhanceCost(item: EquipmentItem): number { return Math.floor((ENHANCE_COST[item.quality] || 200) * (item.enhanceLevel + 1) * 1.2); }
function successRate(item: EquipmentItem): number { return Math.max(5, 100 - item.enhanceLevel * 10); }

// ── Props ──
interface ForgePanelProps {
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
}

type ForgeTab = 'enhance' | 'socket' | 'craft';

// ── Component ──
export default function ForgePanel(props: ForgePanelProps) {
  const [tab, setTab] = useState<ForgeTab>('enhance');
  return (
    <div className="fg-panel">
      <div className="fg-tabs">
        {(['enhance', 'socket', 'craft'] as ForgeTab[]).map(t => (
          <button key={t} className={`fg-tab${tab === t ? ' fg-tab--active' : ''}`} onClick={() => setTab(t)}>
            {t === 'enhance' ? '强化' : t === 'socket' ? '镶嵌' : '制作'}
          </button>
        ))}
      </div>
      {tab === 'enhance' && <EnhanceTab {...props} />}
      {tab === 'socket' && <SocketTab equipment={props.equipment} ownedEquipment={props.ownedEquipment} ownedGems={props.ownedGems} onSocketGem={props.onSocketGem} onRemoveGem={props.onRemoveGem} />}
      {tab === 'craft' && <CraftTab inventory={props.inventory} onCraft={props.onCraft} />}
    </div>
  );
}

// ── Enhance Tab ──
function EnhanceTab({ playerMoney, equipment, ownedEquipment, onEnhance, onMoneyChange }: Pick<ForgePanelProps, 'playerMoney' | 'equipment' | 'ownedEquipment' | 'onEnhance' | 'onMoneyChange'>) {
  const [result, setResult] = useState<{ itemName: string; success: boolean; newLevel: number } | null>(null);
  const [animating, setAnimating] = useState<string | null>(null);
  const allItems: { item: EquipmentItem; source: string }[] = [];
  for (const item of Object.values(equipment)) { if (item) allItems.push({ item, source: '已装备' }); }
  for (const item of ownedEquipment) { allItems.push({ item, source: '持有中' }); }

  const doEnhance = (item: EquipmentItem) => {
    const cost = enhanceCost(item);
    if (playerMoney < cost) return;
    onMoneyChange(-cost); setAnimating(item.id);
    setTimeout(() => { const res = onEnhance(item); setResult({ itemName: item.name, success: res.success, newLevel: res.newLevel }); setAnimating(null); setTimeout(() => setResult(null), 3000); }, 400);
  };

  return (
    <>
      <div className="fg-money"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg><span className="fg-money-value font-mono">{playerMoney.toLocaleString()}</span><span className="fg-money-label">G</span></div>
      {result && <div className={`fg-result${result.success ? ' fg-result--success' : ' fg-result--fail'}`}>{result.success ? `${result.itemName} 强化成功！当前 +${result.newLevel}` : `${result.itemName} 强化失败`}</div>}
      {allItems.length === 0 ? <div className="fg-empty">没有可强化的装备</div> : (
        <div className="fg-list">{allItems.map(({ item, source }) => {
          const cost = enhanceCost(item); const rate = successRate(item); const can = playerMoney >= cost;
          return (<div key={item.id} className={`fg-item${animating === item.id ? ' fg-item--animating' : ''}`}><div className="fg-item-info"><div className="fg-item-top"><span className="fg-item-name">{item.name}</span><span className="fg-item-source">{source}</span></div><div className="fg-item-meta"><span className="fg-item-quality" style={{ color: QUALITY_COLORS[item.quality] }}>{QUALITY_LABELS[item.quality]}</span><span className="fg-item-level font-mono">+{item.enhanceLevel}</span></div><div className="fg-item-stats"><span>费用 <strong className="font-mono">{cost.toLocaleString()} G</strong></span><span className="fg-item-sep">·</span><span>成功率 <strong style={{ color: rate >= 70 ? 'var(--success)' : rate >= 30 ? 'var(--warning)' : 'var(--danger)' }}>{rate}%</strong></span></div></div><button className={`fg-enhance-btn${!can ? ' fg-enhance-btn--poor' : ''}`} onClick={() => doEnhance(item)} disabled={!can || animating !== null}>{can ? '强化' : '金钱不足'}</button></div>);
        })}</div>
      )}
    </>
  );
}

// ── Socket Tab ──
function SocketTab({ equipment, ownedEquipment, ownedGems, onSocketGem, onRemoveGem }: Pick<ForgePanelProps, 'equipment' | 'ownedEquipment' | 'ownedGems' | 'onSocketGem' | 'onRemoveGem'>) {
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [pickingSocket, setPickingSocket] = useState<number | null>(null);
  const allItems: EquipmentItem[] = [...Object.values(equipment).filter(Boolean) as EquipmentItem[], ...ownedEquipment];

  if (selectedItem) {
    const item = allItems.find(i => i.id === selectedItem.id) || selectedItem;
    return (
      <div className="fg-socket-detail">
        <button className="fg-back-btn" onClick={() => { setSelectedItem(null); setPickingSocket(null); }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15,18 9,12 15,6"/></svg>返回</button>
        <div className="fg-socket-equip-name">{item.name} <span style={{ color: QUALITY_COLORS[item.quality] }}>{QUALITY_LABELS[item.quality]}</span> <span className="fg-item-level font-mono">+{item.enhanceLevel}</span></div>
        <div className="fg-socket-slots-label">
          <span className="fg-socket-dots">{Array.from({ length: item.maxSockets }).map((_, i) => <span key={i} className={`fg-socket-dot${i < item.socketedGems.length ? ' fg-socket-dot--filled' : ''}`} />)}</span>
          {item.socketedGems.length}/{item.maxSockets} 孔位已镶嵌
        </div>
        <div className="fg-socket-slots">
          {Array.from({ length: item.maxSockets }).map((_, i) => {
            const gem = item.socketedGems[i];
            if (gem) {
              return (
                <div key={i} className="fg-socket-slot fg-socket-slot--filled">
                  <span className="fg-gem-name" style={{ color: QUALITY_COLORS[gem.quality] }}>{gem.name}</span>
                  <span className="fg-gem-stat font-mono">装等 +{gem.powerBonus}</span>
                  <span className="fg-gem-effect">{gem.effect}</span>
                  <button className="fg-gem-remove" onClick={() => onRemoveGem(item, i)}>移除</button>
                </div>
              );
            }
            return (
              <button key={i} className="fg-socket-slot fg-socket-slot--empty" onClick={() => setPickingSocket(i)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                <span>空孔位</span>
              </button>
            );
          })}
        </div>

        {/* Gem picker */}
        {pickingSocket !== null && (
          <div className="fg-gem-picker">
            <div className="fg-gem-picker-title">选择宝石镶嵌到孔位 {pickingSocket + 1}</div>
            {ownedGems.length === 0 ? <div className="fg-empty">没有可用的宝石</div> : (
              <div className="fg-gem-list">{ownedGems.map(gem => (
                <button key={gem.id} className="fg-gem-item" onClick={() => { onSocketGem(item, gem, pickingSocket); setPickingSocket(null); }}>
                  <span className="fg-gem-name" style={{ color: QUALITY_COLORS[gem.quality] }}>{gem.name}</span>
                  <span className="fg-gem-meta">{QUALITY_LABELS[gem.quality]} · 装等 +{gem.powerBonus}</span>
                  <span className="fg-gem-effect">{gem.effect}</span>
                </button>
              ))}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fg-list">
      {allItems.length === 0 ? <div className="fg-empty">没有装备</div> : allItems.map(item => (
          <button key={item.id} className="fg-item fg-socket-item" onClick={() => setSelectedItem(item)}>
            <div className="fg-item-info">
              <div className="fg-item-top"><span className="fg-item-name">{item.name}</span><span className="fg-item-level font-mono">+{item.enhanceLevel}</span></div>
              <div className="fg-item-meta"><span style={{ color: QUALITY_COLORS[item.quality] }}>{QUALITY_LABELS[item.quality]}</span><span className="fg-item-sep">·</span><span className="fg-socket-dots">{Array.from({ length: item.maxSockets }).map((_, i) => <span key={i} className={`fg-socket-dot${i < item.socketedGems.length ? ' fg-socket-dot--filled' : ''}`} />)}</span></div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9,18 15,12 9,6"/></svg>
          </button>
        ))}
    </div>
  );
}

// ── Craft Tab ──
const CRAFT_SLOTS: EquipmentSlot[] = ['weapon', 'helmet', 'armor', 'gloves', 'pants', 'shoes', 'accessory1'];

function CraftTab({ inventory, onCraft }: { inventory: InventoryItem[]; onCraft: (slot: EquipmentSlot, materials: InventoryItem[]) => EquipmentItem }) {
  const [slot, setSlot] = useState<EquipmentSlot>('weapon');
  const [picking, setPicking] = useState<number | null>(null);
  const [materials, setMaterials] = useState<(InventoryItem | null)[]>([null, null, null]);
  const [result, setResult] = useState<EquipmentItem | null>(null);
  const matItems = inventory.filter(i => i.type === 'material');

  const selectMat = (item: InventoryItem) => {
    if (picking === null) return;
    const next = [...materials];
    // If same material already selected, deselect it
    const existingIdx = next.findIndex(m => m?.id === item.id);
    if (existingIdx >= 0) next[existingIdx] = null;
    next[picking] = item;
    setMaterials(next);
    setPicking(null);
  };

  const qualityOrder: string[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
  const bestQuality = (materials.filter(Boolean).reduce((best: string, m) => {
    if (!m) return best;
    return qualityOrder.indexOf(m.quality) > qualityOrder.indexOf(best) ? m.quality : best;
  }, 'common')) as Quality;

  const canCraft = materials.filter(Boolean).length === 3;

  const doCraft = () => {
    const validMats = materials.filter(Boolean) as InventoryItem[];
    if (validMats.length !== 3) return;
    const item = onCraft(slot, validMats);
    setResult(item);
    setMaterials([null, null, null]);
    setTimeout(() => setResult(null), 5000);
  };

  return (
    <div className="fg-craft">
      {/* Slot type */}
      <div className="fg-craft-label">装备类型</div>
      <div className="fg-craft-slots">
        {CRAFT_SLOTS.map(s => (
          <button key={s} className={`fg-craft-slot-btn${slot === s ? ' fg-craft-slot-btn--active' : ''}`} onClick={() => setSlot(s)}>{SLOT_LABELS[s]}</button>
        ))}
      </div>

      {/* Materials */}
      <div className="fg-craft-label">选择材料（3种）</div>
      <div className="fg-craft-mats">
        {[0, 1, 2].map(i => {
          const m = materials[i];
          return (
            <button key={i} className={`fg-craft-mat${m ? ' fg-craft-mat--filled' : ''}`} onClick={() => setPicking(i)}>
              {m ? (
                <>
                  <span className="fg-craft-mat-name" style={{ color: QUALITY_COLORS[m.quality] }}>{m.name}</span>
                  <span className="fg-craft-mat-meta">{QUALITY_LABELS[m.quality]} · 持有 ×{m.quantity}</span>
                  {m.description && <span className="fg-gem-effect">{m.description.slice(0, 40)}…</span>}
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  <span>选择材料 {i + 1}</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Material picker */}
      {picking !== null && (
        <div className="fg-gem-picker">
          <div className="fg-gem-picker-title">选择材料 {picking + 1}（点击已选材料可取消）</div>
          {matItems.length === 0 ? <div className="fg-empty">背包中没有材料</div> : (
            <div className="fg-gem-list">{matItems.map(item => {
              const isUsed = materials.some(m => m?.id === item.id);
              return (
                <button key={item.id} className={`fg-gem-item${isUsed ? ' fg-gem-item--used' : ''}`} onClick={() => selectMat(item)}>
                  <div className="fg-gem-item-row">
                    <span className="fg-gem-name" style={{ color: QUALITY_COLORS[item.quality] }}>{item.name}</span>
                    <span className="fg-gem-meta">{QUALITY_LABELS[item.quality]} · 持有 ×{item.quantity}</span>
                  </div>
                  {item.description && <span className="fg-gem-effect">{item.description}</span>}
                  {isUsed && <span className="fg-craft-used-tag">已选用</span>}
                </button>
              );
            })}</div>
          )}
        </div>
      )}

      {/* Quality preview */}
      <div className="fg-craft-preview">
        <span className="fg-craft-preview-label">品质预览</span>
        <span className="fg-craft-preview-quality" style={{ color: QUALITY_COLORS[bestQuality] }}>{QUALITY_LABELS[bestQuality]}</span>
        {!canCraft && <span className="fg-craft-preview-hint">（需选择3种材料）</span>}
      </div>

      {/* Craft button */}
      <button className="fg-craft-btn" disabled={!canCraft} onClick={doCraft}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        开始制作
      </button>

      {/* Result */}
      {result && (
        <div className="fg-result fg-result--success">
          制作完成！获得 <strong style={{ color: QUALITY_COLORS[result.quality] }}>{result.name}</strong>（{QUALITY_LABELS[result.quality]} · 装等 {result.basePower}）已加入持有装备列表
        </div>
      )}
    </div>
  );
}
