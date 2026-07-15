import { useState, useCallback } from 'react';
import GameLayout from './components/layout/GameLayout';
import ToastProvider from './components/ui/ToastProvider';
import './App.css';

export interface PlayerState {
  realName: string;
  gameName: string;
  realOccupation: string;
  gameClass: string;
  level: number;
  powerLevel: number;
  money: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gameBuffs: BuffDebuff[];
  gameDebuffs: BuffDebuff[];
  realBuffs: BuffDebuff[];
  realDebuffs: BuffDebuff[];
  actionStatus: string;
  realAvatarUrl: string;
  gameAvatarUrl: string;
  corePathName: string;
  corePathTier: string;
  corePathProgress: number;
  corePathDesc: string;
  currentRank?: string;
  rankProgress?: number;
  nextRank?: string;
  resourceName: string;
  skills: Skill[];
}

export interface TimeLocationState {
  realTime: string;
  gameTime: string;
  realLocation: string;
  gameLocation: string;
  worldName: string;
  fusionRate: number;
}

export interface ZoneInfo {
  zoneName: string;
  zoneType: string;
  coefficient: number;
  powerSystemMatch: boolean;
  description: string;
}

export interface RealZoneInfo {
  locationName: string;
  dangerLevel: number;
  description: string;
}

export interface FashionItem {
  id: string;
  name: string;
  slot: EquipmentSlot;
  quality: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  description: string;
  visualEffect: string;
}

export type FashionSet = Partial<Record<EquipmentSlot, FashionItem>>;

export interface EquipmentItem {
  id: string;
  name: string;
  slot: EquipmentSlot;
  quality: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  basePower: number;
  enhanceLevel: number;
  enhanceBonus: number;
  gemBonus: number;
  description: string;
  source: 'dungeon' | 'crafted';
  sourceDetail: string;
  crafterName?: string;
  powerSystem?: string;
  extraEffect?: string;
  maxSockets: number;
  socketedGems: Gem[];
}

export interface BuffDebuff {
  name: string;
  effect: string;
  source: string;
}

export interface Skill {
  id: string;
  name: string;
  type: 'offense' | 'defense' | 'utility';
  proficiency: number;       // 0-100
  description: string;
  source: 'class' | 'learned' | 'self-developed';
}

// Proficiency → tier name + base success rate
export interface ActionEntry {
  id: number;
  summary: string;
}

let actionId = 0;

export interface QuestObjective {
  id: string;
  description: string;
  current: number;
  required: number;
}

export interface QuestReward {
  xp?: number; money?: number; items?: string[]; title?: string;
}

export interface Quest {
  id: string;
  name: string;
  type: 'main' | 'side' | 'daily';
  status: 'active' | 'completed' | 'failed';
  description: string;
  giver: string;
  location: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
}

export function getProficiencyTier(p: number): { name: string; baseRate: number } {
  if (p >= 100) return { name: '登峰造极', baseRate: 99 };
  if (p >= 80)  return { name: '出神入化', baseRate: 90 };
  if (p >= 60)  return { name: '炉火纯青', baseRate: 75 };
  if (p >= 40)  return { name: '融会贯通', baseRate: 55 };
  if (p >= 20)  return { name: '略有所成', baseRate: 35 };
  return { name: '初窥门径', baseRate: 20 };
}

export interface Gem {
  id: string;
  name: string;
  quality: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  powerBonus: number;
  effect: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'consumable' | 'material' | 'key';
  quality: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  maxStack: number;
  description: string;
  effect?: string;
  usable: boolean;
}

export type Quality = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export const QUALITY_ORDER: Quality[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
export const QUALITY_LABELS: Record<Quality, string> = { common: '普通', uncommon: '精良', rare: '稀有', epic: '史诗', legendary: '传说', mythic: '神话' };
export const QUALITY_COLORS: Record<Quality, string> = { common: '#9ca3af', uncommon: '#22c55e', rare: '#3b82f6', epic: '#a855f7', legendary: '#f97316', mythic: '#ef4444' };
export const ENHANCE_BONUS: Record<Quality, number> = { common: 10, uncommon: 20, rare: 40, epic: 80, legendary: 160, mythic: 320 };
export const ENHANCE_COST: Record<Quality, number> = { common: 200, uncommon: 400, rare: 800, epic: 1600, legendary: 3200, mythic: 6400 };
export const CRAFT_POWER: Record<Quality, number> = { common: 100, uncommon: 180, rare: 300, epic: 500, legendary: 800, mythic: 1200 };

export type EquipmentSlot = 'weapon' | 'helmet' | 'armor' | 'gloves' | 'pants' | 'shoes' | 'accessory1' | 'accessory2';

export type EquipmentSet = Partial<Record<EquipmentSlot, EquipmentItem>>;

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon: '武器',
  helmet: '头盔',
  armor: '衣服',
  gloves: '手套',
  pants: '裤子',
  shoes: '鞋',
  accessory1: '饰品Ⅰ',
  accessory2: '饰品Ⅱ',
};

