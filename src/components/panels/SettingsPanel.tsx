import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_SETTINGS, type AppSettings, type ApiSettings } from '../../sillytavern/types';
import { testConnection, fetchModels } from '../../sillytavern/api-tools';
import { getSettings, saveSettings, initializeDatabase } from '../../sillytavern/database';
import './SettingsPanel.css';

export default function SettingsPanel() {
  const [settings, setSettings] = useState<AppSettings>(() => ({ ...DEFAULT_SETTINGS }));
  const [loaded, setLoaded] = useState(false);

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
      const s = await getSettings();
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...s });
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback(async (s: AppSettings) => { await saveSettings(s); }, []);

  const updateApi = useCallback((patch: Partial<ApiSettings>) => {
    setSettings(prev => { const next = { ...prev, api: { ...prev.api, ...patch } }; persist(next); return next; });
  }, [persist]);

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

  const field = (label: string, child: React.ReactNode) => (
    <label className="sp-field"><span className="sp-label">{label}</span>{child}</label>
  );

  if (!loaded) return <div className="sp-loading">加载中…</div>;

  return (
    <div className="sp-panel">
      <div className="sp-main" style={{ padding: 0 }}>
        <div className="sp-section">
          <h3 className="sp-section-title">🔌 主 API</h3>
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

          <h3 className="sp-section-title" style={{ marginTop: 24 }}>🔍 次 API（变量提取）</h3>
          <label className="sp-check" style={{ marginBottom: 12 }}>
            <input type="checkbox" checked={settings.api.secondary?.enabled ?? false} onChange={e => {
              const enabled = e.target.checked;
              updateApi({ secondary: enabled ? { enabled: true, baseUrl: settings.api.secondary?.baseUrl ?? settings.api.baseUrl, apiKey: settings.api.secondary?.apiKey ?? '', model: settings.api.secondary?.model ?? settings.api.model } : { ...settings.api.secondary!, enabled: false } });
            }} />
            启用 — 正文生成后由次 API 解析提取变量变化，挂了自动 fallback 到主 API
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
      </div>
    </div>
  );
}
