import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ModelUsage, calculateTokenCost } from '@/lib/modelTracking';

export async function GET(request: NextRequest) {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'models-usage.json');
    
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { error: 'Models usage file not found' },
        { status: 404 }
      );
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    // Calculate totals
    const usage = data.usage as Record<string, ModelUsage>;
    const totalTokens = Object.values(usage).reduce((sum: number, u: ModelUsage) => sum + u.totalTokensUsed, 0);
    const totalCost = Object.values(usage).reduce((sum: number, u: ModelUsage) => sum + u.estimatedCost, 0);
    
    return NextResponse.json({
      lastUpdated: data.lastUpdated,
      usage,
      summary: {
        totalTokensUsed: totalTokens,
        totalEstimatedCost: totalCost,
        modelsTracked: Object.keys(usage).length,
      },
      byDay: data.byDay,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch model usage', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, inputTokens, outputTokens } = body;

    if (!modelId || inputTokens === undefined || outputTokens === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: modelId, inputTokens, outputTokens' },
        { status: 400 }
      );
    }

    const dataPath = path.join(process.cwd(), 'data', 'models-usage.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    const usage = data.usage[modelId] || {
      modelId,
      totalTokensUsed: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      timesUsed: 0,
    };

    usage.totalTokensUsed += inputTokens + outputTokens;
    usage.inputTokens += inputTokens;
    usage.outputTokens += outputTokens;
    usage.estimatedCost += calculateTokenCost(modelId, inputTokens, outputTokens);
    usage.timesUsed += 1;
    usage.lastUpdated = Date.now();

    data.usage[modelId] = usage;
    data.lastUpdated = Date.now();

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      usage,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to log model usage', details: String(error) },
      { status: 500 }
    );
  }
}
