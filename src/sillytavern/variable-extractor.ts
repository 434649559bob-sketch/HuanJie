/**
 * Variable Extractor — Secondary API post-narrative extraction.
 *
 * After the primary API generates narrative text, this module calls the
 * secondary API to extract variable changes based on update rules.
 */

import type { VarCommand } from './variable-types';

// ============================================================
// Variable update rules — tells the AI HOW to extract changes
// ============================================================

const UPDATE_RULES = `
## 变量更新规则

你必须根据叙事正文中的具体描述来更新变量。没有明确描述的变化不要更新。

### 玩家属性
- player.hp: 战斗受伤或恢复时更新。轻伤 -5~15，重伤 -20~50，治疗恢复 +10~30。不能超过 player.maxHp，不能低于 0
- player.mp: 使用技能或恢复时更新。技能消耗 -5~20，冥想恢复 +5~15。不能超过 player.maxMp
- player.money: 获得报酬 +50~500，购买物品减少对应金额，不能低于 0
- player.xp: 战斗胜利 +100~1000，完成任务 +200~2000，不能超过 player.xpToNext
- player.level: 当 player.xp >= player.xpToNext 时升1级，同时 player.xp -= player.xpToNext，player.xpToNext * 1.5
- player.powerLevel: 升级时 +100~300，获得强力装备时 +50~200
- player.actionStatus: 随时更新为当前动作描述（如"盘坐调息中""前往剑冢"等）
- player.corePath.progress: 顿悟或突破时 +1~10
- player.rank.progress: 突破境界时 +1~15

### 技能
- skills[N].proficiency: 使用技能成功时 +1~5，上限100

### 状态效果
- buffs.game: 获得新的buff时向数组添加 {name, effect, source}，buff过期时移除
- debuffs.game: 受到新的debuff时向数组添加，debuff解除时移除
- buffs.real: 现实世界获得增益时添加
- debuffs.real: 现实世界获得减益时添加

### 装备（注意：前端锻造/装备操作不需要你处理）
- 仅当叙事中"获得"新装备时，向 ownedEquipment 数组添加 {id, name, slot, quality, basePower, enhanceLevel}
- 叙事中"丢弃""损坏"装备时，从对应数组移除
- 不要更新 equipment.{slot} 的强化等级——那是前端锻造系统处理的

### 时装
- fashion.{slot}: 叙事中换装时更新 {id, name, quality, description, visualEffect}
- fashionNudeSlots: 不再需要时移除对应槽位

### 背包
- inventory: 叙事中获得物品时添加 {id, name, type, quality, quantity, description, effect, usable}
- inventory[N].quantity: 使用物品时减1，数量归零则移除该物品
- 注意：前端"使用道具"按钮已经处理了物品消耗，你只需处理叙事中明确描述的使用

### 宝石
- gems: 叙事中获得宝石时添加 {id, name, quality, powerBonus, effect}

### 时间与位置
- location.game: 玩家移动到新区域时更新
- location.world: 跨世界移动时更新
- time.game: 根据叙事推进时间（每次主要事件后推进10~60分钟）
- time.real: 与 time.game 同步推进

### 区域
- zone.name: 进入新区块时更新
- zone.type: 进入不同类型区域时更新
- zone.coefficient: 进入不同力量体系区域时更新（修仙=1.2, 废土=0.2~0.8, 赛博=0.9, 通用=1.0）

### 融合
- fusion.rate: 叙事中出现两界融合相关事件时 +1~5，上限100
- fusion.isInGame: 玩家登录/退出游戏时切换

### 联系人
- contacts[N].affection: 好感度因互动而 ±1~10，上限100
- contacts[N].relationship: 关系重大变化时更新描述
- contacts[N].status: 上线/离线/离开
- contacts[N].isPresent: 出现在当前场景时为true
- contacts[N].gameLocation: 角色移动到新位置时更新

### 任务
- quests[N].status: 任务完成改为 "completed"，失败改为 "failed"
- quests[N].objectives[M].current: 目标进度增加时更新，达到 required 则完成
- 新任务接受时向 quests 数组添加完整任务对象

### 现实世界
- reality.dangerLevel: 融合度>30%时根据叙事调整 0~100
- location.real: 现实位置变化时更新
`;

// ============================================================
// Build the extraction prompt
// ============================================================

