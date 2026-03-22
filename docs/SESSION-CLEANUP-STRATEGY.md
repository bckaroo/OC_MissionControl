# Session Cleanup Strategy
**Keeping the System Efficient and Fast**  
*Designed: 2026-03-22 05:58 EDT*

---

## 🎯 The Problem

**Context bloat kills performance:**
- Main session (Chief) starts at 0 tokens
- Grows with every message, plan, result
- After 3+ hours: 25K-32K tokens (near limit)
- Response time: 100ms → 500ms+ (5x slower)

**Solution:** Aggressive session cleanup + context management

---

## 🧹 Cleanup Rules

### Subagents (Automatic)
**Status:** AUTO-CLEARED ✅  
**When:** Immediately after task completes  
**Why:** Ephemeral sessions by design

```
Chief spawns xiaoya
    ↓
xiaoya executes (uses memory)
    ↓
xiaoya returns result
    ↓
xiaoya session DESTROYED (memory freed) ✅
```

**No manual action needed.** Subagents are one-shot.

---

### Main Session (Manual)

**Rule:** One project = One session/thread

#### Option 1: New Thread Per Project (PREFERRED)

```
Project 1: New Discord thread
├─ Chief session opens (fresh, 0 tokens)
├─ Plans project 1
├─ Dispatches to specialists
├─ Delivers result
└─ Thread ends (or archived)

Project 2: New Discord thread
├─ Chief session opens (fresh, 0 tokens)
├─ Plans project 2
├─ Dispatches to specialists
├─ Delivers result
└─ Thread ends (or archived)
```

**Benefits:**
- ✅ Zero context carryover
- ✅ Chief always starts fresh (32K available)
- ✅ Fast (always at 100ms response time)
- ✅ Clean project isolation

**Management:**
```bash
# Old project thread: Archive in Discord
# New project thread: Start fresh

# OpenClaw sessions naturally isolate per thread
# Each thread = different session key
```

#### Option 2: Manual Context Reset (If Needed)

If staying in same thread after project completes:

```
Chief: "Project 1 delivered. Ready for Project 2."

[Chief internally resets context]
- Clears old planning steps
- Clears old results
- Keeps only essential continuity

Chief: Context now ~5K tokens (fresh start)
```

**How to do this:**
```
In system prompt: "Before starting new project, acknowledge context reset."

Chief: "Context cleared. Ready for new project. What's needed?"
```

---

## 📊 Session Lifecycle & Cleanup

### Scenario 1: Small Project (Clean Completion)

```
TIMELINE:
0:00  - Thread created (session spawns)
       - Context: 0 tokens

0:30  - Project complete
       - Context: ~12K tokens (planning + results)

0:31  - User: "Thanks!"
       - Chief: "Done! Ready for next project?"

0:32  - NO MORE MESSAGES
       - Thread archived (or session ends naturally)
       - Session memory freed ✅
```

**Cleanup:** Automatic (Discord thread archival)

---

### Scenario 2: Long-Running Project (Multiple Phases)

```
TIMELINE:
0:00  - Phase 1 starts
       - Context: 5K

1:00  - Phase 1 complete, Phase 2 starts
       - Context: 15K (growing)

2:00  - Phase 2 complete, Phase 3 starts
       - Context: 22K (nearing limit!)

DECISION POINT:
Option A: Reset context before Phase 3
   Chief: "Clearing context for Phase 3..."
   Context → 8K (with phase 3 scope only)
   
Option B: Escalate to xiaoshe
   Chief: "xiaoshe, take over large analysis..."
   xiaoshe (262K) handles remaining work
```

**Cleanup Strategy:** Reset before hitting limit, OR escalate to specialist

---

### Scenario 3: Multiple Projects in Same Channel

```
Channel: #development (all dev projects go here)

Project A: Starts in Thread A-1
├─ Timeline: 0:00 - 1:30
├─ Context peak: 15K
└─ Cleanup: Archive thread A-1 ✅

Project B: Starts in Thread B-1 (new thread)
├─ Timeline: 0:00 - 2:00 (fresh context)
├─ Context peak: 20K
└─ Cleanup: Archive thread B-1 ✅

Project C: Starts in Thread C-1 (new thread)
├─ Timeline: 0:00 - ongoing
├─ Context peak: 25K
└─ Cleanup: Will archive when done ✅
```

**Cleanup:** Each project gets its own thread = automatic isolation ✅

---

## ⚙️ Efficiency Metrics

### Before Cleanup (Single Thread, Accumulating)

```
Time    Project      Context    Response Time
────────────────────────────────────────────
0:00    Project 1    2K         100ms ⚡
1:00    Project 1    8K         120ms ⚡
2:00    Project 1    14K        150ms ✓
3:00    Project 2    22K        300ms ⚠️
4:00    Project 2    28K        450ms 🐌
5:00    Project 3    30K        500ms 🐌
```

