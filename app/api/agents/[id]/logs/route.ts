import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const SESSIONS_DIR = "C:\\Users\\abuck\\.openclaw\\agents\\main\\sessions";
const SESSIONS_PATH = `${SESSIONS_DIR}\\sessions.json`;

interface LogEntry {
  role: string;
  content: string | Array<{ type: string; text?: string }>;
  timestamp?: number;
}

function extractText(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter(c => c.type === "text" && c.text)
      .map(c => c.text!)
      .join(" ");
  }
  return "";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const key = decodeURIComponent(id);
    
    // Get session file path
    const sessionsRaw = await readFile(SESSIONS_PATH, "utf-8");
    const sessions = JSON.parse(sessionsRaw);
    const session = sessions[key];

    if (!session) {
      return NextResponse.json({ error: "Session not found", logs: [] }, { status: 200 });
    }

    const sessionFile = session.sessionFile;
    if (!sessionFile) {
      return NextResponse.json({ logs: [], note: "No session file" });
    }

    let logs: Array<{ role: string; preview: string; timestamp?: string; index: number }> = [];
    
    try {
      const raw = await readFile(sessionFile, "utf-8");
      const lines = raw.trim().split("\n").filter(Boolean);
      
      // Parse JSONL — each line is a message
      const messages = lines.map(line => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(Boolean);

      // Get last 20 entries
      const recent = messages.slice(-20);
      logs = recent.map((msg: any, i: number) => ({
        role: msg.role || "unknown",
        preview: extractText(msg.content).slice(0, 200),
        index: i,
        timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : undefined,
      }));
    } catch (fileErr) {
      logs = [];
    }

    return NextResponse.json({ 
      key, 
      sessionId: session.sessionId,
      logs,
      count: logs.length,
      sessionFile
    });
  } catch (error) {
    return NextResponse.json({ error: String(error), logs: [] }, { status: 200 });
  }
}
