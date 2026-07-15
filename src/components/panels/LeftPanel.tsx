import { useState } from 'react';
import type { PlayerState, TimeLocationState, ZoneInfo, RealZoneInfo, EquipmentSet, EquipmentItem, FashionSet, FashionItem, EquipmentSlot, InventoryItem } from '../../App';
import TimeLocationBar from './TimeLocationBar';
import PlayerCard from './PlayerCard';
import PlayerDetailModal from './PlayerDetailModal';
import ZoneInfoModal from './ZoneInfoModal';
import RealZoneModal from './RealZoneModal';
import FusionModal from './FusionModal';
import './LeftPanel.css';

interface LeftPanelProps {
  player: PlayerState;
  timeLocation: TimeLocationState;
  zoneInfo: ZoneInfo;
  realZoneInfo: RealZoneInfo;
  equipment: EquipmentSet;
  ownedEquipment: EquipmentItem[];
  fashion: FashionSet;
  ownedFashion: FashionItem[];
  fashionNudeSlots: EquipmentSlot[];
  appearanceSummary: string;
  isInGame: boolean;
  onRealAvatarChange: (url: string) => void;
  onGameAvatarChange: (url: string) => void;
  onGameToggle: () => void;
  onEquipItem: (item: EquipmentItem, oldItem?: EquipmentItem) => void;
  onUnequipItem: (item: EquipmentItem) => void;
  onDiscardItem: (item: EquipmentItem) => void;
  onEquipFashion: (item: FashionItem, oldItem?: FashionItem) => void;
  onUnequipFashion: (item: FashionItem) => void;
  onDiscardFashion: (item: FashionItem) => void;
  onFashionSave: (nudeSlots: EquipmentSlot[]) => void;
  inventory: InventoryItem[];
  onUseItem: (item: InventoryItem) => void;
  onDiscardInventoryItem: (item: InventoryItem, count?: number) => void;
}

export default function LeftPanel(props: LeftPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [realZoneModalOpen, setRealZoneModalOpen] = useState(false);
  const [fusionModalOpen, setFusionModalOpen] = useState(false);

  return (
    <>
      <aside className={`left-panel${collapsed ? ' left-panel--collapsed' : ''}`}>
        <button
          className="left-panel__toggle"
          onClick={() => setCollapsed(prev => !prev)}
          aria-label={collapsed ? '展开左侧面板' : '收起左侧面板'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d={collapsed ? 'M6 4L10 8L6 12' : 'M10 4L6 8L10 12'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="left-panel__inner">
          <TimeLocationBar
            data={props.timeLocation} zoneInfo={props.zoneInfo} isInGame={props.isInGame}
            collapsed={collapsed}
            onGameZoneClick={() => setZoneModalOpen(true)}
            onRealZoneClick={() => setRealZoneModalOpen(true)}
            onFusionClick={() => setFusionModalOpen(true)}
          />
          <PlayerCard
            player={props.player} zoneInfo={props.zoneInfo} isInGame={props.isInGame}
            fusionRate={props.timeLocation.fusionRate} collapsed={collapsed}
            onDetailClick={() => setDetailOpen(true)}
            onGameToggle={props.onGameToggle}
          />
        </div>
      </aside>
      <PlayerDetailModal
        open={detailOpen} onClose={() => setDetailOpen(false)}
        player={props.player}
        equipment={props.equipment} ownedEquipment={props.ownedEquipment}
        fashion={props.fashion} ownedFashion={props.ownedFashion}
        fashionNudeSlots={props.fashionNudeSlots}
        appearanceSummary={props.appearanceSummary}
        onEquipItem={props.onEquipItem} onUnequipItem={props.onUnequipItem} onDiscardItem={props.onDiscardItem}
        onEquipFashion={props.onEquipFashion} onUnequipFashion={props.onUnequipFashion} onDiscardFashion={props.onDiscardFashion}
        onFashionSave={props.onFashionSave}
        onRealAvatarChange={props.onRealAvatarChange}
        onGameAvatarChange={props.onGameAvatarChange}
        inventory={props.inventory}
        onUseItem={props.onUseItem}
        onDiscardInventoryItem={props.onDiscardInventoryItem}
      />
      <ZoneInfoModal open={zoneModalOpen} onClose={() => setZoneModalOpen(false)} zoneInfo={props.zoneInfo} playerPower={props.player.powerLevel} />
      <RealZoneModal open={realZoneModalOpen} onClose={() => setRealZoneModalOpen(false)} realZoneInfo={props.realZoneInfo} fusionRate={props.timeLocation.fusionRate} />
      <FusionModal open={fusionModalOpen} onClose={() => setFusionModalOpen(false)} fusionRate={props.timeLocation.fusionRate} />
    </>
  );
}
