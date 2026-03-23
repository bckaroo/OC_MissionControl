import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

/**
 * SubagentActivityRecord - Represents the current activity of a subagent
 * Extracted from the agent's live session JSONL file
 */
interface SubagentActivityRecord {
  /** Current task/prompt text from the most recent user message */
  currentTask: string | null;
  
  /** Agent status: working (active in last 90s), idle (last activity 90s-30m ago), blocked (error), offline (>30m) */
  status: "working" | "idle" | "blocked" | "offline";
  
  /** Progress estimate or context about what the agent is doing */
  progressEstimate: string | null;
  
  /** List of skills/tools used in recent messages */
  skillsUsed: string[];
  
  /** Timestamp when the current task started (ISO 8601) */
  startTime: string | null;
  
  /** Number of messages processed in this session */
  messageCount: number;
  
  /** Timestamp of the last update (ISO 8601) */
  lastUpdated: string | null;
  
  /** Raw entry count parsed from the JSONL file */
  entryCount: number;
  
  /** Detailed error information if parsing failed */
  error: string | null;
}

/**
 * SessionEntry - Represents a single line in the JSONL file
 */
interface SessionEntry {
  type: string;
  id?: string;
  timestamp?: string;
  message?: {
    role: string;
    content?: string | Array<{ type: string; text?: string; thinking?: string }>;
  };
  toolCall?: {
    id: string;
    name: string;
  };
  [key: string]: any;
}

/**
 * Extract text content from a message's content array
 */
function extractTextContent(
  content?: string | Array<{ type: string; text?: string; thinking?: string }>
): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter(c => c.type === "text" && c.text)
      .map(c => c.text!)
      .join(" ");
  }
  return "";
}

/**
 * Extract tool names from a message's content array
 */
function extractToolNames(
  content: string | Array<{ type: string; text?: string; [key: string]: any }>
): string[] {
  if (typeof content === "string") return [];
  if (Array.isArray(content)) {
    const tools = content
      .filter(c => c.type === "toolCall" && c.name)
      .map(c => c.name!)
      .filter((name, idx, arr) => arr.indexOf(name) === idx); // deduplicate
    return tools;
  }
  return [];
}

/**
 * Determine agent status based on most recent activity timestamp
 */
function deriveStatus(
  lastUpdated: string | null,
  hasError: boolean
): "working" | "idle" | "blocked" | "offline" {
  if (hasError) return "blocked";
  
  if (!lastUpdated) return "offline";
  
  const now = Date.now();
  const lastMs = new Date(lastUpdated).getTime();
  const ageMs = now - lastMs;
  
  // working: activity in last 90 seconds
  if (ageMs < 90_000) return "working";
  // idle: activity 90s - 30m ago
  if (ageMs < 30 * 60_000) return "idle";
  // offline: no activity for >30m
  return "offline";
}

/**
 * Parse a JSONL session file and extract activity information
 * 
 * The JSONL file contains one JSON object per line, each representing
 * a session event (messages, model changes, tool calls, etc.)
 */
