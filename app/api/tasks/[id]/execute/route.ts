import { NextResponse, NextRequest } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");

interface Task {
  id: string;
  title: string;
  description: string;
  status: "backlog" | "in-progress" | "review" | "done";
  assignee: string;
  assigneeInitials: string;
  priority: "high" | "medium" | "low";
  project: string;
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

// POST /api/tasks/[id]/execute — trigger task execution
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const store = await readTasks();
    const idx = store.tasks.findIndex((t) => t.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = store.tasks[idx];

    // Mark as pending/running
    store.tasks[idx] = {
      ...task,
      executionStatus: "running",
      executedAt: new Date().toISOString(),
      status: "in-progress",
      updatedAt: new Date().toISOString(),
    };

    await writeTasks(store);

    // Simulate async execution — in a real setup this would spawn an openclaw subagent
    // For now we write a pending state and let a follow-up poll complete it
    // We schedule a "completion" update in the background via a timeout approach
    // Since this is Next.js serverless, we'll use a simulated approach:
    // The execution runs immediately and marks itself complete after a brief delay
    
    // Fire-and-forget simulated execution
    simulateExecution(id, task.title, task.description).catch(console.error);

    return NextResponse.json({
      success: true,
      task: store.tasks[idx],
      message: `Task "${task.title}" execution started`,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function simulateExecution(id: string, title: string, description: string) {
  // Wait 3-8 seconds to simulate work
  const delay = 3000 + Math.random() * 5000;
  await new Promise((r) => setTimeout(r, delay));

  try {
    const store = await readTasks();
    const idx = store.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;

    const results = [
      `Task "${title}" completed successfully. ${description ? `Executed: ${description}` : ""}`,
      `Agent processed "${title}". All steps completed without errors.`,
      `"${title}" done. Results saved to workspace memory.`,
      `Completed "${title}". Action items resolved.`,
    ];

    store.tasks[idx] = {
      ...store.tasks[idx],
      executionStatus: "completed",
      executionResult: results[Math.floor(Math.random() * results.length)],
      status: "done",
      updatedAt: new Date().toISOString(),
    };

    await writeTasks(store);
  } catch (err) {
    console.error("simulateExecution error:", err);
    // Try to mark as failed
    try {
      const store = await readTasks();
      const idx = store.tasks.findIndex((t) => t.id === id);
      if (idx !== -1) {
        store.tasks[idx] = {
          ...store.tasks[idx],
          executionStatus: "failed",
          executionResult: `Execution failed: ${String(err)}`,
          updatedAt: new Date().toISOString(),
        };
        await writeTasks(store);
      }
    } catch {}
  }
}
