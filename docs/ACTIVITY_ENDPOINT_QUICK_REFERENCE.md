# Activity Endpoint - Quick Reference

## TL;DR

```bash
# Get agent activity
curl "http://localhost:3000/api/agents/{agentSessionKey}/activity"

# Example for main agent
curl "http://localhost:3000/api/agents/agent%3Amain%3Amain/activity"

# Example for subagent
curl "http://localhost:3000/api/agents/agent%3Amain%3Asubagent%3A061299d1-169c-433e-8d84-b075a25412e0/activity"
```

## Response at a Glance

```json
{
  "currentTask": "What the agent is working on",
  "status": "working",           // working | idle | blocked | offline
  "progressEstimate": "Executing: read, write",
  "skillsUsed": ["read", "write", "exec"],
  "startTime": "2026-03-21T16:41:32.925Z",
  "messageCount": 12,
  "lastUpdated": "2026-03-21T16:42:15.123Z",
  "entryCount": 45,
  "error": null
}
```

## Import Types in Your Component

```typescript
import { SubagentActivityRecord } from "@/lib/types/agent-activity";
import { 
  isWorking, 
  isBlocked, 
  formatTaskDuration,
  getStatusColor 
} from "@/lib/utils/activity-utils";

// Use in component
const activity = await fetch(`/api/agents/${agentId}/activity`).then(r => r.json());

if (isWorking(activity)) {
  console.log("Agent is actively working!");
}

const taskDuration = getTaskDuration(activity);
if (taskDuration) {
  console.log(`Been working for: ${formatTaskDuration(taskDuration)}`);
}
```

## Status Meanings

| Status | Meaning | Display |
|--------|---------|---------|
| `working` | Active in last 90 seconds | 🟢 Green |
| `idle` | Last activity 90s-30m ago | 🟡 Amber |
| `blocked` | Error or aborted | 🔴 Red |
| `offline` | No activity for >30m | ⚪ Gray |

## Common Use Cases

### Check if Agent is Currently Working

```typescript
const activity = await fetch(`/api/agents/${id}/activity`).then(r => r.json());

if (activity.status === "working") {
  // Show live spinner/animation
  console.log("Agent is working on: ", activity.currentTask);
}
```

### Display Task Duration

```typescript
import { formatTaskDuration, getTaskDuration } from "@/lib/utils/activity-utils";

const duration = getTaskDuration(activity);
if (duration) {
  console.log(`Task duration: ${formatTaskDuration(duration)}`);
}
```

### Show Skills Being Used

```typescript
<div>
  <h3>Skills Used</h3>
  {activity.skillsUsed.length > 0 ? (
    <div>{activity.skillsUsed.join(", ")}</div>
  ) : (
    <div>No tools used yet</div>
  )}
</div>
```

### Poll for Live Updates (React)

```typescript
import { useEffect, useState } from "react";
import type { SubagentActivityRecord } from "@/lib/types/agent-activity";

export function ActivityMonitor({ agentId }: { agentId: string }) {
  const [activity, setActivity] = useState<SubagentActivityRecord | null>(null);

  useEffect(() => {
    const pollActivity = async () => {
      try {
        const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/activity`);
        const data = await res.json();
        setActivity(data);
      } catch (err) {
        console.error("Failed to fetch activity:", err);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollActivity, 2000);
    pollActivity(); // Initial fetch

    return () => clearInterval(interval);
  }, [agentId]);

  if (!activity) return <div>Loading...</div>;

  return (
    <div>
      <h2>Status: {activity.status}</h2>
      <p>{activity.currentTask}</p>
      <p>Progress: {activity.progressEstimate}</p>
      <p>Tools: {activity.skillsUsed.join(", ")}</p>
    </div>
  );
}
```

### Handle Errors

```typescript
const activity = await fetch(`/api/agents/${id}/activity`).then(r => r.json());

if (activity.error) {
  console.error("Failed to get activity:", activity.error);
  // Fallback UI
} else {
  // Use activity data
}
```

## File Locations

- **Endpoint**: `app/api/agents/[id]/activity/route.ts`
- **Types**: `lib/types/agent-activity.ts`
- **Utils**: `lib/utils/activity-utils.ts`
- **Tests**: `__tests__/api/agents/activity.test.ts`
- **Docs**: `docs/API_AGENTS_ACTIVITY.md`

## Performance Tips

1. **Cache Results**: Don't poll more frequently than every 2 seconds
2. **Batch Requests**: When fetching multiple agents, use Promise.all()
3. **Early Return**: Check `status` before accessing detailed fields
4. **Handle Offline**: Always check `error` field before relying on data

## Troubleshooting

### "error: ENOENT: no such file or directory"
- Session file doesn't exist (agent was deleted or session ID is wrong)
- Check the agentId is correct and URL-encoded

### "error: null but no data"
- Session file exists but is empty or unreadable
- Check file permissions

### "status: offline" but agent is active
- Check if the session file is being updated (look at lastUpdated timestamp)
- May be a lag between activity and file write

### Empty skillsUsed array
- Agent hasn't used any tools yet
- Session might be brand new

## API Contract

```typescript
GET /api/agents/{encodedSessionKey}/activity

Response 200 OK:
{
  currentTask: string | null,
  status: "working" | "idle" | "blocked" | "offline",
  progressEstimate: string | null,
  skillsUsed: string[],
  startTime: string | null,
  messageCount: number,
  lastUpdated: string | null,
  entryCount: number,
  error: string | null
}
```

## Related Endpoints

- `GET /api/agents` - List all agents
- `GET /api/agents/{id}/status` - Session stats (tokens, model, etc.)
- `GET /api/agents/{id}/logs` - Message logs
- `GET /api/agents/{id}/control` - Control agent (stop, restart)

## Development

### Run Tests
```bash
npm test __tests__/api/agents/activity.test.ts
```

### Mock Activity in Components
```typescript
import { createMockActivity } from "@/lib/utils/activity-utils";

const mockActivity = createMockActivity({
  status: "working",
  currentTask: "My custom task",
  skillsUsed: ["read", "write"],
});
```

### Format for Logging
```typescript
import { formatActivityLog } from "@/lib/utils/activity-utils";

console.log(formatActivityLog(activity));
// Output: [WORKING] My task... | Skills: read, write | Duration: 2 minutes
```

## Key Insights

- **Real-time but eventual**: Activity updates are delayed by file I/O (typically <1s)
- **Safe to poll**: Endpoint is read-only and doesn't affect agent state
- **JSONL format**: Session files are JSON Lines (one JSON object per line)
- **Deduped skills**: Tool names are automatically deduplicated and sorted
- **Time windows**: Status transitions happen at 90s and 30m boundaries

---

**Version**: 1.0
**Last Updated**: 2026-03-21
**Status**: Production Ready ✅
