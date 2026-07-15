import { useState, useRef } from 'react';
import './ContactsPanel.css';

// ── Types ──
interface BodyPart {
  part: string; level: number; maxLevel: number;
  tags: string[]; description: string; usageCount: number;
}
interface SexualPartner { name: string; count: number; }
interface PrivacyInfo {
  measurements: string; fetishes: string[]; isVirgin: boolean;
  sexualPartners: SexualPartner[];
  bodyParts: BodyPart[]; isPregnant: boolean; children: string;
}
interface Contact {
  id: string; name: string; type: 'player' | 'npc'; gender: 'male' | 'female';
  gameAvatarUrl: string; realAvatarUrl: string;
  status: 'online' | 'offline' | 'away'; isPresent: boolean;
  lastMessage?: string; lastTime?: string;
  realName?: string; realAge?: number; title?: string;
  level?: number; gameClass?: string; realOccupation?: string;
  powerLevel?: number; affection?: number; relationship?: string;
  gameDescription?: string; realDescription?: string;
  gameAppearance?: string; realAppearance?: string;
  gamePrivacy?: PrivacyInfo; realPrivacy?: PrivacyInfo;
}
interface ChatMessage { id: number; from: string; text: string; time: string; }

// ── Mock Data ──
const INITIAL_CONTACTS: Contact[] = [
  { id: 'c-1', name: '柳白霜', type: 'player', gender: 'female', gameAvatarUrl: '', realAvatarUrl: '', status: 'online', isPresent: true, lastMessage: '新一批丹药出炉了，来看看？', lastTime: '10分钟前', realName: '陈霜', realAge: 24, title: '首席炼器师', level: 52, gameClass: '炼器师', realOccupation: '材料工程研究生', powerLevel: 9200, affection: 78, relationship: '挚友', gameDescription: '云顶剑阁的首席炼器师，痴迷于锻造与炼丹之术。为人豪爽，对朋友极为慷慨。', realDescription: '现实中是某大学材料工程专业的研究生，性格开朗但有点社恐。在游戏里反而比现实中更放得开。', gameAppearance: '一袭白衣赛雪，长发以玉簪束于脑后。面容清冷精致，但一笑起来整个人都暖了。双手因常年炼器而布满了细小的灼痕。', realAppearance: '戴着圆框眼镜的知性美人，平时不施粉黛。身高168cm，身材匀称偏瘦。总是穿着实验室的白大褂，头发随意扎成低马尾。', gamePrivacy: { measurements: '86-58-88', fetishes: ['强制', '露出', '道具'], isVirgin: false, sexualPartners: [{ name: '你', count: 47 }, { name: '匿名锻造师', count: 3 }], bodyParts: [{ part: '乳房', level: 3, maxLevel: 10, tags: ['敏感', 'C杯'], description: '形状优美的鸽乳，乳首呈淡粉色，极为敏感，轻轻触碰便会挺立。', usageCount: 23 }, { part: '阴道', level: 4, maxLevel: 10, tags: ['名器·九曲回廊', '多汁'], description: '天生名器，内壁层层叠叠如迷宫般曲折。每次进入都能感受到极致的紧致包裹，深处的吸力让人难以自持。', usageCount: 47 }, { part: '后庭', level: 1, maxLevel: 10, tags: ['未开发', '紧致'], description: '尚未被开发过的处女地，紧致异常。她对此处极为羞涩。', usageCount: 0 }, { part: '嘴唇与舌头', level: 3, maxLevel: 10, tags: ['灵巧', '深喉训练中'], description: '舌头灵活柔软，经过一定训练，能完成基本深喉。', usageCount: 15 }], isPregnant: false, children: '无' }, realPrivacy: { measurements: '85-57-87', fetishes: ['轻度BDSM', '被支配'], isVirgin: true, sexualPartners: [], bodyParts: [{ part: '乳房', level: 0, maxLevel: 10, tags: ['B杯', '未开发'], description: '从未被他人触碰过的少女乳房，形状坚挺。', usageCount: 0 }, { part: '阴道', level: 0, maxLevel: 10, tags: ['处女', '未开发'], description: '未经人事，处女膜完整。', usageCount: 0 }, { part: '后庭', level: 0, maxLevel: 10, tags: ['未开发'], description: '从未被使用。', usageCount: 0 }], isPregnant: false, children: '无' } },
  { id: 'c-2', name: '铁匠王大锤', type: 'player', gender: 'male', gameAvatarUrl: '', realAvatarUrl: '', status: 'offline', isPresent: false, lastMessage: '你要的玄铁护手做好了', lastTime: '2小时前', realName: '王铁柱', realAge: 35, title: '锻造大师', level: 38, gameClass: '锻造师', realOccupation: '汽修厂老板', powerLevel: 5600, affection: 45, relationship: '交易伙伴', gameDescription: '废土世界的一名铁匠，手艺精湛但脾气暴躁。', realDescription: '现实中是汽修厂老板，离异，有一个上小学的儿子。', gameAppearance: '虎背熊腰的光头大汉，满脸络腮胡。', realAppearance: '微胖的中年男人，发际线堪忧。', gamePrivacy: { measurements: '110-90-105', fetishes: [], isVirgin: false, sexualPartners: [{ name: '前妻', count: 200 }], bodyParts: [{ part: '阴茎', level: 6, maxLevel: 10, tags: ['粗大', '持久'], description: '与其体型相称的巨根，持久力惊人。', usageCount: 200 }], isPregnant: false, children: '无' }, realPrivacy: { measurements: '108-88-103', fetishes: [], isVirgin: false, sexualPartners: [{ name: '前妻', count: 300 }], bodyParts: [], isPregnant: false, children: '一子（8岁）' } },
  { id: 'c-4', name: '玄矶子', type: 'npc', gender: 'male', gameAvatarUrl: '', realAvatarUrl: '', status: 'online', isPresent: true, title: '掌剑长老', level: 87, gameClass: '剑仙', powerLevel: 52000, affection: 85, relationship: '师尊', gameDescription: '云顶剑阁掌剑长老，活了三百年的剑仙。', realDescription: '无现实存在。', gameAppearance: '鹤发童颜，一袭青衫，背负长剑。', realAppearance: '无现实形态。', gamePrivacy: { measurements: '不适用', fetishes: ['禁欲'], isVirgin: true, sexualPartners: [], bodyParts: [], isPregnant: false, children: '无' } },
  { id: 'c-5', name: '林小霜', type: 'npc', gender: 'female', gameAvatarUrl: '', realAvatarUrl: '', status: 'online', isPresent: true, title: '内门弟子', level: 35, gameClass: '法修', powerLevel: 4100, affection: 60, relationship: '师妹', gameDescription: '你的同门师妹，活泼开朗，修炼天赋极高但总是偷懒。', gameAppearance: '娇小玲珑的少女，圆脸上永远挂着笑容。', gamePrivacy: { measurements: '78-54-80', fetishes: ['好奇'], isVirgin: true, sexualPartners: [], bodyParts: [{ part: '乳房', level: 0, maxLevel: 10, tags: ['A杯', '未发育'], description: '尚在发育中的青涩果实，小巧可爱。', usageCount: 0 }, { part: '阴道', level: 0, maxLevel: 10, tags: ['处女', '天生白虎'], description: '天生无毛，粉嫩紧致，从未被造访过的秘境。', usageCount: 0 }], isPregnant: false, children: '无' } },
  { id: 'c-6', name: '血玫瑰', type: 'npc', gender: 'female', gameAvatarUrl: '', realAvatarUrl: '', status: 'online', isPresent: true, title: '流浪剑客', level: 61, gameClass: '剑修', powerLevel: 15000, affection: 35, relationship: '萍水相逢', gameDescription: '一名神秘的女性剑客，身世成谜。怀有身孕却依然四处漂泊，据说在寻找孩子的父亲。', gameAppearance: '一袭暗红长裙勾勒出丰腴的身形，腹部明显隆起。面容妩媚却不失英气，眼神中带着淡淡的忧郁。腰间悬挂一柄细剑，剑鞘上刻满了古老的符文。', gamePrivacy: { measurements: '94-62-92', fetishes: ['支配', '野外'], isVirgin: false, sexualPartners: [{ name: '未知男子', count: 1 }], bodyParts: [{ part: '乳房', level: 5, maxLevel: 10, tags: ['D杯', '涨奶', '敏感'], description: '因孕期而异常丰满的双乳，乳晕变大变深，轻轻挤压便有乳汁渗出。极为敏感，触碰时她会发出压抑的呻吟。', usageCount: 8 }, { part: '阴道', level: 3, maxLevel: 10, tags: ['多汁', '孕期'], description: '因怀孕而更加紧致敏感，爱液丰沛。她对此处仍然充满渴望，尽管身怀六甲。', usageCount: 12 }], isPregnant: true, children: '腹中一子（约六月身孕）' } },
];

