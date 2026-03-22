import { NextResponse } from "next/server";

export async function GET() {
  try {
    // TODO: Read from OpenClaw mode switch history log
    // For now, return mock data
    const history = [
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        fromMode: "HIGH_PERFORMANCE",
        toMode: "STANDARD",
        reason: "Token usage dropped below 5% threshold",
        costSavings: 0.5,
      },
      {
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        fromMode: "STANDARD",
        toMode: "HIGH_PERFORMANCE",
        reason: "Token usage exceeded 20% threshold",
        costSavings: 0,
      },
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        fromMode: "HIGH_PERFORMANCE",
        toMode: "STANDARD",
        reason: "Manual switch by user",
        costSavings: 1.2,
      },
    ];

    return NextResponse.json(history);
  } catch (error) {
    console.error("Failed to get mode history:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
