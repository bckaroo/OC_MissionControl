"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Clock, Zap, Activity, TrendingUp } from "lucide-react";

interface OverviewData {
  systemHealth: {
    cpu: number;
    ram: number;
    gpu: number;
  };
  todayStats: {
    tasksCompleted: number;
    tokensBurned: number;
    runtime: string;
    avgResponseTime: string;
  };
  activeNow: {
    runningTasks: number;
    activeAgents: string[];
    currentModel: string;
  };
  alerts: Array<{
    id: string;
    level: "critical" | "warning" | "info";
    message: string;
  }>;
  modelPerformance: Array<{
    model: string;
    tokensUsed: number;
    accuracy: number;
  }>;
  recentCompletions: Array<{
    id: string;
    title: string;
    completedAt: string;
    duration: string;
  }>;
  upcoming: Array<{
    id: string;
    title: string;
    scheduledAt: string;
    type: "backup" | "task" | "check";
  }>;
  memorySnapshot: {
    lastUpdate: string;
    keyInsights: string[];
  };
}

const mockOverviewData: OverviewData = {
  systemHealth: {
    cpu: 42,
    ram: 68,
    gpu: 35,
  },
  todayStats: {
    tasksCompleted: 12,
    tokensBurned: 2_450_000,
    runtime: "8h 45m",
    avgResponseTime: "2.3s",
  },
  activeNow: {
    runningTasks: 3,
    activeAgents: ["xiaoguo (email triage)", "xiaohu (code review)"],
    currentModel: "claude-haiku-4-5",
  },
  alerts: [
    { id: "a1", level: "warning", message: "Token usage at 82% — refresh in ~4m 30s" },
    { id: "a2", level: "info", message: "Backup completed at 12:00 PM" },
  ],
  modelPerformance: [
    { model: "claude-haiku-4-5", tokensUsed: 1_250_000, accuracy: 94 },
    { model: "qwen3-coder-30b", tokensUsed: 890_000, accuracy: 92 },
    { model: "deepseek-r1-8b", tokensUsed: 310_000, accuracy: 96 },
  ],
  recentCompletions: [
    { id: "t1", title: "Update dashboard styling", completedAt: "12:14 PM", duration: "8m 24s" },
    { id: "t2", title: "Fix token tracker display", completedAt: "12:06 PM", duration: "3m 12s" },
    { id: "t3", title: "Create project cards", completedAt: "11:48 AM", duration: "18m 45s" },
    { id: "t4", title: "Deploy system monitor", completedAt: "11:23 AM", duration: "5m 33s" },
    { id: "t5", title: "Integrate APIs", completedAt: "10:45 AM", duration: "22m 10s" },
  ],
  upcoming: [
    { id: "u1", type: "backup", title: "GitHub backup", scheduledAt: "2:00 PM" },
    { id: "u2", type: "task", title: "OCD_001 milestone review", scheduledAt: "3:30 PM" },
    { id: "u3", type: "check", title: "Daily heartbeat check", scheduledAt: "4:00 PM" },
  ],
  memorySnapshot: {
    lastUpdate: "Today at 11:30 AM",
    keyInsights: [
      "Models page token tracking live — need cooldown timer implementation",
      "Dashboard Improvements project registered with 18 tasks",
      "System Monitor bar working — now showing CPU, RAM, GPU, Load, Uptime",
    ],
  },
};

function getHealthColor(value: number): string {
  if (value > 85) return "#ef4444";
  if (value > 70) return "#f59e0b";
  return "#22c55e";
}

function getAlertIcon(level: string) {
  if (level === "critical") return "🔴";
  if (level === "warning") return "🟡";
  return "🔵";
}

export default function OverviewScreen() {
  const [data, setData] = useState<OverviewData>(mockOverviewData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/overview");
        const response = await res.json();
        setData(response);
      } catch (error) {
        console.error("Failed to fetch overview data:", error);
        // Fallback to mock data
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: "100%", overflow: "auto", padding: "20px", background: "var(--bg-primary)" }}>
      {/* System Health */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>
          System Health
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {[
            { label: "CPU", value: data.systemHealth.cpu, icon: "⚡" },
            { label: "RAM", value: data.systemHealth.ram, icon: "📊" },
            { label: "GPU", value: data.systemHealth.gpu, icon: "🎮" },
          ].map((metric) => (
            <div key={metric.label} style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "6px", border: `2px solid ${getHealthColor(metric.value)}40` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span>{metric.icon}</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>{metric.label}</span>
              </div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: getHealthColor(metric.value) }}>
                {metric.value}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Stats */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>
          Today's Stats
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {[
            { label: "Tasks Done", value: data.todayStats.tasksCompleted, icon: "✅" },
            { label: "Tokens Burned", value: `${(data.todayStats.tokensBurned / 1_000_000).toFixed(2)}M`, icon: "🔥" },
            { label: "Runtime", value: data.todayStats.runtime, icon: "⏱️" },
            { label: "Avg Response", value: data.todayStats.avgResponseTime, icon: "⚡" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "6px" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: "600" }}>
                {stat.icon} {stat.label}
              </div>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "var(--text-primary)" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Right Now */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>
          Active Right Now
        </h2>
        <div style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "6px", border: "1px solid var(--bg-tertiary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Activity size={16} style={{ color: "#22c55e" }} />
            <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
              {data.activeNow.runningTasks} tasks executing
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>
            Agents: {data.activeNow.activeAgents.join(", ")}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
            Current model: <span style={{ fontWeight: "600" }}>{data.activeNow.currentModel}</span>
          </div>
        </div>
      </div>

      {/* Key Alerts */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>
          Key Alerts
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.alerts.map((alert) => (
            <div key={alert.id} style={{ background: "var(--bg-secondary)", padding: "10px", borderRadius: "4px", borderLeft: `3px solid ${alert.level === "critical" ? "#ef4444" : alert.level === "warning" ? "#f59e0b" : "#3b82f6"}` }}>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                {getAlertIcon(alert.level)} {alert.message}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Performance */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>
          Top Models Today
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {data.modelPerformance.map((model) => (
            <div key={model.model} style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "6px" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: "600" }}>
                {model.model}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>Tokens</div>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text-primary)" }}>
                    {(model.tokensUsed / 1_000_000).toFixed(2)}M
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>Accuracy</div>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "#22c55e" }}>
                    {model.accuracy}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Completions */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>
          Last 5 Completed
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {data.recentCompletions.map((task) => (
            <div key={task.id} style={{ background: "var(--bg-secondary)", padding: "10px", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                <span style={{ fontSize: "11px", color: "var(--text-primary)" }}>{task.title}</span>
              </div>
              <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                {task.completedAt} ({task.duration})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>
          Upcoming
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {data.upcoming.map((item) => (
            <div key={item.id} style={{ background: "var(--bg-secondary)", padding: "10px", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                <Clock size={14} style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: "11px", color: "var(--text-primary)" }}>{item.title}</span>
              </div>
              <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>{item.scheduledAt}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Memory Snapshot */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>
          Memory Snapshot
        </h2>
        <div style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "6px" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "8px" }}>
            Last updated: {data.memorySnapshot.lastUpdate}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.memorySnapshot.keyInsights.map((insight, idx) => (
              <div key={idx} style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                • {insight}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
