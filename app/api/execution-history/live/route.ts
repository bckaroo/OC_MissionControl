import { NextResponse, NextRequest } from "next/server";
import { readFile, readdir } from "fs/promises";
import path from "path";
import { createReadStream } from "fs";
import { createInterface } from "readline";

const SESSIONS_DIR = "C:\\Users\\abuck\\.openclaw\\agents\\main\\sessions";

interface ExecutionEntry {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: number;
  command: string;
  result: string;
  status: "success" | "failed" | "pending";
  duration?: number;
  toolsUsed?: string[];
}

interface ExecutionHistoryResponse {
  entries: ExecutionEntry[];
  total: number;
  lastUpdated: number;
  filters: {
    agent?: string;
    status?: string;
    days?: number;
  };
}

// Parse agent name from session key
function getAgentName(sessionKey: string): string {
  if (sessionKey === "agent:main:main") return "XiaoZhu";
  if (sessionKey.includes("subagent:")) {
    const parts = sessionKey.split(":");
    const id = parts[parts.length - 1];
    // Map known subagent IDs to names
    const nameMap: Record<string, string> = {
      "5bcaa291-a57c-44dd-b527-cc98cd6f8ca5": "xiaomao",
      "dc0fe98b-32de-407a-a9f4-19547922189d": "xiaohu",
      "c018cb28-28f7-45e8-859a-da3a786dbba8": "xiaoya",
      "3cb7d96b-d7e6-4643-a799-046a835f1350": "xiaomao",
      "4f42927d-bf5b-4b54-867b-ee4b00c51920": "xiaohua",
    };
    return nameMap[id] || `Agent ${id.slice(0, 8)}`;
  }
  return "Unknown";
}

// Read JSONL file and extract executions
async function readSessionFile(filePath: string, sessionKey: string): Promise<ExecutionEntry[]> {
  const entries: ExecutionEntry[] = [];
  const agentName = getAgentName(sessionKey);
  const agentId = sessionKey;

  return new Promise((resolve) => {
    const rl = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity,
    });

    let lineNum = 0;
    rl.on("line", (line) => {
      try {
        const entry = JSON.parse(line);

        // Look for executed tasks or completed operations
        if (entry.role === "assistant" && entry.content) {
          const content = typeof entry.content === "string" ? entry.content : entry.content.toString();

          // Pattern matching for execution indicators
          if (
            content.includes("executed") ||
            content.includes("completed") ||
            content.includes("ran ") ||
            content.includes("finished") ||
            content.includes("done")
          ) {
            entries.push({
              id: `${sessionKey}-${lineNum}`,
              agentId,
              agentName,
              timestamp: entry.timestamp || Date.now(),
              command: content.slice(0, 150), // First 150 chars
              result: content.slice(0, 300), // First 300 chars
              status: content.includes("failed") || content.includes("error") ? "failed" : "success",
              toolsUsed: entry.toolResults
                ? Object.keys(entry.toolResults).map((k) => k.split("/")[0])
                : undefined,
            });
          }
        }
      } catch (e) {
        // Ignore parse errors for malformed JSON lines
      }
      lineNum++;
    });

    rl.on("close", () => {
      resolve(entries);
    });

    rl.on("error", () => {
      resolve(entries);
    });
  });
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const filterAgent = searchParams.get("agent");
    const filterStatus = searchParams.get("status");
    const filterDays = searchParams.get("days") ? parseInt(searchParams.get("days")!) : 7;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 100;

    const cutoffTime = Date.now() - filterDays * 24 * 60 * 60 * 1000;
    const allEntries: ExecutionEntry[] = [];

    // Read all session files
    try {
      const files = await readdir(SESSIONS_DIR);
      const jsonlFiles = files.filter((f) => f.endsWith(".jsonl"));

      for (const file of jsonlFiles) {
        const filePath = path.join(SESSIONS_DIR, file);
        // Try to infer session key from filename
        const sessionKey = file.replace(".jsonl", "");
        const entries = await readSessionFile(filePath, sessionKey);
        allEntries.push(...entries);
      }
    } catch (error) {
      console.error("Failed to read sessions:", error);
    }

    // Filter
    let filtered = allEntries.filter((e) => e.timestamp >= cutoffTime);

    if (filterAgent) {
      filtered = filtered.filter((e) => e.agentName.toLowerCase().includes(filterAgent.toLowerCase()));
    }

    if (filterStatus) {
      filtered = filtered.filter((e) => e.status === filterStatus);
    }

    // Sort by timestamp desc and limit
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    filtered = filtered.slice(0, limit);

    const response: ExecutionHistoryResponse = {
      entries: filtered,
      total: filtered.length,
      lastUpdated: Date.now(),
      filters: {
        agent: filterAgent || undefined,
        status: filterStatus || undefined,
        days: filterDays,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Execution history API error:", error);
    return NextResponse.json(
      {
        entries: [],
        total: 0,
        lastUpdated: Date.now(),
        filters: {},
        error: String(error),
      },
      { status: 200 }
    );
  }
}
