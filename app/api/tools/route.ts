import { NextResponse } from "next/server";
import { readdirSync, statSync, existsSync, readFileSync } from "fs";
import path from "path";

const WORKSPACE_ROOT = "C:\\Users\\abuck\\.openclaw\\workspace";

export interface Tool {
  id: string;
  name: string;
  path: string;
  type: "script" | "executable" | "utility";
  language: "python" | "powershell" | "bash" | "javascript" | "other";
  description: string;
  lastModified: string;
  size: number;
  executable: boolean;
  category: string;
  tags: string[];
  preview: string;
}

function detectLanguage(filePath: string): "python" | "powershell" | "bash" | "javascript" | "other" {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".py") return "python";
  if (ext === ".ps1") return "powershell";
  if (ext === ".sh" || ext === ".bash") return "bash";
  if (ext === ".js" || ext === ".ts") return "javascript";
  return "other";
}

function detectCategory(filePath: string, name: string): string {
  const lower = filePath.toLowerCase();
  if (lower.includes("scripts")) return "Scripts";
  if (lower.includes("skills")) return "Skills";
  if (lower.includes("app")) return "App";
  if (lower.includes("automation") || lower.includes("cron")) return "Automation";
  if (lower.includes("migrate")) return "Migration";
  if (lower.includes("health") || lower.includes("check")) return "Health Check";
  if (lower.includes("utility") || lower.includes("util")) return "Utility";
  return "Other";
}

function generateTags(name: string, filePath: string, language: string): string[] {
  const tags: string[] = [language];
  const lower = (name + filePath).toLowerCase();

  if (lower.includes("migrate")) tags.push("migration");
  if (lower.includes("token")) tags.push("token-management");
  if (lower.includes("email")) tags.push("email");
  if (lower.includes("memory")) tags.push("memory");
  if (lower.includes("task")) tags.push("task");
  if (lower.includes("health") || lower.includes("check")) tags.push("monitoring");
  if (lower.includes("backup")) tags.push("backup");
  if (lower.includes("cron") || lower.includes("schedule")) tags.push("automation");
  if (lower.includes("test")) tags.push("testing");
  if (lower.includes("deploy")) tags.push("deployment");

  return Array.from(new Set(tags));
}

