# 设计备忘

> 本文档记录项目中悬而未决的设计问题，待后续讨论确定后移入正式规格。

---

## 项目进度 · 2026-07-14

### 已完成 ✅

| 模块 | 功能 | 文件 |
|------|------|------|
| **整体架构** | Vite + React 19 + TypeScript 三栏布局 | `GameLayout.tsx` |
| **设计系统** | 全局 CSS 变量（暗色主题、品质色、间距、动效） | `index.css` |
| **左侧面板** | 时间/位置（双世界 + 区块系数 + 融合度） | `TimeLocationBar.tsx` |
| | 玩家卡片（双名/双职业/战力/HP·MP/Buff·Debuff/金钱/登录切换） | `PlayerCard.tsx` |
| | 玩家详情弹窗（装备/时装标签页、背包、力量体系） | `PlayerDetailModal.tsx` |
| | 区块信息弹窗 ×2（现实地区危险度 + 游戏区块系数） | `ZoneInfoModal.tsx`, `RealZoneModal.tsx` |
| | 融合度弹窗（六阶段时间轴） | `FusionModal.tsx` |
| | Buff/Debuff 详情弹窗 | `BuffDetailModal.tsx` |
| **装备系统** | 8槽位装备 + 持有装备池 + 装备/卸下/替换 | `App.tsx` handlers |
| | 品质/强化/孔位/宝石 统一常量 | `App.tsx` exports |
| | 时装系统（裸/显示装备切换 + 外观总结） | `PlayerDetailModal.tsx` |
| **背包** | 消耗品/材料/关键道具 + 使用/丢弃 + 分类筛选 | `PlayerDetailModal.tsx` InventoryTab |
| **技能系统** | 核心功法/阶位/资源 + 进攻/防御/功能技能 + 熟练度阶梯 | `PlayerDetailModal.tsx` PowerTab |
| **中间正文区** | 故事渲染（旁白/对话/动作/系统）+ 世界标签 | `CenterPanel.tsx` |
| | 操作记录槽 + 注入预览 + 输入发送 | `CenterPanel.tsx` |
| | 所有状态变更自动记录（装备/使用/丢弃/切换） | `App.tsx` actionLog |
| **右侧面板** | 对称面板 + 槽位列表 + 覆盖层展开 | `RightPanel.tsx` |
| | 角色联系人（玩家/NPC分组 + 聊天 + 详情含隐私NSFW） | `ContactsPanel.tsx` |
| | 锻造（强化/镶嵌/制作三标签） | `ForgePanel.tsx` |
| | 世界（区域列表 + 流言/角色/奇遇） | `WorldPanel.tsx` |
| | 任务（主线/支线/日常 + 目标追踪 + 奖励预览） | `QuestPanel.tsx` |
| | 副本（故事/挑战切换 + 单人/组队/匹配 + 寻找副本AI生成） | `DungeonPanel.tsx` |
| **跨世界观** | 品质/强化/制作/熟练度 统一参数 | `App.tsx` 常量导出 |
| | 力量体系通用模型（成长路径/阶位/技能） | design-notes §2 |
| **UI特性** | 游戏/现实双层面板亮灭 | 全局 opacity |
| | 融合度≥70%全亮 | `GameLayout.css` |
| | 移动端适配 | 各组件 @media |
| | Toast 通知系统 | `ToastProvider.tsx` |
| **设计文档** | 战斗力系数/力量体系/融合机制/双来源状态/变量汇总 | design-notes §1-9 |

### 待做 🔲

| 优先级 | 功能 |
|--------|------|
| 🔴 | **变量系统** — LLM 通过正文提取变量驱动前端状态变更 |
| 🔴 | **存档/读档** — localStorage 序列化全状态 |
| 🔴 | **设置面板** — API Key、主题配色、AI 预设 |
| 🟡 | 图鉴（怪物/物品/Lore） |
| 🟡 | 商店（购买消耗品/材料） |
| 🟡 | 剧情回顾/时间线 |
| 🟢 | 世界书/提示词管理 |
| 🟢 | 关系网络图可视化 |
| 🟢 | 多人/SNS 功能 |

---

## 1. 战斗力系数系统

**背景**：玩家自身有一个基础战斗力值。进入不同世界观区域时，根据力量体系匹配度乘以一个系数，得到当前有效战斗力。

**举例**：
- 修仙界系数 1.2，一个修仙者基础战力 1000 → 有效战力 1200
- 废土世界（无异能）系数 0.2，同一个修仙者进入 → 有效战力 200
- 西幻世界战士进入修仙界，若力量体系不匹配，系数可能低于本地人

