import { NextResponse } from "next/server";

export async function GET() {
  try {
    // TODO: Read from OpenClaw model registry
    // For now, return mock data based on your LM Studio setup
    const models = [
      {
        id: "qwen3.5-9b",
        name: "Qwen 3.5",
        provider: "Alibaba",
        size: "9B",
        type: "general",
        status: "loaded",
        contextWindow: 32000,
        maxTokens: 8000,
        costPer1kTokens: 0,
        lastUsed: new Date(Date.now() - 3600000).toISOString(),
        usageCount: 156,
        totalTokensUsed: 2340000,
        icon: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/qwen-color.png",
      },
      {
        id: "qwen3-coder-30b",
        name: "Qwen 3 Coder",
        provider: "Alibaba",
        size: "30B",
        type: "coder",
        status: "loaded",
        contextWindow: 32000,
        maxTokens: 8000,
        costPer1kTokens: 0,
        lastUsed: new Date(Date.now() - 7200000).toISOString(),
        usageCount: 89,
        totalTokensUsed: 1680000,
        icon: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/qwen-color.png",
      },
      {
        id: "qwen3-vl-30b",
        name: "Qwen 3 Vision",
        provider: "Alibaba",
        size: "30B",
        type: "vision",
        status: "available",
        contextWindow: 32000,
        maxTokens: 8000,
        costPer1kTokens: 0,
        usageCount: 23,
        totalTokensUsed: 340000,
        icon: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/qwen-color.png",
      },
      {
        id: "deepseek-r1-8b",
        name: "DeepSeek R1",
        provider: "DeepSeek",
        size: "8B",
        type: "reasoning",
        status: "loaded",
        contextWindow: 32000,
        maxTokens: 8000,
        costPer1kTokens: 0,
        lastUsed: new Date(Date.now() - 14400000).toISOString(),
        usageCount: 45,
        totalTokensUsed: 890000,
        icon: "https://www.deepseek.com/favicon.ico",
      },
      {
        id: "claude-haiku-4-5",
        name: "Claude Haiku 4.5",
        provider: "Anthropic",
        size: "API",
        type: "general",
        status: "available",
        contextWindow: 200000,
        maxTokens: 4096,
        costPer1kTokens: 0.008,
        lastUsed: new Date(Date.now() - 600000).toISOString(),
        usageCount: 12,
        totalTokensUsed: 85000,
        icon: "https://www.anthropic.com/favicon.ico",
      },
    ];

    return NextResponse.json(models);
  } catch (error) {
    console.error("Failed to get models:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
