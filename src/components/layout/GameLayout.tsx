import type { PlayerState, TimeLocationState, ZoneInfo, RealZoneInfo, EquipmentSet, EquipmentItem, FashionSet, FashionItem, EquipmentSlot, InventoryItem, ActionEntry, Gem, Quest } from '../../App';
import LeftPanel from '../panels/LeftPanel';
import CenterPanel from '../panels/CenterPanel';
import RightPanel from '../panels/RightPanel';
import './GameLayout.css';

interface GameLayoutProps {
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
  actionLog: ActionEntry[];
  onClearActionLog: () => void;
  onEnhance: (item: EquipmentItem) => { success: boolean; newLevel: number; cost: number };
  onMoneyChange: (delta: number) => void;
  ownedGems: Gem[];
  onSocketGem: (item: EquipmentItem, gem: Gem, socketIndex: number) => void;
  onRemoveGem: (item: EquipmentItem, socketIndex: number) => void;
  onCraft: (slot: EquipmentSlot, materials: InventoryItem[]) => EquipmentItem;
  quests: Quest[];
}

export default function GameLayout(props: GameLayoutProps) {
  return (
    <div className={`game-layout${props.isInGame ? ' game-layout--game' : ' game-layout--real'}${props.timeLocation.fusionRate >= 70 ? ' game-layout--fused' : ''}`}>
      <LeftPanel {...props} />
      <CenterPanel isInGame={props.isInGame} actionLog={props.actionLog} onClearActionLog={props.onClearActionLog} />
      <RightPanel isInGame={props.isInGame} playerMoney={props.player.money} equipment={props.equipment} ownedEquipment={props.ownedEquipment} onEnhance={props.onEnhance} onMoneyChange={props.onMoneyChange} ownedGems={props.ownedGems} onSocketGem={props.onSocketGem} onRemoveGem={props.onRemoveGem} inventory={props.inventory} onCraft={props.onCraft} quests={props.quests} />
    </div>
  );
}
