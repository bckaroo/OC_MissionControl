import { NextResponse } from "next/server";
import {
  mockTaskCosts,
  getSpendByAgent,
  MODEL_PRICING,
  agentBudgets,
  getBudgetStatus,
} from "@/lib/costData";

export async function GET() {
  const records = mockTaskCosts;
  const byAgent = getSpendByAgent(records);
  const budgetStatus = getBudgetStatus(records, agentBudgets);

  const result = Object.entries(byAgent).map(([agentId, data]) => {
    const agentRecords = records.filter((r) => r.agentId === agentId);
    const budget = budgetStatus.find((b) => b.agentId === agentId);

    // Model distribution
    const modelDist: Record<string, number> = {};
    for (const r of agentRecords) {
      modelDist[r.model] = (modelDist[r.model] ?? 0) + r.cost;
    }
    const modelBreakdown = Object.entries(modelDist)
      .map(([modelId, cost]) => ({
        modelId,
        name:  MODEL_PRICING[modelId as keyof typeof MODEL_PRICING]?.name ?? modelId,
        color: MODEL_PRICING[modelId as keyof typeof MODEL_PRICING]?.color ?? "#888",
        cost,
        pct: data.cost > 0 ? (cost / data.cost) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost);

    // Compute per-hour cost
    const totalSec = agentRecords.reduce((s, r) => s + r.durationSec, 0);
    const costPerHour = totalSec > 0 ? (data.cost / totalSec) * 3600 : 0;

    // Task type breakdown
    const taskTypeDist: Record<string, { count: number; cost: number }> = {};
    for (const r of agentRecords) {
      if (!taskTypeDist[r.taskType]) taskTypeDist[r.taskType] = { count: 0, cost: 0 };
      taskTypeDist[r.taskType].count += 1;
      taskTypeDist[r.taskType].cost  += r.cost;
    }

    return {
      agentId,
      name:          data.name,
      totalCost:     data.cost,
      taskCount:     data.taskCount,
      avgCostPerTask: data.taskCount > 0 ? data.cost / data.taskCount : 0,
      inputTokens:   data.inputTokens,
      outputTokens:  data.outputTokens,
      totalTokens:   data.inputTokens + data.outputTokens,
      costPerHour,
      modelBreakdown,
      taskTypeBreakdown: taskTypeDist,
      budget: budget ?? null,
    };
  }).sort((a, b) => b.totalCost - a.totalCost);

  return NextResponse.json({ agents: result });
}
