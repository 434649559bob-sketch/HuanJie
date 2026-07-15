import { useState, useEffect, useCallback } from 'react';
import {
  getVariableManager,
  saveVariableManager,
  initializeDatabase,
} from '../../sillytavern/database';
import { createDefaultVarManager } from '../../sillytavern/variable-engine';
import type { VarDefinition, VarManagerState, VarScope, VarDataType, VarDisplayStyle } from '../../sillytavern/variable-types';
import './VariablePanel.css';

// ============================================================
// Form helpers
// ============================================================

const SCOPES: { value: VarScope; label: string }[] = [
  { value: 'chat', label: '会话' },
  { value: 'global', label: '全局' },
];

const TYPES: { value: VarDataType; label: string }[] = [
  { value: 'string', label: '字符串' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔' },
  { value: 'object', label: '对象' },
];

const STYLES: { value: VarDisplayStyle; label: string }[] = [
  { value: 'default', label: '默认' },
  { value: 'stat', label: '属性' },
  { value: 'currency', label: '货币' },
  { value: 'progress', label: '进度' },
  { value: 'text', label: '文本' },
];

const emptyForm = (): Partial<VarDefinition> => ({
  id: '',
  name: '',
  type: 'string',
  scope: 'chat',
  defaultValue: '',
  display: { style: 'default', animateDelta: true },
  injectToPrompt: true,
  order: 99,
});

// ============================================================
// Component
// ============================================================

export default function VariablePanel() {
  const [manager, setManager] = useState<VarManagerState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<VarScope | 'all'>('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<VarDefinition>>(emptyForm());
  const [search, setSearch] = useState('');
  const [saveFlash, setSaveFlash] = useState(false);

  // Load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await initializeDatabase();
      const m = await getVariableManager();
      if (cancelled) return;
      if (m) setManager(m);
      else {
        const d = createDefaultVarManager();
        await saveVariableManager(d);
        setManager(d);
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist
  const persist = useCallback(async (m: VarManagerState) => {
    await saveVariableManager(m);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  }, []);

  // CRUD
  const handleAdd = () => {
    setEditId('__new__');
    setForm(emptyForm());
  };

  const handleEdit = (def: VarDefinition) => {
    setEditId(def.id);
    setForm({ ...def, display: { ...def.display } });
  };

  const handleDelete = async (id: string) => {
    if (!manager) return;
    const next: VarManagerState = {
      ...manager,
      definitions: manager.definitions.filter(d => d.id !== id),
      updatedAt: Date.now(),
    };
    setManager(next);
    await persist(next);
  };

  const handleSave = async () => {
    if (!manager) return;
    if (!form.id || !form.name) return;

    const def: VarDefinition = {
      id: form.id,
      name: form.name,
      type: form.type ?? 'string',
      scope: form.scope ?? 'chat',
      defaultValue: form.defaultValue ?? '',
      display: { ...(form.display ?? { style: 'default', animateDelta: true }) },
      injectToPrompt: form.injectToPrompt ?? true,
      bounds: form.bounds,
      order: form.order ?? 99,
      description: form.description,
    };

    let definitions: VarDefinition[];
    if (editId === '__new__') {
      definitions = [...manager.definitions, def];
    } else {
      definitions = manager.definitions.map(d => d.id === editId ? def : d);
    }

    const next: VarManagerState = { ...manager, definitions, updatedAt: Date.now() };
    setManager(next);
    await persist(next);
    setEditId(null);
  };

  // Filter + search
  const filtered = (manager?.definitions ?? [])
    .filter(d => filter === 'all' || d.scope === filter)
    .filter(d => {
      if (!search) return true;
      const q = search.toLowerCase();
      return d.id.includes(q) || d.name.includes(q) || (d.description ?? '').includes(q);
    })
    .sort((a, b) => a.order - b.order);

  if (!loaded) return <div className="vp-loading">加载中…</div>;

  return (
    <div className="vp-panel">
      {/* Scope filter tabs */}
      <div className="vp-tabs">
        {([{ v: 'all', l: '全部' }, ...SCOPES.map(s => ({ v: s.value, l: s.label }))] as const).map(t => (
          <button key={t.v} className={`vp-tab${filter === t.v ? ' vp-tab--active' : ''}`} onClick={() => setFilter(t.v)}>
            {t.l}
          </button>
        ))}
        <button className="vp-btn vp-btn--add" onClick={handleAdd}>+ 新增</button>
      </div>

      {/* Search */}
      <input
        className="vp-search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="搜索变量名或ID…"
      />

      {/* Table */}
      <div className="vp-table-wrap">
        <table className="vp-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名称</th>
              <th>类型</th>
              <th>作用域</th>
              <th>默认值</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="vp-empty">暂无变量定义</td></tr>
            )}
            {filtered.map(def => (
              <tr key={def.id} className={editId === def.id ? 'vp-row--editing' : ''}>
                <td className="vp-cell-id">{def.id}</td>
                <td>{def.name}</td>
                <td><span className="vp-tag">{def.type}</span></td>
                <td><span className={`vp-tag vp-tag--${def.scope}`}>{def.scope === 'global' ? '全局' : '会话'}</span></td>
                <td className="vp-cell-mono">{String(def.defaultValue)}</td>
                <td className="vp-cell-actions">
                  <button className="vp-icon-btn" onClick={() => handleEdit(def)} title="编辑">✏</button>
                  <button className="vp-icon-btn vp-icon-btn--danger" onClick={() => handleDelete(def.id)} title="删除">🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="vp-footer">
        <span className="vp-count">{filtered.length} / {manager?.definitions.length ?? 0} 个变量</span>
        {saveFlash && <span className="vp-saved">已保存</span>}
      </div>

      {/* Edit Modal */}
      {editId && (
        <div className="vp-modal-overlay" onClick={() => setEditId(null)}>
          <div className="vp-modal" onClick={e => e.stopPropagation()}>
            <div className="vp-modal-header">
              <span>{editId === '__new__' ? '新增变量' : '编辑变量'}</span>
              <button className="vp-modal-close" onClick={() => setEditId(null)}>✕</button>
            </div>
            <div className="vp-modal-body">
              <label className="vp-field">
                <span>ID（英文标识）</span>
                <input value={form.id ?? ''} onChange={e => setForm({ ...form, id: e.target.value })} placeholder="hp" disabled={editId !== '__new__'} />
              </label>
              <label className="vp-field">
                <span>名称</span>
                <input value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="生命值" />
              </label>
              <div className="vp-field-row">
                <label className="vp-field">
                  <span>类型</span>
                  <select value={form.type ?? 'string'} onChange={e => setForm({ ...form, type: e.target.value as VarDataType })}>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </label>
                <label className="vp-field">
                  <span>作用域</span>
                  <select value={form.scope ?? 'chat'} onChange={e => setForm({ ...form, scope: e.target.value as VarScope })}>
                    {SCOPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </label>
              </div>
              <label className="vp-field">
                <span>默认值</span>
                <input value={String(form.defaultValue ?? '')} onChange={e => setForm({ ...form, defaultValue: e.target.value })} />
              </label>
              <label className="vp-field">
                <span>排序序号</span>
                <input type="number" value={form.order ?? 99} onChange={e => setForm({ ...form, order: Number(e.target.value) })} min={0} />
              </label>

              {/* Display settings */}
              <fieldset className="vp-fieldset">
                <legend>显示设置</legend>
                <label className="vp-field">
                  <span>样式</span>
                  <select value={form.display?.style ?? 'default'} onChange={e => setForm({ ...form, display: { ...(form.display ?? { style: 'default', animateDelta: true }), style: e.target.value as VarDisplayStyle } })}>
                    {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </label>
                <div className="vp-field-row">
                  <label className="vp-field">
                    <span>图标</span>
                    <input value={form.display?.icon ?? ''} onChange={e => setForm({ ...form, display: { ...(form.display ?? { style: 'default', animateDelta: true }), icon: e.target.value } })} placeholder="❤️" />
                  </label>
                  <label className="vp-field">
                    <span>颜色</span>
                    <input value={form.display?.color ?? ''} onChange={e => setForm({ ...form, display: { ...(form.display ?? { style: 'default', animateDelta: true }), color: e.target.value } })} placeholder="#ef4444" />
                  </label>
                </div>
                <div className="vp-field-row">
                  <label className="vp-field">
                    <span>前缀</span>
                    <input value={form.display?.prefix ?? ''} onChange={e => setForm({ ...form, display: { ...(form.display ?? { style: 'default', animateDelta: true }), prefix: e.target.value } })} />
                  </label>
                  <label className="vp-field">
                    <span>后缀</span>
                    <input value={form.display?.suffix ?? ''} onChange={e => setForm({ ...form, display: { ...(form.display ?? { style: 'default', animateDelta: true }), suffix: e.target.value } })} placeholder="G" />
                  </label>
                </div>
                {form.display?.style === 'progress' && (
                  <label className="vp-field">
                    <span>最大值引用（变量ID）</span>
                    <input value={form.display?.maxRef ?? ''} onChange={e => setForm({ ...form, display: { ...(form.display ?? { style: 'progress', animateDelta: true }), maxRef: e.target.value } })} placeholder="maxHp" />
                  </label>
                )}
                <label className="vp-field vp-field--row">
                  <span>变化动画</span>
                  <input type="checkbox" checked={form.display?.animateDelta ?? true} onChange={e => setForm({ ...form, display: { ...(form.display ?? { style: 'default', animateDelta: true }), animateDelta: e.target.checked } })} />
                </label>
              </fieldset>

              <fieldset className="vp-fieldset">
                <legend>高级</legend>
                <label className="vp-field vp-field--row">
                  <span>注入到系统提示</span>
                  <input type="checkbox" checked={form.injectToPrompt ?? true} onChange={e => setForm({ ...form, injectToPrompt: e.target.checked })} />
                </label>
                {form.type === 'number' && (
                  <div className="vp-field-row">
                    <label className="vp-field">
                      <span>最小值</span>
                      <input type="number" value={form.bounds?.min ?? ''} onChange={e => setForm({ ...form, bounds: { ...form.bounds, min: e.target.value ? Number(e.target.value) : undefined } })} />
                    </label>
                    <label className="vp-field">
                      <span>最大值</span>
                      <input type="number" value={form.bounds?.max ?? ''} onChange={e => setForm({ ...form, bounds: { ...form.bounds, max: e.target.value ? Number(e.target.value) : undefined } })} />
                    </label>
                  </div>
                )}
                <label className="vp-field">
                  <span>描述</span>
                  <input value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} />
                </label>
              </fieldset>

              <div className="vp-modal-actions">
                <button className="vp-btn" onClick={() => setEditId(null)}>取消</button>
                <button className="vp-btn vp-btn--primary" onClick={handleSave} disabled={!form.id || !form.name}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
