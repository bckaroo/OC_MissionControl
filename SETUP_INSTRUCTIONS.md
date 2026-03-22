# Models & Agents Dashboard - Setup Instructions

## Quick Start (5 minutes)

### 1. Copy Files to Mission Control

The following files have been created for you:

**Components:**
- `components/ModelsAndAgentsScreen.tsx` - React component for the dashboard

**Backend APIs:**
- `app/api/models/status/route.ts` - Health status endpoint
- `app/api/models/usage/route.ts` - Token usage endpoint  
- `app/api/models/limits/route.ts` - API quota endpoint

**Libraries:**
- `lib/modelTracking.ts` - Types and utilities

**Data Files:**
- `data/models-status.json` - Model health snapshots
- `data/models-usage.json` - Token usage history

**Monitoring Scripts:**
- `scripts/monitor-models.ps1` - PowerShell monitor (Windows)
- `scripts/monitor-models.ts` - TypeScript monitor (Node.js)

**Documentation:**
- `MODELS_DASHBOARD.md` - Full documentation
- `SETUP_INSTRUCTIONS.md` - This file

### 2. Add Component to Navigation

Edit `app/page.tsx` or your main page component:

```tsx
import ModelsAndAgentsScreen from '@/components/ModelsAndAgentsScreen';

// In your screen/nav selector, add:
case 'models':
  return <ModelsAndAgentsScreen />;

// In your navigation menu, add:
<button onClick={() => setScreen('models')}>
  📊 Models & Agents
</button>
```

### 3. Start Monitoring

**Windows (Recommended):**
```powershell
cd mission-control/scripts
.\monitor-models.ps1
```

**Node.js:**
```bash
cd mission-control
npx ts-node scripts/monitor-models.ts
```

### 4. Open Dashboard

Visit your Mission Control app and click "Models & Agents" to see:
- ✅ Health status of all models
- 📊 Token usage by model
- ⚠️ API limit warnings

## What Each File Does

### Frontend
**ModelsAndAgentsScreen.tsx** - Main React component with 3 tabs:
- **Overview**: Model specs, health status, response times
- **Usage**: Token consumption, costs, usage breakdown
- **Limits**: Daily quotas, percentage used, restoration time

Auto-refreshes every 30 seconds.

### Backend APIs
**status/route.ts**
- GET: Returns health of all models + summary
- Updates every 5 minutes from monitoring script
- Shows: healthy/degraded/broken count

**usage/route.ts**
- GET: Returns token usage by model + daily breakdown
- POST: Log new token usage (`modelId`, `inputTokens`, `outputTokens`)
- Calculates estimated cost automatically

**limits/route.ts**
- GET: Returns API quota status for each model
- Shows: % of daily limit used, time to restore if limit hit
- Alerts: 🟡 warning at 70%, 🔴 critical at 80%+

### Data Storage
**models-status.json**
```json
{
  "lastUpdated": <timestamp>,
  "status": {
    "model-id": {
      "status": "healthy|degraded|broken",
      "responseTimeMs": <number>,
      "requestsSucceeded": <count>,
      "requestsFailed": <count>,
      "errorMessage": "<message>"
    }
  }
}
```

**models-usage.json**
```json
{
  "lastUpdated": <timestamp>,
  "usage": {
    "model-id": {
      "totalTokensUsed": <count>,
      "inputTokens": <count>,
      "outputTokens": <count>,
      "estimatedCost": <$>,
      "timesUsed": <count>
    }
  },
  "byDay": [
    { "date": "2026-03-21", "usage": { "model-id": <tokens> } }
  ]
}
```

### Monitoring Scripts

**monitor-models.ps1** (PowerShell, Windows)
- Runs every 5 minutes
- Pings Ollama/LMStudio on localhost
- Updates `models-status.json`
- Alerts to console if model breaks or usage approaches limit
- Can be scheduled with Windows Task Scheduler

