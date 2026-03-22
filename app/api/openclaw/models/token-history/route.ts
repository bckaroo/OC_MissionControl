import { NextResponse } from "next/server";

export async function GET() {
  try {
    // TODO: Read from OpenClaw token usage logs
    // Generate mock 7-day history
    const history = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      history.push({
        date: date.toISOString().split("T")[0],
        "qwen3.5-9b": Math.floor(Math.random() * 400000 + 200000),
        "qwen3-coder-30b": Math.floor(Math.random() * 300000 + 150000),
        "qwen3-vl-30b": Math.floor(Math.random() * 80000 + 20000),
        "deepseek-r1-8b": Math.floor(Math.random() * 150000 + 50000),
        "nemotron-nano-4b": Math.floor(Math.random() * 250000 + 100000),
        "claude-haiku-4-5": Math.floor(Math.random() * 50000 + 10000),
      });
    }

    return NextResponse.json(history);
  } catch (error) {
    console.error("Failed to get token history:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
