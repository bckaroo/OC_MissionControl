# Chief of Staff System — Deployment Checklist
**From Design to Live Operation**  
*Status: Ready to Execute*  
*Date: 2026-03-22 05:01 EDT*

---

## ✅ PHASE 0: Architecture Complete

- [x] Gateway configuration finalized
  - [x] Primary: Qwen 3.5-9B (Chief)
  - [x] Fallbacks: Qwen Coder → DeepSeek R1 → Ollama Qwen → Minimax
  - [x] All models local/Ollama ($0 cost)

- [x] Specialist models assigned
  - [x] xiaoya 🦆 (deepseek-coder)
  - [x] xiaohu 🐯 (DeepSeek R1-8B, 65K context)
  - [x] xiaomao 🐱 (Qwen Coder 30B)
  - [x] xiaoshe 🐍 (Ollama Qwen, 262K context)
  - [x] xiaozhu 🐖 (Qwen VL 30B)

- [x] Architecture documents created
  - [x] ARCHITECTURE-CHIEF-FINAL.md
  - [x] SPECIALIST-MODELS.md
  - [x] ORG-CHART.md
  - [x] CHIEF-SYSTEM-PROMPT.md

- [x] Smart escalation logic designed
  - [x] Small projects → Chief plans
  - [x] Medium projects → xiaohu plans
  - [x] Mega projects → xiaoshe plans
  - [x] Ultra-complex → Claude optional

---

## ⏳ PHASE 1: Activate Chief (NOW)

### 1.1 Update Chief's System Prompt
**Action:** Replace main agent system prompt with CHIEF-SYSTEM-PROMPT.md content

**Steps:**
- [ ] Copy CHIEF-SYSTEM-PROMPT.md content
- [ ] Update openclaw config for main agent with new system prompt
- [ ] Test Chief responds as planner, not doer

**Test Case:**
```
User: "I need a REST API"
Chief should: Ask clarifying questions about scope, requirements
Chief should NOT: Start coding
```

**Expected:** Chief asks 3-5 clarifying questions

---

### 1.2 Verify Chief's Limits
**Action:** Test that Chief escalates when complexity grows

**Test Case 1 - Simple Project:**
```
User: "Build a hello-world app"
Chief: Plans it alone, dispatches to xiaoya
```

**Test Case 2 - Complex Project:**
```
User: "Build a microservices architecture with..."
Chief: "This is complex. xiaohu will design the approach."
Chief escalates to xiaohu ✓
```

**Expected:** Escalation triggers automatically when complexity detected

---

## ⏳ PHASE 2: Activate Specialists (NEXT)

### 2.1 Configure xiaoya 🦆 (Coding)
**Model:** deepseek-coder  
**Context:** 32K

- [ ] Create ~/.openclaw/xiaoya/ directory
- [ ] Create config.json with model mapping
- [ ] Create system_prompt.md (coding specialist role)
- [ ] Test with: "Write a FastAPI endpoint"

**System Prompt Template:**
```
You are xiaoya, Coding Specialist.
Your role: Write clean, working code.
When given a task:
1. Ask clarifying questions if unclear
2. Implement to spec
3. Include error handling
4. Provide working code
5. Suggest improvements
```

**Test Case:**
```
Chief: "Build a POST endpoint for user registration"
xiaoya should: Write complete, working FastAPI code
```

---

### 2.2 Configure xiaohu 🐯 (Reasoning)
**Model:** lmstudio/deepseek/deepseek-r1-0528-qwen3-8b  
**Context:** 65K (2x Chief!)

- [ ] Create ~/.openclaw/xiaohu/ directory
- [ ] Create config.json with model mapping
- [ ] Create system_prompt.md (reasoning specialist role)
- [ ] Test with: "Analyze this architecture for security"

**System Prompt Template:**
```
You are xiaohu, Reasoning Specialist.
Your role: Deep analysis and strategic thinking.
When given a task:
1. Analyze all angles
2. Identify risks and opportunities
3. Provide detailed reasoning
4. Suggest improvements
5. Flag critical issues
```

**Test Case:**
```
Chief: "Design JWT authentication approach"
xiaohu should: Provide detailed security analysis, implementation approach
```

---

### 2.3 Configure xiaomao 🐱 (Writing)
**Model:** lmstudio/qwen/qwen3-coder-30b  
**Context:** 32K (largest model = best writing)

- [ ] Create ~/.openclaw/xiaomao/ directory
- [ ] Create config.json with model mapping
- [ ] Create system_prompt.md (writing specialist role)
- [ ] Test with: "Write API documentation"

**System Prompt Template:**
```
You are xiaomao, Writing Specialist.
Your role: Clear, professional written content.
When given a task:
1. Understand the audience
2. Structure logically
3. Write clearly and concisely
4. Include examples where helpful
5. Polish for professionalism
```

