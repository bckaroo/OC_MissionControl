import { NextResponse } from "next/server";

interface ModelTokenData {
  modelId: string;
  provider: string;
  tokensUsed: number;
  tokensPerMinute: number;
  totalQuota: number;
  percentageUsed: number;
  cooldownSeconds: number;
  lastRefreshAt: Date;
}

// Mock token data - in production, this would query from your OpenClaw API
const mockTokenData: Record<string, ModelTokenData> = {
  "anthropic/claude-haiku-4-5": {
    modelId: "claude-haiku-4-5",
    provider: "Anthropic",
    tokensUsed: 2_450_000,
    tokensPerMinute: 90_000,
    totalQuota: 3_000_000, // 3M per month
    percentageUsed: 81.7,
    cooldownSeconds: 272, // ~4.5 minutes
    lastRefreshAt: new Date(Date.now() - 60000),
  },
  "anthropic/claude-opus-4-6": {
    modelId: "claude-opus-4-6",
    provider: "Anthropic",
    tokensUsed: 850_000,
    tokensPerMinute: 45_000,
    totalQuota: 1_500_000,
    percentageUsed: 56.7,
    cooldownSeconds: 0,
    lastRefreshAt: new Date(Date.now() - 30000),
  },
  "anthropic/claude-sonnet-4-6": {
    modelId: "claude-sonnet-4-6",
    provider: "Anthropic",
    tokensUsed: 1_200_000,
    tokensPerMinute: 75_000,
    totalQuota: 2_000_000,
    percentageUsed: 60,
    cooldownSeconds: 0,
    lastRefreshAt: new Date(Date.now() - 45000),
  },
};

export async function GET(): Promise<NextResponse<Record<string, ModelTokenData>>> {
  try {
    // In production, fetch from actual OpenClaw API
    // const response = await fetch(process.env.OPENCLAW_API_URL + "/token-usage");
    // const data = await response.json();
    // return NextResponse.json(data);

    return NextResponse.json(mockTokenData);
  } catch (error) {
    console.error("Failed to fetch model token data:", error);
    return NextResponse.json(mockTokenData, { status: 200 }); // Fallback to mock
  }
}
