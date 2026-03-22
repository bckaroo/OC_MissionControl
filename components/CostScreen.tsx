"use client";

import { useEffect, useState, useCallback } from "react";
import {
  mockTaskCosts,
  getSpendInRange,
  getSpendByModel,
  getSpendByAgent,
  getSpendByTaskType,
  getDailySpend,
  getBudgetStatus,
  getOptimizationInsights,
  agentBudgets,
  MODEL_PRICING,
  ModelId,
  TaskCostRecord,
} from "@/lib/costData";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(usd: number): string {
  if (usd >= 1)    return `$${usd.toFixed(3)}`;
  if (usd >= 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(5)}`;
}
function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}
function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, accent = "#8b5cf6", icon,
}: { label: string; value: string; sub?: string; accent?: string; icon?: string }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "10px",
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {icon && <span style={{ fontSize: "14px" }}>{icon}</span>}
        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
      </div>
      <div style={{ fontSize: "22px", fontWeight: "700", color: accent, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{sub}</div>}
    </div>
  );
}

function SparkBar({
  data, height = 40,
}: { data: { date: string; cost: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.cost), 0.0001);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height, width: "100%" }}>
      {data.map((d, i) => {
        const pct = (d.cost / max) * 100;
        const isToday = i === data.length - 1;
        return (
          <div
            key={d.date}
            title={`${d.date}: ${fmt(d.cost)}`}
            style={{
              flex: 1,
              height: `${Math.max(pct, 4)}%`,
              background: isToday ? "#8b5cf6" : "rgba(139,92,246,0.35)",
              borderRadius: "2px 2px 0 0",
              transition: "height 0.3s ease",
            }}
          />
        );
      })}
    </div>
  );
}

function PieChart({
  data, size = 120,
}: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--bg-tertiary)" }} />;

  let cumulativePct = 0;
  const slices = data.map((d) => {
    const pct = d.value / total;
    const start = cumulativePct;
    cumulativePct += pct;
    return { ...d, pct, start };
  });

  const r = size / 2;
  const cx = r;
  const cy = r;
  const innerR = r * 0.55;

  function polarToCartesian(angle: number, radius: number) {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function describeArc(startPct: number, endPct: number) {
    const startDeg = startPct * 360;
    const endDeg   = endPct   * 360;
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    const s = polarToCartesian(startDeg, r - 2);
    const e = polarToCartesian(endDeg,   r - 2);
    const si = polarToCartesian(startDeg, innerR);
    const ei = polarToCartesian(endDeg,   innerR);
    return `M ${s.x} ${s.y} A ${r - 2} ${r - 2} 0 ${largeArc} 1 ${e.x} ${e.y} L ${ei.x} ${ei.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${si.x} ${si.y} Z`;
  }

  return (
    <svg width={size} height={size}>
      {slices.map((s, i) => (
        <path
          key={i}
          d={describeArc(s.start, s.start + s.pct)}
          fill={s.color}
          opacity={0.9}
        >
          <title>{s.label}: {fmt(s.value)} ({(s.pct * 100).toFixed(1)}%)</title>
        </path>
      ))}
    </svg>
  );
}

function BudgetBar({ pct, critical }: { pct: number; critical: boolean }) {
  const clamped = Math.min(pct, 100);
  const color = critical ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ background: "var(--bg-tertiary)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
      <div style={{
        width: `${clamped}%`,
        height: "100%",
        background: color,
        borderRadius: "4px",
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

// ─── Task Row ────────────────────────────────────────────────────────────────

function TaskRow({ rec, onClick }: { rec: TaskCostRecord; onClick: () => void }) {
  const modelInfo = MODEL_PRICING[rec.model];
  const savings   = rec.budgetedCost - rec.cost;
  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 90px 90px 70px 70px 70px",
        gap: "8px",
        padding: "8px 12px",
        borderBottom: "1px solid var(--border-subtle)",
        cursor: "pointer",
        alignItems: "center",
        transition: "background 0.1s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div>
        <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {rec.taskTitle}
        </div>
        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>
          {rec.agentName} · {timeAgo(rec.timestamp)}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <span style={{
          fontSize: "10px",
          padding: "2px 6px",
          borderRadius: "4px",
          background: `${modelInfo?.color ?? "#888"}22`,
          color: modelInfo?.color ?? "#888",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}>
          {modelInfo?.name?.replace("Claude ", "").replace("GPT-", "G") ?? rec.model}
        </span>
      </div>
      <div style={{ textAlign: "right", fontSize: "11px", color: "var(--text-secondary)" }}>
        {fmtK(rec.inputTokens + rec.outputTokens)} tok
      </div>
      <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
        {fmt(rec.cost)}
      </div>
      <div style={{ textAlign: "right", fontSize: "11px", color: savings >= 0 ? "#22c55e" : "#ef4444", fontVariantNumeric: "tabular-nums" }}>
        {savings >= 0 ? "+" : ""}{fmt(savings)}
      </div>
      <div>
        <span style={{
          fontSize: "10px",
          padding: "2px 6px",
          borderRadius: "4px",
          background: "var(--bg-tertiary)",
          color: "var(--text-muted)",
          textTransform: "capitalize",
        }}>
          {rec.taskType}
        </span>
      </div>
    </div>
  );
}

// ─── Task Detail Modal ───────────────────────────────────────────────────────

function TaskDetail({ rec, onClose }: { rec: TaskCostRecord; onClose: () => void }) {
  const modelInfo = MODEL_PRICING[rec.model];
  const savings = rec.budgetedCost - rec.cost;
  const maxStepCost = Math.max(...rec.steps.map((s) => s.cost));

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-active)",
          borderRadius: "12px",
          width: "480px",
          maxHeight: "80vh",
          overflow: "auto",
          padding: "20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600 }}>{rec.taskTitle}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              {rec.agentName} · {new Date(rec.timestamp).toLocaleString()}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "18px", cursor: "pointer" }}>×</button>
        </div>

        {/* Top metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>ACTUAL COST</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#8b5cf6" }}>{fmt(rec.cost)}</div>
          </div>
          <div style={{ background: "var(--bg-card)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>BUDGETED</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-secondary)" }}>{fmt(rec.budgetedCost)}</div>
          </div>
          <div style={{ background: "var(--bg-card)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>SAVINGS</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: savings >= 0 ? "#22c55e" : "#ef4444" }}>
              {savings >= 0 ? "+" : ""}{fmt(savings)}
            </div>
          </div>
        </div>

        {/* Token + model info */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "5px", background: `${modelInfo?.color ?? "#888"}22`, color: modelInfo?.color ?? "#888" }}>
            {modelInfo?.name ?? rec.model}
          </span>
          <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "5px", background: "var(--bg-card)", color: "var(--text-secondary)" }}>
            {fmtK(rec.inputTokens)} in · {fmtK(rec.outputTokens)} out
          </span>
          <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "5px", background: "var(--bg-card)", color: "var(--text-secondary)" }}>
            {Math.round(rec.durationSec)}s
          </span>
          <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "5px", background: "var(--bg-card)", color: "var(--text-secondary)", textTransform: "capitalize" }}>
            {rec.taskType}
          </span>
        </div>

        {/* Step breakdown */}
        <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "10px", color: "var(--text-secondary)" }}>
          Cost by step
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {rec.steps.map((s, i) => {
            const pct = maxStepCost > 0 ? (s.cost / maxStepCost) * 100 : 0;
            const isWorst = s.cost === maxStepCost;
            return (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "11px", color: isWorst ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: isWorst ? 600 : 400 }}>
                    {s.name} {isWorst && "🔥"}
                  </span>
                  <span style={{ fontSize: "11px", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                    {fmt(s.cost)} · {fmtK(s.inputTokens + s.outputTokens)} tok
                  </span>
                </div>
                <div style={{ background: "var(--bg-tertiary)", borderRadius: "3px", height: "4px" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: isWorst ? "#8b5cf6" : "rgba(139,92,246,0.4)", borderRadius: "3px" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Budget Edit Modal ───────────────────────────────────────────────────────

function BudgetEditor({
  agentId, agentName, current, onClose, onSave,
}: {
  agentId: string; agentName: string;
  current: { monthlyCapUSD: number; weeklyCapUSD: number };
  onClose: () => void;
  onSave: (monthly: number, weekly: number) => void;
}) {
  const [monthly, setMonthly] = useState(String(current.monthlyCapUSD));
  const [weekly, setWeekly] = useState(String(current.weeklyCapUSD));

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-active)", borderRadius: "12px", width: "320px", padding: "20px" }}
      >
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Set Budget — {agentName}</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px" }}>Alerts fire at 80% of cap</div>

        {[{ label: "Monthly cap (USD)", val: monthly, set: setMonthly }, { label: "Weekly cap (USD)", val: weekly, set: setWeekly }].map(f => (
          <div key={f.label} style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>{f.label}</label>
            <input
              type="number" min="0" step="0.01" value={f.val}
              onChange={e => f.set(e.target.value)}
              style={{
                width: "100%", padding: "8px 10px", background: "var(--bg-card)",
                border: "1px solid var(--border)", borderRadius: "6px",
                color: "var(--text-primary)", fontSize: "13px",
              }}
            />
          </div>
        ))}

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
          <button onClick={onClose} style={{ padding: "7px 14px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: "12px" }}>
            Cancel
          </button>
          <button
            onClick={() => { onSave(parseFloat(monthly) || 0, parseFloat(weekly) || 0); onClose(); }}
            style={{ padding: "7px 14px", borderRadius: "6px", border: "none", background: "#7c3aed", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main CostScreen ─────────────────────────────────────────────────────────

type Tab = "overview" | "agents" | "tasks" | "budget" | "insights";

export default function CostScreen() {
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedTask, setSelectedTask] = useState<TaskCostRecord | null>(null);
  const [localBudgets, setLocalBudgets] = useState([...agentBudgets]);
  const [editingBudget, setEditingBudget] = useState<{ agentId: string; agentName: string } | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>("all");

  // Pre-computed data
  const today   = getSpendInRange(mockTaskCosts, 1);
  const week    = getSpendInRange(mockTaskCosts, 7);
  const month   = getSpendInRange(mockTaskCosts, 30);
  const byModel = getSpendByModel(mockTaskCosts);
  const byAgent = getSpendByAgent(mockTaskCosts);
  const byType  = getSpendByTaskType(mockTaskCosts);
  const daily30 = getDailySpend(mockTaskCosts, 30);
  const daily14 = getDailySpend(mockTaskCosts, 14);
  const budgetStatus = getBudgetStatus(mockTaskCosts, localBudgets);
  const insights = getOptimizationInsights(mockTaskCosts);

  const pieData = Object.entries(byModel)
    .map(([modelId, cost]) => ({
      label: MODEL_PRICING[modelId as ModelId]?.name ?? modelId,
      value: cost,
      color: MODEL_PRICING[modelId as ModelId]?.color ?? "#888",
    }))
    .sort((a, b) => b.value - a.value);

  const agentPieData = Object.entries(byAgent)
    .map(([, d], i) => ({
      label: d.name,
      value: d.cost,
      color: ["#8b5cf6", "#3b82f6", "#22c55e", "#f59e0b", "#ec4899"][i % 5],
    }));

  const filteredTasks = taskFilter === "all"
    ? mockTaskCosts
    : mockTaskCosts.filter(r => r.taskType === taskFilter);

  const sortedTasks = [...filteredTasks].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalInputTokens  = mockTaskCosts.reduce((s, r) => s + r.inputTokens, 0);
  const totalOutputTokens = mockTaskCosts.reduce((s, r) => s + r.outputTokens, 0);

  // Project end-of-month
  const dayOfMonth   = new Date().getDate();
  const daysInMonth  = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projectedMonth = dayOfMonth > 0 ? (month / dayOfMonth) * daysInMonth : 0;

  // Alerts
  const alerts = budgetStatus.filter(b => b.alert || b.critical);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview",  icon: "◈" },
    { id: "agents",   label: "By Agent",  icon: "◉" },
    { id: "tasks",    label: "By Task",   icon: "▦" },
    { id: "budget",   label: "Budgets",   icon: "◫" },
    { id: "insights", label: "Insights",  icon: "⬡" },
  ];

  const inputStyle = {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px", padding: "5px 10px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-primary)", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>💸 Cost Tracker</h1>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
              Real-time spend visibility across all agents and models
            </p>
          </div>
          {alerts.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "6px 12px", borderRadius: "8px",
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", fontSize: "12px", fontWeight: 500,
            }}>
              ⚠️ {alerts.length} budget alert{alerts.length > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--border)" }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "7px 14px", border: "none", cursor: "pointer",
                background: "transparent", fontSize: "12px", fontWeight: 500,
                color: tab === t.id ? "var(--text-primary)" : "var(--text-muted)",
                borderBottom: tab === t.id ? "2px solid #8b5cf6" : "2px solid transparent",
                marginBottom: "-1px", display: "flex", alignItems: "center", gap: "5px",
                transition: "color 0.1s",
              }}
            >
              <span style={{ fontSize: "13px" }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* KPI Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              <MetricCard label="Today"       value={fmt(today)}   sub={`${mockTaskCosts.filter(r => { const c = new Date(); c.setDate(c.getDate()-1); return new Date(r.timestamp) >= c; }).length} tasks`} accent="#22c55e" icon="📅" />
              <MetricCard label="This Week"   value={fmt(week)}    sub="last 7 days"   accent="#3b82f6"  icon="📆" />
              <MetricCard label="This Month"  value={fmt(month)}   sub={`${mockTaskCosts.length} tasks`} accent="#8b5cf6" icon="🗓️" />
              <MetricCard label="Projected"   value={fmt(projectedMonth)} sub="end of month estimate" accent="#f59e0b" icon="📈" />
            </div>

            {/* Token totals */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <MetricCard label="Input Tokens"  value={fmtK(totalInputTokens)}  sub="context sent"       accent="#06b6d4" icon="→" />
              <MetricCard label="Output Tokens" value={fmtK(totalOutputTokens)} sub="completions"        accent="#ec4899" icon="←" />
              <MetricCard label="Total Tokens"  value={fmtK(totalInputTokens + totalOutputTokens)} sub={`avg ${fmtK(Math.round((totalInputTokens + totalOutputTokens) / mockTaskCosts.length))}/task`} accent="#a78bfa" icon="⚡" />
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

              {/* Spend by Model */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "14px", color: "var(--text-secondary)" }}>Spend by Model</div>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <PieChart data={pieData} size={110} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    {pieData.slice(0, 5).map((d) => (
                      <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{fmt(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Spend by Agent */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "14px", color: "var(--text-secondary)" }}>Spend by Agent</div>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <PieChart data={agentPieData} size={110} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    {Object.entries(byAgent).sort((a, b) => b[1].cost - a[1].cost).map(([id, d], i) => (
                      <div key={id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: agentPieData[i]?.color ?? "#888", flexShrink: 0 }} />
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)", flex: 1 }}>{d.name}</span>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{fmt(d.cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Trend sparkbar */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Daily Spend — Last 30 Days</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Hover bars for details</div>
              </div>
              <SparkBar data={daily30} height={60} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{daily30[0]?.date}</span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Today</span>
              </div>
            </div>

            {/* Spend by Task Type */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "14px", color: "var(--text-secondary)" }}>Spend by Task Type</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(byType)
                  .sort((a, b) => b[1].cost - a[1].cost)
                  .map(([type, data]) => {
                    const maxCost = Math.max(...Object.values(byType).map(v => v.cost));
                    const pct = maxCost > 0 ? (data.cost / maxCost) * 100 : 0;
                    return (
                      <div key={type}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "capitalize" }}>{type}</span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {fmt(data.cost)} total · {fmt(data.avgCost)} avg · {data.count} tasks
                          </span>
                        </div>
                        <div style={{ background: "var(--bg-tertiary)", borderRadius: "3px", height: "5px" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "#8b5cf6", borderRadius: "3px", opacity: 0.7 }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ── BY AGENT ── */}
        {tab === "agents" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {Object.entries(byAgent)
              .sort((a, b) => b[1].cost - a[1].cost)
              .map(([agentId, d], agentIdx) => {
                const agentRecs  = mockTaskCosts.filter(r => r.agentId === agentId);
                const budget     = budgetStatus.find(b => b.agentId === agentId);
                const totalSec   = agentRecs.reduce((s, r) => s + r.durationSec, 0);
                const costPerHr  = totalSec > 0 ? (d.cost / totalSec) * 3600 : 0;
                const accentColor = ["#8b5cf6", "#3b82f6", "#22c55e"][agentIdx % 3];

                const modelDist: Record<string, number> = {};
                agentRecs.forEach(r => { modelDist[r.model] = (modelDist[r.model] ?? 0) + r.cost; });

                return (
                  <div key={agentId} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `${accentColor}22`, border: `1px solid ${accentColor}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                          {agentIdx === 0 ? "🐖" : agentIdx === 1 ? "🤖" : "🔍"}
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 600 }}>{d.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{d.taskCount} tasks · {Math.round(totalSec / 60)}min total compute</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "18px", fontWeight: 700, color: accentColor }}>{fmt(d.cost)}</div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>total cost</div>
                      </div>
                    </div>

                    {/* Metrics row */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "14px" }}>
                      {[
                        { l: "Avg/Task",     v: fmt(d.cost / (d.taskCount || 1)) },
                        { l: "Cost/Hour",    v: fmt(costPerHr) },
                        { l: "Input Tokens", v: fmtK(d.inputTokens) },
                        { l: "Output Tokens",v: fmtK(d.outputTokens) },
                      ].map(m => (
                        <div key={m.l} style={{ background: "var(--bg-tertiary)", borderRadius: "7px", padding: "10px 12px" }}>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "3px" }}>{m.l}</div>
                          <div style={{ fontSize: "13px", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{m.v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Budget bar */}
                    {budget && (
                      <div style={{ marginBottom: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Monthly Budget</span>
                          <span style={{ fontSize: "11px", color: budget.critical ? "#ef4444" : budget.alert ? "#f59e0b" : "var(--text-secondary)", fontWeight: 500 }}>
                            {fmt(budget.monthSpend)} / {fmt(budget.monthlyCapUSD)} ({budget.monthPct.toFixed(0)}%)
                          </span>
                        </div>
                        <BudgetBar pct={budget.monthPct} critical={budget.critical} />
                        {budget.alert && (
                          <div style={{ marginTop: "6px", fontSize: "11px", color: budget.critical ? "#ef4444" : "#f59e0b" }}>
                            {budget.critical ? "🔴 Budget exceeded!" : "⚠️ Approaching budget limit"}
                            {" — Projected: "}{fmt(budget.projectedMonth)} this month
                          </div>
                        )}
                      </div>
                    )}

                    {/* Model distribution */}
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>Model distribution</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {Object.entries(modelDist)
                        .sort((a, b) => b[1] - a[1])
                        .map(([modelId, cost]) => {
                          const info = MODEL_PRICING[modelId as ModelId];
                          const pct  = d.cost > 0 ? (cost / d.cost) * 100 : 0;
                          return (
                            <div key={modelId} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 8px", borderRadius: "6px", background: `${info?.color ?? "#888"}15`, border: `1px solid ${info?.color ?? "#888"}33` }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: info?.color ?? "#888" }} />
                              <span style={{ fontSize: "11px", color: info?.color ?? "#888", fontWeight: 500 }}>{info?.name ?? modelId}</span>
                              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{pct.toFixed(0)}%</span>
                            </div>
                          );
                        })}
                    </div>

                    <div style={{ marginTop: "12px", textAlign: "right" }}>
                      <button
                        onClick={() => setEditingBudget({ agentId, agentName: d.name })}
                        style={{ padding: "5px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: "11px" }}
                      >
                        Set Budget
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ── BY TASK ── */}
        {tab === "tasks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Filter:</span>
              <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)} style={inputStyle}>
                <option value="all">All types</option>
                {Array.from(new Set(mockTaskCosts.map(r => r.taskType))).map(t => (
                  <option key={t} value={t} style={{ textTransform: "capitalize" }}>{t}</option>
                ))}
              </select>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
                {filteredTasks.length} tasks · {fmt(filteredTasks.reduce((s, r) => s + r.cost, 0))} total
              </span>
            </div>

            {/* Table header */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px 90px 70px 70px 70px",
                gap: "8px", padding: "8px 12px",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-tertiary)",
              }}>
                {["Task", "Model", "Tokens", "Cost", "Savings", "Type"].map(h => (
                  <div key={h} style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textAlign: h !== "Task" ? "right" : "left", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {h}
                  </div>
                ))}
              </div>

              {sortedTasks.map(rec => (
                <TaskRow key={rec.taskId} rec={rec} onClick={() => setSelectedTask(rec)} />
              ))}
            </div>
          </div>
        )}

        {/* ── BUDGET ── */}
        {tab === "budget" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <MetricCard label="Total Monthly Budget" value={fmt(localBudgets.reduce((s, b) => s + b.monthlyCapUSD, 0))} accent="#3b82f6" icon="🎯" />
              <MetricCard label="Total Month Spend"    value={fmt(budgetStatus.reduce((s, b) => s + b.monthSpend, 0))} accent="#8b5cf6" icon="💸" />
              <MetricCard label="Remaining Budget"     value={fmt(Math.max(0, localBudgets.reduce((s, b) => s + b.monthlyCapUSD, 0) - budgetStatus.reduce((s, b) => s + b.monthSpend, 0)))} accent="#22c55e" icon="✅" />
            </div>

            {/* Per-agent budget */}
            {budgetStatus.map((b) => (
              <div key={b.agentId} style={{
                background: "var(--bg-card)", border: `1px solid ${b.critical ? "rgba(239,68,68,0.3)" : b.alert ? "rgba(245,158,11,0.3)" : "var(--border)"}`,
                borderRadius: "10px", padding: "16px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>{b.agentName}</div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {b.critical && <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 600 }}>🔴 OVER BUDGET</span>}
                    {!b.critical && b.alert && <span style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 600 }}>⚠️ NEAR LIMIT</span>}
                    <button
                      onClick={() => setEditingBudget({ agentId: b.agentId, agentName: b.agentName })}
                      style={{ padding: "4px 10px", borderRadius: "5px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: "11px" }}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  {[
                    { label: "Monthly", spent: b.monthSpend, cap: b.monthlyCapUSD, pct: b.monthPct, proj: b.projectedMonth },
                    { label: "Weekly",  spent: b.weekSpend,  cap: b.weeklyCapUSD,  pct: b.weekPct,  proj: null },
                  ].map(row => (
                    <div key={row.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{row.label}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          {fmt(row.spent)} / {fmt(row.cap)} · {row.pct.toFixed(0)}%
                        </span>
                      </div>
                      <BudgetBar pct={row.pct} critical={row.pct >= 100} />
                      {row.proj !== null && (
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                          Projected: {fmt(row.proj)} by month end
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* High-cost task flags */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "12px", color: "var(--text-secondary)" }}>🚩 High-Cost Tasks (flag for review)</div>
              {mockTaskCosts
                .filter(r => r.cost > 0.005)
                .sort((a, b) => b.cost - a.cost)
                .slice(0, 5)
                .map(r => (
                  <div
                    key={r.taskId}
                    onClick={() => { setSelectedTask(r); setTab("tasks"); }}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)", cursor: "pointer" }}
                  >
                    <div>
                      <div style={{ fontSize: "12px" }}>{r.taskTitle}</div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{r.agentName} · {MODEL_PRICING[r.model]?.name}</div>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#f59e0b" }}>{fmt(r.cost)}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── INSIGHTS ── */}
        {tab === "insights" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
              AI-generated cost optimization suggestions based on your usage patterns.
            </div>

            {insights.map((ins, i) => {
              const iconMap = { warning: "⚠️", info: "💡", tip: "🎯" };
              const colorMap = { warning: "#f59e0b", info: "#3b82f6", tip: "#22c55e" };
              return (
                <div key={i} style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${colorMap[ins.type]}33`,
                  borderLeft: `3px solid ${colorMap[ins.type]}`,
                  borderRadius: "8px",
                  padding: "14px 16px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ fontSize: "16px", flexShrink: 0 }}>{iconMap[ins.type]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5 }}>{ins.message}</div>
                      {ins.savings && (
                        <div style={{ marginTop: "6px", fontSize: "12px", fontWeight: 600, color: colorMap[ins.type] }}>
                          Potential savings: {ins.savings}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Model pricing reference */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "12px", color: "var(--text-secondary)" }}>Model Pricing Reference</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                {Object.entries(MODEL_PRICING).map(([modelId, info]) => (
                  <div key={modelId} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: "var(--bg-tertiary)", borderRadius: "7px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: info.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "11px", fontWeight: 500 }}>{info.name}</div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        ${info.inputPer1M}/M in · ${info.outputPer1M}/M out
                      </div>
                    </div>
                    <span style={{
                      fontSize: "10px", padding: "2px 6px", borderRadius: "4px",
                      background: info.provider === "anthropic" ? "rgba(139,92,246,0.15)" : "rgba(34,197,94,0.15)",
                      color: info.provider === "anthropic" ? "#8b5cf6" : "#22c55e",
                    }}>
                      {info.provider}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick wins */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "12px", color: "var(--text-secondary)" }}>⚡ Quick Wins</div>
              {[
                { action: "Switch routine research to GPT-3.5 Turbo", est: "~75% cost reduction for research tasks" },
                { action: "Use Claude Haiku for writing drafts", est: "~83% savings vs Claude Sonnet" },
                { action: "Batch short tasks into single prompts", est: "Reduce overhead tokens by ~20%" },
                { action: "Cache common queries and context", est: "Avoid re-running identical subtasks" },
              ].map((w, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", padding: "8px 0", borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none" }}>
                  <span style={{ fontSize: "14px", flexShrink: 0 }}>✅</span>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 500 }}>{w.action}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{w.est}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedTask && <TaskDetail rec={selectedTask} onClose={() => setSelectedTask(null)} />}
      {editingBudget && (
        <BudgetEditor
          agentId={editingBudget.agentId}
          agentName={editingBudget.agentName}
          current={localBudgets.find(b => b.agentId === editingBudget.agentId) ?? { monthlyCapUSD: 25, weeklyCapUSD: 8 }}
          onClose={() => setEditingBudget(null)}
          onSave={(monthly, weekly) => {
            setLocalBudgets(prev => {
              const updated = [...prev];
              const idx = updated.findIndex(b => b.agentId === editingBudget!.agentId);
              if (idx >= 0) { updated[idx] = { ...updated[idx], monthlyCapUSD: monthly, weeklyCapUSD: weekly }; }
              else updated.push({ agentId: editingBudget!.agentId, monthlyCapUSD: monthly, weeklyCapUSD: weekly });
              return updated;
            });
          }}
        />
      )}
    </div>
  );
}
