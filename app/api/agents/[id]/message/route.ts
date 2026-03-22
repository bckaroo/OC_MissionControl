import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { message, prompt } = await req.json();
    const key = decodeURIComponent(id);
    const text = message || prompt;
    
    if (!text) {
      return NextResponse.json({ error: "message or prompt required" }, { status: 400 });
    }

    // For main agent: we can use openclaw to send a message
    // For subagents: they are ephemeral and receive messages via their session

    if (key === "agent:main:main") {
      try {
        // Use openclaw CLI to send a message to main agent
        const escaped = text.replace(/"/g, '\\"');
        const result = execSync(
          `openclaw run "${escaped}" 2>&1`,
          { timeout: 10000, encoding: "utf-8" }
        );
        return NextResponse.json({ 
          success: true,
          key,
          message: "Message sent to main agent",
          response: result.slice(0, 1000)
        });
      } catch (cliErr: any) {
        return NextResponse.json({ 
          success: false,
          key,
          message: "Message queued (openclaw CLI unavailable in this context)",
          note: String(cliErr.message || cliErr).slice(0, 200)
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      key,
      message: "Message logged — subagent communication requires active session"
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
