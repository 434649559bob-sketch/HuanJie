import { useState } from 'react';
import { useToast } from '../ui/ToastProvider';
import './DungeonPanel.css';

// ═══════════════════════════════════════════
// 副本数据模型
// ═══════════════════════════════════════════
interface Dungeon {
  id: string;
  name: string;
  type: 'story' | 'challenge';
  dangerLevel?: number;
  minLevel?: number;
  location: string;
  coverDesc: string;
  rewards: string;
}

// ── Mock Dungeons ──
const STORY_DUNGEONS: Dungeon[] = [
  { id: 'ds-1', name: '剑灵往事', type: 'story', location: '昆仑墟·剑冢', coverDesc: '剑冢深处的剑灵残影并非一直如此狂暴。触碰残魂，你将被拉入三百年前的昆仑墟，亲眼见证那场改变一切的浩劫。', rewards: '稀有武器外观、称号「见证者」、剑魂碎片×3'},
  { id: 'ds-2', name: '炼器堂失窃案', type: 'story', location: '昆仑墟·炼器堂', coverDesc: '柳白霜的炼器堂昨夜遭窃。小偷在现场留下了一行字：「我只是想看看」。废料堆里藏着什么秘密？', rewards: '解锁隐藏锻造配方、成品聚灵丹×1' },
];

const CHALLENGE_DUNGEONS: Dungeon[] = [
  { id: 'dc-1', name: '剑冢·深处', type: 'challenge', dangerLevel: 65, minLevel: 40, location: '昆仑墟·剑冢', coverDesc: '剑灵残影在剑冢最深处徘徊。击败它，获得上古剑修的遗产。', rewards: '史诗武器「霜月」、剑魂碎片、大量经验' },
  { id: 'dc-2', name: '古战场·将军陵', type: 'challenge', dangerLevel: 50, minLevel: 30, location: '昆仑墟·古战场', coverDesc: '千年亡魂的统帅苏醒了。它的怒火足以撕裂大地。', rewards: '稀有武器「破军」、古代盔甲碎片' },
  { id: 'dc-3', name: '灵蚕洞·巢穴', type: 'challenge', dangerLevel: 30, minLevel: 15, location: '昆仑墟·灵蚕洞', coverDesc: '灵蚕王正在进化，趁它尚未完成蜕变，先下手为强。', rewards: '大量灵蚕丝、玄铁矿、稀有材料' },
  { id: 'dc-4', name: '钢铁城·变异巢穴', type: 'challenge', dangerLevel: 55, minLevel: 35, location: '废土·钢铁城', coverDesc: '钢铁城外的变异兽巢穴正在扩张。赏金猎人组队清剿中。', rewards: '大量金钱、变异材料、赏金猎人声望' },
  { id: 'dc-5', name: '赛博城·防火墙', type: 'challenge', dangerLevel: 45, minLevel: 25, location: '赛博城·黑市区', coverDesc: '一个失控的AI正在吞噬黑市区的数据网络。暗影行者需要帮手。', rewards: '稀有黑客工具、义体升级组件' },
];

type EntryMode = 'choose' | 'solo' | 'team' | 'match' | null;

// ═══════════════════════════════════════════
// 寻找副本 — AI 生成请求的数据结构
// ═══════════════════════════════════════════
// 发送给 API:
// {
//   action: 'generate_dungeon',
//   worldType: string,       // 玩家选择的世界观
//   dangerLevel: number,     // 玩家期望的危险度 1-100
//   type: 'story' | 'challenge',
//   playerLevel: number,     // 玩家当前等级（用于难度缩放）
//   playerClass: string,     // 玩家职业（用于主题匹配）
//   existingNames: string[], // 已有副本名（防止重复）
// }
//
// API 返回:
// {
//   name: string,            // 副本名称
//   location: string,        // 所在地点
//   coverDesc: string,       // 引子/简介（50-100字）
//   rewards: string,         // 奖励描述
//   minLevel?: number,       // 最低等级（挑战副本）
//   dangerLevel?: number,    // 危险度（挑战副本）
// }

