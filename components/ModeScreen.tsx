"use client";

import { useState, useEffect } from "react";
import { useModelTokens } from "@/hooks/useModelTokens";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Zap,
  Brain,
  Code,
  Eye,
  Layers,
  RefreshCw,
} from "lucide-react";

interface Model {
  id: string;
  name: string;
  provider: string;
  type: string;
  speed: string;
  context: string;
  contextTokens: number;
  isLocal: boolean;
  active: boolean;
  isPrimary: boolean;
  isFallback: boolean;
  loaded?: boolean;
  cost: string;
  capabilities: string[];
}

interface ModelsData {
  models: Model[];
  primaryModel: string | null;
  fallbacks: string[];
  lmLiveModels: string[];
}

const PROVIDER_COLORS: Record<string, string> = {
  "Anthropic": "#d97706",
  "LM Studio": "#8b5cf6",
  "Ollama": "#10b981",
};

const MODEL_SUMMARIES: Record<string, { tagline: string; summary: string; facts: string[] }> = {
  "anthropic/claude-sonnet-4-6": {
    tagline: "Your primary workhorse",
    summary: "Claude Sonnet 4.6 is Anthropic's balanced powerhouse — fast enough for real-time use, smart enough for complex reasoning. It handles long documents, nuanced analysis, and multi-step tasks with high reliability. This is the model running most of your daily interactions.",
    facts: ["200K token context window", "Best cost-to-intelligence ratio", "Supports extended thinking", "~$3 input / $15 output per 1M tokens"],
  },
  "anthropic/claude-haiku-4-5": {
    tagline: "Speed demon fallback",
    summary: "Claude Haiku 4.5 is Anthropic's fastest and most affordable model. Perfect for quick responses, routing decisions, and high-volume tasks where speed matters more than depth. It's your fallback when you need answers in milliseconds.",
    facts: ["200K token context window", "Fastest Anthropic model", "Ultra-low cost at $0.25/$1.25 per 1M tokens", "Ideal for Discord & chat interfaces"],
  },
  "anthropic/claude-opus-4-6": {
    tagline: "Maximum intelligence, maximum cost",
    summary: "Claude Opus 4.6 is Anthropic's most capable model — reserved for the hardest problems. It excels at PhD-level reasoning, intricate coding challenges, and tasks requiring deep synthesis. Use it sparingly; it costs 60x more than Haiku.",
    facts: ["200K token context window", "Highest reasoning capability", "Extended thinking support", "$15 input / $75 output per 1M tokens"],
  },
  "lmstudio/qwen/qwen3.5-9b": {
    tagline: "Fast local model for everyday tasks",
    summary: "Qwen 3.5 9B is a compact but capable local model from Alibaba. It runs entirely on your hardware at zero cost, making it ideal for heartbeat checks, quick summaries, and light-duty tasks. Think of it as a free Haiku that never leaves your machine.",
    facts: ["9 billion parameters", "32K context window", "Zero API cost", "Heartbeat model for background checks"],
  },
  "lmstudio/qwen/qwen3-coder-30b": {
    tagline: "Heavy-duty local code model",
    summary: "Qwen 3 Coder 30B is a large coding-specialized model optimized for software development tasks. It handles complex refactors, debugging, and architecture questions with impressive depth. Slower than smaller models but significantly more capable for technical work.",
    facts: ["30 billion parameters", "32K context window", "Optimized for code generation", "Runs fully offline — no data leaves your machine"],
  },
  "lmstudio/deepseek/deepseek-r1-0528-qwen3-8b": {
    tagline: "Open-source reasoning powerhouse",
    summary: "DeepSeek R1 is an open-source model with chain-of-thought reasoning built in. It rivals much larger models on math, logic, and scientific reasoning by thinking step-by-step before answering. A strong local alternative for analytical tasks.",
    facts: ["8 billion parameters (distilled from larger R1)", "64K context window", "Chain-of-thought reasoning built in", "Free, runs fully locally"],
  },
  "ollama/qwen3.5": {
    tagline: "Long-context local with vision",
    summary: "Qwen 3.5 via Ollama offers a massive 256K context window — the largest of any local model in your stack. It also supports image inputs, making it your go-to for analyzing documents, long codebases, or visual content without sending data to the cloud.",
    facts: ["256K context window (largest local)", "Supports image input", "Runs via Ollama", "Zero cost, full privacy"],
  },
  "ollama/minimax-m2.7:cloud": {
    tagline: "Cloud-backed reasoning via Ollama",
    summary: "Minimax M2.7 is a reasoning-optimized model accessed via Ollama's cloud relay. It offers strong logical reasoning capabilities with a 200K context window. Unlike fully local models, this one routes through Minimax's cloud infrastructure.",
    facts: ["200K context window", "Reasoning-optimized architecture", "Cloud-backed (not fully local)", "Accessed through Ollama"],
  },
  "lmstudio/gemma-2-9b-it": {
    tagline: "Google's compact open model",
    summary: "Gemma 2 9B is Google's open-weight model built on the same research foundations as Gemini. It delivers strong general-purpose performance in a compact 9B package, making it a capable and efficient local alternative for chat and reasoning tasks.",
    facts: ["9 billion parameters", "32K context window", "Google DeepMind architecture", "Free, fully local"],
  },
  "lmstudio/gemma-3-12b-it": {
    tagline: "Google's latest open model — vision capable",
    summary: "Gemma 3 12B is Google's newest open-weight model with multimodal support. It handles both text and image inputs, making it one of the most capable local vision models available. A significant upgrade from Gemma 2 with improved instruction following.",
    facts: ["12 billion parameters", "32K context window", "Supports image inputs", "Free, fully local"],
  },
  "lmstudio/nemotron-3-nano-4b": {
    tagline: "NVIDIA's ultra-compact model",
    summary: "Nemotron 3 Nano is NVIDIA's tiny 4B model optimized for speed over depth. It has a very limited 4K context window, making it unsuitable for tasks involving large files or long conversations. Best used only for ultra-fast, simple single-turn queries.",
    facts: ["4 billion parameters", "⚠️ Only 4K context window", "Risk of context overflow on long tasks", "NVIDIA NeMo architecture"],
  },
  "lmstudio/qwen/qwen3-vl-30b": {
    tagline: "Vision-language giant",
    summary: "Qwen 3 VL 30B is a large multimodal model that handles both text and images with impressive accuracy. It excels at OCR, image analysis, chart reading, and document understanding. One of the most capable local vision models you can run.",
    facts: ["30 billion parameters", "32K context window", "Supports image + text input", "Free, fully local"],
  },
};

