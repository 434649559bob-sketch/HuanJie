/**
 * Variable System — Core Types
 *
 * Bridges AI narrative output to structured game state.
 * Inspired by SillyTavern's community variable ecosystem
 * (ST-Prompt-Template + JS-Slash-Runner).
 */

// ============================================================
// Update Operations
// ============================================================

/** Allowed update operations on a variable */
export type VarOp =
  | 'set'       // Replace value entirely
  | 'add'       // Numeric add (positive) or string append
  | 'sub'       // Numeric subtraction
  | 'mul'       // Multiply by factor
  | 'merge'     // Deep-merge object
  | 'delete';   // Remove variable

/** One AI-issued variable update instruction */
export interface VarCommand {
  op: VarOp;
  /** Variable key (supports dot-path for nested, e.g. "buffs.game") */
  path: string;
  /** Operand value */
  value?: unknown;
  /** Optional: human-readable display text for the change, e.g. "+50 金币" */
  display?: string;
  /** Optional: narrative reason for this change */
  reason?: string;
}

// ============================================================
// Secondary API Extraction
// ============================================================

/** Response from the secondary API after parsing narrative text */
export interface VariableExtraction {
  vars: VarCommand[];
  summary: string;
  /** Confidence score from the extraction model (0-1) */
  confidence?: number;
}

// ============================================================
// Variable Definition (Variable Manager metadata)
// ============================================================

/** Where a variable lives */
export type VarScope = 'chat' | 'global';

/** Variable data type */
export type VarDataType = 'string' | 'number' | 'boolean' | 'object';

/** How to render a variable when it appears inline in text */
export type VarDisplayStyle = 'default' | 'stat' | 'currency' | 'progress' | 'text';

export interface VarDisplayFormat {
  style: VarDisplayStyle;
  /** Suffix appended to value, e.g. "G" for gold, "%", " / 100" */
  suffix?: string;
  /** Prefix prepended to value, e.g. "$" */
  prefix?: string;
  /** For 'progress' style: variable key whose value is the max */
  maxRef?: string;
  /** Unicode icon character */
  icon?: string;
  /** Hex color or CSS var reference override */
  color?: string;
  /** Flash green/red on value change */
  animateDelta: boolean;
}

/** A single variable definition — the metadata managed by Variable Manager */
export interface VarDefinition {
  id: string;
  name: string;
  type: VarDataType;
  scope: VarScope;
  defaultValue: unknown;
  display: VarDisplayFormat;
  /** Whether to include this variable in the system prompt */
  injectToPrompt: boolean;
  /** Min/max for number types (clamped on update) */
  bounds?: { min?: number; max?: number };
  /** Sort order in the UI */
  order: number;
  /** User-written description */
  description?: string;
}

// ============================================================
// Variable Manager State (persisted to IndexedDB)
// ============================================================

/** The Variable Manager's full state, saved globally */
export interface VarManagerState {
  key: string; // always 'default' for now
  definitions: VarDefinition[];
  updatedAt: number;
}

// ============================================================
// Display / Macro Types
// ============================================================

/** One macro match found in narrative text */
export interface VarMatch {
  /** 0-based start index in the source text */
  start: number;
  /** 0-based end index (exclusive) */
  end: number;
  /** The full matched text, e.g. "{{hp}}" */
  raw: string;
  /** The variable key extracted, e.g. "hp" */
  key: string;
  /** The current resolved value */
  value: unknown;
  /** Display format from the definition */
  display: VarDisplayFormat;
  /** Previous value (before this turn), for delta animation */
  previousValue?: unknown;
}

/** Change delta for one variable between two turns */
export interface VarDelta {
  key: string;
  from: unknown;
  to: unknown;
  op: VarOp;
  display?: string;
  reason?: string;
}

// ============================================================
// Constants
// ============================================================

export const DEFAULT_VAR_DISPLAY: VarDisplayFormat = {
  style: 'default',
  animateDelta: true,
};

/** Pre-populated variable definitions for the dual-world RPG setting */
export const DEFAULT_VAR_DEFINITIONS: VarDefinition[] = [
  {
    id: 'hp', name: '生命值', type: 'number', scope: 'chat',
    defaultValue: 100, injectToPrompt: true,
    display: { style: 'stat', suffix: '', icon: '❤️', color: '#ef4444', animateDelta: true, maxRef: 'maxHp' },
    bounds: { min: 0 }, order: 1,
    description: '当前生命值',
  },
  {
    id: 'maxHp', name: '最大生命值', type: 'number', scope: 'chat',
    defaultValue: 100, injectToPrompt: false,
    display: { style: 'stat', animateDelta: false },
    bounds: { min: 1 }, order: 2,
    description: '生命值上限',
  },
  {
    id: 'mp', name: '灵力值', type: 'number', scope: 'chat',
    defaultValue: 50, injectToPrompt: true,
    display: { style: 'stat', suffix: '', icon: '💎', color: '#3b82f6', animateDelta: true, maxRef: 'maxMp' },
    bounds: { min: 0 }, order: 3,
    description: '当前灵力/魔力',
  },
  {
    id: 'maxMp', name: '最大灵力值', type: 'number', scope: 'chat',
    defaultValue: 50, injectToPrompt: false,
    display: { style: 'stat', animateDelta: false },
    bounds: { min: 1 }, order: 4,
    description: '灵力上限',
  },
  {
    id: 'money', name: '金钱', type: 'number', scope: 'chat',
    defaultValue: 0, injectToPrompt: true,
    display: { style: 'currency', prefix: '💰 ', suffix: ' G', color: '#f59e0b', animateDelta: true },
    bounds: { min: 0 }, order: 5,
    description: '通用货币',
  },
  {
    id: 'xp', name: '经验值', type: 'number', scope: 'chat',
    defaultValue: 0, injectToPrompt: true,
    display: { style: 'progress', suffix: '', icon: '⭐', color: '#a855f7', animateDelta: true, maxRef: 'xpToNext' },
    bounds: { min: 0 }, order: 6,
    description: '当前经验值',
  },
  {
    id: 'xpToNext', name: '升级所需经验', type: 'number', scope: 'chat',
    defaultValue: 100, injectToPrompt: false,
    display: { style: 'stat', animateDelta: false },
    bounds: { min: 1 }, order: 7,
  },
  {
    id: 'level', name: '等级', type: 'number', scope: 'chat',
    defaultValue: 1, injectToPrompt: true,
    display: { style: 'stat', icon: '📊', animateDelta: true },
    bounds: { min: 1 }, order: 8,
  },
  {
    id: 'fusionRate', name: '融合度', type: 'number', scope: 'global',
    defaultValue: 0, injectToPrompt: true,
    display: { style: 'progress', suffix: '%', color: '#ef4444', animateDelta: true },
    bounds: { min: 0, max: 100 }, order: 9,
    description: '两界融合进度',
  },
  {
    id: 'gameLocation', name: '游戏位置', type: 'string', scope: 'chat',
    defaultValue: '昆仑墟·云顶剑阁', injectToPrompt: true,
    display: { style: 'text', icon: '📍', color: '#00d4ff', animateDelta: true },
    order: 10,
  },
  {
    id: 'realLocation', name: '现实位置', type: 'string', scope: 'chat',
    defaultValue: '家中·游戏舱', injectToPrompt: true,
    display: { style: 'text', icon: '🏠', color: '#9aa0b0', animateDelta: true },
    order: 11,
  },
  {
    id: 'actionStatus', name: '当前动作', type: 'string', scope: 'chat',
    defaultValue: '盘坐调息中', injectToPrompt: true,
    display: { style: 'text', animateDelta: true },
    order: 12,
  },
];