**待讨论**：
- [ ] 系数计算规则：是否只取决于"力量体系匹配度"一个维度？
- [ ] 系数范围：最低/最高各是多少？是否需要下限（防止战力归零）？
- [ ] 多世界观跨界：如果一个角色同时拥有多个力量体系，系数如何计算？
- [ ] 系数是否动态变化：随融合度变化？随区域稳定度变化？
- [ ] 新地区出现时，系数由谁定义？前端如何自动获取？
- [ ] 系数显示位置：在玩家卡片战力旁显示？在位置信息中显示？

---

## 2. 多世界观的统一力量体系（✅ 已实现 v1）

### 通用数据模型

经过六大体系分析，提出以下最大公约数结构：

```ts
interface PowerSystem {
  worldType: string;           // '修仙' | '武侠' | '西幻' | '赛博朋克' | '废土' | '克苏鲁'
  
  // ── 核心功法/路径 ──
  corePathName: string;        // "通明剑诀" / "九阳神功" / "元素魔法精通" / "义体改造" / "枪械精通"
  corePathRank: string;        // "第七重" / "大成" / "Expert" / "Tier 3"
  corePathProgress: number;    // 0-100 当前阶段进度
  corePathDesc: string;        // 功法描述
  
  // ── 进阶境界 ── (可选，修仙/武侠有，赛博/废土可无)
  realmName?: string;          // "金丹期" / "先天境"
  realmProgress?: number;      // 0-100 当前境界进度
  nextRealm?: string;          // "元婴期" / "化境"

  // ── 特殊资源 ──
  resourceName: string;        // "灵力" / "内力" / "魔力" / "能量" / "理智"
  
  // ── 已掌握能力 ──
  abilities: Ability[];
}

interface Ability {
  id: string;
  name: string;                // "霜月剑法" / "火球术" / "螳螂刀"
  level: number;
  maxLevel: number;
  type: 'offense' | 'defense' | 'utility' | 'movement' | 'passive';
  description: string;
}
```

### UI 布局草案

```
┌─ 力量体系 ──────────────────────────────────────┐
│                                                   │
│  世界观：修仙                                     │
│                                                   │
│  ┌─ 核心功法 ──────────────────────────────────┐ │
│  │ 通明剑诀 · 第七重                           │ │
│  │ ████████░░░░░ 78% 至第八重                  │ │
│  │ 剑修一脉上乘功法，以心御剑，人剑合一          │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─ 进阶境界 ──────────────────────────────────┐ │
│  │ 金丹期 → 元婴期                              │ │
│  │ ████████░░░ 76%                             │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─ 灵力 ──────────────────────────────────────┐ │
│  │ ████████░░░░░░ 360/600                      │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─ 已掌握能力 ────────────────────────────────┐ │
│  │ ⚔ 霜月剑法 Lv.5/10   以寒气凝于剑身          │ │
│  │ ➤ 轻身术 Lv.3/10     灵力灌注双足            │ │
│  │ ✦ 剑气化形 Lv.2/10   将剑气凝聚为实体         │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 各世界观示例

| 字段 | 修仙 | 西幻 | 赛博朋克 |
|------|------|------|----------|
| corePathName | 通明剑诀 | 元素魔法精通 | 全身义体改造 |
| corePathRank | 第七重 | Expert | Tier 3 |
| realmName | 金丹期 | — | — |
| resourceName | 灵力 | 魔力 | 能量 |
| 能力示例 | 霜月剑法、剑气化形 | 火球术、寒冰护盾 | 螳螂刀、纳米装甲 |

### 待讨论

- [ ] 这个模型覆盖你的需求了吗？有没有我想漏的？
- [ ] 玩家可以拥有多个力量体系吗？（跨世界观收集）
- [ ] 能力的 maxLevel 统一 10 还是各体系不同？
- [ ] 特殊资源：MP 已经有一个条了，要在这里再画一个还是复用？

---

## 3. 世界融合机制

**背景**：终极主线是游戏世界与现实世界融合。融合前会出现空间不稳定等非常规现象。

**待讨论**：
- [ ] 融合度的增长机制：由玩家行为驱动？由时间驱动？由剧情节点驱动？
- [ ] 融合度阈值事件：30%/50%/70%/100% 时分别触发什么？
- [ ] 现实世界在融合过程中的具体表现？
- [ ] 玩家在两个世界间的切换权限如何随融合度变化？

---

## 4. 时装系统细节

**待讨论**：
- [ ] 时装是否提供属性加成？（目前设计中纯外观 vs 有属性）
- [ ] 时装的获取方式：商城购买？副本掉落？锻造制作？
- [ ] "不穿=裸体"的边界：是否需要在设置中增加"安全模式"开关？

---

## 5. 存档系统

**待讨论**：
- [ ] 存档粒度：自动存档 + 手动存档？
- [ ] 存档存储位置：localStorage？云端（需要后端）？
- [ ] 存档内容：完整游戏状态 + AI对话历史？

---

## 6. 多人/SNS 功能

**待讨论**：
- [ ] 是否需要多人同时在线？
- [ ] 玩家间互动形式：交易？组队？PK？
- [ ] 社交面板的具体功能列表？

---

## 7. LLM 驱动的状态变量汇总

**背景**：前端当前所有状态变化由手动按钮触发（登录/退出、装备/卸下等）。实际运行时，LLM 后端处理正文后应返回两样东西：① 叙事正文 ② 状态变更补丁。前端应用补丁更新 UI。

### 7.1 接口设计思路

LLM 每轮返回结构：

```ts
interface TurnResponse {
  narrative: string;           // 正文，前端直接追加到故事区
  statePatch: Partial<GameStateSnapshot>;  // 只包含变更的字段
  speaker?: string;            // 当前说话的NPC名（可选）
}
```

前端收到后：
1. 将 `narrative` 追加到正文区
2. 将 `statePatch` 浅合并到本地状态
3. 根据变化自动更新 UI（react 响应式）

### 7.2 完整状态快照（GameStateSnapshot）

```ts
interface GameStateSnapshot {
  // ── 世界 ──
  isInGame: boolean;           // 玩家是否在游戏中
  fusionRate: number;          // 两界融合度 0-100
  realTime: string;            // 现实时间，如 "14:30"
  gameTime: string;            // 游戏时间，如 "星历847年·霜月"
  realLocation: string;        // 现实位置
  gameLocation: string;        // 游戏位置
  worldName: string;           // 当前游戏世界名
  zoneCoefficient: number;     // 当前区块战力系数
  zoneType: string;            // 区块类型（修仙/西幻/废土…）
  powerSystemMatch: boolean;   // 力量体系是否匹配
  realDangerLevel: number;     // 现实地区危险度 0-100