const MOCK_CHATS: Record<string, ChatMessage[]> = {
  'c-1': [{ id: 1, from: '柳白霜', text: '新一批丹药出炉了，来看看？', time: '10:15' }, { id: 2, from: '你', text: '太好了，正需要。', time: '10:16' }, { id: 3, from: '柳白霜', text: '带点灵纹线过来，我这不够了。', time: '10:17' }],
  'c-4': [{ id: 1, from: '玄矶子', text: '你的剑意通明已臻化境。', time: '09:00' }, { id: 2, from: '你', text: '弟子明白。', time: '09:02' }],
};

// ── Helpers ──
type ViewMode = 'list' | 'chat' | 'detail';
function sDot(s: string) { return <span className="ct-dot" style={{ background: s === 'online' ? 'var(--success)' : s === 'away' ? 'var(--warning)' : 'var(--text-muted)' }} />; }
function sText(s: string) { return s === 'online' ? '在线' : s === 'away' ? '离开' : '离线'; }

// ── Component ──
export default function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [view, setView] = useState<ViewMode>('list');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState(MOCK_CHATS);
  const [avatarMode, setAvatarMode] = useState<'game' | 'real'>('game');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ contactId: string; slot: 'game' | 'real' } | null>(null);

  const activeContact = contacts.find(c => c.id === activeId) || null;
  const players = contacts.filter(c => c.type === 'player');
  const npcs = contacts.filter(c => c.type === 'npc');
  const avatar = (c: Contact) => avatarMode === 'game' ? c.gameAvatarUrl : c.realAvatarUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/') || !uploadTarget) return;
    const reader = new FileReader();
    reader.onload = () => {
      setContacts(prev => prev.map(c => c.id === uploadTarget.contactId ? { ...c, [`${uploadTarget.slot}AvatarUrl`]: reader.result as string } : c));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerUpload = (contactId: string, slot: 'game' | 'real') => {
    setUploadTarget({ contactId, slot });
    fileRef.current?.click();
  };

  const openChat = (c: Contact) => { setActiveId(c.id); setView('chat'); };
  const backToList = () => { setActiveId(null); setChatInput(''); setView('list'); };
  const sendMessage = () => {
    if (!chatInput.trim() || !activeContact) return;
    const msg: ChatMessage = { id: Date.now(), from: '你', text: chatInput.trim(), time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => ({ ...prev, [activeContact.id]: [...(prev[activeContact.id] || []), msg] }));
    setChatInput('');
  };

  // ═══════════════ LIST ═══════════════
  if (view === 'list') {
    return (
      <div className="ct-panel">
        <div className="ct-list-header"><span className="ct-list-title">联系人</span><button className="ct-avatar-mode-btn" onClick={() => setAvatarMode(m => m === 'game' ? 'real' : 'game')} title="切换头像显示">{avatarMode === 'game' ? '🎮' : '🏠'}</button></div>
        <div className="ct-search"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input className="ct-search-input" placeholder="搜索联系人…" /></div>
        <div className="ct-section-label">玩家 ({players.length})</div>
        {players.map(c => (
          <button key={c.id} className="ct-contact" onClick={() => openChat(c)}>
            <div className="ct-contact-avatar">{avatar(c) ? <img src={avatar(c)} alt="" /> : <div className="ct-avatar-placeholder">{c.name[0]}</div>}<span className="ct-dot-abs">{sDot(c.status)}</span></div>
            <div className="ct-contact-info"><div className="ct-contact-top"><span className="ct-contact-name">{c.name}</span><span className="ct-contact-time">{c.lastTime}</span></div><div className="ct-contact-sub">{c.isPresent ? <span className="ct-badge-present">在场</span> : <span className="ct-badge-absent">不在场</span>}<span>{sText(c.status)}</span></div>{c.lastMessage && <div className="ct-contact-msg">{c.lastMessage}</div>}</div>
          </button>
        ))}
        <div className="ct-section-label">NPC ({npcs.length})</div>
        {npcs.map(c => (
          <button key={c.id} className="ct-contact" onClick={() => openChat(c)}>
            <div className="ct-contact-avatar">{avatar(c) ? <img src={avatar(c)} alt="" /> : <div className="ct-avatar-placeholder">{c.name[0]}</div>}<span className="ct-dot-abs">{sDot(c.status)}</span></div>
            <div className="ct-contact-info"><div className="ct-contact-top"><span className="ct-contact-name">{c.name}</span><span className="ct-contact-relation">{c.relationship}</span></div><div className="ct-contact-sub">{c.isPresent ? <span className="ct-badge-present">在场</span> : <span className="ct-badge-absent">不在场</span>}<span>{c.title}</span></div></div>
          </button>
        ))}
      </div>
    );
  }

  // ═══════════════ CHAT ═══════════════
  if (view === 'chat' && activeContact) {
    const c = activeContact; const msgs = chatMessages[c.id] || []; const av = avatar(c);
    return (
      <div className="ct-panel ct-panel--chat">
        <div className="ct-chat-header">
          <button className="ct-back-btn" onClick={backToList} aria-label="返回列表"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15,18 9,12 15,6"/></svg></button>
          <div className="ct-chat-avatar-mini">{av ? <img src={av} alt="" /> : <div className="ct-avatar-placeholder">{c.name[0]}</div>}</div>
          <div className="ct-chat-header-info"><span className="ct-chat-header-name">{c.name}</span><span className="ct-chat-header-status">{sDot(c.status)} {sText(c.status)} · {c.isPresent ? '在场' : '不在场'}</span></div>
          <button className="ct-avatar-mode-btn" onClick={() => setAvatarMode(m => m === 'game' ? 'real' : 'game')} title="切换头像显示">{avatarMode === 'game' ? '🎮' : '🏠'}</button>
          <button className="ct-menu-btn" onClick={() => setView('detail')} aria-label="查看详情"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
        </div>
        <div className="ct-chat-msgs">{msgs.length === 0 ? <div className="ct-chat-empty">暂无消息</div> : msgs.map(m => (<div key={m.id} className={`ct-msg${m.from === '你' ? ' ct-msg--self' : ''}`}>{m.from !== '你' && <span className="ct-msg-sender">{m.from}</span>}<div className="ct-msg-bubble">{m.text}</div><span className="ct-msg-time">{m.time}</span></div>))}</div>
        <div className="ct-chat-input-row"><input className="ct-chat-input" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }} placeholder="输入消息…" /><button className="ct-chat-send" onClick={sendMessage} disabled={!chatInput.trim()} aria-label="发送"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg></button></div>
      </div>
    );
  }

  // ═══════════════ DETAIL ═══════════════
  if (view === 'detail' && activeContact) {
    const c = activeContact;
    return (
      <div className="ct-panel ct-panel--detail">
        <input ref={fileRef} type="file" accept="image/*" className="ct-hidden-input" onChange={handleFileChange} />
        <div className="ct-detail-header">
          <button className="ct-back-btn" onClick={() => setView('chat')} aria-label="返回聊天"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15,18 9,12 15,6"/></svg></button>
          <span className="ct-detail-title">角色详情</span>
          <button className="ct-avatar-upload-btn" onClick={() => triggerUpload(c.id, 'game')} title="上传游戏头像">🎮</button>
          {c.type === 'player' && <button className="ct-avatar-upload-btn" onClick={() => triggerUpload(c.id, 'real')} title="上传现实头像">🏠</button>}
        </div>
        <div className="ct-detail-body">
          <div className="ct-detail-avatars">
            <div className="ct-detail-avatar-col">
              <div className="ct-detail-avatar">{c.gameAvatarUrl ? <img src={c.gameAvatarUrl} alt="" /> : <div className="ct-detail-avatar-placeholder">{c.name[0]}</div>}</div>
              <span className="ct-avatar-col-label">游戏</span>
            </div>
            {c.type === 'player' && (
              <div className="ct-detail-avatar-col">
                <div className="ct-detail-avatar">{c.realAvatarUrl ? <img src={c.realAvatarUrl} alt="" /> : <div className="ct-detail-avatar-placeholder">{c.realName?.[0] || c.name[0]}</div>}</div>
                <span className="ct-avatar-col-label">现实</span>
              </div>
            )}
          </div>
          <div className="ct-detail-names">
            <span className="ct-detail-game-name">
              {c.name}
              <span className={`ct-gender-badge ct-gender--${c.gender}`}>{c.gender === 'male' ? '♂' : '♀'}</span>
            </span>
            {c.realName && <span className="ct-detail-real-name">{c.realName}</span>}
          </div>
          <div className="ct-detail-meta">{c.title && <span className="ct-detail-title-badge">{c.title}</span>}<span>{c.gameClass} · {c.realOccupation}</span>{c.level && <span className="font-mono">Lv.{c.level}</span>}{c.powerLevel != null && <span className="font-mono">战力 {c.powerLevel.toLocaleString()}</span>}{c.realAge && <span>年龄 {c.realAge}</span>}</div>
          <div className="ct-detail-status">{sDot(c.status)}<span>{sText(c.status)}</span><span className="ct-detail-sep">·</span><span>{c.isPresent ? '在场' : '不在场'}</span></div>
          <div className="ct-detail-section">
            <div className="ct-detail-section-row">
              <span className="ct-detail-section-label">好感度</span>
              <div className="ct-affection-bar">
                <div className="ct-affection-fill" style={{ width: `${c.affection || 0}%` }}/>
              </div>
              <span className="font-mono ct-affection-val">{c.affection}/100</span>
            </div>
            {c.relationship && (
              <div className="ct-detail-section-row">
                <span className="ct-detail-section-label">关系</span>
                <span className="ct-detail-section-value">{c.relationship}</span>
              </div>
            )}
          </div>
          <div className="ct-dual">
            <div className="ct-detail-section"><span className="ct-detail-section-label">游戏描述</span><p className="ct-detail-desc">{c.gameDescription || '无'}</p></div>
            <div className="ct-detail-section"><span className="ct-detail-section-label">现实描述</span><p className="ct-detail-desc">{c.realDescription || '无'}</p></div>
          </div>
          <div className="ct-dual">
            <div className="ct-detail-section"><span className="ct-detail-section-label">游戏外貌</span><p className="ct-detail-desc">{c.gameAppearance || '无'}</p></div>
            <div className="ct-detail-section"><span className="ct-detail-section-label">现实外貌</span><p className="ct-detail-desc">{c.realAppearance || '无'}</p></div>
          </div>
          <PrivacyBlock gamePriv={c.gamePrivacy} realPriv={c.realPrivacy} />
        </div>
      </div>
    );
  }

  return null;
}

