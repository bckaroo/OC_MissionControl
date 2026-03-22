"use client";

import { useState, useEffect } from "react";
import { BookOpen, Code, Monitor, Zap, FileCode } from "lucide-react";

interface CustomSkill {
  id: string;
  name: string;
  category: string;
  status: "production" | "development";
  statusLabel: string;
  description: string;
  features: string[];
  author: string;
  language?: string;
  overview?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Specialist {
  id: string;
  name: string;
  emoji: string;
  role: string;
  model: string;
  specialties: string[];
}

interface Tool {
  id: string;
  name: string;
  path: string;
  type: "script" | "executable" | "utility";
  language: "python" | "powershell" | "bash" | "javascript" | "other";
  category: string;
  description: string;
  lastModified: string;
  size: number;
  executable: boolean;
  tags: string[];
  preview: string;
}

// Custom Skills
const CUSTOM_SKILLS: CustomSkill[] = [
  {
    id: "lossless-claw",
    name: "Lossless Claw",
    category: "Infrastructure",
    status: "production",
    statusLabel: "Ready",
    description: "Rate-limit resilient HTTP client with smart retry logic",
    features: ["Rate Limit Recovery", "Smart Retry Logic", "Parallel Queuing"],
    author: "XiaoZhu",
    language: "TypeScript",
    overview: "HTTP client wrapper that handles 429 rate limits gracefully with exponential backoff, dual-mode integration (API + local), and parallel request queuing for high-throughput scenarios.",
    createdAt: "2026-02-15T09:30:00Z",
    updatedAt: "2026-03-20T14:22:00Z",
  },
  {
    id: "model-status",
    name: "Model Status Report",
    category: "Monitoring",
    status: "production",
    statusLabel: "Ready",
    description: "Real-time model status dashboard with cost breakdown",
    features: ["Live Verification", "Cost Breakdown", "Fallback Chain View"],
    author: "XiaoZhu",
    language: "TypeScript",
    overview: "Dashboard component that verifies model availability across Anthropic, LMStudio, and Ollama endpoints. Displays fallback chains, cost per model, context windows, and color-coded health status.",
    createdAt: "2026-02-20T11:45:00Z",
    updatedAt: "2026-03-21T10:15:00Z",
  },
  {
    id: "channel-router",
    name: "Channel Router",
    category: "Communication",
    status: "production",
    statusLabel: "Ready",
    description: "Route messages to Discord, Telegram, Signal channels",
    features: ["Multi-Channel", "Smart Routing", "Auto-Format"],
    author: "XiaoZhu",
    language: "TypeScript",
    overview: "OpenClaw plugin that routes messages to Discord, Telegram, Signal, WhatsApp, and IRC. Auto-formats content per platform (removes tables for Telegram, wraps links in <>, etc.)",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-03-19T16:30:00Z",
  },
  {
    id: "error-monitor",
    name: "Error Monitor",
    category: "Monitoring",
    status: "production",
    statusLabel: "Ready",
    description: "Track and alert on system errors with context",
    features: ["Real-time Alerts", "Error Context", "Trend Analysis"],
    author: "XiaoZhu",
    language: "TypeScript",
    overview: "Captures unhandled errors, logs them with full context (user, session, request), stores in error-log.jsonl, and sends alerts to Discord with stack traces and reproduction steps.",
    createdAt: "2026-02-25T13:20:00Z",
    updatedAt: "2026-03-18T09:45:00Z",
  },
  {
    id: "mode-switcher",
    name: "Mode Switcher",
    category: "Infrastructure",
    status: "production",
    statusLabel: "Ready",
    description: "Switch between cost-saving and performance modes",
    features: ["Token Tracking", "Auto-Switch", "Usage Reports"],
    author: "XiaoZhu",
    language: "PowerShell",
    overview: "Monitors API token usage in real-time. Auto-switches from Sonnet (performance) to Haiku (cost-saving) when tokens exceed threshold. Manual mode override available.",
    createdAt: "2026-03-01T07:15:00Z",
    updatedAt: "2026-03-22T08:30:00Z",
  },
  {
    id: "memory-sync",
    name: "Memory Sync",
    category: "Data",
    status: "production",
    statusLabel: "Ready",
    description: "Sync memory files across sessions with versioning",
    features: ["Auto-Sync", "Versioning", "Diff Tracking"],
    author: "XiaoZhu",
    language: "TypeScript",
    overview: "Syncs daily memory files (memory/YYYY-MM-DD.md) and long-term MEMORY.md with Git-style versioning. Tracks diffs, detects conflicts, and merges across multiple sessions.",
    createdAt: "2026-02-10T14:00:00Z",
    updatedAt: "2026-03-20T12:30:00Z",
  },
  {
    id: "cron-manager",
    name: "Cron Manager",
    category: "Automation",
    status: "production",
    statusLabel: "Ready",
    description: "Create, schedule, and monitor cron jobs",
    features: ["Job Scheduling", "Health Checks", "Run History"],
    author: "XiaoZhu",
    language: "TypeScript",
    overview: "Full cron job lifecycle management. Define schedules (cron expr, every X ms, one-shot), payload (system events or agent turns), delivery (Discord announce, webhooks), with automatic retry logic.",
    createdAt: "2026-02-05T10:22:00Z",
    updatedAt: "2026-03-22T06:45:00Z",
  },
];

const SPECIALISTS: Specialist[] = [
  {
    id: "xiaozhu",
    name: "xiaozhu 🐖",
    emoji: "🐖",
    role: "Chief Dispatcher",
    model: "qwen3.5-9b (32K ctx)",
    specialties: ["Local-first routing", "90%+ task handling", "Cost optimization"],
  },
  {
    id: "xiaoya",
    name: "xiaoya 🪳",
    emoji: "🪳",
    role: "Coder",
    model: "qwen3-coder-30b (32K ctx)",
    specialties: ["Code generation", "Debugging", "Development tasks"],
  },
  {
    id: "xiaohu",
    name: "xiaohu 🪳",
    emoji: "🪳",
    role: "Reasoner",
    model: "deepseek-r1-8b (65K ctx)",
    specialties: ["Deep analysis", "Problem solving", "Complex reasoning"],
  },
  {
    id: "xiaomao",
    name: "xiaomao 🪳",
    emoji: "🪳",
    role: "Writer",
    model: "qwen3-coder-30b (32K ctx)",
    specialties: ["Documentation", "Content creation", "Long-form writing"],
  },
  {
    id: "xiaoshe",
    name: "xiaoshe 🪳",
    emoji: "🪳",
    role: "Vision & ETL",
    model: "qwen3-vl-30b (32K ctx + img)",
    specialties: ["Image analysis", "Data transformation", "Multimodal tasks"],
  },
];

const TOOLS: Tool[] = [];
// NOTE: Full audit requires exec approval to scan .openclaw folder structure
// Known tools to document:
// - migrate-tasks.py (workspace/scripts) — Data migration
// - Other skills may contain Python files in their /scripts directories
// Pending: Complete filesystem scan to populate this section with real tools

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Infrastructure: { bg: "rgba(168,85,247,0.12)", text: "#d8b4fe", border: "rgba(168,85,247,0.35)" },
  Monitoring: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(59,130,246,0.35)" },
  Communication: { bg: "rgba(34,197,94,0.12)", text: "#4ade80", border: "rgba(34,197,94,0.35)" },
  Data: { bg: "rgba(236,72,153,0.12)", text: "#f472b6", border: "rgba(236,72,153,0.35)" },
  Automation: { bg: "rgba(249,115,22,0.12)", text: "#fb923c", border: "rgba(249,115,22,0.35)" },
  "Token Management": { bg: "rgba(14,165,233,0.12)", text: "#38bdf8", border: "rgba(14,165,233,0.35)" },
  "Data Migration": { bg: "rgba(168,85,247,0.12)", text: "#d8b4fe", border: "rgba(168,85,247,0.35)" },
  DevOps: { bg: "rgba(249,115,22,0.12)", text: "#fb923c", border: "rgba(249,115,22,0.35)" },
  Configuration: { bg: "rgba(236,72,153,0.12)", text: "#f472b6", border: "rgba(236,72,153,0.35)" },
  "Data Management": { bg: "rgba(34,197,94,0.12)", text: "#4ade80", border: "rgba(34,197,94,0.35)" },
  Reporting: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(59,130,246,0.35)" },
};