  // ── 玩家 ──
  realName: string;
  gameName: string;
  realOccupation: string;
  gameClass: string;
  level: number;
  powerLevel: number;          // 自身基础战力
  money: number;               // 1:1 通用货币
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;

  // ── 状态效果 ──
  gameBuffs: BuffDebuff[];     // 游戏 buff
  gameDebuffs: BuffDebuff[];   // 游戏 debuff
  realBuffs: BuffDebuff[];     // 现实 buff
  realDebuffs: BuffDebuff[];   // 现实 debuff
  actionStatus: string;        // 当前行为叙述

  // ── 装备 ──
  equipment: Record<string, EquipmentItem | null>;  // 8槽位
  ownedEquipment: EquipmentItem[];                   // 持有装备池
  fashion: Record<string, FashionItem | null>;       // 8槽位时装
  ownedFashion: FashionItem[];                       // 持有时装池
  fashionNudeSlots: string[];   // 标记裸露的槽位

  // ── 外观 ──
  appearanceSummary: string;    // 外观一句话总结
  realAvatarUrl: string;
  gameAvatarUrl: string;
}
```

### 7.3 常见 LLM→前端 状态变更场景

| 场景 | LLM 从正文提取 | statePatch |
|------|---------------|------------|
| 玩家进入/退出游戏舱 | "你躺进游戏舱，意识沉入昆仑墟" | `{ isInGame: true }` |
| 战斗受伤 | "剑灵残影一剑划过你的左肩" | `{ hp: 680, gameDebuffs: [...加"经脉受损"] }` |
| 获得装备 | "剑灵残影消散后，地上留下一柄泛着寒光的长剑" | `{ ownedEquipment: [...加"寒霜剑"] }` |
| 换装备 | "你换上寒霜剑" | `{ equipment: { weapon: "寒霜剑" }, ownedEquipment: [...移除] }` |
| 区域切换 | "穿过传送门，你来到了废土世界" | `{ worldName: "废土", zoneCoefficient: 0.2, gameLocation: "..." }` |
| 融合推进 | "石碑上的刻字又红了几分" | `{ fusionRate: 15.2 }` |
| 获得buff | "饮下聚灵丹，灵力在经脉中奔涌" | `{ gameBuffs: [...加"灵力奔涌"] }` |
| 现实事件 | "熬夜赶论文到凌晨三点" | `{ realDebuffs: [...加"严重缺觉"] }` |
| 花钱 | "你掏出五十枚铜板递给铁匠" | `{ money: 15750 }` |
| 升级 | "一道金光闪过，你突破了" | `{ level: 48, powerLevel: 8560 }` |

### 7.4 前端需要预留的接口

当前阶段（纯前端原型）建议：

1. **抽出一个 `applyStatePatch` 工具函数** — 接收 `Partial<GameStateSnapshot>`，合并到所有相关 `useState`。后续接入 LLM 只需改这个函数的调用来源。

2. **CenterPanel 的注入预览已经预留了发送接口的位置** — `handleSend` 函数中的 `injectionPreview` 就是模拟 LLM 收到的上下文。后续替换为实际 API 调用即可。

3. **状态序列化/反序列化** — 存档系统需要。当前所有状态散落在多个 `useState` 中，建议后续用 `useReducer` 或 Zustand 统一管理，方便一键导出/导入。

4. **WebSocket/SSE 预留** — LLM 响应可能很长（流式生成正文），需要流式接收。正文区需要支持增量追加而非整块替换。

---

## 8. 双来源状态修改的风险分析与对策

### 当前架构

状态修改有两个来源，当前都能工作：

| 来源 | 触发方式 | 延迟 | 当前状态 |
|------|---------|------|---------|
| 前端操作 | 玩家点击按钮 → handler → setState | 即时 | ✅ 装备/背包/登录等全部就绪 |
| AI 修改 | LLM 返回 statePatch → 合并到 state | 2-5秒 | 🔲 尚未接入，但接口已预留 |

### 风险清单

**1. 竞态覆盖（高风险）**

玩家卸下霜月 → 同时 AI 返回"你获得了霜月"（基于旧状态）→ 前端出现两把霜月。

**根本原因**：AI 延迟 2-5 秒，期间前端状态已变化，AI 的 patch 基于旧快照。

**2. 物品重复/丢失（高风险）**

前端 equip 把破军装到武器槽 → AI patch 说 `equipment.weapon = null`（因为 AI 看到的状态是破军还在背包里）→ 破军凭空消失。

**3. 状态冲突（中风险）**

玩家点使用回血丹（HP+200）→ AI 也处理了"你喝下回血丹"（HP+200）→ HP 加了两次。

**4. 乐观更新回滚困难（低风险）**

前端操作是乐观的（假设成功）。如果 AI 后续返回"这个操作其实失败了"（比如解毒草对高阶毒无效），前端需要回滚。当前没有回滚机制。

### 推荐对策

**方案 A：操作指令制（推荐）**

前端不直接改状态，而是发送"操作指令"给 AI，AI 统一返回状态变更。前端在等待期间显示加载态。

```
玩家点"使用回血丹"
  → 前端发送 { action: 'use_item', itemId: 'inv-1' }
  → 输入框禁用，显示"…"
  → AI 返回 { narrative: "你服下回血丹…", statePatch: { hp: 1024 } }
  → 前端应用 patch
