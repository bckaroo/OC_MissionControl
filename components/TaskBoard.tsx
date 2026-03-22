"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AlertTriangle, Minus, TrendingDown, CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";
import AgentReasoningModal from "@/components/AgentReasoningModal";
import EmptyState from "@/components/EmptyState";

type ExecutionStatus = "pending" | "running" | "completed" | "failed" | null;

interface Task {
  id: string;
  title: string;
  description: string;
  status: "backlog" | "in-progress" | "review" | "done";
  assignee: string;
  assigneeInitials: string;
  priority: "high" | "medium" | "low";
  project: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  executionStatus: ExecutionStatus;
  executionResult: string | null;
  executedAt: string | null;
  executingModel?: string;
  tokenUsage?: number;
}

type Status = "backlog" | "in-progress" | "review" | "done";

const COLUMNS: { id: Status; label: string; dotColor: string }[] = [
  { id: "backlog",     label: "Backlog",     dotColor: "#8b5cf6" },
  { id: "in-progress", label: "In Progress", dotColor: "#3b82f6" },
  { id: "review",      label: "Review",      dotColor: "#f59e0b" },
  { id: "done",        label: "Done",        dotColor: "#22c55e" },
];

const PRIORITY_COLORS: Record<string, string> = {
  high:   "#ef4444",
  medium: "#f59e0b",
  low:    "#22c55e",
};

const AGENT_COLORS: Record<string, { bg: string; text: string }> = {
  XZ: { bg: "#7c3aed", text: "#fff" },
  XI: { bg: "#7c3aed", text: "#fff" },
  AB: { bg: "#2563eb", text: "#fff" },
  AL: { bg: "#0891b2", text: "#fff" },
  HE: { bg: "#059669", text: "#fff" },
};

const ACTIVITY_ICONS: Record<string, string> = {
  task:      "✅",
  skill:     "⚡",
  memory:    "🧠",
  heartbeat: "💓",
  search:    "🔍",
};

