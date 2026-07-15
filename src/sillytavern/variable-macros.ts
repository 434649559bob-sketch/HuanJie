/**
 * Variable Macro Engine — Regex-based variable reference substitution.
 *
 * Scans narrative text for {{macro}} patterns and resolves them
 * against the current variable state and definition registry.
 *
 * Supported syntax:
 *   {{varName}}                 — get current value
 *   {{varName::default}}        — with default fallback
 *   {{delta::varName}}          — show last delta
 *   {{format::varName::tpl}}    — format with template: {value} and {max}
 */

import type { VarDefinition, VarMatch, VarDelta, VarDisplayFormat } from './variable-types';
import { formatDisplayValue } from './variable-engine';

// ============================================================
// Regex patterns
// ============================================================

/** Match {{identifier}} patterns. Captures the full key in group 1. */
const VAR_REF_RE = /\{\{([a-zA-Z_]\w*(?:::[\w一-鿿]*)*)\}\}/g;

/** Match {{delta::identifier}} */
const VAR_DELTA_RE = /\{\{delta::([a-zA-Z_]\w*)\}\}/g;

/** Match {{format::identifier::template}} where template may contain {value} and {max} */
const VAR_FORMAT_RE = /\{\{format::([a-zA-Z_]\w*)::(.+?)\}\}/g;

// ============================================================
// Scanning
// ============================================================

export interface ScanResult {
  /** Matches found in the text */
  matches: VarMatch[];
  /** Segments for rendering: text parts alternating with VarMatch indices */
  segments: Array<{ type: 'text'; value: string } | { type: 'var'; match: VarMatch }>;
}

/**
 * Scan narrative text for all {{var}} references and resolve them
 * against the current variable map and definitions.
 */
export function scanNarrative(
  text: string,
  variables: Record<string, any>,
  defs: Map<string, VarDefinition>,
  previousVars?: Record<string, any>,
): ScanResult {
  const matches: VarMatch[] = [];
  const segments: ScanResult['segments'] = [];

  // First pass: find all {{...}} matches
  const re = new RegExp(VAR_REF_RE.source, 'g');
  let m: RegExpExecArray | null;
  let lastIdx = 0;

  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    const inside = m[1]; // everything inside {{ }}

    // Parse: key::defaultPart
    const parts = inside.split('::');
    const key = parts[0];
    const defaultVal: string | undefined = parts.length > 1 ? parts.slice(1).join('::') : undefined;

    const def = defs.get(key);
    const value = variables[key] ?? def?.defaultValue ?? defaultVal ?? '???';
    const display = def?.display ?? defaultDisplay();
    const previousValue = previousVars ? (previousVars[key] ?? value) : undefined;

    const match: VarMatch = {
      start: m.index,
      end: m.index + raw.length,
      raw,
      key,
      value,
      display,
      previousValue,
    };

    // Text before this match
    if (m.index > lastIdx) {
      segments.push({ type: 'text', value: text.slice(lastIdx, m.index) });
    }
    segments.push({ type: 'var', match });
    lastIdx = m.index + raw.length;
    matches.push(match);
  }

  // Trailing text
  if (lastIdx < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIdx) });
  }

  // If no matches, push entire text as one segment
  if (segments.length === 0) {
    segments.push({ type: 'text', value: text });
  }

  return { matches, segments };
}

/**
 * Simple string replacement: replace all {{var}} references with
 * their formatted values. For plain-text contexts (not React rendering).
 */
export function replaceVarRefs(
  text: string,
  variables: Record<string, any>,
  defs: Map<string, VarDefinition>,
): string {
  return text.replace(VAR_REF_RE, (_full, inside: string) => {
    const parts = inside.split('::');
    const key = parts[0];
    const defaultVal = parts.length > 1 ? parts.slice(1).join('::') : undefined;
    const def = defs.get(key);
    const value = variables[key] ?? def?.defaultValue ?? defaultVal ?? '???';
    const display = def?.display ?? defaultDisplay();
    return formatDisplayValue(value, display);
  });
}

// ============================================================
// Delta display
// ============================================================

/** Scan for {{delta::key}} and return formatted delta display strings */
export function replaceDeltaRefs(
  text: string,
  deltas: VarDelta[],
): string {
  const deltaMap = new Map<string, VarDelta>();
  for (const d of deltas) {
    deltaMap.set(d.key, d);
  }

  return text.replace(VAR_DELTA_RE, (_full, key: string) => {
    const delta = deltaMap.get(key);
    if (!delta || delta.display === undefined) return '--';
    return delta.display ?? `${delta.op === 'add' ? '+' : ''}${delta.to}`;
  });
}

// ============================================================
// Format function
// ============================================================

/** Replace {{format::key::template}} with formatted output */
export function replaceFormatRefs(
  text: string,
  variables: Record<string, any>,
  defs: Map<string, VarDefinition>,
): string {
  return text.replace(VAR_FORMAT_RE, (_full, key: string, template: string) => {
    const def = defs.get(key);
    const value = variables[key] ?? def?.defaultValue ?? 0;
    let result = template.replace(/\{value\}/g, String(value));

    if (def?.display.maxRef) {
      const maxVal = variables[def.display.maxRef] ?? 0;
      result = result.replace(/\{max\}/g, String(maxVal));
    }

    return result;
  });
}

// ============================================================
// Full pipeline: run all replacements on narrative text
// ============================================================

export interface MacroPipelineResult {
  /** Text with all macro references replaced by formatted values */
  text: string;
  /** Structured scan result for React rendering */
  scan: ScanResult;
}

export function runMacroPipeline(
  text: string,
  variables: Record<string, any>,
  defs: Map<string, VarDefinition>,
  deltas?: VarDelta[],
  previousVars?: Record<string, any>,
): MacroPipelineResult {
  const scan = scanNarrative(text, variables, defs, previousVars);

  let replaced = replaceVarRefs(text, variables, defs);
  if (deltas && deltas.length > 0) {
    replaced = replaceDeltaRefs(replaced, deltas);
  }
  replaced = replaceFormatRefs(replaced, variables, defs);

  return { text: replaced, scan };
}

// ============================================================
// Helpers
// ============================================================

function defaultDisplay(): VarDisplayFormat {
  return { style: 'default', animateDelta: false };
}
