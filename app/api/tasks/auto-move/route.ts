import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");
const TASK_MOVES_DIR = path.join(DATA_DIR, "task-moves");

interface TaskMove {
  id: string;
  taskId: string;
  agentId: string;
  action: "start-work" | "complete-work" | "request-changes" | "manual-move";
  oldStatus: string;
  newStatus: string;
  timestamp: string;
  result?: string;
  context?: Record<string, any>;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: "backlog" | "in-progress" | "review" | "done";
  projectId: string;
  assignee: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
  updatedAt: string;
  tags: string[];
  executionStatus: "pending" | "running" | "completed" | "failed" | null;
  executionResult: string | null;
  executedAt: string | null;
}

interface TaskStore {
  tasks: Task[];
}

async function readTasks(): Promise<TaskStore> {
  try {
    const raw = await readFile(TASKS_FILE, "utf-8");
    return JSON.parse(raw) as TaskStore;
  } catch {
    return { tasks: [] };
  }
}

async function writeTasks(store: TaskStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(TASKS_FILE, JSON.stringify(store, null, 2), "utf-8");
}

async function recordMove(move: TaskMove): Promise<void> {
  await mkdir(TASK_MOVES_DIR, { recursive: true });
  const movesFile = path.join(TASK_MOVES_DIR, "moves.jsonl");
  const line = JSON.stringify(move) + "\n";
  const fs = require("fs");
  fs.appendFileSync(movesFile, line);
}

// POST /api/tasks/auto-move - Agent-driven task movement
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, agentId, action, result, context } = body;

    if (!taskId || !agentId || !action) {
      return NextResponse.json(
        { error: "taskId, agentId, and action required" },
        { status: 400 }
      );
    }

    const validActions = ["start-work", "complete-work", "request-changes", "manual-move"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    const store = await readTasks();
    const taskIndex = store.tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const task = store.tasks[taskIndex];
    const oldStatus = task.status;
    let newStatus = oldStatus;

    // Determine new status based on action
    switch (action) {
      case "start-work":
        newStatus = "in-progress";
        break;
      case "complete-work":
        if (task.status === "in-progress") {
          newStatus = "review";
          if (result) task.executionResult = result;
          task.executionStatus = "completed";
          task.executedAt = new Date().toISOString();
        }
        break;
      case "request-changes":
        if (task.status === "review") {
          newStatus = "in-progress";
          if (result) task.executionResult = result;
        }
        break;
    }

    // Update task
    task.status = newStatus;
    task.updatedAt = new Date().toISOString();
    store.tasks[taskIndex] = task;
    await writeTasks(store);

    // Record the move
    const move: TaskMove = {
      id: `move-${Date.now()}`,
      taskId,
      agentId,
      action: action as TaskMove["action"],
      oldStatus,
      newStatus,
      timestamp: new Date().toISOString(),
      result,
      context,
    };

    await recordMove(move);

    return NextResponse.json(
      {
        success: true,
        move,
        task,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to auto-move task:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/tasks/auto-move/history - Get move history
export async function GET() {
  try {
    const movesFile = path.join(TASK_MOVES_DIR, "moves.jsonl");
    const fs = require("fs");

    if (!fs.existsSync(movesFile)) {
      return NextResponse.json({ moves: [] });
    }

    const content = fs.readFileSync(movesFile, "utf-8");
    const moves = content
      .split("\n")
      .filter((line: string) => line.trim())
      .map((line: string) => JSON.parse(line))
      .reverse() // Most recent first
      .slice(0, 100); // Last 100 moves

    return NextResponse.json({ moves });
  } catch (error) {
    console.error("Failed to read move history:", error);
    return NextResponse.json({ moves: [] });
  }
}
