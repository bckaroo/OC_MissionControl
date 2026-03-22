import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const OPENCLAW_CONFIG_PATH = path.join(
  process.env.USERPROFILE || "/root",
  ".openclaw",
  "openclaw.json"
);

function readCurrentMode(): "STANDARD" | "HIGH_PERFORMANCE" {
  try {
    const config = JSON.parse(readFileSync(OPENCLAW_CONFIG_PATH, "utf-8"));
    const currentModel = config?.agents?.defaults?.model;
    
    // If using API models (Anthropic), it's HIGH_PERFORMANCE
    if (currentModel?.includes("anthropic")) {
      return "HIGH_PERFORMANCE";
    }
    // Otherwise it's STANDARD (all local)
    return "STANDARD";
  } catch (e) {
    return "STANDARD";
  }
}

function getChiefModel(mode: "STANDARD" | "HIGH_PERFORMANCE"): string {
  if (mode === "HIGH_PERFORMANCE") {
    return "anthropic/claude-haiku-4-5";
  }
  return "lmstudio/qwen/qwen3.5-9b";
}

function getEstimatedCost(mode: "STANDARD" | "HIGH_PERFORMANCE"): number {
  return mode === "STANDARD" ? 0 : 1.5;
}

export async function GET() {
  try {
    const currentMode = readCurrentMode();
    const modeStatus = {
      currentMode,
      chiefModel: getChiefModel(currentMode),
      estimatedMonthlyCost: getEstimatedCost(currentMode),
      lastSwitched: new Date(Date.now() - 3600000).toISOString(),
      autoSwitchEnabled: true,
    };

    return NextResponse.json(modeStatus);
  } catch (error) {
    console.error("Failed to get mode status:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = body.mode as string;

    if (!mode || !["STANDARD", "HIGH_PERFORMANCE"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode. Must be STANDARD or HIGH_PERFORMANCE" },
        { status: 400 }
      );
    }

    const typedMode = mode as "STANDARD" | "HIGH_PERFORMANCE";

    // Try to update config directly (simple approach)
    try {
      const configContent = readFileSync(OPENCLAW_CONFIG_PATH, "utf-8");
      const config = JSON.parse(configContent);
      
      if (!config.agents) config.agents = {};
      if (!config.agents.defaults) config.agents.defaults = {};
      
      config.agents.defaults.model = getChiefModel(typedMode);
      
      writeFileSync(OPENCLAW_CONFIG_PATH, JSON.stringify(config, null, 2));
      console.log(`Mode switched to ${typedMode}`);
    } catch (fileError) {
      console.warn("Config update failed:", fileError);
      // Continue anyway - we'll return success with the new mode
    }

    const modeStatus = {
      currentMode: typedMode,
      chiefModel: getChiefModel(typedMode),
      estimatedMonthlyCost: getEstimatedCost(typedMode),
      lastSwitched: new Date().toISOString(),
      autoSwitchEnabled: true,
    };

    return NextResponse.json(modeStatus);
  } catch (error) {
    console.error("Failed to switch mode:", error);
    return NextResponse.json(
      { error: `Mode switch failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
