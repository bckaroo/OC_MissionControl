import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";
import os from "os";

interface OverviewData {
  systemHealth: {
    cpu: number;
    ram: number;
    gpu: number;
  };
  todayStats: {
    tasksCompleted: number;
    tokensBurned: number;
    runtime: string;
    avgResponseTime: string;
  };
  activeNow: {
    runningTasks: number;
    activeAgents: string[];
    currentModel: string;
  };
  alerts: Array<{
    id: string;
    level: "critical" | "warning" | "info";
    message: string;
  }>;
  modelPerformance: Array<{
    model: string;
    tokensUsed: number;
    accuracy: number;
  }>;
  recentCompletions: Array<{
    id: string;
    title: string;
    completedAt: string;
    duration: string;
  }>;
  upcoming: Array<{
    id: string;
    title: string;
    scheduledAt: string;
    type: "backup" | "task" | "check";
  }>;
  memorySnapshot: {
    lastUpdate: string;
    keyInsights: string[];
  };
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function getSystemHealth() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryPercentage = (usedMemory / totalMemory) * 100;

  const cpus = os.cpus();
  const numCores = cpus.length;
  const loadAverage = os.loadavg();
  const cpuUsage = Math.min((loadAverage[0] / numCores) * 100, 100);

  return {
    cpu: Math.round(cpuUsage * 10) / 10,
    ram: Math.round(memoryPercentage * 10) / 10,
    gpu: 35, // Placeholder - would need GPU query library in production
  };
}

function getTodayStats(): { tasksCompleted: number; tokensBurned: number; runtime: string; avgResponseTime: string } {
  try {
    const tasksFile = path.join(process.cwd(), "data", "tasks.json");
    if (!existsSync(tasksFile)) {
      return { tasksCompleted: 0, tokensBurned: 0, runtime: "0m", avgResponseTime: "0ms" };
    }

    const data = JSON.parse(readFileSync(tasksFile, "utf-8"));
    const tasks = data.tasks || [];
    const today = getTodayDate();

    // Count completed tasks today
    const completedToday = tasks.filter((t: any) => {
      if (t.status !== "done") return false;
      if (!t.executedAt) return false;
      const executedDate = t.executedAt.split("T")[0];
      return executedDate === today;
    });

    // Rough estimates based on task count
    const tokensBurned = completedToday.length * 150_000; // avg 150k per task
    const runtime = formatUptime(completedToday.length * 300); // avg 5min per task
    const avgResponseTime = completedToday.length > 0 ? "2.3s" : "0s";

    return {
      tasksCompleted: completedToday.length,
      tokensBurned,
      runtime,
      avgResponseTime,
    };
  } catch (error) {
    return { tasksCompleted: 0, tokensBurned: 0, runtime: "0m", avgResponseTime: "0s" };
  }
}

function getActiveNow(): { runningTasks: number; activeAgents: string[]; currentModel: string } {
  try {
    const tasksFile = path.join(process.cwd(), "data", "tasks.json");
    if (!existsSync(tasksFile)) {
      return { runningTasks: 0, activeAgents: [], currentModel: "claude-haiku-4-5" };
    }

    const data = JSON.parse(readFileSync(tasksFile, "utf-8"));
    const tasks = data.tasks || [];

    const running = tasks.filter((t: any) => t.executionStatus === "running");
    const activeAgents = ["xiaoguo", "xiaohu"]; // Placeholder

    return {
      runningTasks: running.length,
      activeAgents: activeAgents.map(a => `${a} (working)`),
      currentModel: "claude-haiku-4-5",
    };
  } catch {
    return { runningTasks: 0, activeAgents: [], currentModel: "claude-haiku-4-5" };
  }
}

function getAlerts(): Array<{ id: string; level: "critical" | "warning" | "info"; message: string }> {
  const health = getSystemHealth();
  const alerts: Array<{ id: string; level: "critical" | "warning" | "info"; message: string }> = [];

  // Memory warning
  if (health.ram > 85) {
    alerts.push({
      id: "ram_warning",
      level: "warning",
      message: `RAM usage at ${health.ram}% — consider pausing non-critical tasks`,
    });
  }

  // CPU warning
  if (health.cpu > 80) {
    alerts.push({
      id: "cpu_warning",
      level: "warning",
      message: `CPU usage at ${health.cpu}% — system running hot`,
    });
  }

  // Token usage info
  alerts.push({
    id: "token_info",
    level: "info",
    message: "Token refresh scheduled for 2:15 PM",
  });

  return alerts;
}