**Test Case:**
```
Chief: "Write comprehensive API docs for these endpoints"
xiaomao should: Produce well-structured, example-rich documentation
```

---

### 2.4 Configure xiaoshe 🐍 (Long Context)
**Model:** ollama/qwen3.5  
**Context:** 262K (8x larger!)

- [ ] Create ~/.openclaw/xiaoshe/ directory
- [ ] Create config.json with model mapping
- [ ] Create system_prompt.md (long-context specialist role)
- [ ] Test with: "Analyze this 50K-line codebase"

**System Prompt Template:**
```
You are xiaoshe, Long Context Specialist.
Your role: Handle massive scope and complex synthesis.
When given a task:
1. Analyze full context
2. Identify patterns
3. Break into digestible pieces
4. Provide comprehensive synthesis
5. Connect all parts coherently
```

**Test Case:**
```
Chief: "Analyze this entire legacy system"
xiaoshe should: Provide full-scope analysis, module breakdown
```

---

### 2.5 Configure xiaozhu 🐖 (Vision)
**Model:** lmstudio/qwen/qwen3-vl-30b  
**Context:** 32K (multimodal)

- [ ] Create ~/.openclaw/xiaozhu/ directory
- [ ] Create config.json with model mapping
- [ ] Create system_prompt.md (vision specialist role)
- [ ] Test with: "Analyze this screenshot"

**System Prompt Template:**
```
You are xiaozhu, Vision Specialist.
Your role: Visual understanding and analysis.
When given a task:
1. Carefully analyze the image
2. Describe layout and structure
3. Extract text (OCR)
4. Identify UI patterns
5. Provide technical implications
```

**Test Case:**
```
Chief: "Analyze this UI mockup"
xiaozhu should: Provide visual analysis, UI description, implications
```

---

## ⏳ PHASE 3: Test Workflows (AFTER Specialists Active)

### 3.1 Small Project Test
**Scenario:** User requests a simple project

```
User: "Build a todo list API"

Chief should:
1. Ask: What database? What auth? What features?
2. Propose: FastAPI + PostgreSQL + simple JWT
3. Plan: Task 1 (scaffold) → Task 2 (endpoints) → Task 3 (docs)
4. Present plan to user
5. Wait for approval ✓

User approves

Chief dispatches:
→ xiaoya: Build scaffold + endpoints
→ xiaomao: Write docs

Chief assembles and presents draft

User reviews and approves ✓

Chief finalizes and delivers
```

**Success Criteria:**
- [ ] Chief asked clarifying questions
- [ ] Chief presented plan before dispatching
- [ ] xiaoya delivered working code
- [ ] xiaomao delivered clear docs
- [ ] Chief assembled coherent draft
- [ ] User approved draft
- [ ] Final delivery is complete and polished

**Timeline:** ~1.5-2 hours

---

### 3.2 Medium Project Test
**Scenario:** User requests a more complex project

```
User: "Build an e-commerce API with auth, payments, inventory"

Chief detects complexity
Chief: "xiaohu will design this approach"

[xiaohu analyzes and returns detailed specification]

Chief presents xiaohu's plan to user

User approves

Chief dispatches:
→ xiaoya: Build API structure (parallel)
→ xiaohu: Implement payment security (parallel)
→ xiaomao: Write docs
→ xiaoshe: Cross-module synthesis

Chief assembles final product

User reviews

Chief finalizes and delivers
```

**Success Criteria:**
- [ ] Chief escalated to xiaohu for planning
- [ ] xiaohu provided detailed spec
- [ ] Chief adapted xiaohu's spec for user
- [ ] Parallel dispatch worked correctly
- [ ] All specialist outputs integrated seamlessly
- [ ] User got high-quality final product

**Timeline:** ~3-4 hours

---

### 3.3 Large Project Test
**Scenario:** User requests a very large project

```
User: "Migrate our 100K-line system to microservices"

Chief detects mega scope
Chief: "xiaoshe will analyze full scope"

[xiaoshe analyzes entire codebase and returns master plan]

Chief adapts xiaoshe's plan for user
Chief: "Here's the breakdown into 4 microservices"

User approves

Chief dispatches modular work:
→ xiaoya: Build service 1 & 2 (parallel)
→ xiaoya: Build service 3 & 4 (parallel)
→ xiaohu: Security review all (continuous)
→ xiaoshe: Cross-module integration (synthesis)
→ xiaomao: Migration guide + docs

Chief assembles and tests full integration

User reviews

Chief finalizes and delivers with deployment guide
```

