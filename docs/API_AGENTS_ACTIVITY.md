# Agent Activity API

## Endpoint

`GET /api/agents/{id}/activity`

## Purpose

Returns the current activity and state of a subagent by parsing their live session JSONL file. This endpoint extracts real-time information about what an agent is currently working on, including their task, status, progress, and skills being used.

## Parameters

### Path Parameters

- **id** (string, required)
  - The agent's encoded session key
  - Format: `agent:main:subagent:{sessionId}` (URL-encoded)
  - Example: `agent%3Amain%3Asubagent%3A061299d1-169c-433e-8d84-b075a25412e0`
  - For the main agent: `agent%3Amain%3Amain`

## Response

Returns a `SubagentActivityRecord` object with the following structure:

```typescript
interface SubagentActivityRecord {
  /** Current task/prompt text from the most recent user message (max 500 chars) */
  currentTask: string | null;
  
  /** Agent status: working | idle | blocked | offline */
  status: "working" | "idle" | "blocked" | "offline";
  
  /** Human-readable progress estimate (e.g., "Executing: read, write", "Handling error...") */
  progressEstimate: string | null;
  
  /** List of tools/skills used in the session (deduplicated and sorted) */
  skillsUsed: string[];
  
  /** ISO 8601 timestamp when the task started */
  startTime: string | null;
  
  /** Total number of messages (both user and assistant) in the session */
  messageCount: number;
  
  /** ISO 8601 timestamp of the most recent event */
  lastUpdated: string | null;
  
  /** Total number of entries parsed from the JSONL file */
  entryCount: number;
  
  /** Error message if parsing failed; null if successful */
  error: string | null;
}
```

## Status Values

- **working** - Agent is actively processing (last activity within 90 seconds)
- **idle** - Agent is not processing but was active recently (last activity 90s - 30m ago)
- **blocked** - Agent encountered an error or was aborted
- **offline** - Agent has had no activity for more than 30 minutes

## How It Works

### 1. Session File Location

The endpoint derives the session file path from the agent ID:
- Input: `agent%3Amain%3Asubagent%3A061299d1-169c-433e-8d84-b075a25412e0`
- Decoded: `agent:main:subagent:061299d1-169c-433e-8d84-b075a25412e0`
- Extracted sessionId: `061299d1-169c-433e-8d84-b075a25412e0`
- File path: `C:\Users\abuck\.openclaw\agents\main\sessions\061299d1-169c-433e-8d84-b075a25412e0.jsonl`

### 2. JSONL Parsing

The session file is a JSONL (JSON Lines) format where each line is a valid JSON object representing a session event:

```jsonl
{"type":"session","id":"...","timestamp":"2026-03-21T16:41:32.925Z"}
{"type":"model_change","timestamp":"..."}
{"type":"message","message":{"role":"user","content":[...]}}
{"type":"message","message":{"role":"assistant","content":[{"type":"toolCall","name":"read"}]}}
```

### 3. Data Extraction

The endpoint extracts:

- **currentTask**: The text content of the most recent user message (limited to 500 chars)
- **startTime**: Timestamp of the session header (or first user message)
- **skillsUsed**: All unique tool names found in assistant messages and tool result entries
- **progressEstimate**: Inferred from recent entries (tool calls, error messages)
- **messageCount**: Total count of entries with `type === "message"`
- **lastUpdated**: Timestamp of the most recent entry
- **status**: Derived from `lastUpdated` timestamp and any error state

### 4. Error Handling

- **File not found**: Returns status "offline" with error message
- **Parse errors**: Skips malformed lines but continues parsing
- **Unexpected errors**: Returns status "blocked" with error details
- All errors are captured in the `error` field (non-null indicates a problem)

## Examples

### Request

```bash
curl -X GET "http://localhost:3000/api/agents/agent%3Amain%3Asubagent%3A061299d1-169c-433e-8d84-b075a25412e0/activity"
```

### Success Response

```json
{
  "currentTask": "Create API endpoint `/api/agents/{id}/activity` that reads and parses OpenClaw session files to extract live subagent activity.",
  "status": "working",
  "progressEstimate": "Executing: read, write, exec",
  "skillsUsed": ["exec", "read", "write"],
  "startTime": "2026-03-21T16:41:32.925Z",
  "messageCount": 12,
  "lastUpdated": "2026-03-21T16:42:15.123Z",
  "entryCount": 45,
  "error": null
}
```

### File Not Found Response

```json
{
  "currentTask": null,
  "status": "offline",
  "progressEstimate": null,
  "skillsUsed": [],
  "startTime": null,
  "messageCount": 0,
  "lastUpdated": null,
  "entryCount": 0,
  "error": "Failed to read session file: ENOENT: no such file or directory, open 'C:\\Users\\abuck\\.openclaw\\agents\\main\\sessions\\invalid-id.jsonl'"
}
```

## Integration with Mission Control UI

This endpoint powers real-time agent monitoring in the dashboard:

```typescript
// Example usage in React
const [activity, setActivity] = useState<SubagentActivityRecord | null>(null);

useEffect(() => {
  const fetchActivity = async () => {
    const encodedId = encodeURIComponent(agentSessionKey);
    const res = await fetch(`/api/agents/${encodedId}/activity`);
    const data = await res.json();
    setActivity(data);
  };

  const interval = setInterval(fetchActivity, 2000); // Poll every 2s
  return () => clearInterval(interval);
}, [agentSessionKey]);

// Render activity
{activity && (
  <div>
    <h3>Current Task</h3>
    <p>{activity.currentTask || "No task"}</p>
    
    <h3>Status</h3>
    <StatusBadge status={activity.status} />
    
    <h3>Progress</h3>
    <p>{activity.progressEstimate || "Idle"}</p>
    
    <h3>Skills Used</h3>
    <SkillList skills={activity.skillsUsed} />
    
    <h3>Timing</h3>
    <p>Started: {new Date(activity.startTime).toLocaleString()}</p>
    <p>Last update: {new Date(activity.lastUpdated).toLocaleString()}</p>
    <p>Messages: {activity.messageCount}</p>
  </div>
)}
```

## Performance Considerations

- **File I/O**: Reads the entire session file into memory. Large sessions (>10k lines) may take a few seconds
- **Parsing**: Single-pass JSONL parsing with error recovery
- **Caching**: Recommended to cache results for 1-2 seconds in the UI
- **Polling**: Clients should poll at 2-5 second intervals (not sub-second)

## Related Endpoints

- `GET /api/agents/{id}/logs` - Get detailed message logs
- `GET /api/agents/{id}/status` - Get session status and token usage
- `GET /api/agents` - List all agents and their basic status

## Implementation Notes

- **TypeScript**: Fully typed with `SubagentActivityRecord` interface
- **Error Recovery**: Handles malformed JSONL lines gracefully
- **Time Handling**: Uses ISO 8601 format throughout
- **Deduplication**: Skills are deduplicated and sorted alphabetically
- **Production-Ready**: Includes comprehensive error handling and logging

## Troubleshooting

### No sessionFile path in /api/agents response

If an agent doesn't have a `sessionFile` field in the agents list, it may be a legacy session. Try using the sessionId directly.

### Empty skillsUsed array

The agent hasn't executed any tools yet, or the session is very new.

### error field is non-null

Check the error message for details:
- "ENOENT" = session file not found (agent may have been deleted)
- "Invalid model identifier" = LM Studio model not loaded
- Other parse errors = corrupted JSONL file (rare)
