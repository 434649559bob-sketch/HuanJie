/**
 * State Sync — mirrors entire frontend game state into chat.variables.
 *
 * Called before each AI send (inject current state into prompt)
 * and after each frontend operation (keep variables in sync).
 *
 * Variables are nested objects, accessible by dot-path like ST's system.
 * Example: variables.player.hp, variables.equipment.weapon.name
 */

import type { PlayerState, TimeLocationState, ZoneInfo, RealZoneInfo,
  EquipmentSet, EquipmentItem, FashionSet, FashionItem,
  InventoryItem, BuffDebuff, Skill, Gem, Quest,
} from '../App';

// Re-export the types needed by consumers
export type { PlayerState, TimeLocationState, ZoneInfo, RealZoneInfo,
  EquipmentSet, EquipmentItem, FashionSet, FashionItem,
  InventoryItem, BuffDebuff, Skill, Gem, Quest,
};

// ── simplified contact type (mirrors ContactsPanel data model) ──

export interface SyncContact {
  id: string;
  name: string;
  type: 'player' | 'npc';
  gender?: string;
  gameClass?: string;
  realOccupation?: string;
  title?: string;
  level?: number;
  powerLevel?: number;
  status?: string;
  isPresent?: boolean;
  affection?: number;
  relationship?: string;
  gameLocation?: string;
  realName?: string;
  realAge?: number;
  gameDescription?: string;
  realDescription?: string;
  gameAppearance?: string;
  realAppearance?: string;
  gameAvatarUrl?: string;
  realAvatarUrl?: string;
  lastMessage?: string;
}

// ── main sync function ──

export interface SyncOptions {
  player: PlayerState;
  timeLocation: TimeLocationState;
  zoneInfo: ZoneInfo;
  realZoneInfo: RealZoneInfo;
  equipment: EquipmentSet;
  ownedEquipment: EquipmentItem[];
  fashion: FashionSet;
  ownedFashion: FashionItem[];
  fashionNudeSlots: string[];
  appearanceSummary: string;
  inventory: InventoryItem[];
  ownedGems: Gem[];
  quests: Quest[];
  contacts: SyncContact[];
  isInGame: boolean;
  dungeons?: any[];
  zones?: any[];
}

