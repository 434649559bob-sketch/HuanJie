import type { TimeLocationState, ZoneInfo } from '../../App';
import './TimeLocationBar.css';

interface TimeLocationBarProps {
  data: TimeLocationState;
  zoneInfo: ZoneInfo;
  isInGame: boolean;
  collapsed: boolean;
  onGameZoneClick: () => void;
  onRealZoneClick: () => void;
  onFusionClick: () => void;
}

export default function TimeLocationBar({
  data, zoneInfo, isInGame, collapsed, onGameZoneClick, onRealZoneClick, onFusionClick,
}: TimeLocationBarProps) {
  if (collapsed) return null;

  const fusionWarning = data.fusionRate > 30;
  const fullyFused = data.fusionRate >= 70;

  const realOpacity = fullyFused ? 1 : (isInGame ? 0.35 : 1);
  const gameOpacity = fullyFused ? 1 : (isInGame ? 1 : 0.35);

  return (
    <div className={`time-location${fusionWarning ? ' time-location--warning' : ''}`}>
      {/* Time row */}
      <div className="tl-row">
        <div className="tl-item" style={{ opacity: realOpacity, transition: 'opacity 250ms var(--ease-out)' }}>
          <svg className="tl-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
          </svg>
          <span className="tl-label">现实</span>
          <span className="tl-value font-mono">{data.realTime}</span>
        </div>
        <div className="tl-item" style={{ opacity: gameOpacity, transition: 'opacity 250ms var(--ease-out)' }}>
          <svg className="tl-icon tl-icon--game" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
          </svg>
          <span className="tl-label">游戏</span>
          <span className="tl-value font-mono">{data.gameTime}</span>
        </div>
      </div>

      {/* Real Location */}
      <button
        className="tl-location-btn"
        onClick={onRealZoneClick}
        style={{ opacity: realOpacity, transition: 'opacity 250ms var(--ease-out)' }}
        aria-label="查看现实地区详情"
      >
        <div className="tl-loc-header">
          <svg className="tl-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
          <span className="tl-label">现实位置</span>
        </div>
        <span className="tl-loc-value">{data.realLocation}</span>
        <div className="tl-loc-indicator">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </button>

      {/* Game Location */}
      <button
        className="tl-location-btn tl-location-btn--game"
        onClick={onGameZoneClick}
        style={{ opacity: gameOpacity, transition: 'opacity 250ms var(--ease-out)' }}
        aria-label="查看游戏区块详情"
      >
        <div className="tl-loc-header">
          <svg className="tl-icon tl-icon--game" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="tl-label">游戏位置</span>
        </div>
        <span className="tl-loc-value">{data.gameLocation}</span>
        <div className="tl-loc-indicator">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </button>

      {/* Meta row */}
      <div className="tl-row tl-row--meta">
        <div className="tl-meta-left">
          <span className="tl-world" style={{ opacity: gameOpacity, transition: 'opacity 250ms' }}>{data.worldName}</span>
          <span className="tl-coeff font-mono" style={{ opacity: gameOpacity, transition: 'opacity 250ms' }}>
            系数 ×{zoneInfo.coefficient.toFixed(1)}
            {zoneInfo.powerSystemMatch && <span className="tl-coeff-match">·匹配</span>}
          </span>
        </div>
        <button className={`tl-fusion-btn${fusionWarning ? ' tl-fusion-btn--warn' : ''}`} onClick={onFusionClick}>
          融合度 {data.fusionRate}%
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </button>
      </div>
    </div>
  );
}
