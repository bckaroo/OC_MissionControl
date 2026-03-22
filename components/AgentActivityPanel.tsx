/**
 * AgentActivityPanel - React Component
 * 
 * Displays live agent activity from /api/agents/{id}/activity endpoint
 * Shows current task, status, progress, and tools being used
 * 
 * Usage:
 * <AgentActivityPanel agentId="agent:main:subagent:..." />
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import type { SubagentActivityRecord } from '@/lib/types/agent-activity';
import {
  isWorking,
  isBlocked,
  isIdle,
  isOffline,
  getStatusColor,
  getStatusLabel,
  formatTaskDuration,
  formatRelativeTime,
  formatTimestamp,
  truncateTask,
  getTaskDuration,
} from '@/lib/utils/activity-utils';

interface AgentActivityPanelProps {
  /** Encoded agent session key (e.g., "agent%3Amain%3Asubagent%3A061299d1...") */
  agentId: string;
  
  /** Poll interval in milliseconds (default: 2000) */
  pollInterval?: number;
  
  /** Custom title (default: "Agent Activity") */
  title?: string;
  
  /** Show detailed timestamps (default: false) */
  showDetailed?: boolean;
  
  /** Callback when activity changes */
  onActivityChange?: (activity: SubagentActivityRecord) => void;
  
  /** CSS class for styling */
  className?: string;
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: SubagentActivityRecord['status'] }) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);
  
  const statusEmoji: Record<string, string> = {
    working: '🟢',
    idle: '🟡',
    blocked: '🔴',
    offline: '⚪',
  };
  
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color }}
      title={`Status: ${label}`}
    >
      {statusEmoji[status]} {label}
    </span>
  );
}

/**
 * Skill Chip Component
 */
function SkillChip({ skill }: { skill: string }) {
  return (
    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-2">
      {skill}
    </span>
  );
}

/**
 * Loading Skeleton
 */
function ActivitySkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
      <div className="flex gap-2">
        <div className="h-5 bg-gray-200 rounded animate-pulse w-16"></div>
        <div className="h-5 bg-gray-200 rounded animate-pulse w-16"></div>
      </div>
    </div>
  );
}

/**
 * Error Display Component
 */
function ActivityError({ error }: { error: string }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h4 className="text-sm font-semibold text-red-800 mb-1">Error Loading Activity</h4>
      <p className="text-xs text-red-700 font-mono">{error}</p>
    </div>
  );
}

/**
 * Main Component
 */
export function AgentActivityPanel({
  agentId,
  pollInterval = 2000,
  title = 'Agent Activity',
  showDetailed = false,
  onActivityChange,
  className = '',
}: AgentActivityPanelProps) {
  const [activity, setActivity] = useState<SubagentActivityRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevActivity, setPrevActivity] = useState<SubagentActivityRecord | null>(null);

  /**
   * Fetch activity from API
   */
  const fetchActivity = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/agents/${agentId}/activity`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: SubagentActivityRecord = await response.json();
      
      // Call change callback if activity changed
      if (activity && onActivityChange && data.status !== activity.status) {
        onActivityChange(data);
      }
      
      setPrevActivity(activity);
      setActivity(data);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [agentId, activity, onActivityChange]);

  /**
   * Initial fetch and polling setup
   */
  useEffect(() => {
    // Fetch immediately
    fetchActivity();
    
    // Set up polling
    const interval = setInterval(fetchActivity, pollInterval);
    
    return () => clearInterval(interval);
  }, [fetchActivity, pollInterval]);

  if (isLoading && !activity) {
    return (
      <div className={`border rounded-lg ${className}`}>
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <ActivitySkeleton />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className={`border rounded-lg ${className}`}>
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <div className="p-4">
          <ActivityError error={error || 'No activity data'} />
        </div>
      </div>
    );
  }

  const taskDuration = getTaskDuration(activity);

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-sm">{title}</h3>
        <StatusBadge status={activity.status} />
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Current Task */}
        {activity.currentTask ? (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Current Task
            </label>
            <p className="text-sm text-gray-800 bg-blue-50 p-2 rounded border border-blue-100">
              {activity.currentTask}
            </p>
          </div>
        ) : (
          <div className="text-xs text-gray-500 italic">No active task</div>
        )}

        {/* Progress */}
        {activity.progressEstimate && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Progress
            </label>
            <p className="text-sm text-gray-700">
              {activity.progressEstimate}
            </p>
          </div>
        )}

        {/* Skills/Tools Used */}
        {activity.skillsUsed.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Skills Used ({activity.skillsUsed.length})
            </label>
            <div className="flex flex-wrap">
              {activity.skillsUsed.map(skill => (
                <SkillChip key={skill} skill={skill} />
              ))}
            </div>
          </div>
        )}

        {/* Timing Information */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded">
          <div>
            <div className="text-gray-600 font-semibold mb-1">Started</div>
            <div className="text-gray-700">
              {activity.startTime
                ? showDetailed
                  ? formatTimestamp(activity.startTime)
                  : formatRelativeTime(activity.startTime)
                : 'Unknown'}
            </div>
          </div>
          <div>
            <div className="text-gray-600 font-semibold mb-1">Last Update</div>
            <div className="text-gray-700">
              {activity.lastUpdated
                ? formatRelativeTime(activity.lastUpdated)
                : 'Never'}
            </div>
          </div>
          {taskDuration && (
            <div className="col-span-2">
              <div className="text-gray-600 font-semibold mb-1">Duration</div>
              <div className="text-gray-700">{formatTaskDuration(taskDuration)}</div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs border-t pt-3">
          <div className="text-center">
            <div className="text-gray-600 font-semibold">{activity.messageCount}</div>
            <div className="text-gray-500 text-xs">Messages</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600 font-semibold">{activity.entryCount}</div>
            <div className="text-gray-500 text-xs">Entries</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600 font-semibold">{activity.skillsUsed.length}</div>
            <div className="text-gray-500 text-xs">Tools</div>
          </div>
        </div>

        {/* Error message if present */}
        {activity.error && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ {activity.error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-600 text-right">
        Last fetched: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

/**
 * Hook for using activity in components
 */
export function useAgentActivity(
  agentId: string,
  pollInterval: number = 2000
) {
  const [activity, setActivity] = useState<SubagentActivityRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch(`/api/agents/${agentId}/activity`);
        const data = await res.json();
        setActivity(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activity');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, pollInterval);
    return () => clearInterval(interval);
  }, [agentId, pollInterval]);

  return { activity, isLoading, error };
}

export default AgentActivityPanel;
