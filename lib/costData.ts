// ─────────────────────────────────────────────────────────────────────────────
// Cost Tracking Data — Mock + Pricing Engine
// ─────────────────────────────────────────────────────────────────────────────

export type ModelId =
  | "claude-sonnet-4"
  | "claude-3-5-sonnet"
  | "claude-3-haiku"
  | "claude-3-opus"
  | "gpt-4o"
  | "gpt-4-turbo"
  | "gpt-3-5-turbo";

export interface ModelPricing {
  name: string;
  provider: "anthropic" | "openai";
  inputPer1M: number;   // USD per 1M input tokens
  outputPer1M: number;  // USD per 1M output tokens
  color: string;
}

export const MODEL_PRICING: Record<ModelId, ModelPricing> = {
  "claude-sonnet-4":    { name: "Claude Sonnet 4",    provider: "anthropic", inputPer1M: 3.00,  outputPer1M: 15.00, color: "#8b5cf6" },
  "claude-3-5-sonnet":  { name: "Claude 3.5 Sonnet",  provider: "anthropic", inputPer1M: 3.00,  outputPer1M: 15.00, color: "#7c3aed" },
  "claude-3-haiku":     { name: "Claude 3 Haiku",     provider: "anthropic", inputPer1M: 0.25,  outputPer1M: 1.25,  color: "#06b6d4" },
  "claude-3-opus":      { name: "Claude 3 Opus",      provider: "anthropic", inputPer1M: 15.00, outputPer1M: 75.00, color: "#ec4899" },
  "gpt-4o":             { name: "GPT-4o",             provider: "openai",    inputPer1M: 5.00,  outputPer1M: 15.00, color: "#22c55e" },
  "gpt-4-turbo":        { name: "GPT-4 Turbo",        provider: "openai",    inputPer1M: 10.00, outputPer1M: 30.00, color: "#f59e0b" },
  "gpt-3-5-turbo":      { name: "GPT-3.5 Turbo",      provider: "openai",    inputPer1M: 0.50,  outputPer1M: 1.50,  color: "#3b82f6" },
};

export function calcCost(model: ModelId, inputTokens: number, outputTokens: number): number {
  const p = MODEL_PRICING[model];
  return (inputTokens / 1_000_000) * p.inputPer1M + (outputTokens / 1_000_000) * p.outputPer1M;
}

// ─── Task cost records ───────────────────────────────────────────────────────

export interface TaskCostRecord {
  taskId: string;
  taskTitle: string;
  agentId: string;
  agentName: string;
  taskType: "research" | "coding" | "planning" | "writing" | "automation" | "analysis";
  model: ModelId;
  inputTokens: number;
  outputTokens: number;
  cost: number;          // actual USD
  budgetedCost: number;  // estimated USD before run
  durationSec: number;
  steps: TaskStep[];
  timestamp: string; // ISO
}

export interface TaskStep {
  name: string;
  model: ModelId;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

// ─── Agent budget settings ───────────────────────────────────────────────────

export interface AgentBudget {
  agentId: string;
  monthlyCapUSD: number;
  weeklyCapUSD: number;
}

// ─── Budget store (in-memory for mock) ───────────────────────────────────────

export const agentBudgets: AgentBudget[] = [
  { agentId: "agent-main",  monthlyCapUSD: 25.00, weeklyCapUSD: 8.00 },
  { agentId: "agent-sub1",  monthlyCapUSD: 10.00, weeklyCapUSD: 3.00 },
  { agentId: "agent-sub2",  monthlyCapUSD: 10.00, weeklyCapUSD: 3.00 },
];

// ─── Mock historical task cost records (last 30 days) ────────────────────────

function makeSteps(model: ModelId, taskType: string): TaskStep[] {
  const stepDefs: Record<string, { name: string; share: number }[]> = {
    research: [
      { name: "Query formulation",  share: 0.05 },
      { name: "Web search analysis", share: 0.35 },
      { name: "Synthesis & summary", share: 0.45 },
      { name: "Output formatting",  share: 0.15 },
    ],
    coding: [
      { name: "Requirement parsing",  share: 0.08 },
      { name: "Code generation",      share: 0.55 },
      { name: "Code review & fixes",  share: 0.25 },
      { name: "Documentation",        share: 0.12 },
    ],
    planning: [
      { name: "Context gathering", share: 0.20 },
      { name: "Plan generation",   share: 0.50 },
      { name: "Risk analysis",     share: 0.30 },
    ],
    writing: [
      { name: "Outline creation", share: 0.10 },
      { name: "Draft writing",    share: 0.65 },
      { name: "Editing & polish", share: 0.25 },
    ],
    automation: [
      { name: "Script generation", share: 0.60 },
      { name: "Testing & debug",   share: 0.30 },
      { name: "Documentation",     share: 0.10 },
    ],
    analysis: [
      { name: "Data ingestion",  share: 0.15 },
      { name: "Core analysis",   share: 0.55 },
      { name: "Insight writing", share: 0.30 },
    ],
  };
  const defs = stepDefs[taskType] ?? stepDefs.research;
  return defs.map((d) => {
    const inTok  = Math.round(800  * d.share + Math.random() * 200);
    const outTok = Math.round(400  * d.share + Math.random() * 100);
    return {
      name: d.name,
      model,
      inputTokens: inTok,
      outputTokens: outTok,
      cost: calcCost(model, inTok, outTok),
    };
  });
}

function makeTCR(
  taskId: string, taskTitle: string, agentId: string, agentName: string,
  taskType: TaskCostRecord["taskType"], model: ModelId,
  inputTokens: number, outputTokens: number,
  durationSec: number, daysAgo: number,
): TaskCostRecord {
  const cost = calcCost(model, inputTokens, outputTokens);
  const budgetedCost = cost * (0.85 + Math.random() * 0.3); // ±15-30% variance
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(Math.random() * 22), Math.floor(Math.random() * 60));
  return {
    taskId, taskTitle, agentId, agentName, taskType, model,
    inputTokens, outputTokens, cost,
    budgetedCost: Math.round(budgetedCost * 10000) / 10000,
    durationSec,
    steps: makeSteps(model, taskType),
    timestamp: d.toISOString(),
  };
}

