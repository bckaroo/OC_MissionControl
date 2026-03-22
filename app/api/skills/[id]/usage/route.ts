import { NextResponse, NextRequest } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "skills.json");

async function readSkillData() {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { skillSettings: {}, agentSkillMap: {}, ratings: {}, usageLog: [] };
  }
}

async function writeSkillData(data: any) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// GET /api/skills/[id]/usage — usage analytics for a skill
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const data = await readSkillData();
  const log: any[] = (data.usageLog || []).filter((e: any) => e.skillId === id);

  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const oneMonth = 30 * 24 * 60 * 60 * 1000;

  const stats = {
    total: log.length,
    week: log.filter((e) => now - new Date(e.timestamp).getTime() < oneWeek).length,
    month: log.filter((e) => now - new Date(e.timestamp).getTime() < oneMonth).length,
    success: log.filter((e) => e.success).length,
    fail: log.filter((e) => !e.success).length,
    totalMs: log.reduce((acc, e) => acc + (e.durationMs || 0), 0),
    recentEntries: log.slice(-20).reverse(),
  };

  return NextResponse.json(stats);
}

// POST /api/skills/[id]/usage — log a usage event
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const body = await req.json();
  const data = await readSkillData();
  if (!data.usageLog) data.usageLog = [];

  data.usageLog.push({
    skillId: id,
    timestamp: new Date().toISOString(),
    success: body.success ?? true,
    durationMs: body.durationMs ?? null,
    agentId: body.agentId ?? null,
    error: body.error ?? null,
  });

  // Keep last 1000 entries
  if (data.usageLog.length > 1000) {
    data.usageLog = data.usageLog.slice(-1000);
  }

  await writeSkillData(data);
  return NextResponse.json({ ok: true });
}
