/**
 * SillyTavern Web - Core Types
 */

// ========== World Book (Lorebook) Types ==========

export interface LorebookEntry {
  id: string;
  keys: string[];
  secondaryKeys: string[];
  content: string;
  comment?: string;
  order: number;
  /** SillyTavern position: 0=before_char, 1=after_char, 2=before_example(AN top), 3=after_example(AN bottom), 4=at_depth, 5=example_msg_top, 6=example_msg_bottom, 7=outlet */
  position: 'before_char' | 'after_char' | 'before_example' | 'after_example' | 'at_depth' | 'example_msg_top' | 'example_msg_bottom' | 'outlet';
  depth?: number;
  role?: number;
  selective: boolean;
  /** 0=and_any(not_any?), 1=or(not_all?), actual SillyTavern has 4 logics but we normalize to and/or where possible */
  selectiveLogic: 'and_any' | 'not_all' | 'not_any' | 'and_all';
  constant: boolean;
  probability: number;
  useProbability?: boolean;
  addMemo: boolean;
  sticky?: number;
  cooldown?: number;
  delay?: number;
  weight?: number;
  scanDepth?: number;
  caseSensitive?: boolean;
  matchWholeWords?: boolean;
  excludeRecursion?: boolean;
  preventRecursion?: boolean;
  useGroupScoring?: boolean;
  matchPersonaDescription?: boolean;
  matchCharacterDescription?: boolean;
  matchCharacterPersonality?: boolean;
  matchCharacterDepthPrompt?: boolean;
  matchScenario?: boolean;
  matchCreatorNotes?: boolean;
  group?: string;
  decorators?: string[];
  characterFilter?: {
    isExclude?: boolean;
    names?: string[];
    tags?: number[];
  };
}