const TYPE_CONFIG: Record<string, { icon: JSX.Element; color: string; label: string }> = {
  general:   { icon: <Zap size={14} />,    color: "#10b981", label: "General" },
  reasoning: { icon: <Brain size={14} />,  color: "#8b5cf6", label: "Reasoning" },
  coding:    { icon: <Code size={14} />,   color: "#3b82f6", label: "Coding" },
  vision:    { icon: <Eye size={14} />,    color: "#f59e0b", label: "Vision" },
  embedded:  { icon: <Layers size={14} />, color: "#ec4899", label: "Embedding" },
};

const SPEED_COLOR: Record<string, string> = {
  fast:   "#4ade80",
  medium: "#fbbf24",
  slow:   "#f87171",
};

export default function ModeScreen() {
  const [data, setData] = useState<ModelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tokens, cooldowns } = useModelTokens();
  const [activeTab, setActiveTab] = useState<"overview" | "usage" | "limits">("overview");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterProvider, setFilterProvider] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  async function refresh() {
    try {
      const res = await fetch("/api/models/config");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const models = data?.models || [];
  const filtered = models.filter(m => {
    if (filterType && m.type !== filterType) return false;
    if (filterProvider && m.provider !== filterProvider) return false;
    return true;
  });

  const providers = [...new Set(models.map(m => m.provider))];
  const types = [...new Set(models.map(m => m.type))];
  const totalLocal = models.filter(m => m.isLocal).length;
  const totalApi = models.filter(m => !m.isLocal).length;
  const lmLoaded = models.filter(m => m.provider === "LM Studio" && m.loaded).length;

  return (
    <div style={{ padding: "24px", overflowY: "auto", height: "100%", background: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
            🧠 Models
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            {models.length} configured across {providers.length} providers
            {lastRefresh && ` · refreshed ${lastRefresh.toLocaleTimeString()}`}
          </p>
        </div>
        <button
          onClick={refresh}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 12px", borderRadius: "6px",
            border: "1px solid var(--border)",
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
            fontSize: "12px", cursor: "pointer",
          }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "6px" }}>TOTAL MODELS</div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--text-primary)" }}>{models.length}</div>
        </div>
        <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "6px" }}>LOCAL (FREE)</div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#4ade80" }}>{totalLocal}</div>
        </div>
        <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "6px" }}>API MODELS</div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#f59e0b" }}>{totalApi}</div>
        </div>
        <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "6px" }}>LM LOADED</div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#8b5cf6" }}>{lmLoaded}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", marginBottom: "20px", borderBottom: "1px solid var(--border)" }}>
        {(["overview", "usage", "limits"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 16px",
              borderBottom: activeTab === tab ? "2px solid var(--accent-purple)" : "2px solid transparent",
              background: "none", border: "none",
              color: activeTab === tab ? "var(--accent-purple)" : "var(--text-muted)",
              fontSize: "12px", fontWeight: "600", cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>

          {/* Filters */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
            <button
              onClick={() => { setFilterProvider(null); setFilterType(null); }}
              style={{
                padding: "5px 10px", borderRadius: "5px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
                border: !filterProvider && !filterType ? "1px solid var(--accent-purple)" : "1px solid var(--border)",
                background: !filterProvider && !filterType ? "rgba(139,92,246,0.15)" : "transparent",
                color: !filterProvider && !filterType ? "var(--accent-purple)" : "var(--text-muted)",
              }}
            >All</button>

            {providers.map(p => (
              <button key={p} onClick={() => { setFilterProvider(filterProvider === p ? null : p); setFilterType(null); }}
                style={{
                  padding: "5px 10px", borderRadius: "5px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
                  border: filterProvider === p ? `1px solid ${PROVIDER_COLORS[p]}` : "1px solid var(--border)",
                  background: filterProvider === p ? `${PROVIDER_COLORS[p]}20` : "transparent",
                  color: filterProvider === p ? PROVIDER_COLORS[p] : "var(--text-muted)",
                }}
              >{p}</button>
            ))}

            <span style={{ width: "1px", background: "var(--border)", margin: "0 4px" }} />

            {types.map(t => {
              const tc = TYPE_CONFIG[t] || { color: "#6b7280", label: t, icon: null };
              return (
                <button key={t} onClick={() => { setFilterType(filterType === t ? null : t); setFilterProvider(null); }}
                  style={{
                    padding: "5px 10px", borderRadius: "5px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
                    border: filterType === t ? `1px solid ${tc.color}` : "1px solid var(--border)",
                    background: filterType === t ? `${tc.color}20` : "transparent",
                    color: filterType === t ? tc.color : "var(--text-muted)",
                  }}
                >{tc.label}</button>
              );
            })}
          </div>

          {loading && (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading models…</p>
          )}
          {error && (
            <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", color: "#ef4444", fontSize: "12px", marginBottom: "16px" }}>
              ⚠️ Failed to load config: {error}
            </div>
          )}

          {/* Model Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {filtered.map(model => {
              const tc = TYPE_CONFIG[model.type] || { color: "#6b7280", label: model.type, icon: null };
              const pc = PROVIDER_COLORS[model.provider] || "#6b7280";
              const isFlipped = flippedCards.has(model.id);
              const info = MODEL_SUMMARIES[model.id];
              const cardHeight = "260px";

              return (
                <div
                  key={model.id}
                  className={`flip-card${isFlipped ? " flipped" : ""}`}
                  style={{ height: cardHeight }}
                  onClick={() => toggleFlip(model.id)}
                >
                  <div className="flip-card-inner">

                    {/* ── FRONT ── */}
                    <div
                      className="flip-card-front"
                      style={{
                        padding: "20px",
                        border: model.isPrimary ? "1px solid var(--accent-purple)" : "1px solid var(--border)",
                        background: "var(--bg-tertiary)",
                        position: "relative",
                      }}
                    >
                      {model.isPrimary && (
                        <div style={{ position: "absolute", top: 0, right: "16px", padding: "2px 8px", borderRadius: "0 0 6px 6px", background: "var(--accent-purple)", color: "white", fontSize: "9px", fontWeight: "700" }}>PRIMARY</div>
                      )}
                      {model.isFallback && !model.isPrimary && (
                        <div style={{ position: "absolute", top: 0, right: "16px", padding: "2px 8px", borderRadius: "0 0 6px 6px", background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)", fontSize: "9px", fontWeight: "700" }}>FALLBACK</div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 4px 0" }}>{model.name}</h3>
                          <span style={{ fontSize: "10px", fontWeight: "600", color: pc }}>{model.provider}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "4px", background: model.isLocal ? (model.loaded ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.1)") : "rgba(34,197,94,0.1)", color: model.isLocal ? (model.loaded ? "#4ade80" : "#9ca3af") : "#4ade80", fontSize: "10px", fontWeight: "600" }}>
                          {model.isLocal ? (model.loaded ? "● Loaded" : "○ Available") : "● Active"}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                          <div key={key} title={cfg.label} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "6px", border: model.type === key ? `2px solid ${cfg.color}` : "1px solid var(--border)", background: model.type === key ? `${cfg.color}18` : "transparent", color: model.type === key ? cfg.color : "var(--text-muted)" }}>
                            {cfg.icon}
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                        <div>
                          <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "2px" }}>CONTEXT</div>
                          <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{model.context}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "2px" }}>SPEED</div>
                          <div style={{ fontSize: "12px", fontWeight: "600", color: SPEED_COLOR[model.speed] || "#9ca3af", textTransform: "capitalize" }}>{model.speed}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "2px" }}>COST</div>
                          <div style={{ fontSize: "12px", fontWeight: "600", color: model.isLocal ? "#4ade80" : "#f59e0b" }}>{model.cost}</div>
                        </div>
                      </div>

                      {/* TOKEN TRACKER - only for API models */}
                      {!model.isLocal && tokens[model.id] && (
                        <div style={{ background: "rgba(255,255,255,0.05)", padding: "8px", borderRadius: "6px", marginBottom: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontSize: "9px", fontWeight: "600", color: "var(--text-muted)" }}>Tokens Used</span>
                            <span style={{ fontSize: "10px", fontWeight: "600", color: tokens[model.id].percentageUsed > 85 ? "#ef4444" : "#eab308" }}>
                              {Math.round(tokens[model.id].percentageUsed)}%
                            </span>
                          </div>
                          <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                            <div 
                              style={{ 
                                height: "100%", 
                                width: `${Math.min(tokens[model.id].percentageUsed, 100)}%`, 
                                background: tokens[model.id].percentageUsed > 90 ? "#ef4444" : tokens[model.id].percentageUsed > 70 ? "#f59e0b" : "#22c55e",
                                transition: "width 0.3s ease" 
                              }} 
                            />
                          </div>
                          {tokens[model.id].percentageUsed > 85 && (
                            <div style={{ fontSize: "8px", color: "#ef4444", marginTop: "3px" }}>
                              ⏳ {cooldowns[model.id] || tokens[model.id].cooldownSeconds}s until refresh
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ fontSize: "10px", color: "var(--text-muted)", textAlign: "center", marginTop: "4px" }}>
                        click to flip →
                      </div>
                    </div>

                    {/* ── BACK ── */}
                    <div
                      className="flip-card-back"
                      style={{
                        padding: "20px",
                        border: model.isPrimary ? "1px solid var(--accent-purple)" : "1px solid var(--border)",
                        background: "var(--bg-card)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <div>
                            <h3 style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 2px 0" }}>{model.name}</h3>
                            {info && <p style={{ fontSize: "10px", fontStyle: "italic", color: tc.color, margin: 0 }}>{info.tagline}</p>}
                          </div>
                          <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>← flip back</span>
                        </div>

                        {info ? (
                          <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "10px 0" }}>
                            {info.summary}
                          </p>
                        ) : (
                          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "10px 0" }}>No summary available.</p>
                        )}
                      </div>

                      {info && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {info.facts.map((fact, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "var(--text-secondary)" }}>
                              <span style={{ color: tc.color, flexShrink: 0 }}>▸</span>
                              {fact}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Usage Tab */}
      {activeTab === "usage" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
            Context window comparison across all models
          </p>
          {[...models].sort((a, b) => b.contextTokens - a.contextTokens).map(model => {
            const maxCtx = Math.max(...models.map(m => m.contextTokens));
            const pct = (model.contextTokens / maxCtx) * 100;
            const pc = PROVIDER_COLORS[model.provider] || "#6b7280";
            return (
              <div key={model.id} style={{ padding: "14px 16px", borderRadius: "8px", background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{model.name}</span>
                    <span style={{ fontSize: "10px", color: pc, marginLeft: "8px", fontWeight: "600" }}>{model.provider}</span>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--accent-purple)" }}>{model.context}</span>
                </div>
                <div style={{ height: "6px", borderRadius: "3px", background: "var(--bg-secondary)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pc, borderRadius: "3px" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Limits Tab */}
      {activeTab === "limits" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
            API rate limits apply to Anthropic models only. Local models have no limits.
          </p>
          {models.filter(m => !m.isLocal).map(model => (
            <div key={model.id} style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", margin: 0 }}>{model.name}</h3>
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "2px 0 0" }}>Cost per 1M tokens (in/out)</p>
                </div>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#f59e0b" }}>{model.cost}</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "600", background: "rgba(34,197,94,0.1)", color: "#4ade80" }}>
                  200K context
                </span>
                {model.isPrimary && (
                  <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "600", background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
                    Primary
                  </span>
                )}
              </div>
            </div>
          ))}
          <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", fontSize: "12px", color: "#4ade80" }}>
            ✅ {totalLocal} local models (LM Studio + Ollama) — no rate limits, zero cost
          </div>
        </div>
      )}
    </div>
  );
}