**Success Criteria:**
- [ ] Chief escalated to xiaoshe for full analysis
- [ ] xiaoshe broke massive scope into digestible modules
- [ ] Chief managed parallel execution without conflicts
- [ ] All specialists coordinated through Chief
- [ ] Final product is fully integrated
- [ ] User has clear migration path

**Timeline:** ~6-8 hours

---

### 3.4 Vision-Focused Test
**Scenario:** User provides UI mockup and wants it built

```
User: [uploads screenshot] "Build an app that looks like this"

Chief routes to xiaozhu
xiaozhu: Analyzes UI, provides technical specs

Chief presents: "Here's what the UI shows, here's how to build it"

User approves

Chief dispatches:
→ xiaozhu: Detailed UI analysis
→ xiaoya: Build frontend + backend (informed by xiaozhu's analysis)
→ xiaomao: Write UI documentation

Chief assembles

User reviews

Chief finalizes
```

**Success Criteria:**
- [ ] xiaozhu correctly understood the visual design
- [ ] xiaoya's implementation matched the visual intent
- [ ] Final product reflects the UI mockup
- [ ] Docs explain the visual design decisions

**Timeline:** ~2-3 hours

---

## ⏳ PHASE 4: Stability Verification (24+ HOURS)

After all phases active:

### 4.1 Monitor Performance
- [ ] Track response times (target: <1500ms per task)
- [ ] Track context usage (no overflows)
- [ ] Track cost (should be $0)
- [ ] Track escalation frequency (should be <5% of projects)

### 4.2 Monitor Quality
- [ ] User satisfaction with plans
- [ ] Specialist output quality
- [ ] Assembly quality
- [ ] Final deliverable polish

### 4.3 Monitor Stability
- [ ] No crashes in 24h
- [ ] No model failures
- [ ] No escalation failures
- [ ] No data loss

### 4.4 Adjustment Phase
Based on 24h data:
- [ ] Refine escalation thresholds
- [ ] Adjust task descriptions if specialists misunderstand
- [ ] Optimize routing if bottlenecks found
- [ ] Document lessons learned

---

## ✅ LIVE OPERATION CHECKLIST

Once all phases complete:

- [ ] Chief operational with dispatcher prompt
- [ ] All 5 specialists activated and responding
- [ ] Small project workflow tested ✓
- [ ] Medium project workflow tested ✓
- [ ] Large project workflow tested ✓
- [ ] Vision workflow tested ✓
- [ ] Stability verified over 24h
- [ ] No API costs (all $0)
- [ ] User approval gates working
- [ ] Escalation logic working
- [ ] Documentation complete
- [ ] Lessons learned documented

---

## Timeline Estimate

| Phase | Task | Effort | Est. Time |
|-------|------|--------|-----------|
| 0 | Architecture complete | ✅ DONE | 0h |
| 1 | Activate Chief | Small | 30 min |
| 1 | Test Chief limits | Small | 20 min |
| 2 | Configure 5 specialists | Medium | 2 hours |
| 2 | Test specialist activation | Medium | 1 hour |
| 3 | Small project test | Medium | 2 hours |
| 3 | Medium project test | Large | 4 hours |
| 3 | Large project test | Large | 8 hours |
| 3 | Vision test | Medium | 3 hours |
| 4 | Stability verification | Large | 24 hours |
| 4 | Adjustments | Small | 1-2 hours |

**Total to Live:** ~24-48 hours from now

---

## Success Definition

**System is LIVE when:**

✅ Chief is operational with dispatcher prompt  
✅ All 5 specialists respond correctly  
✅ Users can submit projects via Discord  
✅ Chief clarifies requirements  
✅ Chief creates and presents plans  
✅ Users approve plans  
✅ Specialists execute reliably  
✅ Chief assembles quality drafts  
✅ Users review and approve  
✅ Chief delivers polished final product  
✅ Escalation to xiaohu/xiaoshe works automatically  
✅ All projects are $0 cost  
✅ System is stable over 24h  

---

## First Real Project Checklist

When you submit your first real project:

- [ ] Chief asks 5+ clarifying questions
- [ ] Chief proposes clear technical approach
- [ ] Chief breaks into discrete tasks with owners
- [ ] Chief presents complete plan to you
- [ ] You review and approve (or request changes)
- [ ] Chief dispatches to specialists
- [ ] Specialists work in parallel where possible
- [ ] Chief assembles draft in reasonable time
- [ ] Draft works and meets requirements
- [ ] You review draft quality
- [ ] Chief makes final revisions
- [ ] Final delivery is professional and complete
- [ ] Cost is $0
- [ ] Timeline was reasonable

---

*Deployment Checklist for Chief of Staff System*  
*Status: Ready for Activation*  
*Last Updated: 2026-03-22 05:01 EDT*
