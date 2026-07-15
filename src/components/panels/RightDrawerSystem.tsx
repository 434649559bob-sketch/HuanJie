import type { ReactNode } from 'react';
import './RightDrawerSystem.css';

export type DrawerId =
  | 'world'
  | 'character'
  | 'inventory'
  | 'skills'
  | 'quests'
  | 'social'
  | 'map'
  | 'settings'
  | null;

interface DrawerDefinition {
  id: DrawerId;
  label: string;
  icon: ReactNode;
}

const DRAWERS: DrawerDefinition[] = [
  {
    id: 'world',
    label: '世界',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  },
  {
    id: 'character',
    label: '角色',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    id: 'inventory',
    label: '背包',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  },
  {
    id: 'skills',
    label: '技能',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>,
  },
  {
    id: 'quests',
    label: '任务',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    id: 'social',
    label: '社交',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    id: 'map',
    label: '地图',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  },
  {
    id: 'settings',
    label: '设置',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
];

interface RightDrawerSystemProps {
  activeDrawer: DrawerId;
  onToggle: (id: DrawerId) => void;
}

export default function RightDrawerSystem({ activeDrawer, onToggle }: RightDrawerSystemProps) {
  const activeDef = DRAWERS.find(d => d.id === activeDrawer);

  return (
    <>
      {/* Trigger Column */}
      <nav className="right-triggers" aria-label="功能面板">
        {DRAWERS.map(def => (
          <button
            key={def.id}
            className={`right-trigger${activeDrawer === def.id ? ' right-trigger--active' : ''}`}
            onClick={() => onToggle(def.id)}
            aria-label={def.label}
            title={def.label}
          >
            {def.icon}
            <span className="right-trigger-label">{def.label}</span>
          </button>
        ))}
      </nav>

      {/* Drawer Panel */}
      <aside
        className={`right-drawer${activeDrawer ? ' right-drawer--open' : ''}`}
        aria-label={activeDef ? `${activeDef.label}面板` : undefined}
      >
        {activeDef && (
          <div className="right-drawer-inner">
            <div className="rd-header">
              <span className="rd-title">{activeDef.label}</span>
              <button
                className="rd-close"
                onClick={() => onToggle(null)}
                aria-label="关闭面板"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="rd-content">
              <div className="rd-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
                <span className="rd-placeholder-text">
                  {activeDef?.label}面板 — 功能待实现
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
