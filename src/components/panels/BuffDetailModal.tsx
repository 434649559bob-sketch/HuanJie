import type { BuffDebuff } from '../../App';
import './BuffDetailModal.css';

interface BuffDetailModalProps {
  open: boolean;
  onClose: () => void;
  buff: BuffDebuff | null;
  isDebuff: boolean;
}

export default function BuffDetailModal({ open, onClose, buff, isDebuff }: BuffDetailModalProps) {
  if (!open || !buff) return null;

  return (
    <div className="buff-modal-overlay" onClick={onClose}>
      <div className="buff-modal" onClick={e => e.stopPropagation()}>
        <div className="bm-header">
          <span className={`bm-type-tag${isDebuff ? ' bm-type-tag--debuff' : ' bm-type-tag--buff'}`}>
            {isDebuff ? 'DEBUFF' : 'BUFF'}
          </span>
          <span className="bm-name">{buff.name}</span>
          <button className="bm-close" onClick={onClose} aria-label="关闭">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="bm-body">
          <div className="bm-row">
            <span className="bm-label">效果</span>
            <span className="bm-value">{buff.effect}</span>
          </div>
          <div className="bm-row">
            <span className="bm-label">来源</span>
            <span className="bm-value">{buff.source}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
