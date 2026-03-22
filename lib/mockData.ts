// Mock data for all screens

export const mockTasks = [
  {
    id: "t1",
    title: "Set up Mission Control dashboard",
    description: "Build Next.js dashboard with all 7 screens",
    status: "done",
    assignee: "XiaoZhu",
    assigneeInitials: "XZ",
    priority: "high",
    project: "Mission Control",
    createdAt: "2026-03-20",
    tags: ["dev", "dashboard"],
  },
  {
    id: "t2",
    title: "Write YouTube transcript skill",
    description: "Create skill for fetching YouTube transcripts",
    status: "done",
    assignee: "XiaoZhu",
    assigneeInitials: "XZ",
    priority: "medium",
    project: "OpenClaw Skills",
    createdAt: "2026-03-20",
    tags: ["skill", "youtube"],
  },
  {
    id: "t3",
    title: "Implement drag-and-drop Kanban",
    description: "Add DnD functionality to task board",
    status: "in-progress",
    assignee: "XiaoZhu",
    assigneeInitials: "XZ",
    priority: "high",
    project: "Mission Control",
    createdAt: "2026-03-21",
    tags: ["dev", "ux"],
  },
  {
    id: "t4",
    title: "Memory screen full-text search",
    description: "Implement search across all memory files",
    status: "in-progress",
    assignee: "Andrew",
    assigneeInitials: "AB",
    priority: "medium",
    project: "Mission Control",
    createdAt: "2026-03-21",
    tags: ["dev", "search"],
  },
  {
    id: "t5",
    title: "Configure heartbeat scheduler",
    description: "Set up periodic checks for email, calendar, weather",
    status: "backlog",
    assignee: "XiaoZhu",
    assigneeInitials: "XZ",
    priority: "low",
    project: "Automation",
    createdAt: "2026-03-21",
    tags: ["automation", "heartbeat"],
  },
  {
    id: "t6",
    title: "Add cron job for daily summaries",
    description: "Schedule daily recap emails at 8 AM",
    status: "backlog",
    assignee: "Andrew",
    assigneeInitials: "AB",
    priority: "medium",
    project: "Automation",
    createdAt: "2026-03-21",
    tags: ["cron", "email"],
  },
  {
    id: "t7",
    title: "Review OpenClaw skill catalog",
    description: "Audit installed skills and identify gaps",
    status: "in-review",
    assignee: "Andrew",
    assigneeInitials: "AB",
    priority: "low",
    project: "OpenClaw Skills",
    createdAt: "2026-03-19",
    tags: ["planning"],
  },
  {
    id: "t8",
    title: "Build Discord integration skill",
    description: "Discord ops via message tool",
    status: "in-review",
    assignee: "XiaoZhu",
    assigneeInitials: "XZ",
    priority: "high",
    project: "OpenClaw Skills",
    createdAt: "2026-03-18",
    tags: ["skill", "discord"],
  },
  {
    id: "t9",
    title: "Fix CalendarScreen parseCronDays error",
    description: "TypeError: Cannot read properties of undefined (reading 'split') at line 63. Add null check for cron expression before .split()",
    status: "backlog",
    assignee: "XiaoZhu",
    assigneeInitials: "XZ",
    priority: "high",
    project: "Mission Control",
    createdAt: "2026-03-21",
    tags: ["dev", "bugfix", "calendar"],
  },
  {
    id: "t10",
    title: "Finalize Models page - Mode switching integration",
    description: "Mode switch buttons (/api/openclaw/mode/status POST) returning malformed JSON. Fix error handling and ensure config updates work correctly. Buttons should toggle between STANDARD and HIGH_PERFORMANCE modes.",
    status: "backlog",
    assignee: "XiaoZhu",
    assigneeInitials: "XZ",
    priority: "high",
    project: "Mission Control",
    createdAt: "2026-03-21",
    tags: ["dev", "bugfix", "models", "mode-control"],
  },
];