```

优点：无竞态，AI 是唯一真相源
缺点：每次操作有延迟，体验不够即时

**方案 B：乐观更新 + 序列号（平衡方案）**

前端立即应用操作效果，同时发送操作到 AI。AI 返回时附带操作序列号，前端检查是否过时。

```
每个操作带 seq: number
前端: 使用回血丹(seq=42), HP+200 乐观更新
AI 返回: seq=42, 确认 HP+200  ✓ 无事发生
AI 返回: seq=42, HP+0（解毒失败）→ 回滚 HP
```

优点：即时响应 + 有冲突检测
缺点：实现复杂度较高，需要回滚逻辑

**方案 C：混合模式（实用方案）**

区分操作类型：

| 操作类型 | 处理方式 |
|---------|---------|
| 使用消耗品 | 乐观更新，AI 后续确认。简单数值加减不太会冲突 |
| 装备/卸下 | 乐观更新，物品移动不太会冲突 |
| 剧情关键操作 | 等待 AI 确认后再应用（如销毁关键道具、改变融合度） |
| AI 主动修改 | AI 的 statePatch 始终基于最新的前端状态快照（前端每次请求带上状态摘要） |

每次发请求时附带关键状态摘要：
```ts
const snapshot = { hp, mp, equipmentIds, inventoryIds, isInGame, fusionRate };
// 发送给 AI，AI 基于此做判断
```

优点：大部分操作即时，关键操作安全
缺点：需要区分"安全操作"和"关键操作"

### 当前建议

现阶段（原型开发）不需要过度设计。等接入 AI 时，先用**方案 C 混合模式**：
1. 前端操作照旧乐观更新（已经写好了）
2. 发请求时附带当前状态摘要
3. AI 返回的 patch 做基础校验（HP 不超上限、物品 ID 存在等）
4. 遇到冲突时以 AI 为准，前端静默修正

---

## 9. 动态部位开发系统的健壮性

`BodyPart[]` 数组天然支持动态增减，AI 可在 statePatch 中：
- 新增部位（腋下、乳头、阴蒂...）
- 修改 tags（隆胸后 B杯→D杯、开发后 未开发→已开发）
- 修改等级和使用次数

前端防护：
- 进度条 `maxLevel > 0` 哨兵防止除以零
- `.map()` 空数组安全
- tags 数组为空时正常渲染
- 所有字段均为可选展示，不依赖固定数量

---

## 10. 发送给 AI 的完整上下文数据（非正文 API）

每次对话回合，前端需将以下结构化数据随玩家输入一起发送。AI 基于此数据生成正文并提取状态变更。

### 10.1 请求体结构

```
POST /api/turn
{
  playerInput: string,          // 玩家文本输入
  actionLog: ActionEntry[],     // 当前回合内的前端操作
  context: GameContext,         // 完整游戏状态
  history: Message[],           // 对话历史（最近N条）
}
```

### 10.2 GameContext（核心上下文）

```ts
interface GameContext {
  // ── 世界 ──
  isInGame: boolean;
  fusionRate: number;
  realTime: string;
  gameTime: string;
  realLocation: string;
  gameLocation: string;
  worldName: string;
  zoneCoefficient: number;
  zoneType: string;
  powerSystemMatch: boolean;
  realDangerLevel: number;