export const mockTaskCosts: TaskCostRecord[] = [
  // ── This week ──
  makeTCR("t-mc-01", "Build Mission Control dashboard", "agent-main", "XiaoZhu", "coding",    "claude-sonnet-4",   18500, 7200, 840,  0),
  makeTCR("t-mc-02", "Add drag-and-drop Kanban",        "agent-sub1", "Subagent Alpha", "coding",    "claude-sonnet-4",   12000, 5500, 620,  0),
  makeTCR("t-mc-03", "Write YouTube transcript skill",  "agent-main", "XiaoZhu", "coding",    "claude-3-5-sonnet", 9500,  3800, 480,  1),
  makeTCR("t-mc-04", "Research OpenClaw API patterns",  "agent-sub2", "Subagent Beta",  "research",  "gpt-4o",            8200,  2900, 320,  1),
  makeTCR("t-mc-05", "Plan automation pipeline",        "agent-main", "XiaoZhu", "planning",  "claude-sonnet-4",   6800,  2100, 240,  2),
  makeTCR("t-mc-06", "Write SOUL.md persona",           "agent-main", "XiaoZhu", "writing",   "claude-3-haiku",    4200,  1800, 180,  2),
  makeTCR("t-mc-07", "Analyze transcript for insights", "agent-sub2", "Subagent Beta",  "analysis",  "gpt-4o",            11000, 4500, 420,  3),
  makeTCR("t-mc-08", "Generate cron job configs",       "agent-sub1", "Subagent Alpha", "automation","claude-3-haiku",    3200,  1400, 160,  3),
  makeTCR("t-mc-09", "Debug calendar API integration",  "agent-main", "XiaoZhu", "coding",    "claude-sonnet-4",   14200, 6100, 720,  4),
  makeTCR("t-mc-10", "Research best chart libraries",   "agent-sub2", "Subagent Beta",  "research",  "gpt-3-5-turbo",     5800,  2200, 280,  4),
  // ── Earlier this month ──
  makeTCR("t-mc-11", "Design system tokens & CSS vars", "agent-sub1", "Subagent Alpha", "coding",    "claude-3-5-sonnet", 7800,  3200, 380,  6),
  makeTCR("t-mc-12", "Write project requirements PRD",  "agent-main", "XiaoZhu", "writing",   "claude-sonnet-4",   9200,  3900, 420,  7),
  makeTCR("t-mc-13", "Analyze OpenAI pricing changes",  "agent-sub2", "Subagent Beta",  "analysis",  "gpt-4o",            10500, 4200, 510,  8),
  makeTCR("t-mc-14", "Automate daily digest email",     "agent-sub1", "Subagent Alpha", "automation","claude-3-haiku",    2800,  1200, 140,  9),
  makeTCR("t-mc-15", "Plan memory consolidation flow",  "agent-main", "XiaoZhu", "planning",  "claude-sonnet-4",   7200,  2800, 300,  10),
  makeTCR("t-mc-16", "Research competitor dashboards",  "agent-sub2", "Subagent Beta",  "research",  "gpt-4-turbo",       8800,  3600, 390,  11),
  makeTCR("t-mc-17", "Write agent onboarding guide",    "agent-main", "XiaoZhu", "writing",   "claude-3-haiku",    4800,  2100, 200,  12),
  makeTCR("t-mc-18", "Build search indexer script",     "agent-sub1", "Subagent Alpha", "coding",    "claude-3-5-sonnet", 10200, 4400, 560,  13),
  makeTCR("t-mc-19", "Analyze session log patterns",    "agent-sub2", "Subagent Beta",  "analysis",  "gpt-4o",            9800,  3900, 470,  14),
  makeTCR("t-mc-20", "Plan weekly task prioritization", "agent-main", "XiaoZhu", "planning",  "claude-3-haiku",    3600,  1500, 170,  15),
  makeTCR("t-mc-21", "Build Discord notification skill","agent-sub1", "Subagent Alpha", "coding",    "claude-sonnet-4",   15800, 6800, 780,  16),
  makeTCR("t-mc-22", "Research cost optimization LLMs", "agent-sub2", "Subagent Beta",  "research",  "gpt-3-5-turbo",     6200,  2500, 290,  17),
  makeTCR("t-mc-23", "Write API documentation",         "agent-main", "XiaoZhu", "writing",   "claude-3-5-sonnet", 8400,  3700, 410,  18),
  makeTCR("t-mc-24", "Automate backup pipeline",        "agent-sub1", "Subagent Alpha", "automation","claude-3-haiku",    3400,  1600, 185,  19),
  makeTCR("t-mc-25", "Plan Q2 feature roadmap",         "agent-main", "XiaoZhu", "planning",  "gpt-4-turbo",       12200, 5100, 580,  20),
  makeTCR("t-mc-26", "Deep analysis: user behavior",    "agent-sub2", "Subagent Beta",  "analysis",  "gpt-4o",            14500, 5800, 650,  21),
  makeTCR("t-mc-27", "Write release notes v1.2",        "agent-main", "XiaoZhu", "writing",   "claude-3-haiku",    3900,  1700, 190,  22),
  makeTCR("t-mc-28", "Build webhook handler",           "agent-sub1", "Subagent Alpha", "coding",    "claude-3-5-sonnet", 11500, 4900, 610,  23),
  makeTCR("t-mc-29", "Research tagging taxonomies",     "agent-sub2", "Subagent Beta",  "research",  "gpt-4o",            7600,  3100, 340,  24),
  makeTCR("t-mc-30", "Plan memory indexing system",     "agent-main", "XiaoZhu", "planning",  "claude-sonnet-4",   8600,  3400, 380,  25),
];