**Problem:** Response time degrades 5x over 5 hours

### After Cleanup (Per-Thread Isolation)

```
Time    Project      Context    Response Time
────────────────────────────────────────────
0:00    Project 1    2K         100ms ⚡
1:00    Project 1    8K         120ms ⚡
1:30    [Archive T1]  0K        (session ends)
────────────────────────────────────────────
0:00    Project 2    0K         100ms ⚡
1:00    Project 2    8K         120ms ⚡
2:00    Project 2    14K        150ms ✓
────────────────────────────────────────────
0:00    Project 3    0K         100ms ⚡
1:00    Project 3    8K         120ms ⚡
```

**Benefit:** Consistent 100-150ms response time ✓

---

## 🗂️ Cleanup Checklist

### Per Project Completion

- [ ] Project delivered to user
- [ ] User confirms satisfaction
- [ ] If in separate thread: Archive thread
- [ ] If in main channel: Reset context OR start new thread
- [ ] Clear any temporary notes/drafts

### Manual Session Check (Weekly)

```bash
openclaw sessions list

# Look for:
# - Old sessions still active? (>6 hours)
# - Subagents still running? (should be 0)
# - Context bloat? (>28K)

# Action:
# - Kill old sessions: sessions_send to end them
# - Kill hanging subagents: subagents kill
# - Escalate overloaded sessions
```

### Context Reset (If Needed)

**Trigger:** Context > 28K and more work needed

**Action:**
```
Chief: "Clearing context for efficiency. 
Current project status: [summary].
Ready to continue fresh."

[Context reset to ~5K with only current scope]
```

---

## 🎯 Best Practices

✅ **DO:**
- New thread per project (cleanest)
- Archive completed threads weekly
- Check `openclaw sessions list` monthly
- Escalate overloaded sessions (Chief → xiaohu/xiaoshe)
- Kill subagents that hang >15 min

❌ **DON'T:**
- Let single session run >3 hours (context bloat)
- Keep 50 threads open simultaneously (noise)
- Assume subagents auto-cleanup (they do, but monitor)
- Ignore context warnings (> 28K = act)
- Accumulate old conversations in one thread

---

## 📈 Scaling Cleanup

### Small Scale (1-5 projects/week)

**Strategy:** One thread per project  
**Cleanup:** Archive thread when done  
**Frequency:** Weekly cleanup check  
**Effort:** Minimal (automatic)

### Medium Scale (5-20 projects/week)

**Strategy:** Organize by category (threads/channels)  
**Cleanup:** Archive completed, move stale to archive channel  
**Frequency:** Twice weekly cleanup check  
**Effort:** 5 min per check

### Large Scale (20+ projects/week)

**Strategy:** Project dashboard (track in mission-control)  
**Cleanup:** Automated script to archive old threads  
**Frequency:** Daily cleanup verification  
**Effort:** Cron job to enforce hygiene

---

## 🔧 Automation Ideas

### Option 1: Cron Job (Daily Cleanup)

```
Schedule: Daily at 2 AM EDT
Action: 
- Find sessions >6 hours old
- Archive corresponding threads
- Report to user
```

### Option 2: Dashboard Widget

```
Mission Control → Sessions Tab
- Show active sessions
- Show context usage per session
- One-click archive button
- Automatic warning at 25K context
```

### Option 3: Intelligent Chief Prompt

```
System Prompt Addition:
"If context > 25K and project incomplete, 
automatically suggest:
1. Escalate to xiaoshe, OR
2. Move to new thread, OR
3. Reset context with summary"
```

---

## Summary: Cleanup Strategy

| Component | Cleanup | Frequency | Effort |
|-----------|---------|-----------|--------|
| **Subagents** | Automatic | Per task | 0 (automatic) |
| **Main session** | Per-thread isolation | Per project | Minimal |
| **Old threads** | Archive | Weekly | 1 min |
| **Context checks** | Manual + warnings | Monthly | 2 min |
| **Bloated sessions** | Escalate or reset | On demand | 2 min |

---

## 🚀 Result: Efficiency Maintained

**With this cleanup strategy:**
- ✅ Chief always responds in ~100-150ms (never degraded)
- ✅ Each project gets fresh context (no carryover)
- ✅ No memory leaks (subagents auto-cleared)
- ✅ Scalable (works with 1 project or 100)
- ✅ Low maintenance (mostly automatic)

---

*Session Cleanup Strategy for Chief of Staff System*  
*Status: Documentation Complete*  
*Last Updated: 2026-03-22 05:58 EDT*
