# Specialist Agent Model Assignments
**Strategic Model Matching for Optimal Performance**  
*Current Config: 2026-03-22 04:49 EDT*

---

## 📋 Current Model Assignments

### Chief of Staff (YOU)
```
Model:    lmstudio/qwen/qwen3.5-9b
Size:     9B parameters
Context:  32K tokens
Cost:     $0
Location: LM Studio (local)
Purpose:  Planning, routing, coordination, synthesis

Responsibilities:
• Clarify requirements
• Design project approach
• Create task plan
• Present to user (decision point 1)
• Dispatch to specialists
• Assemble draft
• Present draft to user (decision point 2)
• Finalize delivery

Requirements:
✅ Fast (100-300ms for planning)
✅ Good reasoning (understands project scope)
✅ Conversational (talks to users)
✅ NOT overloaded (dispatch heavy work immediately)

Current Performance:
⚠️ Gets overloaded with long conversations
⚠️ 32K context can fill up with large projects
✅ Fast for simple planning
✅ Good at routing decisions
```

---

### xiaoya 🦆 (Coding Specialist)
```
Model:    deepseek-coder (via Ollama)
Size:     ~13B parameters
Context:  32K tokens
Cost:     $0
Location: Ollama
Purpose:  Code generation, debugging, architecture

Responsibilities:
• Write code from specifications
• Debug issues
• Review code quality
• Optimize implementations
• Handle coding tasks from plan

Strengths:
✅ Specialized for code (better than general models)
✅ Understands architecture patterns
✅ Good at generating working code
✅ Fast iteration on code tasks

Limitations:
⚠️ 32K context (can hit limits on large files)
⚠️ Not great at security analysis (not its role)
⚠️ Not best for long-form reasoning

Test Case:
"Implement FastAPI endpoint with PostgreSQL connection"
```

---

### xiaohu 🐯 (Reasoning Specialist)
```
Model:    lmstudio/deepseek/deepseek-r1-0528-qwen3-8b
Size:     8B parameters
Context:  65K tokens (2x Chief!)
Cost:     $0
Location: LM Studio (local)
Purpose:  Complex reasoning, security analysis, architecture review

Responsibilities:
• Analyze complex problems
• Review security implications
• Design algorithms
• Evaluate trade-offs
• Test edge cases
• Performance analysis

Strengths:
✅ 65K context (handles complex analysis)
✅ DeepSeek R1 (optimized for reasoning)
✅ Good at "why" questions
✅ Security-minded reasoning
✅ Larger context than Chief for detailed analysis

Limitations:
⚠️ Slower than Chief (reasoning takes time)
⚠️ Not specialized for code output (just analysis)
⚠️ Not great for creative writing

Test Case:
"Analyze this JWT implementation for security vulnerabilities"
```

---

### xiaomao 🐱 (Writing Specialist)
```
Model:    lmstudio/qwen/qwen3-coder-30b
Size:     30B parameters (largest!)
Context:  32K tokens
Cost:     $0
Location: LM Studio (local)
Purpose:  Documentation, writing, content creation

Responsibilities:
• Write API documentation
• Create user guides
• Generate technical documentation
• Write blog posts or articles
• Polish communication

Strengths:
✅ 30B model (larger = better writing quality)
✅ Good at structured documentation
✅ Clear, professional tone
✅ Can generate code examples for docs
✅ Specialized in clarity and structure

Limitations:
⚠️ Slowest model (30B is heavy)
⚠️ Overkill for simple notes
⚠️ Not good for code generation (not its role)

Test Case:
"Write comprehensive API documentation for our REST endpoints"
```

---

### xiaoshe 🐍 (Long Context Specialist)
```
Model:    ollama/qwen3.5 (262K context!)
Size:     9B parameters
Context:  262K tokens (8x Chief!)
Cost:     $0
Location: Ollama (cloud)
Purpose:  Large document analysis, full codebase review, synthesis

Responsibilities:
• Analyze entire codebases
• Review large documents
• Cross-file/cross-module analysis
• Identify patterns across large scope
• Comprehensive synthesis

Strengths:
✅ 262K context (8x larger than Chief!)
✅ Can hold entire projects in context
✅ Great for "understand this whole thing" requests
✅ No context cutoff issues
✅ Perfect for long-range analysis

Limitations:
⚠️ Slower (large context = slower processing)
⚠️ May be overkill for small tasks
⚠️ Not specialized in any one domain

Test Case:
"Review this entire 50K-line codebase and identify patterns"
```

