// Execution History Mock Data — comprehensive audit trail system

export type ExecutionStatus = "success" | "failure" | "in-progress" | "cancelled" | "pending";
export type ActionType =
  | "file-change"
  | "api-call"
  | "task-execution"
  | "agent-spawn"
  | "agent-stop"
  | "web-search"
  | "tool-use"
  | "memory-write"
  | "command"
  | "heartbeat"
  | "skill-run";

export interface FileChange {
  path: string;
  operation: "created" | "modified" | "deleted" | "read";
  sizeBefore?: number;
  sizeAfter?: number;
}

export interface ApiCall {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  statusCode?: number;
  durationMs?: number;
}

export interface ExecutionEntry {
  id: string;
  timestamp: string; // ISO 8601
  agentId: string;
  agentName: string;
  action: string;
  actionType: ActionType;
  status: ExecutionStatus;
  durationMs: number | null;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  filesChanged?: FileChange[];
  apiCalls?: ApiCall[];
  errorMessage?: string;
  taskId?: string;
  taskTitle?: string;
  tags?: string[];
  parentExecutionId?: string;
  reasoning?: string;
  undoAvailable?: boolean;
  undoPerformed?: boolean;
}

const now = new Date("2026-03-21T00:51:00-04:00");

function ago(minutes: number): string {
  return new Date(now.getTime() - minutes * 60 * 1000).toISOString();
}