export const mockActivities = [
  {
    id: "a1",
    agent: "XiaoZhu",
    action: "Completed task: Set up Mission Control",
    timestamp: "2m ago",
    type: "task",
  },
  {
    id: "a2",
    agent: "XiaoZhu",
    action: "Fetched YouTube transcript for video analysis",
    timestamp: "15m ago",
    type: "skill",
  },
  {
    id: "a3",
    agent: "XiaoZhu",
    action: "Updated memory: 2026-03-20.md",
    timestamp: "1h ago",
    type: "memory",
  },
  {
    id: "a4",
    agent: "XiaoZhu",
    action: "Heartbeat check: email & calendar scanned",
    timestamp: "2h ago",
    type: "heartbeat",
  },
  {
    id: "a5",
    agent: "XiaoZhu",
    action: "Searched web for OpenClaw docs",
    timestamp: "3h ago",
    type: "search",
  },
];

export const mockProjects = [
  {
    id: "p1",
    name: "Mission Control",
    description: "Custom dashboard for OpenClaw agent visibility and control",
    status: "active",
    progress: 65,
    priority: "high",
    tasks: ["t1", "t3", "t4"],
    createdAt: "2026-03-20",
    updatedAt: "2026-03-21",
    tags: ["dev", "dashboard"],
    nextSteps: [
      "Complete drag-and-drop Kanban",
      "Implement memory search",
      "Add real-time updates",
    ],
  },
  {
    id: "p2",
    name: "OpenClaw Skills",
    description: "Building and maintaining agent skills library",
    status: "active",
    progress: 45,
    priority: "high",
    tasks: ["t2", "t7", "t8"],
    createdAt: "2026-03-18",
    updatedAt: "2026-03-20",
    tags: ["skills", "automation"],
    nextSteps: [
      "Publish YouTube transcript skill",
      "Build Discord skill",
      "Review skill catalog",
    ],
  },
  {
    id: "p3",
    name: "Automation Pipeline",
    description: "Set up automated scheduling, heartbeats, and cron jobs",
    status: "planning",
    progress: 20,
    priority: "medium",
    tasks: ["t5", "t6"],
    createdAt: "2026-03-21",
    updatedAt: "2026-03-21",
    tags: ["automation", "cron"],
    nextSteps: [
      "Configure heartbeat checks",
      "Set up daily summaries",
      "Add weather alerts",
    ],
  },
  {
    id: "p4",
    name: "Personal Knowledge Base",
    description: "Organize and maintain long-term memory and documents",
    status: "paused",
    progress: 30,
    priority: "low",
    tasks: [],
    createdAt: "2026-03-19",
    updatedAt: "2026-03-19",
    tags: ["memory", "docs"],
    nextSteps: [
      "Set up document categorization",
      "Build search across memories",
      "Archive old transcripts",
    ],
  },
];

export const mockMemories = [
  {
    id: "m1",
    date: "2026-03-21",
    title: "Mission Control Dashboard Build",
    preview:
      "Started building the full Mission Control dashboard as a Next.js app. Requirements include Task Board (Kanban), Calendar, Projects, Memory, Documents, Team, and Office screens.",
    content: `# 2026-03-21 Memory

## Mission Control Dashboard Build
Started building the full Mission Control dashboard as a Next.js app with a Linear-like interface.

Requirements include:
- Task Board (Kanban) with drag-and-drop
- Calendar Screen with cron job visibility  
- Projects Screen with progress tracking
- Memory Screen (journal/record view)
- Documents Screen (library)
- Team Screen (org chart + mission)
- Office Screen (2D pixel art)

## YouTube Transcript Skill
Successfully tested the youtube-transcript skill. Fetched transcript for a video about OpenAI.

## Notes
- Andrew is in EST timezone
- Running on Windows (VENGEANCE machine)
- Using telegram as primary channel`,
    tags: ["dashboard", "dev"],
  },
  {
    id: "m2",
    date: "2026-03-20",
    title: "Setup Day — First Real Session",
    preview:
      "Bootstrap complete. Read SOUL.md, USER.md, AGENTS.md. Set up identity as XiaoZhu the pig. Started exploring OpenClaw workspace.",
    content: `# 2026-03-20 Memory

## Bootstrap Complete
Read all startup files:
- SOUL.md: Who I am
- USER.md: Andrew, EST timezone
- AGENTS.md: My operating rules

## Identity
Established as XiaoZhu 🐖 — warm, helpful, curious pig.

## OpenClaw Exploration
- Explored workspace structure
- Reviewed available skills
- Found BOOTSTRAP.md and followed it

## YouTube Transcript Work
Andrew asked me to fetch a YouTube transcript.
- Used get_transcript.py script
- Successfully extracted transcript
- Saved to workspace

## Notes for Future
- Andrew prefers direct, no-filler responses
- He uses Telegram as primary channel
- Machine name: VENGEANCE`,
    tags: ["setup", "identity"],
  },
];

