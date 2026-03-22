import { NextResponse } from "next/server";

interface ModelHealth {
  id: string;
  name: string;
  status: "healthy" | "slow" | "broken";
  responseTimeMs: number;
  available: boolean;
  lastChecked: number;
}

interface ServerHealth {
  status: "healthy" | "slow" | "broken";
  responseTimeMs: number;
  models: ModelHealth[];
  lastUpdated: number;
}

// Cache for 30 seconds
let cachedResponse: ServerHealth | null = null;
let cacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

const LM_STUDIO_URL = "http://127.0.0.1:11435/v1";
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds per model

async function checkModelHealth(modelId: string): Promise<ModelHealth> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const response = await fetch(`${LM_STUDIO_URL}/models`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      id: modelId,
      name: modelId.split("/").pop() || modelId,
      status: responseTime > 2000 ? "slow" : "healthy",
      responseTimeMs: responseTime,
      available: response.ok,
      lastChecked: Date.now(),
    };
  } catch (error) {
    return {
      id: modelId,
      name: modelId.split("/").pop() || modelId,
      status: "broken",
      responseTimeMs: Date.now() - startTime,
      available: false,
      lastChecked: Date.now(),
    };
  }
}

async function checkServerHealth(): Promise<ServerHealth> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const response = await fetch(`${LM_STUDIO_URL}/models`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const data = (await response.json()) as any;

    // Check individual models
    const modelIds = data.data?.map((m: any) => m.id) || [
      "qwen3-coder-30b",
      "qwen3.5-9b",
      "qwen3-vl-30b",
      "deepseek-r1-0528-qwen3-8b",
      "nemotron-3-nano-4b",
    ];

    const modelHealthChecks = await Promise.all(
      modelIds.slice(0, 5).map((id: string) => checkModelHealth(id))
    );

    const overallStatus: "healthy" | "slow" | "broken" =
      responseTime > 2000 ? "slow" : response.ok ? "healthy" : "broken";

    return {
      status: overallStatus,
      responseTimeMs: responseTime,
      models: modelHealthChecks,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error("LM Studio health check failed:", error);

    // Return offline status
    return {
      status: "broken",
      responseTimeMs: HEALTH_CHECK_TIMEOUT,
      models: [],
      lastUpdated: Date.now(),
    };
  }
}

export async function GET() {
  try {
    // Return cached response if available
    if (cachedResponse && Date.now() - cacheTime < CACHE_DURATION) {
      return NextResponse.json(cachedResponse);
    }

    // Check server health
    const result = await checkServerHealth();

    // Update cache
    cachedResponse = result;
    cacheTime = Date.now();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Models health API error:", error);
    return NextResponse.json(
      {
        status: "broken",
        responseTimeMs: 0,
        models: [],
        lastUpdated: Date.now(),
        error: String(error),
      },
      { status: 200 }
    );
  }
}
