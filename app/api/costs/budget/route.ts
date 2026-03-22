import { NextResponse } from "next/server";
import { mockTaskCosts, agentBudgets, getBudgetStatus, AgentBudget } from "@/lib/costData";

export async function GET() {
  const status = getBudgetStatus(mockTaskCosts, agentBudgets);

  const alerts = status
    .filter((s) => s.alert || s.critical)
    .map((s) => ({
      agentId:   s.agentId,
      agentName: s.agentName,
      severity:  s.critical ? "critical" : "warning",
      message:   s.critical
        ? `${s.agentName} has exceeded budget! ($${s.monthSpend.toFixed(3)} / $${s.monthlyCapUSD})`
        : `${s.agentName} is approaching monthly budget (${s.monthPct.toFixed(0)}% used)`,
    }));

  return NextResponse.json({
    budgets: status,
    alerts,
    totalMonthCap: agentBudgets.reduce((s, b) => s + b.monthlyCapUSD, 0),
    totalMonthSpend: status.reduce((s, b) => s + b.monthSpend, 0),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<AgentBudget>;
  if (!body.agentId) {
    return NextResponse.json({ error: "agentId required" }, { status: 400 });
  }

  const idx = agentBudgets.findIndex((b) => b.agentId === body.agentId);
  if (idx === -1) {
    agentBudgets.push({
      agentId:       body.agentId,
      monthlyCapUSD: body.monthlyCapUSD ?? 25,
      weeklyCapUSD:  body.weeklyCapUSD  ?? 8,
    });
  } else {
    if (body.monthlyCapUSD !== undefined) agentBudgets[idx].monthlyCapUSD = body.monthlyCapUSD;
    if (body.weeklyCapUSD  !== undefined) agentBudgets[idx].weeklyCapUSD  = body.weeklyCapUSD;
  }

  return NextResponse.json({ ok: true, budget: agentBudgets.find((b) => b.agentId === body.agentId) });
}
