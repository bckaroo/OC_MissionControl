# Mode Switcher Dashboard Feature

**Feature Name:** OpenClaw Mode Switcher  
**Status:** Ready for Dashboard Integration  
**Created:** 2026-03-21  
**Author:** XiaoZhu  

## Overview

Allows users to switch OpenClaw between **Standard** (all-local) and **High Performance** (API + local) operational modes from a dashboard interface.

## Modes

### STANDARD (All Local)
```json
{
  "mode": "standard",
  "chief": "lmstudio/qwen/qwen3.5-9b",
  "cost": "$0/month",
  "latency": "500-2000ms",
  "bestFor": "Cost control, offline operation, sustainable long-term use"
}
```

**Characteristics:**
- ✅ Zero API costs
- ✅ No rate limits
- ✅ Fully local, offline capable
- ⚠️ Lower reasoning quality
- ⚠️ Smaller context windows

### HIGH PERFORMANCE (API + Local)
```json
{
  "mode": "high",
  "chief": "claude-haiku-5.4",
  "fallback": "lmstudio/qwen/qwen3.5-9b",
  "cost": "$0.50-2.00/month",
  "latency": "200-1000ms",
  "bestFor": "Quality-critical work, complex reasoning, time-sensitive tasks"
}
```

**Characteristics:**
- ✅ Better quality responses
- ✅ Faster reasoning
- ✅ Larger context windows
- ⚠️ Uses API tokens
- ⚠️ Subject to rate limits

## Dashboard Features

### 1. Mode Status Display
```
┌─────────────────────────────────────┐
│ OpenClaw Mode Status                │
├─────────────────────────────────────┤
│ Current Mode: HIGH                  │
│ Chief Model: claude-haiku-5.4       │
│ Cost/Month: ~$0.50-2.00             │
│ Last Set: 2026-03-21 17:28:43       │
└─────────────────────────────────────┘
```

### 2. Mode Selector (Buttons/Toggle)
```
[STANDARD] | [HIGH PERFORMANCE]
  (all-local)  (API + local)
```

Click to instantly switch modes.

### 3. Token Usage Indicator
```
API Token Usage: 45% Remaining
├──────────────────────│         
Critical (< 5%) | Safe Zone | Abundant (> 20%)
     RED         |  YELLOW   |     GREEN
```

- Green (>20%): Switch to HIGH mode
- Yellow (5-20%): Current mode OK
- Red (<5%): Switch to STANDARD

### 4. Cost Analyzer
```
Monthly Cost Estimate:
├ STANDARD: $0.00
├ HIGH:     $0.75 (estimated)
└ HYBRID:   $0.15 (80% STANDARD, 20% HIGH)
```

### 5. Auto-Switch History
```
Timestamp            | From       | To    | Tokens
─────────────────────┼────────────┼───────┼─────────
2026-03-21 15:30:00  | STANDARD   | HIGH  | 45%
2026-03-21 10:00:00  | HIGH       | STANDARD | 3%
2026-03-21 08:15:00  | STANDARD   | HIGH  | 25%
```

### 6. Model Comparison Table
```
│ Feature        │ STANDARD         │ HIGH              │
├────────────────┼──────────────────┼───────────────────┤
│ Chief Model    │ Qwen 3.5 (local) │ Haiku (API)       │
│ Fallback       │ None             │ Qwen 3.5 (local)  │
│ Cost/Month     │ $0               │ ~$0.50-2.00       │
│ Latency        │ 500-2000ms       │ 200-1000ms        │
│ Context Window │ 32K              │ 200K (Haiku)      │
│ Offline?       │ Yes              │ No                │
```

## API Endpoints

### Get Current Mode
```
GET /api/openclaw/mode/status
Response:
{
  "mode": "high",
  "chief": "claude-haiku-5.4",
  "costPerMonth": "0.75",
  "lastSetAt": "2026-03-21T17:28:43Z",
  "tokenUsagePercent": 45
}
```