export function syncAllState(opts: SyncOptions): Record<string, any> {
  const vars: Record<string, any> = {};

  // ── player stats ──
  vars.player = {
    realName: opts.player.realName,
    gameName: opts.player.gameName,
    realOccupation: opts.player.realOccupation,
    gameClass: opts.player.gameClass,
    level: opts.player.level,
    powerLevel: opts.player.powerLevel,
    money: opts.player.money,
    xp: opts.player.xp,
    xpToNext: opts.player.xpToNext,
    hp: opts.player.hp,
    maxHp: opts.player.maxHp,
    mp: opts.player.mp,
    maxMp: opts.player.maxMp,
    actionStatus: opts.player.actionStatus,
    gameAvatarUrl: opts.player.gameAvatarUrl || '',
    realAvatarUrl: opts.player.realAvatarUrl || '',
  };

  // ── player power system ──
  vars.player.corePath = {
    name: opts.player.corePathName,
    tier: opts.player.corePathTier,
    progress: opts.player.corePathProgress,
    desc: opts.player.corePathDesc,
  };
  vars.player.rank = {
    current: opts.player.currentRank || '',
    progress: opts.player.rankProgress || 0,
    next: opts.player.nextRank || '',
  };
  vars.player.resourceName = opts.player.resourceName;

  // ── skills ──
  vars.skills = (opts.player.skills || []).map(s => ({
    id: s.id, name: s.name, type: s.type,
    proficiency: s.proficiency, description: s.description, source: s.source,
  }));

  // ── buffs/debuffs ──
  vars.buffs = {
    game: (opts.player.gameBuffs || []).map(b => ({ name: b.name, effect: b.effect, source: b.source })),
    real: (opts.player.realBuffs || []).map(b => ({ name: b.name, effect: b.effect, source: b.source })),
  };
  vars.debuffs = {
    game: (opts.player.gameDebuffs || []).map(b => ({ name: b.name, effect: b.effect, source: b.source })),
    real: (opts.player.realDebuffs || []).map(b => ({ name: b.name, effect: b.effect, source: b.source })),
  };

  // ── equipment (per slot) ──
  vars.equipment = {};
  const slots: string[] = ['weapon','helmet','armor','gloves','pants','shoes','accessory1','accessory2'];
  for (const slot of slots) {
    const item = opts.equipment[slot as keyof EquipmentSet];
    vars.equipment[slot] = item ? {
      id: item.id, name: item.name, quality: item.quality,
      basePower: item.basePower, enhanceLevel: item.enhanceLevel,
      enhanceBonus: item.enhanceBonus, gemBonus: item.gemBonus,
      description: item.description, source: item.source,
      sourceDetail: item.sourceDetail, extraEffect: item.extraEffect || '',
      gemCount: item.socketedGems.length, maxSockets: item.maxSockets,
    } : null;
  }
  vars.ownedEquipment = (opts.ownedEquipment || []).map(e => ({
    id: e.id, name: e.name, slot: e.slot, quality: e.quality,
    basePower: e.basePower, enhanceLevel: e.enhanceLevel,
  }));

  // ── fashion ──
  vars.fashion = {};
  for (const slot of slots) {
    const item = opts.fashion[slot as keyof FashionSet];
    vars.fashion[slot] = item ? {
      id: item.id, name: item.name, quality: item.quality,
      description: item.description, visualEffect: item.visualEffect,
    } : null;
  }
  vars.fashionNudeSlots = [...opts.fashionNudeSlots];
  vars.appearanceSummary = opts.appearanceSummary;

  // ── inventory ──
  vars.inventory = (opts.inventory || []).map(i => ({
    id: i.id, name: i.name, type: i.type, quality: i.quality,
    quantity: i.quantity, description: i.description, effect: i.effect || '', usable: i.usable,
  }));

  // ── gems ──
  vars.gems = (opts.ownedGems || []).map(g => ({
    id: g.id, name: g.name, quality: g.quality, powerBonus: g.powerBonus, effect: g.effect,
  }));

  // ── time & location ──
  vars.time = {
    real: opts.timeLocation.realTime,
    game: opts.timeLocation.gameTime,
  };
  vars.location = {
    real: opts.timeLocation.realLocation,
    game: opts.timeLocation.gameLocation,
    world: opts.timeLocation.worldName,
  };

  // ── zone ──
  vars.zone = {
    name: opts.zoneInfo.zoneName,
    type: opts.zoneInfo.zoneType,
    coefficient: opts.zoneInfo.coefficient,
    powerMatch: opts.zoneInfo.powerSystemMatch,
    description: opts.zoneInfo.description,
  };

  // ── reality ──
  vars.reality = {
    dangerLevel: opts.realZoneInfo.dangerLevel,
    description: opts.realZoneInfo.description,
  };

  // ── fusion ──
  vars.fusion = {
    rate: opts.timeLocation.fusionRate,
    isInGame: opts.isInGame,
  };

  // ── contacts ──
  vars.contacts = (opts.contacts || []).map(c => ({
    id: c.id, name: c.name, type: c.type, gender: c.gender || '',
    gameClass: c.gameClass || '', realOccupation: c.realOccupation || '',
    title: c.title || '', level: c.level || 0, powerLevel: c.powerLevel || 0,
    status: c.status || 'offline', isPresent: c.isPresent || false,
    affection: c.affection || 0, relationship: c.relationship || '',
    gameLocation: c.gameLocation || '', realName: c.realName || '',
    realAge: c.realAge || 0,
    gameDescription: c.gameDescription || '', realDescription: c.realDescription || '',
    gameAppearance: c.gameAppearance || '', realAppearance: c.realAppearance || '',
  }));

  // ── quests ──
  vars.quests = (opts.quests || []).map(q => ({
    id: q.id, name: q.name, type: q.type, status: q.status,
    description: q.description, giver: q.giver, location: q.location,
    objectives: (q.objectives || []).map(o => ({
      id: o.id, description: o.description, current: o.current, required: o.required,
    })),
    rewards: {
      xp: q.rewards.xp || 0, money: q.rewards.money || 0,
      items: q.rewards.items || [], title: q.rewards.title || '',
    },
  }));

  return vars;
}