// ─── Derived aggregations ────────────────────────────────────────────────────

export function getSpendInRange(records: TaskCostRecord[], daysBack: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  return records
    .filter((r) => new Date(r.timestamp) >= cutoff)
    .reduce((sum, r) => sum + r.cost, 0);
}

export function getSpendByModel(records: TaskCostRecord[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of records) {
    out[r.model] = (out[r.model] ?? 0) + r.cost;
  }
  return out;
}

export function getSpendByAgent(records: TaskCostRecord[]): Record<string, { name: string; cost: number; taskCount: number; inputTokens: number; outputTokens: number }> {
  const out: Record<string, { name: string; cost: number; taskCount: number; inputTokens: number; outputTokens: number }> = {};
  for (const r of records) {
    if (!out[r.agentId]) out[r.agentId] = { name: r.agentName, cost: 0, taskCount: 0, inputTokens: 0, outputTokens: 0 };
    out[r.agentId].cost         += r.cost;
    out[r.agentId].taskCount    += 1;
    out[r.agentId].inputTokens  += r.inputTokens;
    out[r.agentId].outputTokens += r.outputTokens;
  }
  return out;
}

export function getSpendByTaskType(records: TaskCostRecord[]): Record<string, { cost: number; count: number; avgCost: number }> {
  const out: Record<string, { cost: number; count: number; avgCost: number }> = {};
  for (const r of records) {
    if (!out[r.taskType]) out[r.taskType] = { cost: 0, count: 0, avgCost: 0 };
    out[r.taskType].cost  += r.cost;
    out[r.taskType].count += 1;
  }
  for (const k of Object.keys(out)) {
    out[k].avgCost = out[k].cost / out[k].count;
  }
  return out;
}

/** Returns daily spend for the last N days */
export function getDailySpend(records: TaskCostRecord[], days: number): { date: string; cost: number }[] {
  const buckets: Record<string, number> = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = 0;
  }
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  for (const r of records) {
    const day = r.timestamp.slice(0, 10);
    if (day in buckets) buckets[day] += r.cost;
  }
  return Object.entries(buckets).map(([date, cost]) => ({ date, cost }));
}

