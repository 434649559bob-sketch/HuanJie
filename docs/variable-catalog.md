# Nexus Realm 完整变量清单

> 原则：前端里用户能看到的一切信息都是变量。前端操作直接更新变量（如锻造扣材料加装备），不依赖 AI。

---

## 🎮 玩家基础属性（PlayerCard + PlayerDetailModal）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `gameName` | 游戏名 | string | App.tsx player | 夜煞 |
| `gameClass` | 游戏职业 | string | App.tsx player | 剑修 |
| `level` | 等级 | number | App.tsx player | 47 |
| `powerLevel` | 基础战力 | number | App.tsx player | 8240 |
| `money` | 金钱 | number | App.tsx player | 15800 |
| `xp` | 经验值 | number | App.tsx player | 28400 |
| `xpToNext` | 升级需经验 | number | App.tsx player | 50000 |
| `hp` | 生命值 | number | App.tsx player | 820 |
| `maxHp` | 最大生命值 | number | App.tsx player | 1024 |
| `mp` | 灵力值 | number | App.tsx player | 360 |
| `maxMp` | 最大灵力值 | number | App.tsx player | 600 |
| `actionStatus` | 当前动作 | string | App.tsx player | 盘坐调息中… |
| `gameAvatarUrl` | 游戏头像 | string | App.tsx player | base64 |

## 🎮 功法境界（PlayerDetailModal → PowerTab）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `corePathName` | 核心功法 | string | App.tsx player | 剑修 |
| `corePathTier` | 功法阶位 | string | App.tsx player | 第七重 |
| `corePathProgress` | 功法进度 | number | App.tsx player | 78 |
| `corePathDesc` | 功法描述 | string | App.tsx player | 以心御剑，人剑合一… |
| `currentRank` | 当前境界 | string | App.tsx player | 金丹期 |
| `rankProgress` | 境界进度 | number | App.tsx player | 76 |
| `nextRank` | 下一境界 | string | App.tsx player | 元婴期 |
| `resourceName` | 资源名称 | string | App.tsx player | 灵力 |

## 🎮 技能（PlayerDetailModal → PowerTab）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `skills` | 技能列表 | object[] | App.tsx player.skills | [{id, name, type, proficiency(0-100), description, source}] |

## 🎮 装备（PlayerDetailModal → EquipmentTab / ForgePanel）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `equipment` | 当前装备 | object | App.tsx equipment | {weapon?, helmet?, armor?, gloves?, pants?, shoes?, accessory1?, accessory2?} |
| `ownedEquipment` | 持有装备 | object[] | App.tsx ownedEquipment | 背包里未装备的 |
| `equipment.{slot}.id` | 装备ID | string | 装备项 | |
| `equipment.{slot}.name` | 装备名 | string | 装备项 | 霜月 / 云纹道袍 |
| `equipment.{slot}.quality` | 品质 | string | 装备项 | common~mythic |
| `equipment.{slot}.basePower` | 基础装等 | number | 装备项 | |
| `equipment.{slot}.enhanceLevel` | 强化等级 | number | 装备项 | +8 |
| `equipment.{slot}.gemBonus` | 宝石加成 | number | 装备项 | |
| `equipment.{slot}.source` | 来源 | string | 装备项 | dungeon / crafted |
| `equipment.{slot}.socketedGems` | 镶嵌宝石 | object[] | 装备项 | [{id, name, quality, powerBonus, effect}] |

## 🎮 时装（PlayerDetailModal → FashionTab）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `fashion` | 当前时装 | object | App.tsx fashion | {helmet?, armor?, gloves?, pants?, shoes?, weapon?, accessory1?, accessory2?} |
| `ownedFashion` | 持有时装 | object[] | App.tsx ownedFashion | |
| `fashionNudeSlots` | 裸露槽位 | string[] | App.tsx | 标记为裸露不显示时装的槽位 |
| `appearanceSummary` | 外观总结 | string | App.tsx | 外观｜头部：霜雪发冠，上身：墨染流云袍 |

