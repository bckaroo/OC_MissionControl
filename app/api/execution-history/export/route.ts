import { NextRequest, NextResponse } from "next/server";
import { mockExecutionHistory } from "@/lib/executionHistoryData";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";
  const agent = searchParams.get("agent");
  const status = searchParams.get("status");

  let data = [...mockExecutionHistory];
  if (agent) data = data.filter((e) => e.agentId === agent);
  if (status) data = data.filter((e) => e.status === status);
  data.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (format === "csv") {
    const headers = [
      "id", "timestamp", "agentName", "action", "actionType",
      "status", "durationMs", "taskTitle", "tags", "errorMessage",
    ];
    const rows = data.map((e) =>
      [
        e.id,
        e.timestamp,
        e.agentName,
        `"${e.action.replace(/"/g, '""')}"`,
        e.actionType,
        e.status,
        e.durationMs ?? "",
        `"${(e.taskTitle ?? "").replace(/"/g, '""')}"`,
        `"${(e.tags ?? []).join(", ")}"`,
        `"${(e.errorMessage ?? "").replace(/"/g, '""')}"`,
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="execution-history-${Date.now()}.csv"`,
      },
    });
  }

  // Default JSON
  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), total: data.length, data }, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="execution-history-${Date.now()}.json"`,
    },
  });
}
