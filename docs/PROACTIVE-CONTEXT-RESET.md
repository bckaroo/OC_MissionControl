# Proactive Context Reset on Task Completion
**Chief Suggests Reset When Work Is Done**  
*Designed: 2026-03-22 06:02 EDT*

---

## 🎯 The Pattern

**Instead of waiting for context to get high**, Chief proactively suggests reset when task naturally completes.

```
Task starts: Context = 2K
├─ Planning phase
├─ Execution phase
├─ Assembly phase
└─ Delivery to user

User: "Great, thanks!"

Chief (PROACTIVE): "Context has grown to 18K. 
Ready for next project, or want to reset first?"

User: "Yes, let's reset"

Chief: [Reset context]
"Fresh start. What's next?"
Context = 5K
```

---

## 💡 Key Insight

**Don't wait for context to be HIGH** (25K+)  
**Suggest reset when task is DONE** (15-20K)

This keeps the system:
- ✅ Always responsive
- ✅ Fresh for new work
- ✅ Proactive, not reactive
- ✅ Smooth user experience

---

## 📝 Add to Chief's System Prompt

Insert into **CONTEXT MANAGEMENT** section:

```
## PROACTIVE CONTEXT RESET

At task completion, Chief should:

1. Recognize when task is delivered
   ├─ User says "thanks", "great", "looks good"
   ├─ Project is archived/closed
   ├─ No new work mentioned
   └─ Natural stopping point

2. Check context usage
   └─ If context > 12K (even if under warning threshold)

3. SUGGEST reset proactively:
   ├─ "Project delivered! Context is at 18K.
   │   Ready for next project, or want a fresh start first?"
   │
   └─ Options:
      ├─ "Yes, reset" - Clear context (→ 5K)
      ├─ "New project, keep context" - Continue accumulating
      └─ "Done for now" - Archive thread

4. Only escalate (don't reset) if:
   ├─ User explicitly says "continue this project"
   ├─ OR project is marked incomplete
   └─ Otherwise: suggest reset
```

---

## 🔄 Conversation Flow Example

### Small Project Completion

```
User: "Build a simple API"

Chief: [Plans project, dispatches to xiaoya, assembles]

Chief: "Here's your API. It's ready to go."

[Context: ~16K at this point]

User: "This is perfect, thanks!"

Chief (PROACTIVE): 
"✅ Project delivered!

I've accumulated ~16K context tokens during planning 
and assembly. Want me to reset for a fresh start 
on your next project?

Options:
• 'Yes, reset' - Clear context (→ 5K), ready for new work
• 'New project, keep context' - Continue from here
• 'Done for now' - Archive this thread"

User: "Yes, reset"

Chief: "✅ Context cleared.
Starting fresh. What's your next project?"

[Context: ~5K (clean slate)]
```

---

### Medium Project Completion

```
User: "Build authentication system for my app"

Chief: [3-hour project]

Chief: "Auth system is complete and tested."

[Context: ~22K at this point - getting high!]

User: "Excellent. Can you also add permission roles?"

Chief (PROACTIVE):
"Context is at 22K and getting close to threshold.
Should I:

A) Reset context + start fresh on permissions
   (Gives me full 32K for the new task)
   
B) Continue from here 
   (Works, but less headroom)

Which would you prefer?"

User: "A, reset for permissions"

Chief: [Reset]
"✅ Context cleared. Starting fresh on permission roles.
Here's what I'll do: [new plan]"

[Context: ~5K]
```

---

## 🛠️ Implementation Details

### When to Trigger (Recognition)

Chief recognizes task completion by looking for:

```
EXPLICIT SIGNALS:
├─ "thanks"
├─ "great"
├─ "perfect"
├─ "looks good"
├─ "delivered"
├─ "done"
└─ "thanks!"

CONTEXTUAL SIGNALS:
├─ User says "next project" or "another task"
├─ Project is explicitly closed/archived
├─ No follow-up questions
├─ Conversation goes silent for 2+ messages
└─ Natural conversational stopping point
```

---

### What NOT to Suggest Reset For

```
DON'T suggest reset if:
├─ User says "but also..." (continuation)
├─ Project marked incomplete
├─ User still asking questions
├─ Waiting for user feedback
├─ Multiple phases planned
└─ Ongoing project
```

---

## 📊 Expected Behavior

### Before (Old System)

```
Task 1: Context 0K → 20K
Task 2: Context 20K → 35K (OVER LIMIT!)
        [Error/slowdown]
```

