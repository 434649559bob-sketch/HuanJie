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

type Page = 'api' | 'presets' | 'presetEditor';

// ── component ──

export default function SettingsPanel() {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => ({ ...DEFAULT_SETTINGS }));
  const [presets, setPresets] = useState<ChatPreset[]>([]);
  const [page, setPage] = useState<Page>('api');
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);

  // API test state
  const [testPrim, setTestPrim] = useState<string | null>(null);
  const [testSec, setTestSec] = useState<string | null>(null);
  const [testingPrim, setTestingPrim] = useState(false);
  const [testingSec, setTestingSec] = useState(false);
  const [primModels, setPrimModels] = useState<string[]>([]);
  const [secModels, setSecModels] = useState<string[]>([]);
  const [fetchingPrim, setFetchingPrim] = useState(false);
  const [fetchingSec, setFetchingSec] = useState(false);

  useEffect(() => {
    (async () => {
      await initializeDatabase();
      const [s, p] = await Promise.all([getSettings(), getPresets()]);
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...s });
      setPresets(p);
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback(async (s: AppSettings) => { await saveSettings(s); }, []);

  const updateApi = useCallback((patch: Partial<ApiSettings>) => {
    setSettings(prev => { const next = { ...prev, api: { ...prev.api, ...patch } }; persist(next); return next; });
  }, [persist]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings(prev => { const next = { ...prev, ...patch }; persist(next); return next; });
  }, [persist]);

  // ── API ──
  const handleFetch = async (target: 'primary' | 'secondary') => {
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

  // ── Presets ──
  const handleSelectPreset = async (id: string) => updateSettings({ activePresetId: id });

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
        const rawName = f.name.replace(/\.json$/i, '');
        const data = JSON.parse(await f.text());
        const presetName = rawName || data.name || '导入的预设';
        const normalized = { ...data };
        if (normalized.temperature !== undefined && normalized.temp_openai === undefined) normalized.temp_openai = normalized.temperature;
        if (normalized.top_p !== undefined && normalized.top_p_openai === undefined) normalized.top_p_openai = normalized.top_p;
        if (normalized.frequency_penalty !== undefined && normalized.freq_pen_openai === undefined) normalized.freq_pen_openai = normalized.frequency_penalty;
        if (normalized.presence_penalty !== undefined && normalized.pres_pen_openai === undefined) normalized.pres_pen_openai = normalized.presence_penalty;

        let extractedRegexes: RegexRule[] = [];
        const promptsArr = normalized.prompts || [];
        const spIdx = promptsArr.findIndex((p: any) => p.identifier === 'SPresetSettings');
        if (spIdx >= 0) {
          try {
            const sp = JSON.parse(promptsArr[spIdx].content || '{}');
            const rb = sp.RegexBinding || sp.regexBinding || {};
            extractedRegexes = (rb.regexes || []).map((r: any) => ({
              id: r.id || crypto.randomUUID(), name: r.scriptName || '未命名', enabled: !r.disabled,
              findRegex: r.findRegex || '', replaceString: r.replaceString || '',
              source: { userInput: true, aiOutput: true, slashCommand: false, worldInfo: false },
              destination: (r.promptOnly && !r.markdownOnly) ? 'prompt' : (!r.promptOnly && r.markdownOnly) ? 'display' : 'both',
              minDepth: r.minDepth ?? null, maxDepth: r.maxDepth ?? null,
              runOnEdit: r.runOnEdit ?? false, order: 0,
            }));
          } catch { /* skip */ }
        }

        let flatOrder = normalized.prompt_order;
        if (Array.isArray(flatOrder) && flatOrder.length > 0 && Array.isArray(flatOrder[0]?.order)) {
          const g = flatOrder.find((x: any) => x.character_id === 100001) || flatOrder[0];
          flatOrder = g.order || [];
        }
        if (flatOrder) normalized.prompt_order = flatOrder;

        const imported = importPreset(normalized);
        const p: ChatPreset = { ...imported, name: presetName, regexes: extractedRegexes, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() };
        await savePreset(p);
        setPresets(prev => [...prev, p]);
      } catch (e) { alert('导入失败：' + (e as Error).message); }
    };
    input.click();
  };

  const handleDeletePreset = async (id: string) => {
    if (!confirm('删除此预设？')) return;
    await deletePresetDb(id);
    setPresets(prev => prev.filter(p => p.id !== id));
    if (settings.activePresetId === id) updateSettings({ activePresetId: null });
  };

  const field = (label: string, child: React.ReactNode) => (
    <label className="sp-field"><span className="sp-label">{label}</span>{child}</label>
  );

  if (!loaded) return <div className="sp-loading">加载中…</div>;

  const activePreset = presets.find(p => p.id === settings.activePresetId);

  return (
    <div className="sp-panel">
      <div className="sp-sidebar">
        <button className={`sp-nav-item ${page === 'api' ? 'sp-nav-item--active' : ''}`} onClick={() => setPage('api')}>🔌 API 设置</button>
        <button className={`sp-nav-item ${page === 'presets' ? 'sp-nav-item--active' : ''}`} onClick={() => setPage('presets')}>✦ 预设 ({presets.length})</button>
      </div>

      <div className="sp-main">
        {/* ======= API SETTINGS ======= */}
        {page === 'api' && (
          <div className="sp-section">
            <h3 className="sp-section-title">主 API</h3>
            {field('Base URL', <input className="sp-input sp-input--mono" value={settings.api.baseUrl} onChange={e => updateApi({ baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" />)}
            {field('API Key', <input className="sp-input sp-input--mono" type="password" value={settings.api.apiKey} onChange={e => updateApi({ apiKey: e.target.value })} placeholder="sk-..." />)}
            {field('Model', <div className="sp-model-row">
              <div className="sp-model-select-wrap">
                {primModels.length > 0 ? (
                  <select className="sp-input sp-input--mono" value={settings.api.model} onChange={e => updateApi({ model: e.target.value })}>
                    <option value="">-- 选择模型 --</option>
                    {primModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : <input className="sp-input sp-input--mono" value={settings.api.model} onChange={e => updateApi({ model: e.target.value })} placeholder="手动输入" />}
              </div>
              <button className="sp-btn sp-btn--fetch" onClick={() => handleFetch('primary')} disabled={fetchingPrim}>{fetchingPrim ? '获取中…' : '获取模型'}</button>
            </div>)}
            <div className="sp-action-row">
              <button className="sp-btn sp-btn--test" onClick={() => handleTest('primary')} disabled={testingPrim}>{testingPrim ? '测试中…' : '测试连通性'}</button>
              {testPrim && <span className={`sp-test-result ${testPrim.startsWith('✅') ? 'sp-test-result--ok' : 'sp-test-result--fail'}`}>{testPrim}</span>}
            </div>

            <h3 className="sp-section-title" style={{ marginTop: 24 }}>次 API（变量提取）</h3>
            <label className="sp-check" style={{ marginBottom: 12 }}>
              <input type="checkbox" checked={settings.api.secondary?.enabled ?? false} onChange={e => {
                const en = e.target.checked;
                updateApi({ secondary: en ? { enabled: true, baseUrl: settings.api.secondary?.baseUrl ?? settings.api.baseUrl, apiKey: settings.api.secondary?.apiKey ?? '', model: settings.api.secondary?.model ?? settings.api.model } : { ...settings.api.secondary!, enabled: false } });
              }} />
              启用 — 正文生成后由次 API 解析提取变量变化，失败自动 fallback
            </label>
            {settings.api.secondary?.enabled && <>
              {field('Base URL', <input className="sp-input sp-input--mono" value={settings.api.secondary?.baseUrl ?? ''} onChange={e => updateApi({ secondary: { ...settings.api.secondary!, baseUrl: e.target.value } })} placeholder="https://api.deepseek.com/v1" />)}
              {field('API Key', <input className="sp-input sp-input--mono" type="password" value={settings.api.secondary?.apiKey ?? ''} onChange={e => updateApi({ secondary: { ...settings.api.secondary!, apiKey: e.target.value } })} />)}
              {field('Model', <div className="sp-model-row">
                <div className="sp-model-select-wrap">
                  {secModels.length > 0 ? (
                    <select className="sp-input sp-input--mono" value={settings.api.secondary?.model ?? ''} onChange={e => updateApi({ secondary: { ...settings.api.secondary!, model: e.target.value } })}>
                      <option value="">-- 选择模型 --</option>
                      {secModels.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  ) : <input className="sp-input sp-input--mono" value={settings.api.secondary?.model ?? ''} onChange={e => updateApi({ secondary: { ...settings.api.secondary!, model: e.target.value } })} placeholder="手动输入" />}
                </div>
                <button className="sp-btn sp-btn--fetch" onClick={() => handleFetch('secondary')} disabled={fetchingSec}>{fetchingSec ? '获取中…' : '获取模型'}</button>
              </div>)}
              <div className="sp-action-row" style={{ marginTop: 8 }}>
                <button className="sp-btn sp-btn--test" onClick={() => handleTest('secondary')} disabled={testingSec}>{testingSec ? '测试中…' : '测试连通性'}</button>
                {testSec && <span className={`sp-test-result ${testSec.startsWith('✅') ? 'sp-test-result--ok' : 'sp-test-result--fail'}`}>{testSec}</span>}
              </div>
            </>}
          </div>
        )}

        {/* ======= PRESETS ======= */}
        {page === 'presets' && (
          <div className="sp-section">
            <div className="sp-section-header">
              <span>预设列表</span>
              <div className="sp-header-btns">
                <button className="sp-btn sp-btn--sm" onClick={handleNewPreset}>+ 新建</button>
                <button className="sp-btn sp-btn--sm" onClick={handleImportPreset}>📥 导入</button>
              </div>
            </div>
            {activePreset && (
              <div className="sp-active-hint">当前使用：<strong>{activePreset.name}</strong></div>
            )}
            {presets.map(p => (
              <div key={p.id} className={`sp-preset-card ${settings.activePresetId === p.id ? 'sp-preset-card--active' : ''}`}
                   onClick={() => handleSelectPreset(p.id)}>
                <div className="sp-preset-info">
                  <span className="sp-preset-name">{p.name}</span>
                  <span className="sp-preset-meta">{p.description || '无描述'} · 条目 {p.settings.prompts?.length || 0} · 正则 {p.regexes?.length || 0}</span>
                </div>
                <div className="sp-preset-acts">
                  {settings.activePresetId === p.id && <span className="sp-badge">使用中</span>}
                  <button className="sp-icon-btn" onClick={e => { e.stopPropagation(); setEditingPresetId(p.id); setPage('presetEditor'); }} title="编辑条目">✏</button>
                  <button className="sp-icon-btn sp-icon-btn--danger" onClick={e => { e.stopPropagation(); handleDeletePreset(p.id); }}>🗑</button>
                </div>
              </div>
            ))}
            {presets.length === 0 && <div className="sp-empty">暂无预设。点「+ 新建」创建默认预设，或「📥 导入」ST 预设 JSON。</div>}
          </div>
        )}

        {/* ======= PRESET EDITOR ======= */}
        {page === 'presetEditor' && editingPresetId && (() => {
          const p = presets.find(x => x.id === editingPresetId);
          if (!p) return null;
          const promptsArr: any[] = p.settings.prompts || [];
          const promptMap = new Map(promptsArr.map((e: any) => [e.identifier, e]));
          // Handle both flat and nested prompt_order
          let orderArr: any[] = p.settings.prompt_order || [];
          if (orderArr.length > 0 && Array.isArray(orderArr[0]?.order)) {
            const g = orderArr.find((x: any) => x.character_id === 100001) || orderArr[0];
            orderArr = g.order || [];
          }

          const toggleEntry = async (identifier: string) => {
            const next = orderArr.map((item: any) =>
              item.identifier === identifier ? { ...item, enabled: !item.enabled } : item
            );
            const updated = { ...p, settings: { ...p.settings, prompt_order: next }, updatedAt: Date.now() };
            await savePreset(updated);
            setPresets(prev => prev.map(x => x.id === editingPresetId ? updated : x));
          };

          return (
            <div className="sp-section">
              <div className="sp-section-header">
                <button className="sp-btn sp-btn--sm" onClick={() => { setPage('presets'); setEditingPresetId(null); }}>← 返回</button>
                <span>{p.name}</span>
              </div>
              <div className="sp-active-hint">
                temp: {p.settings.temp_openai ?? p.settings.temperature ?? 0.8} ·
                top_p: {p.settings.top_p_openai ?? p.settings.top_p ?? 0.9} ·
                max_tokens: {p.settings.openai_max_tokens ?? 2048} ·
                正则: {p.regexes?.length || 0} 条
              </div>
              <div className="sp-section-header">
                <span>条目顺序（按此组装 Prompt）</span>
              </div>
              {orderArr.length === 0 && <div className="sp-empty">此预设没有 prompt_order 条目。</div>}
              {orderArr.map((item: any, i: number) => {
                const prompt = promptMap.get(item.identifier);
                const enabled = item.enabled !== false;
                const content = prompt?.content || '';
                const name = prompt?.name || item.identifier;
                const marker = prompt?.marker;
                return (
                  <div key={i} className={`sp-entry-row ${enabled ? '' : 'sp-entry-row--disabled'}`}
                       onClick={() => toggleEntry(item.identifier)}>
                    <input type="checkbox" checked={enabled} onChange={() => toggleEntry(item.identifier)}
                           onClick={e => e.stopPropagation()} style={{ accentColor: 'var(--accent-400)', flexShrink: 0 }} />
                    <div className="sp-entry-text">
                      <span className="sp-entry-label-text">{name}</span>
                      <span className="sp-entry-id-text">{item.identifier}{marker ? ' [动态]' : ''}</span>
                    </div>
                    <span className="sp-entry-preview">{content.slice(0, 80)}{content.length > 80 ? '…' : ''}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