export interface Lorebook {
  id: string;
  name: string;
  description?: string;
  entries: LorebookEntry[];
  recursiveScanning: boolean;
  caseSensitive: boolean;
  matchWholeWords: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SillyTavernLorebookExport {
  name: string;
  description?: string;
  entries: Record<string, {
    uid: number;
    key: string[];
    keysecondary: string[];
    comment: string;
    content: string;
    constant: boolean;
    selective: boolean;
    selectiveLogic: 0 | 1 | 2 | 3;
    addMemo: boolean;
    order: number;
    position: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    role: number;
    disable: boolean;
    probability: number;
    depth: number;
    group: string;
    useProbability: boolean;
    excluded: boolean;
    sticky: number;
    cooldown: number;
    delay: number;
    weight: number;
    scanDepth: number;
    caseSensitive: boolean;
    matchWholeWords: boolean;
    excludeRecursion: boolean;
    preventRecursion: boolean;
    useGroupScoring: boolean;
    matchPersonaDescription: boolean;
    matchCharacterDescription: boolean;
    matchCharacterPersonality: boolean;
    matchCharacterDepthPrompt: boolean;
    matchScenario: boolean;
    matchCreatorNotes: boolean;
    decorators: string[];
    characterFilter: {
      isExclude?: boolean;
      names?: string[];
      tags?: number[];
    };
  }>;
  settings?: {
    recursive_scanning?: boolean;
    case_sensitive?: boolean;
    match_whole_words?: boolean;
  };
}

export interface MatchedEntry {
  entry: LorebookEntry;
  score: number;
  matchedKeywords: string[];
}

// ========== Regex Types ==========

export interface RegexRule {
  id: string;
  name: string;
  enabled: boolean;
  findRegex: string;
  replaceString: string;
  /** Where to apply: user_input, ai_output, slash_command, world_info */
  source: { userInput: boolean; aiOutput: boolean; slashCommand: boolean; worldInfo: boolean };
  /** Destination: display (for rendering in UI) or prompt (before sending to AI) */
  destination: 'display' | 'prompt' | 'both';
  /** Only apply when message depth is between these (null = no limit) */
  minDepth: number | null;
  maxDepth: number | null;
  runOnEdit: boolean;
  order: number;
}

// ========== Preset Types ==========

/** SillyTavern-compatible chat completion preset.
 *  `settings` stores the raw SillyTavern preset JSON (temp_openai, prompt_order, prompts, etc.)
 */
export interface ChatPreset {
  id: string;
  name: string;
  description?: string;
  /** Raw SillyTavern preset fields. For OpenAI presets this includes temp_openai, prompt_order, prompts, etc. */
  settings: Record<string, any>;
  /** Preset-specific regex rules */
  regexes: RegexRule[];
  createdAt: number;
  updatedAt: number;
}

// ========== Settings Types ==========

export interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeout: number;
  secondary?: {
    enabled: boolean;
    baseUrl: string;
    apiKey: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface AppSettings {
  key?: string;
  api: ApiSettings;
  /** 'single' = primary API handles all tasks. 'dual' = primary handles story, secondary handles variables. */
  apiMode: 'single' | 'dual';
  activePresetId: string | null;
  activeLorebookIds: string[];
  userName: string;
  characterName: string;
  theme: 'dark' | 'light';
  language: 'zh' | 'en';
  autoSave: boolean;
  autoSaveInterval: number;
  uiMode: 'game' | 'chat';
  customTags: string[];
  formatPromptTemplate: string;
  thinkingDisplay: 'fold' | 'hide' | 'inline';
  /** Global regex rules (apply to all presets) */
  globalRegexes: RegexRule[];
}

export const DEFAULT_FORMAT_PROMPT = `## 你的角色
你是一个互动叙事AI，负责推进剧情发展。你的身份是{{char}}，正在与{{user}}进行一场沉浸式的角色扮演冒险。你需要始终保持在角色内，根据世界观设定做出符合角色性格的反应。

## 世界观
这是一个「双世界」设定——现实世界与虚拟游戏世界正在逐渐融合。玩家通过游戏舱进入游戏世界"昆仑墟"及其它世界。两界融合度越高，现实与游戏的边界越模糊。你需要同时关注角色在游戏世界和现实世界的状态。

## 叙事规则
1. 推进剧情：每轮叙事要有实质进展，不要重复上一轮内容
2. 因果连贯：角色行为产生自然结果，NPC反应需符合其人设
3. 难度适中：挑战有意义但不过于严苛，给予玩家合理的成功机会
4. 状态感知：注意当前变量状态（HP/MP/位置/任务等），叙事中反映这些状态
5. 选项多样：提供的选项应涵盖不同风格（战斗/探索/社交/策略）

## 输出格式要求
你必须严格按照以下XML标签格式输出，不要用Markdown包裹：
<thinking>战术推理、角色心理活动、世界观逻辑判断……</thinking>
<maintext>本回合的完整叙事正文，可多段落，保持自然换行。</maintext>
<option>选项A的描述（风格：战斗）
选项B的描述（风格：探索）
选项C的描述（风格：社交或策略）</option>
<sum>本回合一句话剧情总结</sum>
<vars>{"hp": -10, "xp": +100}</vars>

## <vars>标签说明
vars标签中输出本回合明确发生变化的变量，JSON格式：
- 数字直接赋值（如"hp": 680）或增减（如"hp": -10）
- 字符串直接赋值（如"gameLocation": "昆仑墟·剑冢"）
- 只输出变化的变量，未变的不要列出
- HP/MP变化需基于文本中的伤害/恢复描述推断合理数值`;

export const DEFAULT_TAGS = ['maintext', 'option', 'sum', 'vars', 'thinking', 'think'] as const;
export const DEFAULT_OPAQUE_TAGS = ['thinking', 'think'] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  api: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    timeout: 60000,
  },
  apiMode: 'single',
  activePresetId: null,
  activeLorebookIds: [],
  userName: '用户',
  characterName: 'AI',
  theme: 'dark',
  language: 'zh',
  autoSave: true,
  autoSaveInterval: 30,
  uiMode: 'game',
  customTags: ['maintext', 'option', 'sum', 'vars', 'thinking', 'think'],
  formatPromptTemplate: DEFAULT_FORMAT_PROMPT,
  thinkingDisplay: 'fold',
  globalRegexes: [],
};

// ========== Chat Types ==========

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  variables?: Record<string, string | number>;
  metadata?: {
    tokenCount?: number;
    lorebookEntries?: string[];
    processingTime?: number;
  };
  parsed?: ParsedTags;
  variablesAfter?: Record<string, any>;
  variablesDelta?: Array<{ op: string; path: string; value?: any; display?: string; reason?: string }>;
  apiUsed?: ApiTarget;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  characterName: string;
  userName: string;
  presetId: string | null;
  lorebookIds: string[];
  variables: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

// ========== Constants ==========

/** Common SillyTavern prompt_order identifiers used in OpenAI presets. */
export const DEFAULT_PROMPT_ORDER = [
  { identifier: 'main', name: 'Main Prompt', role: 'system' as const },
  { identifier: 'worldInfoBefore', name: 'World Info (Before)', role: 'system' as const },
  { identifier: 'charDescription', name: 'Character Description', role: 'system' as const },
  { identifier: 'charPersonality', name: 'Character Personality', role: 'system' as const },
  { identifier: 'scenario', name: 'Scenario', role: 'system' as const },
  { identifier: 'personaDescription', name: 'Persona Description', role: 'system' as const },
  { identifier: 'dialogueExamples', name: 'Dialogue Examples', role: 'system' as const },
  { identifier: 'chatHistory', name: 'Chat History', role: 'system' as const },
  { identifier: 'worldInfoAfter', name: 'World Info (After)', role: 'system' as const },
  { identifier: 'groupNudge', name: 'Group Nudge', role: 'system' as const },
];

