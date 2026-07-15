import { useState, useCallback, useEffect } from 'react';
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type ApiSettings,
} from '../../sillytavern/types';
import { testConnection, fetchModels } from '../../sillytavern/api-tools';
import {
  getSettings,
  saveSettings,
  initializeDatabase,
} from '../../sillytavern/database';
import './SettingsPanel.css';

// ============================================================
// Types — reserved for future expansion
// ============================================================

/** 预留：主题配置 */
export interface ThemeConfig {
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  messageSpacing: 'compact' | 'normal' | 'relaxed';
  showTimestamps: boolean;
  /** 预留：自定义 CSS 变量覆盖 */
  customCssOverrides: Record<string, string>;
}

/** 预留：游戏系统配置 */
export interface GameplayConfig {
  /** 变量系统是否在输入框旁显示变量面板 */
  showVariablePanel: boolean;
  /** 自动将游戏状态注入为变量 */
  autoInjectGameState: boolean;
  /** 变量快照保存频率 (回合数) */
  snapshotFrequency: number;
  /** 双世界变量隔离 */
  worldSpecificVariables: boolean;
}

/** 预留：扩展配置 */
export interface ExtensionConfig {
  /** 启用的扩展 ID 列表 */
  enabledExtensions: string[];
  /** 扩展自定义设置 */
  extensionSettings: Record<string, Record<string, unknown>>;
}

/** 完整设置（合并 tavernlike AppSettings + 项目扩展） */
export interface FullSettings extends AppSettings {
  themeConfig: ThemeConfig;
  gameplayConfig: GameplayConfig;
  extensionConfig: ExtensionConfig;
  // 预留字段，方便后续加东西
  [key: string]: unknown;
}

// ============================================================
// Defaults
// ============================================================

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  primaryColor: '#00d4ff',
  fontSize: 'medium',
  messageSpacing: 'normal',
  showTimestamps: true,
  customCssOverrides: {},
};

export const DEFAULT_GAMEPLAY_CONFIG: GameplayConfig = {
  showVariablePanel: false,
  autoInjectGameState: true,
  snapshotFrequency: 1,
  worldSpecificVariables: true,
};

export const DEFAULT_EXTENSION_CONFIG: ExtensionConfig = {
  enabledExtensions: [],
  extensionSettings: {},
};

// ============================================================
// Helpers
// ============================================================

function buildFullSettings(partial: Partial<AppSettings>): FullSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    themeConfig: { ...DEFAULT_THEME_CONFIG },
    gameplayConfig: { ...DEFAULT_GAMEPLAY_CONFIG },
    extensionConfig: { ...DEFAULT_EXTENSION_CONFIG },
  };
}

type SettingsTab = 'basic' | 'api' | 'secondary';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'basic', label: '基础设置' },
  { id: 'api', label: 'API 配置' },
  { id: 'secondary', label: '次 API' },
];

// ============================================================
// Component
// ============================================================

