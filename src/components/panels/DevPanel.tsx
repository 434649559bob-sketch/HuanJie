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

  // Lock body scroll when modal opens
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const el = (
    <>
      <button className="cp-debug-btn" onClick={() => { console.log('debug open'); setOpen(true); }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        {(window as any).__DISABLE_REGEX__ ? '🔴RE' : 'API调试'}
      </button>

      {open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9999, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setOpen(false)}>
          <div style={{
            width: 'min(780px, 95vw)', maxHeight: '85vh',
            background: 'var(--surface-1, #0e0e16)', border: '1px solid var(--border-default, #2a2a40)',
            borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 16px', background: 'var(--surface-2, #14141f)',
              borderBottom: '1px solid var(--border-subtle, #1e1e30)',
              fontWeight: 600, fontSize: 14,
            }}>
              <span>API 监控 ({logs.length} 条)</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 400, color: '#9aa0b0', cursor: 'pointer' }}>
                <input type="checkbox" checked={showReq} onChange={e => setShowReq(e.target.checked)} />请求
              </label>
              <button onClick={() => setOpen(false)} style={{
                marginLeft: 'auto', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: '1px solid transparent', borderRadius: 4,
                color: '#9aa0b0', cursor: 'pointer', fontSize: 16,
              }}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
              {logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#9aa0b0', fontSize: 13 }}>暂无捕获。发送消息后此处显示完整请求和响应。</div>
              ) : (
                logs.map(log => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <div key={log.id} style={{
                      border: `1px solid ${log.response?.error ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle, #1e1e30)'}`,
                      borderRadius: 4, marginBottom: 8, overflow: 'hidden',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', cursor: 'pointer',
                        background: 'var(--surface-2, #14141f)', fontSize: 12, userSelect: 'none',
                      }} onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                        <span style={{ color: '#9aa0b0', fontFamily: 'monospace', fontSize: 11 }}>{new Date(log.request.timestamp).toLocaleTimeString()}</span>
                        <span style={{ color: '#00d4ff', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.request.model}</span>
                        <span style={{ color: '#9aa0b0', fontSize: 11 }}>{log.request.totalChars.toLocaleString()}c</span>
                        <span style={{ color: '#9aa0b0', fontSize: 11 }}>{log.request.messages.length}msgs</span>
                        {log.response ? (
                          <span style={{ fontSize: 11, fontWeight: 500, color: log.response.error ? '#ef4444' : '#10b981' }}>
                            {log.response.error ? `❌ ${log.response.error}` : `✅ ${log.response.durationMs}ms`}
                          </span>
                        ) : <span style={{ fontSize: 11, color: '#f59e0b' }}>⏳</span>}
                        <span style={{ color: '#9aa0b0', fontSize: 11 }}>{isExpanded ? '▲' : '▼'}</span>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: 12, background: 'var(--surface-0, #08080d)', borderTop: '1px solid var(--border-subtle, #1e1e30)' }}>
                          {showReq && (
                            <div style={{ marginBottom: 16 }}>
                              <h4 style={{ fontSize: 12, fontWeight: 600, color: '#9aa0b0', margin: '0 0 8px' }}>📤 请求 ({log.request.messages.length} 条消息)</h4>
                              {log.request.messages.map((m, i) => (
                                <div key={i} style={{ marginBottom: 8, borderRadius: 4, overflow: 'hidden' }}>
                                  <div style={{
                                    padding: '2px 8px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                                    background: m.role === 'system' ? 'rgba(139,92,246,0.15)' : m.role === 'user' ? 'rgba(0,212,255,0.1)' : 'rgba(16,185,129,0.1)',
                                    color: m.role === 'system' ? '#a78bfa' : m.role === 'user' ? '#00d4ff' : '#10b981',
                                  }}>{m.role}</div>
                                  <pre style={{
                                    padding: 8, margin: 0, fontFamily: 'monospace', fontSize: 10, lineHeight: 1.5,
                                    color: '#9aa0b0', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                    maxHeight: 250, overflow: 'auto', background: 'var(--surface-1, #0e0e16)',
                                  }}>{m.content}</pre>
                                </div>
                              ))}
                            </div>
                          )}

                          {log.response && (
                            <div>
                              <h4 style={{ fontSize: 12, fontWeight: 600, color: '#9aa0b0', margin: '0 0 8px' }}>📥 响应 · {log.response.durationMs}ms</h4>
                              {log.response.error ? (
                                <div style={{ padding: 8, fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.05)', borderRadius: 4 }}>{log.response.error}</div>
                              ) : (
                                <>
                                  {Object.entries(log.response.parsedTags).filter(([, v]) => v).map(([k, v]) => (
                                    <div key={k} style={{ marginBottom: 8, border: '1px solid var(--border-subtle, #1e1e30)', borderRadius: 4, overflow: 'hidden' }}>
                                      <div style={{ padding: '2px 8px', fontSize: 10, fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>{k}</div>
                                      <pre style={{ padding: 8, margin: 0, fontSize: 10, color: '#9aa0b0', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}>{String(v).slice(0, 500)}</pre>
                                    </div>
                                  ))}
                                  <details style={{ marginTop: 8 }}>
                                    <summary style={{ fontSize: 12, color: '#9aa0b0', cursor: 'pointer' }}>原始文本 ({log.response.rawText.length} chars)</summary>
                                    <pre style={{ marginTop: 4, padding: 8, fontSize: 10, color: '#9aa0b0', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto', background: 'var(--surface-1, #0e0e16)', borderRadius: 4 }}>{log.response.rawText.slice(0, 2000)}</pre>
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

  return el;
}

export default function DevPanel() {
  return <DebugModal />;
}