export function createDefaultPreset(): Omit<ChatPreset, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: '默认预设',
    description: '基础角色扮演预设，包含完整输出格式指令',
    regexes: [],
    settings: {
      temp_openai: 0.8,
      freq_pen_openai: 0,
      pres_pen_openai: 0,
      top_p_openai: 0.9,
      top_k_openai: 0,
      top_a_openai: 0,
      min_p_openai: 0,
      repetition_penalty_openai: 1,
      openai_max_context: 4096,
      openai_max_tokens: 2048,
      stream_openai: false,
      max_context_unlocked: false,
      chat_completion_source: 'openai',
      openai_model: 'gpt-3.5-turbo',
      main: `你是{{char}}，一位身处双世界交汇点的冒险者。现实与虚拟游戏世界正在融合，你需要在两个世界中同时应对挑战。根据当前状态、世界信息和历史对话推进剧情。

## 每轮输出格式
<thinking>你的战术推理或角色心理活动</thinking>
<maintext>本回合完整叙事正文，可多段落</maintext>
<option>选项A（战斗向）
选项B（探索向）
选项C（社交或策略向）</option>
<sum>本回合一言总结</sum>

选项至少2个，覆盖不同风格。你只需专注于写出精彩的剧情，变量和状态会由系统自动处理。`,
      nsfw: '',
      jailbreak: '',
      enhanceDefinitions: '',
      impersonation_prompt: '',
      new_chat_prompt: '',
      new_group_chat_prompt: '',
      new_example_chat_prompt: '',
      continue_nudge_prompt: '',
      wi_format: '',
      group_nudge_prompt: '',
      scenario_format: '',
      personality_format: '',
      prompts: [
        { identifier: 'main', name: 'Main Prompt', role: 'system' as const, content: `你是{{char}}，一位身处双世界交汇点的冒险者。现实与虚拟游戏世界正在融合，你需要在两个世界中同时应对挑战。根据变量状态、世界信息和历史对话推进剧情。

## 每轮输出格式（必须严格遵守）
<thinking>你的战术推理或角色心理活动</thinking>
<maintext>本回合完整叙事正文，可多段落</maintext>
<option>选项A（战斗向）
选项B（探索向）
选项C（社交或策略向）</option>
<sum>本回合一言总结</sum>
<vars>{"变化的变量": 新值}</vars>

选项至少2个，覆盖不同风格，不要重复上一轮的选项模式。`, system_prompt: true },
        { identifier: 'nsfw', name: 'Auxiliary Prompt', role: 'system' as const, content: '', system_prompt: true },
        { identifier: 'jailbreak', name: 'Post-History Instructions', role: 'system' as const, content: '', system_prompt: true },
        { identifier: 'worldInfoBefore', name: 'World Info (before)', role: 'system' as const, marker: true, system_prompt: true },
        { identifier: 'charDescription', name: 'Char Description', role: 'system' as const, marker: true, system_prompt: true },
        { identifier: 'charPersonality', name: 'Char Personality', role: 'system' as const, marker: true, system_prompt: true },
        { identifier: 'scenario', name: 'Scenario', role: 'system' as const, marker: true, system_prompt: true },
        { identifier: 'personaDescription', name: 'Persona Description', role: 'system' as const, marker: true, system_prompt: true },
        { identifier: 'dialogueExamples', name: 'Chat Examples', role: 'system' as const, marker: true, system_prompt: true },
        { identifier: 'worldInfoAfter', name: 'World Info (after)', role: 'system' as const, marker: true, system_prompt: true },
        { identifier: 'chatHistory', name: 'Chat History', role: 'system' as const, marker: true, system_prompt: true },
        { identifier: 'enhanceDefinitions', name: 'Enhance Definitions', role: 'system' as const, content: 'If you have more knowledge of {{char}}, add to the character lore and personality to enhance them but keep the Character Sheet definitions absolute.', system_prompt: true },
      ],
      prompt_order: DEFAULT_PROMPT_ORDER.map((p) => ({ ...p, enabled: true })),
    },
  };
}

// ========== v3 Game Mode Types ==========

export interface ParsedTags {
  thinking: string;
  maintext: string;
  options: string[];
  sum: string;
  varsRaw: string;
  varsCommands: VarsPatch;
  unknown: Record<string, string>;
}

export interface VarsPatch {
  /** Object that will be deep-merged into chat.variables */
  merge: Record<string, any>;
}

export type Task = 'story' | 'summary' | 'vars';
export type ApiTarget = 'primary' | 'secondary';
