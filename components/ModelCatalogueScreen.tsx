"use client";

import { useState, useEffect, useCallback } from "react";

interface Model {
  id: string;
  name: string;
  provider: string;
  size: string;
  type: "coder" | "reasoning" | "vision" | "general" | "speed";
  status: "loaded" | "available" | "offline";
  contextWindow: number;
  maxTokens: number;
  costPer1kTokens?: number;
  lastUsed?: string;
  usageCount: number;
  totalTokensUsed: number;
}

interface TokenUsageByDay {
  date: string;
  [modelId: string]: number;
}

export default function ModelCatalogueScreen() {
  const [models, setModels] = useState<Model[]>([]);
  const [usageHistory, setUsageHistory] = useState<TokenUsageByDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [modelsRes, historyRes] = await Promise.all([
        fetch("/api/openclaw/models"),
        fetch("/api/openclaw/models/token-history"),
      ]);

      if (modelsRes.ok) setModels(await modelsRes.json());
      if (historyRes.ok) setUsageHistory(await historyRes.json());
    } catch (e) {
      console.error("Failed to fetch models:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchData]);

  const typeEmoji: Record<string, string> = {
    coder: "💻",
    reasoning: "🧠",
    vision: "👁️",
    general: "🤖",
    speed: "⚡",
  };

  const typeColor: Record<string, string> = {
    coder: "#3b82f6",
    reasoning: "#8b5cf6",
    vision: "#f59e0b",
    general: "#10b981",
    speed: "#ef4444",
  };

  const statusColor: Record<string, string> = {
    loaded: "#22c55e",
    available: "#eab308",
    offline: "#6b7280",
  };

  const statusLabel: Record<string, string> = {
    loaded: "Loaded",
    available: "Available",
    offline: "Offline",
  };

  // Calculate max tokens for chart scaling
  const maxDayTokens =
    usageHistory.length > 0
      ? Math.max(
          ...usageHistory.map((day) =>
            Object.values(day)
              .filter((v) => typeof v === "number")
              .reduce((a, b) => a + (b as number), 0)
          )
        )
      : 0;

  return (
    <div style={{ height: "100%", overflow: "auto", padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "var(--text-primary)" }}>
          🧠 Model Catalogue
        </h2>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
          Available models and token consumption analysis
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
          <div>Loading models…</div>
        </div>
      ) : (
        <>
          {/* Models Grid */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "12px" }}>
              Available Models ({models.length})
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "12px",
              }}
            >
              {models.map((model) => (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(selectedModel === model.id ? null : model.id)}
                  style={{
                    padding: "16px 18px",
                    borderRadius: "10px",
                    background:
                      selectedModel === model.id
                        ? "linear-gradient(135deg, rgba(124,90,244,0.15), rgba(59,130,246,0.15))"
                        : "var(--bg-tertiary)",
                    border:
                      selectedModel === model.id
                        ? "1px solid rgba(124,90,244,0.5)"
                        : "1px solid var(--border)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
                        {model.name}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {model.provider}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        background: `${typeColor[model.type]}20`,
                        padding: "4px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      {typeEmoji[model.type]}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div
                    style={{
                      display: "inline-block",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      background: `${statusColor[model.status]}20`,
                      color: statusColor[model.status],
                      fontSize: "9px",
                      fontWeight: "600",
                      marginBottom: "10px",
                    }}
                  >
                    {statusLabel[model.status]}
                  </div>

                  {/* Stats grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "11px", marginBottom: "10px" }}>
                    <div>
                      <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Size</div>
                      <div style={{ color: "var(--text-primary)", fontWeight: "500" }}>{model.size}</div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Context</div>
                      <div style={{ color: "var(--text-primary)", fontWeight: "500" }}>
                        {(model.contextWindow / 1000).toFixed(0)}K
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Used</div>
                      <div style={{ color: "var(--text-primary)", fontWeight: "500" }}>
                        {model.usageCount}x
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Tokens</div>
                      <div style={{ color: "var(--text-primary)", fontWeight: "500" }}>
                        {(model.totalTokensUsed / 1000).toFixed(0)}K
                      </div>
                    </div>
                  </div>

                  {/* Last used */}
                  {model.lastUsed && (
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
                      Last used: {new Date(model.lastUsed).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Token Consumption Chart */}
          {usageHistory.length > 0 && (
            <div
              style={{
                padding: "20px 24px",
                borderRadius: "12px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "16px" }}>
                📊 Token Consumption by Model (Last 7 Days)
              </div>

              {/* Chart */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {usageHistory.slice(-7).map((day, idx) => {
                  const totalTokens = Object.values(day)
                    .filter((v) => typeof v === "number")
                    .reduce((a, b) => a + (b as number), 0);

                  const modelEntries = Object.entries(day)
                    .filter(([k, v]) => k !== "date" && typeof v === "number")
                    .map(([modelId, tokens]) => ({
                      modelId,
                      tokens: tokens as number,
                      percentage: totalTokens > 0 ? ((tokens as number) / totalTokens) * 100 : 0,
                    }));

                  return (
                    <div key={idx}>
                      {/* Date label */}
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
                        {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>

                      {/* Stacked bar */}
                      <div style={{ display: "flex", height: "32px", borderRadius: "6px", overflow: "hidden", background: "var(--bg-card)", marginBottom: "8px" }}>
                        {modelEntries.map((entry) => {
                          const model = models.find((m) => m.id === entry.modelId);
                          return (
                            <div
                              key={entry.modelId}
                              style={{
                                flex: entry.percentage,
                                background: model ? typeColor[model.type] : "#6b7280",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "9px",
                                color: "white",
                                fontWeight: "600",
                                minWidth: "30px",
                                title: `${model?.name || entry.modelId}: ${entry.tokens.toLocaleString()} tokens (${entry.percentage.toFixed(1)}%)`,
                              }}
                            >
                              {entry.percentage > 8 && `${entry.percentage.toFixed(0)}%`}
                            </div>
                          );
                        })}
                      </div>

                      {/* Stats */}
                      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        {totalTokens.toLocaleString()} tokens
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "10px" }}>
                  Legend
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  {Object.entries(typeEmoji).map(([type, emoji]) => (
                    <div key={type} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "3px",
                          background: typeColor[type],
                        }}
                      />
                      <span style={{ color: "var(--text-secondary)" }}>
                        {emoji} {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
