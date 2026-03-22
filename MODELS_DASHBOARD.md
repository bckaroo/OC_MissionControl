# Models & Agents Dashboard

## Overview

The Models & Agents dashboard provides real-time tracking of:
- **Model Health**: Status indicators for all deployed models (healthy, degraded, broken)
- **Token Usage**: Real-time consumption tracking by model with cost estimates
- **API Limits**: Daily token quota monitoring and restoration time estimates
- **Agent Mappings**: Which agents are using which models

## Features

### 1. **Real-Time Health Monitoring**
- Continuous health checks via monitoring script
- Response time tracking
- Error message logging
- Success/failure counters
- Status indicators: ✅ Healthy | ⚠️ Degraded | ❌ Broken

### 2. **Token Usage Tracking**
- Input/output token counts per model
- Cost calculation based on API pricing
- Usage history by day
- Breakdown by agent
- Total cost aggregation

### 3. **API Limit Management**
- Daily quota monitoring
- Percentage utilization alerts
- Time-to-restore calculation (if limit hit)
- Per-minute and per-day limits
- Warning levels: 🟢 OK (0-70%) | 🟡 Warning (70-80%) | 🔴 Critical (80%+)

### 4. **Model Specifications**
Display of:
- Model size (parameters)
- Context window
- Cost per 1M tokens (input/output)
- Response time
- Provider (Ollama, LMStudio, Anthropic)
- Local vs. cloud

## Architecture

```
dashboard/
├── Frontend (ModelsAndAgentsScreen.tsx)
│   ├── Overview Tab: Model status cards
│   ├── Usage Tab: Token consumption charts
│   └── Limits Tab: API quota monitoring
├── Backend APIs
│   ├── /api/models/status - Health status
│   ├── /api/models/usage - Token usage
│   └── /api/models/limits - API quotas
├── Data Storage
│   ├── data/models-status.json - Health checks
│   ├── data/models-usage.json - Usage history
│   └── data/agent-model-mappings.json - Agent assignments
└── Monitoring Scripts
    ├── scripts/monitor-models.ts - Node.js monitor
    └── scripts/monitor-models.ps1 - PowerShell monitor
```

## Setup & Configuration

### 1. **Install Dependencies**
The dashboard uses existing Mission Control dependencies:
- React 19
- Tailwind CSS 4
- Lucide React (icons)
- Next.js 16

No additional packages required.

### 2. **Start Monitoring**

#### Option A: Run TypeScript Monitor (Node.js)
```bash
cd mission-control
npx ts-node scripts/monitor-models.ts
```

#### Option B: Run PowerShell Monitor (Windows)
```powershell
cd mission-control/scripts
.\monitor-models.ps1
```

#### Option C: Schedule with Windows Task Scheduler
```powershell
# Run as Administrator
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"C:\path\to\scripts\monitor-models.ps1`""

$trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "MissionControl-ModelMonitor" `
    -Description "Monitor model health and token usage"
```

### 3. **Access Dashboard**

Add to Mission Control sidebar by importing the component in `app/page.tsx`:

```tsx
import ModelsAndAgentsScreen from '@/components/ModelsAndAgentsScreen';

// In your screen selector:
case 'models':
  return <ModelsAndAgentsScreen />;
```

## Data Files

### models-status.json
Tracks health of all models:
```json
{
  "lastUpdated": 1774095600000,
  "status": {
    "ollama/qwen2.5:7b": {
      "modelId": "ollama/qwen2.5:7b",
      "status": "healthy",
      "lastHealthCheck": 1774095600000,
      "responseTimeMs": 11200,
      "requestsSucceeded": 456,
      "requestsFailed": 2
    }
  }
}
```

### models-usage.json
Tracks token consumption and costs:
```json
{
  "lastUpdated": 1774095600000,
  "usage": {
    "anthropic/claude-sonnet-4-6": {
      "modelId": "anthropic/claude-sonnet-4-6",
      "totalTokensUsed": 12450,
      "inputTokens": 8200,
      "outputTokens": 4250,
      "estimatedCost": 67.35,
      "lastUpdated": 1774095600000,
      "timesUsed": 23
    }
  },
  "byDay": [
    {
      "date": "2026-03-21",
      "usage": { "anthropic/claude-sonnet-4-6": 4450 }
    }
  ]
}
```