export const mockExecutionHistory: ExecutionEntry[] = [
  {
    id: "exec-001",
    timestamp: ago(2),
    agentId: "agent-main",
    agentName: "XiaoZhu",
    action: "Build ExecutionHistoryScreen component",
    actionType: "task-execution",
    status: "in-progress",
    durationMs: null,
    taskId: "t3",
    taskTitle: "Add execution history & audit trail",
    tags: ["dev", "dashboard"],
    input: { component: "ExecutionHistoryScreen", framework: "Next.js/React" },
    reasoning:
      "User requested comprehensive audit trail system for Mission Control dashboard. Building full-featured component with filtering, search, and export capabilities.",
    undoAvailable: false,
  },
  {
    id: "exec-002",
    timestamp: ago(8),
    agentId: "agent-main",
    agentName: "XiaoZhu",
    action: "Fetch YouTube transcript",
    actionType: "skill-run",
    status: "success",
    durationMs: 3420,
    taskId: "t2",
    taskTitle: "Write YouTube transcript skill",
    tags: ["skill", "youtube"],
    input: { videoUrl: "https://youtube.com/watch?v=xyz123", language: "en" },
    output: { transcriptLength: 23378, wordCount: 4200, language: "en" },
    filesChanged: [
      { path: "workspace/transcript.txt", operation: "created", sizeAfter: 23378 },
    ],
    apiCalls: [
      { method: "GET", url: "https://youtube.com/api/timedtext", statusCode: 200, durationMs: 850 },
    ],
    undoAvailable: true,
    reasoning: "User asked to extract transcript from YouTube video for analysis.",
  },
  {
    id: "exec-003",
    timestamp: ago(15),
    agentId: "agent-main",
    agentName: "XiaoZhu",
    action: "Update memory file: 2026-03-21.md",
    actionType: "memory-write",
    status: "success",
    durationMs: 245,
    tags: ["memory"],
    input: { filePath: "memory/2026-03-21.md", operation: "append" },
    output: { bytesWritten: 1842, totalSize: 3180 },
    filesChanged: [
      {
        path: "workspace/memory/2026-03-21.md",
        operation: "modified",
        sizeBefore: 1338,
        sizeAfter: 3180,
      },
    ],
    undoAvailable: true,
    reasoning: "Recording daily session activities and decisions for long-term continuity.",
  },
  {
    id: "exec-004",
    timestamp: ago(22),
    agentId: "agent-sub1",
    agentName: "Subagent Alpha",
    action: "Run npm install for mission-control",
    actionType: "command",
    status: "success",
    durationMs: 18400,
    tags: ["dev", "setup"],
    input: { command: "npm install", cwd: ".apps/mission-control" },
    output: { packagesInstalled: 312, warnings: 2, errors: 0 },
    filesChanged: [
      { path: ".apps/mission-control/node_modules/", operation: "created" },
      { path: ".apps/mission-control/package-lock.json", operation: "modified" },
    ],
    undoAvailable: false,
  },
  {
    id: "exec-005",
    timestamp: ago(25),
    agentId: "agent-main",
    agentName: "XiaoZhu",
    action: "Spawn coding subagent: Build Mission Control",
    actionType: "agent-spawn",
    status: "success",
    durationMs: 890,
    tags: ["dev", "spawn"],
    input: {
      agentType: "claude-code",
      task: "Build Next.js Mission Control dashboard",
      model: "claude-sonnet-4-6",
    },
    output: { subagentId: "agent-sub1", sessionId: "sess-abc123" },
    undoAvailable: false,
    reasoning: "Delegating complex Next.js build task to specialized coding subagent.",
  },
  {
    id: "exec-006",
    timestamp: ago(35),
    agentId: "agent-main",
    agentName: "XiaoZhu",
    action: "Web search: OpenClaw session logs format",
    actionType: "web-search",
    status: "success",
    durationMs: 1200,
    tags: ["search", "research"],
    input: { query: "OpenClaw session logs format parsing", engine: "brave" },
    output: { resultsCount: 10, topResult: "https://openclaw.dev/docs/sessions" },
    apiCalls: [
      {
        method: "GET",
        url: "https://api.search.brave.com/res/v1/web/search",
        statusCode: 200,
        durationMs: 1200,
      },
    ],
    undoAvailable: false,
  },
  {
    id: "exec-007",
    timestamp: ago(48),
    agentId: "agent-main",
    agentName: "XiaoZhu",
    action: "Read file: AGENTS.md",
    actionType: "file-change",
    status: "success",
    durationMs: 45,
    tags: ["config"],
    input: { filePath: "workspace/AGENTS.md", operation: "read" },
    output: { bytesRead: 7874, lines: 220 },
    filesChanged: [{ path: "workspace/AGENTS.md", operation: "read" }],
    undoAvailable: false,
  },
  {
    id: "exec-008",
    timestamp: ago(62),
    agentId: "agent-sub2",
    agentName: "Subagent Beta",
    action: "Fetch OpenClaw documentation page",
    actionType: "api-call",
    status: "failure",
    durationMs: 5100,
    tags: ["research", "api"],
    input: { url: "https://openclaw.dev/docs/api", method: "GET" },
    errorMessage: "Request timeout after 5000ms. Server did not respond.",
    apiCalls: [
      { method: "GET", url: "https://openclaw.dev/docs/api", statusCode: 408, durationMs: 5100 },
    ],
    undoAvailable: false,
    reasoning: "Attempting to fetch API documentation for integration reference.",
  },
  {
    id: "exec-009",
    timestamp: ago(75),
    agentId: "agent-main",
    agentName: "XiaoZhu",
    action: "Heartbeat check: email, calendar, weather",
    actionType: "heartbeat",
    status: "success",
    durationMs: 4200,
    tags: ["heartbeat", "routine"],
    input: { checks: ["email", "calendar", "weather"] },
    output: {
      emailUnread: 3,
      calendarEvents: 1,
      weatherAlerts: 0,
      nextAction: "No urgent items. Continuing work.",
    },
    apiCalls: [
      {
        method: "GET",
        url: "https://gmail.googleapis.com/gmail/v1/users/me/messages",
        statusCode: 200,
        durationMs: 820,
      },
      {
        method: "GET",
        url: "https://www.googleapis.com/calendar/v3/events",
        statusCode: 200,
        durationMs: 650,
      },
    ],
    undoAvailable: false,
  },
  {
    id: "exec-010",
    timestamp: ago(90),
    agentId: "agent-main",
    agentName: "XiaoZhu",
    action: "Write new skill file: youtube-transcript.skill",
    actionType: "file-change",
    status: "success",
    durationMs: 580,
    taskId: "t2",
    taskTitle: "Write YouTube transcript skill",
    tags: ["skill", "youtube"],
    input: { filePath: "workspace/youtube-transcript.skill", operation: "create" },
    output: { bytesWritten: 3181 },
    filesChanged: [
      { path: "workspace/youtube-transcript.skill", operation: "created", sizeAfter: 3181 },
    ],
    undoAvailable: true,
  },
  {
    id: "exec-011",
    timestamp: ago(105),
    agentId: "agent-sub1",
    agentName: "Subagent Alpha",
    action: "Create Next.js project structure",
    actionType: "command",
    status: "success",
    durationMs: 22100,
    tags: ["dev", "setup"],
    input: { command: "npx create-next-app@latest mission-control --typescript --tailwind --app" },
    output: { filesCreated: 24, projectPath: ".apps/mission-control" },
    filesChanged: [
      { path: ".apps/mission-control/", operation: "created" },
      { path: ".apps/mission-control/app/layout.tsx", operation: "created" },
      { path: ".apps/mission-control/app/page.tsx", operation: "created" },
      { path: ".apps/mission-control/package.json", operation: "created" },
    ],
    undoAvailable: false,
    parentExecutionId: "exec-005",
  },
  {
    id: "exec-012",
    timestamp: ago(120),
    agentId: "agent-main",
    agentName: "XiaoZhu",
    action: "Read SOUL.md on session startup",
    actionType: "file-change",
    status: "success",
    durationMs: 38,
    tags: ["startup", "config"],
    input: { filePath: "workspace/SOUL.md", operation: "read" },
    output: { bytesRead: 1812, lines: 58 },
    filesChanged: [{ path: "workspace/SOUL.md", operation: "read" }],
    undoAvailable: false,
  },
  {
    id: "exec-013",
    timestamp: ago(132),
    agentId: "agent-main",
    agentName: "XiaoZhu",
    action: "Read USER.md on session startup",
    actionType: "file-change",
    status: "success",
    durationMs: 22,
    tags: ["startup", "config"],
    input: { filePath: "workspace/USER.md", operation: "read" },
    output: { bytesRead: 401, lines: 14 },
    filesChanged: [{ path: "workspace/USER.md", operation: "read" }],
    undoAvailable: false,
  },
  {
    id: "exec-014",
    timestamp: ago(145),
    agentId: "agent-sub2",
    agentName: "Subagent Beta",
    action: "Web search: Next.js 15 app router patterns",
    actionType: "web-search",
    status: "success",
    durationMs: 980,
    tags: ["search", "dev"],
    input: { query: "Next.js 15 app router best practices 2026", engine: "brave" },
    output: { resultsCount: 10 },
    apiCalls: [
      {
        method: "GET",
        url: "https://api.search.brave.com/res/v1/web/search",
        statusCode: 200,
        durationMs: 980,
      },
    ],
    undoAvailable: false,
    parentExecutionId: "exec-005",
  },
  {
    id: "exec-015",
    timestamp: ago(158),
    agentId: "agent-main",
    agentName: "XiaoZhu",
    action: "Delete bootstrap file after initialization",
    actionType: "file-change",
    status: "success",
    durationMs: 65,
    tags: ["setup", "startup"],
    input: { filePath: "workspace/BOOTSTRAP.md", operation: "delete" },
    output: { bytesDeleted: 892 },
    filesChanged: [
      { path: "workspace/BOOTSTRAP.md", operation: "deleted", sizeBefore: 892 },
    ],
    undoAvailable: true,
    reasoning: "AGENTS.md instructs deleting BOOTSTRAP.md after initialization is complete.",
  },
  {
    id: "exec-016",
    timestamp: ago(170),
    agentId: "agent-main",
    agentName: "XiaoZhu",
    action: "Session initialized — reading startup files",
    actionType: "agent-spawn",
    status: "success",
    durationMs: 150,
    tags: ["startup"],
    input: { trigger: "new-session", channel: "telegram" },
    output: { filesRead: ["SOUL.md", "USER.md", "AGENTS.md"], memoryLoaded: true },
    undoAvailable: false,
  },
  {
    id: "exec-017",
    timestamp: ago(185),
    agentId: "agent-sub1",
    agentName: "Subagent Alpha",
    action: "Build TaskBoard component with Kanban columns",
    actionType: "task-execution",
    status: "success",
    durationMs: 145000,
    taskId: "t1",
    taskTitle: "Set up Mission Control dashboard",
    tags: ["dev", "dashboard"],
    input: { component: "TaskBoard", features: ["kanban", "drag-drop", "filters"] },
    output: { linesOfCode: 1200, componentSize: "35.5 KB" },
    filesChanged: [
      {
        path: ".apps/mission-control/components/TaskBoard.tsx",
        operation: "created",
        sizeAfter: 35470,
      },
    ],
    undoAvailable: true,
    parentExecutionId: "exec-005",
  },
  {
    id: "exec-018",
    timestamp: ago(210),
    agentId: "agent-sub1",
    agentName: "Subagent Alpha",
    action: "Build CalendarScreen component",
    actionType: "task-execution",
    status: "success",
    durationMs: 98000,
    taskId: "t1",
    taskTitle: "Set up Mission Control dashboard",
    tags: ["dev", "dashboard"],
    input: { component: "CalendarScreen" },
    output: { linesOfCode: 580, componentSize: "15 KB" },
    filesChanged: [
      {
        path: ".apps/mission-control/components/CalendarScreen.tsx",
        operation: "created",
        sizeAfter: 14977,
      },
    ],
    undoAvailable: true,
    parentExecutionId: "exec-005",
  },
  {
    id: "exec-019",
    timestamp: ago(240),
    agentId: "agent-sub1",
    agentName: "Subagent Alpha",
    action: "npm run build — verify no TypeScript errors",
    actionType: "command",
    status: "failure",
    durationMs: 12500,
    tags: ["dev", "build"],
    input: { command: "npm run build", cwd: ".apps/mission-control" },
    errorMessage:
      "Type error in OfficeScreen.tsx line 42: Property 'children' does not exist on type 'Agent'. Build failed with 1 error.",
    undoAvailable: false,
    parentExecutionId: "exec-005",
  },
  {
    id: "exec-020",
    timestamp: ago(242),
    agentId: "agent-sub1",
    agentName: "Subagent Alpha",
    action: "Fix TypeScript error in OfficeScreen.tsx",
    actionType: "file-change",
    status: "success",
    durationMs: 890,
    tags: ["dev", "bugfix"],
    input: { filePath: ".apps/mission-control/components/OfficeScreen.tsx", operation: "modify" },
    output: { linesChanged: 3, errorFixed: "Property children type mismatch" },
    filesChanged: [
      {
        path: ".apps/mission-control/components/OfficeScreen.tsx",
        operation: "modified",
        sizeBefore: 8060,
        sizeAfter: 8056,
      },
    ],
    undoAvailable: true,
    parentExecutionId: "exec-019",
    reasoning: "Fixing TypeScript type error that caused build failure. Added proper type annotation.",
  },
  {
    id: "exec-021",
    timestamp: ago(245),
    agentId: "agent-sub1",
    agentName: "Subagent Alpha",
    action: "npm run build — second attempt",
    actionType: "command",
    status: "success",
    durationMs: 28400,
    tags: ["dev", "build"],
    input: { command: "npm run build", cwd: ".apps/mission-control" },
    output: { buildSize: "245 KB", routes: 8, warnings: 0 },
    undoAvailable: false,
    parentExecutionId: "exec-020",
  },
  {
    id: "exec-022",
    timestamp: ago(280),
    agentId: "agent-main",
    agentName: "XiaoZhu",
    action: "Export session logs to memory file",
    actionType: "memory-write",
    status: "success",
    durationMs: 340,
    tags: ["memory", "routine"],
    input: { source: "session-logs", target: "memory/2026-03-20.md" },
    output: { bytesWritten: 2450 },
    filesChanged: [
      {
        path: "workspace/memory/2026-03-20.md",
        operation: "created",
        sizeAfter: 2450,
      },
    ],
    undoAvailable: true,
  },
];

