import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { ActionEntry } from '../../App';
import { useToast } from '../ui/ToastProvider';
import { useSillytavern } from '../../hooks/useSillytavern';
import { runMacroPipeline } from '../../sillytavern/variable-macros';
import { buildDefsMap } from '../../sillytavern/variable-engine';
import { getVariableManager } from '../../sillytavern/database';
import { applyRegexes, collectRegexes } from '../../sillytavern/regex-engine';
import type { VarDefinition } from '../../sillytavern/variable-types';
import { DebugModal } from './DevPanel';
import './CenterPanel.css';

/* Mock story for initial empty state */
const MOCK_STORY: Array<{ type: 'narration' | 'dialogue' | 'action' | 'system'; speaker?: string; text: string }> = [
  { type: 'narration', text: '昆仑墟第三层，云顶剑阁。' },
  { type: 'narration', text: '晨雾如纱，缠绕在万仞绝壁之间。剑阁的青石广场上，数十名弟子正在演练剑招，剑气破空之声不绝于耳。' },
  { type: 'dialogue', speaker: '掌剑长老·玄矶子', text: '「夜煞，你的剑意已到了瓶颈。再这般苦练，也是事倍功半。」' },
  { type: 'narration', text: '玄矶子负手立于你面前，白须在晨风中微微飘动。他的目光穿透力极强，仿佛能看穿你体内每一缕灵力的流转。' },
];

interface CenterPanelProps {
  isInGame: boolean;
  actionLog: ActionEntry[];
  onClearActionLog: () => void;
}

export default function CenterPanel({ isInGame, actionLog, onClearActionLog }: CenterPanelProps) {
  const [input, setInput] = useState('');
  const storyEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { addToast } = useToast();
  const [defsMap, setDefsMap] = useState<Map<string, VarDefinition>>(new Map());

  // Tavern hook
  const st = useSillytavern();

  // Load variable definitions for macro display
  useEffect(() => {
    getVariableManager().then(m => {
      if (m) setDefsMap(buildDefsMap(m));
    });
  }, []);

  // Auto-create chat if none active
  useEffect(() => {
    if (!st.initialized) return;
    if (!st.activeChat) {
      st.createChat('新冒险').catch(() => {});
    }
  }, [st.initialized, st.activeChat, st.createChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [st.activeChat?.messages.length]);

  // Build display messages: only user + assistant, skip system
  const displayMessages = useMemo(() => {
    const msgs = st.activeChat?.messages ?? [];
    return msgs.filter(m => m.role === 'user' || m.role === 'assistant');
  }, [st.activeChat?.messages]);

  const hasRealMessages = displayMessages.length > 0;

  // Send
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || st.streamState.isStreaming) return;

    setInput('');
    onClearActionLog();

    // Build context prefix from action log
    let sendText = trimmed;
    if (actionLog.length > 0) {
      const actions = actionLog.map(a => `· ${a.summary}`).join('\n');
      sendText = `[玩家操作]\n${actions}\n\n[玩家输入]\n${trimmed}`;
    }

    try {
      await st.sendGameMessage(sendText);
    } catch (e) {
      addToast(`发送失败: ${(e as Error).message}`, 'error');
    }
  }, [input, st, actionLog, addToast, onClearActionLog]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Render a single message
  const renderMessage = (msg: (typeof displayMessages)[number]) => {
    const isUser = msg.role === 'user';
    const rawMaintext = isUser ? msg.content : (msg.parsed?.maintext || msg.content);
    const options = msg.parsed?.options ?? [];
    const thinking = msg.parsed?.thinking ?? '';

    // Step 1: Variable macro replacement on plain text
    const vars = st.activeChat?.variables ?? {};
    const replacedText = runMacroPipeline(rawMaintext, vars, defsMap).text;

    // Step 2: Apply display-side regexes (may produce HTML)
    // Check if user disabled regex via localStorage flag
    const regexDisabled = (window as any).__DISABLE_REGEX__;
    const allRegexes = regexDisabled ? [] : collectRegexes(st.settings?.globalRegexes ?? [], st.activePreset?.regexes ?? []);
    const displayHtml = applyRegexes(allRegexes, replacedText, 'display');

    return (
      <div key={msg.id} className={`cp-message${isUser ? ' cp-message--user' : ' cp-message--assistant'}`}>
        {isUser ? (
          <div className="cp-block cp-block--action">
            <p className="cp-text">{displayHtml}</p>
          </div>
        ) : (
          <>
            {thinking && st.settings?.thinkingDisplay !== 'hide' && (
              <details className="cp-thinking" open={st.settings?.thinkingDisplay === 'inline'}>
                <summary className="cp-thinking-summary">思考过程</summary>
                <p className="cp-thinking-text">{thinking}</p>
              </details>
            )}
            <div className="cp-block cp-block--narration">
              <div className="cp-text" dangerouslySetInnerHTML={{ __html: displayHtml }} />
            </div>
            {options.length > 0 && (
              <div className="cp-options">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    className="cp-option-btn"
                    onClick={() => {
                      setInput(opt);
                      inputRef.current?.focus();
                    }}
                    disabled={st.streamState.isStreaming}
                  >
                    [{i + 1}] {opt}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <main className="center-panel">
      {/* Story Content */}
      <section className="cp-story" aria-label="游戏正文">
        <div className={`cp-context${isInGame ? ' cp-context--game' : ' cp-context--real'}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="12" r="4"/>
          </svg>
          <span>{isInGame ? '游戏世界' : '现实世界'}</span>
          {st.streamState.isStreaming && <span className="cp-streaming-dot" />}
        </div>
        <div className="cp-story-inner">
          {!hasRealMessages ? (
            MOCK_STORY.map((block, i) => (
              <div key={i} className={`cp-block cp-block--${block.type}`}>
                {block.speaker && <span className="cp-speaker">{block.speaker}</span>}
                <p className="cp-text">{block.text}</p>
              </div>
            ))
          ) : (
            displayMessages.map(renderMessage)
          )}
          {st.streamState.isStreaming && (
            <div className="cp-block cp-block--system">
              <p className="cp-text">生成中<span className="cp-streaming-dots">…</span></p>
            </div>
          )}
          <div ref={storyEndRef} />
        </div>

        {/* If chat is empty, show a hint */}
        {!hasRealMessages && !st.streamState.isStreaming && st.initialized && (
          <div className="cp-empty-hint">
            输入指令开始冒险。API 需先在右侧「设置」中配置。
          </div>
        )}

        <div className="cp-story-fade" />
      </section>

      {/* Bottom Area */}
      <section className="cp-input-area">
        <DebugModal />

        {/* Action Log */}
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

        {/* Function Buttons */}
        <div className="cp-quick-actions">
          <button
            className="cp-quick-btn cp-quick-btn--fn"
            onClick={() => st.regenerateLast()}
            disabled={st.streamState.isStreaming || displayMessages.length < 2}
            title="删除上一轮AI回复，用同样的输入重新生成"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            重新生成
          </button>
          <button
            className="cp-quick-btn cp-quick-btn--fn"
            onClick={async () => { await st.createChat('新冒险'); }}
            disabled={st.streamState.isStreaming}
            title="创建新的对话会话"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            新对话
          </button>
        </div>

        {/* Input Row */}
        <div className="cp-input-row">
          <textarea
            ref={inputRef}
            className="cp-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={st.streamState.isStreaming ? 'AI 正在生成…' : '输入指令或对话…（Enter 发送，Shift+Enter 换行）'}
            rows={2}
            disabled={st.streamState.isStreaming}
            aria-label="输入指令"
          />
          <button
            className="cp-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || st.streamState.isStreaming}
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
