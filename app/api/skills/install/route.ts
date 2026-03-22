import { NextResponse, NextRequest } from "next/server";
import { execSync } from "child_process";

// POST /api/skills/install — install a new skill from clawhub
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { skillName } = body;

  if (!skillName || typeof skillName !== "string") {
    return NextResponse.json({ ok: false, error: "skillName required" }, { status: 400 });
  }

  // Validate skill name (alphanumeric + hyphens only)
  if (!/^[a-z0-9-]+$/.test(skillName)) {
    return NextResponse.json({ ok: false, error: "Invalid skill name" }, { status: 400 });
  }

  try {
    // Try to install via clawhub CLI
    const output = execSync(`clawhub install ${skillName}`, {
      encoding: "utf-8",
      timeout: 30000,
    });
    return NextResponse.json({ ok: true, output });
  } catch (error: any) {
    // clawhub might not be installed — return informative error
    return NextResponse.json({
      ok: false,
      error: error.message || String(error),
      hint: "Ensure clawhub CLI is installed: npm install -g clawhub",
    }, { status: 200 });
  }
}