export default function SettingsPanel() {
  const [settings, setSettings] = useState<FullSettings>(() => buildFullSettings({}));
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<SettingsTab>('basic');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // -- API test state --
  const [testingPrimary, setTestingPrimary] = useState(false);
  const [testResultPrimary, setTestResultPrimary] = useState<string | null>(null);
  const [testingSecondary, setTestingSecondary] = useState(false);
  const [testResultSecondary, setTestResultSecondary] = useState<string | null>(null);

  // -- Model list --
  const [primaryModels, setPrimaryModels] = useState<string[]>([]);
  const [secondaryModels, setSecondaryModels] = useState<string[]>([]);
  const [fetchingPrimary, setFetchingPrimary] = useState(false);
  const [fetchingSecondary, setFetchingSecondary] = useState(false);
  const [primaryModelSource, setPrimaryModelSource] = useState<string | null>(null);
  const [secondaryModelSource, setSecondaryModelSource] = useState<string | null>(null);

  // Load from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await initializeDatabase();
      const saved = await getSettings();
      if (cancelled) return;
      if (saved) {
        setSettings(buildFullSettings(saved));
      } else {
        // First run: persist defaults
        await saveSettings(DEFAULT_SETTINGS);
        setSettings(buildFullSettings({}));
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Explicit model fetch handler
  const handleFetchModels = useCallback(async (target: 'primary' | 'secondary') => {
    const api = target === 'primary'
      ? { baseUrl: settings.api.baseUrl, apiKey: settings.api.apiKey }
      : { baseUrl: settings.api.secondary?.baseUrl ?? '', apiKey: settings.api.secondary?.apiKey ?? '' };
    if (!api.baseUrl) return;

    const setFetching = target === 'primary' ? setFetchingPrimary : setFetchingSecondary;
    const setModels = target === 'primary' ? setPrimaryModels : setSecondaryModels;
    const setSource = target === 'primary' ? setPrimaryModelSource : setSecondaryModelSource;

    setFetching(true);
    try {
      const { models, source, error } = await fetchModels(api);
      setModels(models);
      setSource(error ? `⚠ ${error}` : source === 'remote' ? '远程获取' : '内置列表');
    } catch {
      setModels([]);
      setSource('获取失败');
    } finally {
      setFetching(false);
    }
  }, [settings.api]);

  // -- Persist --
  const persist = useCallback(
    async (next: FullSettings) => {
      try {
        const toSave: AppSettings = {
          key: next.key,
          api: next.api,
          apiMode: next.apiMode,
          activePresetId: next.activePresetId,
          activeLorebookIds: next.activeLorebookIds,
          userName: next.userName,
          characterName: next.characterName,
          theme: next.theme,
          language: next.language,
          autoSave: next.autoSave,
          autoSaveInterval: next.autoSaveInterval,
          uiMode: next.uiMode,
          customTags: next.customTags,
          formatPromptTemplate: next.formatPromptTemplate,
          thinkingDisplay: next.thinkingDisplay,
        };
        await saveSettings(toSave);
        setSaveMsg('已保存');
        setTimeout(() => setSaveMsg(null), 2000);
      } catch {
        setSaveMsg('保存失败');
      }
    },
    []
  );

  const update = useCallback(
    (patch: Partial<FullSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateApi = useCallback(
    (patch: Partial<ApiSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, api: { ...prev.api, ...patch } };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateSecondary = useCallback(
    (patch: Partial<NonNullable<ApiSettings['secondary']>>) => {
      setSettings((prev) => {
        const secondary = { ...prev.api.secondary, ...patch } as NonNullable<ApiSettings['secondary']>;
        const next = { ...prev, api: { ...prev.api, secondary } };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  // -- Test connection --
  const handleTestPrimary = useCallback(async () => {
    setTestingPrimary(true);
    setTestResultPrimary(null);
    const result = await testConnection({
      baseUrl: settings.api.baseUrl,
      apiKey: settings.api.apiKey,
      model: settings.api.model,
    });
    setTestResultPrimary(result.ok ? '✅ 连接成功' : `❌ 失败: ${result.error || `HTTP ${result.status} — ${result.errorBody || '无详情'}`}`);
    setTestingPrimary(false);
  }, [settings.api]);

  const handleTestSecondary = useCallback(async () => {
    const sec = settings.api.secondary;
    if (!sec?.enabled) return;
    setTestingSecondary(true);
    setTestResultSecondary(null);
    const result = await testConnection({
      baseUrl: sec.baseUrl,
      apiKey: sec.apiKey,
      model: sec.model,
    });
    setTestResultSecondary(result.ok ? '✅ 连接成功' : `❌ 失败: ${result.error || `HTTP ${result.status} — ${result.errorBody || '无详情'}`}`);
    setTestingSecondary(false);
  }, [settings.api.secondary]);

  if (!loaded) {
    return <div className="sp-loading">加载中…</div>;
  }

  return (
    <div className="sp-panel">
      {/* Tab bar */}
      <div className="sp-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`sp-tab${tab === t.id ? ' sp-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="sp-body">
        {/* ============================================
            Tab 1: 基础设置
           ============================================ */}
        {tab === 'basic' && (
          <div className="sp-section">
            {/* 角色信息 */}
            <fieldset className="sp-fieldset">
              <legend className="sp-legend">角色</legend>
              <label className="sp-field">
                <span className="sp-label">你的名字</span>
                <input
                  className="sp-input"
                  value={settings.userName}
                  onChange={(e) => update({ userName: e.target.value })}
                  placeholder="用户"
                />
              </label>
              <label className="sp-field">
                <span className="sp-label">AI 角色名</span>
                <input
                  className="sp-input"
                  value={settings.characterName}
                  onChange={(e) => update({ characterName: e.target.value })}
                  placeholder="AI"
                />
              </label>
            </fieldset>

            {/* 界面 */}
            <fieldset className="sp-fieldset">
              <legend className="sp-legend">界面</legend>
              <label className="sp-field">
                <span className="sp-label">UI 模式</span>
                <select
                  className="sp-input"
                  value={settings.uiMode}
                  onChange={(e) => update({ uiMode: e.target.value as 'game' | 'chat' })}
                >
                  <option value="game">游戏模式（正文+选项）</option>
                  <option value="chat">聊天模式</option>
                </select>
              </label>
              <label className="sp-field">
                <span className="sp-label">思考过程显示</span>
                <select
                  className="sp-input"
                  value={settings.thinkingDisplay}
                  onChange={(e) => update({ thinkingDisplay: e.target.value as 'fold' | 'hide' | 'inline' })}
                >
                  <option value="fold">折叠（默认）</option>
                  <option value="hide">隐藏</option>
                  <option value="inline">内联显示</option>
                </select>
              </label>
              <label className="sp-field">
                <span className="sp-label">语言</span>
                <select
                  className="sp-input"
                  value={settings.language}
                  onChange={(e) => update({ language: e.target.value as 'zh' | 'en' })}
                >
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </label>
            </fieldset>

            {/* 自动保存 */}
            <fieldset className="sp-fieldset">
              <legend className="sp-legend">存储</legend>
              <label className="sp-field sp-field--row">
                <span className="sp-label">自动保存</span>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => update({ autoSave: e.target.checked })}
                />
              </label>
              {settings.autoSave && (
                <label className="sp-field">
                  <span className="sp-label">保存间隔（秒）</span>
                  <input
                    className="sp-input"
                    type="number"
                    min={10}
                    max={300}
                    value={settings.autoSaveInterval}
                    onChange={(e) => update({ autoSaveInterval: Number(e.target.value) || 30 })}
                  />
                </label>
              )}
            </fieldset>

            {/* 预留：游戏设置入口 */}
            <fieldset className="sp-fieldset sp-fieldset--muted">
              <legend className="sp-legend">游戏设置（预留）</legend>
              <p className="sp-hint">变量面板、游戏状态自动注入、快照频率等 — 待后续版本开放。</p>
            </fieldset>
          </div>
        )}

        {/* ============================================
            Tab 2: API 配置
           ============================================ */}
        {tab === 'api' && (
          <div className="sp-section">
            <fieldset className="sp-fieldset">
              <legend className="sp-legend">主 API — 叙事生成</legend>

              <label className="sp-field">
                <span className="sp-label">Base URL</span>
                <input
                  className="sp-input sp-input--mono"
                  value={settings.api.baseUrl}
                  onChange={(e) => updateApi({ baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                />
                <span className="sp-hint">OpenAI 兼容端点，支持 DeepSeek / Kimi / 通义千问 / 本地模型</span>
              </label>

              <label className="sp-field">
                <span className="sp-label">API Key</span>
                <input
                  className="sp-input sp-input--mono"
                  type="password"
                  value={settings.api.apiKey}
                  onChange={(e) => updateApi({ apiKey: e.target.value })}
                  placeholder="sk-..."
                />
              </label>

              <label className="sp-field">
                <span className="sp-label">Model</span>
                <div className="sp-model-row">
                  <div className="sp-model-select-wrap">
                    {primaryModels.length > 0 ? (
                      <select
                        className="sp-input sp-input--mono"
                        value={settings.api.model}
                        onChange={(e) => updateApi({ model: e.target.value })}
                      >
                        <option value="">-- 选择模型 --</option>
                        {primaryModels.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="sp-input sp-input--mono"
                        value={settings.api.model}
                        onChange={(e) => updateApi({ model: e.target.value })}
                        placeholder="手动输入模型名"
                      />
                    )}
                  </div>
                  <button
                    className="sp-btn sp-btn--fetch"
                    onClick={() => handleFetchModels('primary')}
                    disabled={fetchingPrimary || !settings.api.baseUrl}
                  >
                    {fetchingPrimary ? '获取中…' : '获取模型'}
                  </button>
                </div>
                {primaryModelSource && (
                  <span className={`sp-hint${primaryModelSource.startsWith('⚠') ? ' sp-hint--warn' : ''}`}>
                    {primaryModelSource} · {primaryModels.length} 个模型
                  </span>
                )}
              </label>

              <label className="sp-field">
                <span className="sp-label">超时（毫秒）</span>
                <input
                  className="sp-input"
                  type="number"
                  min={5000}
                  max={300000}
                  step={5000}
                  value={settings.api.timeout}
                  onChange={(e) => updateApi({ timeout: Number(e.target.value) || 60000 })}
                />
              </label>

              <div className="sp-action-row">
                <button
                  className="sp-btn sp-btn--test"
                  onClick={handleTestPrimary}
                  disabled={testingPrimary || !settings.api.baseUrl || !settings.api.apiKey}
                >
                  {testingPrimary ? '测试中…' : '测试连通性'}
                </button>
                {testResultPrimary && (
                  <span className={`sp-test-result${testResultPrimary.startsWith('✅') ? ' sp-test-result--ok' : ' sp-test-result--fail'}`}>
                    {testResultPrimary}
                  </span>
                )}
              </div>
            </fieldset>

            {/* 预留：高级 API 设置 */}
            <fieldset className="sp-fieldset sp-fieldset--muted">
              <legend className="sp-legend">高级（预留）</legend>
              <p className="sp-hint">流式输出策略、重试配置、请求头自定义、代理设置等 — 待后续版本开放。</p>
            </fieldset>
          </div>
        )}

        {/* ============================================
            Tab 3: 次 API 配置
           ============================================ */}
        {tab === 'secondary' && (
          <div className="sp-section">
            <fieldset className="sp-fieldset">
              <legend className="sp-legend">次 API — 变量提取 & 总结</legend>

              <label className="sp-field sp-field--row">
                <span className="sp-label">启用次 API</span>
                <input
                  type="checkbox"
                  checked={settings.api.secondary?.enabled ?? false}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    if (enabled && !settings.api.secondary) {
                      updateApi({
                        secondary: {
                          enabled: true,
                          baseUrl: settings.api.baseUrl,
                          apiKey: settings.api.apiKey,
                          model: settings.api.model,
                        },
                      });
                    } else if (settings.api.secondary) {
                      updateApi({
                        secondary: { ...settings.api.secondary, enabled },
                      });
                    }
                  }}
                />
              </label>

              <p className="sp-hint" style={{ marginTop: -4, marginBottom: 12 }}>
                启用后，变量提取和总结由次 API 处理（可用便宜模型省钱）。次 API 挂了自动 fallback 到主 API。
              </p>

              {settings.api.secondary?.enabled && (
                <>
                  <label className="sp-field">
                    <span className="sp-label">Base URL</span>
                    <input
                      className="sp-input sp-input--mono"
                      value={settings.api.secondary?.baseUrl ?? ''}
                      onChange={(e) => updateSecondary({ baseUrl: e.target.value })}
                      placeholder="https://api.deepseek.com/v1"
                    />
                  </label>

                  <label className="sp-field">
                    <span className="sp-label">API Key</span>
                    <input
                      className="sp-input sp-input--mono"
                      type="password"
                      value={settings.api.secondary?.apiKey ?? ''}
                      onChange={(e) => updateSecondary({ apiKey: e.target.value })}
                      placeholder="sk-..."
                    />
                  </label>

                  <label className="sp-field">
                    <span className="sp-label">Model</span>
                    <div className="sp-model-row">
                      <input
                        className="sp-input sp-input--mono"
                        value={settings.api.secondary?.model ?? ''}
                        onChange={(e) => updateSecondary({ model: e.target.value })}
                        placeholder="deepseek-chat"
                        />
                      <button
                        className="sp-btn sp-btn--fetch"
                        onClick={() => handleFetchModels('secondary')}
                        disabled={fetchingSecondary || !settings.api.secondary?.baseUrl}
                      >
                        {fetchingSecondary ? '获取中…' : '获取模型'}
                      </button>
                    </div>
                    {secondaryModels.length > 0 ? (
                      <select
                        className="sp-input sp-input--mono"
                        value={settings.api.secondary?.model ?? ''}
                        onChange={(e) => updateSecondary({ model: e.target.value })}
                        style={{ marginTop: 6 }}
                      >
                        <option value="">-- 选择模型 --</option>
                        {secondaryModels.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    ) : null}
                    {secondaryModelSource && (
                      <span className={`sp-hint${secondaryModelSource.startsWith('⚠') ? ' sp-hint--warn' : ''}`}>
                        {secondaryModelSource} · {secondaryModels.length} 个模型
                      </span>
                    )}
                  </label>

                  <label className="sp-field">
                    <span className="sp-label">Temperature</span>
                    <input
                      className="sp-input"
                      type="number"
                      min={0}
                      max={2}
                      step={0.1}
                      value={settings.api.secondary?.temperature ?? 0.3}
                      onChange={(e) => updateSecondary({ temperature: Number(e.target.value) })}
                    />
                    <span className="sp-hint">次 API 建议用较低温度 (0.1-0.4)，保证变量提取的稳定性</span>
                  </label>

                  <label className="sp-field">
                    <span className="sp-label">Max Tokens</span>
                    <input
                      className="sp-input"
                      type="number"
                      min={64}
                      max={4096}
                      step={64}
                      value={settings.api.secondary?.maxTokens ?? 512}
                      onChange={(e) => updateSecondary({ maxTokens: Number(e.target.value) })}
                    />
                    <span className="sp-hint">变量和总结不需要太多 token，512 通常够了</span>
                  </label>

                  <div className="sp-action-row">
                    <button
                      className="sp-btn sp-btn--test"
                      onClick={handleTestSecondary}
                      disabled={testingSecondary || !settings.api.secondary?.baseUrl || !settings.api.secondary?.apiKey}
                    >
                      {testingSecondary ? '测试中…' : '测试连通性'}
                    </button>
                    {testResultSecondary && (
                      <span className={`sp-test-result${testResultSecondary.startsWith('✅') ? ' sp-test-result--ok' : ' sp-test-result--fail'}`}>
                        {testResultSecondary}
                      </span>
                    )}
                  </div>
                </>
              )}
            </fieldset>

            {/* 预留：次 API 高级设置 */}
            <fieldset className="sp-fieldset sp-fieldset--muted">
              <legend className="sp-legend">分流策略（预留）</legend>
              <p className="sp-hint">
                任务分配规则、条件分流（如特定标签走次 API）、负载均衡策略等 — 待后续版本开放。
              </p>
            </fieldset>
          </div>
        )}

        {/* Save indicator */}
        {saveMsg && (
          <div className={`sp-save-indicator${saveMsg === '保存失败' ? ' sp-save-indicator--error' : ''}`}>
            {saveMsg}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Re-export: hook-friendly settings accessor
// 预留：供其他组件通过 Context 或直接导入使用
// ============================================================
export { getSettings, saveSettings, initializeDatabase };
