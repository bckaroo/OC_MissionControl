import { NextResponse } from "next/server";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";

const SKILLS_DIR = "C:\\Users\\abuck\\AppData\\Roaming\\npm\\node_modules\\openclaw\\skills";

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  installed: boolean;
  lastUsed?: string;
  version?: string;
  location: string;
  hasReadme: boolean;
}

interface SkillsResponse {
  skills: Skill[];
  total: number;
  installed: number;
  lastUpdated: number;
}

async function parseSkillDirectory(skillDir: string): Promise<Skill | null> {
  try {
    const skillName = path.basename(skillDir);
    const skillMdPath = path.join(skillDir, "SKILL.md");

    // Check if SKILL.md exists
    const hasReadme = await readFile(skillMdPath, "utf-8")
      .then(() => true)
      .catch(() => false);

    // Try to extract description from SKILL.md
    let description = "";
    let category = "other";

    if (hasReadme) {
      try {
        const content = await readFile(skillMdPath, "utf-8");
        // Extract description from first line after title
        const lines = content.split("\n");
        const descLine = lines.find(
          (line) => line.startsWith("**Description") || line.includes("description")
        );
        description = descLine ? descLine.replace(/\*\*/g, "").slice(0, 200) : "";

        // Try to extract category
        const categoryLine = lines.find(
          (line) => line.startsWith("**Category") || line.includes("category")
        );
        if (categoryLine) {
          category = categoryLine.replace(/\*\*/g, "").split(":")[1]?.trim() || "other";
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    return {
      id: skillName,
      name: skillName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      description:
        description ||
        `${skillName.replace(/-/g, " ")} skill for OpenClaw agents`,
      category,
      installed: true,
      version: "1.0.0",
      location: skillDir,
      hasReadme,
    };
  } catch (error) {
    console.error(`Failed to parse skill:`, error);
    return null;
  }
}

export async function GET() {
  try {
    const skills: Skill[] = [];

    // Read installed skills from skills directory
    try {
      const skillDirs = await readdir(SKILLS_DIR);

      for (const skillName of skillDirs) {
        const skillPath = path.join(SKILLS_DIR, skillName);

        try {
          const stats = await stat(skillPath);
          if (stats.isDirectory()) {
            const skill = await parseSkillDirectory(skillPath);
            if (skill) {
              skills.push(skill);
            }
          }
        } catch (e) {
          // Skip directories we can't read
        }
      }
    } catch (error) {
      console.error("Failed to read skills directory:", error);
    }

    // Sort by name
    skills.sort((a, b) => a.name.localeCompare(b.name));

    const response: SkillsResponse = {
      skills,
      total: skills.length,
      installed: skills.length,
      lastUpdated: Date.now(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Skills API error:", error);
    return NextResponse.json(
      {
        skills: [],
        total: 0,
        installed: 0,
        lastUpdated: Date.now(),
        error: String(error),
      },
      { status: 200 }
    );
  }
}
