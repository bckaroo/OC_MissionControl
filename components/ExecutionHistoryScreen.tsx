"use client";

import { useState, useEffect, useMemo } from "react";

export type ActionType = "file-change" | "api-call" | "task-execution" | "agent-spawn" | "agent-stop" | "web-search" | "tool-use" | "memory-write" | "command" | "heartbeat" | "skill-run";
export type ExecutionStatus = "success" | "failure" | "in-progress" | "cancelled" | "pending";

export interface ExecutionEntry {
  id: string;
  timestamp: string;
  actionType: ActionType;
  agent: string;
  status: ExecutionStatus;
  description: string;
  durationMs: number | null;
  tokensUsed: number;
  details: Record<string, any>;
}

const ACTION_TYPE_CONFIG: Record<ActionType, { label: string; color: string; icon: string }> = {
  "file-change":    { label: "File Change",     color: "#3b82f6", icon: "📄" },
  "api-call":       { label: "API Call",         color: "#8b5cf6", icon: "🌐" },
  "task-execution": { label: "Task",             color: "#f59e0b", icon: "⚙️" },
  "agent-spawn":    { label: "Agent Spawn",      color: "#06b6d4", icon: "🤖" },
  "agent-stop":     { label: "Agent Stop",       color: "#6b7280", icon: "🛑" },
  "web-search":     { label: "Web Search",       color: "#10b981", icon: "🔍" },
  "tool-use":       { label: "Tool Use",         color: "#f97316", icon: "🔧" },
  "memory-write":   { label: "Memory Write",     color: "#ec4899", icon: "💾" },
  "command":        { label: "Command",          color: "#84cc16", icon: "💻" },
  "heartbeat":      { label: "Heartbeat",        color: "#14b8a6", icon: "💓" },
  "skill-run":      { label: "Skill Run",        color: "#a78bfa", icon: "🎯" },
};

const STATUS_CONFIG: Record<ExecutionStatus, { label: string; color: string; bg: string }> = {
  "success":     { label: "Success",     color: "#22c55e", bg: "rgba(34,197,94,0.12)"  },
  "failure":     { label: "Failed",      color: "#ef4444", bg: "rgba(239,68,68,0.12)"  },
  "in-progress": { label: "In Progress", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  "cancelled":   { label: "Cancelled",   color: "#6b7280", bg: "rgba(107,114,128,0.12)"},
  "pending":     { label: "Pending",     color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
};

function fmtDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function fmtTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }: { status: ExecutionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      fontSize: "11px", fontWeight: "600", padding: "2px 8px",
      borderRadius: "999px", color: cfg.color, background: cfg.bg,
      display: "inline-flex", alignItems: "center", gap: "4px",
      whiteSpace: "nowrap",
    }}>
      {status === "in-progress" && (
        <span style={{ display: "inline-block", width: "6px", height: "6px",
          borderRadius: "50%", background: cfg.color,
          animation: "pulse 1.5s ease-in-out infinite" }} />
      )}
      {cfg.label}
    </span>
  );
}

