import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { MODEL_SPECS, API_LIMITS, estimateTimeToRestore, ModelUsage } from '@/lib/modelTracking';

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
    const usage = data.usage as Record<string, ModelUsage>;

    // Calculate usage in last minute and last day
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const limits = [];

    for (const [modelId, spec] of Object.entries(MODEL_SPECS)) {
      if (spec.isLocal) {
        // Local models have no limits
        limits.push({
          modelId,
          provider: spec.provider,
          isLocal: true,
          limitTokensPer1Min: Infinity,
          limitTokensPer1Day: Infinity,
          currentUsage1Min: 0,
          currentUsage1Day: 0,
          percentageUsed1Min: 0,
          percentageUsed1Day: 0,
          status: 'unlimited',
        });
      } else {
        const limit = API_LIMITS[modelId];
        const modelUsage = usage[modelId];
        
        // Get recent usage from byDay
        const recentUsage = data.byDay?.reduce((acc: number, day: any) => {
          const dayTime = new Date(day.date).getTime();
          if (dayTime >= oneDayAgo) {
            return acc + (day.usage[modelId] || 0);
          }
          return acc;
        }, 0) || 0;

        limits.push({
          modelId,
          provider: spec.provider,
          isLocal: false,
          limitTokensPer1Min: limit?.perMinute || 50000,
          limitTokensPer1Day: limit?.perDay || 10000000,
          currentUsage1Min: 0, // Would need minute-level tracking
          currentUsage1Day: recentUsage,
          percentageUsed1Min: 0,
          percentageUsed1Day: (recentUsage / (limit?.perDay || 10000000)) * 100,
          warningLevel: (recentUsage / (limit?.perDay || 10000000)) * 100 > 70 ? 'warning' : 'ok',
          timeToRestoreMinutes:
            recentUsage > (limit?.perDay || 10000000)
              ? estimateTimeToRestore(recentUsage, limit?.perDay || 10000000, 1000)
              : 0,
        });
      }
    }

    return NextResponse.json({
      lastUpdated: now,
      limits: limits.sort((a, b) => (b.percentageUsed1Day || 0) - (a.percentageUsed1Day || 0)),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch API limits', details: String(error) },
      { status: 500 }
    );
  }
}