## API Endpoints

### GET /api/models/status
Returns current health status of all models.
```json
{
  "lastUpdated": 1774095600000,
  "status": { /* model statuses */ },
  "summary": { "healthy": 5, "degraded": 1, "broken": 1 }
}
```

### GET /api/models/usage
Returns token usage statistics.
```json
{
  "lastUpdated": 1774095600000,
  "usage": { /* usage by model */ },
  "summary": {
    "totalTokensUsed": 345230,
    "totalEstimatedCost": 139.67,
    "modelsTracked": 5
  },
  "byDay": [ /* historical usage */ ]
}
```

### POST /api/models/usage
Log new token usage.
```json
{
  "modelId": "anthropic/claude-sonnet-4-6",
  "inputTokens": 500,
  "outputTokens": 250
}
```

### GET /api/models/limits
Returns API quota status.
```json
{
  "lastUpdated": 1774095600000,
  "limits": [
    {
      "modelId": "anthropic/claude-sonnet-4-6",
      "provider": "Anthropic",
      "limitTokensPer1Min": 40000,
      "limitTokensPer1Day": 8000000,
      "currentUsage1Day": 12450,
      "percentageUsed1Day": 0.16,
      "warningLevel": "ok"
    }
  ]
}
```

## Monitoring Script Details

The monitoring script (`monitor-models.ps1` or `monitor-models.ts`):

1. **Runs Every 5 Minutes** by default (configurable)
2. **Pings Each Model**:
   - Ollama: `GET /api/tags`
   - LMStudio: `GET /v1/models`
   - Anthropic: Skipped (requires auth key)
3. **Logs Health Status**:
   - Response time
   - Success/failure counts
   - Error messages
4. **Analyzes Usage**:
   - Calculates percentage of daily limits used
   - Alerts if approaching 70%+ of limit
   - Logs total tokens and cost
5. **Updates Data Files**:
   - `models-status.json` with current health
   - Tracks historical trends

## Alert Thresholds

| Threshold | Alert Level | Action |
|-----------|------------|--------|
| Status = "broken" | 🔴 Critical | Immediately notify |
| Response time > 30s | 🟡 Warning | Log and monitor |
| Daily usage > 70% | 🟡 Warning | Alert user |
| Daily usage > 80% | 🔴 Critical | Prevent new requests |
| Daily usage = 100% | 🔴 Blocked | Wait for restoration |

## Extending the Dashboard

### Add New Model
1. Update `MODEL_SPECS` in `lib/modelTracking.ts`
2. Add to `modelSpecs` in monitoring script
3. Add API limit (if cloud model) to `API_LIMITS`

### Add Agent Tracking
1. Create `data/agent-model-mappings.json`
2. Update POST `/api/models/usage` to track agent ID
3. Create new API endpoint `/api/agents/model-usage`

### Add Historical Charts
1. Use existing `byDay` data from `models-usage.json`
2. Install chart library (e.g., `recharts`)
3. Create `HistoryChart.tsx` component

## Troubleshooting

### Models Showing "Broken"
1. Check if the service is running:
   - Ollama: `ollama list`
   - LMStudio: Check running processes
2. Verify URLs in monitoring script match actual listening ports
3. Check firewall settings

### No Usage Data
1. Ensure POST requests to `/api/models/usage` are being made
2. Check `data/models-usage.json` exists and is writable
3. Verify token counts are being passed in API calls

### Data Files Not Updating
1. Check file permissions on `data/` directory
2. Ensure monitoring script is running (`tasklist | grep monitor`)
3. Check browser console for API errors

## Future Enhancements

- [ ] Real-time charts using Recharts
- [ ] Agent-specific token tracking
- [ ] Cost alerts and budgeting
- [ ] Model performance trending
- [ ] Webhook notifications (Slack/Discord)
- [ ] Daily report generation
- [ ] Cost forecasting
- [ ] Automatic model fallback triggers
