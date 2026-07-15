import { useState, useRef, useEffect, useCallback } from 'react';
import type { ActionEntry } from '../../App';
import { useToast } from '../ui/ToastProvider';
import './CenterPanel.css';

/* Mock story content for prototyping */
const MOCK_STORY: Array<{ type: 'narration' | 'dialogue' | 'action' | 'system'; speaker?: string; text: string }> = [
  { type: 'narration', text: '昆仑墟第三层，云顶剑阁。' },
  { type: 'narration', text: '晨雾如纱，缠绕在万仞绝壁之间。剑阁的青石广场上，数十名弟子正在演练剑招，剑气破空之声不绝于耳。' },
  { type: 'dialogue', speaker: '掌剑长老·玄矶子', text: '「夜煞，你的剑意已到了瓶颈。再这般苦练，也是事倍功半。」' },
  { type: 'narration', text: '玄矶子负手立于你面前，白须在晨风中微微飘动。他的目光穿透力极强，仿佛能看穿你体内每一缕灵力的流转。' },
  { type: 'system', text: '【系统提示】玄矶子向你发起了「剑心试炼」任务。' },
  { type: 'action', text: '你收起霜月剑，剑身入鞘时发出一声清越的嗡鸣。' },
  { type: 'dialogue', speaker: '你', text: '「请教师尊，如何突破？」' },
  { type: 'dialogue', speaker: '掌剑长老·玄矶子', text: '「下山。去人间走一遭。真正的剑意，不在山巅，在红尘。」' },
  { type: 'narration', text: '他的话音落下时，你注意到广场边缘的石碑上，那行刻字似乎比昨日更加鲜红了一些——「两界之壁，日渐薄弱」。' },
];

interface CenterPanelProps {
  isInGame: boolean;
  actionLog: ActionEntry[];
  onClearActionLog: () => void;
}

export default function CenterPanel({ isInGame, actionLog, onClearActionLog }: CenterPanelProps) {
  const [input, setInput] = useState('');
  const [injectionPreview, setInjectionPreview] = useState<string | null>(null);
  const storyEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Build injection preview including action log
    let preview = `→ 发送至 AI：\n  当前世界：${isInGame ? '游戏世界' : '现实世界'}\n  玩家输入：「${trimmed}」`;
    if (actionLog.length > 0) {
      preview += `\n  前端操作 (${actionLog.length}项)：`;
      for (const a of actionLog) {
        preview += `\n    · ${a.summary}`;
      }
    }

    setInjectionPreview(preview);
    addToast('指令已发送', 'success');
    setInput('');
    onClearActionLog();

    // Auto-dismiss preview
    setTimeout(() => setInjectionPreview(null), 5000);
  }, [input, isInGame, actionLog, addToast, onClearActionLog]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleActionClick = useCallback((action: string) => {
    setInput(action);
    inputRef.current?.focus();
  }, []);

  return (
    <main className="center-panel">
      {/* Story Content */}
      <section className="cp-story" aria-label="游戏正文">
        {/* World context indicator */}
        <div className={`cp-context${isInGame ? ' cp-context--game' : ' cp-context--real'}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="12" r="4"/>
          </svg>
          <span>{isInGame ? '游戏世界' : '现实世界'}</span>
        </div>
        <div className="cp-story-inner">
          {MOCK_STORY.map((block, i) => (
            <div key={i} className={`cp-block cp-block--${block.type}`}>
              {block.speaker && (
                <span className="cp-speaker">{block.speaker}</span>
              )}
              <p className="cp-text">{block.text}</p>
            </div>
          ))}
          <div ref={storyEndRef} />
        </div>

        {/* Scroll fade gradient */}
        <div className="cp-story-fade" />
      </section>

      {/* Bottom Area: Action Log + Injection Preview + Input */}
      <section className="cp-input-area">
        {/* Action Log — persistent preview of what will be sent */}
        <div className={`cp-action-log${actionLog.length > 0 ? ' cp-action-log--has-actions' : ''}`}>
          <div className="cp-action-log-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9,18 15,12 9,6" />
            </svg>
            <span>操作记录</span>
            <span className="cp-action-log-count">{actionLog.length} 项</span>
            {actionLog.length > 0 && (
              <button className="cp-action-log-clear" onClick={onClearActionLog} title="清空记录">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
          {actionLog.length > 0 ? (
            <div className="cp-action-log-list">
              {actionLog.map(a => (
                <div key={a.id} className="cp-action-log-item">{a.summary}</div>
              ))}
              <div className="cp-action-log-hint">以上操作将随你的指令一起发送给 AI</div>
            </div>
          ) : (
            <div className="cp-action-log-empty">暂无操作。你在前端上的行为（使用道具、更换装备等）会记录在这里。</div>
          )}
        </div>

        {/* Injection Preview — shows only after sending */}
        <div className={`cp-injection${injectionPreview ? ' cp-injection--visible' : ''}`}>
          <div className="cp-injection-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span>注入预览</span>
            <button className="cp-injection-close" onClick={() => setInjectionPreview(null)} aria-label="关闭注入预览">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <pre className="cp-injection-body font-mono">{injectionPreview}</pre>
        </div>

        {/* Quick Actions */}
        <div className="cp-quick-actions">
          {['查看周围', '打开背包', '使用技能', '休息恢复'].map(action => (
            <button
              key={action}
              className="cp-quick-btn"
              onClick={() => handleActionClick(action)}
            >
              {action}
            </button>
          ))}
        </div>

        {/* Input Row */}
        <div className="cp-input-row">
          <textarea
            ref={inputRef}
            className="cp-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入指令或对话…（Enter 发送，Shift+Enter 换行）"
            rows={2}
            aria-label="输入指令"
          />
          <button
            className="cp-send-btn"
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="发送"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22,2 15,22 11,13 2,9" />
            </svg>
          </button>
        </div>
      </section>
    </main>
  );
}
