import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { agentRegistry } from "@/lib/agentRegistry";

const SESSIONS_PATH = "C:\\Users\\abuck\\.openclaw\\agents\\main\\sessions\\sessions.json";

export interface AgentSession {
  id: string;
  key: string;
  sessionId: string;
  kind: "main" | "subagent" | "slash";
  name: string;
  serialNumber: string;
  displayName: string;
  emoji: string;
  role: string;
  specialization: string;
  status: "working" | "idle" | "blocked" | "offline";
  model: string;
  updatedAt: number;
  ageMs: number;
  totalTokens: number | null;
  spawnDepth: number;
  spawnedBy: string | null;
  abortedLastRun: boolean;
  currentTask: string | null;
  taskCategory?: string;
  taskConfidence?: number;
  lastActivity: string;
  sessionFile: string | null;
  capabilities: string[];
}

function deriveStatus(session: {
  updatedAt: number;
  ageMs: number;
  abortedLastRun?: boolean;
}): "working" | "idle" | "blocked" | "offline" {
  if (session.abortedLastRun) return "blocked";
  if (session.ageMs < 90_000) return "working";
  if (session.ageMs < 30 * 60_000) return "idle";
  return "offline";
}

function formatAge(ageMs: number): string {
  if (ageMs < 60_000) return "just now";
  if (ageMs < 3600_000) return `${Math.floor(ageMs / 60_000)}m ago`;
  if (ageMs < 86400_000) return `${Math.floor(ageMs / 3600_000)}h ago`;
  return `${Math.floor(ageMs / 86400_000)}d ago`;
}

// Official XiaoZhu subagent roster
const OFFICIAL_ROSTER: Record<string, { name: string; emoji: string; role: string }> = {
  "xiaoya": { name: "xiaoya", emoji: "🪳", role: "Coding & Debugging Specialist" },
  "xiaohu": { name: "xiaohu", emoji: "🪳", role: "Deep Reasoning & Analysis" },
  "xiaomao": { name: "xiaomao", emoji: "🪳", role: "Writing & Documentation" },
  "xiaozhu-vision": { name: "xiaozhu-vision", emoji: "🪳", role: "Vision & Multimodal" },
};

function parseSessionKey(key: string): { kind: "main" | "subagent" | "slash"; id: string; name: string; emoji: string; role: string } {
  if (key === "agent:main:main") {
    return { kind: "main", id: "main", name: "XiaoZhu", emoji: "🐖", role: "Main Agent / Chief of Staff" };
  }
  
  if (key.startsWith("agent:main:subagent:")) {
    const subId = key.replace("agent:main:subagent:", "");
    
    // Try to match against official roster first
    for (const [rosterName, rosterData] of Object.entries(OFFICIAL_ROSTER)) {
      if (subId.includes(rosterName)) {
        return { 
          kind: "subagent", 
          id: rosterName, 
          name: rosterData.name, 
          emoji: rosterData.emoji, 
          role: rosterData.role 
        };
      }
    }
    
    // Fallback for unregistered subagents (UUID-based)
    // These are dynamically spawned; assign to roster based on model later
    return { 
      kind: "subagent", 
      id: subId.slice(0, 8), 
      name: `Subagent-${subId.slice(0, 8).toUpperCase()}`, 
      emoji: "🪳", 
      role: "Subagent" 
    };
  }
  
  // Discord channel sessions → Session Bots
  if (key.includes(":discord:channel:")) {
    return { kind: "slash", id: "discord-session", name: "Discord Session", emoji: "💬", role: "Discord Channel Bot" };
  }
  
  // Telegram slash sessions
  if (key.includes(":slash:") || key.includes(":telegram:")) {
    return { kind: "slash", id: "telegram-session", name: "Telegram Session", emoji: "⚡", role: "Telegram Slash Bot" };
  }
  
  // Cron jobs
  if (key.includes(":cron:")) {
    return { kind: "slash", id: "cron-job", name: "Cron Job", emoji: "⏰", role: "Scheduled Task" };
  }
  
  return { kind: "slash", id: key.slice(-8), name: "Session Bot", emoji: "🤖", role: "Transient Session" };
}