## 🎮 背包（PlayerDetailModal → InventoryTab）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `inventory` | 背包物品 | object[] | App.tsx inventory | [{id, name, type(consumable/material/key), quality, quantity, maxStack, description, effect?, usable}] |

## 🎮 宝石（ForgePanel → SocketTab）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `ownedGems` | 持有宝石 | object[] | App.tsx ownedGems | [{id, name, quality, powerBonus, effect}] |

## 🎮 状态效果（PlayerCard + BuffDetailModal）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `gameBuffs` | 游戏增益 | object[] | App.tsx player | [{name, effect, source}] |
| `gameDebuffs` | 游戏减益 | object[] | App.tsx player | [{name, effect, source}] |

## 🎮 锻造（ForgePanel — 前端操作直接修改变量）

| 操作 | 影响的变量 | 说明 |
|------|----------|------|
| 强化装备 `onEnhance` | `money -= cost`, `equipment.{slot}.enhanceLevel += 1`, `equipment.{slot}.enhanceBonus += N` | 前端直接改，AI 不需要处理 |
| 镶嵌宝石 `onSocketGem` | `ownedGems 减宝石`, `equipment.{slot}.socketedGems 加宝石`, `equipment.{slot}.gemBonus +=` | 前端直接改 |
| 卸下宝石 `onRemoveGem` | `ownedGems 加宝石`, `equipment.{slot}.socketedGems 减宝石` | 前端直接改 |
| 制作装备 `onCraft` | `inventory 减材料`, `ownedEquipment 加新装备` | 前端直接改 |
| 装备 `onEquipItem` | `equipment.{slot} = item`, `ownedEquipment 减 item` | 前端直接改 |
| 卸装备 `onUnequipItem` | `ownedEquipment 加 item`, `equipment.{slot} = null` | 前端直接改 |
| 使用道具 `onUseItem` | `hp/mp 变化`, `inventory 减 quantity` | 前端直接改 |
| 丢弃道具 `onDiscardInventoryItem` | `inventory 减 quantity` | 前端直接改 |

## 🏠 现实（PlayerCard + TimeLocationBar）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `realName` | 真实姓名 | string | App.tsx player | 林小夜 |
| `realOccupation` | 现实身份 | string | App.tsx player | 大学生 |
| `realLocation` | 现实位置 | string | App.tsx timeLocation | 家中·游戏舱 |
| `realBuffs` | 现实增益 | object[] | App.tsx player | |
| `realDebuffs` | 现实减益 | object[] | App.tsx player | |
| `realAvatarUrl` | 现实头像 | string | App.tsx player | base64 |

## 🌍 时间位置（TimeLocationBar）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `realTime` | 现实时间 | string | App.tsx timeLocation | 14:30 |
| `gameTime` | 游戏时间 | string | App.tsx timeLocation | 星历847年·霜月·第十五日 |
| `gameLocation` | 游戏位置 | string | App.tsx timeLocation | 昆仑墟·第三层·云顶剑阁 |
| `worldName` | 当前世界 | string | App.tsx timeLocation | 昆仑墟 |

## 🌍 区域（ZoneInfoModal + RealZoneModal）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `zoneName` | 区域名 | string | App.tsx zoneInfo | 昆仑墟·云顶剑阁 |
| `zoneType` | 区域类型 | string | App.tsx zoneInfo | 修仙 |
| `zoneCoefficient` | 战力系数 | number | App.tsx zoneInfo | 1.2 |
| `zonePowerMatch` | 体系匹配 | boolean | App.tsx zoneInfo | true |
| `zoneDesc` | 区域描述 | string | App.tsx zoneInfo | 修仙界区块，灵气充沛… |
| `realDangerLevel` | 现实危险度 | number | App.tsx realZoneInfo | 0 |
| `realZoneDesc` | 现实描述 | string | App.tsx realZoneInfo | 目前一切正常… |

## 🌍 双界融合（FusionModal）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `fusionRate` | 融合度 | number | App.tsx timeLocation | 8 |
| `isInGame` | 是否在线 | boolean | App.tsx | true |
| `fusionPhase` | 融合阶段 | string | 计算 | 萌芽期/渗透期/侵蚀期/临界期/崩坏期/终焉 |

