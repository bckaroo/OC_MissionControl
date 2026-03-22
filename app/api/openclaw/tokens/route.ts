import { NextResponse } from "next/server";

export async function GET() {
  try {
    // TODO: Read from OpenClaw token tracking system
    // For now, return mock data
    const tokenUsage = {
      percentUsed: 15,
      tokensUsed: 30000,
      tokensTotal: 200000,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(tokenUsage);
  } catch (error) {
    console.error("Failed to get token usage:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
