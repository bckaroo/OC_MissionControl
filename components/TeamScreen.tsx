"use client";

import { useEffect, useState, useCallback } from "react";
import { mockTeam } from "@/lib/mockData";
import { mockMainAgentActivity, mockSubagentActivities } from "@/lib/subagentData";
import AgentReasoningModal from "@/components/AgentReasoningModal";
import SubagentActivityCard from "@/components/SubagentActivityCard";
import MainAgentActivityCard from "@/components/MainAgentActivityCard";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentSession {
  id: string;
  key: string;
  sessionId: string;
  kind: "main" | "subagent" | "slash";
  name: string;
  emoji: string;
  role: string;
  status: "working" | "idle" | "blocked" | "offline";
  model: string;
  updatedAt: number;
  ageMs: number;
  totalTokens: number | null;
  spawnDepth: number;
  spawnedBy: string | null;
  abortedLastRun: boolean;
  currentTask: string | null;
  lastActivity: string;
  sessionFile: string | null;
}

interface LogEntry {
  role: string;
  preview: string;
  index: number;
  timestamp?: string;
}

// ─── Discord Channel Mapping ─────────────────────────────────────────────────

const DISCORD_CHANNELS: Record<string, string> = {
  "1484681426040520871": "📢 general",
  "1484701184831787008": "🦞 openclaw",
  "1485121487844413450": "💃🕺 modelmanagement",
  "1484701256625819658": "🚀 mission-control",
  "1484943704610570441": "💸 accountant",
  "1484988011782602762": "📋 projects",
  "1485129951853154355": "✍️ writing",
  "1484701291857838181": "🏗️ development",
  "1484999016746975423": "🧠 ai-intelligence",
  "1485280226262122536": "🪄 products",
};

function translateSessionName(name: string, key?: string, cronMap?: Record<string, string>): string {
  // If name is already translated (has emoji), return it
  if (name.includes("📢") || name.includes("🦞") || name.includes("💃") || name.includes("🚀") || name.includes("💸") || name.includes("📋") || name.includes("✍️") || name.includes("🏗️") || name.includes("🧠") || name.includes("🪄")) {
    return name;
  }
  
  // Try to extract channel ID from key (format: agent:main:discord:channel:CHANNEL_ID)
  if (key && key.includes("discord:channel:")) {
    const channelId = key.split("discord:channel:")[1]?.split(":")[0]; // Extract just the ID
    if (channelId) {
      if (DISCORD_CHANNELS[channelId]) {
        return DISCORD_CHANNELS[channelId];
      }
      // Unknown channel - show ID for identification
      console.log(`❓ Unknown Discord channel ID: ${channelId}`);
      return `📢 channel:${channelId.slice(0, 8)}...`;
    }
  }
  
  // Try to extract cron job from key (format: agent:main:cron:JOB_ID or agent:main:cron:JOB_ID:HASH)
  if (key && key.includes("cron:")) {
    const cronId = key.split("cron:")[1]?.split(":")[0]; // Extract just the ID
    if (cronId) {
      if (cronMap && cronMap[cronId]) {
        return `⏰ ${cronMap[cronId]}`;
      }
      // Unknown cron job - show ID for identification
      console.log(`❓ Unknown cron job ID: ${cronId}`);
      return `⏰ cron:${cronId.slice(0, 8)}...`;
    }
  }
  
  // Check if name is a Discord channel ID directly
  if (DISCORD_CHANNELS[name]) {
    return DISCORD_CHANNELS[name];
  }
  
  // Unknown session type
  if (name === "unknown" && key) {
    console.log(`❓ Unknown session - key: ${key}`);
  }
  
  // Otherwise return original name
  return name;
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  working: "#3b82f6",
  idle: "#22c55e",
  blocked: "#f97316",
  offline: "#6b7280",
};

const STATUS_LABELS = {
  working: "Working",
  idle: "Idle",
  blocked: "Blocked",
  offline: "Offline",
};

const STATUS_BG = {
  working: "rgba(59,130,246,0.12)",
  idle: "rgba(34,197,94,0.12)",
  blocked: "rgba(249,115,22,0.12)",
  offline: "rgba(107,114,128,0.08)",
};

