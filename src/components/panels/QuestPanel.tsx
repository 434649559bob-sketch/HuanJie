import { useState } from 'react';
import type { Quest } from '../../App';
import './QuestPanel.css';

interface QuestPanelProps {
  quests: Quest[];
}

type FilterType = 'main' | 'side' | 'daily' | 'completed';
const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'main', label: '主线' }, { key: 'side', label: '支线' }, { key: 'daily', label: '日常' }, { key: 'completed', label: '已完成' },
];
const TYPE_LABELS: Record<string, string> = { main: '主线', side: '支线', daily: '日常', completed: '已完成' };

export default function QuestPanel({ quests }: QuestPanelProps) {
  const [filter, setFilter] = useState<FilterType>('main');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === 'completed'
    ? quests.filter(q => q.status === 'completed')
    : quests.filter(q => q.type === filter && q.status === 'active');

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="qp-panel">
      <div className="qp-filters">
        {FILTERS.map(f => {
          const count = f.key === 'completed'
            ? quests.filter(q => q.status === 'completed').length
            : quests.filter(q => q.type === f.key && q.status === 'active').length;
          return (
            <button key={f.key} className={`qp-filter${filter === f.key ? ' qp-filter--active' : ''}`} onClick={() => { setFilter(f.key); setExpanded(null); }}>
              {f.label}<span className="qp-filter-count">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="qp-empty">暂无任务</div>
      ) : (
        <div className="qp-list">
          {filtered.map(q => {
            const isOpen = expanded === q.id;
            const total = q.objectives.length;
            const done = q.objectives.filter(o => o.current >= o.required).length;
            const pct = total > 0 ? (done / total) * 100 : 0;
            return (
              <div key={q.id} className={`qp-quest${isOpen ? ' qp-quest--open' : ''}`}>
                <button className="qp-quest-header" onClick={() => toggle(q.id)}>
                  <div className="qp-quest-top">
                    <span className={`qp-quest-type-badge qp-type--${q.type}`}>{TYPE_LABELS[q.type]}</span>
                    <span className="qp-quest-name">{q.name}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`qp-chevron${isOpen ? ' qp-chevron--open' : ''}`}><polyline points="6,9 12,15 18,9"/></svg>
                  </div>
                  <div className="qp-quest-meta">{q.giver} · {q.location}</div>
                  <div className="qp-quest-progress">
                    <div className="qp-progress-bar"><div className="qp-progress-fill" style={{ width: `${pct}%` }}/></div>
                    <span className="qp-progress-text font-mono">{done}/{total}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="qp-quest-body">
                    <p className="qp-quest-desc">{q.description}</p>

                    <div className="qp-section-title">目标</div>
                    {q.objectives.map(o => {
                      const isDone = o.current >= o.required;
                      return (
                        <div key={o.id} className={`qp-obj${isDone ? ' qp-obj--done' : ''}`}>
                          <span className="qp-obj-check">{isDone ? '☑' : '☐'}</span>
                          <span className="qp-obj-desc">{o.description}</span>
                          <span className="qp-obj-progress font-mono">{o.current}/{o.required}</span>
                        </div>
                      );
                    })}

                    <div className="qp-section-title">奖励</div>
                    <div className="qp-rewards">
                      {q.rewards.xp && <span className="qp-reward">XP +{q.rewards.xp.toLocaleString()}</span>}
                      {q.rewards.money && <span className="qp-reward">💰 +{q.rewards.money.toLocaleString()} G</span>}
                      {q.rewards.items?.map(item => <span key={item} className="qp-reward">📦 {item}</span>)}
                      {q.rewards.title && <span className="qp-reward">🏆 {q.rewards.title}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="qp-ai-note">任务由 AI 根据剧情自动生成与更新。完成任务后自动移至已完成列表。</div>
    </div>
  );
}