export async function GET() {
  try {
    const raw = await readFile(SESSIONS_PATH, "utf-8");
    const data = JSON.parse(raw);

    const agents: AgentSession[] = [];
    const now = Date.now();

    for (const [key, session] of Object.entries(data as Record<string, any>)) {
      if (!session || typeof session !== "object") continue;

      // Don't skip — we'll separate them into official agents vs sessions below

      const { kind, id, name, emoji, role } = parseSessionKey(key);
      const ageMs = now - (session.updatedAt || 0);
      const status = deriveStatus({ updatedAt: session.updatedAt, ageMs, abortedLastRun: session.abortedLastRun });

      // Infer model from session or use defaults
      let inferredModel = session.model;
      if (!inferredModel) {
        if (kind === "main") {
          inferredModel = "lmstudio/qwen/qwen3.5-9b";
        } else if (key.includes("coder") || key.includes("xiaoya")) {
          inferredModel = "lmstudio/qwen/qwen3-coder-30b";
        } else if (key.includes("reason") || key.includes("xiaohu")) {
          inferredModel = "lmstudio/deepseek/deepseek-r1-0528-qwen3-8b";
        } else if (key.includes("vision") || key.includes("xiaozhu-vision")) {
          inferredModel = "lmstudio/qwen/qwen3-vl-30b";
        } else if (key.includes("xiaomao")) {
          inferredModel = "lmstudio/qwen/qwen3-coder-30b";
        } else {
          inferredModel = "lmstudio/qwen/qwen3.5-9b";
        }
      }

      // Register in agent registry and get profile info
      const identifier = agentRegistry.registerInstance(
        key,
        inferredModel,
        status,
        session.currentTask
      );

      agents.push({
        id: encodeURIComponent(key),
        key,
        sessionId: session.sessionId || "",
        kind,
        name: identifier.profile.displayName,
        serialNumber: identifier.serialNumber,
        displayName: identifier.profile.displayName,
        emoji: identifier.profile.emoji,
        role: identifier.profile.role,
        specialization: identifier.profile.specialization,
        status,
        model: inferredModel,
        updatedAt: session.updatedAt || 0,
        ageMs,
        totalTokens: session.totalTokens || null,
        spawnDepth: session.spawnDepth || 0,
        spawnedBy: session.spawnedBy || null,
        abortedLastRun: session.abortedLastRun || false,
        currentTask: identifier.taskInference?.task || null,
        taskCategory: identifier.taskInference?.category,
        taskConfidence: identifier.taskInference?.confidence,
        lastActivity: formatAge(ageMs),
        sessionFile: session.sessionFile || null,
        capabilities: identifier.profile.capabilities,
      });
    }

    // If no agents found, create mock entries for the official roster (development fallback)
    if (agents.length === 0) {
      const officialRosterKeys = [
        "agent:main:main",
        "agent:main:subagent:xiaoya",
        "agent:main:subagent:xiaohu",
        "agent:main:subagent:xiaomao",
        "agent:main:subagent:xiaozhu-vision",
      ];

      for (const key of officialRosterKeys) {
        const { kind, id, name, emoji, role } = parseSessionKey(key);
        const identifier = agentRegistry.registerInstance(
          key,
          "lmstudio/qwen/qwen3.5-9b",
          "idle",
          "Awaiting tasks"
        );

        agents.push({
          id: encodeURIComponent(key),
          key,
          sessionId: "",
          kind,
          name: identifier.profile.displayName,
          serialNumber: identifier.serialNumber,
          displayName: identifier.profile.displayName,
          emoji: identifier.profile.emoji,
          role: identifier.profile.role,
          specialization: identifier.profile.specialization,
          status: "idle",
          model: "lmstudio/qwen/qwen3.5-9b",
          updatedAt: now,
          ageMs: 0,
          totalTokens: null,
          spawnDepth: 0,
          spawnedBy: null,
          abortedLastRun: false,
          currentTask: null,
          taskCategory: "unknown",
          taskConfidence: 0,
          lastActivity: "just now",
          sessionFile: null,
          capabilities: identifier.profile.capabilities,
        });
      }
    }

    // Sort: main first, then by priority, then by updatedAt desc
    agents.sort((a, b) => {
      if (a.kind === "main") return -1;
      if (b.kind === "main") return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    return NextResponse.json({ agents, source: agents.length > 0 ? "live" : "fallback", count: agents.length });
  } catch (error) {
    console.error("Failed to read sessions:", error);
    return NextResponse.json({ agents: [], source: "error", error: String(error) }, { status: 200 });
  }
}
