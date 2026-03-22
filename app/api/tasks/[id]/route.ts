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

// GET /api/tasks/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = await readTasks();
  const task = store.tasks.find((t) => t.id === id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ task });
}

// PUT /api/tasks/[id] — update task
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const store = await readTasks();
    const idx = store.tasks.findIndex((t) => t.id === id);

    if (idx === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    store.tasks[idx] = {
      ...store.tasks[idx],
      ...body,
      id, // don't let id be overridden
      updatedAt: new Date().toISOString(),
    };

    await writeTasks(store);
    return NextResponse.json({ task: store.tasks[idx] });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(
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

    store.tasks.splice(idx, 1);
    await writeTasks(store);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
