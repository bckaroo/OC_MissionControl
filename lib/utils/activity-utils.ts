/**
 * Activity Utilities
 * 
 * Helper functions for working with agent activity data
 * Handles formatting, status checks, and time calculations
 */

import {
  SubagentActivityRecord,
  STATUS_COLORS,
  STATUS_LABELS,
  IsWorking,
  IsBlocked,
  FormatActivityLog,
} from "../types/agent-activity";

/**
 * Check if an agent is currently working (active within last 90 seconds)
 */
export const isWorking: IsWorking = (activity) => activity.status === "working";

/**
 * Check if an agent is blocked or in an error state
 */
export const isBlocked: IsBlocked = (activity) => activity.status === "blocked";

/**
 * Check if an agent is idle (was recently active but not currently working)
 */
export const isIdle = (activity: SubagentActivityRecord): boolean => activity.status === "idle";

/**
 * Check if an agent is offline (no activity for >30 minutes)
 */
export const isOffline = (activity: SubagentActivityRecord): boolean => activity.status === "offline";

/**
 * Get the color for an activity status
 * Useful for UI components (badges, indicators, etc.)
 */
export const getStatusColor = (status: SubagentActivityRecord["status"]): string => {
  return STATUS_COLORS[status];
};

/**
 * Get the display label for a status
 */
export const getStatusLabel = (status: SubagentActivityRecord["status"]): string => {
  return STATUS_LABELS[status];
};

/**
 * Calculate how long the agent has been working on the current task
 * Returns duration in milliseconds, or null if unable to determine
 */
export const getTaskDuration = (activity: SubagentActivityRecord): number | null => {
  if (!activity.startTime || !activity.lastUpdated) return null;

  const start = new Date(activity.startTime).getTime();
  const end = new Date(activity.lastUpdated).getTime();

  if (isNaN(start) || isNaN(end)) return null;

  return Math.max(0, end - start);
};

/**
 * Format task duration as human-readable string
 * Examples: "2 hours 30 minutes", "45 seconds", "3 days"
 */
export const formatTaskDuration = (durationMs: number): string => {
  if (durationMs < 1000) {
    return "just now";
  }

  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ${minutes % 60} min${minutes % 60 === 1 ? "" : "s"}`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ${hours % 24} hour${hours % 24 === 1 ? "" : "s"}`;
};

/**
 * Format timestamp as relative time (e.g., "2 minutes ago", "just now")
 */
export const formatRelativeTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = Date.now();
    const diffMs = now - date.getTime();

    if (diffMs < 1000) return "just now";
    if (diffMs < 60_000) return `${Math.floor(diffMs / 1000)}s ago`;
    if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
    if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)}h ago`;
    return `${Math.floor(diffMs / 86400_000)}d ago`;
  } catch {
    return "unknown";
  }
};

/**
 * Format timestamp as ISO string with local timezone
 */
export const formatTimestamp = (timestamp: string | null): string => {
  if (!timestamp) return "Never";
  try {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "Invalid date";
  }
};

/**
 * Truncate task text for display
 */
export const truncateTask = (task: string | null, maxLength: number = 100): string => {
  if (!task) return "No task";
  if (task.length <= maxLength) return task;
  return task.slice(0, maxLength) + "...";
};

/**
 * Check if activity data is complete and valid
 */
export const isValidActivity = (activity: unknown): activity is SubagentActivityRecord => {
  if (typeof activity !== "object" || activity === null) return false;

  const record = activity as Record<string, unknown>;
  return (
    typeof record.currentTask === "string" ||
    record.currentTask === null
  ) && (
    record.status === "working" ||
    record.status === "idle" ||
    record.status === "blocked" ||
    record.status === "offline"
  ) && (
    typeof record.skillsUsed === "object" &&
    Array.isArray(record.skillsUsed)
  ) && (
    typeof record.entryCount === "number" &&
    typeof record.messageCount === "number"
  );
};

/**
 * Check if activity has recent errors
 */
export const hasRecentError = (activity: SubagentActivityRecord): boolean => {
  return activity.error !== null && activity.status === "blocked";
};

/**
 * Format activity as a human-readable log entry
 */
export const formatActivityLog: FormatActivityLog = (activity) => {
  const taskSummary = activity.currentTask ? activity.currentTask.slice(0, 50) + "..." : "No task";
  const skillsList = activity.skillsUsed.length > 0 ? activity.skillsUsed.join(", ") : "none";
  const duration = activity.startTime && activity.lastUpdated
    ? formatTaskDuration(new Date(activity.lastUpdated).getTime() - new Date(activity.startTime).getTime())
    : "unknown";

  return `[${getStatusLabel(activity.status).toUpperCase()}] ${taskSummary} | Skills: ${skillsList} | Duration: ${duration}`;
};

/**
 * Get a summary of agent activity for notifications/alerts
 */
export const getActivitySummary = (activity: SubagentActivityRecord): string => {
  if (activity.error) {
    return `⚠️ Error: ${activity.error}`;
  }

  if (isWorking(activity)) {
    return `🔄 Working on: ${truncateTask(activity.currentTask, 60)}`;
  }

  if (isBlocked(activity)) {
    return "❌ Blocked or offline";
  }

  if (isIdle(activity)) {
    return `⏸️ Idle (last update: ${formatRelativeTime(activity.lastUpdated || new Date().toISOString())})`;
  }

  return "⏱️ Offline";
};

/**
 * Determine if activity data needs to be refreshed
 * Returns true if last fetch was more than cacheTimeMs ago
 */
export const shouldRefreshActivity = (
  lastFetchTime: number | null,
  cacheTimeMs: number = 2000
): boolean => {
  if (!lastFetchTime) return true;
  return Date.now() - lastFetchTime > cacheTimeMs;
};

/**
 * Create a mock/placeholder activity record
 * Useful for UI development and testing
 */
export const createMockActivity = (overrides?: Partial<SubagentActivityRecord>): SubagentActivityRecord => {
  const now = new Date();
  const startTime = new Date(now.getTime() - 5 * 60_000); // 5 minutes ago

  return {
    currentTask: "Processing request from user",
    status: "working",
    progressEstimate: "Executing: read, write",
    skillsUsed: ["read", "write", "exec"],
    startTime: startTime.toISOString(),
    messageCount: 8,
    lastUpdated: now.toISOString(),
    entryCount: 20,
    error: null,
    ...overrides,
  };
};

/**
 * Compare two activity records to detect changes
 * Useful for notifications about status changes
 */
export const detectActivityChanges = (
  previousActivity: SubagentActivityRecord | null,
  currentActivity: SubagentActivityRecord
): {
  statusChanged: boolean;
  taskChanged: boolean;
  skillsChanged: boolean;
  errorOccurred: boolean;
} => {
  return {
    statusChanged: previousActivity?.status !== currentActivity.status,
    taskChanged: previousActivity?.currentTask !== currentActivity.currentTask,
    skillsChanged: JSON.stringify(previousActivity?.skillsUsed) !== JSON.stringify(currentActivity.skillsUsed),
    errorOccurred: previousActivity?.error === null && currentActivity.error !== null,
  };
};

/**
 * Encode agent session key for API requests
 */
export const encodeAgentId = (sessionKey: string): string => {
  return encodeURIComponent(sessionKey);
};

/**
 * Decode agent session key from API response
 */
export const decodeAgentId = (encodedId: string): string => {
  return decodeURIComponent(encodedId);
};
