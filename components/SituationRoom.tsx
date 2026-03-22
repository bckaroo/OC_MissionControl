"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, Zap, MessageCircle } from "lucide-react";

interface ModelMessage {
  id: string;
  model: string;
  modelColor: string;
  timestamp: string;
  content: string;
  type: "thinking" | "action" | "handoff" | "result";
  taskId?: string;
  taskTitle?: string;
  targetModel?: string;
}

interface ExecutingTask {
  id: string;
  title: string;
  model: string;
  modelColor: string;
  status: "backlog" | "queued" | "running" | "waiting" | "complete";
  startedAt: string;
  progress: number;
  projectId?: string;
  projectName?: string;
  priority?: string;
  assignee?: string;
}

const mockMessages: ModelMessage[] = [
  {
    id: "m1",
    model: "Haiku (Dispatcher)",
    modelColor: "#3b82f6",
    timestamp: "13:33:42",
    content: "Received request: Update dashboard styling. Analyzing task scope...",
    type: "thinking",
    taskId: "dashboard-t1",
    taskTitle: "Update dashboard styling",
  },
  {
    id: "m2",
    model: "Haiku (Dispatcher)",
    modelColor: "#3b82f6",
    timestamp: "13:33:45",
    content: "This is a styling task → routing to Qwen Coder 30B",
    type: "action",
    taskId: "dashboard-t1",
  },
  {
    id: "m3",
    model: "Haiku (Dispatcher)",
    modelColor: "#3b82f6",
    timestamp: "13:33:46",
    content: "Handing off to Qwen Coder 30B...",
    type: "handoff",
    taskId: "dashboard-t1",
    targetModel: "Qwen Coder 30B",
  },
  {
    id: "m4",
    model: "Qwen Coder 30B",
    modelColor: "#8b5cf6",
    timestamp: "13:33:47",
    content: "Task received: Update dashboard styling. Reading current styles...",
    type: "thinking",
    taskId: "dashboard-t1",
  },
  {
    id: "m5",
    model: "Qwen Coder 30B",
    modelColor: "#8b5cf6",
    timestamp: "13:33:52",
    content: "Found 12 style issues. Applying CSS fixes...",
    type: "action",
    taskId: "dashboard-t1",
  },
  {
    id: "m6",
    model: "Qwen Coder 30B",
    modelColor: "#8b5cf6",
    timestamp: "13:34:08",
    content: "Styles updated. Need code review → passing to DeepSeek R1",
    type: "handoff",
    taskId: "dashboard-t1",
    targetModel: "DeepSeek R1",
  },
  {
    id: "m7",
    model: "DeepSeek R1",
    modelColor: "#10b981",
    timestamp: "13:34:09",
    content: "Reviewing code quality and performance impact...",
    type: "thinking",
    taskId: "dashboard-t1",
  },
  {
    id: "m8",
    model: "DeepSeek R1",
    modelColor: "#10b981",
    timestamp: "13:34:15",
    content: "✅ Code review passed. No performance issues detected.",
    type: "result",
    taskId: "dashboard-t1",
  },
];

const mockExecutingTasks: ExecutingTask[] = [
  {
    id: "dashboard-t1",
    title: "Update dashboard styling",
    model: "DeepSeek R1",
    modelColor: "#10b981",
    status: "complete",
    startedAt: "13:33:42",
    progress: 100,
  },
  {
    id: "dashboard-t2",
    title: "Fix token tracker display",
    model: "Qwen Coder 30B",
    modelColor: "#8b5cf6",
    status: "running",
    startedAt: "13:34:20",
    progress: 65,
  },
  {
    id: "dashboard-t3",
    title: "Create project cards",
    model: "Haiku (Dispatcher)",
    modelColor: "#3b82f6",
    status: "running",
    startedAt: "13:34:35",
    progress: 30,
  },
];

function getMessageIcon(type: string) {
  switch (type) {
    case "thinking":
      return "🧠";
    case "action":
      return "⚙️";
    case "handoff":
      return "🤝";
    case "result":
      return "✅";
    default:
      return "💬";
  }
}