---

### xiaozhu 🐖 (Vision Specialist)
```
Model:    lmstudio/qwen/qwen3-vl-30b
Size:     30B parameters (multimodal)
Context:  32K tokens
Cost:     $0
Location: LM Studio (local)
Purpose:  Image analysis, screenshot understanding, visual debugging

Responsibilities:
• Analyze screenshots
• Review UI/UX visuals
• Interpret diagrams and charts
• OCR and image content extraction
• Visual debugging

Strengths:
✅ Multimodal (text + vision)
✅ 30B model (good quality)
✅ Specialized for visual understanding
✅ Can read charts, diagrams, screenshots
✅ $0 cost (local)

Limitations:
⚠️ Slowest model (30B + vision = heavy)
⚠️ Not great for pure text tasks
⚠️ Limited to 32K context

Test Case:
"Analyze this screenshot and describe the UI layout"
```

---

## 🎯 Model Selection Rationale

| Specialist | Model Choice | Why This One? |
|-----------|--------------|---------------|
| **Chief** | Qwen 3.5-9B | Fast (9B), responsive (planning role), 32K context (for most planning) |
| **xiaoya** | deepseek-coder | Specialized for code, good quality, 32K context sufficient |
| **xiaohu** | DeepSeek R1-8B | Reasoning-optimized, 65K context (2x Chief), good for analysis |
| **xiaomao** | Qwen Coder 30B | Largest model (30B), best writing quality, documentation focus |
| **xiaoshe** | Ollama Qwen 262K | Massive context (8x), can hold entire projects, synthesis focus |
| **xiaozhu** | Qwen VL 30B | Multimodal (vision), 30B for quality, visual understanding |

---

## ⚙️ Current Model Performance

### Speed Ranking (Fastest → Slowest)
1. **Chief (Qwen 3.5-9B)** — ~100-200ms response time
2. **xiaoya (deepseek-coder)** — ~300-500ms response time
3. **xiaohu (DeepSeek R1-8B)** — ~400-800ms (reasoning = slower)
4. **xiaomao (Qwen Coder 30B)** — ~500-1000ms (largest = slowest)
5. **xiaozhu (Qwen VL 30B)** — ~500-1000ms (vision processing)
6. **xiaoshe (Ollama Qwen 262K)** — ~1000-2000ms (huge context)

### Quality Ranking (Good → Excellent)
1. **Chief (Qwen 3.5-9B)** — Good for planning/routing
2. **xiaoya (deepseek-coder)** — Excellent for code
3. **xiaohu (DeepSeek R1-8B)** — Excellent for reasoning
4. **xiaozhu (Qwen VL 30B)** — Excellent for vision
5. **xiaomao (Qwen Coder 30B)** — Excellent for writing (largest)
6. **xiaoshe (Ollama Qwen 262K)** — Good for large context (not specialized)

### Context Window Ranking (Small → Large)
1. **Chief (32K)** — Standard
2. **xiaoya (32K)** — Standard
3. **xiaomao (32K)** — Standard
4. **xiaozhu (32K)** — Standard
5. **xiaohu (65K)** — 2x standard
6. **xiaoshe (262K)** — 8x standard!

---

## 🔄 Task → Specialist → Model Flow

```
USER: "Write an API with docs"
    ↓
CHIEF (Qwen 3.5-9B):
  "I'll dispatch coding to xiaoya, docs to xiaomao"
    ↓
XIAOYA (deepseek-coder):
  Writes: router.py, auth.py, models.py
  [Response: ~400ms]
    ↓
XIAOMAO (Qwen Coder 30B):
  Writes: api.md, setup.md, examples.md
  [Response: ~800ms]
    ↓
CHIEF (Qwen 3.5-9B):
  Assembles code + docs into package
  Presents to user
  [Response: ~200ms]
    ↓
TOTAL: ~1400ms, High quality (specialized models)
```

---

## ⚠️ Current Limitations & Solutions