export function buildExtractionPrompt(
  narrativeText: string,
  stateSummary: string,
  currentVars: Record<string, any>,
): { systemPrompt: string; userMessage: string } {
  const systemPrompt = [
    '你是一个RPG状态解析引擎。根据变量更新规则和当前状态，从叙事文本中精确提取本轮发生的变化。',
    '',
    '## 当前完整状态',
    stateSummary,
    '',
    UPDATE_RULES,
    '',
    '## 核心原则',
    '1. 只提取叙事中明确描述的变化，不要臆测',
    '2. 战斗伤害必须基于文本描述，推断合理的数值范围',
    '3. 金钱和物品变化必须有明确提及',
    '4. 位置变化必须有明确的移动描述',
    '5. 不要重复处理前端操作（玩家在前端面板的锻造/装备/使用物品等操作，你不需要再处理）',
    '6. 所有数值必须在合理范围内',
    '7. 如果本回合没有明确的变化，返回空数组',
    '',
    '## 输出格式',
    '严格按此JSON输出：',
    '{',
    '  "vars": [',
    '    {"op":"delta","path":"player.hp","value":-12,"display":"-12 HP","reason":"剑灵残影的剑气划过左肩"},',
    '    {"op":"delta","path":"player.xp","value":500,"display":"+500 XP","reason":"击败剑灵残影"},',
    '    {"op":"replace","path":"player.actionStatus","value":"盘坐调息中","reason":"战斗后恢复"},',
    '    {"op":"replace","path":"location.game","value":"昆仑墟·剑冢·深处","reason":"深入剑冢"}',
    '  ],',
    '  "summary": "战斗负伤12点，获得500经验，进入剑冢深处"',
    '}',
    '',
    'op可选值: replace(替换值), delta(数值增减), insert(数组添加), remove(删除)。path使用点号路径如 player.hp。',
  ].join('\n');

  const userMessage = [
    '## 叙事正文',
    narrativeText,
    '',
    '## 当前变量原始值（JSON）',
    JSON.stringify(currentVars, null, 2),
    '',
    '请根据更新规则提取本轮变量变化。',
  ].join('\n');

  return { systemPrompt, userMessage };
}

// ============================================================
// Parse & call (unchanged)
// ============================================================

export function parseExtractionResponse(responseText: string): { vars: VarCommand[]; summary: string } | null {
  const trimmed = responseText.trim();
  let jsonStr = trimmed;
  if (jsonStr.startsWith('```')) {
    const end = jsonStr.lastIndexOf('```');
    jsonStr = jsonStr.slice(jsonStr.indexOf('\n'), end > 0 ? end : undefined).trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') return null;
    const vars: VarCommand[] = [];
    if (Array.isArray(parsed.vars)) {
      for (const item of parsed.vars) {
        if (typeof item.op === 'string' && typeof item.path === 'string') {
          vars.push({
            op: item.op === 'delta' ? 'add' : (item.op === 'replace' ? 'set' : item.op),
            path: item.path,
            value: item.value,
            display: item.display,
            reason: item.reason,
          });
        }
      }
    }
    return { vars, summary: parsed.summary || '' };
  } catch {
    const arrMatch = responseText.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        const arr = JSON.parse(arrMatch[0]);
        if (Array.isArray(arr)) {
          const vars: VarCommand[] = arr.map((item: any) => ({
            op: (item.op === 'delta' ? 'add' : item.op === 'replace' ? 'set' : item.op) || 'set',
            path: item.path || '',
            value: item.value,
            display: item.display,
            reason: item.reason,
          }));
          return { vars, summary: '' };
        }
      } catch { /* fall through */ }
    }
    return null;
  }
}

export interface SecondaryApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export async function callSecondaryExtraction(
  api: SecondaryApiConfig,
  narrativeText: string,
  stateSummary: string,
  currentVars: Record<string, any>,
  signal?: AbortSignal,
): Promise<{ vars: VarCommand[]; summary: string } | null> {
  const { systemPrompt, userMessage } = buildExtractionPrompt(narrativeText, stateSummary, currentVars);

  try {
    const response = await fetch(`${api.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${api.apiKey}`,
      },
      body: JSON.stringify({
        model: api.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
      signal,
    });

    if (!response.ok) {
      console.warn(`[var-extractor] Secondary API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return parseExtractionResponse(content);
  } catch (err) {
    if ((err as Error).name === 'AbortError') return null;
    console.warn('[var-extractor] Secondary API call failed:', (err as Error).message);
    return null;
  }
}