const TOOL_TYPE_ICONS: Record<string, string> = {
  python: "🐍",
  cli: "⌨️",
  script: "📜",
  executable: "⚙️",
};

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

function formatToolTitle(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]/g, " ")
    .replace(/\b(\w)/g, (c) => c.toUpperCase());
}

export default function SkillsScreen() {
  const [activeTab, setActiveTab] = useState<"custom" | "specialists" | "tools">("custom");
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolCategories, setToolCategories] = useState<string[]>([]);
  const [filterToolCategory, setFilterToolCategory] = useState("all");
  const [flippedTools, setFlippedTools] = useState<Set<string>>(new Set());

  const toggleFlipTool = (toolId: string) => {
    const newFlipped = new Set(flippedTools);
    if (newFlipped.has(toolId)) {
      newFlipped.delete(toolId);
    } else {
      newFlipped.add(toolId);
    }
    setFlippedTools(newFlipped);
  };

  // Fetch tools when tools tab is active
  useEffect(() => {
    if (activeTab !== "tools") return;

    const fetchTools = async () => {
      setToolsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterToolCategory !== "all") params.append("category", filterToolCategory);

        const res = await fetch(`/api/tools?${params.toString()}`);
        const data = await res.json();
        setTools(data.tools || []);
        setToolCategories(data.categories || []);
        setToolsLoading(false);
      } catch (error) {
        console.error("Failed to fetch tools:", error);
        setToolsLoading(false);
      }
    };

    fetchTools();
  }, [activeTab, filterToolCategory]);

  const toggleFlip = (cardId: string) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(cardId)) {
      newFlipped.delete(cardId);
    } else {
      newFlipped.add(cardId);
    }
    setFlippedCards(newFlipped);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ padding: "20px", borderBottom: "1px solid var(--bg-tertiary)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <BookOpen size={24} color="var(--accent-purple)" />
          <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "var(--text-primary)", margin: 0 }}>
            Skills & Agents
          </h1>
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          Manage custom skills and specialist agents
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "8px", padding: "12px 20px", borderBottom: "1px solid var(--bg-tertiary)", background: "var(--bg-secondary)", overflowX: "auto" }}>
        {[
          { id: "custom", label: "Custom Skills", count: CUSTOM_SKILLS.length },
          { id: "specialists", label: "Specialist Agents", count: SPECIALISTS.length },
          { id: "tools", label: "Tools", count: tools.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: activeTab === tab.id ? "2px solid var(--accent-purple)" : "1px solid var(--bg-tertiary)",
              background: activeTab === tab.id ? "var(--accent-purple)" : "transparent",
              color: activeTab === tab.id ? "white" : "var(--text-secondary)",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        {activeTab === "custom" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
            {CUSTOM_SKILLS.map((skill) => {
              const colors = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.Infrastructure;
              const isFlipped = flippedCards.has(skill.id);

              return (
                <div
                  key={skill.id}
                  onClick={() => toggleFlip(skill.id)}
                  style={{
                    position: "relative",
                    height: "300px",
                    cursor: "pointer",
                    perspective: "1000px",
                  }}
                >
                  {/* Flip Card Container */}
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      transition: "transform 0.6s",
                      transformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* Front */}
                    <div
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        background: "var(--bg-secondary)",
                        border: `1px solid var(--bg-tertiary)`,
                        borderRadius: "8px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                        <div>
                          <h3 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>
                            {skill.name}
                          </h3>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            by {skill.author}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "4px 8px",
                            background: "rgba(34,197,94,0.15)",
                            border: "1px solid rgba(34,197,94,0.35)",
                            borderRadius: "4px",
                            fontSize: "10px",
                            color: "#4ade80",
                            fontWeight: "600",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ✅ {skill.statusLabel}
                        </div>
                      </div>

                      {/* Timestamps */}
                      {(skill.createdAt || skill.updatedAt) && (
                        <div style={{ display: "flex", gap: "12px", fontSize: "10px", color: "var(--text-muted)" }}>
                          {skill.createdAt && (
                            <div>
                              <span style={{ fontWeight: "600" }}>Created:</span> {timeAgo(skill.createdAt)}
                            </div>
                          )}
                          {skill.updatedAt && (
                            <div>
                              <span style={{ fontWeight: "600" }}>Updated:</span> {timeAgo(skill.updatedAt)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Category + Language */}
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            padding: "4px 10px",
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: "4px",
                            fontSize: "11px",
                            color: colors.text,
                            fontWeight: "600",
                          }}
                        >
                          {skill.category}
                        </div>
                        {skill.language && (
                          <div
                            style={{
                              display: "inline-flex",
                              padding: "4px 10px",
                              background: "rgba(124,90,244,0.12)",
                              border: "1px solid rgba(124,90,244,0.35)",
                              borderRadius: "4px",
                              fontSize: "11px",
                              color: "#d8b4fe",
                              fontWeight: "600",
                            }}
                          >
                            {skill.language}
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p style={{ margin: "0", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                        {skill.description}
                      </p>

                      {/* Features */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {skill.features.map((feature, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
                            <div
                              style={{
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                                background: colors.text,
                                flexShrink: 0,
                              }}
                            />
                            {feature}
                          </div>
                        ))}
                      </div>

                      {/* Click to flip hint */}
                      <div style={{ marginTop: "auto", fontSize: "10px", color: "var(--text-muted)", textAlign: "center" }}>
                        Click to see overview →
                      </div>
                    </div>

                    {/* Back */}
                    <div
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        background: "var(--bg-secondary)",
                        border: `1px solid var(--bg-tertiary)`,
                        borderRadius: "8px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        overflow: "hidden",
                      }}
                    >
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "bold", color: "var(--text-primary)" }}>
                        Overview
                      </h3>
                      <p style={{ margin: "0", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6", flex: 1, overflowY: "auto" }}>
                        {skill.overview || skill.description}
                      </p>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", textAlign: "center" }}>
                        ← Click to flip back
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "specialists" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Local Specialists Section */}
            <div>
              <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                🏠 Local Specialists (Primary)
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                {SPECIALISTS.map((agent) => (
                  <div
                    key={agent.id}
                    style={{
                      background: "var(--bg-secondary)",
                      border: `1px solid var(--bg-tertiary)`,
                      borderRadius: "8px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ fontSize: "28px" }}>{agent.emoji}</div>
                      <div>
                        <h3 style={{ margin: "0", fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>
                          {agent.name}
                        </h3>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          {agent.role}
                        </div>
                      </div>
                    </div>

                    {/* Model */}
                    <div
                      style={{
                        padding: "8px 10px",
                        background: "var(--bg-tertiary)",
                        borderRadius: "4px",
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <div style={{ fontWeight: "600", marginBottom: "3px" }}>Model</div>
                      <code style={{ color: "var(--accent-purple)" }}>{agent.model}</code>
                    </div>

                    {/* Specialties */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)" }}>Specialties</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {agent.specialties.map((specialty, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "4px 8px",
                              background: "rgba(124,90,244,0.12)",
                              border: "1px solid rgba(124,90,244,0.35)",
                              borderRadius: "4px",
                              fontSize: "10px",
                              color: "#d8b4fe",
                            }}
                          >
                            {specialty}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* API Specialists Section */}
            <div>
              <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                🚨 API Specialists (Escalation Only)
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
                Used only when local models hit capacity limits or task requires advanced tool use
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                {[
                  { name: "Haiku 4.5", emoji: "⚡", role: "Fast & Cheap", cost: "~$0.25/M", model: "claude-haiku-4-5", specialties: ["Tool planning", "Quick analysis", "Low-cost escalation"], color: "#22c55e" },
                  { name: "Sonnet 4.6", emoji: "⚖️", role: "Balanced", cost: "~$3.00/M", model: "claude-sonnet-4-6", specialties: ["Complex tasks", "Balanced reasoning", "Multi-step problems"], color: "#3b82f6" },
                  { name: "Opus 4.6", emoji: "🧠", role: "Deep Reasoning", cost: "~$15.00/M", model: "claude-opus-4-6", specialties: ["Hard problems", "Advanced reasoning", "Expert analysis"], color: "#f59e0b" },
                ].map((agent) => (
                  <div
                    key={agent.name}
                    style={{
                      background: "var(--bg-secondary)",
                      border: `2px solid ${agent.color}40`,
                      borderRadius: "8px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ fontSize: "28px" }}>{agent.emoji}</div>
                      <div>
                        <h3 style={{ margin: "0", fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>
                          {agent.name}
                        </h3>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          {agent.role}
                        </div>
                      </div>
                    </div>

                    {/* Cost */}
                    <div
                      style={{
                        padding: "8px 10px",
                        background: "var(--bg-tertiary)",
                        borderRadius: "4px",
                        fontSize: "11px",
                        color: agent.color,
                        fontWeight: "600",
                      }}
                    >
                      {agent.cost}
                    </div>

                    {/* Model */}
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                      <code style={{ color: "var(--accent-purple)" }}>{agent.model}</code>
                    </div>

                    {/* Specialties */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)" }}>Specialties</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {agent.specialties.map((specialty, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "4px 8px",
                              background: `${agent.color}20`,
                              border: `1px solid ${agent.color}60`,
                              borderRadius: "4px",
                              fontSize: "10px",
                              color: agent.color,
                            }}
                          >
                            {specialty}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "tools" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Filters */}
            {tools.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <select
                  value={filterToolCategory}
                  onChange={(e) => setFilterToolCategory(e.target.value)}
                  style={{
                    padding: "7px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.06)",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <option value="all">All Categories</option>
                  {toolCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {toolsLoading ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  background: "var(--bg-secondary)",
                  borderRadius: "8px",
                  border: "1px solid var(--bg-tertiary)",
                }}
              >
                <div style={{ fontSize: "20px", marginBottom: "12px" }}>⏳</div>
                <p style={{ margin: "0", fontSize: "12px", color: "var(--text-muted)" }}>
                  Scanning workspace for scripts...
                </p>
              </div>
            ) : tools.length === 0 ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  background: "var(--bg-secondary)",
                  borderRadius: "8px",
                  border: "1px solid var(--bg-tertiary)",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔧</div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)" }}>
                  No Tools Found
                </h3>
                <p style={{ margin: "0", fontSize: "12px", color: "var(--text-muted)" }}>
                  No Python, PowerShell, or shell scripts detected in workspace
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
                {tools.map((tool) => {
                  const colors = CATEGORY_COLORS[tool.category] || CATEGORY_COLORS.Infrastructure;
                  const langIcons: Record<string, string> = { python: "🐍", powershell: "⚙️", bash: "🐚", javascript: "📜", other: "📝" };
                  const isFlipped = flippedTools.has(tool.id);

                  return (
                    <div
                      key={tool.id}
                      onClick={() => toggleFlipTool(tool.id)}
                      style={{
                        position: "relative",
                        height: "340px",
                        cursor: "pointer",
                        perspective: "1000px",
                      }}
                    >
                      {/* Flip Card Container */}
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          transition: "transform 0.6s",
                          transformStyle: "preserve-3d",
                          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                        }}
                      >
                        {/* Front */}
                        <div
                          style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            backfaceVisibility: "hidden",
                            background: "var(--bg-secondary)",
                            border: `1px solid var(--bg-tertiary)`,
                            borderRadius: "8px",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          {/* Two-column layout */}
                          <div style={{ display: "flex", gap: "16px", flex: 1 }}>
                            {/* Left column: Title, filename, badges, metadata, tags */}
                            <div style={{ flex: 0.45, display: "flex", flexDirection: "column", gap: "10px" }}>
                              {/* Title + Status badge */}
                              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                <div style={{ flex: 1 }}>
                                  <h3 style={{ margin: "0 0 3px 0", fontSize: "13px", fontWeight: "bold", color: "var(--text-primary)" }}>
                                    {formatToolTitle(tool.name)}
                                  </h3>
                                  <div style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                    {tool.name}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    padding: "3px 6px",
                                    background: tool.executable ? "rgba(34,197,94,0.15)" : "rgba(107,114,128,0.15)",
                                    border: tool.executable ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(107,114,128,0.35)",
                                    borderRadius: "4px",
                                    fontSize: "10px",
                                    color: tool.executable ? "#4ade80" : "#9ca3af",
                                    fontWeight: "600",
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                  }}
                                >
                                  {tool.executable ? "✅" : "📄"}
                                </div>
                              </div>

                              {/* Category + Language badges */}
                              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                <div
                                  style={{
                                    display: "inline-flex",
                                    padding: "3px 8px",
                                    background: colors.bg,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: "4px",
                                    fontSize: "9px",
                                    color: colors.text,
                                    fontWeight: "600",
                                  }}
                                >
                                  {tool.category}
                                </div>
                                <div
                                  style={{
                                    display: "inline-flex",
                                    padding: "3px 8px",
                                    background: "rgba(124,90,244,0.12)",
                                    border: "1px solid rgba(124,90,244,0.35)",
                                    borderRadius: "4px",
                                    fontSize: "9px",
                                    color: "#d8b4fe",
                                    fontWeight: "600",
                                  }}
                                >
                                  {tool.language}
                                </div>
                              </div>

                              {/* Metadata row */}
                              <div style={{ display: "flex", gap: "12px", fontSize: "8px", color: "var(--text-muted)" }}>
                                <div>{timeAgo(tool.lastModified)}</div>
                                <div>{(tool.size / 1024).toFixed(1)} KB</div>
                              </div>

                              {/* Tags */}
                              {tool.tags && tool.tags.length > 0 && (
                                <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                                  {tool.tags.slice(0, 3).map((tag) => (
                                    <div
                                      key={tag}
                                      style={{
                                        padding: "1px 5px",
                                        background: "rgba(168,85,247,0.12)",
                                        border: "1px solid rgba(168,85,247,0.35)",
                                        borderRadius: "3px",
                                        fontSize: "8px",
                                        color: "#d8b4fe",
                                      }}
                                    >
                                      #{tag}
                                    </div>
                                  ))}
                                  {tool.tags.length > 3 && (
                                    <div style={{ fontSize: "8px", color: "var(--text-muted)" }}>
                                      +{tool.tags.length - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Right column: Description */}
                            <div style={{ flex: 0.55, display: "flex", flexDirection: "column" }}>
                              <p style={{ margin: "0", fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                                {tool.description || "No description available."}
                              </p>
                            </div>
                          </div>

                          {/* Click to flip hint */}
                          <div style={{ fontSize: "9px", color: "var(--text-muted)", textAlign: "center", marginTop: "12px" }}>
                            Click to see details →
                          </div>
                        </div>

                        {/* Back */}
                        <div
                          style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                            background: "var(--bg-secondary)",
                            border: `1px solid var(--bg-tertiary)`,
                            borderRadius: "8px",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            overflow: "hidden",
                          }}
                        >
                          {/* Title */}
                          <h3 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "bold", color: "var(--text-primary)" }}>
                            Details
                          </h3>

                          {/* Scrollable content */}
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.6", flex: 1, overflowY: "auto" }}>
                            {/* Description */}
                            <p style={{ margin: "0 0 10px 0" }}>
                              {tool.description}
                            </p>

                            {/* Location */}
                            <div style={{ marginBottom: "10px" }}>
                              <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "4px" }}>
                                📍 Location
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontFamily: "monospace", background: "rgba(0,0,0,0.3)", padding: "6px 8px", borderRadius: "4px" }}>
                                {tool.path}
                              </div>
                            </div>

                            {/* Metadata */}
                            <div style={{ marginBottom: "10px" }}>
                              <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "4px" }}>
                                ℹ️ Metadata
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "10px" }}>
                                <div><span style={{ fontWeight: "600" }}>Size:</span> {(tool.size / 1024).toFixed(1)} KB</div>
                                <div><span style={{ fontWeight: "600" }}>Language:</span> {tool.language}</div>
                                <div><span style={{ fontWeight: "600" }}>Executable:</span> {tool.executable ? "✅ Yes" : "❌ No"}</div>
                              </div>
                            </div>

                            {/* Linked Skills */}
                            <div style={{ marginBottom: "10px" }}>
                              <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "4px" }}>
                                🎯 Linked Skills
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                                (Integration pending)
                              </div>
                            </div>

                            {/* Linked Cron Jobs */}
                            <div style={{ marginBottom: "10px" }}>
                              <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "4px" }}>
                                ⏰ Linked Cron Jobs
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                                (Integration pending)
                              </div>
                            </div>

                            {/* Code Snippet */}
                            {tool.preview && (
                              <div>
                                <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "4px" }}>
                                  💻 Code Preview
                                </div>
                                <div style={{
                                  padding: "8px",
                                  background: "rgba(0,0,0,0.4)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  borderRadius: "4px",
                                  fontSize: "8px",
                                  color: "#888",
                                  fontFamily: "monospace",
                                  overflow: "hidden",
                                  maxHeight: "60px",
                                  overflowY: "auto",
                                  lineHeight: "1.3",
                                }}>
                                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#aaa" }}>
                                    {tool.preview}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Click to flip back */}
                          <div style={{ fontSize: "10px", color: "var(--text-muted)", textAlign: "center", marginTop: "4px" }}>
                            ← Click to flip back
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
