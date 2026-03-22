import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";

const SESSIONS_PATH = "C:\\Users\\abuck\\.openclaw\\agents\\main\\sessions\\sessions.json";

interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

interface TextBlock {
  type: "text";
  text: string;
}

type ContentBlock = ThinkingBlock | TextBlock | { type: string; [key: string]: unknown };

interface MessageEntry {
  role?: string;
  content?: string | ContentBlock[];
  timestamp?: number;
  inputTokens?: number;
  outputTokens?: number;
  thinkingTokens?: number;
  totalTokens?: number;
}

function extractText(content: string | ContentBlock[]): string {
  if (typeof content === "string") return content.slice(0, 300);
  if (!Array.isArray(content)) return "";
  return content
    .filter(c => c.type === "text" && "text" in c)
    .map(c => (c as TextBlock).text)
    .join(" ")
    .slice(0, 300);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const dateFilter = searchParams.get("date"); // YYYY-MM-DD
  const taskType = searchParams.get("taskType");

  try {
    const key = decodeURIComponent(id);
    const sessionsRaw = await readFile(SESSIONS_PATH, "utf-8");
    const sessions = JSON.parse(sessionsRaw);
    const session = sessions[key];

    if (!session?.sessionFile) {
      return NextResponse.json({ history: [], count: 0 });
    }

    let history: Array<{
      id: string;
      timestamp: string;
      timestampMs: number;
      thinkingPreview: string;
      responsePreview: string;
      tokenUsage: { thinking: number; total: number };
      feedback?: "good" | "wrong";
      hasThinking: boolean;
    }> = [];

    try {
      const raw = await readFile(session.sessionFile, "utf-8");
      const lines = raw.trim().split("\n").filter(Boolean);
      const messages: MessageEntry[] = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

      let idx = 0;
      for (let i = messages.length - 1; i >= 0 && history.length < limit; i--) {
        const msg = messages[i];
        if (msg.role !== "assistant") continue;

        const hasThinking = Array.isArray(msg.content) &&
          msg.content.some(c => c.type === "thinking");

        const thinkingText = hasThinking && Array.isArray(msg.content)
          ? (msg.content.filter(c => c.type === "thinking") as ThinkingBlock[])
              .map(b => b.thinking).join(" ").slice(0, 200)
          : "";

        const responseText = extractText(Array.isArray(msg.content) ? msg.content : []);
        const ts = msg.timestamp || session.updatedAt || Date.now();
        const dateStr = new Date(ts).toISOString().slice(0, 10);

        if (dateFilter && dateStr !== dateFilter) continue;

        history.push({
          id: `h-${key.slice(-8)}-${i}`,
          timestamp: new Date(ts).toISOString(),
          timestampMs: ts,
          thinkingPreview: thinkingText || "(no thinking captured)",
          responsePreview: responseText || "(no response)",
          tokenUsage: {
            thinking: msg.thinkingTokens || (thinkingText ? Math.floor(thinkingText.length / 4) : 0),
            total: msg.totalTokens || 0,
          },
          hasThinking,
        });
        idx++;
      }
    } catch {
      // unreadable
    }

    return NextResponse.json({ agentKey: key, history, count: history.length });
  } catch (error) {
    return NextResponse.json({ error: String(error), history: [], count: 0 }, { status: 200 });
  }
}
