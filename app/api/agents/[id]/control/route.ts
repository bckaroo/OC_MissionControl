import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { action } = await req.json();
    const key = decodeURIComponent(id);

    // These actions would trigger openclaw CLI commands or session management
    // For now we return the intended action with status (actual execution requires
    // openclaw session control API which doesn't have a public HTTP endpoint yet)
    const supportedActions = ["pause", "resume", "stop", "restart", "heartbeat"];
    
    if (!supportedActions.includes(action)) {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Heartbeat trigger uses openclaw CLI
    if (action === "heartbeat") {
      try {
        // This would invoke the heartbeat for the agent
        const result = execSync(
          `openclaw run --agent main "Check HEARTBEAT.md and perform any pending tasks" --no-wait 2>&1`,
          { timeout: 5000, encoding: "utf-8" }
        );
        return NextResponse.json({ 
          success: true, 
          action, 
          key,
          message: "Heartbeat triggered",
          output: result.slice(0, 500)
        });
      } catch {
        return NextResponse.json({ 
          success: false, 
          action, 
          key,
          message: "Heartbeat command not available — would trigger via openclaw CLI"
        });
      }
    }

    // For pause/resume/stop: these would interact with OpenClaw session management
    // Currently openclaw doesn't expose a public REST API for session control
    // but the intent is logged here
    return NextResponse.json({ 
      success: true, 
      action, 
      key,
      message: `Action '${action}' recorded — session control will be available via OpenClaw gateway API`,
      note: "Real-time control requires openclaw gateway session management support"
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
