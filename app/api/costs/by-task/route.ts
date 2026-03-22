import { NextResponse } from "next/server";
import { mockTaskCosts, MODEL_PRICING } from "@/lib/costData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId   = searchParams.get("agentId");
  const taskType  = searchParams.get("taskType");
  const limitStr  = searchParams.get("limit");
  const limit     = limitStr ? parseInt(limitStr, 10) : 50;

  let records = [...mockTaskCosts];
  if (agentId)  records = records.filter((r) => r.agentId === agentId);
  if (taskType) records = records.filter((r) => r.taskType === taskType);

  // Sort by timestamp desc, then limit
  records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const paged = records.slice(0, limit);

  const result = paged.map((r) => {
    const savings = r.budgetedCost - r.cost;
    const efficiency = (r.inputTokens + r.outputTokens) > 0
      ? r.cost / ((r.inputTokens + r.outputTokens) / 1000)
      : 0;

    // Find most expensive step
    const worstStep = r.steps.reduce((best, s) => s.cost > best.cost ? s : best, r.steps[0]);

    return {
      taskId:       r.taskId,
      taskTitle:    r.taskTitle,
      agentId:      r.agentId,
      agentName:    r.agentName,
      taskType:     r.taskType,
      model:        r.model,
      modelName:    MODEL_PRICING[r.model]?.name ?? r.model,
      modelColor:   MODEL_PRICING[r.model]?.color ?? "#888",
      inputTokens:  r.inputTokens,
      outputTokens: r.outputTokens,
      totalTokens:  r.inputTokens + r.outputTokens,
      cost:         r.cost,
      budgetedCost: r.budgetedCost,
      savings,
      savingsPct:   r.budgetedCost > 0 ? (savings / r.budgetedCost) * 100 : 0,
      durationSec:  r.durationSec,
      efficiency,   // cost per 1K tokens
      timestamp:    r.timestamp,
      steps:        r.steps.map((s) => ({
        ...s,
        modelName: MODEL_PRICING[s.model]?.name ?? s.model,
        pct: r.cost > 0 ? (s.cost / r.cost) * 100 : 0,
      })),
      worstStep: worstStep ? {
        name: worstStep.name,
        cost: worstStep.cost,
        pct: r.cost > 0 ? (worstStep.cost / r.cost) * 100 : 0,
      } : null,
    };
  });

  return NextResponse.json({ tasks: result, total: records.length });
}
