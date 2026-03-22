"use client";

import { useState, useEffect } from "react";

interface Ticket {
  id: string;
  type: string;
  severity: "CRITICAL" | "ERROR" | "WARNING" | "INFO";
  category: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "resolved" | "scheduled";
  autoFix: string;
  detectedAt: string;
  scheduledFor?: string;
  assignedTo?: string;
  resolution?: string;
}

const mockIssues = [
  {
    id: "context-overflow-20260321-001",
    type: "Context Window Overflow",
    severity: "CRITICAL" as const,
    category: "critical",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    message: "FailoverError: context too small (4096 < 16000) in nemotron-3-nano-4b",
    status: "auto-fixed",
    autoFix: "Model switched from nemotron to qwen3.5-9b fallback",
  },
  {
    id: "orphaned-messages-20260321-002",
    type: "Orphaned Messages",
    severity: "WARNING" as const,
    category: "warning",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    message: "Discord message in #general stuck in pending state for 45 minutes",
    status: "cleared",
    autoFix: "Message cleared, session restarted",
  },
  {
    id: "tool-edit-failure-20260321-003",
    type: "Tool Edit Failure",
    severity: "ERROR" as const,
    category: "error",
    timestamp: new Date(Date.now() - 21600000).toISOString(),
    message: "Failed to edit ModeScreen.tsx due to context overflow",
    status: "auto-fixed",
    autoFix: "Config reloaded, tool retry successful",
  },
];

