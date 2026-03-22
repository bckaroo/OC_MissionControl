import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "paused" | "completed";
  createdAt: string;
  updatedAt: string;
  taskIds: string[]; // Foreign keys to tasks
}

const PROJECTS_FILE = path.join(
  process.env.USERPROFILE || process.env.HOME || "/root",
  ".openclaw",
  "workspace",
  "projects.json"
);

function ensureProjectsFile(): void {
  const dir = path.dirname(PROJECTS_FILE);
  if (!existsSync(dir)) {
    require("fs").mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(PROJECTS_FILE)) {
    writeFileSync(PROJECTS_FILE, JSON.stringify({ projects: [] }, null, 2));
  }
}

function readProjects(): Project[] {
  ensureProjectsFile();
  try {
    const data = JSON.parse(readFileSync(PROJECTS_FILE, "utf-8"));
    return data.projects || [];
  } catch {
    return [];
  }
}

function writeProjects(projects: Project[]): void {
  ensureProjectsFile();
  writeFileSync(PROJECTS_FILE, JSON.stringify({ projects }, null, 2));
}

export async function GET() {
  try {
    const projects = readProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to read projects:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, status } = body;

    if (!name) {
      return NextResponse.json({ error: "Project name required" }, { status: 400 });
    }

    const project: Project = {
      id: `proj-${Date.now()}`,
      name,
      description: description || "",
      status: status || "planning",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      taskIds: [], // Start with no tasks
    };

    const projects = readProjects();
    projects.unshift(project);
    writeProjects(projects);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, status, taskIds } = body;

    if (!id) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const projects = readProjects();
    const index = projects.findIndex(p => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (name) projects[index].name = name;
    if (description !== undefined) projects[index].description = description;
    if (status) projects[index].status = status;
    if (taskIds) projects[index].taskIds = taskIds; // Update task references
    projects[index].updatedAt = new Date().toISOString();

    writeProjects(projects);
    return NextResponse.json(projects[index]);
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const projects = readProjects();
    const filtered = projects.filter(p => p.id !== id);
    writeProjects(filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
