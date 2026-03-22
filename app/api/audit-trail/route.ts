import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

export type ActionType = "file-change" | "api-call" | "task-execution" | "agent-spawn" | "agent-stop" | "web-search" | "tool-use" | "memory-write" | "command" | "heartbeat" | "skill-run";
export type ExecutionStatus = "success" | "failure" | "in-progress" | "cancelled" | "pending";

export interface AuditEntry {
  id: string;
  timestamp: string;
  actionType: ActionType;
  agent: string;
  status: ExecutionStatus;
  description: string;
  durationMs: number | null;
  tokensUsed: number;
  details: Record<string, any>;
}

function generateMockAuditTrail(): AuditEntry[] {
  const entries: AuditEntry[] = [];
  const now = Date.now();
  const actionTypes: ActionType[] = [
    "task-execution",
    "file-change",
    "tool-use",
    "memory-write",
    "command",
    "heartbeat",
    "skill-run",
  ];
  const agents = ["xiaozhu", "xiaohu", "xiaomao", "xiaogou", "xiaoya"];
  const statuses: ExecutionStatus[] = ["success", "failure", "in-progress"];

  // Generate entries for last 24 hours
  for (let i = 0; i < 50; i++) {
    const timeOffset = Math.random() * 86400000; // Random time in last 24h
    const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const duration = status === "in-progress" ? null : Math.floor(Math.random() * 30000);
    const tokens = Math.floor(Math.random() * 100000) + 50000;

    entries.push({
      id: `audit-${i}`,
      timestamp: new Date(now - timeOffset).toISOString(),
      actionType,
      agent,
      status,
      description: `${actionType.replace("-", " ")} by ${agent}`,
      durationMs: duration,
      tokensUsed: tokens,
      details: {
        model: ["qwen3.5-9b", "qwen3-coder-30b", "deepseek-r1-8b"][Math.floor(Math.random() * 3)],
        inputTokens: Math.floor(tokens * 0.3),
        outputTokens: Math.floor(tokens * 0.7),
      },
    });
  }

  // Sort by timestamp descending (most recent first)
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function GET(request: Request): Promise<NextResponse<{ entries: AuditEntry[]; total: number; lastRefresh: string }>> {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const filterAgent = url.searchParams.get("agent");
    const filterStatus = url.searchParams.get("status");
    const filterAction = url.searchParams.get("action");

    // Get audit trail - in production, this would come from real logs
    const entries = generateMockAuditTrail();

    // Apply filters
    let filtered = entries;
    if (filterAgent && filterAgent !== "all") {
      filtered = filtered.filter((e) => e.agent === filterAgent);
    }
    if (filterStatus) {
      filtered = filtered.filter((e) => e.status === filterStatus);
    }
    if (filterAction) {
      filtered = filtered.filter((e) => e.actionType === filterAction);
    }

    // Paginate
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      entries: paginated,
      total: filtered.length,
      lastRefresh: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to get audit trail:", error);
    return NextResponse.json(
      { entries: [], total: 0, lastRefresh: new Date().toISOString() },
      { status: 500 }
    );
  }
}