async function parseSessionFile(sessionFilePath: string): Promise<{
  entries: SessionEntry[];
  error: string | null;
}> {
  try {
    const raw = await readFile(sessionFilePath, "utf-8");
    const lines = raw.trim().split("\n").filter(l => l.length > 0);
    
    const entries: SessionEntry[] = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as SessionEntry;
        entries.push(entry);
      } catch (parseErr) {
        // Skip malformed lines but continue parsing
        console.warn(`Failed to parse JSONL line: ${parseErr}`);
      }
    }
    
    return { entries, error: null };
  } catch (err) {
    return {
      entries: [],
      error: `Failed to read session file: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Extract the most recent user message from entries
 * User messages contain the task/prompt information
 */
function findCurrentTask(entries: SessionEntry[]): { task: string | null; timestamp: string | null } {
  // Search backwards for the most recent user message
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    
    if (entry.type === "message" && entry.message?.role === "user") {
      const content = entry.message.content;
      const text = extractTextContent(content);
      
      // Return the task text (limit to 500 chars)
      return {
        task: text.slice(0, 500),
        timestamp: entry.timestamp || null,
      };
    }
  }
  
  return { task: null, timestamp: null };
}

/**
 * Find the start time of the current task
 * This is the timestamp of the first user message (or session start)
 */
function findTaskStartTime(entries: SessionEntry[]): string | null {
  // The first entry is usually the session header
  if (entries.length > 0 && entries[0].type === "session" && entries[0].timestamp) {
    return entries[0].timestamp;
  }
  
  // Otherwise, find the first user message
  for (const entry of entries) {
    if (entry.type === "message" && entry.message?.role === "user" && entry.timestamp) {
      return entry.timestamp;
    }
  }
  
  return null;
}

/**
 * Collect all unique skills/tools used in the session
 */
function collectSkillsUsed(entries: SessionEntry[]): string[] {
  const skills = new Set<string>();
  
  for (const entry of entries) {
    // Tool calls in assistant messages
    if (entry.type === "message" && entry.message?.role === "assistant") {
      const content = entry.message.content;
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.type === "toolCall" && item.name) {
            skills.add(item.name);
          }
        }
      }
    }
    
    // Also check for tool result entries
    if (entry.type === "toolResult" && entry.toolName) {
      skills.add(entry.toolName);
    }
  }
  
  return Array.from(skills).sort();
}

/**
 * Estimate current progress based on recent activity
 */
function estimateProgress(entries: SessionEntry[]): string | null {
  if (entries.length === 0) return null;
  
  // Look at the last few entries to infer progress
  const recent = entries.slice(-5);
  
  // Check if there's an error
  for (const entry of recent) {
    if (entry.type === "message" && entry.message?.role === "assistant") {
      const content = entry.message.content;
      if (Array.isArray(content)) {
        // If the last message has tool calls, we're in progress
        const hasTools = content.some(c => c.type === "toolCall");
        if (hasTools) {
          const toolNames = content
            .filter(c => c.type === "toolCall" && c.name)
            .map(c => c.name!)
            .join(", ");
          return `Executing: ${toolNames}`;
        }
      }
    }
  }
  
  // Check for errors in recent messages
  for (const entry of recent.reverse()) {
    if (entry.type === "message" && entry.message?.role === "assistant") {
      const text = extractTextContent(entry.message.content);
      if (text.toLowerCase().includes("error") || text.toLowerCase().includes("failed")) {
        return "Handling error...";
      }
    }
  }
  
  return "Processing...";
}

/**
 * GET /api/agents/[id]/activity
 * 
 * Returns current activity for an agent based on their session JSONL file
 * 
 * @param req - Next.js request object
 * @param params - Route parameters including {id} (the agent's encoded session key)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<SubagentActivityRecord>> {
  try {
    const { id } = await params;
    const sessionKey = decodeURIComponent(id);
    
    // Construct session file path from the agent key
    // Agent keys follow pattern: agent:main:subagent:{sessionId}
    // or agent:main:main for the main agent
    // Session files are stored at: C:\Users\abuck\.openclaw\agents\main\sessions\{sessionId}.jsonl
    
    let sessionId = sessionKey;
    if (sessionKey.includes(":")) {
      // Extract the session ID from the key
      const parts = sessionKey.split(":");
      sessionId = parts[parts.length - 1];
    }
    
    // Handle special case for main agent
    if (sessionKey === "agent:main:main") {
      sessionId = "main";
    }
    
    // Build the full path to the session file
    const sessionFilePath = `C:\\Users\\abuck\\.openclaw\\agents\\main\\sessions\\${sessionId}.jsonl`;
    
    // Parse the session file
    const { entries, error: parseError } = await parseSessionFile(sessionFilePath);
    
    // If we couldn't parse the file but it exists, return error status
    if (parseError && entries.length === 0) {
      return NextResponse.json<SubagentActivityRecord>(
        {
          currentTask: null,
          status: "offline",
          progressEstimate: null,
          skillsUsed: [],
          startTime: null,
          messageCount: 0,
          lastUpdated: null,
          entryCount: 0,
          error: parseError,
        },
        { status: 200 }
      );
    }
    
    // Extract activity information from entries
    const { task, timestamp: currentTaskTime } = findCurrentTask(entries);
    const startTime = findTaskStartTime(entries);
    const skillsUsed = collectSkillsUsed(entries);
    const progressEstimate = estimateProgress(entries);
    
    // Count messages (entries with type === "message")
    const messageCount = entries.filter(e => e.type === "message").length;
    
    // Determine status based on last update timestamp
    const lastUpdated = entries[entries.length - 1]?.timestamp || null;
    const status = deriveStatus(lastUpdated, parseError !== null);
    
    const record: SubagentActivityRecord = {
      currentTask: task,
      status,
      progressEstimate,
      skillsUsed,
      startTime,
      messageCount,
      lastUpdated,
      entryCount: entries.length,
      error: parseError,
    };
    
    return NextResponse.json(record, { status: 200 });
  } catch (err) {
    console.error("Error in /api/agents/[id]/activity:", err);
    
    return NextResponse.json<SubagentActivityRecord>(
      {
        currentTask: null,
        status: "blocked",
        progressEstimate: null,
        skillsUsed: [],
        startTime: null,
        messageCount: 0,
        lastUpdated: null,
        entryCount: 0,
        error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 200 }
    );
  }
}
