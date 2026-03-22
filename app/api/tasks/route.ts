import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");

const PROJECTS_FILE = path.join(
  process.env.USERPROFILE || process.env.HOME || "/root",
  ".openclaw",
  "workspace",
  "projects.json"
);

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "backlog" | "in-progress" | "review" | "done";
  assignee: string;
  assigneeInitials: string;
  priority: "high" | "medium" | "low";
  projectId: string; // Foreign key to project
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

// Update projects.json to link task IDs
function updateProjectTaskIds(taskId: string, projectId: string, remove: boolean = false): void {
  try {
    if (!existsSync(PROJECTS_FILE)) return;
    
    const raw = readFileSync(PROJECTS_FILE, "utf-8");
    const data = JSON.parse(raw);
    const projects = data.projects || [];

    const projectIndex = projects.findIndex((p: any) => p.id === projectId);
    if (projectIndex === -1) return;

    if (remove) {
      projects[projectIndex].taskIds = projects[projectIndex].taskIds.filter((id: string) => id !== taskId);
    } else {
      if (!projects[projectIndex].taskIds.includes(taskId)) {
        projects[projectIndex].taskIds.push(taskId);
      }
    }
    projects[projectIndex].updatedAt = new Date().toISOString();

    writeFileSync(PROJECTS_FILE, JSON.stringify({ projects }, null, 2));
  } catch (err) {
    console.error("Failed to update project task IDs:", err);
  }
}

// GET /api/tasks — returns all tasks, optionally filtered by projectId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const store = await readTasks();
    
    if (projectId) {
      // Filter by projectId
      const filtered = store.tasks.filter(t => t.projectId === projectId);
      return NextResponse.json({ tasks: filtered, projectId });
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error("Failed to read tasks:", error);
    return NextResponse.json({ tasks: [] });
  }
}

// POST /api/tasks — create and persist a new task
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, priority, projectId, status, assignee, tags } = body;

    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "ProjectId required" }, { status: 400 });
    }

    const resolvedAssignee = assignee || "XiaoZhu";
    const task: Task = {
      id: `task-${Date.now()}`,
      title,
      description: description || "",
      status: status || "backlog",
      assignee: resolvedAssignee,
      assigneeInitials: resolvedAssignee.slice(0, 2).toUpperCase(),
      priority: priority || "medium",
      projectId, // Store project reference
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: tags || [],
      executionStatus: null,
      executionResult: null,
      executedAt: null,
    };

    const store = await readTasks();
    store.tasks.unshift(task);
    await writeTasks(store);

    // Auto-update project's taskIds
    updateProjectTaskIds(task.id, projectId);

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH /api/tasks — update a task
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, title, description, status, priority, assignee, tags, projectId } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    const store = await readTasks();
    const index = store.tasks.findIndex(t => t.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const oldProjectId = store.tasks[index].projectId;

    if (title) store.tasks[index].title = title;
    if (description !== undefined) store.tasks[index].description = description;
    if (status) store.tasks[index].status = status;
    if (priority) store.tasks[index].priority = priority;
    if (assignee) {
      store.tasks[index].assignee = assignee;
      store.tasks[index].assigneeInitials = assignee.slice(0, 2).toUpperCase();
    }
    if (tags) store.tasks[index].tags = tags;

    // If projectId changes, update both old and new project
    if (projectId && projectId !== oldProjectId) {
      updateProjectTaskIds(id, oldProjectId, true); // Remove from old project
      store.tasks[index].projectId = projectId;
      updateProjectTaskIds(id, projectId); // Add to new project
    }

    store.tasks[index].updatedAt = new Date().toISOString();
    await writeTasks(store);

    return NextResponse.json({ task: store.tasks[index] });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/tasks?id=task-xxx
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    const store = await readTasks();
    const task = store.tasks.find(t => t.id === id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Remove from project
    updateProjectTaskIds(id, task.projectId, true);

    store.tasks = store.tasks.filter(t => t.id !== id);
    await writeTasks(store);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
