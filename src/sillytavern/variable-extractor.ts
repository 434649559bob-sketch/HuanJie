/**
 * Variable Extractor — Secondary API post-narrative extraction protocol.
 *
 * After the primary API generates narrative text and the stream parser
 * extracts any inline <vars> block, this module can optionally call the
 * secondary API to do a second-pass extraction of variable changes from
 * the narrative text.
 *
 * The secondary API:
 *   - Receives: variable definitions + current values + narrative text
 *   - Returns: structured VarCommand[] + summary + confidence score
 *
 * On failure, returns an empty extraction (no changes applied).
 */

import type { VarCommand, VarDefinition, VariableExtraction } from './variable-types';

// ============================================================
// Build the extraction prompt
// ============================================================

export function buildExtractionPrompt(
  narrativeText: string,
  defs: VarDefinition[],
  currentVars: Record<string, any>,
): { systemPrompt: string; userMessage: string } {
  // Build a compact definition list
  const defLines = defs
    .filter(d => d.injectToPrompt)
    .map(d => {
      const cv = currentVars[d.id] ?? d.defaultValue;
      const bounds = d.bounds ? ` (${d.bounds.min ?? '-∞'}~${d.bounds.max ?? '∞'})` : '';
      return `- ${d.name}(${d.id}): ${d.type} = ${JSON.stringify(cv)}${bounds}`;
    });

  const systemPrompt = [
    '你是一个RPG状态解析引擎。根据变量定义和当前状态，从叙事文本中精确提取本轮发生的变化。',
    '',
    '## 变量定义',
    ...defLines,
    '',
    '## 更新规则',
    '- set: 直接设置值',
    '- add: 增加数值（正数）',
    '- sub: 减少数值（正数）',
    '- mul: 乘以系数',
    '- merge: 合并对象（只更新指定字段）',
    '',
    '## 规则',
    '1. 只提取叙事中明确发生的变化，不要臆测',
    '2. HP/MP的变化必须基于文本中的伤害/恢复描述推断合理数值',
    '3. 物品/金钱的变化必须明确提及',
    '4. 地点变化必须基于明确的移动/传送描述',
    '5. 数值必须在变量定义的范围内',
    '',
    '## 输出格式',
    '严格按以下JSON输出，不要包含markdown代码块标记：',
    '{',
    '  "vars": [',
    '    {"op":"sub","path":"hp","value":10,"display":"-10 HP","reason":"剑灵残影的剑气划过左肩"},',
    '    {"op":"add","path":"xp","value":500,"display":"+500 XP","reason":"击败剑灵残影"}',
    '  ],',
    '  "summary": "战斗损失10HP，获得500经验",',
    '  "confidence": 0.92',
    '}',
  ].join('\n');

  const userMessage = [
    '## 叙事正文',
    narrativeText,
    '',
    '## 当前变量状态',
    JSON.stringify(currentVars, null, 2),
    '',
    '请提取本轮变化。',
  ].join('\n');

  return { systemPrompt, userMessage };
}

// ============================================================
// Parse the extraction response
// ============================================================

export function parseExtractionResponse(responseText: string): VariableExtraction | null {
  const trimmed = responseText.trim();

  // Strip markdown code fences if present
  let jsonStr = trimmed;
  if (jsonStr.startsWith('```')) {
    const end = jsonStr.lastIndexOf('```');
    jsonStr = jsonStr.slice(jsonStr.indexOf('\n'), end > 0 ? end : undefined).trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);

    if (!parsed || typeof parsed !== 'object') return null;

    // Validate vars array
    const vars: VarCommand[] = [];
    if (Array.isArray(parsed.vars)) {
      for (const item of parsed.vars) {
        if (typeof item.op === 'string' && typeof item.path === 'string') {
          vars.push({
            op: item.op as VarCommand['op'],
            path: item.path,
            value: 'value' in item ? item.value : undefined,
            display: item.display,
            reason: item.reason,
          });
        }
      }
    }

    return {
      vars,
      summary: typeof parsed.summary === 'string' ? parsed.summary : '无总结',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : undefined,
    };
  } catch {
    // Try to find JSON object in the text
    const jsonMatch = responseText.match(/\{[\s\S]*"vars"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return parseExtractionResponse(jsonMatch[0]);
      } catch {
        return null;
      }
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
  temperature?: number;
  maxTokens?: number;
}

export async function callSecondaryExtraction(
  api: SecondaryApiConfig,
  narrativeText: string,
  defs: VarDefinition[],
  currentVars: Record<string, any>,
  signal?: AbortSignal,
): Promise<VariableExtraction | null> {
  const { systemPrompt, userMessage } = buildExtractionPrompt(narrativeText, defs, currentVars);

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
        temperature: api.temperature ?? 0.1,
        max_tokens: api.maxTokens ?? 512,
      }),
      signal,
    });

    if (!response.ok) {
      console.warn(`[var-extractor] Secondary API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('[var-extractor] Secondary API returned empty content');
      return null;
    }

    return parseExtractionResponse(content);
  } catch (err) {
    if ((err as Error).name === 'AbortError') return null;
    console.warn('[var-extractor] Secondary API call failed:', (err as Error).message);
    return null;
  }
}

// ============================================================
// Merge primary + secondary extractions
// ============================================================

/**
 * Merge primary (from <vars> tag) and secondary (post-narrative) extractions.
 *
 * Strategy: primary is authoritative. Secondary supplements only keys
 * that primary did NOT touch.
 */
export function mergeExtractions(
  primary: VarCommand[],
  secondary: VarCommand[],
): VarCommand[] {
  const primaryKeys = new Set(primary.map(c => c.path));
  const merged = [...primary];

  for (const cmd of secondary) {
    if (!primaryKeys.has(cmd.path)) {
      merged.push(cmd);
    }
  }

  return merged;
}