// Pattern detection — precomputed for analytics
export const failurePatterns = [
  {
    pattern: "TypeScript build errors",
    agentId: "agent-sub1",
    agentName: "Subagent Alpha",
    occurrences: 2,
    actionTypes: ["command"],
    recommendation: "Run tsc --noEmit before build step to catch type errors early.",
    exampleIds: ["exec-019"],
  },
  {
    pattern: "API timeout on external docs",
    agentId: "agent-sub2",
    agentName: "Subagent Beta",
    occurrences: 1,
    actionTypes: ["api-call"],
    recommendation: "Add retry logic with exponential backoff for external documentation fetches.",
    exampleIds: ["exec-008"],
  },
];

export const agentStats: Record<
  string,
  { totalExecutions: number; successRate: number; avgDurationMs: number; commonActions: string[] }
> = {
  "agent-main": {
    totalExecutions: 12,
    successRate: 100,
    avgDurationMs: 618,
    commonActions: ["memory-write", "heartbeat", "file-change", "agent-spawn"],
  },
  "agent-sub1": {
    totalExecutions: 7,
    successRate: 71,
    avgDurationMs: 46541,
    commonActions: ["command", "task-execution", "file-change"],
  },
  "agent-sub2": {
    totalExecutions: 2,
    successRate: 50,
    avgDurationMs: 3040,
    commonActions: ["api-call", "web-search"],
  },
};

export const retentionPolicy = {
  defaultDays: 90,
  maxDays: 365,
  archiveAfterDays: 30,
  exportFormats: ["csv", "json"] as const,
};
