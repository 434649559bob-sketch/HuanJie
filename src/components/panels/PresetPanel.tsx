import { useState, useEffect, useCallback } from 'react';
import {
  getPresets, savePreset, deletePreset as deletePresetDb,
  getSettings, saveSettings, initializeDatabase,
} from '../../sillytavern/database';
import { createDefaultPreset, type ChatPreset } from '../../sillytavern/types';
import './PresetPanel.css';

export default function PresetPanel() {
  const [presets, setPresets] = useState<ChatPreset[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saveFlash, setSaveFlash] = useState(false);

  useEffect(() => {
    (async () => {
      await initializeDatabase();
      const [p, s] = await Promise.all([getPresets(), getSettings()]);
      setPresets(p);
      if (s?.activePresetId) setActiveId(s.activePresetId);
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback(async (_p: ChatPreset[]) => {
    // Also update settings if active changed
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  }, []);

  const handleSelect = async (id: string) => {
    setActiveId(id);
    const s = await getSettings();
    if (s) await saveSettings({ ...s, activePresetId: id });
  };

  const handleAdd = () => {
    const d = createDefaultPreset();
    setEditId('__new__');
    setForm({ ...d.settings, name: d.name, description: d.description });
  };

  const handleEdit = (p: ChatPreset) => {
    setEditId(p.id);
    setForm({ ...p.settings, name: p.name, description: p.description });
  };

  const handleSave = async () => {
    const name = form.name || '未命名';
    const description = form.description || '';
    const { name: _n, description: _d, ...settings } = form;

    if (editId === '__new__') {
      const preset: ChatPreset = {
        id: crypto.randomUUID(),
        name, description, settings,
        regexes: [], createdAt: Date.now(), updatedAt: Date.now(),
      };
      await savePreset(preset);
      setPresets(prev => [...prev, preset]);
    } else if (editId) {
      const existing = presets.find(p => p.id === editId);
      const preset: ChatPreset = {
        id: editId, name, description, settings,
        regexes: existing?.regexes ?? [],
        createdAt: existing?.createdAt ?? Date.now(), updatedAt: Date.now(),
      };
      await savePreset(preset);
      setPresets(prev => prev.map(p => p.id === editId ? preset : p));
    }
    setEditId(null);
    await persist(presets);
  };

  const handleDelete = async (id: string) => {
    await deletePresetDb(id);
    setPresets(prev => prev.filter(p => p.id !== id));
    if (activeId === id) setActiveId(null);
    await persist(presets);
  };

  if (!loaded) return <div className="pp-loading">加载中…</div>;

  return (
    <div className="pp-panel">
      <div className="pp-header-row">
        <span className="pp-count">{presets.length} 个预设</span>
        <button className="pp-btn pp-btn--add" onClick={handleAdd}>+ 新增</button>
      </div>

      <div className="pp-list">
        {presets.map(p => (
          <div key={p.id} className={`pp-card${activeId === p.id ? ' pp-card--active' : ''}`}>
            <div className="pp-card-main" onClick={() => handleSelect(p.id)}>
              <div className="pp-card-left">
                <span className="pp-card-name">{p.name}</span>
                <span className="pp-card-meta">
                  temp: {p.settings.temp_openai ?? 0.8} · max_tokens: {p.settings.openai_max_tokens ?? 2048} · top_p: {p.settings.top_p_openai ?? 0.9}
                </span>
              </div>
              <div className="pp-card-actions">
                <button className="pp-icon-btn" onClick={(e) => { e.stopPropagation(); handleEdit(p); }}>✏</button>
                <button className="pp-icon-btn pp-icon-btn--danger" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}>🗑</button>
              </div>
            </div>
            {activeId === p.id && <div className="pp-card-badge">使用中</div>}
          </div>
        ))}
        {presets.length === 0 && <div className="pp-empty">暂无预设，点「+ 新增」创建一个</div>}
      </div>

      {saveFlash && <div className="pp-saved">已保存</div>}

      {/* Edit Modal */}
      {editId && (
        <div className="pp-modal-overlay" onClick={() => setEditId(null)}>
          <div className="pp-modal" onClick={e => e.stopPropagation()}>
            <div className="pp-modal-header">
              <span>{editId === '__new__' ? '新增预设' : '编辑预设'}</span>
              <button className="pp-modal-close" onClick={() => setEditId(null)}>✕</button>
            </div>
            <div className="pp-modal-body">
              <label className="pp-field"><span>名称</span>
                <input value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="pp-field"><span>描述</span>
                <input value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} />
              </label>

              <fieldset className="pp-fieldset">
                <legend>采样参数</legend>
                <div className="pp-field-row">
                  <label className="pp-field"><span>Temperature</span>
                    <input type="number" min={0} max={2} step={0.05} value={form.temp_openai ?? 0.8}
                      onChange={e => setForm({ ...form, temp_openai: Number(e.target.value) })} />
                  </label>
                  <label className="pp-field"><span>Top P</span>
                    <input type="number" min={0} max={1} step={0.05} value={form.top_p_openai ?? 0.9}
                      onChange={e => setForm({ ...form, top_p_openai: Number(e.target.value) })} />
                  </label>
                </div>
                <div className="pp-field-row">
                  <label className="pp-field"><span>Max Tokens</span>
                    <input type="number" min={64} max={32768} step={64} value={form.openai_max_tokens ?? 2048}
                      onChange={e => setForm({ ...form, openai_max_tokens: Number(e.target.value) })} />
                  </label>
                  <label className="pp-field"><span>Max Context</span>
                    <input type="number" min={512} max={128000} step={512} value={form.openai_max_context ?? 4096}
                      onChange={e => setForm({ ...form, openai_max_context: Number(e.target.value) })} />
                  </label>
                </div>
                <div className="pp-field-row">
                  <label className="pp-field"><span>Freq Penalty</span>
                    <input type="number" min={-2} max={2} step={0.1} value={form.freq_pen_openai ?? 0}
                      onChange={e => setForm({ ...form, freq_pen_openai: Number(e.target.value) })} />
                  </label>
                  <label className="pp-field"><span>Pres Penalty</span>
                    <input type="number" min={-2} max={2} step={0.1} value={form.pres_pen_openai ?? 0}
                      onChange={e => setForm({ ...form, pres_pen_openai: Number(e.target.value) })} />
                  </label>
                </div>
              </fieldset>

              <fieldset className="pp-fieldset">
                <legend>系统提示词</legend>
                <label className="pp-field"><span>Main Prompt</span>
                  <textarea rows={4} value={form.main ?? ''}
                    onChange={e => setForm({ ...form, main: e.target.value })}
                    placeholder="Write {{char}}'s next reply in a fictional chat between {{char}} and {{user}}." />
                </label>
                <label className="pp-field"><span>Jailbreak</span>
                  <textarea rows={2} value={form.jailbreak ?? ''}
                    onChange={e => setForm({ ...form, jailbreak: e.target.value })} />
                </label>
              </fieldset>

              <div className="pp-modal-actions">
                <button className="pp-btn" onClick={() => setEditId(null)}>取消</button>
                <button className="pp-btn pp-btn--primary" onClick={handleSave}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
