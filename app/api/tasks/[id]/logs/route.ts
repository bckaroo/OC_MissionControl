import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const TASK_LOGS_DIR = path.join(DATA_DIR, "task-logs");

interface TaskLog {
  id: string;
  taskId: string;
  agentId: string;
  timestamp: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  context?: Record<string, any>;
}

interface TaskLogStore {
  logs: TaskLog[];
}

async function readTaskLogs(taskId: string): Promise<TaskLogStore> {
  const logFile = path.join(TASK_LOGS_DIR, `${taskId}.json`);
  try {
    const raw = await readFile(logFile, "utf-8");
    return JSON.parse(raw) as TaskLogStore;
  } catch {
    return { logs: [] };
  }
}

async function writeTaskLogs(taskId: string, store: TaskLogStore): Promise<void> {
  await mkdir(TASK_LOGS_DIR, { recursive: true });
  const logFile = path.join(TASK_LOGS_DIR, `${taskId}.json`);
  await writeFile(logFile, JSON.stringify(store, null, 2), "utf-8");
}

// GET /api/tasks/[id]/logs - Get all logs for a task
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const store = await readTaskLogs(taskId);
    return NextResponse.json({ taskId, logs: store.logs });
  } catch (error) {
    console.error("Failed to read task logs:", error);
    return NextResponse.json({ logs: [] });
  }
}

// POST /api/tasks/[id]/logs - Add a log entry
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const body = await request.json();
    const { agentId, severity, message, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message required" },
        { status: 400 }
      );
    }

    const log: TaskLog = {
      id: `log-${Date.now()}`,
      taskId,
      agentId: agentId || "system",
      timestamp: new Date().toISOString(),
      severity: severity || "info",
      message,
      context,
    };

    const store = await readTaskLogs(taskId);
    store.logs.push(log);
    await writeTaskLogs(taskId, store);

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error("Failed to create task log:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