## 👥 联系人（ContactsPanel — 3视图：列表/聊天/详情）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `contacts` | 联系人列表 | object[] | ContactsPanel | |
| `contacts[].id` | ID | string | |
| `contacts[].name` | 游戏名 | string | |
| `contacts[].type` | 类型 | string | player / npc |
| `contacts[].gameClass` | 游戏职业 | string | |
| `contacts[].level` | 等级 | number | |
| `contacts[].powerLevel` | 战力 | number | |
| `contacts[].status` | 在线状态 | string | online / offline / away |
| `contacts[].isPresent` | 当前场景在场 | boolean | |
| `contacts[].affection` | 好感度 | number | |
| `contacts[].relationship` | 关系 | string | |
| `contacts[].title` | 称号 | string | 掌剑长老·玄矶子 |
| `contacts[].gameLocation` | 游戏位置 | string | |
| `contacts[].gameDescription` | 游戏描述 | string | 长文本 |
| `contacts[].gameAppearance` | 游戏外貌 | string | 长文本 |
| `contacts[].realName` | 真实姓名 | string | |
| `contacts[].realAge` | 真实年龄 | number | |
| `contacts[].realOccupation` | 现实身份 | string | |
| `contacts[].realDescription` | 现实描述 | string | 长文本 |
| `contacts[].realAppearance` | 现实外貌 | string | 长文本 |
| `contacts[].gamePrivacy` | 游戏隐私 | object | NSFW数据 |
| `contacts[].realPrivacy` | 现实隐私 | object | NSFW数据 |
| `contacts[].gameAvatarUrl` | 游戏头像 | string | |
| `contacts[].realAvatarUrl` | 现实头像 | string | |
| `contacts[].gender` | 性别 | string | |
| `chatMessages` | 聊天记录 | object[] | ContactsPanel | [{id, from, text, time}] |

## 📋 任务（QuestPanel）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `quests` | 任务列表 | object[] | App.tsx quests | |
| `quests[].id` | 任务ID | string | |
| `quests[].name` | 任务名 | string | 剑心试炼 |
| `quests[].type` | 类型 | string | main / side / daily |
| `quests[].status` | 状态 | string | active / completed / failed |
| `quests[].description` | 描述 | string | |
| `quests[].giver` | 发布者 | string | 掌剑长老·玄矶子 |
| `quests[].location` | 地点 | string | |
| `quests[].objectives` | 目标 | object[] | [{id, description, current, required}] |
| `quests[].rewards` | 奖励 | object | {xp?, money?, items?, title?} |

## 🏰 副本（DungeonPanel）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `dungeons` | 副本列表 | object[] | DungeonPanel | [{id, name, type(story/challenge), dangerLevel, location, coverDesc, rewards}] |
| `customDungeons` | 自定义副本 | object[] | DungeonPanel | AI生成的副本 |

## 🌏 世界探索（WorldPanel）

| 变量ID | 名称 | 类型 | 前端来源 | 说明 |
|--------|------|------|---------|------|
| `zones` | 区域列表 | object[] | WorldPanel | [{id, name, worldName, description, dangerLevel}] |
| `zones[].rumors` | 流言 | string[] | WorldPanel | 当前区域流言 |
| `zones[].characters` | 区域内角色 | object[] | WorldPanel | [{name, role}] |
| `zones[].encounters` | 奇遇 | object[] | WorldPanel | [{name, description, rarity}] |

---

## 总计

| 类别 | 数量 |
|------|------|
| 玩家基础 | 13 |
| 功法境界 | 8 |
| 技能 | 1 (数组) |
| 装备 | 2 + 每件装备 7 字段 |
| 时装 | 3 |
| 背包 | 1 (数组) |
| 宝石 | 1 (数组) |
| 状态效果 | 2 (数组) |
| 现实 | 6 |
| 时间位置 | 4 |
| 区域 | 7 |
| 双界融合 | 3 |
| 联系人 | 20+ (数组含子字段) |
| 任务 | 8 (数组含子字段) |
| 副本 | 2 (数组) |
| 世界探索 | 3 (数组) |
| **合计** | **~85 个变量** |
