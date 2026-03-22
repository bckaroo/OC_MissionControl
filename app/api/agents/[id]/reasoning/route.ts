import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";

const SESSIONS_PATH = "C:\\Users\\abuck\\.openclaw\\agents\\main\\sessions\\sessions.json";

interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

interface TextBlock {
  type: "text";
  text: string;
}

type ContentBlock = ThinkingBlock | TextBlock | { type: string; [key: string]: unknown };

interface MessageEntry {
  role?: string;
  content?: string | ContentBlock[];
  timestamp?: number;
  inputTokens?: number;
  outputTokens?: number;
  thinkingTokens?: number;
  totalTokens?: number;
}

interface ReasoningEntry {
  id: string;
  agentKey: string;
  timestamp: string;
  timestampMs: number;
  thinking: string;
  response: string;
  goal: string;
  context: string;
  strategy: string;
  nextStep: string;
  tokenUsage: {
    thinking: number;
    input: number;
    output: number;
    total: number;
  };
  isStreaming: boolean;
  messageIndex: number;
}

function extractSections(thinking: string): { goal: string; context: string; strategy: string; nextStep: string } {
  // Try to parse Goal/Context/Strategy/Next Step from thinking text
  const lower = thinking.toLowerCase();
  
  const extractSection = (sectionName: string, nextSectionNames: string[]): string => {
    const pattern = new RegExp(`(?:^|\\n)\\s*(?:\\*\\*)?${sectionName}(?:\\*\\*)?\\s*:?\\s*\\n([\\s\\S]*?)(?=(?:\\n\\s*(?:\\*\\*)?(?:${nextSectionNames.join("|")})(?:\\*\\*)?\\s*:)|$)`, "i");
    const match = thinking.match(pattern);
    if (match) return match[1].trim().slice(0, 500);
    return "";
  };

  const goal = extractSection("goal", ["context", "strategy", "next step", "approach"]);
  const context = extractSection("context", ["strategy", "next step", "approach", "plan"]);
  const strategy = extractSection("strategy|approach|plan", ["next step", "action", "conclusion"]);
  const nextStep = extractSection("next step|action|conclusion", []);

  // If no explicit sections found, try to auto-derive
  if (!goal && !context && !strategy && !nextStep) {
    const lines = thinking.split("\n").filter(l => l.trim());
    const total = lines.length;
    return {
      goal: lines.slice(0, Math.ceil(total * 0.2)).join("\n").slice(0, 400) || "Analyzing the request",
      context: lines.slice(Math.ceil(total * 0.2), Math.ceil(total * 0.5)).join("\n").slice(0, 400) || "",
      strategy: lines.slice(Math.ceil(total * 0.5), Math.ceil(total * 0.8)).join("\n").slice(0, 400) || "",
      nextStep: lines.slice(Math.ceil(total * 0.8)).join("\n").slice(0, 400) || "",
    };
  }

  return { goal, context, strategy, nextStep };
}

function extractText(content: string | ContentBlock[]): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter(c => c.type === "text" && "text" in c)
    .map(c => (c as TextBlock).text)
    .join(" ");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "5", 10);

  try {
    const key = decodeURIComponent(id);
    const sessionsRaw = await readFile(SESSIONS_PATH, "utf-8");
    const sessions = JSON.parse(sessionsRaw);
    const session = sessions[key];

    if (!session) {
      return NextResponse.json({ error: "Session not found", reasoning: [], isThinking: false }, { status: 200 });
    }

    const sessionFile = session.sessionFile;
    if (!sessionFile) {
      return NextResponse.json({ reasoning: [], isThinking: false, note: "No session file" });
    }

    let reasoning: ReasoningEntry[] = [];
    let isThinking = false;

    try {
      const raw = await readFile(sessionFile, "utf-8");
      const lines = raw.trim().split("\n").filter(Boolean);
      const messages: MessageEntry[] = lines.map(line => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(Boolean);

      // Find assistant messages with thinking blocks
      const now = Date.now();
      const agentAge = now - (session.updatedAt || 0);
      isThinking = agentAge < 30_000; // consider thinking if active in last 30s

      let entryIdx = 0;
      for (let i = messages.length - 1; i >= 0 && entryIdx < limit; i--) {
        const msg = messages[i];
        if (msg.role !== "assistant") continue;
        if (!Array.isArray(msg.content)) continue;

        const thinkingBlocks = msg.content.filter(c => c.type === "thinking") as ThinkingBlock[];
        if (thinkingBlocks.length === 0) continue;

        const thinkingText = thinkingBlocks.map(b => b.thinking).join("\n\n---\n\n");
        const responseText = extractText(msg.content);
        const sections = extractSections(thinkingText);

        const ts = msg.timestamp || (session.updatedAt || Date.now());

        reasoning.push({
          id: `r-${key.slice(-8)}-${i}`,
          agentKey: key,
          timestamp: new Date(ts).toISOString(),
          timestampMs: ts,
          thinking: thinkingText,
          response: responseText.slice(0, 600),
          goal: sections.goal,
          context: sections.context,
          strategy: sections.strategy,
          nextStep: sections.nextStep,
          tokenUsage: {
            thinking: msg.thinkingTokens || Math.floor(thinkingText.length / 4),
            input: msg.inputTokens || 0,
            output: msg.outputTokens || 0,
            total: msg.totalTokens || 0,
          },
          isStreaming: isThinking && i === messages.length - 1,
          messageIndex: i,
        });
        entryIdx++;
      }

      // If no thinking blocks found, synthesize from latest assistant message
      if (reasoning.length === 0) {
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          if (msg.role !== "assistant") continue;
          const text = extractText(Array.isArray(msg.content) ? msg.content : [{ type: "text", text: String(msg.content || "") }]);
          if (!text) continue;

          const ts = msg.timestamp || session.updatedAt || Date.now();
          const sections = extractSections(text);

          reasoning.push({
            id: `r-${key.slice(-8)}-synth-${i}`,
            agentKey: key,
            timestamp: new Date(ts).toISOString(),
            timestampMs: ts,
            thinking: text.slice(0, 2000),
            response: text.slice(0, 600),
            goal: sections.goal || "Processing request",
            context: sections.context,
            strategy: sections.strategy,
            nextStep: sections.nextStep,
            tokenUsage: {
              thinking: 0,
              input: msg.inputTokens || 0,
              output: msg.outputTokens || 0,
              total: msg.totalTokens || 0,
            },
            isStreaming: isThinking && i === messages.length - 1,
            messageIndex: i,
          });
          break;
        }
      }
    } catch {
      // session file unreadable
    }

    return NextResponse.json({
      agentKey: key,
      isThinking,
      ageMs: Date.now() - (session.updatedAt || 0),
      reasoning,
      count: reasoning.length,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error), reasoning: [], isThinking: false }, { status: 200 });
  }
}
