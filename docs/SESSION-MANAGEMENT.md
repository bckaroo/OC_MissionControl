# Session Management for Chief of Staff System
**How Sessions, Subagents, and Specialists Work Together**  
*Designed: 2026-03-22 05:58 EDT*

---

## 🎯 Session Structure

### Main Session (Discord Channel)
```
User submits project in #openclaw
    ↓
Main session: agent:main:discord:channel:1484701184831787008
    ├─ Model: lmstudio/qwen/qwen3.5-9b (YOU as Chief)
    ├─ Context: 32K
    ├─ Role: Planning, routing, coordination
    └─ Persistence: Per-channel (thread-bound)
```

### Specialist Subagents (On-Demand Spawning)
```
Chief needs specialist work
    ↓
Spawn isolated subagent session
    ├─ xiaoya 🦆 (Coding)
    ├─ xiaohu 🐯 (Reasoning)
    ├─ xiaomao 🐱 (Writing)
    ├─ xiaoshe 🐍 (Long Context)
    └─ xiaozhu 🐖 (Vision)

Subagent executes
    ↓
Returns result to Chief
    ↓
Subagent session terminated
```

---

## 📋 Session Types

### 1. Main Session (Persistent)
**What:** Your Discord channel session  
**Duration:** Persistent (user's conversation thread)  
**Model:** Qwen 3.5-9B (Chief)  
**Context:** 32K  
**Scope:** Planning, routing, decision-making  
**Frequency:** Continuous (every user interaction)

**Lifecycle:**
```
User starts conversation
    ↓
Main session opens (or continues if in same thread)
    ↓
Chief listens for project requests
    ↓
Chief plans and routes
    ↓
Chief waits for user feedback
    ↓
(repeats until project complete or conversation ends)
```

**Sessions Command:**
```bash
openclaw sessions list
# Shows: agent:main:discord:channel:1484701184831787008 (active)
```

---

### 2. Specialist Subagents (Ephemeral)
**What:** Task-specific isolated sessions  
**Duration:** ~5 min - 2 hours (task dependent)  
**Models:** Varies per specialist  
**Context:** Varies (32K - 262K)  
**Scope:** Specific domain (coding, reasoning, writing, etc.)  
**Frequency:** On-demand (spawned by Chief)

**Lifecycle:**
```
Chief: "xiaoya, write this code"
    ↓
Spawn subagent: sessions_spawn(
    task: "Write FastAPI endpoint...",
    model: "deepseek-coder",
    mode: "run"
)
    ↓
Subagent executes
    ↓
Returns result to Chief
    ↓
Session ends
```

---

## 🚀 Spawning Specialists

### Pattern 1: Single Specialist

```bash
# Chief spawns xiaoya for coding task
sessions_spawn(
  task: "Implement user registration endpoint in FastAPI with PostgreSQL connection",
  model: "deepseek-coder",
  mode: "run"  # One-shot, not persistent
)

# Wait for result
sessions_yield()

# Use result in assembly
Chief receives: [working code] → integrates into draft
```

### Pattern 2: Parallel Specialists

```bash
# Chief spawns multiple specialists in parallel
sessions_spawn(
  task: "xiaoya: Write user API endpoints",
  model: "deepseek-coder",
  mode: "run"
)

sessions_spawn(
  task: "xiaohu: Analyze security implications of JWT implementation",
  model: "deepseek-r1-8b",
  mode: "run"
)

sessions_spawn(
  task: "xiaomao: Write API documentation for these endpoints",
  model: "qwen3-coder-30b",
  mode: "run"
)

# Wait for all
sessions_yield()

# Results arrive asynchronously
Chief collects all → integrates → presents draft
```

### Pattern 3: Sequential Specialists

```bash
# Chief routes Task 1 → xiaoya
sessions_spawn(
  task: "Build FastAPI scaffold with routes",
  model: "deepseek-coder",
  mode: "run"
)
sessions_yield()

# Get result, then route Task 2 → xiaohu
sessions_spawn(
  task: "Review this code for security issues: [code from xiaoya]",
  model: "deepseek-r1-8b",
  mode: "run"
)
sessions_yield()

# Integrate both results
```

---

## 💡 When to Use Each Session Type

### Use Main Session (Chief)
- Planning and clarification
- Routing decisions
- Assembling results
- Presenting to user
- Waiting for user approval

### Use Subagent Sessions (Specialists)
- Code generation (xiaoya)
- Security analysis (xiaohu)
- Documentation writing (xiaomao)
- Long document analysis (xiaoshe)
- Image analysis (xiaozhu)

**Rule:** Chief does orchestration, specialists do execution.

---

## 📊 Session Lifecycle Example

### Small Project: Todo List API

```
TIME    SESSION              STATUS              ACTIVITY
────────────────────────────────────────────────────────────────

0:00    Main (Chief)         OPEN                User: "Build a todo list API"

0:02    Main (Chief)         ACTIVE              Chief: Ask 5 clarifying questions
                                                User: Answers

0:05    Main (Chief)         ACTIVE              Chief: Propose approach
                                                User: Approves

0:08    Main (Chief)         WAITING_DISPATCH    Chief: Preparing dispatch

0:10    xiaoya (Subagent)    OPEN                Chief spawns xiaoya
        Main (Chief)         WAITING             Chief waits...

0:35    xiaoya (Subagent)    DONE                xiaoya returns: [working code]
        Main (Chief)         ACTIVE              Chief receives result

0:36    xiaomao (Subagent)   OPEN                Chief spawns xiaomao
        Main (Chief)         WAITING             Chief waits...

0:55    xiaomao (Subagent)   DONE                xiaomao returns: [docs]
        Main (Chief)         ACTIVE              Chief receives result

0:56    Main (Chief)         ACTIVE              Chief: Assembles draft
                                                Chief: Presents to user

1:00    Main (Chief)         WAITING_APPROVAL    User reviews draft

1:02    Main (Chief)         ACTIVE              User: "Looks good"
                                                Chief: Finalizes

1:03    Main (Chief)         DONE                Project delivered
```

---

## 🔄 Session Management Commands

### Check Active Sessions

```bash
openclaw sessions list

# Output:
# agent:main:discord:channel:1484701184831787008  group    active
#   Model: lmstudio/qwen/qwen3.5-9b
#   Context: 87k/33k (265% cached)
```

### Check Specialist Status (During Execution)

```bash
subagents list

# Output:
# xiaoya 🦆 (deepseek-coder)
#   Status: executing
#   Progress: 35% (writing code)
#   Started: 5 min ago
```

### Kill a Specialist Early (if needed)

```bash
subagents kill --target xiaoya

# Stops the subagent, returns partial results if any
```

### Monitor Context Usage

```bash
openclaw status

# Shows all active sessions with context window usage
```

---

## ⚙️ Context Management

### Chief's Context (32K)

**Starts at:** 0 tokens  
**Grows with:**
- User messages
- Your planning steps
- Specialist results
- Project history

**Typical Usage:**
- Small project: 15K tokens
- Medium project: 22K tokens
- Large project: Escalate to xiaohu (65K) or xiaoshe (262K)

**When to Reset:**
- Conversation is 3+ hours old
- Context > 28K tokens
- User explicitly ends project
→ Start new session/thread

### Specialist Context (Per Specialist)

**xiaoya:** 32K (usually uses 10-15K per task)  
**xiaohu:** 65K (usually uses 15-25K per analysis)  
**xiaomao:** 32K (usually uses 8-12K per docs)  
**xiaoshe:** 262K (can hold entire codebases)  
**xiaozhu:** 32K (usually uses 5-8K per image)

**No reset needed:** Specialists are ephemeral, each task fresh

---

## 🎯 Session Best Practices

✅ **DO:**
- Keep main session for planning/coordination only
- Spawn specialists for heavy work
- Run specialists in parallel when possible
- Let specialists finish before assembling
- Create new session for new projects (different thread)

❌ **DON'T:**
- Have Chief do all the work (defeats purpose)
- Run specialists sequentially unless required (wastes time)
- Let main session accumulate context (escalate or reset)
- Kill subagents unless they hang (let them finish)
- Spawn 10+ subagents at once (use 2-3 max parallel)

---

## 📈 Scaling Example

### Tiny Project (1-2 hours)
```
Main Session (Chief only)
└─ Doesn't spawn specialists
   (Chief can handle the work directly)
```

### Small Project (2-4 hours)
```
Main Session (Chief)
├─ Spawn xiaoya (30 min) → code
└─ Spawn xiaomao (20 min) → docs
└─ Assemble & deliver
```

### Medium Project (4-8 hours)
```
Main Session (Chief)
├─ Spawn xiaoya (2h) → code
├─ Spawn xiaohu (1h) → review
├─ Spawn xiaomao (1h) → docs
└─ Assemble & deliver
```

### Large Project (8+ hours)
```
Main Session (Chief)
├─ First spawn xiaoshe (30 min) → analyze scope
│  ├─ Spawn xiaoya (3h) → implement module 1
│  ├─ Spawn xiaoya (3h) → implement module 2
│  ├─ Spawn xiaohu (1h) → security review
│  └─ Spawn xiaomao (1h) → docs
└─ Assemble & deliver
```

---

## 🚨 Handling Session Issues

### Chief Session Gets Overloaded

**Symptom:** Context > 28K, Chief slows down  
**Solution:**
1. Escalate remaining work to xiaoshe
2. OR: Start new session in a new thread
3. Chief provides context transfer in prompt

**Example:**
```
Chief (to xiaoshe): "Here's the project context from main session: [summary]. 
Now analyze this massive codebase..."

xiaoshe (262K context) takes over heavy lifting
```

### Specialist Hangs or Fails

**Symptom:** Subagent returns no result after 10+ min  
**Solution:**
1. Kill subagent: `subagents kill --target xiaoya`
2. Check logs for error
3. Respawn with clearer task definition
4. OR: Route to different specialist

**Example:**
```
Chief: "xiaoya didn't respond. Let xiaohu attempt the task instead."

sessions_spawn(
  task: "Code review: Why won't this endpoint work?",
  model: "deepseek-r1-8b",
  mode: "run"
)
```

### User Wants to Switch Projects Mid-Stream

**Solution:** New session in new thread
```
Old thread: Continue existing project OR gracefully wind down
New thread: Start fresh with new project
```

---

## 📝 Session Lifecycle Summary

```
PROJECT LIFECYCLE:

Main Session Starts
    ↓
Chief: Planning Phase (4 steps)
    ↓
User: Approves Plan
    ↓
Chief: Spawns Specialist Subagents (sequential or parallel)
    ↓
Specialists: Execute Their Tasks
    ↓
Chief: Collects Results, Assembles Draft
    ↓
Chief: Presents Draft to User
    ↓
User: Reviews & Approves
    ↓
Chief: Finalizes & Delivers
    ↓
Main Session Ends (or continues for new project)
```

---

## 🔗 Integration with Chief of Staff System

**Sessions enable the Chief of Staff architecture:**

1. **Main Session** = Chief thinking/planning space
2. **Subagent Sessions** = Specialist execution
3. **Result Aggregation** = Chief's assembly phase
4. **Context Escalation** = Chief → xiaohu → xiaoshe

**Without sessions:** Chief would be overloaded  
**With sessions:** Specialists handle their domains independently  

---

*Session Management for Chief of Staff System*  
*Status: Documentation Complete*  
*Last Updated: 2026-03-22 05:58 EDT*
