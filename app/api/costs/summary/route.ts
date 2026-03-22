import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const SESSIONS_FILE = "C:\\Users\\abuck\\.openclaw\\agents\\main\\sessions\\sessions.json";

interface TokenCost {
  inputCost: number;
  outputCost: number;
  total: number;
}

interface ModelCosts {
  [modelId: string]: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

interface AgentCosts {
  [agentId: string]: {
    name: string;
    totalTokens: number;
    estimatedCost: number;
    models: ModelCosts;
  };
}

interface CostSummary {
  totalTokensUsed: number;
  totalEstimatedCost: number;
  byAgent: AgentCosts;
  byModel: {
    [modelId: string]: {
      tokensUsed: number;
      estimatedCost: number;
      agents: string[];
    };
  };
  timestamp: number;
}

// Pricing per 1M tokens (input/output)
const PRICING: Record<string, TokenCost> = {
  "anthropic/claude-haiku-4-5": {
    inputCost: 0.8,
    outputCost: 4.0,
    total: 4.8,
  },
  "anthropic/claude-sonnet-4-6": {
    inputCost: 3.0,
    outputCost: 15.0,
    total: 18.0,
  },
  "anthropic/claude-opus-4-1": {
    inputCost: 15.0,
    outputCost: 75.0,
    total: 90.0,
  },
  // Local models (free)
  "lmstudio/qwen/qwen3-coder-30b": { inputCost: 0, outputCost: 0, total: 0 },
  "lmstudio/qwen/qwen3.5-9b": { inputCost: 0, outputCost: 0, total: 0 },
  "lmstudio/qwen/qwen3-vl-30b": { inputCost: 0, outputCost: 0, total: 0 },
  "lmstudio/deepseek/deepseek-r1-0528-qwen3-8b": {
    inputCost: 0,
    outputCost: 0,
    total: 0,
  },
  "lmstudio/nvidia/nemotron-3-nano-4b": {
    inputCost: 0,
    outputCost: 0,
    total: 0,
  },
};

function getAgentName(sessionKey: string): string {
  if (sessionKey === "agent:main:main") return "XiaoZhu";
  if (sessionKey.includes("subagent:")) {
    const id = sessionKey.split(":").pop() || "";
    const nameMap: Record<string, string> = {
      "5bcaa291-a57c-44dd-b527-cc98cd6f8ca5": "xiaomao",
      "dc0fe98b-32de-407a-a9f4-19547922189d": "xiaohu",
      "c018cb28-28f7-45e8-859a-da3a786dbba8": "xiaoya",
      "3cb7d96b-d7e6-4643-a799-046a835f1350": "xiaomao",
      "4f42927d-bf5b-4b54-867b-ee4b00c51920": "xiaohua",
    };
    return nameMap[id] || `Subagent`;
  }
  if (sessionKey.includes("discord:channel:")) {
    return "Discord";
  }
  if (sessionKey.includes("telegram:")) {
    return "Telegram";
  }
  return "Unknown";
}

function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[model] || PRICING["anthropic/claude-haiku-4-5"];
  const inputCost = (inputTokens / 1000000) * pricing.inputCost;
  const outputCost = (outputTokens / 1000000) * pricing.outputCost;
  return inputCost + outputCost;
}

export async function GET() {
  try {
    const summary: CostSummary = {
      totalTokensUsed: 0,
      totalEstimatedCost: 0,
      byAgent: {},
      byModel: {},
      timestamp: Date.now(),
    };

    // Read sessions
    try {
      const raw = await readFile(SESSIONS_FILE, "utf-8");
      const data = JSON.parse(raw) as Record<string, any>;

      for (const [sessionKey, session] of Object.entries(data)) {
        if (!session || typeof session !== "object") continue;

        const agentName = getAgentName(sessionKey);
        const model = session.model || "unknown";
        const inputTokens = session.inputTokens || 0;
        const outputTokens = session.outputTokens || 0;
        const cacheRead = session.cacheRead || 0;
        const totalTokens = session.totalTokens || 0;

        const agentCost = calculateCost(model, inputTokens, outputTokens);

        // Add to agent totals
        if (!summary.byAgent[agentName]) {
          summary.byAgent[agentName] = {
            name: agentName,
            totalTokens: 0,
            estimatedCost: 0,
            models: {},
          };
        }

        summary.byAgent[agentName].totalTokens += totalTokens;
        summary.byAgent[agentName].estimatedCost += agentCost;

        if (!summary.byAgent[agentName].models[model]) {
          summary.byAgent[agentName].models[model] = {
            inputTokens: 0,
            outputTokens: 0,
            cachedTokens: 0,
            totalTokens: 0,
            estimatedCost: 0,
          };
        }

        summary.byAgent[agentName].models[model].inputTokens += inputTokens;
        summary.byAgent[agentName].models[model].outputTokens += outputTokens;
        summary.byAgent[agentName].models[model].cachedTokens += cacheRead;
        summary.byAgent[agentName].models[model].totalTokens += totalTokens;
        summary.byAgent[agentName].models[model].estimatedCost += agentCost;

        // Add to model totals
        if (!summary.byModel[model]) {
          summary.byModel[model] = {
            tokensUsed: 0,
            estimatedCost: 0,
            agents: [],
          };
        }

        summary.byModel[model].tokensUsed += totalTokens;
        summary.byModel[model].estimatedCost += agentCost;

        if (!summary.byModel[model].agents.includes(agentName)) {
          summary.byModel[model].agents.push(agentName);
        }

        summary.totalTokensUsed += totalTokens;
        summary.totalEstimatedCost += agentCost;
      }
    } catch (error) {
      console.error("Failed to read sessions:", error);
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Costs API error:", error);
    return NextResponse.json(
      {
        totalTokensUsed: 0,
        totalEstimatedCost: 0,
        byAgent: {},
        byModel: {},
        timestamp: Date.now(),
        error: String(error),
      },
      { status: 200 }
    );
  }
}