### After (Proactive Reset)

```
Task 1: Context 0K → 18K
        ↓
        Chief: "Ready to reset?"
        User: "Yes"
        ↓
        Context → 5K

Task 2: Context 5K → 18K
        ↓
        Chief: "Ready to reset?"
        User: "Yes"
        ↓
        Context → 5K

Task 3: Context 5K → 15K
        ↓
        Chief: "Ready to reset?"
        User: "Yes"
        ↓
        Context → 5K
```

**Result:** Never hit limits, always fresh, always fast

---

## 💬 Exact Prompts to Use

### Prompt Option 1 (Friendly)

```
"✅ All done with [project name]!

I've used about {context}K tokens during planning 
and work. Want me to clear my context for a fresh start 
on your next project?"

Yes / No / Continue accumulating
```

---

### Prompt Option 2 (Professional)

```
"Project delivered. Context usage: {context}K / 32K.

Recommendation: Reset context for optimal performance 
on the next task. Ready?"

[Reset] [Continue] [Done]
```

---

### Prompt Option 3 (Casual)

```
"Done! Context is at {context}K.

Want me to reset for the next thing, or keep rolling?"

Reset / Keep going / All set
```

---

## 🔗 Integration Points

### In CHIEF-SYSTEM-PROMPT.md

**Add to EXECUTION section:**

```
## TASK COMPLETION & CONTEXT RESET

When a task is delivered:

1. Deliver final result to user
2. Assess context usage: openclaw status
3. If context > 12K:
   └─ Proactively suggest: "Ready to reset for next project?"
4. User chooses:
   ├─ "Yes" → Clear context (context → 5K)
   ├─ "No" → Continue accumulating
   └─ "Done" → Archive thread

Implementation:
- No CLI needed (Chief just asks in message)
- User confirms verbally (simple)
- Automatic reset on "Yes"
```

---

## 🎯 Benefits

✅ **Proactive** — Don't wait for problems  
✅ **Natural** — Fits conversational flow  
✅ **User Control** — User decides when to reset  
✅ **Efficient** — Resets at optimal time (task done)  
✅ **Zero Overhead** — Just a suggestion in chat  

---

## 🚀 Activation

### Step 1: Update Chief's System Prompt

Add the **TASK COMPLETION & CONTEXT RESET** section (above) to CHIEF-SYSTEM-PROMPT.md

### Step 2: Test

```
User: "Build a simple API"

[Chief plans, executes, delivers]

Chief should now automatically suggest:
"✅ Done! Context at 15K. Reset for next project?"
```

### Step 3: Verify

- User gets reset suggestions naturally
- No extra commands needed
- Works conversationally

---

## 📋 Checklist

- [ ] Add section to CHIEF-SYSTEM-PROMPT.md
- [ ] Test with small project
- [ ] Verify suggestion appears on completion
- [ ] Test reset mechanism
- [ ] Confirm context goes from high (20K) → low (5K)
- [ ] Test multiple resets in a row

---

## Example Interaction (Full Loop)

```
USER: "Build a REST API for a blog"

CHIEF: [Questions] [Plans] [Dispatches to xiaoya] [Assembles]

CHIEF: "Here's your complete blog API..."

[Context: 17K]

CHIEF (PROACTIVE): 
"✅ Project delivered!

Context: 17K / 32K (53%)

Ready for the next project? I can reset my context 
for a fresh start, or continue accumulating if you 
have more work on this one."

USER: "Great! Can you add comments feature?"

CHIEF: 
"Already part of the spec 😊 
But if you meant something extra, let me know.

In the meantime, want to reset context or continue?"

USER: "Reset for the next project"

CHIEF:
"✅ Context cleared. Fresh start. What's next?"

[Context: 5K]

USER: "Build a mobile app API"

CHIEF: [Fresh planning from 5K context]
```

---

## 🎁 Bonus: Make It Smart

Optional enhancement - Chief can suggest reset BEFORE task completion if context nearing limits:

```
Chief (during long project):
"Context is getting full (26K). Want me to:

A) Escalate analysis to xiaoshe (262K available)
B) Reset and summarize progress
C) Continue as-is"

User chooses → Chief executes
```

---

*Proactive Context Reset on Task Completion*  
*Status: Ready to Implement (Just Prompt Edit)*  
*Last Updated: 2026-03-22 06:02 EDT*
