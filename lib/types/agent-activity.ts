/**
 * Agent Activity Types
 * 
 * Shared type definitions for agent activity monitoring
 * Used by: /api/agents/[id]/activity and related UI components
 */

/**
 * SubagentActivityRecord - Represents the current activity of an agent
 * Extracted from the agent's live session JSONL file at:
 * `C:\Users\abuck\.openclaw\agents\main\sessions\{sessionId}.jsonl`
 */
export interface SubagentActivityRecord {
  /**
   * Current task/prompt text from the most recent user message
   * Limited to 500 characters for display purposes
   * null if no user messages have been sent yet
   */
  currentTask: string | null;

  /**
   * Agent operational status based on last activity timestamp
   * - working: Active in the last 90 seconds
   * - idle: Last activity 90s - 30m ago
   * - blocked: Agent encountered an error or was aborted
   * - offline: No activity for more than 30 minutes
   */
  status: "working" | "idle" | "blocked" | "offline";

  /**
   * Human-readable progress estimate of what the agent is currently doing
   * Examples:
   * - "Executing: read, write, exec"
   * - "Handling error..."
   * - "Processing..."
   * null if unable to determine progress
   */
  progressEstimate: string | null;

  /**
   * List of tools/skills used in the session
   * Deduplicated and sorted alphabetically
   * Examples: ["read", "write", "exec", "browser", "image"]
   * Empty array if no tools have been used yet
   */
  skillsUsed: string[];

  /**
   * ISO 8601 timestamp when the task/session started
   * Typically the timestamp of the session header or first user message
   * null if unable to determine start time
   */
  startTime: string | null;

  /**
   * Total number of messages (both user and assistant) processed
   * Includes all message-type entries in the JSONL file
   * Does not include other event types (model_change, tool_result, etc.)
   */
  messageCount: number;

  /**
   * ISO 8601 timestamp of the most recent event in the session
   * Used to determine agent status and recency
   * null if no events have been recorded
   */
  lastUpdated: string | null;

  /**
   * Total number of entries parsed from the JSONL file
   * Includes all event types: messages, model changes, tool calls, etc.
   */
  entryCount: number;

  /**
   * Error message if parsing or retrieval failed
   * null indicates successful operation
   * Check this field before using other fields if it's non-null
   */
  error: string | null;
}

/**
 * AgentSession - Extended session information for dashboard display
 * Combines data from /api/agents and /api/agents/[id]/activity
 */
export interface AgentSession {
  id: string;
  key: string;
  sessionId: string;
  kind: "main" | "subagent" | "slash";
  name: string;
  emoji: string;
  role: string;
  status: "working" | "idle" | "blocked" | "offline";
  model: string;
  updatedAt: number;
  ageMs: number;
  totalTokens: number | null;
  spawnDepth: number;
  spawnedBy: string | null;
  abortedLastRun: boolean;
  currentTask: string | null;
  lastActivity: string;
  sessionFile: string | null;
}

/**
 * ActivityPanelProps - Props for the agent activity display component
 * Used in React/Vue components to show live activity
 */
export interface ActivityPanelProps {
  agentId: string;
  activity: SubagentActivityRecord | null;
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => Promise<void>;
  pollInterval?: number; // milliseconds, default 2000
}

/**
 * ActivityDashboardState - Redux/Zustand state for activity monitoring
 * Manages polling and caching of multiple agent activities
 */
export interface ActivityDashboardState {
  activities: Record<string, SubagentActivityRecord>;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  lastFetch: Record<string, number>;
  pollInterval: number;
  isPolling: boolean;

  // Actions
  fetchActivity: (agentId: string) => Promise<void>;
  startPolling: (interval?: number) => void;
  stopPolling: () => void;
  clearActivity: (agentId: string) => void;
  clearAll: () => void;
}

/**
 * Helper type guards and utility types
 */

/** Check if activity is actively being processed */
export type IsWorking = (activity: SubagentActivityRecord) => boolean;

/** Check if activity represents an error state */
export type IsBlocked = (activity: SubagentActivityRecord) => boolean;

/** Format activity as readable string for logging */
export type FormatActivityLog = (activity: SubagentActivityRecord) => string;

/**
 * Status color mapping for UI display
 */
export const STATUS_COLORS: Record<SubagentActivityRecord["status"], string> = {
  working: "#10b981", // green
  idle: "#f59e0b", // amber
  blocked: "#ef4444", // red
  offline: "#6b7280", // gray
};

/**
 * Status labels for display
 */
export const STATUS_LABELS: Record<SubagentActivityRecord["status"], string> = {
  working: "Working",
  idle: "Idle",
  blocked: "Blocked",
  offline: "Offline",
};

/**
 * API Response wrapper for the activity endpoint
 */
export interface ActivityApiResponse {
  data: SubagentActivityRecord;
  status: "success" | "error" | "not_found";
  timestamp: string;
}