export const mockDocuments = [
  {
    id: "d1",
    title: "Mission Control Requirements",
    type: "planning",
    category: "PRD",
    createdAt: "2026-03-21",
    updatedAt: "2026-03-21",
    size: "5.1 KB",
    tags: ["dashboard", "planning"],
    preview:
      "A custom dashboard for OpenClaw that provides visibility and control over agent activities, tasks, schedules, and projects...",
    path: ".apps/MissionControl/REQUIREMENTS.md",
  },
  {
    id: "d2",
    title: "YouTube Transcript Skill",
    type: "skill",
    category: "Skill",
    createdAt: "2026-03-21",
    updatedAt: "2026-03-21",
    size: "3.2 KB",
    tags: ["skill", "youtube"],
    preview:
      "Skill for fetching and extracting transcripts from YouTube videos using auto-generated or manual captions...",
    path: "youtube-transcript.skill",
  },
  {
    id: "d3",
    title: "OpenClaw Workspace AGENTS.md",
    type: "config",
    category: "Config",
    createdAt: "2026-03-20",
    updatedAt: "2026-03-20",
    size: "7.9 KB",
    tags: ["agents", "config"],
    preview:
      "This folder is home. Treat it that way. Session startup instructions and memory management...",
    path: "AGENTS.md",
  },
  {
    id: "d4",
    title: "SOUL.md — Identity & Persona",
    type: "config",
    category: "Config",
    createdAt: "2026-03-20",
    updatedAt: "2026-03-20",
    size: "1.8 KB",
    tags: ["soul", "identity"],
    preview:
      "You're not a chatbot. You're becoming someone. Be genuinely helpful, not performatively helpful...",
    path: "SOUL.md",
  },
  {
    id: "d5",
    title: "Video Transcript: OpenAI Analysis",
    type: "transcript",
    category: "Transcript",
    createdAt: "2026-03-21",
    updatedAt: "2026-03-21",
    size: "22.8 KB",
    tags: ["youtube", "transcript"],
    preview: "Auto-generated transcript from YouTube video analysis...",
    path: "transcript.txt",
  },
];

export const mockTeam = {
  mission:
    "Augment Andrew's capabilities as a brilliant, resourceful partner — handling research, automation, scheduling, and creative work — so he can focus on what matters most.",
  agents: [
    {
      id: "agent-main",
      name: "XiaoZhu",
      role: "Main Agent",
      emoji: "🐖",
      device: "VENGEANCE",
      status: "active",
      currentTask: "Building Mission Control dashboard",
      children: ["agent-sub1", "agent-sub2"],
    },
    {
      id: "agent-sub1",
      name: "Subagent Alpha",
      role: "Coding Agent",
      emoji: "🤖",
      device: "VENGEANCE",
      status: "idle",
      currentTask: null,
      children: [],
    },
    {
      id: "agent-sub2",
      name: "Subagent Beta",
      role: "Research Agent",
      emoji: "🔍",
      device: "VENGEANCE",
      status: "idle",
      currentTask: null,
      children: [],
    },
  ],
};

export const mockCronJobs = [
  {
    id: "c1",
    name: "Daily Email Check",
    schedule: "0 8 * * *",
    description: "Check inbox for urgent emails",
    nextRun: "2026-03-22 08:00",
    status: "active",
    type: "heartbeat",
  },
  {
    id: "c2",
    name: "Calendar Sync",
    schedule: "0 */4 * * *",
    description: "Sync upcoming calendar events",
    nextRun: "2026-03-21 04:00",
    status: "active",
    type: "calendar",
  },
  {
    id: "c3",
    name: "Memory Cleanup",
    schedule: "0 0 * * 0",
    description: "Weekly memory consolidation",
    nextRun: "2026-03-28 00:00",
    status: "active",
    type: "memory",
  },
  {
    id: "c4",
    name: "Weather Check",
    schedule: "0 7 * * *",
    description: "Morning weather briefing",
    nextRun: "2026-03-22 07:00",
    status: "paused",
    type: "weather",
  },
];
