import { useState, useEffect } from 'react';
import './DevPanel.css';

// ── global capture store (outside React so it survives re-renders) ──

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

// ── Compact strip for CenterPanel ──

export function DebugStrip() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const [expanded, setExpanded] = useState(false);
  const last = logs[0];

  if (!last) {
    return (
      <div className="ds-strip ds-strip--empty">
        <span className="ds-label">🛠 API 调试</span>
        <span className="ds-hint">发送消息后此处显示请求/响应详情</span>
      </div>
    );
  }

  const req = last.request;
  const res = last.response;

  return (
    <div className={`ds-strip ${res?.error ? 'ds-strip--error' : ''}`}>
      <div className="ds-bar" onClick={() => setExpanded(!expanded)}>
        <span className="ds-label">🛠</span>
        <span className="ds-model">{req.model}</span>
        <span className="ds-stat">{req.messages.length} msgs</span>
        <span className="ds-stat">{req.totalChars.toLocaleString()} chars</span>
        {res ? (
          <span className={`ds-stat ${res.error ? 'ds-stat--err' : 'ds-stat--ok'}`}>
            {res.error ? `❌ ${res.error}` : `✅ ${res.durationMs}ms`}
          </span>
        ) : (
          <span className="ds-stat ds-stat--pending">⏳</span>
        )}
        <span className="ds-expand">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="ds-body">
          <div className="ds-section">
            <h4>📤 请求消息 ({req.messages.length})</h4>
            {req.messages.map((m, i) => (
              <div key={i} className={`ds-msg ds-msg--${m.role}`}>
                <div className="ds-msg-role">{m.role} {i + 1}/{req.messages.length}</div>
                <pre className="ds-msg-content">{m.content.slice(0, 600)}{m.content.length > 600 ? `\n… (${m.content.length - 600} more chars)` : ''}</pre>
              </div>
            ))}
          </div>

          {res && !res.error && (
            <div className="ds-section">
              <h4>📥 响应 · {res.durationMs}ms</h4>
              <div className="ds-tags">
                {Object.entries(res.parsedTags).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="ds-tag">
                    <span className="ds-tag-name">{k}</span>
                    <pre className="ds-tag-value">{String(v).slice(0, 300)}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {res?.error && (
            <div className="ds-error">{res.error}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Full panel component for RightPanel ──

export default function DevPanel() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showRequest, setShowRequest] = useState(true);

  if (logs.length === 0) {
    return <div className="dv-panel"><div className="dv-empty">暂无捕获。发送一条消息后，这里会显示完整的 API 请求和响应。</div></div>;
  }

  return (
    <div className="dv-panel">
      <div className="dv-header">
        <span>API 监控 ({logs.length} 条)</span>
        <label className="dv-check"><input type="checkbox" checked={showRequest} onChange={e => setShowRequest(e.target.checked)} />显示请求</label>
      </div>
      <div className="dv-list">
        {logs.map(log => {
          const isExpanded = expandedId === log.id;
          return (
            <div key={log.id} className={`dv-log ${log.response?.error ? 'dv-log--error' : ''}`}>
              <div className="dv-log-bar" onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                <span className="dv-log-time">{new Date(log.request.timestamp).toLocaleTimeString()}</span>
                <span className="dv-log-model">{log.request.model}</span>
                <span className="dv-log-chars">{log.request.totalChars.toLocaleString()} chars</span>
                <span className="dv-log-msgs">{log.request.messages.length} msgs</span>
                {log.response ? (
                  <span className={`dv-log-status ${log.response.error ? 'dv-log-status--err' : 'dv-log-status--ok'}`}>
                    {log.response.error ? `❌ ${log.response.error}` : `✅ ${log.response.durationMs}ms`}
                  </span>
                ) : (
                  <span className="dv-log-status dv-log-status--pending">⏳ 等待中</span>
                )}
                <span className="dv-log-expand">{isExpanded ? '▲' : '▼'}</span>
              </div>

              {isExpanded && (
                <div className="dv-log-body">
                  {showRequest && (
                    <div className="dv-section">
                      <h4>📤 请求 ({log.request.messages.length} 条消息)</h4>
                      {log.request.messages.map((m, i) => (
                        <div key={i} className={`dv-msg dv-msg--${m.role}`}>
                          <div className="dv-msg-role">{m.role}</div>
                          <pre className="dv-msg-content">{m.content}</pre>
                        </div>
                      ))}
                    </div>
                  )}

                  {log.response && (
                    <div className="dv-section">
                      <h4>📥 响应 · {log.response.durationMs}ms</h4>
                      {log.response.error ? (
                        <div className="dv-error">{log.response.error}</div>
                      ) : (
                        <>
                          <div className="dv-tags">
                            {Object.entries(log.response.parsedTags).filter(([, v]) => v).map(([k, v]) => (
                              <div key={k} className="dv-tag">
                                <span className="dv-tag-name">{k}</span>
                                <pre className="dv-tag-value">{String(v).slice(0, 500)}</pre>
                              </div>
                            ))}
                          </div>
                          <details className="dv-raw">
                            <summary>原始文本 ({log.response.rawText.length} chars)</summary>
                            <pre className="dv-raw-text">{log.response.rawText.slice(0, 2000)}</pre>
                          </details>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
