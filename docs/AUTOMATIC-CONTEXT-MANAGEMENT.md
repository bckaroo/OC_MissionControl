# Automatic Context Management
**Keeping Sessions Under 80% to Maintain Performance**  
*Designed: 2026-03-22 05:59 EDT*

---

## 🎯 The Goal

**Never exceed 80% context window** to maintain:
- Fast response times (100-150ms)
- Plenty of headroom for new messages
- Automatic escalation before hitting limits

```
Context Window: 32K (Chief)

0%     ●────────────────────────────────────── 100%
       │                                       │
      Safe                                   Limit
      
       ●────────────────────────────────────── 
0%    5K              16K (50%)       25K (80%)  32K (100%)

Target: Stay below 25K
Warning: Above 25K
Critical: Above 28K
```

---

## 🔍 Automatic Context Monitoring

### Option 1: Built-in Session Checks (RECOMMENDED)

Add to Chief's system prompt:

```
CONTEXT MANAGEMENT RULES:

Before each response, check:
1. Current context usage: ~[context_tokens]
2. If context > 25K (80%):
   ├─ User ongoing? 
   │  └─ YES: Escalate to xiaoshe 🐍 (262K context)
   │         "This project is growing. xiaoshe will handle large analysis."
   │  
   │  └─ NO: Reset context
   │         "Clearing context for efficiency. [Brief summary]."
   │         Context → ~5K (fresh)
   │
   └─ If context 22-25K (70-80%):
      └─ WARN user: "Project getting large. May escalate soon if grows."

3. If context > 28K:
   └─ IMMEDIATE escalation to xiaoshe (don't wait for user approval)
      "Context limit approaching. xiaoshe taking over."
```

**Pros:**
- ✅ Automatic (no manual trigger needed)
- ✅ Proactive (acts before hitting limit)
- ✅ Transparent (warns user when escalating)
- ✅ Smart (escalates OR resets based on situation)

**Implementation:**
```
Add to CHIEF-SYSTEM-PROMPT.md, CONTEXT MANAGEMENT section
```

---

### Option 2: Cron Job (Automated Monitoring)

```
Schedule: Every 2 hours
Action:
1. List all active sessions (openclaw sessions list)
2. Check context for each
3. If any > 25K:
   ├─ Send message to session: "Context high, escalating work"
   ├─ Trigger escalation (or reset)
   └─ Log action
4. If any > 28K:
   ├─ Kill session (emergency)
   ├─ Notify user
   └─ Suggest new thread
```

**Implementation:**
```bash
# File: .openclaw/scripts/context-monitor.ps1

$sessions = openclaw sessions list --json
foreach ($session in $sessions) {
  if ($session.context > 25000) {
    # Escalate or reset
    sessions_send -sessionKey $session.key -message "Escalating due to context usage"
  }
}
```