export { SLOT_LABELS };

function App() {
  // Core world-state: is player logged into the game?
  const [isInGame, setIsInGame] = useState(true);

  // Action log — tracks frontend operations between AI responses
  const [actionLog, setActionLog] = useState<ActionEntry[]>([]);
  const addAction = useCallback((summary: string) => {
    setActionLog(prev => [...prev, { id: ++actionId, summary }]);
  }, []);
  const clearActionLog = useCallback(() => setActionLog([]), []);

  // Mock quests
  const [quests] = useState<Quest[]>([
    { id: 'q-1', name: '剑心试炼', type: 'main', status: 'active', description: '玄矶子认为你的剑意已到瓶颈，需要通过实战来突破。前往剑冢击败剑灵残影，证明你的剑道。', giver: '掌剑长老·玄矶子', location: '昆仑墟·云顶剑阁', objectives: [{ id: 'o1-1', description: '向玄矶子请教剑意', current: 1, required: 1 }, { id: 'o1-2', description: '在剑冢击败剑灵残影', current: 1, required: 1 }, { id: 'o1-3', description: '将剑魂碎片交还给玄矶子', current: 0, required: 1 }], rewards: { xp: 5000, money: 2000, title: '剑心通明' } },
    { id: 'q-2', name: '两界之壁', type: 'main', status: 'active', description: '昆仑墟中多处出现了空间裂隙，现实与游戏的边界正在变薄。调查这些裂隙并收集数据。', giver: '系统', location: '昆仑墟全域', objectives: [{ id: 'o2-1', description: '在云顶剑阁发现第一处裂隙', current: 1, required: 1 }, { id: 'o2-2', description: '在剑冢调查异常能量源', current: 0, required: 1 }, { id: 'o2-3', description: '在灵蚕洞封印不稳定裂隙', current: 0, required: 1 }, { id: 'o2-4', description: '在古战场收集空间数据', current: 0, required: 1 }, { id: 'o2-5', description: '向玄矶子汇报调查结果', current: 0, required: 1 }], rewards: { xp: 12000, money: 5000 } },
    { id: 'q-3', name: '柳白霜的委托', type: 'side', status: 'active', description: '柳白霜正在研发一种新型丹药，需要一些稀有材料。帮她收集材料，她会用一枚聚灵丹作为答谢。', giver: '柳白霜', location: '昆仑墟·炼器堂', objectives: [{ id: 'o3-1', description: '收集灵纹线 ×5', current: 8, required: 5 }, { id: 'o3-2', description: '收集凤凰羽毛 ×1', current: 3, required: 1 }, { id: 'o3-3', description: '将材料交给柳白霜', current: 0, required: 1 }], rewards: { xp: 2000, money: 1000, items: ['聚灵丹'] } },
    { id: 'q-4', name: '废土商人的请求', type: 'side', status: 'active', description: '废土商人需要一批昆仑墟特产来转卖。利润不错，值得跑一趟。', giver: '废土商人', location: '废土·钢铁城', objectives: [{ id: 'o4-1', description: '收集玄铁矿 ×10', current: 12, required: 10 }, { id: 'o4-2', description: '将矿石运到钢铁城交给废土商人', current: 0, required: 1 }], rewards: { xp: 1500, money: 3000 } },
    { id: 'q-5', name: '日常修炼', type: 'daily', status: 'active', description: '每日必修的修炼任务。完成后可获得稳定经验。', giver: '系统', location: '任意', objectives: [{ id: 'o5-1', description: '完成一次战斗', current: 0, required: 1 }, { id: 'o5-2', description: '使用一次技能', current: 0, required: 1 }, { id: 'o5-3', description: '与一名NPC对话', current: 1, required: 1 }], rewards: { xp: 500, money: 200 } },
    { id: 'q-6', name: '初入昆仑墟', type: 'main', status: 'completed', description: '首次进入昆仑墟世界的引导任务。熟悉剑阁的基本设施和关键人物。', giver: '系统', location: '昆仑墟·云顶剑阁', objectives: [{ id: 'o6-1', description: '参观云顶剑阁', current: 1, required: 1 }, { id: 'o6-2', description: '拜见掌剑长老玄矶子', current: 1, required: 1 }, { id: 'o6-3', description: '完成第一次练剑', current: 1, required: 1 }], rewards: { xp: 1000, money: 500 } },
    { id: 'q-7', name: '送货上门', type: 'side', status: 'completed', description: '帮铁匠王大锤把一批货送到隔壁据点。简单的跑腿任务。', giver: '铁匠王大锤', location: '废土·钢铁城', objectives: [{ id: 'o7-1', description: '从王大锤处领取货物', current: 1, required: 1 }, { id: 'o7-2', description: '将货物送到隔壁据点', current: 1, required: 1 }], rewards: { xp: 300, money: 500 } },
  ]);

  // Mock player state
  const [player, setPlayer] = useState<PlayerState>({
    realName: '林小夜',
    gameName: '夜煞',
    realOccupation: '大学生',
    gameClass: '剑修',
    level: 47,
    powerLevel: 8240,
    money: 15800,
    xp: 28400,
    xpToNext: 50000,
    hp: 820,
    maxHp: 1024,
    mp: 360,
    maxMp: 600,
    gameBuffs: [
      { name: '剑意通明', effect: '剑法伤害+25%，命中率+15%', source: '功法·通明剑诀' },
      { name: '轻身术', effect: '移动速度+20%，闪避率+10%', source: '术法·轻身诀' },
      { name: '剑气护体', effect: '受到的物理伤害降低15%', source: '装备·霜月' },
      { name: '灵韵缠身', effect: '灵力恢复速度+30%', source: '丹药·聚灵丹' },
      { name: '天罡附体', effect: '全属性+10%，持续30分钟', source: '阵法·天罡阵' },
      { name: '凤炎加护', effect: '攻击附带火属性伤害，对亡灵伤害+50%', source: '契约·凤凰之魂' },
      { name: '破军之势', effect: '对首领级敌人伤害+20%，暴击率+8%', source: '称号·破军' },
    ],
    gameDebuffs: [
      { name: '灵力透支', effect: '灵力消耗+50%，灵力恢复速度-40%', source: '连续施展高阶术法' },
      { name: '经脉受损', effect: '最大HP-15%，移动速度-10%', source: '被BOSS「剑灵残影」击中要害' },
      { name: '剑心蒙尘', effect: '剑法伤害-30%，暴击率-15%', source: '心魔入侵·剧情事件' },
    ],
    realBuffs: [
      { name: '精力充沛', effect: '反应速度提升，现实事件处理效率+20%', source: '充足睡眠' },
      { name: '思维敏锐', effect: '解谜和推理能力提升', source: '阅读·哲学著作' },
      { name: '咖啡因亢奋', effect: '短期专注力大幅提升，但结束后会获得「咖啡因崩溃」', source: '第三杯美式咖啡' },
    ],
    realDebuffs: [
      { name: '睡眠不足', effect: '反应迟钝，游戏内操作延迟+100ms', source: '连续游戏超过12小时' },
      { name: '腰酸背痛', effect: '现实行动力下降，无法进行体力活动', source: '久坐游戏舱' },
      { name: 'deadline焦虑', effect: '心理压力导致决策能力下降', source: '毕业论文截止日期临近' },
    ],
    actionStatus: '盘坐调息中，周身灵力缓缓流转…',
    realAvatarUrl: '',
    gameAvatarUrl: '',
    // Power system
    corePathName: '剑修',
    corePathTier: '第七重',
    corePathProgress: 78,
    corePathDesc: '以心御剑，人剑合一。修至大成者可御剑飞行、剑气化形。',
    currentRank: '金丹期',
    rankProgress: 76,
    nextRank: '元婴期',
    resourceName: '灵力',
    skills: [
      { id: 'sk-1', name: '霜月剑法', type: 'offense', proficiency: 65, description: '以寒气凝于剑身，剑出如霜雪漫天。每一剑都附带冰霜减速效果。', source: 'class' },
      { id: 'sk-2', name: '剑气化形', type: 'offense', proficiency: 34, description: '将体内剑气凝聚为实体，可化作飞剑远程攻击，亦可化为剑盾防御。', source: 'class' },
      { id: 'sk-3', name: '灵气护体', type: 'defense', proficiency: 52, description: '调动周身灵力形成护盾，受到攻击时自动消耗MP抵消部分伤害。', source: 'class' },
      { id: 'sk-4', name: '轻身术', type: 'utility', proficiency: 71, description: '灵力灌注双足，身轻如燕。可短距离冲刺、翻越障碍、踏水而行。', source: 'class' },
      { id: 'sk-5', name: '灵视', type: 'utility', proficiency: 23, description: '短暂开启灵眼，可看到灵力流向、隐藏的阵法符文、以及某些常人不可见之物。', source: 'learned' },
      { id: 'sk-6', name: '剑心通明', type: 'utility', proficiency: 88, description: '进入忘我状态，直觉大幅增强。可感知附近的敌意、识破幻术、预判对手出招轨迹。', source: 'self-developed' },
    ],
  });

  // Mock time/location state
  const [timeLocation] = useState<TimeLocationState>({
    realTime: '14:30',
    gameTime: '星历847年·霜月·第十五日',
    realLocation: '家中·游戏舱',
    gameLocation: '昆仑墟·第三层·云顶剑阁',
    worldName: '昆仑墟',
    fusionRate: 8,
  });

  // Mock zone coefficient data (game world)
  const [zoneInfo] = useState<ZoneInfo>({
    zoneName: '昆仑墟·云顶剑阁',
    zoneType: '修仙',
    coefficient: 1.2,
    powerSystemMatch: true,
    description: '修仙界区块，灵气充沛。修仙体系在此区域获得全额加成，战力×1.2。其他力量体系根据匹配度获得部分加成或削减。',
  });

  // Mock real-world zone data
  const [realZoneInfo] = useState<RealZoneInfo>({
    locationName: '家中·游戏舱',
    dangerLevel: 0,
    description: '你的私人游戏舱位于公寓卧室内。目前现实世界一切正常，尚未出现空间异常现象。当融合度超过30%时，现实地区的危险度将开始上升。',
  });

  // Mock fashion items
  const [fashion, setFashion] = useState<FashionSet>({
    helmet: {
      id: 'fh-1',
      name: '霜雪发冠',
      slot: 'helmet',
      quality: 'rare',
      description: '以寒冰晶石雕琢而成的发冠，束发于顶，行走间有细碎冰晶飘落。',
      visualEffect: '发间有微光流转，偶有霜花在发梢凝结又消散',
    },
    armor: {
      id: 'fa-2',
      name: '墨染流云袍',
      slot: 'armor',
      quality: 'epic',
      description: '一袭墨色长袍，衣袂处绣有暗纹流云，行走时如云卷云舒。据传是某位飞升剑仙遗留凡间之物。',
      visualEffect: '衣袍无风自动，周身萦绕若有若无的墨色剑意',
    },
  });

  // Which fashion slots show nude (instead of underlying equipment)
  const [fashionNudeSlots, setFashionNudeSlots] = useState<EquipmentSlot[]>([]);

  const computeAppearanceSummary = useCallback((currentFashion: FashionSet, nudeSlots: EquipmentSlot[]): string => {
    const slotOrder: EquipmentSlot[] = ['helmet', 'armor', 'gloves', 'pants', 'shoes', 'weapon', 'accessory1', 'accessory2'];
    const labels: Record<EquipmentSlot, string> = {
      helmet: '头部', armor: '上身', gloves: '双手', pants: '下身', shoes: '双足',
      weapon: '武器', accessory1: '饰品', accessory2: '饰品',
    };
    const nudeLabels: Record<EquipmentSlot, string> = {
      helmet: '头部裸露', armor: '上身裸露', gloves: '双手裸露', pants: '下身裸露', shoes: '双足裸露',
      weapon: '未持武器', accessory1: '未佩戴饰品', accessory2: '未佩戴饰品',
    };
    const parts: string[] = [];
    for (const slot of slotOrder) {
      const fItem = currentFashion[slot];
      if (fItem) {
        parts.push(`${labels[slot]}：${fItem.name}`);
      } else if (nudeSlots.includes(slot)) {
        parts.push(nudeLabels[slot]);
      }
      // else: no fashion, not nude → showing equipment, don't mention
    }
    if (parts.length === 0) return '外观：全身被装备包裹，无特别之处。';
    return `外观｜${parts.join('，')}`;
  }, []);

  const [appearanceSummary, setAppearanceSummary] = useState(() => computeAppearanceSummary(fashion, fashionNudeSlots));

  // Mock equipment — currently equipped
  const [equipment, setEquipment] = useState<EquipmentSet>({
    weapon: {
      id: 'eq-1', name: '霜月', slot: 'weapon', quality: 'epic', basePower: 480,
      enhanceLevel: 8, enhanceBonus: 96, gemBonus: 24,
      description: '上古剑仙遗留之佩剑，剑身如霜雪凝结，出鞘时伴有月华流转。对阴邪之物有额外克制效果。',
      source: 'dungeon', sourceDetail: '副本【剑冢·深处】BOSS「剑灵残影」掉落',
      extraEffect: '攻击时有概率触发「霜寒」效果，降低目标攻速',
      maxSockets: 3, socketedGems: [],
    },
    armor: {
      id: 'eq-2', name: '云纹道袍', slot: 'armor', quality: 'rare', basePower: 240,
      enhanceLevel: 5, enhanceBonus: 50, gemBonus: 12,
      description: '云顶剑阁弟子标配法袍，以天蚕丝织就，刻有基础防护阵纹。',
      source: 'crafted', sourceDetail: '由【柳白霜】通过【修仙·炼器】制作，原料：天蚕丝×12、灵纹线×3、护体阵石×1',
      crafterName: '柳白霜', powerSystem: '修仙·炼器',
      extraEffect: '附加「灵气护体」：受到攻击时自动消耗MP抵消部分伤害',
      maxSockets: 2, socketedGems: [],
    },
  });

  // Owned but not equipped
  const [ownedEquipment, setOwnedEquipment] = useState<EquipmentItem[]>([
    { id: 'eq-3', name: '破军', slot: 'weapon', quality: 'rare', basePower: 320, enhanceLevel: 3, enhanceBonus: 30, gemBonus: 8, description: '一柄沉重的战刀，刃口有细密缺口，显然历经百战。', source: 'dungeon', sourceDetail: '副本【古战场】BOSS「将军亡魂」掉落', extraEffect: '对亡灵类敌人伤害+15%', maxSockets: 2, socketedGems: [] },
    { id: 'eq-4', name: '玄铁冠', slot: 'helmet', quality: 'uncommon', basePower: 120, enhanceLevel: 0, enhanceBonus: 0, gemBonus: 0, description: '玄铁打造的基础头盔，胜在结实耐用。', source: 'crafted', sourceDetail: '由【铁匠王大锤】通过【通用·锻造】制作，原料：玄铁矿×5', crafterName: '铁匠王大锤', powerSystem: '通用·锻造', maxSockets: 1, socketedGems: [] },
    { id: 'eq-5', name: '灵丝手套', slot: 'gloves', quality: 'common', basePower: 80, enhanceLevel: 0, enhanceBonus: 0, gemBonus: 0, description: '以灵蚕丝编织的手套，触感细腻，适合精细操作。', source: 'dungeon', sourceDetail: '副本【灵蚕洞】小怪掉落', maxSockets: 1, socketedGems: [] },
    { id: 'eq-6', name: '踏云靴', slot: 'shoes', quality: 'rare', basePower: 180, enhanceLevel: 2, enhanceBonus: 18, gemBonus: 0, description: '轻如鸿毛的靴子，行走时几乎不发出声音。', source: 'crafted', sourceDetail: '由【柳白霜】通过【修仙·炼器】制作，原料：云锦×8、轻身符×2', crafterName: '柳白霜', powerSystem: '修仙·炼器', extraEffect: '移动速度+8%', maxSockets: 2, socketedGems: [] },
    { id: 'eq-7', name: '青铜护手', slot: 'gloves', quality: 'uncommon', basePower: 110, enhanceLevel: 1, enhanceBonus: 10, gemBonus: 0, description: '青铜铸造的护手，关节处做了灵活处理。', source: 'dungeon', sourceDetail: '副本【青铜遗迹】BOSS「青铜巨人」掉落', maxSockets: 1, socketedGems: [] },
    { id: 'eq-8', name: '布衣', slot: 'armor', quality: 'common', basePower: 50, enhanceLevel: 0, enhanceBonus: 0, gemBonus: 0, description: '普通的粗布衣物，毫无防御力可言。', source: 'dungeon', sourceDetail: '新手村赠送', maxSockets: 1, socketedGems: [] },
  ]);

  // Owned but not wearing fashion
  const [ownedFashion, setOwnedFashion] = useState<FashionItem[]>([
    { id: 'fg-1', name: '暗夜手套', slot: 'gloves', quality: 'uncommon', description: '黑色皮质手套，指节处有银质铆钉装饰。', visualEffect: '双手笼罩在一层淡淡的暗影之中' },
    { id: 'fg-2', name: '霓裳羽衣', slot: 'armor', quality: 'legendary', description: '以七色凤凰羽毛编织的华服，流光溢彩，传闻穿上此衣者可得凤凰眷顾。', visualEffect: '周身环绕七彩流光，衣袂飘动时有羽毛虚影纷飞' },
    { id: 'fs-3', name: '踏雪无痕', slot: 'shoes', quality: 'rare', description: '白色缎面绣鞋，鞋底以冰蚕丝织就，踏雪不留痕。', visualEffect: '每一步落下都有细小的冰晶花纹在地面绽放随即消散' },
    { id: 'fh-4', name: '星辉头饰', slot: 'helmet', quality: 'epic', description: '镶嵌星辰碎片的小巧头饰，在暗处会发出柔和的星光。', visualEffect: '发间点缀着星星点点的微光，如同将夜空戴在头上' },
  ]);

  const handleRealAvatarChange= useCallback((url: string) => {
    setPlayer(prev => ({ ...prev, realAvatarUrl: url }));
    try { localStorage.setItem('nexus-realm-real-avatar', url); } catch { /* */ }
  }, []);

  const handleGameAvatarChange = useCallback((url: string) => {
    setPlayer(prev => ({ ...prev, gameAvatarUrl: url }));
    try { localStorage.setItem('nexus-realm-game-avatar', url); } catch { /* */ }
  }, []);

  const handleGameToggle = useCallback(() => {
    addAction(isInGame ? '退出游戏，回到现实' : '进入游戏');
    setIsInGame(prev => !prev);
  }, [isInGame, addAction]);

  // ---- Equipment handlers ----
  // Accept ITEM (not slot) to avoid nested setState (prevents StrictMode double-invocation bug)
  const handleEquipItem = useCallback((item: EquipmentItem, oldItem?: EquipmentItem) => {
    setEquipment(prev => ({ ...prev, [item.slot]: item }));
    setOwnedEquipment(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      return oldItem ? [...filtered, oldItem] : filtered;
    });
    addAction(oldItem ? `装备了 ${item.name}，换下了 ${oldItem.name}` : `装备了 ${item.name}`);
  }, [addAction]);

  const handleUnequipItem = useCallback((item: EquipmentItem) => {
    setEquipment(prev => {
      const next = { ...prev };
      delete next[item.slot];
      return next;
    });
    setOwnedEquipment(prev => [...prev, item]);
    addAction(`卸下了 ${item.name}`);
  }, [addAction]);

  // ---- Fashion handlers ----
  const handleEquipFashion = useCallback((item: FashionItem, oldItem?: FashionItem) => {
    setFashion(prev => ({ ...prev, [item.slot]: item }));
    setOwnedFashion(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      return oldItem ? [...filtered, oldItem] : filtered;
    });
    addAction(oldItem ? `更换时装：${oldItem.name} → ${item.name}` : `穿上时装：${item.name}`);
  }, [addAction]);

  const handleUnequipFashion = useCallback((item: FashionItem) => {
    setFashion(prev => {
      const next = { ...prev };
      delete next[item.slot];
      return next;
    });
    setOwnedFashion(prev => [...prev, item]);
    addAction(`脱下时装：${item.name}`);
  }, [addAction]);

  const handleDiscardItem = useCallback((item: EquipmentItem) => {
    setOwnedEquipment(prev => prev.filter(i => i.id !== item.id));
    addAction(`丢弃了装备：${item.name}`);
  }, [addAction]);

  const handleDiscardFashion = useCallback((item: FashionItem) => {
    setOwnedFashion(prev => prev.filter(i => i.id !== item.id));
    addAction(`丢弃了时装：${item.name}`);
  }, [addAction]);

  // ---- Inventory ----
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 'inv-1', name: '回血丹', type: 'consumable', quality: 'common', quantity: 3, maxStack: 99, description: '一颗散发淡淡药香的红色丹丸，服用后可快速恢复伤势。', effect: '恢复200点生命值', usable: true },
    { id: 'inv-2', name: '灵力药剂', type: 'consumable', quality: 'uncommon', quantity: 2, maxStack: 20, description: '以灵泉水调配的蓝色药剂，入喉清凉，能迅速补充消耗的灵力。', effect: '恢复100点灵力值', usable: true },
    { id: 'inv-3', name: '聚灵丹', type: 'consumable', quality: 'rare', quantity: 1, maxStack: 10, description: '以百年灵芝为主料炼制的珍贵丹药，可永久提升灵力上限。', effect: '永久提升50点灵力上限', usable: true },
    { id: 'inv-4', name: '解毒草', type: 'consumable', quality: 'common', quantity: 5, maxStack: 99, description: '野外常见的草药，嚼碎后敷在伤口可中和大部分常见毒素。', effect: '移除一项中毒类debuff', usable: true },
    { id: 'inv-5', name: '玄铁矿', type: 'material', quality: 'common', quantity: 12, maxStack: 999, description: '采自深山的黑色矿石，质地坚硬，是锻造武器和盔甲的基础材料。', usable: false },
    { id: 'inv-6', name: '灵纹线', type: 'material', quality: 'uncommon', quantity: 8, maxStack: 999, description: '以灵蚕丝捻成的细线，表面泛着微光，用于缝制高级防具和法袍。', usable: false },
    { id: 'inv-7', name: '凤凰羽毛', type: 'material', quality: 'legendary', quantity: 3, maxStack: 99, description: '真正的凤凰尾羽，触之温热，蕴含强大的火元素之力。锻造顶级装备的必备材料。', usable: false },
    { id: 'inv-8', name: '古旧的地图', type: 'key', quality: 'rare', quantity: 1, maxStack: 1, description: '一张泛黄的羊皮地图，上面标记了一处昆仑墟深处的隐藏副本入口。', usable: false },
    { id: 'inv-9', name: '剑灵残魂碎片', type: 'key', quality: 'epic', quantity: 1, maxStack: 1, description: '击败剑灵残影后获得的灵魂碎片，其中似乎封存着一段破碎的记忆。用途不明，但散发着不祥的气息。', usable: false },
  ]);

  const handleUseItem = useCallback((item: InventoryItem) => {
    setPlayer(prev => {
      if (item.id === 'inv-1') return { ...prev, hp: Math.min(prev.hp + 200, prev.maxHp) };
      if (item.id === 'inv-2') return { ...prev, mp: Math.min(prev.mp + 100, prev.maxMp) };
      if (item.id === 'inv-3') return { ...prev, maxMp: prev.maxMp + 50, mp: prev.mp + 50 };
      return prev;
    });
    setInventory(prev => {
      return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
    });
    addAction(`使用了 ${item.name}${item.effect ? '：' + item.effect : ''}`);
  }, [addAction]);

  // ---- Gems ----
  const [ownedGems, setOwnedGems] = useState<Gem[]>([
    { id: 'gem-1', name: '寒霜晶核', quality: 'rare', powerBonus: 30, effect: '攻击时有概率触发冰冻效果，降低目标攻速' },
    { id: 'gem-2', name: '烈焰之心', quality: 'epic', powerBonus: 50, effect: '攻击附带火属性伤害，对冰系敌人伤害翻倍' },
    { id: 'gem-3', name: '守护灵石', quality: 'uncommon', powerBonus: 15, effect: '受到伤害时自动触发护盾，吸收100点伤害' },
    { id: 'gem-4', name: '迅捷符文', quality: 'common', powerBonus: 10, effect: '攻击速度+5%' },
    { id: 'gem-5', name: '吸血魔石', quality: 'legendary', powerBonus: 80, effect: '每次攻击回复造成伤害的5%生命值' },
  ]);

  const handleSocketGem = useCallback((item: EquipmentItem, gem: Gem, socketIndex: number) => {
    const updateItem = (i: EquipmentItem) => {
      if (i.id !== item.id) return i;
      const newGems = [...i.socketedGems];
      // If replacing, put old gem back
      const oldGem = newGems[socketIndex];
      newGems[socketIndex] = gem;
      const bonusChange = gem.powerBonus - (oldGem?.powerBonus || 0);
      if (oldGem) setOwnedGems(prev => [...prev, oldGem]);
      setOwnedGems(prev => prev.filter(g => g.id !== gem.id));
      return { ...i, socketedGems: newGems, gemBonus: i.gemBonus + bonusChange };
    };
    setEquipment(prev => { const next = { ...prev }; for (const s of Object.keys(next) as EquipmentSlot[]) { if (next[s]?.id === item.id && next[s]) next[s] = updateItem(next[s]!); } return next; });
    setOwnedEquipment(prev => prev.map(updateItem));
    addAction(`为 ${item.name} 镶嵌了 ${gem.name}`);
  }, [addAction]);

  // ---- Crafting ----
  const handleCraft = useCallback((slot: EquipmentSlot, materials: InventoryItem[]): EquipmentItem => {
    const highestQuality = materials.reduce((best, m) => {
      return QUALITY_ORDER.indexOf(m.quality) > QUALITY_ORDER.indexOf(best) ? m.quality : best;
    }, 'common' as Quality);
    const basePower = CRAFT_POWER[highestQuality] || 100;
    const matNames = materials.map(m => m.name).join('、');
    const item: EquipmentItem = {
      id: `crafted-${Date.now()}`,
      name: `${materials[0]?.name.split('').slice(0, 2).join('') || '新'}制${SLOT_LABELS[slot]}`,
      slot,
      quality: highestQuality,
      basePower,
      enhanceLevel: 0, enhanceBonus: 0, gemBonus: 0,
      description: `以${matNames}精心打造而成。`,
      source: 'crafted',
      sourceDetail: `由玩家使用${matNames}制作`,
      extraEffect: highestQuality === 'legendary' || highestQuality === 'mythic' ? '精心制作，品质超凡' : undefined,
      maxSockets: Math.floor(Math.random() * 3) + 1,
      socketedGems: [],
    };
    setOwnedEquipment(prev => [...prev, item]);
    setInventory(prev => prev.map(i => materials.find(m => m.id === i.id) ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));
    addAction(`制作了 ${item.name}（${QUALITY_LABELS[highestQuality]}，装等 ${basePower}）`);
    return item;
  }, [addAction]);

  const handleRemoveGem = useCallback((item: EquipmentItem, socketIndex: number) => {
    const updateItem = (i: EquipmentItem) => {
      if (i.id !== item.id) return i;
      const newGems = [...i.socketedGems];
      const removed = newGems[socketIndex];
      if (!removed) return i;
      newGems[socketIndex] = null as unknown as Gem;
      setOwnedGems(prev => [...prev, removed]);
      return { ...i, socketedGems: newGems.filter(Boolean), gemBonus: i.gemBonus - removed.powerBonus };
    };
    setEquipment(prev => { const next = { ...prev }; for (const s of Object.keys(next) as EquipmentSlot[]) { if (next[s]?.id === item.id && next[s]) next[s] = updateItem(next[s]!); } return next; });
    setOwnedEquipment(prev => prev.map(updateItem));
  }, []);

  // ---- Forge / Enhancement ----
  const handleEnhance = useCallback((item: EquipmentItem): { success: boolean; newLevel: number; cost: number } => {
    const base = ENHANCE_COST[item.quality] || 200;
    const cost = Math.floor(base * (item.enhanceLevel + 1) * 1.2);
    const rate = Math.max(5, 100 - item.enhanceLevel * 10);
    const success = Math.random() * 100 < rate;

    if (!success) return { success: false, newLevel: item.enhanceLevel, cost };

    const newLevel = item.enhanceLevel + 1;
    const bonusPerLevel = ENHANCE_BONUS[item.quality] || 10;
    // Update in equipment or ownedEquipment
    const updateItem = (i: EquipmentItem) => i.id === item.id ? { ...i, enhanceLevel: newLevel, enhanceBonus: i.enhanceBonus + bonusPerLevel } : i;
    setEquipment(prev => {
      const next = { ...prev };
      for (const slot of Object.keys(next) as EquipmentSlot[]) {
        if (next[slot]?.id === item.id && next[slot]) next[slot] = updateItem(next[slot]!);
      }
      return next;
    });
    setOwnedEquipment(prev => prev.map(updateItem));
    addAction(`强化 ${item.name} +${item.enhanceLevel} → +${newLevel}（消耗 ${cost.toLocaleString()} G）`);
    return { success: true, newLevel, cost };
  }, [addAction]);

  const handleDiscardInventoryItem = useCallback((item: InventoryItem, count?: number) => {
    const discardCount = count ?? item.quantity;
    setInventory(prev => {
      return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - discardCount } : i).filter(i => i.quantity > 0);
    });
    addAction(discardCount >= item.quantity ? `丢弃了全部 ${item.name}` : `丢弃了 ${item.name} ×${discardCount}`);
  }, [addAction]);

  const handleFashionSave = useCallback((nudeSlots: EquipmentSlot[]) => {
    setFashionNudeSlots(nudeSlots);
    // Recompute using current fashion state
    setFashion(prevFashion => {
      setAppearanceSummary(computeAppearanceSummary(prevFashion, nudeSlots));
      return prevFashion;
    });
  }, [computeAppearanceSummary]);

  return (
    <ToastProvider>
      <GameLayout
        player={player}
        timeLocation={timeLocation}
        zoneInfo={zoneInfo}
        realZoneInfo={realZoneInfo}
        equipment={equipment}
        ownedEquipment={ownedEquipment}
        fashion={fashion}
        ownedFashion={ownedFashion}
        fashionNudeSlots={fashionNudeSlots}
        appearanceSummary={appearanceSummary}
        isInGame={isInGame}
        onRealAvatarChange={handleRealAvatarChange}
        onGameAvatarChange={handleGameAvatarChange}
        onGameToggle={handleGameToggle}
        onEquipItem={handleEquipItem}
        onUnequipItem={handleUnequipItem}
        onDiscardItem={handleDiscardItem}
        onEquipFashion={handleEquipFashion}
        onUnequipFashion={handleUnequipFashion}
        onDiscardFashion={handleDiscardFashion}
        onFashionSave={handleFashionSave}
        inventory={inventory}
        onUseItem={handleUseItem}
        onDiscardInventoryItem={handleDiscardInventoryItem}
        actionLog={actionLog}
        onClearActionLog={clearActionLog}
        onEnhance={handleEnhance}
        onMoneyChange={(delta: number) => setPlayer(prev => ({ ...prev, money: prev.money + delta }))}
        ownedGems={ownedGems}
        onSocketGem={handleSocketGem}
        onRemoveGem={handleRemoveGem}
        onCraft={handleCraft}
        quests={quests}
      />
    </ToastProvider>
  );
}

export default App;
