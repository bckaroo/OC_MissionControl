/**
 * Model tracking and monitoring utilities
 * Manages token usage, API limits, and model health status
 */

export interface ModelSpec {
  id: string;
  name: string;
  provider: string;
  params: string;
  size: string;
  quantization: string;
  contextWindow: number;
  maxTokens: number;
  costPer1MTokens: {
    input: number;
    output: number;
  };
  isLocal: boolean;
  speedMs: number;
}

export interface ModelUsage {
  modelId: string;
  totalTokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  lastUpdated: number;
  timesUsed: number;
}

export interface ModelStatus {
  modelId: string;
  status: 'healthy' | 'degraded' | 'broken' | 'unknown';
  lastHealthCheck: number;
  responseTimeMs: number;
  errorMessage?: string;
  requestsSucceeded: number;
  requestsFailed: number;
}

export interface APILimit {
  modelId: string;
  provider: string;
  limitTokensPer1Min: number;
  limitTokensPer1Day: number;
  currentUsage1Min: number;
  currentUsage1Day: number;
  timeToRestoreMinutes?: number;
  percentageUsed1Min: number;
  percentageUsed1Day: number;
}

export interface AgentModelMapping {
  agentId: string;
  agentName: string;
  currentModel: string;
  modelsUsed: string[];
  totalTokensUsed: number;
  estimatedCost: number;
}

// Model specifications from our inventory
export const MODEL_SPECS: Record<string, ModelSpec> = {
  'ollama/qwen2.5:7b': {
    id: 'ollama/qwen2.5:7b',
    name: 'Qwen 2.5 7B',
    provider: 'Ollama',
    params: '7.6B',
    size: '4.7 GB',
    quantization: 'Q4_K_M',
    contextWindow: 32768,
    maxTokens: 8192,
    costPer1MTokens: { input: 0, output: 0 },
    isLocal: true,
    speedMs: 11000,
  },
  'ollama/deepseek-coder:6.7b': {
    id: 'ollama/deepseek-coder:6.7b',
    name: 'DeepSeek Coder 6.7B',
    provider: 'Ollama',
    params: '7B',
    size: '3.8 GB',
    quantization: 'Q4_0',
    contextWindow: 16384,
    maxTokens: 8192,
    costPer1MTokens: { input: 0, output: 0 },
    isLocal: true,
    speedMs: 12000,
  },
  'ollama/glm-4.7-flash': {
    id: 'ollama/glm-4.7-flash',
    name: 'GLM 4.7 Flash',
    provider: 'Ollama',
    params: '29.9B',
    size: '19 GB',
    quantization: 'Q4_K_M',
    contextWindow: 202752,
    maxTokens: 8192,
    costPer1MTokens: { input: 0, output: 0 },
    isLocal: true,
    speedMs: 37000,
  },
  'lmstudio-2/qwen/qwen3-coder-30b': {
    id: 'lmstudio-2/qwen/qwen3-coder-30b',
    name: 'Qwen 3 Coder 30B',
    provider: 'LMStudio',
    params: '30B',
    size: 'N/A',
    quantization: 'N/A',
    contextWindow: 16000,
    maxTokens: 4096,
    costPer1MTokens: { input: 0, output: 0 },
    isLocal: true,
    speedMs: 25000,
  },
  'lmstudio-3/qwen/qwen3-vl-30b': {
    id: 'lmstudio-3/qwen/qwen3-vl-30b',
    name: 'Qwen 3 VL 30B',
    provider: 'LMStudio',
    params: '30B',
    size: 'N/A',
    quantization: 'N/A',
    contextWindow: 16000,
    maxTokens: 4096,
    costPer1MTokens: { input: 0, output: 0 },
    isLocal: true,
    speedMs: 25000,
  },
  'ollama/kimi-k2.5:cloud': {
    id: 'ollama/kimi-k2.5:cloud',
    name: 'Kimi K2.5 Cloud',
    provider: 'Ollama',
    params: 'Cloud',
    size: 'N/A',
    quantization: 'N/A',
    contextWindow: 262144,
    maxTokens: 8192,
    costPer1MTokens: { input: 0, output: 0 },
    isLocal: false,
    speedMs: 13000,
  },
  'anthropic/claude-haiku-4-5': {
    id: 'anthropic/claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    params: 'Proprietary',
    size: 'N/A',
    quantization: 'N/A',
    contextWindow: 195000,
    maxTokens: 8192,
    costPer1MTokens: { input: 0.8, output: 24 },
    isLocal: false,
    speedMs: 8000,
  },
  'anthropic/claude-sonnet-4-6': {
    id: 'anthropic/claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    params: 'Proprietary',
    size: 'N/A',
    quantization: 'N/A',
    contextWindow: 977000,
    maxTokens: 8192,
    costPer1MTokens: { input: 3, output: 15 },
    isLocal: false,
    speedMs: 5000,
  },
  'anthropic/claude-opus-4-6': {
    id: 'anthropic/claude-opus-4-6',
    name: 'Claude Opus 4.6',
    provider: 'Anthropic',
    params: 'Proprietary',
    size: 'N/A',
    quantization: 'N/A',
    contextWindow: 977000,
    maxTokens: 8192,
    costPer1MTokens: { input: 15, output: 60 },
    isLocal: false,
    speedMs: 4000,
  },
};

// API rate limits (typical defaults)
export const API_LIMITS: Record<string, { perMinute: number; perDay: number }> = {
  'anthropic/claude-haiku-4-5': { perMinute: 50000, perDay: 10000000 },
  'anthropic/claude-sonnet-4-6': { perMinute: 40000, perDay: 8000000 },
  'anthropic/claude-opus-4-6': { perMinute: 30000, perDay: 6000000 },
  'ollama/qwen2.5:7b': { perMinute: 999999999, perDay: 999999999 },
  'ollama/deepseek-coder:6.7b': { perMinute: 999999999, perDay: 999999999 },
  'ollama/glm-4.7-flash': { perMinute: 999999999, perDay: 999999999 },
  'lmstudio-2/qwen/qwen3-coder-30b': { perMinute: 999999999, perDay: 999999999 },
  'lmstudio-3/qwen/qwen3-vl-30b': { perMinute: 999999999, perDay: 999999999 },
};

export function calculateTokenCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const spec = MODEL_SPECS[modelId];
  if (!spec) return 0;
  if (spec.isLocal) return 0; // Local models are free

  const inputCost = (inputTokens / 1000000) * spec.costPer1MTokens.input;
  const outputCost = (outputTokens / 1000000) * spec.costPer1MTokens.output;
  return inputCost + outputCost;
}

export function estimateTimeToRestore(
  currentUsage: number,
  limit: number,
  recoveryRatePerSecond: number
): number {
  if (currentUsage <= limit) return 0;
  const excessTokens = currentUsage - limit;
  return Math.ceil(excessTokens / recoveryRatePerSecond / 60); // return in minutes
}
