/**
 * Variable Engine — Core CRUD + update rule enforcement.
 *
 * Operates on plain Record<string, any> variable maps.
 * Does NOT touch IndexedDB directly — persistence is handled by the caller
 * (useSillytavern hook) using the database layer.
 */

import type { VarCommand, VarDefinition, VarDelta, VarManagerState } from './variable-types';
import { DEFAULT_VAR_DEFINITIONS } from './variable-types';

// ============================================================
// Scope resolution
// ============================================================

/**
 * Merges all active variable scopes into one flat record.
 * Resolution priority: chat > global > default fallback.
 */
export function resolveAllVariables(
  chatVars: Record<string, any>,
  globalVars: Record<string, any>,
  defs: Map<string, VarDefinition>,
): Record<string, any> {
  const merged: Record<string, any> = {};

  // Start with defaults from definitions
  for (const def of defs.values()) {
    merged[def.id] = def.defaultValue;
  }

  // Global overrides defaults
  for (const [key, value] of Object.entries(globalVars)) {
    merged[key] = value;
  }

  // Chat overrides global
  for (const [key, value] of Object.entries(chatVars)) {
    merged[key] = value;
  }

  return merged;
}

// ============================================================
// Value coercion & validation
// ============================================================

export function coerceValue(raw: unknown, def?: VarDefinition): { nextValue: unknown; warning?: string } {
  if (!def) return { nextValue: raw };

  const { type, bounds } = def;

  try {
    switch (type) {
      case 'number': {
        let n = Number(raw);
        if (Number.isNaN(n)) {
          return { nextValue: def.defaultValue, warning: `"${String(raw)}"不是有效数字，已拒绝` };
        }
        if (bounds) {
          if (bounds.min !== undefined && n < bounds.min) n = bounds.min;
          if (bounds.max !== undefined && n > bounds.max) n = bounds.max;
        }
        return { nextValue: n };
      }
      case 'string':
        return { nextValue: String(raw) };
      case 'boolean':
        return { nextValue: Boolean(raw) };
      case 'object':
        return { nextValue: typeof raw === 'object' && raw !== null ? raw : def.defaultValue };
      default:
        return { nextValue: raw };
    }
  } catch {
    return { nextValue: def.defaultValue, warning: `类型转换失败，已回退到默认值` };
  }
}

// ============================================================
// Update rules — apply a VarCommand to a variable value
// ============================================================

export function applyCommand(
  currentValue: unknown,
  cmd: VarCommand,
  def?: VarDefinition,
): { nextValue: unknown; warning?: string } {
  const { op, value } = cmd;

  switch (op) {
    case 'set': {
      const r = coerceValue(value, def);
      return { nextValue: r.nextValue, warning: r.warning };
    }

    case 'add': {
      const current = typeof currentValue === 'number' ? currentValue : Number(currentValue);
      const operand = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(current) || Number.isNaN(operand)) {
        return { nextValue: currentValue, warning: `add 操作需要数字类型` };
      }
      const r = coerceValue(current + operand, def);
      return { nextValue: r.nextValue, warning: r.warning };
    }

    case 'sub': {
      const current = typeof currentValue === 'number' ? currentValue : Number(currentValue);
      const operand = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(current) || Number.isNaN(operand)) {
        return { nextValue: currentValue, warning: `sub 操作需要数字类型` };
      }
      const r = coerceValue(current - operand, def);
      return { nextValue: r.nextValue, warning: r.warning };
    }

    case 'mul': {
      const current = typeof currentValue === 'number' ? currentValue : Number(currentValue);
      const operand = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(current) || Number.isNaN(operand)) {
        return { nextValue: currentValue, warning: `mul 操作需要数字类型` };
      }
      const r = coerceValue(current * operand, def);
      return { nextValue: r.nextValue, warning: r.warning };
    }

    case 'merge': {
      if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue) &&
          typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const r = coerceValue({ ...currentValue, ...(value as Record<string, any>) }, def);
        return { nextValue: r.nextValue, warning: r.warning };
      }
      const r = coerceValue(value ?? currentValue, def);
      return { nextValue: r.nextValue, warning: r.warning };
    }

    case 'delete': {
      return { nextValue: undefined };
    }

    default:
      return { nextValue: currentValue, warning: `未知操作: ${op}` };
  }
}

// ============================================================
// Batch update — apply array of VarCommand to variables map
// ============================================================

export interface ApplyResult {
  variables: Record<string, any>;
  applied: VarCommand[];
  deltas: VarDelta[];
  warnings: string[];
}