  // ── 玩家 ──
  player: {
    realName: string;
    gameName: string;
    realOccupation: string;
    gameClass: string;
    level: number;
    xp: number; xpToNext: number;
    powerLevel: number;
    effectivePower: number;     // powerLevel × zoneCoefficient
    money: number;
    hp: number; maxHp: number;
    mp: number; maxMp: number;
    gameBuffs: BuffDebuff[];
    gameDebuffs: BuffDebuff[];
    realBuffs: BuffDebuff[];
    realDebuffs: BuffDebuff[];
    actionStatus: string;
    // 力量体系
    corePathName: string;
    corePathTier: string;
    corePathProgress: number;
    currentRank?: string;
    rankProgress?: number;
    nextRank?: string;
    resourceName: string;
    skills: Skill[];
    // 外观
    appearanceSummary: string;
  };

  // ── 装备 ──
  equipment: Record<string, EquipmentItem>;  // 8槽位
  ownedEquipment: EquipmentItem[];
  fashion: Record<string, FashionItem>;
  ownedFashion: FashionItem[];
  fashionNudeSlots: string[];

  // ── 背包 ──
  inventory: InventoryItem[];

  // ── 宝石 ──
  ownedGems: Gem[];

  // ── 联系人（仅在场和最近对话过的）──
  relevantContacts: {
    id: string; name: string; type: 'player'|'npc';
    isPresent: boolean; relationship: string;
  }[];

  // ── 任务（仅进行中）──
  activeQuests: Quest[];

  // ── 世界区域（当前位置相关信息）──
  currentZone: {
    name: string; worldName: string; description: string;
    rumors: string[]; characters: string[];
  };
}
```

### 10.3 各功能的 API 数据量估算

| 数据块 | 字段数 | 典型大小 |
|--------|--------|---------|
| 玩家基础 | ~30 | ~1KB |
| 装备+宝石 | ~15条 | ~3KB |
| 背包 | ~9种 | ~1.5KB |
| 技能 | ~6个 | ~1KB |
| 联系人 | ~3-5人（在场+最近） | ~0.5KB |
| 任务 | ~4-5个（进行中） | ~2KB |
| 区域 | 1个 | ~0.5KB |
| **合计** | | **~10KB** |

### 10.4 单独 API 调用（非每回合）

以下功能有独立的 API 端点，不在每回合的上下文中：

| 端点 | 用途 | 发送数据 |
|------|------|---------|
| `POST /api/generate-dungeon` | 寻找副本 | worldType, theme, synopsis, dangerLevel, desiredReward, playerLevel, playerClass, existingNames |
| `POST /api/craft-equipment` | 制作装备 | slot, materials[{name,quality,description}], playerLevel |
| `POST /api/generate-zone` | 新区域发现 | location, worldName, playerLevel |
| `POST /api/refresh-rumors` | 刷新流言 | zoneName, worldName, recentEvents[] |

---

*最后更新：2026-07-14*
