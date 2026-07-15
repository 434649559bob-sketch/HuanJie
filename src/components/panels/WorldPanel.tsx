import { useState } from 'react';
import './WorldPanel.css';

interface ZoneCharacter { name: string; role: string; }
interface Encounter { name: string; description: string; rarity: 'common' | 'uncommon' | 'rare' | 'legendary'; }
interface ZoneData { id: string; name: string; worldName: string; description: string; rumors: string[]; characters: ZoneCharacter[]; encounters: Encounter[]; dangerLevel: number; }

const ZONES: ZoneData[] = [
  {
    id: 'z-1', name: '云顶剑阁', worldName: '昆仑墟',
    description: '昆仑墟第三层的核心区域，坐落于万仞绝壁之上。青石广场终年被云雾环绕，剑阁弟子在此习剑修炼。广场中央是一块千年寒玉碑，上面刻满了历代剑仙的剑诀心得。剑阁四周有炼器堂、丹药房、藏经阁等附属建筑，是修仙者在昆仑墟的主要据点。',
    rumors: ['最近剑冢深处传来异动，似乎是剑灵残影在酝酿什么', '有人说在炼器堂的废料堆里捡到了一块完整的凤凰羽毛', '掌剑长老玄矶子最近频繁出入藏经阁，好像在找什么古籍', '听说有弟子在广场上练剑时，剑招突然自行变化，威力大增'],
    characters: [{ name: '玄矶子', role: '掌剑长老' }, { name: '柳白霜', role: '首席炼器师' }, { name: '林小霜', role: '内门弟子' }],
    encounters: [{ name: '剑心试炼', description: '玄矶子发起的心境考验，通过后可大幅提升剑法熟练度', rarity: 'rare' }, { name: '炼器委托', description: '柳白霜需要材料，帮她收集可换取装备强化服务', rarity: 'uncommon' }, { name: '晨练偶悟', description: '观摩弟子晨练时突然顿悟，获得随机技能熟练度', rarity: 'common' }],
    dangerLevel: 10,
  },
  {
    id: 'z-2', name: '剑冢', worldName: '昆仑墟',
    description: '云顶剑阁后山的一片荒芜之地，埋葬着历代陨落的剑仙。墓碑如林，剑气未散。越是深入，残留的剑意越浓，修为不足者会被剑意所伤。最深处据说封印着一位走火入魔的大剑修——剑灵残影。',
    rumors: ['剑灵残影最近的活动频率增加了，似乎在寻找什么东西', '有人在剑冢捡到了一柄断剑，上面刻着已经失传的剑诀', '深夜经过剑冢时，能听到若有若无的叹息声', '据说剑冢最深处还有一座未被发现的古墓'],
    characters: [{ name: '剑灵残影', role: 'BOSS' }],
    encounters: [{ name: '剑灵之战', description: '挑战剑灵残影，击败后可获得稀有装备和剑魂碎片', rarity: 'legendary' }, { name: '残剑认主', description: '一柄断裂的古剑突然对你产生共鸣，获得可修复的远古武器', rarity: 'rare' }, { name: '剑气风暴', description: '被残留的剑气卷入，撑过去可提升剑法抗性', rarity: 'uncommon' }],
    dangerLevel: 65,
  },
  {
    id: 'z-3', name: '灵蚕洞', worldName: '昆仑墟',
    description: '昆仑墟山腹中的天然溶洞，栖息着大量灵蚕。洞内光线昏暗，石壁上布满了灵蚕吐出的发光丝线。灵蚕丝是制作高级防具的珍贵材料，但洞内的灵蚕王极具攻击性。',
    rumors: ['最近灵蚕王的吐丝量突然大增，可能是要进化了', '有采丝人在洞穴深处发现了一个从未见过的岔路', '灵蚕丝的价格最近涨了三倍，铁匠王大锤在大量收购'],
    characters: [],
    encounters: [{ name: '灵蚕王讨伐', description: '与灵蚕王战斗，胜利可获得大量灵蚕丝和稀有材料', rarity: 'uncommon' }, { name: '隐秘矿脉', description: '偶然发现一处玄铁矿脉，可以采集矿石', rarity: 'common' }],
    dangerLevel: 25,
  },
  {
    id: 'z-4', name: '古战场', worldName: '昆仑墟',
    description: '一片被遗忘的远古战场，地面上散落着锈蚀的兵器和破碎的盔甲。千年前的一场大战在这里留下了深深的伤痕，亡灵和怨念至今未能消散。阴气极重，不适合久留。',
    rumors: ['古战场深处出现了将军亡魂，似乎在寻找他的佩刀', '有人在战场边缘挖出了一件完整的古代盔甲', '每逢月圆之夜，战场上会出现幽灵军队的幻影'],
    characters: [],
    encounters: [{ name: '将军亡魂', description: '挑战古代将军的亡魂，击败后可获得稀有武器「破军」', rarity: 'rare' }, { name: '古物发掘', description: '在战场遗迹中发现了一件古代装备', rarity: 'uncommon' }, { name: '亡魂袭击', description: '被游荡的亡魂围攻，需要战斗突围', rarity: 'common' }],
    dangerLevel: 40,
  },
  {
    id: 'z-5', name: '废土·钢铁城', worldName: '废土',
    description: '废土世界最大的幸存者据点，由废弃的工业区改造而成。高耸的烟囱和生锈的钢架构成了城市的天际线。这里鱼龙混杂，从商人到拾荒者，从雇佣兵到变异人，什么人都能在这里找到。唯一的法则是：强者生存。',
    rumors: ['铁匠王大锤最近接了一个神秘大单，据说是给某个帮派打造武器', '城外出现了新的变异生物巢穴，赏金猎人正组队前往', '钢铁城的城主据说在暗中收集战前科技'],
    characters: [{ name: '铁匠王大锤', role: '锻造大师' }, { name: '废土商人', role: '流浪商人' }],
    encounters: [{ name: '帮派火并', description: '被卷入两个帮派的冲突，选择站队获得对应势力的好感', rarity: 'uncommon' }, { name: '黑市交易', description: '发现一个地下黑市，可能买到稀有物品', rarity: 'rare' }, { name: '变异兽袭击', description: '城市防御被变异兽突破，参与防守获得战斗经验', rarity: 'common' }],
    dangerLevel: 50,
  },
  {
    id: 'z-6', name: '赛博城·黑市区', worldName: '赛博朋克',
    description: '赛博城的地下区域，霓虹灯和全息广告照亮了永远不见天日的街道。这里是法外之地，义体医生、黑客、情报贩子在此交易。空气中弥漫着合成香料和臭氧的味道，每一条小巷都可能通向一个完全不同的世界。',
    rumors: ['暗影行者据说在策划一次大型黑客行动，目标不明', '黑市最近流出了一批军用级义体，价格比平时便宜一半', '有人在黑市区的废弃地铁站里看到了不应该存在的东西'],
    characters: [{ name: '暗影行者', role: '黑客' }],
    encounters: [{ name: '义体升级', description: '遇到一位技术高超的义体医生，可以安装一件稀有义体', rarity: 'rare' }, { name: '数据窃取', description: '接到一个黑客任务，成功后获得大量金钱和信息', rarity: 'uncommon' }, { name: '街头遭遇', description: '在巷子里遇到几个不怀好意的混混', rarity: 'common' }],
    dangerLevel: 35,
  },
];