const AGENTS = ["XiaoZhu", "Andrew", "Alex", "Henry"];

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function isRecentlyUpdated(task: Task): boolean {
  const d = new Date(task.updatedAt);
  return Date.now() - d.getTime() < 30000; // within last 30s
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Status | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "backlog" as Status,
    priority: "medium",
    assignee: "XiaoZhu",
    project: "General",
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [executingTasks, setExecutingTasks] = useState<Set<string>>(new Set());
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTasksRef = useRef<Task[]>([]);

  // ── Fetch tasks from API ──
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const newTasks: Task[] = data.tasks || [];

      // Detect recently updated tasks (compare with previous state)
      const updatedIds = new Set<string>();
      for (const t of newTasks) {
        const prev = prevTasksRef.current.find((p) => p.id === t.id);
        if (prev && prev.updatedAt !== t.updatedAt) {
          updatedIds.add(t.id);
        }
      }
      if (updatedIds.size > 0) {
        setRecentlyUpdated((prev) => new Set([...prev, ...updatedIds]));
        setTimeout(() => {
          setRecentlyUpdated((prev) => {
            const next = new Set(prev);
            updatedIds.forEach((id) => next.delete(id));
            return next;
          });
        }, 4000);
      }

      prevTasksRef.current = newTasks;
      setTasks(newTasks);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  // ── Start polling ──
  useEffect(() => {
    fetchTasks();
    pollRef.current = setInterval(fetchTasks, 2500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchTasks]);

  // ── API helpers ──
  const apiUpdateTask = async (id: string, patch: Partial<Task>) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    fetchTasks();
  };

  const apiCreateTask = async (data: Omit<Task, "id" | "createdAt" | "updatedAt" | "executionStatus" | "executionResult" | "executedAt">) => {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchTasks();
  };

  const apiDeleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  };

  const apiExecuteTask = async (id: string) => {
    setExecutingTasks((prev) => new Set([...prev, id]));
    try {
      await fetch(`/api/tasks/${id}/execute`, { method: "POST" });
      fetchTasks();
    } finally {
      setTimeout(() => {
        setExecutingTasks((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 1000);
    }
  };

  // ── Drag handlers ──
  const handleDragStart = (id: string) => setDragging(id);
  const handleDragEnd = () => { setDragging(null); setDragOver(null); };
  const handleDrop = async (status: Status) => {
    if (dragging) {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === dragging ? { ...t, status, updatedAt: new Date().toISOString() } : t))
      );
      await apiUpdateTask(dragging, { status });
    }
    setDragging(null);
    setDragOver(null);
  };

  // ── Add task ──
  const addTask = async () => {
    if (!newTask.title.trim()) return;
    const initials = newTask.assignee.slice(0, 2).toUpperCase();
    await apiCreateTask({
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      assignee: newTask.assignee,
      assigneeInitials: initials,
      priority: newTask.priority as "high" | "medium" | "low",
      project: newTask.project,
      tags: [],
    });
    setNewTask({ title: "", description: "", status: "backlog", priority: "medium", assignee: "XiaoZhu", project: "General" });
    setShowNewTask(false);
  };

  // ── Save edits ──
  const saveEdit = async () => {
    if (!editingTask) return;
    await apiUpdateTask(editingTask.id, {
      title: editingTask.title,
      description: editingTask.description,
      status: editingTask.status,
      priority: editingTask.priority,
      assignee: editingTask.assignee,
      project: editingTask.project,
    });
    setEditingTask(null);
    setSelectedTask(null);
  };

  // ── Filtered tasks ──
  const filteredTasks = activeFilter === "All"
    ? tasks
    : tasks.filter((t) => t.assignee === activeFilter || t.project === activeFilter);

  const getColumnTasks = (status: Status) =>
    filteredTasks.filter((t) => t.status === status);

  const inProgress = tasks.filter((t) => t.status === "in-progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const completion = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: "14px" }}>
        Loading tasks…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "var(--bg-primary)" }}>
      {/* ─── Main board area ─── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── Stats bar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "28px", padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)", flexShrink: 0 }}>
          <StatBadge value={tasks.length}    label="Total"       color="var(--text-primary)" />
          <StatBadge value={inProgress}      label="In progress" color="#3b82f6" />
          <StatBadge value={done}            label="Done"        color="#22c55e" />
          <StatBadge value={`${completion}%`} label="Completion" color="var(--text-primary)" />
        </div>

        {/* ── Controls row ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)", flexShrink: 0, flexWrap: "wrap" }}>
          <button
            onClick={() => setShowNewTask((v) => !v)}
            style={{ padding: "5px 12px", background: "#7c3aed", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            + New task
          </button>

          {["All", "XiaoZhu", "Andrew", "Alex"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: "1px solid " + (activeFilter === f ? "rgba(255,255,255,0.15)" : "transparent"),
                background: activeFilter === f ? "rgba(255,255,255,0.07)" : "transparent",
                color: activeFilter === f ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {f}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {/* Reasoning */}
          <button
            onClick={() => setShowReasoning(true)}
            style={{ padding: "5px 10px", background: "rgba(124,90,244,0.12)", border: "1px solid rgba(124,90,244,0.3)", borderRadius: "6px", color: "#a78bfa", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            title="View agent reasoning"
          >
            🧠 Reasoning
          </button>

          {/* Export */}
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify({ tasks }, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "tasks.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{ padding: "5px 8px", background: "transparent", border: "1px solid var(--border-active)", borderRadius: "6px", color: "var(--text-muted)", fontSize: "11px", cursor: "pointer" }}
            title="Export tasks"
          >
            ↓ Export
          </button>
        </div>

        {/* ── New task form ── */}
        {showNewTask && (
          <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-tertiary)", display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input
                autoFocus
                placeholder="Task title…"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") addTask(); if (e.key === "Escape") setShowNewTask(false); }}
                style={{ flex: "1 1 200px", padding: "6px 10px", background: "var(--bg-primary)", border: "1px solid var(--border-active)", borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px", outline: "none" }}
              />
              <select value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Status })} style={selectStyle}>
                {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} style={selectStyle}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
              <select value={newTask.assignee} onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })} style={selectStyle}>
                {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                placeholder="Description (optional)…"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                style={{ flex: 1, padding: "6px 10px", background: "var(--bg-primary)", border: "1px solid var(--border-active)", borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px", outline: "none" }}
              />
              <input
                placeholder="Project…"
                value={newTask.project}
                onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                style={{ width: "140px", padding: "6px 10px", background: "var(--bg-primary)", border: "1px solid var(--border-active)", borderRadius: "6px", color: "var(--text-primary)", fontSize: "12px", outline: "none" }}
              />
              <button onClick={addTask} style={{ padding: "6px 14px", background: "#7c3aed", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}>Add Task</button>
              <button onClick={() => setShowNewTask(false)} style={{ padding: "6px 12px", background: "transparent", border: "1px solid var(--border-active)", borderRadius: "6px", color: "var(--text-muted)", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Kanban columns ── */}
        <div style={{ flex: 1, display: "flex", overflow: "auto", padding: "16px", gap: "12px" }}>
          {COLUMNS.map((col) => {
            const colTasks = getColumnTasks(col.id);
            const isDragOver = dragOver === col.id;
            return (
              <div
                key={col.id}
                style={{ flex: "0 0 224px", display: "flex", flexDirection: "column" }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
                onDrop={() => handleDrop(col.id)}
              >
                {/* Column header */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", padding: "2px 4px" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: col.dotColor, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)" }}>{col.label}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "0 5px", borderRadius: "8px" }}>
                    {colTasks.length}
                  </span>
                  <button
                    onClick={() => { setNewTask((n) => ({ ...n, status: col.id })); setShowNewTask(true); }}
                    style={{ marginLeft: "auto", width: "18px", height: "18px", border: "none", borderRadius: "4px", background: "transparent", color: "var(--text-muted)", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    title={`Add to ${col.label}`}
                  >+</button>
                </div>

                {/* Cards container */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    padding: "6px",
                    borderRadius: "8px",
                    background: isDragOver ? "rgba(124,58,237,0.06)" : "rgba(255,255,255,0.02)",
                    border: isDragOver ? "1px dashed rgba(124,58,237,0.5)" : "1px solid transparent",
                    minHeight: "100px",
                    transition: "all 0.12s",
                  }}
                >
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isDragging={dragging === task.id}
                      isRecentlyUpdated={recentlyUpdated.has(task.id) || isRecentlyUpdated(task)}
                      isExecuting={executingTasks.has(task.id)}
                      onClick={() => setSelectedTask(task)}
                      onExecute={() => apiExecuteTask(task.id)}
                      onDelete={() => apiDeleteTask(task.id)}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <EmptyState 
                      type={col.id} 
                      onAction={col.id === "backlog" ? () => { setNewTask((n) => ({ ...n, status: col.id })); setShowNewTask(true); } : undefined}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Right sidebar: Live Activity ─── */}
      <div style={{ width: "220px", minWidth: "220px", borderLeft: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>⚡</span>
          <span style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-primary)" }}>Live Activity</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={() => setShowReasoning(true)}
              title="View agent reasoning"
              style={{ background: "rgba(124,90,244,0.15)", border: "1px solid rgba(124,90,244,0.3)", borderRadius: "5px", color: "#a78bfa", fontSize: "11px", padding: "2px 7px", cursor: "pointer" }}
            >
              🧠
            </button>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" }} />
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
          {/* Show only tasks actually running on a model */}
          {(() => {
            const liveActivities = tasks
              .filter(t => t.executionStatus === "running" && t.executingModel)
              .slice(-5)
              .reverse();
            
            if (liveActivities.length === 0) {
              return (
                <div style={{ padding: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "11px" }}>
                  No active model work
                </div>
              );
            }

            return liveActivities.map((t) => {
              // Determine token usage intensity (0-100%)
              const tokenUsage = Math.min((t.tokenUsage || 0) / 1000, 100);
              const lightColor = tokenUsage > 70 ? "#ef4444" : tokenUsage > 40 ? "#f59e0b" : "#22c55e";
              const lightIntensity = Math.max(0.3, tokenUsage / 100);

              return (
                <div
                  key={`exec-${t.id}`}
                  style={{
                    padding: "10px",
                    marginBottom: "4px",
                    borderRadius: "6px",
                    background: "rgba(59,130,246,0.1)",
                    border: "1px solid rgba(59,130,246,0.2)",
                  }}
                >
                  {/* Header with model and token light */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                      <div style={{ fontSize: "12px" }}>⏳</div>
                      <div style={{ fontSize: "10px", fontWeight: "600", color: "#60a5fa" }}>
                        {t.executingModel}
                      </div>
                    </div>
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: lightColor,
                        boxShadow: `0 0 8px ${lightColor}`,
                        opacity: lightIntensity,
                      }}
                      title={`Token usage: ${Math.round(tokenUsage)}%`}
                    />
                  </div>

                  {/* Task title */}
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4", marginBottom: "4px" }}>
                    {t.title}
                  </div>

                  {/* Token usage bar */}
                  {t.tokenUsage !== undefined && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "9px" }}>
                      <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            background: lightColor,
                            width: `${Math.min(tokenUsage, 100)}%`,
                          }}
                        />
                      </div>
                      <div style={{ color: "var(--text-muted)", minWidth: "28px", textAlign: "right" }}>
                        {Math.round(tokenUsage)}%
                      </div>
                    </div>
                  )}

                  {t.executedAt && (
                    <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px" }}>
                      {timeAgo(t.executedAt)}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* ─── Task detail modal ─── */}
      {selectedTask && (
        <TaskDetailModal
          task={editingTask || selectedTask}
          isEditing={!!editingTask}
          onEdit={() => setEditingTask({ ...selectedTask })}
          onClose={() => { setSelectedTask(null); setEditingTask(null); }}
          onChange={(patch) => setEditingTask((prev) => prev ? { ...prev, ...patch } : prev)}
          onSave={saveEdit}
          onExecute={() => { apiExecuteTask(selectedTask.id); setSelectedTask(null); }}
          onDelete={() => { apiDeleteTask(selectedTask.id); setSelectedTask(null); }}
        />
      )}

      {/* ─── Agent Reasoning modal ─── */}
      {showReasoning && (
        <AgentReasoningModal
          agentId={encodeURIComponent("agent:main:main")}
          agentName="XiaoZhu"
          agentEmoji="🐖"
          onClose={() => setShowReasoning(false)}
        />
      )}
    </div>
  );
}

/* ──────────────── Sub-components ──────────────── */

const selectStyle: React.CSSProperties = {
  padding: "6px 8px",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-active)",
  borderRadius: "6px",
  color: "var(--text-secondary)",
  fontSize: "12px",
};

interface ExecutionStatusBadgeProps {
  status: ExecutionStatus;
}

function ExecutionStatusBadge({ status }: ExecutionStatusBadgeProps) {
  const statusConfig = {
    running: { color: "rgba(59,130,246,0.15)", borderColor: "rgba(59,130,246,0.3)", textColor: "#3b82f6", icon: <Clock size={12} /> },
    completed: { color: "rgba(34,197,94,0.15)", borderColor: "rgba(34,197,94,0.3)", textColor: "#22c55e", icon: <CheckCircle size={12} /> },
    failed: { color: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.3)", textColor: "#ef4444", icon: <XCircle size={12} /> },
    pending: { color: "rgba(168,85,247,0.08)", borderColor: "rgba(168,85,247,0.2)", textColor: "#a855f7", icon: <AlertCircle size={12} /> },
    null: { color: "transparent", borderColor: "transparent", textColor: "var(--text-muted)", icon: null },
  };

  const config = status ? statusConfig[status] : statusConfig.null;
  if (!status) return null;

  const labelMap = {
    running: "Running",
    completed: "Completed",
    failed: "Failed",
    pending: "Pending",
    null: "",
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 8px",
        borderRadius: "5px",
        background: config.color,
        border: `1px solid ${config.borderColor}`,
        fontSize: "10px",
        fontWeight: "500",
        color: config.textColor,
        animation: status === "running" ? "pulse-status 1.5s ease-in-out infinite" : "none",
      }}
    >
      {config.icon}
      <span>{labelMap[status]}</span>
    </div>
  );
}

interface PriorityBadgeProps {
  priority: "high" | "medium" | "low";
}

function PriorityBadge({ priority }: PriorityBadgeProps) {
  const priorityConfig = {
    high: { icon: <AlertTriangle size={12} />, label: "High", color: "#ef4444" },
    medium: { icon: <Minus size={12} />, label: "Medium", color: "#f59e0b" },
    low: { icon: <TrendingDown size={12} />, label: "Low", color: "#22c55e" },
  };

  const config = priorityConfig[priority];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "10px",
        fontWeight: "500",
        color: config.color,
        title: priority,
      }}
    >
      {config.icon}
    </div>
  );
}

function StatBadge({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
      <span style={{ fontSize: "18px", fontWeight: "700", color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "400" }}>{label}</span>
    </div>
  );
}

function TaskCard({
  task,
  onDragStart,
  onDragEnd,
  isDragging,
  isRecentlyUpdated,
  isExecuting,
  onClick,
  onExecute,
  onDelete,
}: {
  task: Task;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isRecentlyUpdated: boolean;
  isExecuting: boolean;
  onClick: () => void;
  onExecute: () => void;
  onDelete: () => void;
}) {
  const initials = task.assigneeInitials || (task.assignee ? task.assignee.slice(0, 2).toUpperCase() : "XX");
  const agentColor = AGENT_COLORS[initials] || { bg: "#7c3aed", text: "#fff" };
  const priorityColor = PRIORITY_COLORS[task.priority] || "#6b7280";
  const [hovered, setHovered] = useState(false);

  const executionBorder = task.executionStatus === "running"
    ? "1px solid rgba(59,130,246,0.5)"
    : task.executionStatus === "completed"
    ? "1px solid rgba(34,197,94,0.3)"
    : task.executionStatus === "failed"
    ? "1px solid rgba(239,68,68,0.4)"
    : isDragging
    ? "1px solid rgba(124,58,237,0.4)"
    : isRecentlyUpdated
    ? "1px solid rgba(34,197,94,0.4)"
    : "1px solid var(--border)";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "10px",
        borderRadius: "6px",
        background: isRecentlyUpdated
          ? "rgba(34,197,94,0.05)"
          : isDragging
          ? "rgba(124,58,237,0.15)"
          : hovered
          ? "var(--bg-secondary)"
          : "var(--bg-tertiary)",
        border: executionBorder,
        cursor: "pointer",
        opacity: isDragging ? 0.5 : 1,
        transition: "all 0.15s",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        animation: isRecentlyUpdated ? "pulse-green 1s ease-in-out" : "none",
        position: "relative",
      }}
    >
      {/* Running indicator spinner */}
      {task.executionStatus === "running" && (
        <div style={{ position: "absolute", top: "6px", right: "6px", animation: "spin 1s linear infinite" }}>
          <Clock size={14} />
        </div>
      )}

      {/* Row 1: priority badge + title */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
        <PriorityBadge priority={task.priority} />
        <span style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-primary)", lineHeight: "1.4", flex: 1, paddingRight: task.executionStatus === "running" ? "16px" : "0" }}>
          {task.title}
        </span>
      </div>

      {/* Row 2: description */}
      {task.description && (
        <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4", paddingLeft: "13px" }}>
          {task.description.length > 60 ? task.description.slice(0, 60) + "…" : task.description}
        </div>
      )}

      {/* Row 3: badge + actions (on hover) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "13px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div
            style={{ width: "16px", height: "16px", borderRadius: "50%", background: agentColor.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: "700", color: agentColor.text, flexShrink: 0 }}
          >
            {initials}
          </div>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{task.assignee}</span>
        </div>

        {hovered ? (
          <div style={{ display: "flex", gap: "4px" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); onExecute(); }}
              disabled={isExecuting || task.executionStatus === "running"}
              title="Execute task"
              style={{
                padding: "2px 6px",
                background: isExecuting ? "rgba(59,130,246,0.2)" : "rgba(124,58,237,0.8)",
                border: "none",
                borderRadius: "4px",
                color: "#fff",
                fontSize: "10px",
                cursor: isExecuting ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {isExecuting ? "…" : "▶ Run"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Delete task"
              style={{ padding: "2px 5px", background: "rgba(239,68,68,0.2)", border: "none", borderRadius: "4px", color: "#ef4444", fontSize: "10px", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        ) : (
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{timeAgo(task.updatedAt)}</span>
        )}
      </div>

      {/* Execution status badge */}
      {task.executionStatus && (
        <div style={{ paddingLeft: "13px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "6px" }}>
          <ExecutionStatusBadge status={task.executionStatus} />
          {task.executionStatus === "completed" && task.executionResult && (
            <div style={{ fontSize: "10px", color: "#22c55e", lineHeight: "1.3", marginTop: "4px" }}>
              {task.executionResult.slice(0, 80)}
            </div>
          )}
          {task.executionStatus === "failed" && (
            <div style={{ fontSize: "10px", color: "#ef4444", lineHeight: "1.3", marginTop: "4px" }}>
              Execution failed
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskDetailModal({
  task,
  isEditing,
  onEdit,
  onClose,
  onChange,
  onSave,
  onExecute,
  onDelete,
}: {
  task: Task;
  isEditing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onChange: (patch: Partial<Task>) => void;
  onSave: () => void;
  onExecute: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "480px", maxWidth: "90vw", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "80vh" }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: PRIORITY_COLORS[task.priority] || "#6b7280", flexShrink: 0 }} />
          {isEditing ? (
            <input
              value={task.title}
              onChange={(e) => onChange({ title: e.target.value })}
              style={{ flex: 1, background: "var(--bg-primary)", border: "1px solid var(--border-active)", borderRadius: "6px", padding: "6px 10px", color: "var(--text-primary)", fontSize: "14px", fontWeight: "500", outline: "none" }}
              autoFocus
            />
          ) : (
            <span style={{ flex: 1, fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{task.title}</span>
          )}
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "18px", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Description */}
          <div>
            <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>DESCRIPTION</label>
            {isEditing ? (
              <textarea
                value={task.description}
                onChange={(e) => onChange({ description: e.target.value })}
                rows={3}
                style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-active)", borderRadius: "6px", padding: "8px 10px", color: "var(--text-primary)", fontSize: "12px", outline: "none", resize: "vertical", boxSizing: "border-box" }}
              />
            ) : (
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.6" }}>{task.description || "No description."}</p>
            )}
          </div>

          {/* Meta fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <MetaField label="STATUS">
              {isEditing ? (
                <select value={task.status} onChange={(e) => onChange({ status: e.target.value as Status })} style={{ ...selectStyle, width: "100%" }}>
                  {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              ) : (
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{task.status}</span>
              )}
            </MetaField>

            <MetaField label="PRIORITY">
              {isEditing ? (
                <select value={task.priority} onChange={(e) => onChange({ priority: e.target.value as "high" | "medium" | "low" })} style={{ ...selectStyle, width: "100%" }}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              ) : (
                <span style={{ fontSize: "12px", color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
              )}
            </MetaField>

            <MetaField label="ASSIGNEE">
              {isEditing ? (
                <select value={task.assignee} onChange={(e) => onChange({ assignee: e.target.value, assigneeInitials: e.target.value.slice(0, 2).toUpperCase() })} style={{ ...selectStyle, width: "100%" }}>
                  {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              ) : (
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{task.assignee}</span>
              )}
            </MetaField>

            <MetaField label="PROJECT">
              {isEditing ? (
                <input value={task.project} onChange={(e) => onChange({ project: e.target.value })} style={{ ...selectStyle, width: "100%", outline: "none" }} />
              ) : (
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{task.project}</span>
              )}
            </MetaField>

            <MetaField label="CREATED">
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{timeAgo(task.createdAt)}</span>
            </MetaField>

            <MetaField label="UPDATED">
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{timeAgo(task.updatedAt)}</span>
            </MetaField>
          </div>

          {/* Execution status */}
          {task.executionStatus && (
            <div style={{ background: "var(--bg-primary)", borderRadius: "6px", padding: "10px 12px" }}>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>EXECUTION</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px" }}>
                  {task.executionStatus === "running" ? "⏳ Running…"
                    : task.executionStatus === "completed" ? "✅ Completed"
                    : task.executionStatus === "failed" ? "❌ Failed"
                    : "⏸ Pending"}
                </span>
              </div>
              {task.executionResult && (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "6px 0 0", lineHeight: "1.5" }}>{task.executionResult}</p>
              )}
              {task.executedAt && (
                <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "4px 0 0" }}>Started {timeAgo(task.executedAt)}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          {isEditing ? (
            <>
              <button onClick={onClose} style={btnSecondary}>Cancel</button>
              <button onClick={onSave} style={btnPrimary}>Save Changes</button>
            </>
          ) : (
            <>
              <button
                onClick={onDelete}
                style={{ ...btnSecondary, color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}
              >
                Delete
              </button>
              <button onClick={onEdit} style={btnSecondary}>Edit</button>
              <button
                onClick={onExecute}
                disabled={task.executionStatus === "running"}
                style={{ ...btnPrimary, opacity: task.executionStatus === "running" ? 0.6 : 1 }}
              >
                {task.executionStatus === "running" ? "Running…" : "▶ Execute"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: "3px", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "7px 16px",
  background: "#7c3aed",
  border: "none",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "12px",
  fontWeight: "500",
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  padding: "7px 14px",
  background: "transparent",
  border: "1px solid var(--border-active)",
  borderRadius: "6px",
  color: "var(--text-secondary)",
  fontSize: "12px",
  cursor: "pointer",
};


