import { NextRequest, NextResponse } from "next/server";
import { mockExecutionHistory, agentStats } from "@/lib/executionHistoryData";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const entries = mockExecutionHistory
    .filter((e) => e.agentId === agentId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (!entries.length) {
    return NextResponse.json({ error: "Agent not found or no executions" }, { status: 404 });
  }

  const stats = agentStats[agentId] ?? null;

  return NextResponse.json({ agentId, stats, data: entries, total: entries.length });
}