function getModelPerformance(): Array<{ model: string; tokensUsed: number; accuracy: number }> {
  return [
    { model: "claude-haiku-4-5", tokensUsed: 1_250_000, accuracy: 94 },
    { model: "qwen3-coder-30b", tokensUsed: 890_000, accuracy: 92 },
    { model: "deepseek-r1-8b", tokensUsed: 310_000, accuracy: 96 },
  ];
}

function getRecentCompletions(): Array<{ id: string; title: string; completedAt: string; duration: string }> {
  try {
    const tasksFile = path.join(process.cwd(), "data", "tasks.json");
    if (!existsSync(tasksFile)) return [];

    const data = JSON.parse(readFileSync(tasksFile, "utf-8"));
    const tasks = data.tasks || [];
    const today = getTodayDate();

    const completed = tasks
      .filter((t: any) => t.status === "done" && t.executedAt?.split("T")[0] === today)
      .sort((a: any, b: any) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
      .slice(0, 5)
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        completedAt: new Date(t.executedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        duration: "~5m", // Placeholder
      }));

    return completed;
  } catch {
    return [];
  }
}

function getUpcoming(): Array<{ id: string; title: string; scheduledAt: string; type: "backup" | "task" | "check" }> {
  const now = new Date();
  const later = new Date(now.getTime() + 4 * 3600000); // Next 4 hours

  return [
    {
      id: "u1",
      type: "backup",
      title: "GitHub backup",
      scheduledAt: new Date(now.getTime() + 60 * 60000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    },
    {
      id: "u2",
      type: "task",
      title: "OCD_001 milestone review",
      scheduledAt: new Date(now.getTime() + 150 * 60000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    },
    {
      id: "u3",
      type: "check",
      title: "Hourly heartbeat check",
      scheduledAt: new Date(now.getTime() + 30 * 60000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    },
  ];
}

function getMemorySnapshot(): { lastUpdate: string; keyInsights: string[] } {
  try {
    const memoryFile = path.join(
      process.env.USERPROFILE || process.env.HOME || "/root",
      ".openclaw",
      "workspace",
      "MEMORY.md"
    );

    if (!existsSync(memoryFile)) {
      return {
        lastUpdate: "Never",
        keyInsights: ["Memory system not initialized"],
      };
    }

    const content = readFileSync(memoryFile, "utf-8");
    const lines = content.split("\n");

    // Extract last few lines as insights
    const insights = lines
      .filter(line => line.trim().startsWith("- ") || line.trim().startsWith("•"))
      .slice(-3)
      .map(line => line.replace(/^[\\s-•]+/, "").trim());

    const now = new Date();
    const lastUpdate = `Today at ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

    return {
      lastUpdate,
      keyInsights: insights.length > 0 ? insights : ["Check MEMORY.md for latest insights"],
    };
  } catch {
    return {
      lastUpdate: "Error reading memory",
      keyInsights: ["Unable to load MEMORY.md"],
    };
  }
}

export async function GET(): Promise<NextResponse<OverviewData>> {
  try {
    const overview: OverviewData = {
      systemHealth: getSystemHealth(),
      todayStats: getTodayStats(),
      activeNow: getActiveNow(),
      alerts: getAlerts(),
      modelPerformance: getModelPerformance(),
      recentCompletions: getRecentCompletions(),
      upcoming: getUpcoming(),
      memorySnapshot: getMemorySnapshot(),
    };

    return NextResponse.json(overview);
  } catch (error) {
    console.error("Failed to generate overview:", error);
    return NextResponse.json(
      {
        systemHealth: { cpu: 0, ram: 0, gpu: 0 },
        todayStats: { tasksCompleted: 0, tokensBurned: 0, runtime: "0m", avgResponseTime: "0s" },
        activeNow: { runningTasks: 0, activeAgents: [], currentModel: "error" },
        alerts: [{ id: "error", level: "critical", message: "Failed to load overview data" }],
        modelPerformance: [],
        recentCompletions: [],
        upcoming: [],
        memorySnapshot: { lastUpdate: "error", keyInsights: [] },
      },
      { status: 500 }
    );
  }
}
