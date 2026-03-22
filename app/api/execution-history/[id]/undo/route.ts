import { NextRequest, NextResponse } from "next/server";
import { mockExecutionHistory } from "@/lib/executionHistoryData";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = mockExecutionHistory.find((e) => e.id === id);

  if (!entry) return NextResponse.json({ error: "Execution not found" }, { status: 404 });
  if (!entry.undoAvailable) {
    return NextResponse.json(
      { error: "Undo not available for this execution", reason: "Action is irreversible or already undone" },
      { status: 409 }
    );
  }
  if (entry.undoPerformed) {
    return NextResponse.json({ error: "Undo already performed" }, { status: 409 });
  }

  // In a real system this would revert file changes, etc.
  entry.undoPerformed = true;
  entry.undoAvailable = false;

  return NextResponse.json({
    success: true,
    message: `Undo performed for: ${entry.action}`,
    executionId: id,
    filesReverted: entry.filesChanged?.filter((f) => f.operation !== "read") ?? [],
  });
}