export function applyVarCommands(
  current: Record<string, any>,
  commands: VarCommand[],
  defs: Map<string, VarDefinition>,
): ApplyResult {
  const variables = { ...current };
  const applied: VarCommand[] = [];
  const deltas: VarDelta[] = [];
  const warnings: string[] = [];

  for (const cmd of commands) {
    const { path } = cmd;
    const def = defs.get(path);
    const oldValue = variables[path] ?? def?.defaultValue;

    // Handle delete
    if (cmd.op === 'delete') {
      const had = path in variables;
      delete variables[path];
      if (had) {
        applied.push(cmd);
        deltas.push({ key: path, from: oldValue, to: undefined, op: 'delete', reason: cmd.reason, display: cmd.display });
      }
      continue;
    }

    // Handle dot-path for nested access
    if (path.includes('.')) {
      const { nextValue, warning } = applyNestedCommand(variables, path, cmd, def);
      if (warning) warnings.push(`${path}: ${warning}`);
      if (nextValue !== undefined) {
        setNestedValue(variables, path, nextValue);
        applied.push(cmd);
        deltas.push({ key: path, from: oldValue, to: nextValue, op: cmd.op, reason: cmd.reason, display: cmd.display });
      }
      continue;
    }

    const { nextValue, warning } = applyCommand(oldValue, cmd, def);
    if (warning) warnings.push(`${path}: ${warning}`);

    if (nextValue !== oldValue || cmd.op === 'set') {
      variables[path] = nextValue;
      applied.push(cmd);
      deltas.push({ key: path, from: oldValue, to: nextValue, op: cmd.op, reason: cmd.reason, display: cmd.display });
    }
  }

  return { variables, applied, deltas, warnings };
}

// ============================================================
// Nested (dot-path) variable access
// ============================================================

function getNestedValue(obj: Record<string, any>, path: string): unknown {
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

function setNestedValue(obj: Record<string, any>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: any = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current) || typeof current[parts[i]] !== 'object' || current[parts[i]] === null) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

function applyNestedCommand(
  obj: Record<string, any>,
  path: string,
  cmd: VarCommand,
  def?: VarDefinition,
): { nextValue?: unknown; warning?: string } {
  const currentValue = getNestedValue(obj, path);
  const { nextValue, warning } = applyCommand(currentValue, cmd, def);
  return { nextValue, warning };
}

// ============================================================
// Prompt formatting — inject variable state into system prompt
// ============================================================

export function formatVariablesForPrompt(
  variables: Record<string, any>,
  defs: Map<string, VarDefinition>,
): string {
  const gameLines: string[] = [];
  const realLines: string[] = [];
  const otherLines: string[] = [];

  for (const [key, value] of Object.entries(variables)) {
    const def = defs.get(key);
    if (!def || !def.injectToPrompt) continue;

    const displayValue = formatDisplayValue(value, def.display);
    const line = `${def.name}(${def.id}): ${displayValue}`;

    if (key.includes('real') || def.display.color === '#9aa0b0') {
      realLines.push(line);
    } else if (def.scope === 'chat') {
      gameLines.push(line);
    } else {
      otherLines.push(line);
    }
  }

  const parts: string[] = [];
  if (gameLines.length) parts.push(`[游戏世界]\n${gameLines.join('\n')}`);
  if (realLines.length) parts.push(`\n[现实世界]\n${realLines.join('\n')}`);
  if (otherLines.length) parts.push(`\n[全局]\n${otherLines.join('\n')}`);

  return parts.join('');
}

export function formatDisplayValue(value: unknown, display: VarDefinition['display']): string {
  const prefix = display.prefix ?? '';
  const suffix = display.suffix ?? '';

  if (value === undefined || value === null) return `${prefix}--${suffix}`;

  switch (display.style) {
    case 'currency':
      return `${prefix}${Number(value).toLocaleString()}${suffix}`;
    case 'progress': {
      const n = Number(value);
      return `${prefix}${Math.round(n)}${suffix}`;
    }
    case 'stat':
    case 'text':
    default:
      return `${prefix}${String(value)}${suffix}`;
  }
}

// ============================================================
// Manager state helpers
// ============================================================

export function createDefaultVarManager(): VarManagerState {
  return {
    key: 'default',
    definitions: [...DEFAULT_VAR_DEFINITIONS],
    updatedAt: Date.now(),
  };
}

export function buildDefsMap(manager: VarManagerState): Map<string, VarDefinition> {
  const map = new Map<string, VarDefinition>();
  for (const def of manager.definitions) {
    map.set(def.id, def);
  }
  return map;
}