### Switch Mode
```
POST /api/openclaw/mode/switch
Body:
{
  "targetMode": "standard" | "high"
}
Response:
{
  "success": true,
  "message": "Switched to STANDARD mode",
  "newModel": "lmstudio/qwen/qwen3.5-9b",
  "timestamp": "2026-03-21T17:34:03Z"
}
```

### Get Token Usage
```
GET /api/openclaw/tokens
Response:
{
  "percentageRemaining": 45,
  "threshold_high": 20,
  "threshold_low": 5,
  "status": "safe",
  "estimatedExhaustionDate": "2026-03-25"
}
```

### Get Mode History
```
GET /api/openclaw/mode/history?limit=10
Response:
[
  {
    "timestamp": "2026-03-21T15:30:00Z",
    "from": "STANDARD",
    "to": "HIGH",
    "reason": "automatic_token_monitoring",
    "tokenPercent": 45
  },
  ...
]
```

## Integration Points

### Backend
- Read from: `openclaw.json` config
- Execute: `scripts/mode-switcher.ps1`
- Monitor: Heartbeat automation logs
- Write to: Config updates, memory logs

### Frontend
- Display: Current mode + token usage
- Controls: Mode toggle buttons
- Charts: Token usage history
- Alerts: Mode switch notifications

## Implementation Checklist

- [ ] Create MissionControl API endpoints (`/api/openclaw/mode/*`)
- [ ] Build mode status card component
- [ ] Build mode selector (toggle/buttons)
- [ ] Add token usage indicator (progress bar with thresholds)
- [ ] Create cost analyzer widget
- [ ] Build auto-switch history table
- [ ] Add real-time token monitoring
- [ ] Create alerts for critical token levels
- [ ] Wire up to backend scripts
- [ ] Test mode switching via dashboard
- [ ] Add user notifications on mode change
- [ ] Create documentation for end users

## Files & Scripts

**Core Scripts:**
- `scripts/mode-switcher.ps1` — Manual mode switching
- `scripts/check-tokens-and-switch.ps1` — Token monitoring & auto-switch

**Configuration:**
- `openclaw.json` — Gateway config (modes defined here)
- `AGENT-MODES.md` — Full documentation
- `MODE-SWITCHING-GUIDE.md` — User guide

**Skill:**
- `.agents/skills/openclaw-mode-switcher/` — Complete skill package

## Usage Examples

**User switches to STANDARD for cost control:**
1. Dashboard shows token usage at 8%
2. User clicks "STANDARD" button
3. Mode changes immediately
4. Dashboard refreshes to show new config
5. All new requests use Qwen 3.5 (local)

**Auto-switch during token exhaustion:**
1. Heartbeat detects tokens at 3% (< 5% threshold)
2. Auto-switcher triggers
3. Mode changes to STANDARD automatically
4. Dashboard notifies user
5. History log updated

## Testing Checklist

- [ ] Manual mode switch via dashboard (STANDARD ↔ HIGH)
- [ ] Token display updates correctly
- [ ] Cost estimation recalculates
- [ ] History log populates
- [ ] Auto-switch triggers at 5% threshold
- [ ] Auto-switch triggers at 20% threshold
- [ ] Alerts fire on critical events
- [ ] Config updates in `openclaw.json`
- [ ] Gateway restarts cleanly
- [ ] Fallback model kicks in if Haiku unavailable

## Metrics to Track

- Current mode
- Time in each mode (weekly/monthly)
- Token usage trajectory
- Estimated monthly cost
- Mode switch frequency
- Auto-switch vs manual switch ratio
- Fallback model usage count
- Average latency per mode

## Future Enhancements

- [ ] Custom threshold settings (adjust 5% / 20%)
- [ ] Cost prediction based on usage trends
- [ ] Per-channel mode overrides
- [ ] Mode scheduling (e.g., HIGH 9-5, STANDARD nights)
- [ ] Integration with billing dashboard
- [ ] Specialist model selector
- [ ] Performance metrics per mode
- [ ] A/B testing different configurations

---

**Status:** Ready for MissionControl integration 🚀
