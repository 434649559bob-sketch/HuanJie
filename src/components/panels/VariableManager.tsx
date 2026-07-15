import { useState, useEffect, useCallback } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { initializeDatabase } from '../../sillytavern/database';
import './VariableManager.css';

// ── Tree rendering ──

function isObject(v: any): v is Record<string, any> { return v && typeof v === 'object' && !Array.isArray(v); }
function isArray(v: any): v is any[] { return Array.isArray(v); }

function TreeView({ data, path, onEdit }: { data: any; path: string; onEdit: (fullPath: string, value: any) => void }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (data === null || data === undefined) {
    return <span className="vm-null">null</span>;
  }
  if (typeof data === 'string') {
    return (
      <span className="vm-leaf vm-leaf--string" onClick={() => onEdit(path, data)} title="点击编辑">
        &quot;{data.length > 60 ? data.slice(0, 60) + '…' : data}&quot;
      </span>
    );
  }
  if (typeof data === 'number') {
    return (
      <span className="vm-leaf vm-leaf--number" onClick={() => onEdit(path, data)} title="点击编辑">
        {data}
      </span>
    );
  }
  if (typeof data === 'boolean') {
    return (
      <span className="vm-leaf vm-leaf--boolean" onClick={() => onEdit(path, data)} title="点击编辑">
        {data ? 'true' : 'false'}
      </span>
    );
  }
  if (isArray(data)) {
    const key = path || 'root';
    const isCollapsed = collapsed[key];
    return (
      <div className="vm-node">
        <div className="vm-node-bar" onClick={() => setCollapsed(prev => ({ ...prev, [key]: !isCollapsed }))}>
          <span className="vm-arrow">{isCollapsed ? '▸' : '▾'}</span>
          <span className="vm-key">{path.split('.').pop() || 'root'}</span>
          <span className="vm-type">array[{data.length}]</span>
        </div>
        {!isCollapsed && (
          <div className="vm-children">
            {data.map((item, i) => (
              <div key={i} className="vm-child">
                <span className="vm-index">[{i}]</span>
                <TreeView data={item} path={`${path}[${i}]`} onEdit={onEdit} />
              </div>
            ))}
            {data.length === 0 && <div className="vm-empty-child">空数组</div>}
          </div>
        )}
      </div>
    );
  }
  if (isObject(data)) {
    const key = path || 'root';
    const isCollapsed = collapsed[key];
    const entries = Object.entries(data);
    return (
      <div className="vm-node">
        <div className="vm-node-bar" onClick={() => setCollapsed(prev => ({ ...prev, [key]: !isCollapsed }))}>
          <span className="vm-arrow">{isCollapsed ? '▸' : '▾'}</span>
          <span className="vm-key">{path.split('.').pop() || 'root'}</span>
          <span className="vm-type">object{'{'}{entries.length}{'}'}</span>
        </div>
        {!isCollapsed && (
          <div className="vm-children">
            {entries.map(([k, v]) => (
              <div key={k} className="vm-child">
                <span className="vm-key-name">{k}</span>
                <TreeView data={v} path={path ? `${path}.${k}` : k} onEdit={onEdit} />
              </div>
            ))}
            {entries.length === 0 && <div className="vm-empty-child">空对象</div>}
          </div>
        )}
      </div>
    );
  }
  return <span className="vm-leaf">{String(data)}</span>;
}

// ── Component ──