function getFileDescription(filePath: string, name: string): string {
  // Try to read extended description from file
  try {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    let description = "";

    // Python docstring (try to get more)
    if (content.includes('"""')) {
      const match = content.match(/"""(.*?)"""/s);
      if (match) {
        const docstring = match[1].trim();
        const sentences = docstring.split("\n").filter((l) => l.trim());
        description = sentences.slice(0, 3).join(" ");
      }
    }

    // Python comment block
    if (!description && content.startsWith("#")) {
      const commentLines = lines
        .slice(0, 10)
        .filter((l) => l.startsWith("#"))
        .map((l) => l.replace(/^#+\s*/, "").trim())
        .filter((l) => l.length > 0)
        .join(" ");
      if (commentLines) description = commentLines;
    }

    // PowerShell comment
    if (!description && content.startsWith("<#")) {
      const match = content.match(/<#(.*?)#>/s);
      if (match) {
        const docstring = match[1].trim();
        const sentences = docstring.split("\n").filter((l) => l.trim());
        description = sentences.slice(0, 3).join(" ");
      }
    }

    // Bash/sh shebang + comments
    if (!description && content.startsWith("#!/")) {
      const commentLines = lines
        .slice(1, 15)
        .filter((l) => l.trim().startsWith("#") && !l.includes("!"))
        .map((l) => l.replace(/^#+\s*/, "").trim())
        .filter((l) => l.length > 0)
        .join(" ");
      if (commentLines) description = commentLines;
    }

    // Fallback: synthetic description based on filename and category
    if (!description) {
      const nameLower = name.toLowerCase();
      const extensions: Record<string, string> = {
        ".py": "Python script",
        ".sh": "Shell script",
        ".bash": "Bash script",
        ".ps1": "PowerShell script",
        ".js": "JavaScript utility",
        ".ts": "TypeScript utility",
      };

      const ext = path.extname(name).toLowerCase();
      const fileType = extensions[ext] || "utility script";

      if (nameLower.includes("memory")) {
        description = `${fileType} that manages and archives memory system state. Handles long-term memory curation and daily log maintenance for operational continuity.`;
      } else if (nameLower.includes("migrate") || nameLower.includes("migration")) {
        description = `${fileType} for data migration and transformation tasks. Automates bulk operations and ensures data integrity during transfers between systems.`;
      } else if (nameLower.includes("deploy")) {
        description = `${fileType} that handles deployment automation and release management. Orchestrates infrastructure updates and application rollouts.`;
      } else if (nameLower.includes("health") || nameLower.includes("check")) {
        description = `${fileType} for system health monitoring and diagnostics. Validates configuration, performs sanity checks, and reports health status.`;
      } else if (nameLower.includes("sync")) {
        description = `${fileType} for synchronization operations. Keeps distributed systems in sync and maintains data consistency across endpoints.`;
      } else if (nameLower.includes("ynab")) {
        description = `${fileType} for YNAB (You Need A Budget) integration. Automates budget tracking and financial data synchronization.`;
      } else {
        description = `${fileType} that provides utility functions for operational tasks. Automates routine operations and integrates with external services.`;
      }
    }

    // Ensure we have at least 2 sentences
    const sentences = description.split(/\.\s+/).filter((s) => s.length > 0);
    if (sentences.length < 2) {
      description += ` This script is part of the operational toolkit and handles specialized tasks within the system.`;
    }

    return description.substring(0, 300); // Cap at 300 chars for display
  } catch {
    return `${name} utility script for operational tasks.`;
  }
}

function getFilePreview(filePath: string, maxLines: number = 8): string {
  try {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n").slice(0, maxLines);
    
    // Remove empty lines at start
    while (lines.length > 0 && lines[0].trim() === "") {
      lines.shift();
    }

    return lines.slice(0, maxLines).join("\n").trim();
  } catch {
    return "";
  }
}

function scanDirectory(dir: string, maxDepth: number = 4, currentDepth: number = 0): Tool[] {
  const tools: Tool[] = [];

  if (currentDepth > maxDepth || !existsSync(dir)) return tools;

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      // Skip hidden, node_modules, .git, etc.
      if (entry.name.startsWith(".") || ["node_modules", "__pycache__", "dist", "build"].includes(entry.name))
        continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        let isScript = [".py", ".ps1", ".sh", ".bash", ".js", ".ts"].includes(ext);
        let language = detectLanguage(fullPath);

        // Check for scripts without extension (shebangs, or common tool names)
        if (!isScript && !entry.name.startsWith(".")) {
          try {
            const content = readFileSync(fullPath, "utf-8");
            // Check for shebang line
            if (content.startsWith("#!")) {
              if (content.includes("python")) language = "python";
              else if (content.includes("bash") || content.includes("sh")) language = "bash";
              else if (content.includes("powershell")) language = "powershell";
              else language = "bash"; // Default to bash for unknown shebangs
              isScript = true;
            }
            // Common tool names (like ynab, migrate-tasks, etc.)
            else if (
              entry.name.includes("-") ||
              ["ynab", "migrate", "sync", "deploy", "setup", "test", "build", "check", "run"].some(
                (keyword) => entry.name.toLowerCase().includes(keyword)
              )
            ) {
              // Likely a script, assume bash/python
              isScript = true;
              language = "bash";
            }
          } catch {
            // If we can't read it, skip
            isScript = false;
          }
        }

        if (isScript) {
          const stat = statSync(fullPath);
          const category = detectCategory(fullPath, entry.name);
          const relativePath = path.relative(WORKSPACE_ROOT, fullPath);
          const tags = generateTags(entry.name, relativePath, language);
          const description = getFileDescription(fullPath, entry.name);
          const preview = getFilePreview(fullPath, 8);

          tools.push({
            id: `tool-${relativePath.replace(/[\\\/]/g, "-")}`,
            name: entry.name,
            path: relativePath,
            type: "script",
            language,
            description,
            lastModified: new Date(stat.mtime).toISOString(),
            size: stat.size,
            executable: (stat.mode & parseInt("0111", 8)) !== 0,
            category,
            tags,
            preview,
          });
        }
      } else if (entry.isDirectory()) {
        // Recurse
        const subTools = scanDirectory(fullPath, maxDepth, currentDepth + 1);
        tools.push(...subTools);
      }
    }
  } catch (error) {
    console.error(`Failed to scan directory ${dir}:`, error);
  }

  return tools;
}

export async function GET(request: Request): Promise<NextResponse<{ tools: Tool[]; total: number; categories: string[]; languages: string[] }>> {
  try {
    const url = new URL(request.url);
    const filterCategory = url.searchParams.get("category");
    const filterLanguage = url.searchParams.get("language");
    const filterTag = url.searchParams.get("tag");

    // Scan workspace for all scripts
    const allTools = scanDirectory(WORKSPACE_ROOT);

    // Apply filters
    let filtered = allTools;
    if (filterCategory) {
      filtered = filtered.filter((t) => t.category === filterCategory);
    }
    if (filterLanguage) {
      filtered = filtered.filter((t) => t.language === filterLanguage);
    }
    if (filterTag) {
      filtered = filtered.filter((t) => t.tags.includes(filterTag));
    }

    // Extract unique categories and languages
    const categories = Array.from(new Set(allTools.map((t) => t.category))).sort();
    const languages = Array.from(new Set(allTools.map((t) => t.language))).sort();

    return NextResponse.json({
      tools: filtered.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
      total: filtered.length,
      categories,
      languages,
    });
  } catch (error) {
    console.error("Failed to scan tools:", error);
    return NextResponse.json(
      {
        tools: [],
        total: 0,
        categories: [],
        languages: [],
      },
      { status: 500 }
    );
  }
}
