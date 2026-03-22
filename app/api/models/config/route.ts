import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

// Hard-coded model registry from openclaw.json — auto-updated when we detect changes
// These are the known configured models based on the current config
const ANTHROPIC_MODELS = [
  { id: "anthropic/claude-sonnet-4-6", name: "Claude Sonnet 4.6", speed: "medium", context: "200K", contextTokens: 200000, cost: "$3/$15" },
  { id: "anthropic/claude-haiku-4-5",  name: "Claude Haiku 4.5",  speed: "fast",   context: "200K", contextTokens: 200000, cost: "$0.25/$1.25" },
  { id: "anthropic/claude-opus-4-6",   name: "Claude Opus 4.6",   speed: "slow",   context: "200K", contextTokens: 200000, cost: "$15/$75" },
];

const LM_STUDIO_MODELS = [
  { id: "lmstudio/qwen/qwen3.5-9b",                            name: "Qwen 3.5 (9B) - Fast",       speed: "fast",   context: "32K",  contextTokens: 32768,  type: "general" },
  { id: "lmstudio/qwen/qwen3-coder-30b",                       name: "Qwen Coder (30B) - Heavy",    speed: "slow",   context: "32K",  contextTokens: 32768,  type: "coding" },
  { id: "lmstudio/deepseek/deepseek-r1-0528-qwen3-8b",         name: "DeepSeek R1 (8B) - Reasoning", speed: "medium", context: "64K", contextTokens: 65536,  type: "reasoning" },
];

const OLLAMA_MODELS = [
  { id: "ollama/qwen3.5",           name: "Qwen 3.5 (Ollama) - Long Context", speed: "medium", context: "256K", contextTokens: 262144, type: "general" },
  { id: "ollama/minimax-m2.7:cloud", name: "Minimax 2.7 - Reasoning",          speed: "medium", context: "200K", contextTokens: 204800, type: "reasoning" },
];

// Active model config
const PRIMARY_MODEL = "anthropic/claude-sonnet-4-6";
const FALLBACK_MODELS = ["anthropic/claude-haiku-4-5", "anthropic/claude-opus-4-6"];

function inferAnthropicType(id: string): string {
  if (id.includes("haiku")) return "general";
  if (id.includes("opus")) return "reasoning";
  return "general";
}

export async function GET() {
  // Try to fetch live LM Studio models
  let lmLiveModels: string[] = [];
  try {
    const lmRes = await fetch("http://127.0.0.1:11435/v1/models", {
      signal: AbortSignal.timeout(2000),
    });
    if (lmRes.ok) {
      const lmData = await lmRes.json();
      lmLiveModels = (lmData.data || []).map((m: any) => m.id);
    }
  } catch {
    // LM Studio not running
  }

  const models: any[] = [];

  // Anthropic models
  for (const m of ANTHROPIC_MODELS) {
    models.push({
      ...m,
      provider: "Anthropic",
      type: inferAnthropicType(m.id),
      isLocal: false,
      active: true,
      isPrimary: m.id === PRIMARY_MODEL,
      isFallback: FALLBACK_MODELS.includes(m.id),
      loaded: true,
      cost: m.cost,
      capabilities: ["text"],
    });
  }

  // LM Studio models — check if actually loaded
  for (const m of LM_STUDIO_MODELS) {
    const shortId = m.id.replace("lmstudio/", "");
    const loaded = lmLiveModels.includes(shortId);
    models.push({
      ...m,
      provider: "LM Studio",
      isLocal: true,
      active: loaded,
      isPrimary: m.id === PRIMARY_MODEL,
      isFallback: FALLBACK_MODELS.includes(m.id),
      loaded,
      cost: "Free",
      capabilities: m.type === "vision" ? ["text", "image"] : ["text"],
    });
  }

  // Also add any live LM Studio models not in our registry
  for (const liveId of lmLiveModels) {
    const fullId = `lmstudio/${liveId}`;
    if (!LM_STUDIO_MODELS.find(m => m.id === fullId)) {
      models.push({
        id: fullId,
        name: liveId.split("/").pop()?.replace(/-/g, " ") || liveId,
        provider: "LM Studio",
        type: liveId.includes("embed") ? "embedded" : liveId.includes("vl") || liveId.includes("vision") ? "vision" : "general",
        speed: "medium",
        context: "32K",
        contextTokens: 32768,
        isLocal: true,
        active: true,
        isPrimary: false,
        isFallback: false,
        loaded: true,
        cost: "Free",
        capabilities: ["text"],
      });
    }
  }

  // Ollama models
  for (const m of OLLAMA_MODELS) {
    models.push({
      ...m,
      provider: "Ollama",
      isLocal: true,
      active: true,
      isPrimary: m.id === PRIMARY_MODEL,
      isFallback: FALLBACK_MODELS.includes(m.id),
      loaded: true, // assume Ollama is running
      cost: "Free",
      capabilities: ["text"],
    });
  }

  return NextResponse.json({
    models,
    primaryModel: PRIMARY_MODEL,
    fallbacks: FALLBACK_MODELS,
    lmLiveModels,
  });
}
