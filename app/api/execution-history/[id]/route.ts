import { NextRequest, NextResponse } from "next/server";
import { mockExecutionHistory } from "@/lib/executionHistoryData";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = mockExecutionHistory.find((e) => e.id === id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Hydrate related entries
  const children = mockExecutionHistory.filter((e) => e.parentExecutionId === id);
  const parent = entry.parentExecutionId
    ? mockExecutionHistory.find((e) => e.id === entry.parentExecutionId)
    : null;

  return NextResponse.json({ data: entry, children, parent: parent ?? null });
}