const RARITY_COLORS: Record<string, string> = { common: 'var(--rarity-common)', uncommon: 'var(--rarity-uncommon)', rare: 'var(--rarity-rare)', legendary: 'var(--rarity-legendary)' };
const RARITY_LABELS: Record<string, string> = { common: '普通', uncommon: '精良', rare: '稀有', legendary: '传说' };

export default function WorldPanel() {
  const [selected, setSelected] = useState<ZoneData | null>(ZONES[0] || null);

  return (
    <div className="wp-panel">
      {/* Zone list */}
      <div className="wp-list">
        {ZONES.map(z => (
          <button key={z.id} className={`wp-zone${selected?.id === z.id ? ' wp-zone--active' : ''}`}
            onClick={() => setSelected(z)}>
            <div className="wp-zone-name">{z.name}</div>
            <div className="wp-zone-meta">
              <span className="wp-zone-world">{z.worldName}</span>
              <span className="wp-zone-danger font-mono" style={{ color: z.dangerLevel >= 50 ? 'var(--danger)' : z.dangerLevel >= 25 ? 'var(--warning)' : 'var(--success)' }}>
                危险度 {z.dangerLevel}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Detail */}
      {selected && (
        <div className="wp-detail">
          {/* Image placeholder */}
          <div className="wp-image">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            <span>{selected.name}</span>
          </div>

          {/* Description */}
          <p className="wp-desc">{selected.description}</p>

          {/* Rumors */}
          <div className="wp-section">
            <div className="wp-section-title">流言</div>
            {selected.rumors.map((r, i) => (
              <div key={i} className="wp-rumor">· {r}</div>
            ))}
          </div>

          {/* Characters */}
          {selected.characters.length > 0 && (
            <div className="wp-section">
              <div className="wp-section-title">常驻角色</div>
              <div className="wp-chars">
                {selected.characters.map(ch => (
                  <span key={ch.name} className="wp-char">{ch.name}<span className="wp-char-role">{ch.role}</span></span>
                ))}
              </div>
            </div>
          )}

          {/* Encounters */}
          {selected.encounters.length > 0 && (
            <div className="wp-section">
              <div className="wp-section-title">奇遇</div>
              {selected.encounters.map((e, i) => (
                <div key={i} className="wp-encounter">
                  <span className="wp-encounter-rarity" style={{ color: RARITY_COLORS[e.rarity] }}>[{RARITY_LABELS[e.rarity]}]</span>
                  <span className="wp-encounter-name">{e.name}</span>
                  <span className="wp-encounter-desc">{e.description}</span>
                </div>
              ))}
            </div>
          )}

          <div className="wp-ai-note">流言和奇遇由 AI 每几轮对话刷新一次。玩家抵达新地点时 AI 自动记录并生成区域信息。</div>
        </div>
      )}
    </div>
  );
}