### Chief's 32K Context Can Fill Up
**Problem:** Long projects + conversation history → context overflow  
**Current Fallback:** DeepSeek R1-8B (65K) or Ollama Qwen (262K)  
**Solution Options:**
1. Chief always dispatches early (doesn't accumulate conversation)
2. Use xiaoshe for large projects (Chief routes earlier)
3. Archive old conversations (start fresh sessions)

**Recommendation:** Option 1 — Chief dispatches immediately instead of conversing

### xiaoya (32K) Can't Handle Huge Codebases
**Problem:** 50K+ line codebases exceed 32K context  
**Current Fallback:** None (could escalate to xiaoshe)  
**Solution Options:**
1. Break large codebases into modules (xiaoya works on one at a time)
2. Route large codebases to xiaoshe first (for analysis + plan)
3. Use xiaoshe + xiaoya together (analysis + implementation)

**Recommendation:** Route large codebases to xiaoshe + xiaoya in sequence

### xiaomao (30B) Is Slowest
**Problem:** Large model = slower responses  
**Trade-off:** Quality vs. Speed  
**Solution Options:**
1. Use Chief (Qwen 3.5) for simple docs
2. Accept slower response for better quality
3. Pre-plan doc structure (xiaomao just fills in)

**Recommendation:** Accept slowness; quality > speed for documentation

---

## 🚀 Optimal Usage Patterns

### Simple Projects (Small Codebase, Good Docs)
```
Chief → xiaoya (code) → xiaomao (docs) → Chief (assembly)
Time: ~1-2 hours
Quality: High
Cost: $0
```

### Medium Projects (Moderate Scope, Security Important)
```
Chief → xiaoya (code) → xiaohu (review) → xiaomao (docs) → Chief (assembly)
Time: ~2-4 hours
Quality: Very High (with security review)
Cost: $0
```

### Large Projects (Big Codebase, Complex Analysis)
```
Chief → xiaoshe (analysis + plan breakdown) → xiaoya (code by module) 
     → xiaohu (security review) → xiaomao (docs) → Chief (assembly)
Time: ~4-8 hours
Quality: Excellent
Cost: $0
```

### Vision-Needed Projects (Screenshots, UI Review)
```
Chief → xiaozhu (visual analysis) → xiaoya (code from specs) 
     → xiaomao (docs) → Chief (assembly)
Time: ~2-3 hours
Quality: High (visual-informed code)
Cost: $0
```

---

## 📊 Model Utilization

### VRAM Requirements (All Running)
- Chief (Qwen 3.5-9B): ~5-6GB
- xiaoya (deepseek-coder): ~7-8GB
- xiaohu (DeepSeek R1-8B): ~5-6GB
- xiaomao (Qwen Coder 30B): ~16-18GB
- xiaozhu (Qwen VL 30B): ~16-18GB
- xiaoshe (Ollama Qwen): ~5-6GB (cloud/streamed)

**Total: ~55-62GB if all running**

**Practical:** Not all run simultaneously. Only Chief + current specialist(s).

### Monthly Cost
- Chief: $0
- All specialists: $0
- **Total: $0** (100% local/Ollama)

---

## ✅ Specialist Assignment Summary

| Role | Model | Size | Context | Speed | Cost | Best For |
|------|-------|------|---------|-------|------|----------|
| **Chief** | Qwen 3.5-9B | 9B | 32K | Fast | $0 | Planning, routing, synthesis |
| **xiaoya** | deepseek-coder | 13B | 32K | Medium | $0 | Code generation |
| **xiaohu** | DeepSeek R1-8B | 8B | 65K | Medium | $0 | Reasoning, security |
| **xiaomao** | Qwen Coder 30B | 30B | 32K | Slow | $0 | Documentation, writing |
| **xiaoshe** | Ollama Qwen | 9B | 262K | Very Slow | $0 | Large document analysis |
| **xiaozhu** | Qwen VL 30B | 30B | 32K | Slow | $0 | Vision, images |

---

## 🎯 Questions for Optimization

1. **Should we change any specialist models?** (Current assignment good?)
2. **Do any specialists feel overloaded or underutilized?**
3. **Should Chief dispatch MORE eagerly** (earlier in conversation)?
4. **Should we add fallback models for specialists?** (e.g., xiaoya → xiaoshe for large code)
5. **Is 32K context for Chief sufficient,** or should we escalate sooner?

---

*This is your current specialist model setup. All $0, all local, all optimized for their roles.*

*Status: Ready to deploy*  
*Last Updated: 2026-03-22 04:49 EDT*
