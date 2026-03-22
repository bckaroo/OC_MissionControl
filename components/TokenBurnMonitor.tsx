"use client";

import { Zap } from "lucide-react";

interface TokenStats {
  totalTokens: number;
  tokensIn: number;
  tokensOut: number;
  costPer1000: number; // Haiku rate ~$0.80/1k tokens
  estimatedTotalCost: number;
  monthlyLimit?: number; // Optional budget limit
  dailyLimit?: number;
}

function formatTokens(t: number): string {
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(2)}M`;
  if (t >= 1_000) return `${(t / 1_000).toFixed(2)}K`;
  return t.toString();
}

function formatDollars(t: number): string {
  const cost = t * TokenStats.costPer1000;
  if (cost >= 100) return `$${(cost / 100).toFixed(1)} hundred`;
  if (cost >= 1) return `$${cost.toFixed(2)}`;
  if (cost > 0) return `~$${cost.toFixed(3)}`;
  return "N/A";
}

// Simple mock data - in prod, this would come from API
const mockTokenStats: TokenStats = {
  totalTokens: 124530,
  tokensIn: 78640,
  tokensOut: 45890,
  costPer1000: 0.80, // Claude Haiku rate (per 1k tokens)
  estimatedTotalCost: 99.62,
  monthlyLimit: 7000, // $7 budget/month
};

export default function TokenBurnMonitor() {
  const getTokenColor = (percentage: number) => {
    if (percentage > 85) return "#ef4444";
    if (percentage > 50) return "#f59e0b";
    return "#22c55e";
  };

  const totalTokensDisplay = `${formatTokens(mockTokenStats.tokensIn)} in / ${formatTokens(mockTokenStats.totalTokens)} out`;

  return (
    <div style={{ padding: "6px 20px", background: "transparent" }}>
      {/* Token Usage */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "11px", fontWeight: "500" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Zap size={12} color="#eab308" />
          <span>API Tokens:</span>
          <span style={{ fontWeight: "600" }}>{totalTokensDisplay}</span>
        </div>

        <div style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.1)" }} />

        {/* Cost Display */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span>Cost:</span>
          <span style={{ fontWeight: "600", color: "#eab308" }}>~${mockTokenStats.estimatedTotalCost.toFixed(2)}</span>
        </div>

        <div style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.1)" }} />

        {/* Progress Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span>Progress:</span>
          <div
            style={{
              height: "16px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "4px",
              overflow: "hidden",
              minWidth: "80px",
              position: "relative",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(mockTokenStats.totalTokens / (7000 * 100)) * 100}%`, // rough percentage
                background: getTokenColor((mockTokenStats.totalTokens / (7000 * 100)) * 100),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
