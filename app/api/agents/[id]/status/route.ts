import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";

const SESSIONS_PATH = "C:\\Users\\abuck\\.openclaw\\agents\\main\\sessions\\sessions.json";

function formatAge(ageMs: number): string {
  if (ageMs < 60_000) return "just now";
  if (ageMs < 3600_000) return `${Math.floor(ageMs / 60_000)}m ago`;
  if (ageMs < 86400_000) return `${Math.floor(ageMs / 3600_000)}h ago`;
  return `${Math.floor(ageMs / 86400_000)}d ago`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const key = decodeURIComponent(id);
    const raw = await readFile(SESSIONS_PATH, "utf-8");
    const data = JSON.parse(raw);
    const session = data[key];

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const now = Date.now();
    const ageMs = now - (session.updatedAt || 0);

    return NextResponse.json({
      key,
      sessionId: session.sessionId,
      model: session.model,
      modelProvider: session.modelProvider,
      totalTokens: session.totalTokens,
      inputTokens: session.inputTokens,
      outputTokens: session.outputTokens,
      contextTokens: session.contextTokens,
      updatedAt: session.updatedAt,
      ageMs,
      lastActivity: formatAge(ageMs),
      abortedLastRun: session.abortedLastRun,
      spawnDepth: session.spawnDepth,
      spawnedBy: session.spawnedBy,
      channel: session.channel,
      sessionFile: session.sessionFile,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
