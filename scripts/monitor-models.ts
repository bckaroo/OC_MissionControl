#!/usr/bin/env node

/**
 * Model Monitoring Script
 * Runs periodically to:
 * - Ping all models to check health
 * - Track token usage
 * - Calculate API limit projections
 * - Alert when approaching limits
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const MODEL_SPECS = {
  'ollama/qwen2.5:7b': { url: 'http://127.0.0.1:11434', type: 'ollama' },
  'ollama/deepseek-coder:6.7b': { url: 'http://127.0.0.1:11434', type: 'ollama' },
  'ollama/glm-4.7-flash': { url: 'http://127.0.0.1:11434', type: 'ollama' },
  'lmstudio-2/qwen/qwen3-coder-30b': { url: 'http://127.0.0.1:11435', type: 'lmstudio' },
  'lmstudio-3/qwen/qwen3-vl-30b': { url: 'http://127.0.0.1:11435', type: 'lmstudio' },
  'anthropic/claude-sonnet-4-6': { url: 'https://api.anthropic.com', type: 'anthropic' },
  'anthropic/claude-haiku-4-5': { url: 'https://api.anthropic.com', type: 'anthropic' },
  'anthropic/claude-opus-4-6': { url: 'https://api.anthropic.com', type: 'anthropic' },
};

interface ModelStatus {
  modelId: string;
  status: 'healthy' | 'degraded' | 'broken' | 'unknown';
  lastHealthCheck: number;
  responseTimeMs: number;
  errorMessage?: string;
  requestsSucceeded: number;
  requestsFailed: number;
}

async function pingModel(modelId: string, spec: any): Promise<ModelStatus> {
  const statusPath = path.join(
    process.cwd(),
    'data',
    'models-status.json'
  );
  
  let status: ModelStatus = {
    modelId,
    status: 'unknown',
    lastHealthCheck: Date.now(),
    responseTimeMs: 0,
    requestsSucceeded: 0,
    requestsFailed: 0,
  };

  // Load existing status
  if (fs.existsSync(statusPath)) {
    const data = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    status = data.status[modelId] || status;
  }

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    let response;
    if (spec.type === 'ollama') {
      response = await fetch(`${spec.url}/api/tags`, {
        signal: controller.signal,
      });
    } else if (spec.type === 'anthropic') {
      // Anthropic requires API key, skip detailed check
      response = new Response(JSON.stringify({ ok: true }), { status: 200 });
    } else {
      response = await fetch(`${spec.url}/v1/models`, {
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      status.status = 'healthy';
      status.responseTimeMs = responseTime;
      status.requestsSucceeded++;
    } else {
      status.status = 'degraded';
      status.responseTimeMs = responseTime;
      status.requestsFailed++;
      status.errorMessage = `HTTP ${response.status}`;
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    status.status = 'broken';
    status.responseTimeMs = Math.min(responseTime, 15000);
    status.requestsFailed++;
    status.errorMessage = error instanceof Error ? error.message : 'Unknown error';
  }

  status.lastHealthCheck = Date.now();
  return status;
}

async function monitorAllModels() {
  console.log(`[${new Date().toISOString()}] Starting model health checks...`);

  const statusPath = path.join(process.cwd(), 'data', 'models-status.json');

  // Ensure data directory exists
  const dataDir = path.dirname(statusPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load existing status
  let statusData = { lastUpdated: Date.now(), status: {} as Record<string, ModelStatus> };
  if (fs.existsSync(statusPath)) {
    statusData = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  }

  // Ping each model
  const results = await Promise.all(
    Object.entries(MODEL_SPECS).map(([modelId, spec]) => pingModel(modelId, spec))
  );

  // Update status data
  for (const result of results) {
    statusData.status[result.modelId] = result;
  }
  statusData.lastUpdated = Date.now();

  // Write updated status
  fs.writeFileSync(statusPath, JSON.stringify(statusData, null, 2));

  // Calculate summary
  const summary = {
    healthy: Object.values(statusData.status).filter((s) => s.status === 'healthy').length,
    degraded: Object.values(statusData.status).filter((s) => s.status === 'degraded').length,
    broken: Object.values(statusData.status).filter((s) => s.status === 'broken').length,
  };

  console.log(
    `[${new Date().toISOString()}] Health check complete: ${summary.healthy} healthy, ${summary.degraded} degraded, ${summary.broken} broken`
  );

  // Log alerts for broken models
  for (const [modelId, status] of Object.entries(statusData.status)) {
    if (status.status === 'broken') {
      console.warn(`⚠️  ALERT: ${modelId} is BROKEN - ${status.errorMessage}`);
    } else if (status.status === 'degraded') {
      console.warn(
        `⚠️  WARNING: ${modelId} is DEGRADED - Response time: ${status.responseTimeMs}ms`
      );
    }
  }
}

async function analyzeUsageAndLimits() {
  console.log(`[${new Date().toISOString()}] Analyzing usage and limits...`);

  const usagePath = path.join(process.cwd(), 'data', 'models-usage.json');

  if (!fs.existsSync(usagePath)) {
    console.log('No usage data found yet.');
    return;
  }

  const usageData = JSON.parse(fs.readFileSync(usagePath, 'utf-8'));
  const usage = usageData.usage;

  // Check for approaching limits
  const DAILY_LIMITS = {
    'anthropic/claude-sonnet-4-6': 8000000,
    'anthropic/claude-haiku-4-5': 10000000,
    'anthropic/claude-opus-4-6': 6000000,
  };

  for (const [modelId, limit] of Object.entries(DAILY_LIMITS)) {
    const modelUsage = usage[modelId];
    if (modelUsage) {
      const percentageUsed = (modelUsage.totalTokensUsed / limit) * 100;
      if (percentageUsed > 70) {
        console.warn(`⚠️  API LIMIT WARNING: ${modelId} at ${percentageUsed.toFixed(1)}% daily limit`);
      }
    }
  }

  // Log usage summary
  const totalTokens = Object.values(usage).reduce((sum: number, u: any) => sum + u.totalTokensUsed, 0);
  const totalCost = Object.values(usage).reduce((sum: number, u: any) => sum + u.estimatedCost, 0);

  console.log(
    `📊 Usage Summary: ${formatNumber(totalTokens)} total tokens, $${totalCost.toFixed(2)} estimated cost`
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

async function main() {
  try {
    await monitorAllModels();
    await analyzeUsageAndLimits();
    console.log(
      `[${new Date().toISOString()}] Monitoring complete. Next check in 5 minutes.\n`
    );
  } catch (error) {
    console.error('Error during monitoring:', error);
    process.exit(1);
  }
}

// Run immediately and then every 5 minutes
main();
setInterval(main, 5 * 60 * 1000);
