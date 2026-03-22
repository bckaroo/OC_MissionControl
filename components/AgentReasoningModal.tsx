"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ─── Types ─── */
interface ReasoningEntry {
  id: string;
  agentKey: string;
  timestamp: string;
  timestampMs: number;
  thinking: string;
  response: string;
  goal: string;
  context: string;
  strategy: string;
  nextStep: string;
  tokenUsage: { thinking: number; input: number; output: number; total: number };
  isStreaming: boolean;
  messageIndex: number;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  timestampMs: number;
  thinkingPreview: string;
  responsePreview: string;
  tokenUsage: { thinking: number; total: number };
  feedback?: "good" | "wrong";
  hasThinking: boolean;
}

interface FeedbackStats {
  good: number;
  wrong: number;
  total: number;
  qualityScore: number | null;
}

type Tab = "current" | "history" | "quality";

interface AgentReasoningModalProps {
  agentId: string; // URL-encoded agent key
  agentName: string;
  agentEmoji: string;
  isThinking?: boolean;
  onClose: () => void;
}

/* ─── Helpers ─── */
function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* ─── Collapsible Section ─── */
function Section({
  title,
  icon,
  content,
  defaultOpen = true,
  accent = "#7c5af4",
}: {
  title: string;
  icon: string;
  content: string;
  defaultOpen?: boolean;
  accent?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!content) return null;
  return (
    <div style={{ marginBottom: "12px", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "9px 12px",
          background: "var(--bg-tertiary)",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: "14px" }}>{icon}</span>
        <span style={{ fontSize: "12px", fontWeight: "600", color: accent, flex: 1, letterSpacing: "0.05em", textTransform: "uppercase" }}>{title}</span>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}>▼</span>
      </button>
      {open && (
        <div style={{
          padding: "10px 12px",
          background: "var(--bg-primary)",
          fontSize: "12px",
          color: "var(--text-secondary)",
          lineHeight: "1.7",
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
          maxHeight: "200px",
          overflow: "auto",
        }}>
          {content}
        </div>
      )}
    </div>
  );
}

/* ─── Token Badge ─── */
function TokenBadge({ label, value, color }: { label: string; value: number; color: string }) {
  if (!value) return null;
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "6px 10px",
      borderRadius: "6px",
      background: "var(--bg-tertiary)",
      border: "1px solid var(--border)",
      minWidth: "64px",
    }}>
      <span style={{ fontSize: "14px", fontWeight: "700", color }}>{formatTokens(value)}</span>
      <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>{label}</span>
    </div>
  );
}

/* ─── Streaming Pulse ─── */
function StreamingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "8px", marginBottom: "12px" }}>
      <div style={{
        width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6",
        animation: "pulse 1s ease-in-out infinite",
      }} />
      <span style={{ fontSize: "12px", color: "#60a5fa", fontWeight: "500" }}>Agent is currently thinking…</span>
    </div>
  );
}