**Pros:**
- ✅ Independent (doesn't rely on Chief responding)
- ✅ Consistent (runs on schedule)
- ✅ Quantifiable (exact metrics)

**Cons:**
- ❌ Requires cron setup
- ❌ Less intelligent (just numbers)

---

## 💡 Smart Escalation Logic

### When Context Reaches Thresholds

```
CONTEXT LEVEL          CHIEF'S ACTION
─────────────────────────────────────────────────────────

0-15K (0-47%)         Continue normally
                      "All good, carrying on"

15-20K (47-63%)       Monitor closely
                      (No action, but aware)

20-25K (63-80%)       WARN user
                      "Project growing large. 
                       May escalate if it keeps expanding."

25-28K (80-88%)       ESCALATE to xiaoshe
                      "Context growing too fast. 
                       xiaoshe (262K) will handle analysis."

28K+ (88%+)           RESET or MOVE
                      "Context limit reached.
                       Moving to new thread / resetting context."
```

---

## 🔄 Context Reset Patterns

### Pattern 1: Mid-Project Reset (Keep Working)

**When:** Context > 25K, project not complete  
**Who:** Chief  
**Action:**

```
Chief: "Taking a moment to clear context for efficiency."

[Context Reset]
Keep only:
- Current project scope
- Active task list
- User decisions so far
- Specialist results (summarized)

Clear:
- Old planning steps
- Completed tasks
- Historical discussion

New context: ~8K tokens
Result: Plenty of room for next phase
```

**Implementation in prompt:**
```
If context > 25K and project ongoing:
  Output: "[Clearing context for next phase. Project status: {summary}]"
  Then continue with fresh context
```

---

### Pattern 2: Project Completion Reset

**When:** Context > 20K, project near complete  
**Who:** Chief  
**Action:**

```
Chief: "Project delivered. Context cleared for next one."

[Full Reset]
Output: "Ready for next project. What's needed?"
Context: ~5K
```

**No escalation needed** (project is done)

---

### Pattern 3: Escalation (Huge Project)

**When:** Context > 25K AND project >4 hours old  
**Who:** Chief  
**Action:**

```
Chief: "xiaoshe 🐍, this project is massive. Taking over."

Dispatch to xiaoshe:
- Full project context
- Remaining analysis needed
- Scope: Entire project

xiaoshe (262K context) handles:
- Large document analysis
- Cross-module synthesis
- Future work

Chief: Awaits xiaoshe's result
```

**No reset needed** (escalation handles it)

---

## 📊 Context Budget Model

### Typical Project Timeline

```
PHASE 1: PLANNING (5-10 min)
├─ Context: 2K (questions + approach + plan)
├─ Activities: Clarify, design, present
└─ Decision point: User approves

PHASE 2: EXECUTION (30-120 min)
├─ Context: 15-20K (results from specialists)
├─ Activities: Dispatch, wait, assemble draft
└─ Decision point: User reviews draft

DECISION POINT (After Phase 2):
├─ SCENARIO A: Project complete
│  └─ Reset → Start new project (context 0K)
│
└─ SCENARIO B: Need multiple phases
   ├─ Context: 22K (high, but manageable)
   ├─ Option 1: Reset context with summary
   │           Continue phase 3 with fresh context
   │  
   └─ Option 2: Escalate to xiaoshe (262K available)
                Let xiaoshe handle complexity
```

---

## 🚨 Emergency Safeguards

### Circuit Breaker: Hard Stop at 90%+

```
If context > 28K:
  ├─ NO escalation warnings
  ├─ Immediately stop accepting work
  ├─ Output: "Context limit reached. 
              Ending session. Start new thread for continuation."
  ├─ Kill session
  └─ Log incident
```

**Prevention:** Rarely triggered (50% threshold warnings should catch it)

---

## 🔧 Implementation Options

### Option A: Chief Self-Manages (Recommended for Simple)

**Add to system prompt:**
```
## AUTO-CONTEXT-MANAGEMENT

Before every response, evaluate context:
1. Request openclaw status (get current context)
2. If context_percent > 75:
   - Warn user (if not warned yet)
3. If context_percent > 85:
   - Escalate to xiaoshe OR reset context
4. If context_percent > 95:
   - Emergency: Kill session, start over

Cost: None (Chief does this natively)
Complexity: Low
```

---

### Option B: Heartbeat Monitor (Recommended for Robustness)

**Create cron job:**
```yaml
# heartbeat-context-monitor.yaml

Schedule:
  kind: "every"
  everyMs: 300000  # Every 5 min

Payload:
  kind: "agentTurn"
  message: "
    Check context usage across all sessions.
    If any > 25K, escalate or reset.
    Report findings.
  "
  model: "lmstudio/qwen/qwen3.5-9b"
```

**Runs:** Every 5 minutes  
**Benefit:** Independent of Chief's state  
**Cost:** ~5% of API/compute time

---

### Option C: Hybrid (Best for Production)

**Chief self-manages** + **Heartbeat catches misses**

```
Flow:
1. Chief monitors context during normal operation
2. If missing a threshold, heartbeat catches it
3. Heartbeat alerts Chief: "Reset context now"
4. Chief performs reset

Safety net: Double-checked
Responsiveness: Immediate
Reliability: High
```

---

## 📈 Metrics & Monitoring

### Dashboard Widget (Mission Control)

```
Session Status → Context Tab
├─ Session Key
├─ Context Usage [████░░░░░░] 45%
├─ Time Running: 1h 23m
├─ Threshold: 25K / 32K (80%)
├─ Status: NORMAL / WARN / CRITICAL
└─ Action: [Escalate] [Reset] [Archive]
```

---

### Weekly Report

```
CONTEXT MANAGEMENT REPORT (Week of Mar 22)

Sessions Created: 12
Sessions Completed: 11
Sessions Archived: 10

Escalations:
- To xiaoshe: 2 (large projects)
- To xiaohu: 0

Context Resets:
- Mid-project: 3
- Post-project: 8
- Emergency: 0

Avg Context Peak: 18K (well below limit)
Max Context Peak: 26K (one project, escalated)

Performance: All sessions < 150ms response time ✅
```

---

## 🎯 Recommended Setup

**For Stability & Simplicity:**

1. **Chief's System Prompt** (Add context-management section)
   - Automatic threshold checks
   - Smart escalation/reset logic
   - Warnings to user

2. **Optional: Cron Heartbeat** (Every 2-4 hours)
   - Monitors all sessions
   - Catches edge cases
   - Reports findings

3. **Manual Weekly Check**
   - `openclaw sessions list`
   - Archive old threads
   - Verify performance

**Result:** Automatic management + human oversight

---

## 📝 Implementation Checklist

### Week 1: Add Context Management to Chief Prompt

- [ ] Update CHIEF-SYSTEM-PROMPT.md with context checks
- [ ] Add thresholds: 25K warn, 28K escalate
- [ ] Test with small project
- [ ] Verify escalation works

### Week 2: Optional Cron Job

- [ ] Create heartbeat-context-monitor.yaml (if desired)
- [ ] Set to run every 2-4 hours
- [ ] Test with intentional high-context session
- [ ] Verify alerts trigger

### Ongoing: Monitor

- [ ] Check weekly report
- [ ] Maintain < 80% peak context
- [ ] Archive completed threads
- [ ] Zero emergency resets

---

## 🚀 Expected Results

**With automatic context management:**

```
BEFORE:
- Context grows uncontrolled: 0K → 32K over 5 hours
- Response time degrades: 100ms → 500ms
- Manual intervention needed
- Risk of session death at 100%

AFTER:
- Context stays healthy: 0K → 25K max, then resets/escalates
- Response time consistent: 100-150ms always
- Fully automatic (no manual trigger)
- Zero risk (safeguards catch everything)
```

---

*Automatic Context Management System*  
*Status: Design Complete, Ready to Implement*  
*Last Updated: 2026-03-22 05:59 EDT*
