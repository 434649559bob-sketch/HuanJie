/**
 * Variable Extractor — Secondary API post-narrative extraction.
 *
 * After the primary API generates narrative text, this module calls the
 * secondary API to extract variable changes from the narrative.
 *
 * The secondary API:
 *   - Receives: full variable state + current values + narrative text
 *   - Returns: structured VarCommand[] with operations + display text
 *
 * Format matches MVU's JSON Patch convention adapted for our flat variable paths.
 */

import type { VarCommand } from './variable-types';

// ============================================================
// Build the extraction prompt
// ============================================================

export function buildExtractionPrompt(
  narrativeText: string,
  stateSummary: string,
  currentVars: Record<string, any>,
): { systemPrompt: string; userMessage: string } {
  const systemPrompt = [
    '你是一个RPG状态解析引擎。根据当前变量状态，从叙事文本中精确提取本轮发生的变化。',
    '',
    '## 当前完整状态',
    stateSummary,
    '',
    '## 更新规则',
    '- replace: 直接替换变量的值',
    '- delta: 对数值变量进行增减（正数增加，负数减少）',
    '- insert: 向数组添加新元素',
    '- remove: 删除变量或数组中的元素',
    '',
    '## 规则',
    '1. 只提取叙事中明确发生的变化，不要臆测或推断',
    '2. HP/MP变化必须基于文本中的伤害/恢复描述',
    '3. 物品增减必须基于文本中明确提及的获取/使用/丢弃',
    '4. 地点变化必须基于明确的移动描述',
    '5. 数值在合理范围内',
    '6. 不要更新前端操作已经完成的变更（玩家在前端面板里的装备/锻造/使用道具等操作不需要你重复处理）',
    '',
    '## 输出格式',
    '严格按此JSON输出，不要包含markdown代码块标记：',
    '{',
    '  "vars": [',
    '    {"op":"delta","path":"player.hp","value":-10,"display":"-10 HP","reason":"剑灵残影的剑气划过"},',
    '    {"op":"delta","path":"player.xp","value":500,"display":"+500 XP","reason":"击败剑灵残影"},',
    '    {"op":"replace","path":"player.actionStatus","value":"盘坐调息中","reason":"战斗后恢复"},',
    '    {"op":"replace","path":"location.game","value":"昆仑墟·剑冢·深处","reason":"深入剑冢"}',
    '  ],',
    '  "summary": "战斗负伤，获得经验，进入剑冢深处"',
    '}',
  ].join('\n');

  const userMessage = [
    '## 叙事正文',
    narrativeText,
    '',
    '## 当前变量原始值',
    JSON.stringify(currentVars, null, 2),
    '',
    '请提取本轮变化。',
  ].join('\n');

  return { systemPrompt, userMessage };
}

// ============================================================
// Parse the extraction response
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

// ============================================================
// Call the secondary API
// ============================================================

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