export default function SituationRoom() {
  const [messages, setMessages] = useState<ModelMessage[]>(mockMessages);
  const [tasks, setTasks] = useState<ExecutingTask[]>(mockExecutingTasks);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch real data from API
  useEffect(() => {
    const fetchSituationRoom = async () => {
      try {
        const res = await fetch("/api/situation-room");
        const data = await res.json();
        setTasks(data.executingTasks);
        setMessages(data.messages);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch situation room data:", error);
        // Fallback to mock data
        setLoading(false);
      }
    };

    // Initial fetch
    fetchSituationRoom();

    // Poll every 3 seconds for updates (lite real-time)
    const interval = setInterval(fetchSituationRoom, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: "100%", display: "flex", background: "var(--bg-primary)" }}>
      {/* Left: Active Tasks */}
      <div style={{ width: "280px", borderRight: "1px solid var(--bg-tertiary)", display: "flex", flexDirection: "column", padding: "16px" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "12px", fontWeight: "bold", color: "var(--text-primary)" }}>
          Active Tasks ({tasks.filter(t => t.status !== "complete").length})
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflow: "auto" }}>
          {/* Sections */}
          {["running", "queued", "complete"].map((section) => {
            const sectionTasks = tasks.filter(t => t.status === section);
            if (sectionTasks.length === 0) return null;

            const sectionLabel = {
              running: "🔴 Running",
              queued: "⏳ Queued",
              complete: "✅ Complete",
            }[section];

            return (
              <div key={section}>
                <div style={{ fontSize: "9px", fontWeight: "700", color: "var(--text-muted)", padding: "8px 0 4px 0", textTransform: "uppercase" }}>
                  {sectionLabel}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {sectionTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        background:
                          section === "complete"
                            ? "rgba(34,197,94,0.08)"
                            : section === "queued"
                              ? "rgba(249,115,22,0.08)"
                              : "var(--bg-secondary)",
                        padding: "10px",
                        borderRadius: "6px",
                        border: `1px solid ${task.modelColor}40`,
                        opacity: section === "complete" ? 0.6 : 1,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: task.modelColor,
                            animation: section === "running" ? "pulse 2s infinite" : "none",
                          }}
                        />
                        <span style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-primary)" }}>
                          {task.title}
                        </span>
                      </div>

                      {/* Project context */}
                      {task.projectName && (
                        <div style={{ fontSize: "8px", color: task.modelColor, fontWeight: "600", marginBottom: "3px" }}>
                          📁 {task.projectName}
                        </div>
                      )}

                      {/* Model + Priority + Assignee */}
                      <div style={{ fontSize: "9px", color: "var(--text-muted)", marginBottom: "4px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span>{task.model}</span>
                        {task.priority && (
                          <span style={{ background: `${task.modelColor}20`, padding: "1px 4px", borderRadius: "2px", fontSize: "8px" }}>
                            {task.priority.toUpperCase()}
                          </span>
                        )}
                        {task.assignee && (
                          <span style={{ opacity: 0.7 }}>→ {task.assignee}</span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div style={{ height: "4px", background: "var(--bg-tertiary)", borderRadius: "2px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${task.progress}%`,
                            background: task.modelColor,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>

                      <div style={{ fontSize: "8px", color: "var(--text-muted)", marginTop: "3px" }}>
                        {task.progress}% • {task.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Model Conversation */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Messages */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {messages.map((msg, idx) => {
            const nextMsg = messages[idx + 1];
            const isHandoff = msg.type === "handoff";
            const nextIsDifferentModel = nextMsg && nextMsg.model !== msg.model;

            return (
              <div key={msg.id}>
                {/* Message */}
                <div style={{ display: "flex", gap: "10px" }}>
                  {/* Model indicator */}
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      background: `${msg.modelColor}20`,
                      border: `1px solid ${msg.modelColor}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      flexShrink: 0,
                    }}
                  >
                    {getMessageIcon(msg.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: msg.modelColor }}>
                        {msg.model}
                      </span>
                      <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                        {msg.timestamp}
                      </span>
                    </div>

                    <div
                      style={{
                        background: "var(--bg-secondary)",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        lineHeight: "1.5",
                        borderLeft: `3px solid ${msg.modelColor}`,
                      }}
                    >
                      {msg.content}
                    </div>

                    {msg.taskTitle && (
                      <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Task: {msg.taskTitle}
                      </div>
                    )}
                  </div>
                </div>

                {/* Handoff Arrow */}
                {isHandoff && nextIsDifferentModel && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 0" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        background: "rgba(124,90,244,0.1)",
                        borderRadius: "20px",
                        fontSize: "10px",
                        fontWeight: "600",
                        color: "var(--accent-purple)",
                      }}
                    >
                      <ArrowRight size={12} />
                      Handing off to {nextMsg?.model}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - Future enhancement */}
        <div style={{ borderTop: "1px solid var(--bg-tertiary)", padding: "12px 20px", background: "var(--bg-secondary)" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", textAlign: "center" }}>
            Real-time model conversation stream • Updates every second
          </div>
        </div>
      </div>
    </div>
  );
}
