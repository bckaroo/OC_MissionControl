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

// GET /api/skills/[id] — detailed skill info
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const data = await readSkillData();
  const settings = data.skillSettings?.[id] || {};
  const rating = data.ratings?.[id] || null;
  return NextResponse.json({ id, settings, rating });
}

// PUT /api/skills/[id] — enable/disable, configure, rate
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const body = await req.json();
  const data = await readSkillData();

  if (!data.skillSettings) data.skillSettings = {};
  if (!data.ratings) data.ratings = {};

  if (body.settings !== undefined) {
    data.skillSettings[id] = { ...data.skillSettings[id], ...body.settings };
  }
  if (body.rating !== undefined) {
    data.ratings[id] = body.rating;
  }
  if (body.agentId !== undefined && body.skillEnabled !== undefined) {
    if (!data.agentSkillMap) data.agentSkillMap = {};
    if (!data.agentSkillMap[body.agentId]) data.agentSkillMap[body.agentId] = [];
    const list: string[] = data.agentSkillMap[body.agentId];
    if (body.skillEnabled && !list.includes(id)) {
      list.push(id);
    } else if (!body.skillEnabled) {
      data.agentSkillMap[body.agentId] = list.filter((s) => s !== id);
    }
  }

  await writeSkillData(data);
  return NextResponse.json({ ok: true });
}

// POST /api/skills/[id]/uninstall  (handled separately, but placeholder)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const data = await readSkillData();
  if (data.skillSettings) delete data.skillSettings[id];
  if (data.ratings) delete data.ratings[id];
  await writeSkillData(data);
  return NextResponse.json({ ok: true });
}
