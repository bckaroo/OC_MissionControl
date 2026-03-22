// Real subagent activity data reflecting actual OpenClaw configuration
// Matches AGENTS_ROSTER.md: XiaoZhu (main) + 4 subagents

export interface SubagentActivityRecord {
  agentId: string;
  agentName: string;
  agentEmoji: string;
  specialization: string;
  model: string;
  status: "working" | "idle" | "available" | "offline";
  currentTask?: string;
  lastActive?: string;
  uptimePercent?: number;
}

export const mockMainAgentActivity: SubagentActivityRecord = {
  agentId: "agent:main:main",
  agentName: "XiaoZhu",
  agentEmoji: "🐖",
  specialization: "Chief of Staff - Main Coordinator",
  model: "lmstudio/qwen/qwen3.5-9b (STANDARD mode)",
  status: "working",
  currentTask: "Coordinating team, routing tasks, main Discord listener",
  lastActive: new Date().toISOString(),
  uptimePercent: 99.8,
};

export const mockSubagentActivities: SubagentActivityRecord[] = [
  {
    agentId: "agent:main:subagent:xiaoya",
    agentName: "xiaoya",
    agentEmoji: "🦆",
    specialization: "Coding & Debugging Specialist",
    model: "lmstudio/qwen/qwen3-coder-30b",
    status: "available",
    currentTask: "Ready for coding tasks, refactoring, feature building",
    lastActive: "2026-03-21T17:41:58Z",
    uptimePercent: 100,
  },
  {
    agentId: "agent:main:subagent:xiaohu",
    agentName: "xiaohu",
    agentEmoji: "🐯",
    specialization: "Deep Reasoning & Analysis Specialist",
    model: "lmstudio/deepseek/deepseek-r1-0528-qwen3-8b",
    status: "available",
    currentTask: "Ready for complex reasoning, research, problem-solving",
    lastActive: "2026-03-21T17:41:58Z",
    uptimePercent: 100,
  },
  {
    agentId: "agent:main:subagent:xiaomao",
    agentName: "xiaomao",
    agentEmoji: "🐱",
    specialization: "Writing & Documentation Specialist",
    model: "lmstudio/qwen/qwen3-coder-30b",
    status: "available",
    currentTask: "Ready for essays, documentation, long-form writing",
    lastActive: "2026-03-21T17:41:58Z",
    uptimePercent: 100,
  },
  {
    agentId: "agent:main:subagent:xiaozhu-vision",
    agentName: "xiaozhu-vision",
    agentEmoji: "🐖",
    specialization: "Vision & Multimodal Specialist",
    model: "lmstudio/qwen/qwen3-vl-30b",
    status: "available",
    currentTask: "Ready for image analysis, multimodal tasks (text + images)",
    lastActive: "2026-03-21T17:41:58Z",
    uptimePercent: 100,
  },
];

// Helper to get activity for a specific agent
export function getSubagentActivity(agentId: string): SubagentActivityRecord | undefined {
  if (agentId === "agent:main:main") return mockMainAgentActivity;
  return mockSubagentActivities.find((a) => a.agentId === agentId);
}

// Helper to get all agents (including main)
export function getAllAgents(): SubagentActivityRecord[] {
  return [mockMainAgentActivity, ...mockSubagentActivities];
}

// Helper to get all available subagents
export function getAvailableSubagents(): SubagentActivityRecord[] {
  return mockSubagentActivities.filter((a) => a.status === "available");
}

// Helper to get team overview
export function getTeamOverview() {
  return {
    totalAgents: 1 + mockSubagentActivities.length,
    mainAgent: mockMainAgentActivity,
    subagents: mockSubagentActivities.length,
    availableSubagents: mockSubagentActivities.filter((a) => a.status === "available").length,
    teamStatus: "fully operational" as const,
    lastUpdated: new Date().toISOString(),
  };
}
