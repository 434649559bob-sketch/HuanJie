import { useState } from 'react';
import type { PlayerState, ZoneInfo, BuffDebuff } from '../../App';
import BuffDetailModal from './BuffDetailModal';
import './PlayerCard.css';

interface PlayerCardProps {
  player: PlayerState;
  zoneInfo: ZoneInfo;
  isInGame: boolean;
  fusionRate: number;
  collapsed: boolean;
  onDetailClick: () => void;
  onGameToggle: () => void;
}

export default function PlayerCard({
  player, zoneInfo, isInGame, fusionRate, collapsed, onDetailClick, onGameToggle,
}: PlayerCardProps) {
  const [buffDetail, setBuffDetail] = useState<{ buff: BuffDebuff; isDebuff: boolean } | null>(null);

  if (collapsed) return null;

  const hpPct = (player.hp / player.maxHp) * 100;
  const mpPct = (player.mp / player.maxMp) * 100;
  const hpColor = hpPct > 60 ? 'var(--success)' : hpPct > 25 ? 'var(--warning)' : 'var(--danger)';
  const effectivePower = Math.floor(player.powerLevel * zoneInfo.coefficient);

  const fullyFused = fusionRate >= 70;
  const realOpacity = fullyFused ? 1 : (isInGame ? 0.35 : 1);
  const gameOpacity = fullyFused ? 1 : (isInGame ? 1 : 0.35);
  const displayAvatar = isInGame ? player.gameAvatarUrl : player.realAvatarUrl;

  return (
    <div className="player-card">
      {/* Header */}
      <div className="pc-header">
        <div className="pc-avatar" onClick={onDetailClick} role="button" tabIndex={0} aria-label="查看详细资料" title="点击查看详细资料">
          {displayAvatar ? (
            <img src={displayAvatar} alt="头像" className="pc-avatar__img" />
          ) : (
            <div className="pc-avatar__placeholder">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
          )}
          <span className="pc-level-badge font-mono">Lv.{player.level}</span>
        </div>

        <div className="pc-names">
          {/* Names: game/real side by side */}
          <div className="pc-name-line">
            <span className="pc-game-name" style={{ opacity: gameOpacity, transition: 'opacity 250ms' }}>{player.gameName}</span>
            <span className="pc-name-sep">·</span>
            <span className="pc-real-name" style={{ opacity: realOpacity, transition: 'opacity 250ms' }}>{player.realName}</span>
          </div>
          {/* Occupations: game class / real occupation */}
          <div className="pc-sub-line">
            <span className="pc-class" style={{ opacity: gameOpacity, transition: 'opacity 250ms' }}>{player.gameClass}</span>
            <span className="pc-occ-sep">·</span>
            <span className="pc-occupation" style={{ opacity: realOpacity, transition: 'opacity 250ms' }}>{player.realOccupation}</span>
          </div>
        </div>

        <button className="pc-detail-btn" onClick={onDetailClick} aria-label="查看详细资料" title="详细资料">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </button>
      </div>

      {/* Power + Money */}
      <div className="pc-meta">
        <div className="pc-power-group">
          <span className="pc-power">
            战力 <strong className="font-mono">{effectivePower.toLocaleString()}</strong>
          </span>
          {zoneInfo.coefficient !== 1 && (
            <span className="pc-power-note font-mono">
              ({player.powerLevel.toLocaleString()}×{zoneInfo.coefficient.toFixed(1)})
            </span>
          )}
        </div>
        <div className="pc-money">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          <span className="font-mono">{player.money.toLocaleString()}</span>
          <span className="pc-money-label">G</span>
        </div>
      </div>

      {/* HP / MP — always lit */}
      <div className="pc-bars">
        <div className="pc-bar-row">
          <span className="pc-bar-label">HP</span>
          <div className="pc-bar-track"><div className="pc-bar-fill" style={{ width: `${hpPct}%`, background: hpColor }} /></div>
          <span className="pc-bar-value font-mono">{player.hp}/{player.maxHp}</span>
        </div>
        <div className="pc-bar-row">
          <span className="pc-bar-label">MP</span>
          <div className="pc-bar-track"><div className="pc-bar-fill" style={{ width: `${mpPct}%`, background: 'var(--accent-400)' }} /></div>
          <span className="pc-bar-value font-mono">{player.mp}/{player.maxMp}</span>
        </div>
      </div>

      {/* Buffs/Debuffs — dual layer */}
      {(player.gameBuffs.length > 0 || player.gameDebuffs.length > 0 || player.realBuffs.length > 0 || player.realDebuffs.length > 0) && (
        <div className="pc-tags">
          {/* Game layer */}
          <div className="pc-tags-layer" style={{ opacity: gameOpacity, transition: 'opacity 250ms' }}>
            {player.gameBuffs.map(b => (
              <button key={`gb-${b.name}`} className="pc-tag pc-tag--buff" onClick={() => setBuffDetail({ buff: b, isDebuff: false })}>{b.name}</button>
            ))}
            {player.gameDebuffs.map(d => (
              <button key={`gd-${d.name}`} className="pc-tag pc-tag--debuff" onClick={() => setBuffDetail({ buff: d, isDebuff: true })}>{d.name}</button>
            ))}
          </div>
          {/* Real layer */}
          <div className="pc-tags-layer" style={{ opacity: realOpacity, transition: 'opacity 250ms' }}>
            {player.realBuffs.map(b => (
              <button key={`rb-${b.name}`} className="pc-tag pc-tag--buff pc-tag--real" onClick={() => setBuffDetail({ buff: b, isDebuff: false })}>{b.name}</button>
            ))}
            {player.realDebuffs.map(d => (
              <button key={`rd-${d.name}`} className="pc-tag pc-tag--debuff pc-tag--real" onClick={() => setBuffDetail({ buff: d, isDebuff: true })}>{d.name}</button>
            ))}
          </div>
        </div>
      )}

      {/* Action Status — dims with game layer */}
      {player.actionStatus && (
        <div className="pc-action-status" style={{ opacity: gameOpacity, transition: 'opacity 250ms' }}>
          <span className="pc-action-text">{player.actionStatus}</span>
        </div>
      )}

      {/* Login / Logout toggle */}
      <button
        className={`pc-game-toggle${isInGame ? ' pc-game-toggle--in' : ' pc-game-toggle--out'}`}
        onClick={onGameToggle}
      >
        {isInGame ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>退出游戏</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10,17 15,12 10,7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            <span>进入游戏</span>
          </>
        )}
      </button>

      {/* Buff/Debuff Detail Modal */}
      <BuffDetailModal
        open={buffDetail !== null}
        onClose={() => setBuffDetail(null)}
        buff={buffDetail?.buff ?? null}
        isDebuff={buffDetail?.isDebuff ?? false}
      />
    </div>
  );
}
