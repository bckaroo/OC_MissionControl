import { NextRequest, NextResponse } from "next/server";
import { mockExecutionHistory } from "@/lib/executionHistoryData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const agent = searchParams.get("agent");
  const status = searchParams.get("status");
  const actionType = searchParams.get("actionType");
  const search = searchParams.get("search");
  const tag = searchParams.get("tag");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  let results = [...mockExecutionHistory];

  if (agent) results = results.filter((e) => e.agentId === agent || e.agentName === agent);
  if (status) results = results.filter((e) => e.status === status);
  if (actionType) results = results.filter((e) => e.actionType === actionType);
  if (tag) results = results.filter((e) => e.tags?.includes(tag));
  if (dateFrom) results = results.filter((e) => e.timestamp >= dateFrom);
  if (dateTo) results = results.filter((e) => e.timestamp <= dateTo);
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (e) =>
        e.action.toLowerCase().includes(q) ||
        e.agentName.toLowerCase().includes(q) ||
        e.taskTitle?.toLowerCase().includes(q) ||
        e.errorMessage?.toLowerCase().includes(q) ||
        e.tags?.some((t) => t.includes(q))
    );
  }

  // Sort newest first
  results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const total = results.length;
  const offset = (page - 1) * limit;
  const paginated = results.slice(offset, offset + limit);

  return NextResponse.json({
    data: paginated,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
