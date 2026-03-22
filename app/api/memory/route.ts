import { NextResponse } from "next/server";
import { readdirSync, statSync, readFileSync, existsSync } from "fs";
import path from "path";

interface MemoryFile {
  id: string;
  name: string;
  path: string;
  type: "memory" | "daily";
  lastModified: string;
  size: number;
  sections: string[];
  preview: string;
  isValid: boolean;
  validationErrors: string[];
  tags: string[];
}

interface MemoryData {
  mainMemory: MemoryFile | null;
  dailyMemories: MemoryFile[];
  total: number;
  health: {
    isValid: boolean;
    lastUpdated: string;
    issues: string[];
  };
}

const WORKSPACE_ROOT = path.join(
  process.env.USERPROFILE || process.env.HOME || "/root",
  ".openclaw",
  "workspace"
);

function validateMemoryFile(content: string): { isValid: boolean; errors: string[]; sections: string[] } {
  const errors: string[] = [];
  const sections: string[] = [];

  // Check for required sections
  if (!content.includes("# MEMORY.md") && !content.includes("# Memory") && !content.includes("# Daily")) {
    errors.push("Missing main header");
  }

  // Extract sections
  const headingRegex = /^#+\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    sections.push(match[1].trim());
  }

  // Check content length
  if (content.length < 100) {
    errors.push("Content too short (< 100 chars)");
  }

  // Check for structure
  if (content.includes("## ") || content.includes("### ")) {
    // Has subsections, probably good structure
  } else if (content.includes("# ") && content.length > 500) {
    // At least has main header and decent content
  } else {
    errors.push("Weak structure (few sections)");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sections,
  };
}

function getMemoryPreview(content: string, maxChars: number = 300): string {
  const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  return lines.slice(0, 3).join(" ").substring(0, maxChars).trim() + "...";
}

function generateMemoryTags(fileName: string, content: string): string[] {
  const tags: string[] = [];

  // File name based tags
  if (fileName === "MEMORY.md") {
    tags.push("long-term");
    tags.push("curated");
  } else {
    tags.push("daily-log");
    // Extract date from filename (YYYY-MM-DD.md)
    if (fileName.match(/\d{4}-\d{2}-\d{2}/)) {
      tags.push("timestamped");
    }
  }

  // Content based tags
  if (content.length > 0) {
    if (content.includes("## ")) tags.push("structured");
    if (content.includes("- ")) tags.push("list");
    if (content.includes("###")) tags.push("detailed");
    if (content.toLowerCase().includes("todo") || content.includes("[ ]")) tags.push("actionable");
    if (content.toLowerCase().includes("decision")) tags.push("decisions");
    if (content.toLowerCase().includes("insight")) tags.push("insights");
    if (content.toLowerCase().includes("agent")) tags.push("agents");
    if (content.toLowerCase().includes("model")) tags.push("models");
    if (content.toLowerCase().includes("task")) tags.push("tasks");
    if (content.toLowerCase().includes("project")) tags.push("projects");
    if (content.toLowerCase().includes("issue") || content.toLowerCase().includes("problem")) tags.push("issues");
    if (content.toLowerCase().includes("solution")) tags.push("solutions");
    if (content.toLowerCase().includes("performance")) tags.push("performance");
    if (content.toLowerCase().includes("token")) tags.push("tokens");
  }

  // Remove duplicates and return
  return Array.from(new Set(tags));
}

function getMainMemory(): MemoryFile | null {
  try {
    const memoryPath = path.join(WORKSPACE_ROOT, "MEMORY.md");
    if (!existsSync(memoryPath)) return null;

    const stat = statSync(memoryPath);
    const content = readFileSync(memoryPath, "utf-8");
    const { isValid, errors, sections } = validateMemoryFile(content);
    const tags = generateMemoryTags("MEMORY.md", content);

    return {
      id: "memory-main",
      name: "MEMORY.md",
      path: "MEMORY.md",
      type: "memory",
      lastModified: new Date(stat.mtime).toISOString(),
      size: stat.size,
      sections,
      preview: getMemoryPreview(content),
      isValid,
      validationErrors: errors,
      tags,
    };
  } catch {
    return null;
  }
}

function getDailyMemories(): MemoryFile[] {
  try {
    const memoryDir = path.join(WORKSPACE_ROOT, "memory");
    if (!existsSync(memoryDir)) return [];

    const files = readdirSync(memoryDir)
      .filter((f) => f.endsWith(".md") && f !== "MEMORY.md")
      .sort()
      .reverse() // Most recent first
      .slice(0, 10); // Last 10 days

    return files.map((file) => {
      const filePath = path.join(memoryDir, file);
      const stat = statSync(filePath);
      const content = readFileSync(filePath, "utf-8");
      const { isValid, errors, sections } = validateMemoryFile(content);
      const tags = generateMemoryTags(file, content);

      return {
        id: `memory-${file}`,
        name: file,
        path: path.relative(WORKSPACE_ROOT, filePath),
        type: "daily",
        lastModified: new Date(stat.mtime).toISOString(),
        size: stat.size,
        sections,
        preview: getMemoryPreview(content),
        isValid,
        validationErrors: errors,
        tags,
      };
    });
  } catch {
    return [];
  }
}

export async function GET(request: Request): Promise<NextResponse<any>> {
  try {
    const url = new URL(request.url);
    const filePath = url.searchParams.get("file");

    // If requesting a specific file, return full content
    if (filePath) {
      const fullPath = path.join(
        process.env.USERPROFILE || process.env.HOME || "/root",
        ".openclaw",
        "workspace",
        filePath
      );

      // Security: ensure path is within workspace
      const workspaceRoot = path.join(
        process.env.USERPROFILE || process.env.HOME || "/root",
        ".openclaw",
        "workspace"
      );
      if (!fullPath.startsWith(workspaceRoot)) {
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

    // Otherwise return memory file list
    const mainMemory = getMainMemory();
    const dailyMemories = getDailyMemories();

    const issues: string[] = [];

    if (!mainMemory) {
      issues.push("MEMORY.md not found");
    } else if (!mainMemory.isValid) {
      issues.push(`MEMORY.md has issues: ${mainMemory.validationErrors.join(", ")}`);
    }

    if (dailyMemories.length === 0) {
      issues.push("No daily memory files found");
    } else {
      const invalidDaily = dailyMemories.filter((d) => !d.isValid);
      if (invalidDaily.length > 0) {
        issues.push(`${invalidDaily.length} daily file(s) have structure issues`);
      }
    }

    const lastUpdated = mainMemory?.lastModified || dailyMemories[0]?.lastModified || new Date().toISOString();

    return NextResponse.json({
      mainMemory,
      dailyMemories,
      total: (mainMemory ? 1 : 0) + dailyMemories.length,
      health: {
        isValid: issues.length === 0,
        lastUpdated,
        issues,
      },
    });
  } catch (error) {
    console.error("Failed to get memory data:", error);
    return NextResponse.json(
      {
        mainMemory: null,
        dailyMemories: [],
        total: 0,
        health: {
          isValid: false,
          lastUpdated: new Date().toISOString(),
          issues: ["Failed to read memory files"],
        },
      },
      { status: 500 }
    );
  }
}
