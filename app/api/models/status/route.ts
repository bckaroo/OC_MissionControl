import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ModelStatus } from '@/lib/modelTracking';

export async function GET(request: NextRequest) {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'models-status.json');
    
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { error: 'Models status file not found' },
        { status: 404 }
      );
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    return NextResponse.json({
      lastUpdated: data.lastUpdated,
      status: data.status,
      summary: {
        healthy: Object.values(data.status as Record<string, ModelStatus>).filter((s: any) => s.status === 'healthy').length,
        degraded: Object.values(data.status as Record<string, ModelStatus>).filter((s: any) => s.status === 'degraded').length,
        broken: Object.values(data.status as Record<string, ModelStatus>).filter((s: any) => s.status === 'broken').length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch model status', details: String(error) },
      { status: 500 }
    );
  }
}