export default function VariableManager() {
  const st = useSillytavern();
  const [initialized, setInitialized] = useState(false);
  const [editing, setEditing] = useState<{ path: string; value: string } | null>(null);
  const [editMsg, setEditMsg] = useState<string | null>(null);
  const [viewFloor, setViewFloor] = useState<'latest' | number>('latest');
  const [showDelta, setShowDelta] = useState(false);

  useEffect(() => { initializeDatabase().then(() => setInitialized(true)); }, []);

  const vars = st.activeChat?.variables ?? {};
  const msgs = st.activeChat?.messages ?? [];

  // Build floor snapshots list
  const floors = msgs
    .filter(m => m.role === 'assistant' && m.variablesAfter)
    .map((m, i) => ({ index: i, id: m.id, vars: m.variablesAfter!, deltas: (m as any).variablesDelta || [] }));

  const currentVars = viewFloor === 'latest' ? vars :
    (floors.find(f => f.index === viewFloor)?.vars ?? vars);

  const handleEdit = useCallback((path: string, value: any) => {
    setEditing({ path, value: JSON.stringify(value) });
  }, []);

  const handleSave = useCallback(async () => {
    if (!editing || !st.activeChat) return;
    try {
      const newValue = JSON.parse(editing.value);
      const next = { ...vars };
      const parts = editing.path.split('.');
      let cur: any = next;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in cur)) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = newValue;
      st.setChatVariables(next);
      setEditMsg('已保存');
      setTimeout(() => setEditMsg(null), 1500);
    } catch {
      setEditMsg('JSON解析失败');
    }
    setEditing(null);
  }, [editing, vars, st]);

  if (!initialized) return <div className="vm-loading">加载中…</div>;
  if (!st.activeChat) return <div className="vm-loading">请先开始对话</div>;

  return (
    <div className="vm-panel">
      {/* Toolbar */}
      <div className="vm-toolbar">
        <select className="vm-floor-select" value={viewFloor} onChange={e => setViewFloor(e.target.value === 'latest' ? 'latest' : Number(e.target.value))}>
          <option value="latest">最新状态</option>
          {floors.map((f, i) => (
            <option key={i} value={f.index}>楼层 {f.index + 1} {f.deltas?.length ? `(${f.deltas.length}变化)` : ''}</option>
          ))}
        </select>
        <label className="vm-check"><input type="checkbox" checked={showDelta} onChange={e => setShowDelta(e.target.checked)} />显示变化</label>
        <span className="vm-count">{Object.keys(vars).length} 顶级键</span>
      </div>

      {/* Tree */}
      <div className="vm-tree">
        {Object.keys(currentVars).length === 0 ? (
          <div className="vm-empty">暂无变量。发送消息后次API提取变量变化，或前端操作会自动同步。</div>
        ) : (
          <TreeView data={currentVars} path="" onEdit={handleEdit} />
        )}
      </div>

      {/* Recent deltas */}
      {showDelta && floors.length > 0 && (
        <div className="vm-deltas">
          <h4>最近变化</h4>
          {floors.filter(f => f.deltas?.length).slice(-3).reverse().map((f, i) => (
            <div key={i} className="vm-delta-floor">
              <span className="vm-delta-floor-label">楼层 {f.index + 1}:</span>
              {f.deltas!.map((d: any, j: number) => (
                <div key={j} className={`vm-delta vm-delta--${d.op === 'add' ? 'up' : d.op === 'sub' ? 'down' : 'set'}`}>
                  <span>{d.op === 'add' ? '↑' : d.op === 'sub' ? '↓' : '→'}</span>
                  <span className="vm-delta-path">{d.path}</span>
                  <span>{d.display || JSON.stringify(d.value)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="vm-overlay" onClick={() => setEditing(null)}>
          <div className="vm-modal" onClick={e => e.stopPropagation()}>
            <h4>编辑: {editing.path}</h4>
            <textarea className="vm-edit-input" rows={4} value={editing.value}
              onChange={e => setEditing({ ...editing, value: e.target.value })} />
            {editMsg && <div className={`vm-edit-msg ${editMsg.includes('失败') ? 'vm-edit-msg--err' : ''}`}>{editMsg}</div>}
            <div className="vm-edit-actions">
              <button className="vm-btn" onClick={() => setEditing(null)}>取消</button>
              <button className="vm-btn vm-btn--primary" onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
