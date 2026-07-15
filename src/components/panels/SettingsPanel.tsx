import { useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type ApiSettings,
  type ChatPreset,
  type RegexRule,
  createDefaultPreset,
} from '../../sillytavern/types';
import { testConnection, fetchModels } from '../../sillytavern/api-tools';
import { importPreset } from '../../sillytavern/importer';
import {
  getSettings, saveSettings, initializeDatabase,
  getPresets, savePreset, deletePreset as deletePresetDb,
} from '../../sillytavern/database';
import './SettingsPanel.css';

// ── helpers ──

function newRegex(): RegexRule {
  return {
    id: crypto.randomUUID(), name: '新规则', enabled: true,
    findRegex: '', replaceString: '',
    source: { userInput: true, aiOutput: true, slashCommand: false, worldInfo: false },
    destination: 'both', minDepth: null, maxDepth: null, runOnEdit: false, order: 0,
  };
}

// ── component ──

export default function SettingsPanel() {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => ({ ...DEFAULT_SETTINGS }));
  const [presets, setPresets] = useState<ChatPreset[]>([]);

  // navigation
  type Page = 'api' | 'presets' | 'presetEditor' | 'regexGlobal';
  const [page, setPage] = useState<Page>('api');
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetEditorTab, setPresetEditorTab] = useState<'params' | 'entries' | 'regex'>('params');
  const [presetForm, setPresetForm] = useState<Record<string, any>>({});
  const [presetRegexes, setPresetRegexes] = useState<RegexRule[]>([]);

  // api test state
  const [testPrim, setTestPrim] = useState<string | null>(null);
  const [testSec, setTestSec] = useState<string | null>(null);
  const [testingPrim, setTestingPrim] = useState(false);
  const [testingSec, setTestingSec] = useState(false);
  const [primModels, setPrimModels] = useState<string[]>([]);
  const [secModels, setSecModels] = useState<string[]>([]);
  const [fetchingPrim, setFetchingPrim] = useState(false);
  const [fetchingSec, setFetchingSec] = useState(false);

  // ── load ──
  useEffect(() => {
    (async () => {
      await initializeDatabase();
      const [s, p] = await Promise.all([getSettings(), getPresets()]);
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...s });
      setPresets(p);
      setLoaded(true);
    })();
  }, []);

  const persistSettings = useCallback(async (s: AppSettings) => {
    await saveSettings(s);
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  const updateApi = useCallback((patch: Partial<ApiSettings>) => {
    setSettings(prev => {
      const next = { ...prev, api: { ...prev.api, ...patch } };
      persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  // ── API fetch / test ──
  const handleFetchModels = async (target: 'primary' | 'secondary') => {
    const api = target === 'primary' ? settings.api : { baseUrl: settings.api.secondary?.baseUrl ?? '', apiKey: settings.api.secondary?.apiKey ?? '' };
    if (!api.baseUrl) return;
    const sf = target === 'primary' ? setFetchingPrim : setFetchingSec;
    const sm = target === 'primary' ? setPrimModels : setSecModels;
    sf(true);
    const { models } = await fetchModels(api);
    sm(models);
    sf(false);
  };
  const handleTest = async (target: 'primary' | 'secondary') => {
    const api = target === 'primary'
      ? { baseUrl: settings.api.baseUrl, apiKey: settings.api.apiKey, model: settings.api.model }
      : { baseUrl: settings.api.secondary?.baseUrl ?? '', apiKey: settings.api.secondary?.apiKey ?? '', model: settings.api.secondary?.model ?? '' };
    const sf = target === 'primary' ? setTestingPrim : setTestingSec;
    const sr = target === 'primary' ? setTestPrim : setTestSec;
    sf(true); sr(null);
    const r = await testConnection(api);
    sr(r.ok ? '✅ 连接成功' : `❌ ${r.error || `HTTP ${r.status} — ${r.errorBody || ''}`}`);
    sf(false);
  };

  // ── preset actions ──
  const handleNewPreset = async () => {
    const d = createDefaultPreset();
    const p: ChatPreset = { ...d, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() };
    await savePreset(p);
    setPresets(prev => [...prev, p]);
  };
  const handleImportPreset = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = async () => {
      const f = input.files?.[0]; if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        const imported = importPreset(data);
        const p: ChatPreset = { ...imported, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() };
        await savePreset(p);
        setPresets(prev => [...prev, p]);
      } catch { alert('导入失败：文件格式不正确'); }
    };
    input.click();
  };
  const handleDeletePreset = async (id: string) => {
    await deletePresetDb(id);
    setPresets(prev => prev.filter(p => p.id !== id));
    if (settings.activePresetId === id) updateSettings({ activePresetId: null });
  };
  const handleSelectPreset = async (id: string) => {
    updateSettings({ activePresetId: id });
  };
  const openPresetEditor = (p: ChatPreset) => {
    setEditingPresetId(p.id);
    setPresetForm({ ...p.settings, _name: p.name, _desc: p.description || '' });
    setPresetRegexes([...p.regexes]);
    setPresetEditorTab('params');
    setPage('presetEditor');
  };

  // ── preset editor ──
  const savePresetEditor = async () => {
    if (!editingPresetId) return;
    const p = presets.find(x => x.id === editingPresetId); if (!p) return;
    const { _name, _desc, ...settings } = presetForm;
    const updated: ChatPreset = { ...p, name: _name || p.name, description: _desc, settings, regexes: presetRegexes, updatedAt: Date.now() };
    await savePreset(updated);
    setPresets(prev => prev.map(x => x.id === editingPresetId ? updated : x));
    setPage('presets');
    setEditingPresetId(null);
  };

  // prompt entries
  const promptEntries = (presetForm.prompts || []) as Array<{ identifier: string; name?: string; role?: string; content?: string; enabled?: boolean; marker?: boolean; system_prompt?: boolean; injection_position?: number; injection_depth?: number; injection_order?: number; forbid_overrides?: boolean }>;
  const updatePromptEntry = (idx: number, patch: Partial<typeof promptEntries[number]>) => {
    const next = [...promptEntries];
    next[idx] = { ...next[idx], ...patch };
    setPresetForm({ ...presetForm, prompts: next });
  };
  const togglePromptEntry = (idx: number) => updatePromptEntry(idx, { enabled: !promptEntries[idx]?.enabled });
  const addPromptEntry = () => {
    setPresetForm({ ...presetForm, prompts: [...promptEntries, { identifier: 'custom_' + Date.now(), name: '新条目', role: 'system', content: '', enabled: true, marker: false }] });
  };
  const deletePromptEntry = (idx: number) => {
    setPresetForm({ ...presetForm, prompts: promptEntries.filter((_, i) => i !== idx) });
  };

  // ── regex helpers ──
  const updateGlobalRegex = (idx: number, patch: Partial<RegexRule>) => {
    const next = [...settings.globalRegexes];
    next[idx] = { ...next[idx], ...patch };
    updateSettings({ globalRegexes: next });
  };
  const addGlobalRegex = () => updateSettings({ globalRegexes: [...settings.globalRegexes, newRegex()] });
  const deleteGlobalRegex = (idx: number) => updateSettings({ globalRegexes: settings.globalRegexes.filter((_, i) => i !== idx) });

  const updatePresetRegex = (idx: number, patch: Partial<RegexRule>) => {
    const next = [...presetRegexes];
    next[idx] = { ...next[idx], ...patch };
    setPresetRegexes(next);
  };
  const addPresetRegex = () => setPresetRegexes([...presetRegexes, newRegex()]);
  const deletePresetRegex = (idx: number) => setPresetRegexes(presetRegexes.filter((_, i) => i !== idx));

  // ── render helpers ──
  const renderRegexEditor = (regexes: RegexRule[], updater: (i: number, p: Partial<RegexRule>) => void, adder: () => void, deleter: (i: number) => void) => (
    <div className="sp-section">
      <div className="sp-section-header">
        <span>正则规则 ({regexes.length})</span>
        <button className="sp-btn sp-btn--sm" onClick={adder}>+ 新增</button>
      </div>
      {regexes.map((r, i) => (
        <div key={r.id} className={`sp-regex-card ${r.enabled ? '' : 'sp-regex-card--disabled'}`}>
          <div className="sp-regex-top">
            <label className="sp-check"><input type="checkbox" checked={r.enabled} onChange={e => updater(i, { enabled: e.target.checked })} />{r.name}</label>
            <button className="sp-icon-btn sp-icon-btn--danger" onClick={() => deleter(i)}>✕</button>
          </div>
          <input className="sp-input sp-input--mono" value={r.findRegex} onChange={e => updater(i, { findRegex: e.target.value })} placeholder="/正则表达式/g" />
          <input className="sp-input sp-input--mono" value={r.replaceString} onChange={e => updater(i, { replaceString: e.target.value })} placeholder="替换为…" />
          <div className="sp-regex-meta">
            <select value={r.destination} onChange={e => updater(i, { destination: e.target.value as RegexRule['destination'] })} className="sp-input">
              <option value="display">仅显示</option><option value="prompt">仅提示词</option><option value="both">两者</option>
            </select>
          </div>
        </div>
      ))}
      {regexes.length === 0 && <div className="sp-empty">暂无正则规则</div>}
    </div>
  );

  const renderField = (label: string, child: React.ReactNode) => (
    <label className="sp-field"><span className="sp-label">{label}</span>{child}</label>
  );

  if (!loaded) return <div className="sp-loading">加载中…</div>;

  const editingPreset = presets.find(p => p.id === editingPresetId);

  return (
    <div className="sp-panel">
      {/* ── sidebar list ── */}
      <div className="sp-sidebar">
        <button className={`sp-nav-item ${page === 'api' || page === 'presets' || page === 'regexGlobal' ? '' : ''} ${page === 'api' ? 'sp-nav-item--active' : ''}`}
          onClick={() => { setPage('api'); setEditingPresetId(null); }}>
          <span className="sp-nav-icon">🔌</span>API 设置
        </button>
        <button className={`sp-nav-item ${page === 'presets' || page === 'presetEditor' || page === 'regexGlobal' ? 'sp-nav-item--active' : ''}`}
          onClick={() => { setPage('presets'); setEditingPresetId(null); }}>
          <span className="sp-nav-icon">✦</span>预设
        </button>
      </div>

      {/* ── main content ── */}
      <div className="sp-main">
        {/* ============ API SETTINGS ============ */}
        {page === 'api' && (
          <div className="sp-section">
            <h3 className="sp-section-title">主 API</h3>
            {renderField('Base URL', <input className="sp-input sp-input--mono" value={settings.api.baseUrl} onChange={e => updateApi({ baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" />)}
            {renderField('API Key', <input className="sp-input sp-input--mono" type="password" value={settings.api.apiKey} onChange={e => updateApi({ apiKey: e.target.value })} placeholder="sk-..." />)}
            {renderField('Model', <div className="sp-model-row">
              <div className="sp-model-select-wrap">
                {primModels.length > 0 ? (
                  <select className="sp-input sp-input--mono" value={settings.api.model} onChange={e => updateApi({ model: e.target.value })}>
                    <option value="">-- 选择模型 --</option>
                    {primModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : <input className="sp-input sp-input--mono" value={settings.api.model} onChange={e => updateApi({ model: e.target.value })} placeholder="手动输入" />}
              </div>
              <button className="sp-btn sp-btn--fetch" onClick={() => handleFetchModels('primary')} disabled={fetchingPrim}>{fetchingPrim ? '获取中…' : '获取模型'}</button>
            </div>)}
            <div className="sp-action-row">
              <button className="sp-btn sp-btn--test" onClick={() => handleTest('primary')} disabled={testingPrim}>{testingPrim ? '测试中…' : '测试连通性'}</button>
              {testPrim && <span className={`sp-test-result ${testPrim.startsWith('✅') ? 'sp-test-result--ok' : 'sp-test-result--fail'}`}>{testPrim}</span>}
            </div>

            <h3 className="sp-section-title" style={{ marginTop: 20 }}>次 API（变量提取）</h3>
            <label className="sp-check" style={{ marginBottom: 12 }}><input type="checkbox" checked={settings.api.secondary?.enabled ?? false} onChange={e => {
              const enabled = e.target.checked;
              updateApi({ secondary: enabled ? { enabled: true, baseUrl: settings.api.secondary?.baseUrl ?? settings.api.baseUrl, apiKey: settings.api.secondary?.apiKey ?? '', model: settings.api.secondary?.model ?? settings.api.model } : { ...settings.api.secondary!, enabled: false } });
            }} />启用次 API — 变量提取和总结由次 API 处理（可用便宜模型），挂了自动 fallback</label>
            {settings.api.secondary?.enabled && <>
              {renderField('Base URL', <input className="sp-input sp-input--mono" value={settings.api.secondary?.baseUrl ?? ''} onChange={e => updateApi({ secondary: { ...settings.api.secondary!, baseUrl: e.target.value } })} placeholder="https://api.deepseek.com/v1" />)}
              {renderField('API Key', <input className="sp-input sp-input--mono" type="password" value={settings.api.secondary?.apiKey ?? ''} onChange={e => updateApi({ secondary: { ...settings.api.secondary!, apiKey: e.target.value } })} />)}
              {renderField('Model', <div className="sp-model-row">
                <div className="sp-model-select-wrap">
                  {secModels.length > 0 ? (
                    <select className="sp-input sp-input--mono" value={settings.api.secondary?.model ?? ''} onChange={e => updateApi({ secondary: { ...settings.api.secondary!, model: e.target.value } })}>
                      <option value="">-- 选择模型 --</option>
                      {secModels.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  ) : <input className="sp-input sp-input--mono" value={settings.api.secondary?.model ?? ''} onChange={e => updateApi({ secondary: { ...settings.api.secondary!, model: e.target.value } })} placeholder="手动输入" />}
                </div>
                <button className="sp-btn sp-btn--fetch" onClick={() => handleFetchModels('secondary')} disabled={fetchingSec}>{fetchingSec ? '获取中…' : '获取模型'}</button>
              </div>)}
              <div className="sp-action-row" style={{ marginTop: 8 }}>
                <button className="sp-btn sp-btn--test" onClick={() => handleTest('secondary')} disabled={testingSec}>{testingSec ? '测试中…' : '测试连通性'}</button>
                {testSec && <span className={`sp-test-result ${testSec.startsWith('✅') ? 'sp-test-result--ok' : 'sp-test-result--fail'}`}>{testSec}</span>}
              </div>
            </>}
          </div>
        )}

        {/* ============ PRESETS LIST ============ */}
        {page === 'presets' && (
          <div className="sp-section">
            <div className="sp-section-header">
              <span>预设列表</span>
              <div className="sp-header-btns">
                <button className="sp-btn sp-btn--sm" onClick={() => setPage('regexGlobal')}>正则</button>
                <button className="sp-btn sp-btn--sm" onClick={handleNewPreset}>+ 新建</button>
                <button className="sp-btn sp-btn--sm" onClick={handleImportPreset}>📥 导入</button>
              </div>
            </div>
            {presets.map(p => (
              <div key={p.id} className={`sp-preset-card ${settings.activePresetId === p.id ? 'sp-preset-card--active' : ''}`}>
                <div className="sp-preset-main" onClick={() => handleSelectPreset(p.id)}>
                  <div className="sp-preset-info">
                    <span className="sp-preset-name">{p.name}</span>
                    <span className="sp-preset-meta">{p.description || '无描述'} · temp: {p.settings.temp_openai ?? 0.8} · regex: {p.regexes.length}</span>
                  </div>
                  <div className="sp-preset-acts">
                    {settings.activePresetId === p.id && <span className="sp-badge">使用中</span>}
                    <button className="sp-icon-btn" onClick={e => { e.stopPropagation(); openPresetEditor(p); }}>✏</button>
                    <button className="sp-icon-btn sp-icon-btn--danger" onClick={e => { e.stopPropagation(); handleDeletePreset(p.id); }}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
            {presets.length === 0 && <div className="sp-empty">暂无预设，点「+ 新建」创建或「📥 导入」JSON 文件</div>}
          </div>
        )}

        {/* ============ GLOBAL REGEX ============ */}
        {page === 'regexGlobal' && (
          <div className="sp-section">
            <div className="sp-section-header">
              <button className="sp-btn sp-btn--sm" onClick={() => setPage('presets')}>← 返回预设</button>
              <span>全局正则（对所有预设生效）</span>
            </div>
            {renderRegexEditor(settings.globalRegexes, updateGlobalRegex, addGlobalRegex, deleteGlobalRegex)}
          </div>
        )}

        {/* ============ PRESET EDITOR ============ */}
        {page === 'presetEditor' && editingPreset && (
          <div className="sp-section">
            <div className="sp-section-header">
              <button className="sp-btn sp-btn--sm" onClick={savePresetEditor}>← 保存并返回</button>
              <span>编辑：{editingPreset.name}</span>
            </div>
            <div className="sp-tabs">
              <button className={`sp-tab ${presetEditorTab === 'params' ? 'sp-tab--active' : ''}`} onClick={() => setPresetEditorTab('params')}>参数</button>
              <button className={`sp-tab ${presetEditorTab === 'entries' ? 'sp-tab--active' : ''}`} onClick={() => setPresetEditorTab('entries')}>条目</button>
              <button className={`sp-tab ${presetEditorTab === 'regex' ? 'sp-tab--active' : ''}`} onClick={() => setPresetEditorTab('regex')}>正则 ({presetRegexes.length})</button>
            </div>

            {presetEditorTab === 'params' && (
              <div className="sp-form">
                {renderField('名称', <input className="sp-input" value={presetForm._name ?? ''} onChange={e => setPresetForm({ ...presetForm, _name: e.target.value })} />)}
                {renderField('描述', <input className="sp-input" value={presetForm._desc ?? ''} onChange={e => setPresetForm({ ...presetForm, _desc: e.target.value })} />)}
                <div className="sp-field-row">
                  {renderField('Temperature', <input className="sp-input" type="number" min={0} max={2} step={0.05} value={presetForm.temp_openai ?? 0.8} onChange={e => setPresetForm({ ...presetForm, temp_openai: Number(e.target.value) })} />)}
                  {renderField('Top P', <input className="sp-input" type="number" min={0} max={1} step={0.05} value={presetForm.top_p_openai ?? 0.9} onChange={e => setPresetForm({ ...presetForm, top_p_openai: Number(e.target.value) })} />)}
                </div>
                <div className="sp-field-row">
                  {renderField('Max Tokens', <input className="sp-input" type="number" min={64} max={32768} step={64} value={presetForm.openai_max_tokens ?? 2048} onChange={e => setPresetForm({ ...presetForm, openai_max_tokens: Number(e.target.value) })} />)}
                  {renderField('Max Context', <input className="sp-input" type="number" min={512} max={128000} step={512} value={presetForm.openai_max_context ?? 4096} onChange={e => setPresetForm({ ...presetForm, openai_max_context: Number(e.target.value) })} />)}
                </div>
                <p className="sp-hint" style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>提示词内容在「条目」标签中编辑——预设由条目按顺序组装而成。</p>
              </div>
            )}

            {presetEditorTab === 'entries' && (
              <div className="sp-section">
                <div className="sp-section-header">
                  <span>条目列表（按此顺序组装 Prompt）</span>
                  <button className="sp-btn sp-btn--sm" onClick={addPromptEntry}>+ 新增条目</button>
                </div>
                {promptEntries.length === 0 && <div className="sp-empty">暂未定义任何条目。条目是预设的核心——它们按顺序组装成发送给AI的完整Prompt。</div>}
                {promptEntries.map((e, i) => (
                  <div key={i} className={`sp-entry-card ${e.enabled === false ? 'sp-entry-card--disabled' : ''}`}>
                    <div className="sp-entry-top">
                      <div className="sp-entry-top-left">
                        <button className="sp-icon-btn sp-icon-btn--sm" onClick={() => { if (i > 0) { const next = [...promptEntries]; [next[i-1], next[i]] = [next[i], next[i-1]]; setPresetForm({ ...presetForm, prompts: next }); } }} disabled={i === 0} title="上移">↑</button>
                        <button className="sp-icon-btn sp-icon-btn--sm" onClick={() => { if (i < promptEntries.length - 1) { const next = [...promptEntries]; [next[i], next[i+1]] = [next[i+1], next[i]]; setPresetForm({ ...presetForm, prompts: next }); } }} disabled={i === promptEntries.length - 1} title="下移">↓</button>
                        <label className="sp-check"><input type="checkbox" checked={e.enabled !== false} onChange={() => togglePromptEntry(i)} /><strong>{e.identifier}</strong></label>
                        <span className="sp-entry-badge">{e.marker ? '动态' : '文本'}</span>
                      </div>
                      <button className="sp-icon-btn sp-icon-btn--danger" onClick={() => deletePromptEntry(i)}>✕</button>
                    </div>
                    <div className="sp-entry-body">
                      <div className="sp-field-row">
                        {renderField('标识符', <input className="sp-input" value={e.identifier} onChange={ev => updatePromptEntry(i, { identifier: ev.target.value })} placeholder="main" />)}
                        {renderField('名称', <input className="sp-input" value={e.name ?? ''} onChange={ev => updatePromptEntry(i, { name: ev.target.value })} placeholder="Main Prompt" />)}
                      </div>
                      <div className="sp-field-row">
                        {renderField('角色', <select className="sp-input" value={e.role ?? 'system'} onChange={ev => updatePromptEntry(i, { role: ev.target.value })}>
                          <option value="system">system</option><option value="user">user</option><option value="assistant">assistant</option>
                        </select>)}
                        {renderField('注入位置', <select className="sp-input" value={e.injection_position ?? 0} onChange={ev => updatePromptEntry(i, { injection_position: Number(ev.target.value) })}>
                          <option value={0}>0 - 相对（系统提示区）</option><option value={1}>1 - 绝对（聊天深度）</option>
                        </select>)}
                      </div>
                      <div className="sp-field-row">
                        <label className="sp-check"><input type="checkbox" checked={!!e.marker} onChange={ev => updatePromptEntry(i, { marker: ev.target.checked || undefined })} />动态占位</label>
                        <label className="sp-check"><input type="checkbox" checked={!!e.system_prompt} onChange={ev => updatePromptEntry(i, { system_prompt: ev.target.checked || undefined })} />系统提示（可被角色卡覆盖）</label>
                      </div>
                      {e.injection_position === 1 && (
                        <div className="sp-field-row">
                          {renderField('深度', <input className="sp-input" type="number" value={e.injection_depth ?? 4} onChange={ev => updatePromptEntry(i, { injection_depth: Number(ev.target.value) })} />)}
                          {renderField('顺序', <input className="sp-input" type="number" value={e.injection_order ?? 100} onChange={ev => updatePromptEntry(i, { injection_order: Number(ev.target.value) })} />)}
                        </div>
                      )}
                      {!e.marker && (
                        <textarea className="sp-input sp-textarea" rows={3} value={e.content ?? ''} onChange={ev => updatePromptEntry(i, { content: ev.target.value })} placeholder="条目文本内容…" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {presetEditorTab === 'regex' && renderRegexEditor(presetRegexes, updatePresetRegex, addPresetRegex, deletePresetRegex)}
          </div>
        )}
      </div>
    </div>
  );
}