function ActionTypeBadge({ type }: { type: ActionType }) {
  const cfg = ACTION_TYPE_CONFIG[type];
  return (
    <span style={{
      fontSize: "10px", fontWeight: "500", padding: "1px 6px",
      borderRadius: "4px", color: cfg.color,
      background: cfg.color + "18",
      display: "inline-flex", alignItems: "center", gap: "3px",
      whiteSpace: "nowrap",
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function ExecutionRow({
  entry,
  onSelect,
  isSelected,
}: {
  entry: ExecutionEntry;
  onSelect: (e: ExecutionEntry) => void;
  isSelected: boolean;
}) {
  const cfg = ACTION_TYPE_CONFIG[entry.actionType];
  return (
    <div
      onClick={() => onSelect(entry)}
      style={{
        display: "grid",
        gridTemplateColumns: "20px 1fr auto auto auto",
        gap: "12px",
        alignItems: "center",
        padding: "10px 16px",
        cursor: "pointer",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: isSelected ? "rgba(124,58,237,0.1)" : "transparent",
        borderLeft: isSelected ? "2px solid #7c3aed" : "2px solid transparent",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <span style={{ fontSize: "14px", textAlign: "center" }}>{cfg.icon}</span>

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: "13px", fontWeight: "500", color: "var(--text-primary)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {entry.description}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{entry.agent}</span>
          <ActionTypeBadge type={entry.actionType} />
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>·</span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{entry.tokensUsed.toLocaleString()} tokens</span>
        </div>
      </div>

      <div style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "right", minWidth: "80px" }}>
        {fmtDuration(entry.durationMs)}
      </div>

      <div style={{ minWidth: "120px", textAlign: "right" }}>
        <StatusBadge status={entry.status} />
      </div>

      <div style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "right", minWidth: "100px" }}>
        {timeAgo(entry.timestamp)}
      </div>
    </div>
  );
}

function DetailPanel({
  entry,
  onClose,
}: {
  entry: ExecutionEntry;
  onClose: () => void;
}) {
  return (
    <div style={{
      width: "400px",
      borderLeft: "1px solid rgba(255,255,255,0.1)",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-secondary)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
          Execution Details
        </h3>
        <button
          onClick={onClose}
          style={{
            border: "none", background: "transparent", cursor: "pointer",
            fontSize: "16px", color: "var(--text-muted)", padding: "0",
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px", fontSize: "12px" }}>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "4px" }}>
            AGENT
          </div>
          <div style={{ color: "var(--text-primary)", fontWeight: "500" }}>{entry.agent}</div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "4px" }}>
            ACTION
          </div>
          <ActionTypeBadge type={entry.actionType} />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "4px" }}>
            STATUS
          </div>
          <StatusBadge status={entry.status} />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "4px" }}>
            DURATION
          </div>
          <div style={{ color: "var(--text-secondary)" }}>{fmtDuration(entry.durationMs)}</div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "4px" }}>
            TOKENS
          </div>
          <div style={{ color: "var(--text-secondary)" }}>{entry.tokensUsed.toLocaleString()}</div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "4px" }}>
            TIMESTAMP
          </div>
          <div style={{ color: "var(--text-secondary)" }}>{fmtTimestamp(entry.timestamp)}</div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "4px" }}>
            DESCRIPTION
          </div>
          <div style={{ color: "var(--text-secondary)" }}>{entry.description}</div>
        </div>

        {entry.details && Object.keys(entry.details).length > 0 && (
          <div>
            <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "8px" }}>
              DETAILS
            </div>
            <pre style={{
              background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "4px",
              overflow: "auto", fontSize: "10px", color: "var(--text-secondary)",
              margin: 0, fontFamily: "monospace", whiteSpace: "pre-wrap",
            }}>
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExecutionHistoryScreen() {
  const [entries, setEntries] = useState<ExecutionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<ExecutionEntry | null>(null);
  const [search, setSearch] = useState("");
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterStatus, setFilterStatus] = useState<ExecutionStatus | "all">("all");
  const [filterAction, setFilterAction] = useState<ActionType | "all">("all");

  // Fetch from real API every 5 seconds
  useEffect(() => {
    const fetchAuditTrail = async () => {
      try {
        const params = new URLSearchParams();
        if (filterAgent && filterAgent !== "all") params.append("agent", filterAgent);
        if (filterStatus && filterStatus !== "all") params.append("status", filterStatus);
        if (filterAction && filterAction !== "all") params.append("action", filterAction);
        params.append("limit", "200");

        const res = await fetch(`/api/audit-trail?${params.toString()}`);
        const data = await res.json();
        setEntries(data.entries || []);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch audit trail:", error);
        setLoading(false);
      }
    };

    fetchAuditTrail();
    const interval = setInterval(fetchAuditTrail, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, [filterAgent, filterStatus, filterAction]);

  const filtered = useMemo(() => {
    let result = entries;

    if (search.toLowerCase()) {
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(search.toLowerCase()) ||
          e.agent.toLowerCase().includes(search.toLowerCase())
      );
    }

    return result;
  }, [entries, search]);

  const stats = useMemo(() => ({
    total: entries.length,
    success: entries.filter((e) => e.status === "success").length,
    failed: entries.filter((e) => e.status === "failure").length,
    inProgress: entries.filter((e) => e.status === "in-progress").length,
  }), [entries]);

  const agents = useMemo(() => {
    const unique = new Set(entries.map((e) => e.agent));
    return ["all", ...Array.from(unique).sort()];
  }, [entries]);

  const actions = useMemo(() => {
    const unique = new Set(entries.map((e) => e.actionType));
    return ["all", ...Array.from(unique).sort()];
  }, [entries]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-primary)",
      }}>
        <div style={{ marginBottom: "16px" }}>
          <h1 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
            📋 Audit Trail
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
            Real-time execution history of all agent actions
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "24px", marginBottom: "16px" }}>
          {[
            { label: "Total", value: stats.total, color: "var(--text-primary)" },
            { label: "Success", value: stats.success, color: "#22c55e" },
            { label: "Failed", value: stats.failed, color: "#ef4444" },
            { label: "Live", value: stats.inProgress, color: "#3b82f6" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "18px", fontWeight: "700", color: s.color, lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)",
              color: "var(--text-muted)", fontSize: "13px", pointerEvents: "none" }}>🔍</span>
            <input
              type="text"
              placeholder="Search actions, agents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "7px 10px 7px 32px", borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.06)", color: "var(--text-primary)",
                fontSize: "12px", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            style={{
              padding: "7px 10px", borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)", color: "var(--text-primary)",
              fontSize: "12px", cursor: "pointer",
            }}
          >
            {agents.map((a) => (
              <option key={a} value={a} style={{ background: "#1e1e2e" }}>
                {a === "all" ? "All Agents" : a}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ExecutionStatus | "all")}
            style={{
              padding: "7px 10px", borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)", color: "var(--text-primary)",
              fontSize: "12px", cursor: "pointer",
            }}
          >
            <option value="all" style={{ background: "#1e1e2e" }}>All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k} style={{ background: "#1e1e2e" }}>{v.label}</option>
            ))}
          </select>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value as ActionType | "all")}
            style={{
              padding: "7px 10px", borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)", color: "var(--text-primary)",
              fontSize: "12px", cursor: "pointer",
            }}
          >
            <option value="all" style={{ background: "#1e1e2e" }}>All Types</option>
            {actions.map((a) => {
              const cfg = ACTION_TYPE_CONFIG[a as ActionType];
              return (
                <option key={a} value={a} style={{ background: "#1e1e2e" }}>
                  {cfg ? `${cfg.icon} ${cfg.label}` : a}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
          {/* Column headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "20px 1fr auto auto auto",
            gap: "12px",
            padding: "8px 16px",
            background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}>
            <div />
            <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Action</div>
            <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Duration</div>
            <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>Status</div>
            <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", textAlign: "right" }}>When</div>
          </div>

          {loading ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
              Loading audit trail…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</div>
              <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>No executions match your filters</div>
            </div>
          ) : (
            filtered.map((entry) => (
              <ExecutionRow
                key={entry.id}
                entry={entry}
                onSelect={setSelectedEntry}
                isSelected={selectedEntry?.id === entry.id}
              />
            ))
          )}

          <div style={{ padding: "12px 16px", fontSize: "11px", color: "var(--text-muted)", textAlign: "center" }}>
            Showing {filtered.length} of {entries.length} executions
          </div>
        </div>

        {selectedEntry && (
          <DetailPanel
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
          />
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
