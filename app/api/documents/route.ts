import { NextResponse } from "next/server";
import { readdirSync, statSync, readFileSync, existsSync } from "fs";
import path from "path";

interface Document {
  id: string;
  name: string;
  path: string;
  type: "memory" | "config" | "doc" | "script" | "skill" | "other";
  category: string;
  size: number;
  created: string;
  modified: string;
  description: string;
  preview: string;
  tags: string[];
}

const WORKSPACE_ROOT = path.join(
  process.env.USERPROFILE || process.env.HOME || "/root",
  ".openclaw",
  "workspace"
);

function categorizeFile(filePath: string): { type: Document["type"]; category: string; description: string } {
  const fileName = path.basename(filePath).toLowerCase();
  const dirName = path.dirname(filePath).toLowerCase();

  // Memory files
  if (fileName === "memory.md" || fileName.includes("memory")) {
    return { type: "memory", category: "Long-term Memory", description: "Your curated long-term memories and insights" };
  }
  if (dirName.includes("memory")) {
    return { type: "memory", category: "Daily Notes", description: "Daily session logs and notes" };
  }

  // Config files
  if (fileName === "soul.md" || fileName === "user.md" || fileName === "agents.md" || fileName === "tools.md") {
    return { type: "config", category: "Configuration", description: "Core workspace configuration files" };
  }
  if (dirName.includes("config") || fileName.endsWith(".json")) {
    return { type: "config", category: "Configuration", description: "System and workspace configuration" };
  }

  // Documentation
  if (fileName.includes("readme") || fileName.includes("doc") || fileName.includes("guide")) {
    return { type: "doc", category: "Documentation", description: "Help, guides, and reference docs" };
  }

  // Scripts
  if (dirName.includes("scripts") || fileName.endsWith(".py") || fileName.endsWith(".sh") || fileName.endsWith(".ps1")) {
    return { type: "script", category: "Scripts & Automation", description: "Automation and utility scripts" };
  }

  // Skills
  if (dirName.includes("skills")) {
    return { type: "skill", category: "Skills", description: "Agent skills and capabilities" };
  }

  return { type: "other", category: "Other Files", description: "Miscellaneous files" };
}

function getFilePreview(filePath: string, maxChars: number = 200): string {
  try {
    if (!existsSync(filePath)) return "";
    const content = readFileSync(filePath, "utf-8");
    return content.substring(0, maxChars).replace(/\n/g, " ").trim() + (content.length > maxChars ? "..." : "");
  } catch {
    return "";
  }
}

function generateTags(filePath: string, content: string): string[] {
  const tags: string[] = [];
  const fileName = path.basename(filePath).toLowerCase();
  const dirName = path.dirname(filePath).toLowerCase();

  // File name based tags
  if (fileName.includes("memory")) tags.push("memory");
  if (fileName.includes("soul")) tags.push("identity");
  if (fileName.includes("user")) tags.push("user-config");
  if (fileName.includes("agent")) tags.push("agents");
  if (fileName.includes("tool")) tags.push("tools");
  if (fileName.includes("skill")) tags.push("skills");
  if (fileName.includes("api")) tags.push("api");
  if (fileName.includes("config")) tags.push("config");

  // Directory based tags
  if (dirName.includes("memory")) tags.push("daily-log");
  if (dirName.includes("scripts")) tags.push("automation");
  if (dirName.includes("skills")) tags.push("skills");

  // Content based tags
  if (content.length > 0) {
    if (content.includes("# ")) tags.push("documented");
    if (content.includes("- [ ]") || content.includes("- [x]")) tags.push("checklist");
    if (content.includes("OCD_")) tags.push("project");
    if (content.includes("## ")) tags.push("structured");
    if (content.includes("```")) tags.push("code");
    if (content.includes("Dashboard") || content.includes("dashboard")) tags.push("dashboard");
    if (content.includes("Model") || content.includes("model")) tags.push("models");
    if (content.includes("Task") || content.includes("task")) tags.push("tasks");
    if (content.includes("Agent") || content.includes("agent")) tags.push("agents");
    if (content.includes("API") || content.includes("api")) tags.push("api");
    if (content.includes("Situation Room") || content.includes("situation-room")) tags.push("situation-room");
    if (content.toLowerCase().includes("token")) tags.push("tokens");
    if (content.toLowerCase().includes("performance")) tags.push("performance");
    if (content.toLowerCase().includes("backup")) tags.push("backup");
  }

  // Remove duplicates and return
  return Array.from(new Set(tags));
}

function scanDirectory(dir: string, maxDepth: number = 3, currentDepth: number = 0): Document[] {
  const documents: Document[] = [];

  if (currentDepth > maxDepth) return documents;

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      // Skip hidden dirs and node_modules
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".txt"))) {
        const stat = statSync(fullPath);
        const { type, category, description } = categorizeFile(fullPath);
        const relativePath = path.relative(WORKSPACE_ROOT, fullPath);
        const preview = getFilePreview(fullPath);
        const content = readFileSync(fullPath, "utf-8").slice(0, 1000); // Read for tagging
        const tags = generateTags(fullPath, content);

        documents.push({
          id: `doc-${Date.now()}-${Math.random()}`,
          name: entry.name,
          path: relativePath,
          type,
          category,
          size: stat.size,
          created: new Date(stat.birthtime).toISOString(),
          modified: new Date(stat.mtime).toISOString(),
          description,
          preview,
          tags,
        });
      } else if (entry.isDirectory()) {
        // Recurse into directories
        const subDocs = scanDirectory(fullPath, maxDepth, currentDepth + 1);
        documents.push(...subDocs);
      }
    }
  } catch (error) {
    console.error(`Failed to scan directory ${dir}:`, error);
  }

  return documents;
}

export async function GET(request: Request): Promise<NextResponse<any>> {
  try {
    const url = new URL(request.url);
    const filePath = url.searchParams.get("file");

    // If requesting a specific file, return full content
    if (filePath) {
      const fullPath = path.join(WORKSPACE_ROOT, filePath);
      
      // Security: ensure path is within workspace
      if (!fullPath.startsWith(WORKSPACE_ROOT)) {
        return NextResponse.json({ error: "Invalid path" }, { status: 403 });
      }

      if (!existsSync(fullPath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      const content = readFileSync(fullPath, "utf-8");
      const stat = statSync(fullPath);

      return NextResponse.json({
        name: path.basename(fullPath),
        path: filePath,
        content,
        size: stat.size,
        modified: new Date(stat.mtime).toISOString(),
      });
    }

    // Otherwise return document list
    const documents = scanDirectory(WORKSPACE_ROOT);

    // Count by category
    const categories: Record<string, number> = {};
    documents.forEach((doc) => {
      categories[doc.category] = (categories[doc.category] || 0) + 1;
    });

    return NextResponse.json({
      documents: documents.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()),
      total: documents.length,
      categories,
    });
  } catch (error) {
    console.error("Failed to get documents:", error);
    return NextResponse.json(
      { documents: [], total: 0, categories: {} },
      { status: 500 }
    );
  }
}
