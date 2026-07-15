import { useState, useEffect } from 'react';

// ── global capture store ──

interface CapturedRequest {
  timestamp: number;
  model: string;
  messages: Array<{ role: string; content: string }>;
  totalChars: number;
}

interface CapturedResponse {
  timestamp: number;
  rawText: string;
  parsedTags: Record<string, string>;
  durationMs: number;
  httpStatus?: number;
  error?: string;
}

interface CaptureLog {
  id: number;
  request: CapturedRequest;
  response?: CapturedResponse;
}

let logId = 0;
const listeners = new Set<() => void>();
const logs: CaptureLog[] = [];
const MAX_LOGS = 20;

function notify() { listeners.forEach(fn => fn()); }

export function captureRequest(model: string, messages: Array<{ role: string; content: string }>) {
  const log: CaptureLog = {
    id: ++logId,
    request: {
      timestamp: Date.now(),
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      totalChars: messages.reduce((s, m) => s + m.content.length, 0),
    },
  };
  logs.unshift(log);
  if (logs.length > MAX_LOGS) logs.pop();
  notify();
  return log.id;
}

export function captureResponse(logId: number, rawText: string, parsedTags: Record<string, string>, durationMs: number, httpStatus?: number, error?: string) {
  const log = logs.find(l => l.id === logId);
  if (log) {
    log.response = { timestamp: Date.now(), rawText, parsedTags, durationMs, httpStatus, error };
    notify();
  }
}

// ── Debug Modal (button → popup) ──

export function DebugModal() {
  const [, setTick] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const last = logs[0];
  const selected = logs.find(l => l.id === selectedId) || last;

  return (
    <>
      <button
        className="cp-debug-btn"
        onClick={() => { setOpen(true); setSelectedId(last?.id ?? null); }}
        title="API 调试"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        API调试{last ? ` (${last.request.messages.length}msgs)` : ''}
      </button>

      {open && (
        <div className="dm-overlay" onClick={() => setOpen(false)}>
          <div className="dm-modal" onClick={e => e.stopPropagation()}>
            <div className="dm-header">
              <span>🛠 API 调试监控</span>
              <button className="dm-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="dm-body">
              {logs.length === 0 ? (
                <div className="dm-empty">发送一条消息后，这里会显示完整的 API 请求和响应。</div>
              ) : (
                <>
                  {/* Log selector */}
                  <div className="dm-selector">
                    {logs.map(l => (
                      <button
                        key={l.id}
                        className={`dm-sel-btn ${selected?.id === l.id ? 'dm-sel-btn--active' : ''} ${l.response?.error ? 'dm-sel-btn--err' : ''}`}
                        onClick={() => setSelectedId(l.id)}
                      >
                        {new Date(l.request.timestamp).toLocaleTimeString()}
                        {' '}{l.request.model.slice(0, 20)}
                        {' '}{l.request.messages.length}msgs
                        {l.response ? (l.response.error ? ' ❌' : ' ✅') : ' ⏳'}
                      </button>
                    ))}
                  </div>

                  {selected && (
                    <>
                      {/* Request */}
                      <div className="dm-section">
                        <h4>📤 请求 · {selected.request.model} · {selected.request.messages.length} 条消息 · {selected.request.totalChars.toLocaleString()} chars</h4>
                        {selected.request.messages.map((m, i) => (
                          <div key={i} className={`dm-msg dm-msg--${m.role}`}>
                            <div className="dm-msg-role">{m.role} [{i + 1}/{selected.request.messages.length}]</div>
                            <pre className="dm-msg-content">{m.content.slice(0, 800)}{m.content.length > 800 ? `\n… 还有 ${m.content.length - 800} 字符` : ''}</pre>
                          </div>
                        ))}
                      </div>

                      {/* Response */}
                      {selected.response && (
                        <div className="dm-section">
                          <h4>📥 响应 · {selected.response.durationMs}ms</h4>
                          {selected.response.error ? (
                            <div className="dm-error">{selected.response.error}</div>
                          ) : (
                            <>
                              <div className="dm-tags">
                                {Object.entries(selected.response.parsedTags).filter(([, v]) => v).map(([k, v]) => (
                                  <div key={k} className="dm-tag">
                                    <span className="dm-tag-name">{k}</span>
                                    <pre className="dm-tag-value">{String(v).slice(0, 500)}</pre>
                                  </div>
                                ))}
                              </div>
                              <details className="dm-raw">
                                <summary>原始文本 ({selected.response.rawText.length} chars)</summary>
                                <pre className="dm-raw-text">{selected.response.rawText.slice(0, 2000)}</pre>
                              </details>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── RightPanel full panel (keep for dev slot) ──

export default function DevPanel() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  return (
    <div className="dv-panel">
      <DebugModal />
      <div className="dv-empty" style={{ marginTop: 16 }}>调试面板已移到输入框上方。点按钮查看。</div>
    </div>
  );
}