export default function DungeonPanel() {
  const [mode, setMode] = useState<'story' | 'challenge'>('story');
  const [selected, setSelected] = useState<Dungeon | null>(null);
  const [entryMode, setEntryMode] = useState<EntryMode>(null);
  const [inviteList, setInviteList] = useState<string[]>([]);
  const [findOpen, setFindOpen] = useState(false);
  const [findWorld, setFindWorld] = useState('');
  const [findTheme, setFindTheme] = useState('');    // 故事副本：题材
  const [findSynopsis, setFindSynopsis] = useState(''); // 故事副本：梗概/关于谁
  const [findDanger, setFindDanger] = useState(30);
  const [findReward, setFindReward] = useState('');   // 挑战副本：期望奖励
  const [customDungeons, setCustomDungeons] = useState<Dungeon[]>([]);
  const { addToast } = useToast();

  const dungeons = mode === 'story'
    ? [...STORY_DUNGEONS, ...customDungeons.filter(d => d.type === 'story')]
    : [...CHALLENGE_DUNGEONS, ...customDungeons.filter(d => d.type === 'challenge')];

  const closeModal = () => { setEntryMode(null); setInviteList([]); };

  const handleFindDungeon = () => {
    if (!findWorld.trim()) { addToast('请输入世界观', 'error'); return; }
    if (mode === 'story' && !findTheme.trim()) { addToast('请输入题材', 'error'); return; }

    // 原型：mock 生成，后续替换为 API 调用
    // 发送给 API 的数据见下方 JSX 中的注释
    const newName = mode === 'story'
      ? `${findWorld}·${findTheme}${findSynopsis ? '·' + findSynopsis.slice(0, 6) : ''}`
      : `${findWorld}挑战·危险度${findDanger}`;
    const newDungeon: Dungeon = {
      id: `custom-${Date.now()}`,
      name: newName,
      type: mode,
      dangerLevel: mode === 'challenge' ? findDanger : undefined,
      minLevel: mode === 'challenge' ? Math.max(1, Math.floor(findDanger / 2)) : undefined,
      location: `${findWorld}·未知区域`,
      coverDesc: mode === 'story'
        ? `题材：${findTheme}。${findSynopsis ? '梗概：' + findSynopsis : '待AI生成剧情引子'}。`
        : `挑战副本。${findReward ? '期望奖励：' + findReward + '（由AI进行合理性审查）' : '奖励由AI根据危险度设定'}`,
      rewards: mode === 'story' ? '根据剧情由AI设定' : (findReward || '由AI根据危险度设定'),
    };
    setCustomDungeons(prev => [...prev, newDungeon]);
    setSelected(newDungeon);
    setFindOpen(false);
    setFindWorld(''); setFindTheme(''); setFindSynopsis(''); setFindDanger(30); setFindReward('');
    addToast(`已生成副本「${newDungeon.name}」`, 'success');
  };

  return (
    <div className="dp-panel">
      {/* Type toggle */}
      <div className="dp-mode-toggle">
        <button className={`dp-mode-toggle-btn${mode === 'story' ? ' dp-mode-toggle-btn--active' : ''}`} onClick={() => { setMode('story'); setSelected(null); }}>故事体验</button>
        <button className={`dp-mode-toggle-btn${mode === 'challenge' ? ' dp-mode-toggle-btn--active' : ''}`} onClick={() => { setMode('challenge'); setSelected(null); }}>战斗挑战</button>
      </div>

      <div className="dp-body">
        {/* List */}
        <div className="dp-list">
          {dungeons.map(d => (
            <button key={d.id} className={`dp-item${selected?.id === d.id ? ' dp-item--active' : ''}`} onClick={() => setSelected(d)}>
              <div className="dp-item-name">{d.name}</div>
              <div className="dp-item-meta">
                <span>{d.location}</span>
                {d.dangerLevel && <span className="dp-danger font-mono" style={{ color: d.dangerLevel >= 50 ? 'var(--danger)' : 'var(--warning)' }}>危险 {d.dangerLevel}</span>}
              </div>
            </button>
          ))}
          <button className="dp-find-btn" onClick={() => setFindOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>寻找副本
          </button>
        </div>

        {/* Detail */}
        {selected && (
          <div className="dp-detail">
            <div className="dp-cover">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
              <span>{selected.name}</span>
              <span className="dp-cover-type">{selected.type === 'story' ? '故事体验' : '战斗挑战'}</span>
            </div>
            <p className="dp-desc">{selected.coverDesc}</p>

            <div className="dp-rewards">
              <span className="dp-rewards-label">奖励</span>
              <span>{selected.rewards}</span>
            </div>

            <button className="dp-enter-btn" onClick={() => setEntryMode('choose')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5,3 19,12 5,21"/></svg>进入副本
            </button>
          </div>
        )}
      </div>

      {/* ── Entry Modal ── */}
      {entryMode && (
        <div className="dp-modal-overlay" onClick={closeModal}>
          <div className="dp-modal" onClick={e => e.stopPropagation()}>
            {entryMode === 'choose' && (
              <>
                <div className="dp-modal-title">进入「{selected?.name}」</div>
                <div className="dp-modal-btns">
                  <button className="dp-mode-btn" onClick={() => setEntryMode('solo')}><span className="dp-mode-icon">⚔</span><span>单人挑战</span><span className="dp-mode-hint">独自进入</span></button>
                  <button className="dp-mode-btn" onClick={() => setEntryMode('team')}><span className="dp-mode-icon">👥</span><span>邀请组队</span><span className="dp-mode-hint">选择联系人</span></button>
                  <button className="dp-mode-btn" onClick={() => setEntryMode('match')}><span className="dp-mode-icon">🎲</span><span>匹配队友</span><span className="dp-mode-hint">随机匹配</span></button>
                </div>
                <button className="dp-cancel-btn" onClick={closeModal}>取消</button>
              </>
            )}
            {entryMode === 'solo' && <SoloConfirm dungeon={selected!} onClose={closeModal} />}
            {entryMode === 'team' && <TeamInvite inviteList={inviteList} setInviteList={setInviteList} onClose={closeModal} />}
            {entryMode === 'match' && <MatchConfirm dungeon={selected!} onClose={closeModal} />}
          </div>
        </div>
      )}

      {/* ── Find Dungeon Modal ──
          API 请求数据结构（发送至后端AI）:
         {
           action: 'generate_dungeon',
           type: 'story' | 'challenge',
           worldType: string,          // 玩家自由填写的世界观
           theme?: string,             // 故事副本：题材（悬疑/严肃/色色…）
           synopsis?: string,          // 故事副本：梗概/关于谁
           dangerLevel?: number,       // 挑战副本：期望危险度 1-100
           desiredReward?: string,     // 挑战副本：期望奖励（AI会审查合理性）
           playerLevel: number,        // 玩家等级用于缩放
           playerClass: string,        // 玩家职业
           existingNames: string[],    // 已有副本名防重复
         }
         AI 职责：审查期望奖励是否与危险度匹配，不匹配则自动调整
      ── */}
      {findOpen && (
        <div className="dp-modal-overlay" onClick={() => setFindOpen(false)}>
          <div className="dp-modal" onClick={e => e.stopPropagation()}>
            <div className="dp-modal-title">寻找副本 · {mode === 'story' ? '故事体验' : '战斗挑战'}</div>
            <p className="dp-find-desc">填写以下信息，AI 将为你生成一个全新的副本。</p>

            {/* 世界观 — 自由输入 */}
            <div className="dp-find-field">
              <span className="dp-find-label">世界观</span>
              <input className="dp-find-input" value={findWorld} onChange={e => setFindWorld(e.target.value)} placeholder="例如：修仙、克苏鲁、蒸汽朋克混搭武侠…" />
            </div>

            {/* 故事副本专属：题材 + 梗概 */}
            {mode === 'story' && (
              <>
                <div className="dp-find-field">
                  <span className="dp-find-label">题材</span>
                  <input className="dp-find-input" value={findTheme} onChange={e => setFindTheme(e.target.value)} placeholder="例如：悬疑、严肃正剧、轻松日常、纯爱、色色…" />
                </div>
                <div className="dp-find-field">
                  <span className="dp-find-label">故事梗概</span>
                  <textarea className="dp-find-textarea" value={findSynopsis} onChange={e => setFindSynopsis(e.target.value)} placeholder="简单写写想体验什么样的故事，或者围绕哪个角色展开…（可选）" rows={3} />
                </div>
              </>
            )}

            {/* 挑战副本专属：危险度 + 期望奖励 */}
            {mode === 'challenge' && (
              <>
                <div className="dp-find-field">
                  <span className="dp-find-label">期望危险度</span>
                  <div className="dp-find-danger-row">
                    <input type="range" min="5" max="95" step="5" value={findDanger} onChange={e => setFindDanger(Number(e.target.value))} className="dp-find-slider" />
                    <span className="dp-find-danger-val font-mono" style={{ color: findDanger >= 50 ? 'var(--danger)' : 'var(--warning)' }}>{findDanger}</span>
                  </div>
                </div>
                <div className="dp-find-field">
                  <span className="dp-find-label">期望奖励</span>
                  <input className="dp-find-input" value={findReward} onChange={e => setFindReward(e.target.value)} placeholder="例如：一把史诗级太刀、稀有锻造材料…（AI会审查是否合理）" />
                  <span className="dp-find-hint">AI 将审查期望奖励与危险度是否匹配。危险度 10 要传说装备会被自动拒绝或调整。</span>
                </div>
              </>
            )}

            <div className="dp-modal-btns">
              <button className="dp-confirm-btn" onClick={handleFindDungeon}>生成副本</button>
              <button className="dp-cancel-btn" onClick={() => setFindOpen(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──
function SoloConfirm({ dungeon, onClose }: { dungeon: Dungeon; onClose: () => void }) {
  return (
    <>
      <div className="dp-modal-title">单人挑战 · {dungeon.name}</div>
      <p className="dp-solo-desc">你将独自进入副本。AI 将根据副本设定编写剧情并过渡当前故事。所有奖励归你一人。</p>
      <div className="dp-modal-btns"><button className="dp-confirm-btn" onClick={onClose}>确认进入</button><button className="dp-cancel-btn" onClick={onClose}>取消</button></div>
    </>
  );
}

function TeamInvite({ inviteList, setInviteList, onClose }: { inviteList: string[]; setInviteList: (l: string[]) => void; onClose: () => void }) {
  const contacts = [{ name: '柳白霜', level: 52, class: '炼器师' }, { name: '暗影行者', level: 61, class: '黑客' }, { name: '铁匠王大锤', level: 38, class: '锻造师' }];
  return (
    <>
      <div className="dp-modal-title">邀请组队</div>
      <div className="dp-invite-list">{contacts.map(c => { const sel = inviteList.includes(c.name); return (<button key={c.name} className={`dp-invite-item${sel ? ' dp-invite-item--selected' : ''}`} onClick={() => setInviteList(sel ? inviteList.filter(n => n !== c.name) : [...inviteList, c.name])}><span className="dp-invite-check">{sel ? '☑' : '☐'}</span><span className="dp-invite-name">{c.name}</span><span className="dp-invite-meta">{c.class} · Lv.{c.level}</span></button>); })}</div>
      <div className="dp-modal-btns"><button className="dp-confirm-btn" disabled={inviteList.length === 0} onClick={onClose}>邀请 {inviteList.length > 0 ? `${inviteList.length}人` : ''} 进入</button><button className="dp-cancel-btn" onClick={onClose}>取消</button></div>
    </>
  );
}

function MatchConfirm({ dungeon, onClose }: { dungeon: Dungeon; onClose: () => void }) {
  const [matched] = useState(() => { const names = ['疾风剑豪', '咸鱼翻身', '深渊低语', '摸鱼大师', '暴击拉满', '迷路的新手']; const count = Math.floor(Math.random() * 2) + 2; return Array.from({ length: count }, () => ({ name: names[Math.floor(Math.random() * names.length)], level: Math.floor(Math.random() * 30) + (dungeon.minLevel || 1) })); });
  return (
    <>
      <div className="dp-modal-title">匹配队友 · {dungeon.name}</div>
      <p className="dp-solo-desc">系统匹配了 {matched.length} 名队友。实力随机。进入后AI统一编写剧情。</p>
      <div className="dp-matched-list">{matched.map((m, _i) => (<div key={_i} className="dp-matched-item"><span className="dp-matched-name">{m.name}</span><span className="dp-matched-level font-mono">Lv.{m.level}</span></div>))}</div>
      <div className="dp-modal-btns"><button className="dp-confirm-btn" onClick={onClose}>确认进入</button><button className="dp-cancel-btn" onClick={onClose}>重新匹配</button></div>
    </>
  );
}
