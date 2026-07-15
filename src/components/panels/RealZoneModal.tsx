import type { RealZoneInfo } from '../../App';
import './RealZoneModal.css';

interface RealZoneModalProps {
  open: boolean;
  onClose: () => void;
  realZoneInfo: RealZoneInfo;
  fusionRate: number;
}

export default function RealZoneModal({ open, onClose, realZoneInfo, fusionRate }: RealZoneModalProps) {
  if (!open) return null;

  const dangerActive = fusionRate > 30;
  const dangerDisplay = dangerActive ? realZoneInfo.dangerLevel : 0;

  const dangerColor = dangerDisplay >= 70 ? 'var(--danger)'
    : dangerDisplay >= 30 ? 'var(--warning)'
    : 'var(--success)';

  const dangerLabel = dangerDisplay >= 70 ? '高危'
    : dangerDisplay >= 30 ? '警戒'
    : '安全';

  return (
    <div className="realzone-modal-overlay" onClick={onClose}>
      <div className="realzone-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="rzm-header">
          <div className="rzm-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
          </div>
          <div className="rzm-header-text">
            <span className="rzm-location-name">现实 · {realZoneInfo.locationName}</span>
          </div>
          <button className="rzm-close" onClick={onClose} aria-label="关闭">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Danger Level */}
        <div className="rzm-danger-section">
          <div className="rzm-danger-card">
            <span className="rzm-danger-label">危险度</span>
            <span className="rzm-danger-value" style={{ color: dangerColor }}>
              {dangerDisplay}%
            </span>
            <span className="rzm-danger-tag" style={{ color: dangerColor, borderColor: dangerColor }}>
              {dangerLabel}
            </span>
          </div>
          {!dangerActive && (
            <div className="rzm-fusion-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>当前融合度 {fusionRate}%，尚未达到危险阈值（30%）。现实世界暂无异常。</span>
            </div>
          )}
          {dangerActive && (
            <div className="rzm-fusion-note rzm-fusion-note--warn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>融合度已超过30%，现实世界可能出现空间不稳定现象，请保持警惕。</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="rzm-desc">
          {realZoneInfo.description}
        </div>

        {/* Danger explanation */}
        <div className="rzm-rule-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>危险度规则：融合度低于30%时现实世界始终安全。超过30%后，危险度随融合度上升而增加。具体阈值和事件规则详见设计备忘。</span>
        </div>
      </div>
    </div>
  );
}