/**
 * Format the synced state as a prompt block for the AI.
 * Produces a human-readable status summary grouped by category.
 */
export function formatStateForPrompt(vars: Record<string, any>): string {
  const lines: string[] = [];
  const p = vars.player || {};
  const l = vars.location || {};
  const t = vars.time || {};
  const z = vars.zone || {};
  const f = vars.fusion || {};
  const r = vars.reality || {};

  lines.push('## 当前状态');
  lines.push('');
  lines.push('### 玩家');
  lines.push(`${p.gameName} / ${p.realName} | ${p.gameClass} | Lv.${p.level} | 战力 ${p.powerLevel}`);
  lines.push(`HP: ${p.hp}/${p.maxHp} | MP: ${p.mp}/${p.maxMp} | 金钱: ${p.money} G | XP: ${p.xp}/${p.xpToNext}`);
  if (p.corePath) lines.push(`功法: ${p.corePath.name} ${p.corePath.tier} (${p.corePath.progress}%)`);
  if (p.rank) lines.push(`境界: ${p.rank.current} → ${p.rank.next} (${p.rank.progress}%)`);
  lines.push(`状态: ${p.actionStatus}`);

  // Equipment summary
  const eq = vars.equipment || {};
  const eqSlots = ['weapon','armor','helmet','gloves','pants','shoes'];
  const eqParts = eqSlots.filter((s: string) => eq[s]).map((s: string) => `${s}:${eq[s].name}(+${eq[s].enhanceLevel})`);
  if (eqParts.length > 0) lines.push(`装备: ${eqParts.join(' | ')}`);

  // Inventory summary
  const inv = vars.inventory || [];
  if (inv.length > 0) {
    const invSummary = inv.slice(0, 10).map((i: any) => `${i.name}×${i.quantity}`).join(', ');
    lines.push(`背包: ${invSummary}${inv.length > 10 ? ` 等${inv.length}种物品` : ''}`);
  }

  // Buffs/debuffs
  const gameBuffs = vars.buffs?.game || [];
  const gameDebuffs = vars.debuffs?.game || [];
  if (gameBuffs.length > 0) lines.push(`增益: ${gameBuffs.map((b: any) => b.name).join(', ')}`);
  if (gameDebuffs.length > 0) lines.push(`减益: ${gameDebuffs.map((b: any) => b.name).join(', ')}`);

  // Skills
  const skills = vars.skills || [];
  if (skills.length > 0) {
    lines.push(`技能: ${skills.map((s: any) => `${s.name}(${s.proficiency}%)`).join(', ')}`);
  }

  // Time & location
  lines.push('');
  lines.push('### 时空');
  lines.push(`游戏: ${l.game} | ${t.game} | ${l.world} | 区域系数 ×${z.coefficient}`);
  lines.push(`现实: ${l.real} | ${t.real} | 危险度 ${r.dangerLevel}`);

  // Fusion
  lines.push('');
  lines.push('### 融合');
  lines.push(`融合度: ${f.rate}% | 当前: ${f.isInGame ? '游戏世界' : '现实世界'}`);

  // Contacts (present only)
  const contacts = vars.contacts || [];
  const presentContacts = contacts.filter((c: any) => c.isPresent);
  if (presentContacts.length > 0) {
    lines.push('');
    lines.push('### 在场角色');
    for (const c of presentContacts) {
      lines.push(`${c.name}(${c.title || c.gameClass || c.type}) | 好感 ${c.affection} | ${c.relationship || ''}`);
    }
  }

  // Quests (active only)
  const quests = vars.quests || [];
  const activeQuests = quests.filter((q: any) => q.status === 'active');
  if (activeQuests.length > 0) {
    lines.push('');
    lines.push('### 进行中的任务');
    for (const q of activeQuests) {
      const completed = q.objectives.filter((o: any) => o.current >= o.required).length;
      lines.push(`${q.name}[${q.type}] ${q.giver ? '—'+q.giver : ''} | 目标 ${completed}/${q.objectives.length}`);
    }
  }

  return lines.join('\n');
}
