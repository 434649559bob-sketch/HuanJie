/**
 * Main exports — SillyTavern Web integration
 */

export * from './types';
export * from './database';
export * from './lorebook-engine';
export * from './prompt-assembler';
export * from './importer';
export * from './variables';
export * from './variable-types';
// variable-engine re-exports formatVariablesForPrompt; skip to avoid conflict with variables.ts
export { applyVarCommands, applyCommand, resolveAllVariables, coerceValue, formatDisplayValue, createDefaultVarManager, buildDefsMap } from './variable-engine';
export type { ApplyResult } from './variable-engine';
export * from './variable-macros';
export * from './variable-extractor';

export const VERSION = '3.0.0';