export function getBudgetStatus(records: TaskCostRecord[], budgets: AgentBudget[]) {
  const now = new Date();

  // Calculate start of this month and week
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart  = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());

  return budgets.map((b) => {
    const agentRecs = records.filter((r) => r.agentId === b.agentId);
    const monthSpend = agentRecs
      .filter((r) => new Date(r.timestamp) >= monthStart)
      .reduce((s, r) => s + r.cost, 0);
    const weekSpend  = agentRecs
      .filter((r) => new Date(r.timestamp) >= weekStart)
      .reduce((s, r) => s + r.cost, 0);

    const monthPct = b.monthlyCapUSD > 0 ? (monthSpend / b.monthlyCapUSD) * 100 : 0;
    const weekPct  = b.weeklyCapUSD  > 0 ? (weekSpend  / b.weeklyCapUSD)  * 100 : 0;

    const agentName = records.find((r) => r.agentId === b.agentId)?.agentName ?? b.agentId;

    // Project end-of-month spend
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projectedMonth = (monthSpend / dayOfMonth) * daysInMonth;

    return {
      agentId: b.agentId,
      agentName,
      monthlyCapUSD:   b.monthlyCapUSD,
      weeklyCapUSD:    b.weeklyCapUSD,
      monthSpend,
      weekSpend,
      monthPct,
      weekPct,
      projectedMonth,
      alert: monthPct >= 80 || weekPct >= 80,
      critical: monthPct >= 100 || weekPct >= 100,
    };
  });
}

/** Cost optimization insights */
export function getOptimizationInsights(records: TaskCostRecord[]) {
  const insights: { type: "warning" | "info" | "tip"; message: string; savings?: string }[] = [];

  // Check if any agent is using expensive models for simple/short tasks
  const expensiveShortTasks = records.filter(
    (r) => (r.model === "gpt-4-turbo" || r.model === "claude-3-opus") &&
            r.inputTokens + r.outputTokens < 5000
  );
  if (expensiveShortTasks.length > 0) {
    const wastedCost = expensiveShortTasks.reduce((s, r) => s + r.cost, 0);
    const haikuCost  = expensiveShortTasks.reduce((s, r) => s + calcCost("claude-3-haiku", r.inputTokens, r.outputTokens), 0);
    insights.push({
      type: "tip",
      message: `${expensiveShortTasks.length} short tasks used premium models — Claude Haiku would be sufficient`,
      savings: `$${(wastedCost - haikuCost).toFixed(3)} saved`,
    });
  }

  // Find most expensive task type vs average
  const byType = getSpendByTaskType(records);
  const avgCost = Object.values(byType).reduce((s, v) => s + v.avgCost, 0) / Object.keys(byType).length;
  const expensiveTypes = Object.entries(byType).filter(([, v]) => v.avgCost > avgCost * 2);
  for (const [type, data] of expensiveTypes) {
    insights.push({
      type: "warning",
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} tasks average $${data.avgCost.toFixed(4)} — ${(data.avgCost / avgCost).toFixed(1)}× above average`,
    });
  }

  // Check agent using GPT-4 heavily
  const byAgent = getSpendByAgent(records);
  for (const [agentId, data] of Object.entries(byAgent)) {
    const agentGpt4Recs = records.filter((r) => r.agentId === agentId && (r.model === "gpt-4-turbo" || r.model === "gpt-4o"));
    if (agentGpt4Recs.length > 3) {
      const gpt4Cost   = agentGpt4Recs.reduce((s, r) => s + r.cost, 0);
      const haikuEquiv = agentGpt4Recs.reduce((s, r) => s + calcCost("claude-3-haiku", r.inputTokens, r.outputTokens), 0);
      if (gpt4Cost > haikuEquiv * 5) {
        insights.push({
          type: "tip",
          message: `${data.name} runs ${agentGpt4Recs.length} tasks on GPT-4 — switching to Haiku for routine tasks could save ~80%`,
          savings: `~$${(gpt4Cost - haikuEquiv).toFixed(3)}/month`,
        });
      }
    }
  }

  // Add a general tip about model selection
  insights.push({
    type: "info",
    message: "Claude 3 Haiku is 60× cheaper than Claude 3 Opus for similar quality on structured tasks",
  });

  insights.push({
    type: "info",
    message: "GPT-3.5 Turbo handles most research & summarization tasks at 20× lower cost than GPT-4",
  });

  return insights;
}
