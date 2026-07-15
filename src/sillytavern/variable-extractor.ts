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

所有变量保存在一个嵌套结构中。路径用点号分隔，如 player.hp、contacts.柳白霜.affection。
数组用数字索引或追加新元素。

### ① 固定数值变量（始终存在）
这些变量总是存在，你只需更新它们的值：
- player.hp: 战斗受伤/治疗时更新，轻伤-5~15，重伤-20~50，治疗+10~30。范围 0~player.maxHp
- player.mp: 技能消耗-5~20，冥想+5~15。范围 0~player.maxMp
- player.money: 收入+50~500，消费减去对应金额。最低0
- player.xp: 战斗+100~1000，任务+200~2000。若 >= player.xpToNext 则升级
- player.level: xp >= xpToNext 时 +1
- player.powerLevel: 升级+100~300，获强力装备+50~200
- player.actionStatus: 更新为当前动作简述
- player.corePath.progress: 顿悟+1~10，上限100
- player.rank.progress: 境界突破+1~15，上限100
- skills[N].proficiency: 成功使用技能+1~5，上限100
- fusion.rate: 两界融合事件+1~5，上限100
- fusion.isInGame: 登录/登出时切换 true/false
- location.game: 移动到新地点时更新
- location.world: 跨世界时更新
- location.real: 现实位置变化时更新
- time.game: 主要事件后推进10~60分钟
- time.real: 与游戏时间同步
- zone.name / zone.type / zone.coefficient: 进入不同区域时更新
- reality.dangerLevel: 融合度>30%时根据叙事调整0~100

### ② 动态数组（可新增/删除/修改元素）
这些是数组，你可以用 insert 添加新元素（索引填 "-" 表示追加到末尾），用 remove 删除元素（索引填数字）。

**技能 skills:**
- 每个元素: {id, name, type:"offense"|"defense"|"utility", proficiency:0~100, description, source}
- 学习新技能时 insert，遗忘时 remove

**增益 buffs.game / buffs.real:**
- 每个元素: {name, effect, source}
- 获得buff时 insert，过期时 remove

**减益 debuffs.game / debuffs.real:**
- 同上

**持有装备 ownedEquipment:**
- 每个元素: {id, name, slot, quality, basePower, enhanceLevel}
- 获得装备时 insert，丢弃/损坏时 remove
- 注意：强化/锻造是前端操作，你不需要处理

**背包 inventory:**
- 每个元素: {id, name, type:"consumable"|"material"|"key", quality, quantity, description, effect, usable}
- 获得物品时 insert，quantity减到0时 remove
- 前端"使用道具"已处理消耗，你只处理叙事中明确提及的

**持有宝石 gems:**
- 每个元素: {id, name, quality, powerBonus, effect}
- 获得宝石时 insert

**时装 ownedFashion:**
- 每个元素: {id, name, slot, quality, description, visualEffect}
- 获得时 insert

**时装裸露槽位 fashionNudeSlots:**
- 字符串数组，标记裸露的装备槽位名

**任务 quests:**
- 每个元素: {id, name, type:"main"|"side"|"daily", status:"active"|"completed"|"failed", description, giver, location, objectives:[{id, description, current, required}], rewards:{xp, money, items, title}}
- 接新任务时 insert，quests[N].objectives[M].current 进度更新用 replace
- 任务完成 quests[N].status 改为 "completed"

### ③ 动态记录（可新增角色/NPC，每个角色一整套变量）
**contacts 是一个记录表，键名是角色名字。每个角色有完整的子变量：**

contacts.{角色名}.type = "player"|"npc"
contacts.{角色名}.gameClass = 职业
contacts.{角色名}.level = 等级
contacts.{角色名}.powerLevel = 战力
contacts.{角色名}.status = "online"|"offline"|"away"
contacts.{角色名}.isPresent = 是否在当前场景
contacts.{角色名}.affection = 好感度 0~100
contacts.{角色名}.relationship = 关系描述
contacts.{角色名}.title = 称号
contacts.{角色名}.gameLocation = 游戏位置
contacts.{角色名}.realName = 真实姓名
contacts.{角色名}.realOccupation = 现实身份
contacts.{角色名}.gameDescription = 游戏描述（长文本）
contacts.{角色名}.realDescription = 现实描述（长文本）
contacts.{角色名}.gameAppearance = 游戏外貌（长文本）
contacts.{角色名}.realAppearance = 现实外貌（长文本）
contacts.{角色名}.gender = 性别
contacts.{角色名}.realAge = 现实年龄

**新增角色规则：**
- 叙事中出现了新的有名字的NPC → 用 insert 在 contacts 下创建该角色的完整变量
- 已有角色的属性变化 → 用 replace 更新对应路径
- 角色死亡或离开剧情 → 可将其 status 改为 "offline"

**装备槽位 equipment.{weapon|helmet|armor|gloves|pants|shoes|accessory1|accessory2}:**
- 每个槽位: {id, name, quality, basePower, enhanceLevel, enhanceBonus, gemBonus, description, source, sourceDetail, extraEffect, gemCount, maxSockets} 或 null
- 换装时 replace 整个槽位对象
- 注意：镶嵌/强化是前端操作

**时装槽位 fashion.{weapon|helmet|armor|gloves|pants|shoes|accessory1|accessory2}:**
- 每个槽位: {id, name, quality, description, visualEffect} 或 null

### ④ 通用原则
- 你只需关注叙事中明确描述的变化
- 前端已经处理的操作（锻造强化、镶嵌宝石、前端使用道具）你不需要再处理
- 新出现的角色/NPC/物品要创建对应的变量条目
- 数值始终在合理范围内，不要溢出
- 路径格式: parent.child.grandchild，数组用 parent[N].field
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
