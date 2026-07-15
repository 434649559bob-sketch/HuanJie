import './FusionModal.css';

interface FusionModalProps {
  open: boolean;
  onClose: () => void;
  fusionRate: number;
}

export default function FusionModal({ open, onClose, fusionRate }: FusionModalProps) {
  if (!open) return null;

  const phase = fusionRate < 10 ? 1 : fusionRate < 30 ? 2 : fusionRate < 50 ? 3 : fusionRate < 70 ? 4 : fusionRate < 90 ? 5 : 6;
  const phaseLabel = ['萌芽期', '渗透期', '侵蚀期', '临界期', '崩坏期', '终焉'][phase - 1];
  const phaseDesc = [
    '两界之间的壁垒刚刚出现裂隙，仅有微弱的异常信号被检测到。现实世界一切如常。',
    '裂隙逐渐扩大，游戏中的某些事物开始出现在现实中。少数敏感的人能察觉到异常。',
    '两界的边界开始模糊。现实世界出现不可解释的现象——建筑物莫名改变，街道上偶尔闪过游戏中的生物。',
    '临界点已过。现实与游戏的界限大面积崩塌。空间不稳定成为常态，两界的规则开始互相渗透。',
    '世界处于崩溃边缘。现实与游戏几乎完全重叠，物理法则不再可靠。生存本身成为挑战。',
    '两界完全融合。旧世界的秩序彻底消亡，新的混合现实诞生。这是终点，也是起点。',
  ][phase - 1];

  const nextThreshold = phase === 1 ? 10 : phase === 2 ? 30 : phase === 3 ? 50 : phase === 4 ? 70 : phase === 5 ? 90 : 100;
  const progressInPhase = phase === 6 ? 100 : ((fusionRate - (phase === 1 ? 0 : phase === 2 ? 10 : phase === 3 ? 30 : phase === 4 ? 50 : phase === 5 ? 70 : 90)) / (nextThreshold - (phase === 1 ? 0 : phase === 2 ? 10 : phase === 3 ? 30 : phase === 4 ? 50 : phase === 5 ? 70 : 90))) * 100;

  const dangerColor = fusionRate >= 70 ? 'var(--danger)' : fusionRate >= 30 ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="fusion-modal-overlay" onClick={onClose}>
      <div className="fusion-modal" onClick={e => e.stopPropagation()}>
        <div className="fm-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>
          </svg>
          <span className="fm-title">世界融合度</span>
          <button className="fm-close" onClick={onClose} aria-label="关闭"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="fm-body">
          {/* Big number */}
          <div className="fm-rate">
            <span className="fm-rate-value font-mono" style={{ color: dangerColor }}>{fusionRate}%</span>
            <span className="fm-rate-label">两界融合进度</span>
          </div>

          {/* Phase */}
          <div className="fm-phase">
            <span className="fm-phase-badge" style={{ color: dangerColor, borderColor: dangerColor }}>{phaseLabel}</span>
            <div className="fm-phase-bar"><div className="fm-phase-fill" style={{ width: `${progressInPhase}%`, background: dangerColor }}/></div>
            <span className="fm-phase-next font-mono">{nextThreshold}%</span>
          </div>
          <p className="fm-phase-desc">{phaseDesc}</p>

          {/* Phase timeline */}
          <div className="fm-timeline">
            {[0, 10, 30, 50, 70, 90, 100].map((threshold, i) => {
              const reached = fusionRate >= threshold;
              const label = ['萌芽', '渗透', '侵蚀', '临界', '崩坏', '终焉'][i] || '';
              return (
                <div key={i} className={`fm-timeline-node${reached ? ' fm-timeline-node--reached' : ''}`}>
                  <div className="fm-timeline-dot" style={{ background: reached ? dangerColor : 'var(--border-strong)' }}/>
                  <span className="fm-timeline-pct font-mono">{threshold}%</span>
                  {label && <span className="fm-timeline-label">{label}</span>}
                </div>
              );
            })}
          </div>

          {fusionRate >= 70 && (
            <div className="fm-warning">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>融合度已超过70%，现实与游戏的边界已经大面积崩塌，UI将不再区分两界层次。</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