// ─── Modals ───────────────────────────────────────────────────────────────────

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "24px",
          minWidth: "440px",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "18px" }}
          >✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SendMessageModal({ agent, onClose }: { agent: AgentSession; onClose: () => void }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setResult(data.message || "Sent!");
    } catch {
      setResult("Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal onClose={onClose} title={`💬 Message ${agent.emoji} ${agent.name}`}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Ask the agent to do something..."
        rows={4}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          color: "var(--text-primary)",
          padding: "10px 12px",
          fontSize: "13px",
          resize: "vertical",
          fontFamily: "inherit",
        }}
        onKeyDown={e => { if (e.key === "Enter" && e.metaKey) send(); }}
      />
      {result && (
        <div style={{ marginTop: "10px", fontSize: "12px", color: "#22c55e", padding: "8px 12px", background: "rgba(34,197,94,0.1)", borderRadius: "6px" }}>
          {result}
        </div>
      )}
      <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--border)", background: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#7c5af4", color: "white", cursor: "pointer", fontSize: "13px", opacity: sending ? 0.6 : 1 }}
        >
          {sending ? "Sending…" : "Send ⌘↵"}
        </button>
      </div>
    </Modal>
  );
}

function LogsModal({ agent, onClose }: { agent: AgentSession; onClose: () => void }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/agents/${agent.id}/logs`)
      .then(r => r.json())
      .then(d => { setLogs(d.logs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [agent.id]);

  const roleColor: Record<string, string> = {
    user: "#60a5fa",
    assistant: "#a78bfa",
    tool: "#34d399",
    system: "#f59e0b",
  };

  return (
    <Modal onClose={onClose} title={`📋 Logs — ${agent.emoji} ${agent.name}`}>
      {loading ? (
        <div style={{ color: "var(--text-muted)", fontSize: "13px", padding: "20px 0", textAlign: "center" }}>Loading logs…</div>
      ) : logs.length === 0 ? (
        <div style={{ color: "var(--text-muted)", fontSize: "13px", padding: "20px 0", textAlign: "center" }}>No log entries found</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {logs.map((log, i) => (
            <div key={i} style={{ padding: "8px 10px", background: "var(--bg-tertiary)", borderRadius: "6px", borderLeft: `2px solid ${roleColor[log.role] || "#888"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                <span style={{ fontSize: "10px", fontWeight: "600", color: roleColor[log.role] || "#888", textTransform: "uppercase" }}>{log.role}</span>
                {log.timestamp && <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{new Date(log.timestamp).toLocaleTimeString()}</span>}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {log.preview || <em style={{ color: "var(--text-muted)" }}>[no text content]</em>}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: "12px", fontSize: "11px", color: "var(--text-muted)" }}>
        Session: <span style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>{agent.sessionId.slice(0, 16)}…</span>
      </div>
    </Modal>
  );
}