export default function MaintenanceScreen() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [lastScan, setLastScan] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/maintenance/tickets")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTickets(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
    setLastScan(new Date().toISOString());
  }, []);

  const displayItems = tickets.length > 0
    ? tickets.map((t) => ({
        id: t.id,
        type: t.type,
        severity: t.severity,
        timestamp: t.detectedAt,
        message: t.description || t.message || "",
        status: t.status === "scheduled" ? "🎯 Scheduled" : t.status === "open" ? "📋 Open" : t.status === "resolved" ? "✅ Resolved" : "🔄 In Progress",
        autoFix: t.autoFix || "No auto-fix available",
      }))
    : mockIssues.map((i) => ({
        ...i,
        status: i.status === "auto-fixed" ? "✅ Auto-Fixed" : i.status === "cleared" ? "✅ Cleared" : "⚠️ Warning",
      }));

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)", text: "#f87171" };
      case "ERROR":
        return { bg: "rgba(249,115,22,0.15)", border: "rgba(249,115,22,0.3)", text: "#fb923c" };
      case "WARNING":
        return { bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.3)", text: "#facc15" };
      default:
        return { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)", text: "#60a5fa" };
    }
  };

  const StatCard = ({ value, label, sublabel, color }: { value: string | number; label: string; sublabel: string; color: string }) => (
    <div style={{
      background: "var(--bg-tertiary)",
      border: "1px solid var(--border)",
      borderRadius: "8px",
      padding: "16px",
    }}>
      <div style={{ fontSize: "28px", fontWeight: "700", color }}>{value}</div>
      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>{label}</div>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{sublabel}</div>
    </div>
  );

  return (
    <div style={{ padding: "24px", overflowY: "auto", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
            🔧 Maintenance Issues
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" }}>
            Auto-created tickets for nightly maintenance • Last scan: {lastScan ? new Date(lastScan).toLocaleTimeString() : "Loading..."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {tickets.filter(t => t.status === "scheduled").length > 0 && (
            <span style={{
              padding: "6px 12px",
              borderRadius: "9999px",
              fontSize: "11px",
              fontWeight: "500",
              background: "rgba(168,85,247,0.15)",
              color: "#c084fc",
              border: "1px solid rgba(168,85,247,0.3)",
            }}>
              🎯 {tickets.filter(t => t.status === "scheduled").length} Scheduled
            </span>
          )}
          <span style={{
            padding: "6px 12px",
            borderRadius: "9999px",
            fontSize: "11px",
            fontWeight: "500",
            background: "rgba(34,197,94,0.15)",
            color: "#4ade80",
            border: "1px solid rgba(34,197,94,0.3)",
          }}>
            🟢 System Healthy
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <StatCard
          value={displayItems.length}
          label="Total Tickets"
          sublabel={tickets.length > 0 ? "From API" : "Demo data"}
          color="var(--text-primary)"
        />
        <StatCard
          value={displayItems.filter(i => i.severity === "CRITICAL").length}
          label="Critical"
          sublabel="Context overflow"
          color="#f87171"
        />
        <StatCard
          value={displayItems.filter(i => i.severity === "ERROR").length}
          label="Errors"
          sublabel="Timeouts & failures"
          color="#fb923c"
        />
        <StatCard
          value={displayItems.filter(i => i.severity === "WARNING").length}
          label="Warnings"
          sublabel="Low context alerts"
          color="#facc15"
        />
      </div>

      {/* Auto-Remediation Status */}
      <div style={{
        background: "linear-gradient(135deg, rgba(30,58,138,0.3), rgba(88,28,135,0.3))",
        border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px",
      }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#60a5fa", marginBottom: "16px" }}>
          🤖 Auto-Ticket Creation
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          <div style={{
            padding: "12px",
            borderRadius: "8px",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>📋 Ticket Generation</div>
            <div style={{ fontSize: "11px", color: "#4ade80", marginTop: "4px" }}>
              When issue detected → Create ticket → Send to #bugs
            </div>
          </div>
          <div style={{
            padding: "12px",
            borderRadius: "8px",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>🌙 Nightly Maintenance</div>
            <div style={{ fontSize: "11px", color: "#c084fc", marginTop: "4px" }}>
              5:00 AM EDT • Auto-fix scheduled issues
            </div>
          </div>
          <div style={{
            padding: "12px",
            borderRadius: "8px",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>🐛 Bugs Channel</div>
            <div style={{ fontSize: "11px", color: "#fb923c", marginTop: "4px" }}>
              All tickets posted to #mission_control
            </div>
          </div>
          <div style={{
            padding: "12px",
            borderRadius: "8px",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>🔧 Auto-Fix</div>
            <div style={{ fontSize: "11px", color: "#4ade80", marginTop: "4px" }}>
              Each ticket includes remediation steps
            </div>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div style={{
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px",
      }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "16px" }}>
          📋 Maintenance Tickets
        </h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
            Loading tickets...
          </div>
        ) : displayItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "#4ade80" }}>
            ✅ No maintenance tickets — system is healthy!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {displayItems.map((item: any) => {
              const colors = getSeverityColor(item.severity);
              return (
                <div
                  key={item.id}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: "700",
                      color: colors.text,
                      background: "rgba(0,0,0,0.3)",
                    }}>
                      {item.severity}
                    </span>
                    <span style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--text-muted)" }}>
                      {item.id}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: "500" }}>
                      {item.type}
                    </span>
                  </div>
                  <p style={{
                    fontSize: "12px",
                    fontFamily: "monospace",
                    color: "#cbd5e1",
                    background: "rgba(0,0,0,0.3)",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    marginBottom: "8px",
                  }}>
                    {item.message}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      color: "#c084fc",
                      background: "rgba(168,85,247,0.15)",
                      border: "1px solid rgba(168,85,247,0.3)",
                    }}>
                      {item.status}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>🔧 {item.autoFix}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Error Catalog */}
      <div style={{
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px",
      }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "16px" }}>
          📚 Error Categories
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(127,29,29,0.2)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#f87171" }}>🔴 CRITICAL</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>Context overflow</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Gateway shutdown</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Service unavailable</div>
          </div>
          <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(127,29,29,0.15)", border: "1px solid rgba(249,115,22,0.2)" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#fb923c" }}>🟠 ERROR</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>Model timeouts</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Tool edit failures</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Missing images</div>
          </div>
          <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(127,29,29,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#facc15" }}>🟡 WARNING</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>Low context</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Orphaned messages</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Discord disconnect</div>
          </div>
        </div>
      </div>
    </div>
  );
}
