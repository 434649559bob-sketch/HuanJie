import { useState, useEffect } from 'react';
import {
  getLorebooks, saveLorebook, deleteLorebook as deleteLorebookDb,
  getSettings, saveSettings, initializeDatabase,
} from '../../sillytavern/database';
import { createDefaultLorebook } from '../../sillytavern/editor-utils';
import type { Lorebook, LorebookEntry } from '../../sillytavern/types';
import './LorebookPanel.css';

export default function LorebookPanel() {
  const [books, setBooks] = useState<Lorebook[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editId, setEditId] = useState<string | null>(null); // book being edited
  const [expandedId, setExpandedId] = useState<string | null>(null); // book with entries visible
  const [form, setForm] = useState<{ name: string; description: string }>({ name: '', description: '' });
  const [entryForm, setEntryForm] = useState<{ keys: string; content: string; comment: string }>({ keys: '', content: '', comment: '' });
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await initializeDatabase();
      const [b, s] = await Promise.all([getLorebooks(), getSettings()]);
      setBooks(b);
      if (s?.activeLorebookIds) setActiveIds(s.activeLorebookIds);
      setLoaded(true);
    })();
  }, []);

  const toggleActive = async (bookId: string) => {
    const next = activeIds.includes(bookId)
      ? activeIds.filter(id => id !== bookId)
      : [...activeIds, bookId];
    setActiveIds(next);
    const s = await getSettings();
    if (s) await saveSettings({ ...s, activeLorebookIds: next });
  };

  const handleAdd = () => {
    setEditId('__new__');
    setForm({ name: '', description: '' });
  };

  const handleEdit = (b: Lorebook) => {
    setEditId(b.id);
    setForm({ name: b.name, description: b.description ?? '' });
  };

  const handleSaveBook = async () => {
    if (!form.name) return;
    if (editId === '__new__') {
      const book = createDefaultLorebook(form.name);
      book.description = form.description;
      await saveLorebook(book);
      setBooks(prev => [...prev, book]);
    } else if (editId) {
      setBooks(prev => prev.map(b => b.id === editId ? { ...b, name: form.name, description: form.description, updatedAt: Date.now() } : b));
      const b = books.find(x => x.id === editId);
      if (b) await saveLorebook({ ...b, name: form.name, description: form.description, updatedAt: Date.now() });
    }
    setEditId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteLorebookDb(id);
    setBooks(prev => prev.filter(b => b.id !== id));
    setActiveIds(prev => prev.filter(x => x !== id));
  };

  // Entry CRUD
  const handleAddEntry = () => {
    setEditingEntryId('__new__');
    setEntryForm({ keys: '', content: '', comment: '' });
  };

  const handleEditEntry = (e: LorebookEntry) => {
    setEditingEntryId(e.id);
    setEntryForm({ keys: e.keys.join(', '), content: e.content, comment: e.comment ?? '' });
  };

  const handleSaveEntry = async () => {
    if (!expandedId || !entryForm.keys || !entryForm.content) return;
    const book = books.find(b => b.id === expandedId);
    if (!book) return;

    const entry: LorebookEntry = {
      id: editingEntryId === '__new__' ? crypto.randomUUID() : editingEntryId!,
      keys: entryForm.keys.split(',').map(k => k.trim()).filter(Boolean),
      secondaryKeys: [],
      content: entryForm.content,
      comment: entryForm.comment || undefined,
      order: book.entries.length,
      position: 'before_char',
      selective: false,
      selectiveLogic: 'and_any',
      constant: false,
      probability: 100,
      addMemo: false,
    };

    let entries: LorebookEntry[];
    if (editingEntryId === '__new__') {
      entries = [...book.entries, entry];
    } else {
      entries = book.entries.map(e => e.id === editingEntryId ? entry : e);
    }

    const updated = { ...book, entries, updatedAt: Date.now() };
    await saveLorebook(updated);
    setBooks(prev => prev.map(b => b.id === expandedId ? updated : b));
    setEditingEntryId(null);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!expandedId) return;
    const book = books.find(b => b.id === expandedId);
    if (!book) return;
    const updated = { ...book, entries: book.entries.filter(e => e.id !== entryId), updatedAt: Date.now() };
    await saveLorebook(updated);
    setBooks(prev => prev.map(b => b.id === expandedId ? updated : b));
  };

  if (!loaded) return <div className="lp-loading">加载中…</div>;

  return (
    <div className="lp-panel">
      <div className="lp-header-row">
        <span className="lp-count">{activeIds.length}/{books.length} 已启用</span>
        <button className="lp-btn lp-btn--add" onClick={handleAdd}>+ 新增世界书</button>
      </div>

      <div className="lp-list">
        {books.map(b => {
          const isActive = activeIds.includes(b.id);
          const isExpanded = expandedId === b.id;
          return (
            <div key={b.id} className={`lp-card${isActive ? ' lp-card--active' : ''}`}>
              <div className="lp-card-main" onClick={() => toggleActive(b.id)}>
                <div className="lp-card-left">
                  <span className="lp-card-name">{b.name}</span>
                  <span className="lp-card-meta">{b.entries.length} 条目 · {b.description || '无描述'}</span>
                </div>
                <div className="lp-card-actions">
                  <button className="lp-icon-btn" onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : b.id); }} title="条目">
                    {isExpanded ? '▲' : '▼'}
                  </button>
                  <button className="lp-icon-btn" onClick={(e) => { e.stopPropagation(); handleEdit(b); }} title="编辑">✏</button>
                  <button className="lp-icon-btn lp-icon-btn--danger" onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }} title="删除">🗑</button>
                </div>
              </div>
              {isActive && <div className="lp-card-badge">启用</div>}

              {/* Expanded: entry list */}
              {isExpanded && (
                <div className="lp-entries">
                  <div className="lp-entries-header">
                    <span>条目 ({b.entries.length})</span>
                    <button className="lp-btn lp-btn--add" onClick={handleAddEntry}>+ 新增条目</button>
                  </div>
                  {b.entries.map(e => (
                    <div key={e.id} className="lp-entry">
                      <div className="lp-entry-top">
                        <span className="lp-entry-keys">{e.keys.join(', ')}</span>
                        <div className="lp-entry-acts">
                          <button className="lp-icon-btn" onClick={() => handleEditEntry(e)}>✏</button>
                          <button className="lp-icon-btn lp-icon-btn--danger" onClick={() => handleDeleteEntry(e.id)}>×</button>
                        </div>
                      </div>
                      <div className="lp-entry-content">{e.content.slice(0, 120)}{e.content.length > 120 ? '…' : ''}</div>
                    </div>
                  ))}
                  {b.entries.length === 0 && <div className="lp-empty">暂无条目</div>}
                </div>
              )}
            </div>
          );
        })}
        {books.length === 0 && <div className="lp-empty">暂无世界书，点「+ 新增世界书」创建一个</div>}
      </div>

      {/* Book name/desc modal */}
      {editId && (
        <div className="lp-modal-overlay" onClick={() => setEditId(null)}>
          <div className="lp-modal" onClick={e => e.stopPropagation()}>
            <div className="lp-modal-header">
              <span>{editId === '__new__' ? '新增世界书' : '编辑世界书'}</span>
              <button className="lp-modal-close" onClick={() => setEditId(null)}>✕</button>
            </div>
            <div className="lp-modal-body">
              <label className="lp-field"><span>名称</span>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="世界书名称" />
              </label>
              <label className="lp-field"><span>描述</span>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="描述（可选）" />
              </label>
              <div className="lp-modal-actions">
                <button className="lp-btn" onClick={() => setEditId(null)}>取消</button>
                <button className="lp-btn lp-btn--primary" onClick={handleSaveBook}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entry edit modal */}
      {editingEntryId && (
        <div className="lp-modal-overlay" onClick={() => setEditingEntryId(null)}>
          <div className="lp-modal" onClick={e => e.stopPropagation()}>
            <div className="lp-modal-header">
              <span>{editingEntryId === '__new__' ? '新增条目' : '编辑条目'}</span>
              <button className="lp-modal-close" onClick={() => setEditingEntryId(null)}>✕</button>
            </div>
            <div className="lp-modal-body">
              <label className="lp-field"><span>触发关键词（逗号分隔）</span>
                <input value={entryForm.keys} onChange={e => setEntryForm({ ...entryForm, keys: e.target.value })} placeholder="剑, 战斗, 武器" />
              </label>
              <label className="lp-field"><span>内容</span>
                <textarea rows={6} value={entryForm.content}
                  onChange={e => setEntryForm({ ...entryForm, content: e.target.value })}
                  placeholder="当触发关键词出现时，这段内容会被注入到 AI 的上下文中…" />
              </label>
              <label className="lp-field"><span>备注（可选）</span>
                <input value={entryForm.comment} onChange={e => setEntryForm({ ...entryForm, comment: e.target.value })} placeholder="内部备注，不会发给 AI" />
              </label>
              <div className="lp-modal-actions">
                <button className="lp-btn" onClick={() => setEditingEntryId(null)}>取消</button>
                <button className="lp-btn lp-btn--primary" onClick={handleSaveEntry}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
