import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const FEEDBACK_PATH = "C:\\Users\\abuck\\.openclaw\\agents\\main\\sessions\\reasoning-feedback.json";

interface FeedbackEntry {
  agentKey: string;
  reasoningId: string;
  feedback: "good" | "wrong";
  comment?: string;
  timestamp: string;
}

async function loadFeedback(): Promise<Record<string, FeedbackEntry>> {
  try {
    const raw = await readFile(FEEDBACK_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveFeedback(data: Record<string, FeedbackEntry>) {
  await writeFile(FEEDBACK_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// POST /api/agents/[id]/reasoning/feedback
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const key = decodeURIComponent(id);
    const body = await req.json();
    const { reasoningId, feedback, comment } = body as {
      reasoningId: string;
      feedback: "good" | "wrong";
      comment?: string;
    };

    if (!reasoningId || !["good", "wrong"].includes(feedback)) {
      return NextResponse.json({ error: "Invalid request: reasoningId and feedback (good|wrong) required" }, { status: 400 });
    }

    const allFeedback = await loadFeedback();
    allFeedback[`${key}::${reasoningId}`] = {
      agentKey: key,
      reasoningId,
      feedback,
      comment,
      timestamp: new Date().toISOString(),
    };
    await saveFeedback(allFeedback);

    return NextResponse.json({ success: true, recorded: { reasoningId, feedback } });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// GET /api/agents/[id]/reasoning/feedback — fetch all feedback for this agent
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const key = decodeURIComponent(id);
    const allFeedback = await loadFeedback();

    const agentFeedback = Object.values(allFeedback)
      .filter(f => f.agentKey === key)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const goodCount = agentFeedback.filter(f => f.feedback === "good").length;
    const wrongCount = agentFeedback.filter(f => f.feedback === "wrong").length;
    const qualityScore = agentFeedback.length > 0
      ? Math.round((goodCount / agentFeedback.length) * 100)
      : null;

    return NextResponse.json({
      agentKey: key,
      feedback: agentFeedback,
      stats: { good: goodCount, wrong: wrongCount, total: agentFeedback.length, qualityScore },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error), feedback: [], stats: {} }, { status: 200 });
  }
}