// ── Privacy Block ──
function PrivacyBlock({ gamePriv, realPriv }: { gamePriv?: PrivacyInfo; realPriv?: PrivacyInfo }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'game' | 'real'>('game');
  const priv = tab === 'game' ? gamePriv : realPriv;
  const hasGame = !!gamePriv; const hasReal = !!realPriv;
  if (!hasGame && !hasReal) return null;

  return (
    <div className="ct-detail-section ct-detail-section--nsfw">
      <button className="ct-nsfw-toggle" onClick={() => setOpen(p => !p)}>
        <span>隐私信息</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : '', transition: 'transform .2s' }}><polyline points="6,9 12,15 18,9"/></svg>
      </button>
      {open && priv && (
        <div className="ct-privacy-body">
          <div className="ct-privacy-tabs">
            <button className={`ct-privacy-tab${tab === 'game' ? ' ct-privacy-tab--active' : ''}`} onClick={() => setTab('game')}>游戏</button>
            <button className={`ct-privacy-tab${tab === 'real' ? ' ct-privacy-tab--active' : ''}${!hasReal ? ' ct-privacy-tab--disabled' : ''}`} onClick={() => hasReal && setTab('real')} disabled={!hasReal}>现实</button>
          </div>
          <div className="ct-privacy-slots">
            <div className="ct-priv-slot"><span className="ct-priv-slot-label">三围</span><span className="ct-priv-slot-value">{priv.measurements}</span></div>
            <div className="ct-priv-slot"><span className="ct-priv-slot-label">性癖</span><span className="ct-priv-slot-value">{priv.fetishes.length > 0 ? priv.fetishes.join('、') : '无'}</span></div>
            <div className="ct-priv-slot"><span className="ct-priv-slot-label">状态</span><span className="ct-priv-slot-value">{priv.isVirgin ? '处子' : '非处子'}</span></div>
            <div className="ct-priv-slot"><span className="ct-priv-slot-label">性伴侣</span><span className="ct-priv-slot-value">{priv.sexualPartners.length > 0 ? priv.sexualPartners.map(p => `${p.name}(${p.count}次)`).join('、') : '无'}</span></div>
            <div className="ct-priv-slot"><span className="ct-priv-slot-label">妊娠</span><span className="ct-priv-slot-value">{priv.isPregnant ? '妊娠中' : '无'}</span></div>
            <div className="ct-priv-slot"><span className="ct-priv-slot-label">子嗣</span><span className="ct-priv-slot-value">{priv.children}</span></div>
          </div>
          {priv.bodyParts.length > 0 && (
            <div className="ct-body-parts">
              <span className="ct-priv-slot-label">部位开发</span>
              {priv.bodyParts.map((bp, i) => (
                <div key={i} className="ct-body-part">
                  <div className="ct-bp-header"><span className="ct-bp-name">{bp.part}</span><span className="ct-bp-tags">{bp.tags.join(' · ')}</span><span className="ct-bp-usage font-mono">×{bp.usageCount}</span></div>
                  <div className="ct-bp-bar"><div className="ct-bp-fill" style={{ width: `${bp.maxLevel > 0 ? (bp.level / bp.maxLevel) * 100 : 0}%` }}/></div>
                  <span className="ct-bp-level font-mono">Lv.{bp.level}/{bp.maxLevel}</span>
                  <p className="ct-bp-desc">{bp.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
