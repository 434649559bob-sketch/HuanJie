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

export function captureResponse(logId: number, rawText: string, parsedTags: Record<string, string>, durationMs: number, error?: string) {
  const log = logs.find(l => l.id === logId);
  if (log) {
    log.response = { timestamp: Date.now(), rawText, parsedTags, durationMs, error };
    notify();
  }
}

// ── Modal button for CenterPanel ──

export function DebugModal() {
  const [, setTick] = useState(0);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showReq, setShowReq] = useState(true);

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  return (
    <>
      <button className="cp-debug-btn" onClick={() => setOpen(true)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        API调试{logs[0] ? ` (${logs[0].request.messages.length}msgs)` : ''}
      </button>

      {open && (
        <div className="dm-overlay" onClick={() => setOpen(false)}>
          <div className="dm-modal" onClick={e => e.stopPropagation()}>
            <div className="dm-header">
              <span>API 监控 ({logs.length} 条)</span>
              <label className="dm-check"><input type="checkbox" checked={showReq} onChange={e => setShowReq(e.target.checked)} />请求</label>
              <button className="dm-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="dm-body">
              {logs.length === 0 ? (
                <div className="dm-empty">暂无捕获。发送消息后此处显示完整请求和响应。</div>
              ) : (
                logs.map(log => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <div key={log.id} className={`dm-log ${log.response?.error ? 'dm-log--err' : ''}`}>
                      <div className="dm-log-bar" onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                        <span className="dm-log-time">{new Date(log.request.timestamp).toLocaleTimeString()}</span>
                        <span className="dm-log-model">{log.request.model}</span>
                        <span className="dm-log-stat">{log.request.totalChars.toLocaleString()}c</span>
                        <span className="dm-log-stat">{log.request.messages.length}msgs</span>
                        {log.response ? (
                          <span className={`dm-log-stat ${log.response.error ? 'dm-log-stat--err' : 'dm-log-stat--ok'}`}>
                            {log.response.error ? `❌ ${log.response.error}` : `✅ ${log.response.durationMs}ms`}
                          </span>
                        ) : <span className="dm-log-stat dm-log-stat--pending">⏳</span>}
                        <span className="dm-log-expand">{isExpanded ? '▲' : '▼'}</span>
                      </div>

                      {isExpanded && (
                        <div className="dm-log-body">
                          {showReq && (
                            <div className="dm-section">
                              <h4>📤 请求 ({log.request.messages.length} 条消息)</h4>
                              {log.request.messages.map((m, i) => (
                                <div key={i} className={`dm-msg dm-msg--${m.role}`}>
                                  <div className="dm-msg-role">{m.role}</div>
                                  <pre className="dm-msg-content">{m.content}</pre>
                                </div>
                              ))}
                            </div>
                          )}

                          {log.response && (
                            <div className="dm-section">
                              <h4>📥 响应 · {log.response.durationMs}ms</h4>
                              {log.response.error ? (
                                <div className="dm-error">{log.response.error}</div>
                              ) : (
                                <>
                                  <div className="dm-tags">
                                    {Object.entries(log.response.parsedTags).filter(([, v]) => v).map(([k, v]) => (
                                      <div key={k} className="dm-tag">
                                        <span className="dm-tag-name">{k}</span>
                                        <pre className="dm-tag-value">{String(v).slice(0, 500)}</pre>
                                      </div>
                                    ))}
                                  </div>
                                  <details className="dm-raw">
                                    <summary>原始文本 ({log.response.rawText.length} chars)</summary>
                                    <pre className="dm-raw-text">{log.response.rawText.slice(0, 2000)}</pre>
                                  </details>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── RightPanel full panel (alias, now unused but kept for reference) ──
export default function DevPanel() {
  return <DebugModal />;
}
