/**
 * Regex Engine — applies SillyTavern-style regex rules to text.
 *
 * ST regex format: findRegex is "/pattern/flags" (e.g. "/<draft_notes>([\\s\\S]*?)</draft_notes>/g")
 * Our format is the same — imported from ST presets.
 */

import type { RegexRule } from './types';

/**
 * Parse ST's "/pattern/flags" string into a RegExp object.
 * Falls back to treating the string as a literal pattern if it doesn't start with /.
 */
export function parseSTRegex(pattern: string): RegExp | null {
  if (!pattern) return null;
  // ST format: /pattern/flags
  if (pattern.startsWith('/')) {
    const lastSlash = pattern.lastIndexOf('/');
    if (lastSlash <= 1) return null; // just "//" or "/"
    const body = pattern.slice(1, lastSlash);
    const flags = pattern.slice(lastSlash + 1);
    try {
      return new RegExp(body, flags);
    } catch {
      return null;
    }
  }
  // Plain string — treat as literal replacement (no regex)
  return null;
}

/**
 * Apply a single regex rule to text.
 */
export function applyRule(text: string, rule: RegexRule): string {
  if (!rule.enabled) return text;
  const re = parseSTRegex(rule.findRegex);
  if (re) {
    return text.replace(re, rule.replaceString);
  }
  // Non-regex: simple string replace (all occurrences)
  if (rule.findRegex && text.includes(rule.findRegex)) {
    return text.split(rule.findRegex).join(rule.replaceString);
  }
  return text;
}

/**
 * Apply a list of rules to text, in order.
 * @param rules All rules (will be filtered by destination)
 * @param text The text to transform
 * @param destination 'prompt' or 'display' — only rules matching this or 'both' are applied
 */
export function applyRegexes(rules: RegexRule[], text: string, destination: 'prompt' | 'display'): string {
  const applicable = rules.filter(r => r.enabled && (r.destination === destination || r.destination === 'both'));
  let result = text;
  for (const rule of applicable) {
    result = applyRule(result, rule);
  }
  return result;
}

/**
 * Collect all active regexes: global + per-preset.
 */
export function collectRegexes(globalRegexes: RegexRule[], presetRegexes: RegexRule[]): RegexRule[] {
  return [...globalRegexes, ...presetRegexes];
}