**monitor-models.ts** (TypeScript, Any OS)
- Same functionality as PowerShell version
- Requires: `npx ts-node`
- Run with: `npx ts-node scripts/monitor-models.ts`

## How It Works

```
┌─────────────────────┐
│ Monitoring Script   │ ◄── Runs every 5 minutes
│ (PS1 or TS)         │
└──────────┬──────────┘
           │
           ├─► Ping models (Ollama, LMStudio)
           ├─► Check response times
           └─► Update models-status.json
                        │
                        ▼
           ┌──────────────────────┐
           │ Data Files (JSON)    │
           │ - models-status.json │
           │ - models-usage.json  │
           └──────────┬───────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
    ┌────────┐  ┌────────┐  ┌─────────┐
    │ status │  │ usage  │  │ limits  │
    │ API    │  │ API    │  │ API     │
    └────┬───┘  └────┬───┘  └────┬────┘
         │           │           │
         └───────────┼───────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │ React Component          │
        │ ModelsAndAgentsScreen    │
        │                          │
        │ ✅ Overview Tab          │
        │ 📊 Usage Tab             │
        │ ⚠️ Limits Tab            │
        └──────────────────────────┘
```

## Configuration

### Change Monitoring Interval
Edit `monitor-models.ps1` or `monitor-models.ts`:
```powershell
# Change this line:
Start-Sleep -Seconds 300  # 5 minutes to any value
```

### Add More Models
Edit `lib/modelTracking.ts` - add to `MODEL_SPECS`:
```typescript
'new-model-id': {
  name: 'Model Name',
  provider: 'Provider',
  params: '30B',
  cost: { input: 0.01, output: 0.05 },
  ...
}
```

### Change API Limits
Edit `monitor-models.ps1` or `monitor-models.ts`:
```powershell
$apiLimits = @{
    "model-id" = 10000000  # tokens per day
}
```

## Troubleshooting

### Models Not Pinging
1. Check if Ollama/LMStudio is running
2. Verify URLs: `http://127.0.0.1:11434` (Ollama) or `11435` (LMStudio)
3. Test manually: `curl http://127.0.0.1:11434/api/tags`

### Dashboard Shows "No Data"
1. Ensure monitoring script is running
2. Check `data/models-status.json` and `data/models-usage.json` exist
3. Restart the dashboard page

### High Memory Usage
1. Monitoring script runs every 5 minutes - this is normal
2. If CPU is high, check if other processes are consuming Ollama
3. Consider reducing frequency (change 300s to 600s)

### "Permission Denied" on Scripts
Windows PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Next Steps

### 1. Start Monitoring
```powershell
.\scripts\monitor-models.ps1
```

### 2. Log Token Usage
When your app uses a model, POST to `/api/models/usage`:
```typescript
fetch('/api/models/usage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    modelId: 'ollama/qwen2.5:7b',
    inputTokens: 500,
    outputTokens: 250
  })
});
```

### 3. Schedule Monitoring (Windows)
```powershell
# Create scheduled task to run on startup
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-File `"C:\path\to\scripts\monitor-models.ps1`""
$trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -Action $action -Trigger $trigger `
  -TaskName "MissionControl-ModelMonitor"
```

### 4. Add to Navigation
Update your main page to include Models & Agents tab

## Features Included

✅ Real-time model health monitoring  
✅ Token usage tracking  
✅ Cost estimation  
✅ API limit warnings  
✅ Status indicators  
✅ Response time tracking  
✅ Automatic refreshing (30s)  
✅ Historical usage data  
✅ Daily breakdown  
✅ PowerShell + TypeScript monitoring  

## What's NOT Included (Future Work)

- [ ] Charts/graphs for trending
- [ ] Agent-specific tracking
- [ ] Slack/Discord notifications
- [ ] Cost budgeting and alerts
- [ ] Automatic model fallbacks
- [ ] Database integration
- [ ] Multi-user tenancy

## Support

See `MODELS_DASHBOARD.md` for:
- Full API documentation
- Data file formats
- Extension guide
- Architecture details
- Troubleshooting tips