/* ─── Feedback Buttons ─── */
function FeedbackButtons({
  reasoningId,
  agentId,
  currentFeedback,
  onFeedback,
}: {
  reasoningId: string;
  agentId: string;
  currentFeedback?: "good" | "wrong";
  onFeedback: (id: string, f: "good" | "wrong") => void;
}) {
  const [loading, setLoading] = useState(false);

  const submit = async (f: "good" | "wrong") => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch(`/api/agents/${agentId}/reasoning/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasoningId, feedback: f }),
      });
      onFeedback(reasoningId, f);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Was this good reasoning?</span>
      <button
        onClick={() => submit("good")}
        disabled={loading}
        style={{
          padding: "3px 10px",
          border: "none",
          borderRadius: "5px",
          fontSize: "11px",
          cursor: loading ? "not-allowed" : "pointer",
          background: currentFeedback === "good" ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.1)",
          color: "#22c55e",
          fontWeight: currentFeedback === "good" ? "700" : "400",
          transition: "all 0.15s",
        }}
      >
        👍 Good
      </button>
      <button
        onClick={() => submit("wrong")}
        disabled={loading}
        style={{
          padding: "3px 10px",
          border: "none",
          borderRadius: "5px",
          fontSize: "11px",
          cursor: loading ? "not-allowed" : "pointer",
          background: currentFeedback === "wrong" ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.1)",
          color: "#ef4444",
          fontWeight: currentFeedback === "wrong" ? "700" : "400",
          transition: "all 0.15s",
        }}
      >
        👎 Wrong
      </button>
    </div>
  );
}

/* ─── Main Modal ─── */
export default function AgentReasoningModal({
  agentId,
  agentName,
  agentEmoji,
  isThinking: externalIsThinking,
  onClose,
}: AgentReasoningModalProps) {
  const [tab, setTab] = useState<Tab>("current");
  const [reasoning, setReasoning] = useState<ReasoningEntry[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [isThinking, setIsThinking] = useState(externalIsThinking || false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, "good" | "wrong">>({});
  const [selectedEntry, setSelectedEntry] = useState<ReasoningEntry | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCurrent = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/reasoning?limit=5`);
      const data = await res.json();
      setReasoning(data.reasoning || []);
      setIsThinking(data.isThinking || false);
      if (data.reasoning?.[0] && !selectedEntry) {
        setSelectedEntry(data.reasoning[0]);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [agentId, selectedEntry]);

  const fetchHistory = useCallback(async () => {
    const url = `/api/agents/${agentId}/reasoning/history?limit=30${dateFilter ? `&date=${dateFilter}` : ""}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setHistory(data.history || []);
    } catch {
      /* ignore */
    }
  }, [agentId, dateFilter]);

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/reasoning/feedback`);
      const data = await res.json();
      setFeedbackStats(data.stats || null);
      const map: Record<string, "good" | "wrong"> = {};
      for (const f of (data.feedback || [])) {
        map[f.reasoningId] = f.feedback;
      }
      setFeedback(map);
    } catch {
      /* ignore */
    }
  }, [agentId]);

  useEffect(() => {
    fetchCurrent();
    fetchFeedback();
    // Poll if thinking
    pollRef.current = setInterval(() => {
      fetchCurrent();
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchCurrent, fetchFeedback]);

  useEffect(() => {
    if (tab === "history") fetchHistory();
    if (tab === "quality") fetchFeedback();
  }, [tab, fetchHistory, fetchFeedback]);

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [dateFilter, tab, fetchHistory]);

  const handleFeedback = (id: string, f: "good" | "wrong") => {
    setFeedback(prev => ({ ...prev, [id]: f }));
    fetchFeedback();
  };

  const current = selectedEntry || reasoning[0];

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 60, backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "720px",
          maxWidth: "95vw",
          maxHeight: "85vh",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          zIndex: 61,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <span style={{ fontSize: "24px" }}>{agentEmoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              🧠 {agentName} — Agent Reasoning
              {isThinking && (
                <span style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: "rgba(59,130,246,0.15)",
                  color: "#60a5fa",
                  fontWeight: "500",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}>
                  THINKING…
                </span>
              )}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              Transparency view — see why decisions are made
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg-tertiary)", flexShrink: 0 }}>
          {(["current", "history", "quality"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "10px 18px",
                border: "none",
                borderBottom: tab === t ? "2px solid #7c5af4" : "2px solid transparent",
                background: "transparent",
                color: tab === t ? "#a78bfa" : "var(--text-muted)",
                fontSize: "12px",
                fontWeight: tab === t ? "600" : "400",
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.15s",
              }}
            >
              {t === "current" ? "🔍 Current" : t === "history" ? "📜 History" : "📊 Quality"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>

          {/* ── CURRENT TAB ── */}
          {tab === "current" && (
            <div>
              {loading && (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px", fontSize: "13px" }}>
                  Loading reasoning…
                </div>
              )}

              {!loading && isThinking && <StreamingIndicator />}

              {!loading && reasoning.length === 0 && (
                <div style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  background: "var(--bg-tertiary)",
                  borderRadius: "10px",
                  border: "1px dashed var(--border)",
                }}>
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>🤔</div>
                  <div style={{ fontWeight: "500", marginBottom: "6px" }}>No reasoning captured yet</div>
                  <div style={{ fontSize: "11px" }}>
                    Reasoning is captured from <strong>extended thinking</strong> (claude-3-7-sonnet) model runs.
                    <br />This agent's session may not have thinking enabled, or hasn't run recently.
                  </div>
                </div>
              )}

              {!loading && reasoning.length > 0 && (
                <div style={{ display: "flex", gap: "16px" }}>
                  {/* Entry selector (if multiple) */}
                  {reasoning.length > 1 && (
                    <div style={{ width: "160px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Recent</div>
                      {reasoning.map((r, i) => (
                        <button
                          key={r.id}
                          onClick={() => setSelectedEntry(r)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "6px",
                            background: selectedEntry?.id === r.id ? "rgba(124,90,244,0.15)" : "var(--bg-tertiary)",
                            border: selectedEntry?.id === r.id ? "1px solid rgba(124,90,244,0.4)" : "1px solid var(--border)",
                            color: "var(--text-secondary)",
                            fontSize: "11px",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <div style={{ fontWeight: "500", marginBottom: "3px" }}>#{i + 1} {r.isStreaming ? "🔴 Live" : ""}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: "10px" }}>{timeAgo(r.timestamp)}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Main reasoning view */}
                  {current && (
                    <div style={{ flex: 1 }}>
                      {/* Meta row */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>🕐 {timeAgo(current.timestamp)}</span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <TokenBadge label="thinking" value={current.tokenUsage.thinking} color="#a78bfa" />
                          <TokenBadge label="input" value={current.tokenUsage.input} color="#60a5fa" />
                          <TokenBadge label="output" value={current.tokenUsage.output} color="#34d399" />
                          {current.tokenUsage.total > 0 && (
                            <TokenBadge label="total" value={current.tokenUsage.total} color="var(--text-secondary)" />
                          )}
                        </div>
                      </div>

                      {/* Thinking sections */}
                      {current.isStreaming && <StreamingIndicator />}

                      <Section
                        title="Goal"
                        icon="🎯"
                        content={current.goal}
                        defaultOpen
                        accent="#a78bfa"
                      />
                      <Section
                        title="Context"
                        icon="📋"
                        content={current.context}
                        defaultOpen
                        accent="#60a5fa"
                      />
                      <Section
                        title="Strategy"
                        icon="🗺️"
                        content={current.strategy}
                        defaultOpen
                        accent="#34d399"
                      />
                      <Section
                        title="Next Step"
                        icon="➡️"
                        content={current.nextStep}
                        defaultOpen
                        accent="#f59e0b"
                      />

                      {/* Full thinking toggle */}
                      <details style={{ marginBottom: "12px" }}>
                        <summary style={{ fontSize: "12px", color: "var(--text-muted)", cursor: "pointer", userSelect: "none", padding: "4px 0" }}>
                          🔬 View full raw thinking ({formatTokens(current.tokenUsage.thinking || Math.floor(current.thinking.length / 4))} tokens)
                        </summary>
                        <div style={{
                          marginTop: "8px",
                          padding: "12px",
                          background: "var(--bg-primary)",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          fontFamily: "monospace",
                          lineHeight: "1.7",
                          whiteSpace: "pre-wrap",
                          maxHeight: "300px",
                          overflow: "auto",
                        }}>
                          {current.thinking}
                        </div>
                      </details>

                      {/* Response */}
                      {current.response && (
                        <div style={{ marginBottom: "12px" }}>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Response preview</div>
                          <div style={{
                            padding: "10px 12px",
                            background: "rgba(34,197,94,0.05)",
                            border: "1px solid rgba(34,197,94,0.15)",
                            borderRadius: "6px",
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            lineHeight: "1.6",
                          }}>
                            {current.response}
                          </div>
                        </div>
                      )}

                      {/* Feedback */}
                      <div style={{ paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                        <FeedbackButtons
                          reasoningId={current.id}
                          agentId={agentId}
                          currentFeedback={feedback[current.id]}
                          onFeedback={handleFeedback}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {tab === "history" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Filter by date:</div>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  style={{
                    padding: "5px 10px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-active)",
                    borderRadius: "6px",
                    color: "var(--text-secondary)",
                    fontSize: "12px",
                    outline: "none",
                  }}
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter("")}
                    style={{ padding: "4px 10px", background: "transparent", border: "1px solid var(--border-active)", borderRadius: "5px", color: "var(--text-muted)", fontSize: "11px", cursor: "pointer" }}
                  >
                    Clear
                  </button>
                )}
                <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>{history.length} entries</span>
              </div>

              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "13px" }}>
                  No reasoning history found{dateFilter ? ` for ${dateFilter}` : ""}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {history.map(h => (
                    <div
                      key={h.id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "8px",
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "12px" }}>{h.hasThinking ? "🧠" : "💬"}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{timeAgo(h.timestamp)}</span>
                        {h.tokenUsage.thinking > 0 && (
                          <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "8px", background: "rgba(124,90,244,0.15)", color: "#a78bfa" }}>
                            {formatTokens(h.tokenUsage.thinking)} thinking tokens
                          </span>
                        )}
                        {feedback[h.id] && (
                          <span style={{
                            fontSize: "10px",
                            padding: "2px 7px",
                            borderRadius: "8px",
                            background: feedback[h.id] === "good" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                            color: feedback[h.id] === "good" ? "#22c55e" : "#ef4444",
                          }}>
                            {feedback[h.id] === "good" ? "👍 Good" : "👎 Wrong"}
                          </span>
                        )}
                        <div style={{ flex: 1 }} />
                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                      {h.hasThinking && (
                        <div style={{ fontSize: "11px", color: "#a78bfa", marginBottom: "4px", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          🧠 {h.thinkingPreview}
                        </div>
                      )}
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        💬 {h.responsePreview}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── QUALITY TAB ── */}
          {tab === "quality" && (
            <div>
              {/* Score card */}
              <div style={{
                padding: "20px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(124,90,244,0.1), rgba(59,130,246,0.1))",
                border: "1px solid rgba(124,90,244,0.3)",
                marginBottom: "20px",
                textAlign: "center",
              }}>
                {feedbackStats ? (
                  <>
                    <div style={{ fontSize: "48px", fontWeight: "800", color: feedbackStats.qualityScore === null ? "var(--text-muted)" : feedbackStats.qualityScore >= 70 ? "#22c55e" : feedbackStats.qualityScore >= 40 ? "#f59e0b" : "#ef4444" }}>
                      {feedbackStats.qualityScore === null ? "—" : `${feedbackStats.qualityScore}%`}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Reasoning Quality Score</div>
                    <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "14px" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "20px", fontWeight: "700", color: "#22c55e" }}>{feedbackStats.good}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>👍 Good</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "20px", fontWeight: "700", color: "#ef4444" }}>{feedbackStats.wrong}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>👎 Wrong</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-secondary)" }}>{feedbackStats.total}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Total ratings</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>No quality data yet</div>
                )}
              </div>

              {/* Explanation */}
              <div style={{ padding: "14px", background: "var(--bg-tertiary)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "8px" }}>📌 How quality tracking works</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.7" }}>
                  Each reasoning entry can be rated <strong style={{ color: "#22c55e" }}>👍 Good</strong> or <strong style={{ color: "#ef4444" }}>👎 Wrong</strong> from the Current tab.
                  <br /><br />
                  The quality score is the percentage of "good" ratings. Use this to identify if an agent is reasoning well or making faulty assumptions.
                  <br /><br />
                  Feedback is stored locally in <code style={{ fontSize: "10px", background: "var(--bg-primary)", padding: "1px 5px", borderRadius: "3px" }}>reasoning-feedback.json</code>.
                </div>
              </div>

              {/* Tip */}
              {feedbackStats && feedbackStats.total === 0 && (
                <div style={{ marginTop: "12px", padding: "12px 14px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", fontSize: "12px", color: "#fbbf24" }}>
                  💡 Go to the <strong>Current</strong> tab and rate some reasoning to build your quality baseline.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