function AgentDetailsModal({ agent, onClose }: { agent: AgentSession; onClose: () => void }) {
  return (
    <Modal onClose={onClose} title={`${agent.emoji} ${agent.name} — Details`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Row label="Session Key" value={agent.key} mono />
        <Row label="Session ID" value={agent.sessionId} mono />
        <Row label="Kind" value={agent.kind} />
        <Row label="Role" value={agent.role} />
        <Row label="Model" value={agent.model} mono />
        <Row label="Status" value={STATUS_LABELS[agent.status]} color={STATUS_COLORS[agent.status]} />
        <Row label="Last Activity" value={agent.lastActivity} />
        <Row label="Total Tokens" value={agent.totalTokens?.toLocaleString() ?? "—"} />
        <Row label="Spawn Depth" value={String(agent.spawnDepth)} />
        {agent.spawnedBy && <Row label="Spawned By" value={agent.spawnedBy} mono />}
        <Row label="Aborted Last Run" value={agent.abortedLastRun ? "Yes ⚠️" : "No"} color={agent.abortedLastRun ? "#f97316" : undefined} />
        {agent.sessionFile && <Row label="Session File" value={agent.sessionFile.split("\\").pop()!} mono />}
      </div>
    </Modal>
  );
}

function Row({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
      <span style={{ fontSize: "12px", color: "var(--text-muted)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "12px", color: color || "var(--text-secondary)", fontFamily: mono ? "monospace" : "inherit", textAlign: "right", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

// ─── Agent Card ──────────────────────────────────────────────────────────────

function AgentCard({ agent, onMessage, onLogs, onDetails, onControl, onReasoning, isMain }: {
  agent: AgentSession;
  onMessage: () => void;
  onLogs: () => void;
  onDetails: () => void;
  onControl: (action: string) => void;
  onReasoning: () => void;
  isMain?: boolean;
}) {
  const [controlLoading, setControlLoading] = useState<string | null>(null);

  const handleControl = async (action: string) => {
    setControlLoading(action);
    await onControl(action);
    setControlLoading(null);
  };

  const tokenPct = agent.totalTokens && agent.kind === "main"
    ? Math.round((agent.totalTokens / 200000) * 100)
    : null;

  return (
    <div
      style={{
        padding: isMain ? "20px 22px" : "14px 16px",
        borderRadius: "12px",
        background: isMain
          ? "linear-gradient(135deg, rgba(124,90,244,0.08), rgba(59,130,246,0.08))"
          : STATUS_BG[agent.status],
        border: isMain
          ? "1px solid rgba(124,90,244,0.3)"
          : `1px solid ${STATUS_COLORS[agent.status]}33`,
        minWidth: isMain ? "240px" : "200px",
        position: "relative",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Status dot + pulse for working */}
      <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", alignItems: "center", gap: "5px" }}>
        {agent.status === "working" && (
          <span style={{ fontSize: "9px", color: STATUS_COLORS.working, fontWeight: "600", letterSpacing: "0.05em" }}>LIVE</span>
        )}
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: STATUS_COLORS[agent.status],
            boxShadow: agent.status === "working" ? `0 0 8px ${STATUS_COLORS.working}` : undefined,
          }}
        />
      </div>

      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <div style={{ fontSize: isMain ? "32px" : "28px" }}>{agent.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: isMain ? "15px" : "14px", fontWeight: "700", color: "var(--text-primary)", lineHeight: "1.2" }}>
            {agent.name}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
            {agent.role}
          </div>
        </div>
      </div>

      {/* Model badge */}
      <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#a78bfa", background: "rgba(168,85,247,0.15)", padding: "4px 8px", borderRadius: "4px", display: "inline-block", marginBottom: "10px", fontWeight: "600", border: "1px solid rgba(168,85,247,0.3)" }}>
        {agent.model.split("/").pop()?.replace("claude-", "").replace("sonnet-4-6", "sonnet-4.6") || agent.model}
      </div>

      {/* Status + time */}
      <div style={{ fontSize: "11px", color: agent.status === "working" ? "#3b82f6" : "var(--text-muted)", marginBottom: "8px", fontWeight: "600" }}>
        {agent.status === "working" ? `🟢 LIVE` : `Started ${agent.lastActivity}`}
      </div>

      {/* Token bar for main */}
      {tokenPct !== null && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginBottom: "3px" }}>
            <span>Context</span>
            <span>{agent.totalTokens?.toLocaleString()} / 200k</span>
          </div>
          <div style={{ height: "3px", background: "var(--bg-card)", borderRadius: "2px" }}>
            <div style={{ height: "100%", width: `${Math.min(tokenPct, 100)}%`, background: tokenPct > 80 ? "#f97316" : tokenPct > 60 ? "#eab308" : "#7c5af4", borderRadius: "2px" }} />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        <ActionBtn icon="💬" label="Message" onClick={onMessage} color="#7c5af4" />
        <ActionBtn icon="📋" label="Logs" onClick={onLogs} color="#3b82f6" />
        <ActionBtn icon="🧠" label="Reasoning" onClick={onReasoning} color="#a78bfa" />
        <ActionBtn icon="ℹ️" label="Details" onClick={onDetails} />

        {agent.status === "idle" || agent.status === "offline" ? (
          <ActionBtn
            icon={controlLoading === "heartbeat" ? "⏳" : "💓"}
            label="Heartbeat"
            onClick={() => handleControl("heartbeat")}
            color="#22c55e"
            disabled={controlLoading === "heartbeat"}
          />
        ) : null}

        {agent.status === "blocked" ? (
          <ActionBtn
            icon="🔄"
            label="Retry"
            onClick={() => handleControl("restart")}
            color="#f97316"
          />
        ) : null}
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, color, disabled }: {
  icon: string;
  label: string;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={label}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        borderRadius: "5px",
        border: `1px solid ${color ? color + "44" : "var(--border)"}`,
        background: hover ? (color ? color + "22" : "rgba(255,255,255,0.05)") : "transparent",
        color: color || "var(--text-secondary)",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "11px",
        transition: "background 0.15s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeamScreen() {
  const [agents, setAgents] = useState<AgentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [modalState, setModalState] = useState<{
    type: "message" | "logs" | "details" | null;
    agent: AgentSession | null;
  }>({ type: null, agent: null });
  const [reasoningAgent, setReasoningAgent] = useState<AgentSession | null>(null);
  const [controlFeedback, setControlFeedback] = useState<string | null>(null);
  const [cronJobMap, setCronJobMap] = useState<Record<string, string>>({}); // Map cron IDs to names

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.agents) {
        setAgents(data.agents);
        setLastRefresh(new Date());
      }
    } catch (e) {
      console.error("Failed to fetch agents:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch calendar data to build cron job mapping
  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const res = await fetch("/api/calendar");
        const data = await res.json();
        if (data.events && Array.isArray(data.events)) {
          const map: Record<string, string> = {};
          data.events.forEach((event: any) => {
            if (event.id && event.name) {
              map[event.id] = event.name;
            }
          });
          setCronJobMap(map);
        }
      } catch (e) {
        console.error("Failed to fetch calendar:", e);
      }
    };

    fetchCalendar();
    const interval = setInterval(fetchCalendar, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [fetchAgents]);

  const handleControl = async (agent: AgentSession, action: string) => {
    try {
      const res = await fetch(`/api/agents/${agent.id}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setControlFeedback(data.message || `${action} sent`);
      setTimeout(() => setControlFeedback(null), 3000);
      if (action !== "heartbeat") fetchAgents();
    } catch {
      setControlFeedback("Action failed");
      setTimeout(() => setControlFeedback(null), 3000);
    }
  };

  const mainAgent = agents.find(a => a.kind === "main");
  const subAgents = agents.filter(a => a.kind === "subagent").slice(0, 8);
  const slashSessions = agents.filter(a => a.kind === "slash");

  const workingCount = agents.filter(a => a.status === "working").length;
  const idleCount = agents.filter(a => a.status === "idle").length;
  const blockedCount = agents.filter(a => a.status === "blocked").length;

  return (
    <div style={{ height: "100%", overflow: "auto", padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "var(--text-primary)" }}>🤖 Agent Control</h2>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            Live status from OpenClaw sessions · refreshed {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
        <button
          onClick={fetchAgents}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 14px", borderRadius: "8px",
            border: "1px solid var(--border)", background: "var(--bg-tertiary)",
            color: "var(--text-secondary)", cursor: "pointer", fontSize: "12px",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Control feedback toast */}
      {controlFeedback && (
        <div style={{
          marginBottom: "16px", padding: "10px 16px", borderRadius: "8px",
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
          fontSize: "13px", color: "#4ade80",
        }}>
          ✓ {controlFeedback}
        </div>
      )}

      {/* Mission Statement */}
      <div style={{
        padding: "20px 24px", borderRadius: "12px",
        background: "linear-gradient(135deg, rgba(124,90,244,0.12), rgba(59,130,246,0.12))",
        border: "1px solid rgba(124,90,244,0.25)",
        marginBottom: "24px", textAlign: "center",
      }}>
        <div style={{ fontSize: "10px", fontWeight: "600", color: "#a78bfa", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>🎯 Mission</div>
        <p style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: "1.6", margin: "0", fontStyle: "italic", maxWidth: "680px", marginLeft: "auto", marginRight: "auto" }}>
          "{mockTeam.mission}"
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "24px" }}>
        <StatCard label="Total Sessions" value={agents.length.toString()} icon="🤖" color="#7c5af4" />
        <StatCard label="Working" value={workingCount.toString()} icon="⚡" color="#3b82f6" />
        <StatCard label="Idle" value={idleCount.toString()} icon="✓" color="#22c55e" />
        <StatCard label="Blocked" value={blockedCount.toString()} icon="⚠️" color="#f97316" />
        <StatCard label="Offline" value={agents.filter(a => a.status === "offline").length.toString()} icon="💤" color="#6b7280" />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
          <div>Loading agent sessions…</div>
        </div>
      ) : agents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>😶</div>
          <div>No active sessions found</div>
          <div style={{ fontSize: "12px", marginTop: "6px" }}>Sessions appear here when agents are running</div>
        </div>
      ) : (
        <>
          {/* Official Agent Roster */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "28px" }}>
            <div style={{ fontSize: "11px", fontWeight: "500", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
              🎖️ Official Agent Roster
            </div>

            {/* Main Agent */}
            {mainAgent && (
              <AgentCard
                agent={mainAgent}
                isMain
                onMessage={() => setModalState({ type: "message", agent: mainAgent })}
                onLogs={() => setModalState({ type: "logs", agent: mainAgent })}
                onDetails={() => setModalState({ type: "details", agent: mainAgent })}
                onControl={(action) => handleControl(mainAgent, action)}
                onReasoning={() => setReasoningAgent(mainAgent)}
              />
            )}

            {/* Connector */}
            {subAgents.length > 0 && (
              <div style={{ width: "1px", height: "24px", background: "var(--border)" }} />
            )}

            {/* Sub-agents */}
            {subAgents.length > 0 && (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", position: "relative" }}>
                {subAgents.length > 1 && (
                  <div style={{
                    position: "absolute", top: 0,
                    left: "50%", transform: "translateX(-50%)",
                    width: `${Math.min(subAgents.length, 4) * 215}px`,
                    height: "1px", background: "var(--border)",
                  }} />
                )}
                {subAgents.map(agent => (
                  <div key={agent.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: "1px", height: "24px", background: "var(--border)" }} />
                    <AgentCard
                      agent={agent}
                      onMessage={() => setModalState({ type: "message", agent })}
                      onLogs={() => setModalState({ type: "logs", agent })}
                      onDetails={() => setModalState({ type: "details", agent })}
                      onControl={(action) => handleControl(agent, action)}
                      onReasoning={() => setReasoningAgent(agent)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subagents Activity Cards */}
          {subAgents.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                🪳 Subagents
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                {mockSubagentActivities.map((activity) => (
                  <SubagentActivityCard
                    key={activity.agentId}
                    agent={{
                      id: activity.agentId,
                      name: activity.agentName,
                      emoji: activity.agentEmoji,
                      status: activity.status,
                      model: agents.find((a) => a.id === activity.agentId)?.model || "lmstudio/qwen/qwen3-coder-30b",
                      currentTask: activity.currentTask,
                      lastActivity: `${activity.progress}% complete`,
                    }}
                    activity={{
                      project: activity.project,
                      currentTask: activity.currentTask,
                      progress: activity.progress,
                      startTime: activity.startTime,
                      estimatedCompletion: activity.estimatedCompletion,
                      skills: activity.skills,
                    }}
                    onViewDetails={() => {
                      const agent = agents.find((a) => a.id === activity.agentId);
                      if (agent) setModalState({ type: "details", agent });
                    }}
                  />
                ))}
              </div>
            </div>
          )}


          {/* All Sessions — transient Discord/Telegram/Cron sessions */}
          {agents.length > (mainAgent ? 1 : 0) + subAgents.length && (
          <div style={{ marginBottom: "24px", paddingTop: "24px", borderTop: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
              📋 Sessions ({agents.length - (mainAgent ? 1 : 0) - subAgents.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {agents.filter(a => a.kind !== "main" && a.kind !== "subagent").map(agent => (
                <div
                  key={agent.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "10px 14px", borderRadius: "8px",
                    background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)",
                    cursor: "pointer",
                  }}
                  onClick={() => setModalState({ type: "details", agent })}
                >
                  {/* Status dot */}
                  <div style={{
                    width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
                    background: STATUS_COLORS[agent.status],
                    boxShadow: agent.status === "working" ? `0 0 6px ${STATUS_COLORS.working}` : undefined,
                  }} />

                  {/* Emoji + name */}
                  <span style={{ fontSize: "16px" }}>{agent.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>{translateSessionName(agent.name, agent.key, cronJobMap)}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {agent.key}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div style={{
                    fontSize: "10px", fontWeight: "600",
                    color: STATUS_COLORS[agent.status],
                    background: STATUS_BG[agent.status],
                    padding: "2px 8px", borderRadius: "4px",
                    flexShrink: 0,
                  }}>
                    {STATUS_LABELS[agent.status]}
                  </div>

                  {/* Model */}
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace", flexShrink: 0 }}>
                    {agent.model.split("/").pop()?.slice(0, 20)}
                  </div>

                  {/* Last activity */}
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0, minWidth: "70px", textAlign: "right" }}>
                    {agent.lastActivity}
                  </div>

                  {/* Quick actions */}
                  <div style={{ display: "flex", gap: "4px" }} onClick={e => e.stopPropagation()}>
                    <QuickBtn title="Message" icon="💬" onClick={() => setModalState({ type: "message", agent })} />
                    <QuickBtn title="Logs" icon="📋" onClick={() => setModalState({ type: "logs", agent })} />
                    <QuickBtn title="Reasoning" icon="🧠" onClick={() => setReasoningAgent(agent)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Heartbeat quick actions */}
          <div style={{
            padding: "16px 20px", borderRadius: "10px",
            background: "var(--bg-tertiary)", border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "12px" }}>
              ⚡ Quick Actions
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {mainAgent && (
                <QuickActionBtn
                  icon="💓"
                  label="Trigger Heartbeat"
                  desc="Force heartbeat check now"
                  color="#22c55e"
                  onClick={() => handleControl(mainAgent, "heartbeat")}
                />
              )}
              <QuickActionBtn
                icon="🔄"
                label="Refresh Sessions"
                desc="Reload session data"
                color="#3b82f6"
                onClick={fetchAgents}
              />
              {mainAgent && (
                <QuickActionBtn
                  icon="💬"
                  label="Ask XiaoZhu..."
                  desc="Send a one-off command"
                  color="#7c5af4"
                  onClick={() => setModalState({ type: "message", agent: mainAgent })}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {modalState.type === "message" && modalState.agent && (
        <SendMessageModal agent={modalState.agent} onClose={() => setModalState({ type: null, agent: null })} />
      )}
      {modalState.type === "logs" && modalState.agent && (
        <LogsModal agent={modalState.agent} onClose={() => setModalState({ type: null, agent: null })} />
      )}
      {modalState.type === "details" && modalState.agent && (
        <AgentDetailsModal agent={modalState.agent} onClose={() => setModalState({ type: null, agent: null })} />
      )}
      {reasoningAgent && (
        <AgentReasoningModal
          agentId={reasoningAgent.id}
          agentName={reasoningAgent.name}
          agentEmoji={reasoningAgent.emoji}
          isThinking={reasoningAgent.status === "working"}
          onClose={() => setReasoningAgent(null)}
        />
      )}
    </div>
  );
}

function QuickBtn({ icon, title, onClick }: { icon: string; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: "26px", height: "26px", borderRadius: "5px",
        border: "1px solid var(--border)", background: "transparent",
        color: "var(--text-muted)", cursor: "pointer", fontSize: "13px",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {icon}
    </button>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: "10px",
      background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "18px", marginBottom: "4px" }}>{icon}</div>
      <div style={{ fontSize: "22px", fontWeight: "700", color, marginBottom: "3px" }}>{value}</div>
      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

function QuickActionBtn({ icon, label, desc, color, onClick }: {
  icon: string; label: string; desc: string; color: string; onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 16px", borderRadius: "8px",
        border: `1px solid ${color}33`,
        background: hover ? `${color}15` : `${color}08`,
        cursor: "pointer", transition: "background 0.15s",
      }}
    >
      <span style={{ fontSize: "20px" }}>{icon}</span>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: "13px", fontWeight: "500", color }}>{label}</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{desc}</div>
      </div>
    </button>
  );
}
