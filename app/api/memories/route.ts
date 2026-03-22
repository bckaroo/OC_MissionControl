import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import path from "path";

const WORKSPACE = path.join(
  process.env.APPDATA || "C:\\Users\\abuck\\AppData\\Roaming",
  "..",
  ".openclaw",
  "workspace"
);

const WORKSPACE_PATH = "C:\\Users\\abuck\\.openclaw\\workspace";

export async function GET() {
  try {
    const memoryDir = path.join(WORKSPACE_PATH, "memory");
    const files = await readdir(memoryDir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    const memories: {id: string; date: string; title: string; preview: string; content: string; tags: string[]; source: string}[] = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await readFile(path.join(memoryDir, file), "utf-8");
        const date = file.replace(".md", "");
        const firstLine = content.split("\n").find((l) => l.trim()) || "";
        const preview = content.slice(0, 200).replace(/#+\s/g, "").trim();
        return {
          id: file,
          date,
          title: firstLine.replace(/^#+\s/, "").trim() || date,
          preview,
          content,
          tags: [],
          source: "live",
        };
      })
    );

    // Also try to read MEMORY.md
    try {
      const memoryMd = await readFile(
        path.join(WORKSPACE_PATH, "MEMORY.md"),
        "utf-8"
      );
      memories.unshift({
        id: "MEMORY.md",
        date: "Long-term",
        title: "Long-Term Memory (MEMORY.md)",
        preview: memoryMd.slice(0, 200).replace(/#+\s/g, "").trim(),
        content: memoryMd,
        tags: ["long-term"],
        source: "live",
      });
    } catch {}

    return NextResponse.json({ memories, source: "live" });
  } catch (error) {
    return NextResponse.json({
      memories: [],
      source: "mock",
      error: String(error),
    });
  }
}
