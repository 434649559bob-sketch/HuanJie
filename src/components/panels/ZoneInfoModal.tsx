import type { ZoneInfo } from '../../App';
import './ZoneInfoModal.css';

interface ZoneInfoModalProps {
  open: boolean;
  onClose: () => void;
  zoneInfo: ZoneInfo;
  playerPower: number;
}

export default function ZoneInfoModal({ open, onClose, zoneInfo, playerPower }: ZoneInfoModalProps) {
  if (!open) return null;

  const effectivePower = Math.floor(playerPower * zoneInfo.coefficient);

  return (
    <div className="zone-modal-overlay" onClick={onClose}>
      <div className="zone-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="zm-header">
          <div className="zm-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div className="zm-header-text">
            <span className="zm-zone-name">{zoneInfo.zoneName}</span>
            <span className="zm-zone-type">{zoneInfo.zoneType} 区块</span>
          </div>
          <button className="zm-close" onClick={onClose} aria-label="关闭">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Coefficient Display */}
        <div className="zm-coeff-section">
          <div className="zm-coeff-card">
            <span className="zm-coeff-label">区块系数</span>
            <span className={`zm-coeff-value${zoneInfo.coefficient >= 1 ? ' zm-coeff--positive' : ' zm-coeff--negative'}`}>
              ×{zoneInfo.coefficient.toFixed(1)}
            </span>
          </div>
          <div className="zm-coeff-card">
            <span className="zm-coeff-label">力量体系</span>
            <span className={`zm-coeff-match${zoneInfo.powerSystemMatch ? '' : ' zm-coeff--mismatch'}`}>
              {zoneInfo.powerSystemMatch ? '匹配' : '非匹配'}
            </span>
          </div>
        </div>

        {/* Power Calculation */}
        <div className="zm-power-calc">
          <div className="zm-power-row">
            <span className="zm-power-label">自身战力</span>
            <span className="zm-power-value font-mono">{playerPower.toLocaleString()}</span>
          </div>
          <div className="zm-power-op">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/></svg>
          </div>
          <div className="zm-power-row">
            <span className="zm-power-label">区块系数</span>
            <span className="zm-power-value font-mono">×{zoneInfo.coefficient.toFixed(1)}</span>
          </div>
          <div className="zm-power-op">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div className="zm-power-row zm-power-row--result">
            <span className="zm-power-label">当前有效战力</span>
            <span className="zm-power-value zm-power-value--effective font-mono">{effectivePower.toLocaleString()}</span>
          </div>
        </div>

        {/* Description */}
        <div className="zm-desc">
          {zoneInfo.description}
        </div>

        {/* Coefficient rule hint */}
        <div className="zm-rule-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>系数规则：匹配力量体系获得全额加成，非匹配体系根据相似度获得部分加成或削减。具体规则详见设计备忘。</span>
        </div>
      </div>
    </div>
  );
}
