---
task: "agent-reviewer-continue"
title: "Write agent definitions for concert-reviewer and concert-continue"
depends_on: ["default-state-and-config"]
wave: 1
model: sonnet
---

## Objective

Write the full agent definition markdown files for `concert-reviewer` (the two-phase review agent) and `concert-continue` (the session continuation agent). The reviewer manages the two-phase review flow (user changes first, then reviewer concerns). The continue agent handles crash recovery, cross-environment handoff, and mid-quality-loop resumption.

## Files

- `templates/docs/concert/agents/concert-reviewer.md`
- `templates/docs/concert/agents/concert-continue.md`

## Requirements

- FR-009: Review/Accept/Restart Cycle
- FR-011: Session Continuation
- FR-016: One Question at a Time — Interview Agents
- FR-036: Interactive Mode Enforcement
- Architecture Section 8: Code Quality Loop Architecture
- Architecture Section 10: Cross-Environment Handoff
- UX Section 4.2: Review Flow

## Agent File Format

Same as other agent tasks — managed header, YAML frontmatter, six XML sections.

## Detailed Instructions

### concert-reviewer.md

**Frontmatter:**
- `name: concert-reviewer`
- `description: Two-phase reviewer — applies user changes first, then presents reviewer concerns one at a time`
- `tools: Read, Write, Edit, Bash, Glob, Grep`
- `model: balanced`
- `interactive_only: true`

**Role:** Senior technical reviewer who conducts structured two-phase reviews of planning stage outputs. Respects user priorities by handling their changes first, then presenting its own concerns individually by severity.

**Execution flow (two-phase, detailed):**
1. Check interactive mode — if restricted and not in CC, output redirect message
2. Read state.json to determine current stage and which document to review
3. Read the draft document (VISION.md, REQUIREMENTS.md, ARCHITECTURE.md, UX.md, or task plan)
4. **Phase 1 — User Changes:**
   - Ask: "I've read the [document] draft. Before I share my review, do you have any changes you'd like to make?"
   - If user has changes: apply them one at a time, commit after each change
   - After each change: "Any other changes?"
   - Continue until user says no more changes
5. **Phase 2 — Reviewer Concerns:**
   - Analyze the document for issues
   - Present total count: "I have N concerns to discuss, ordered by importance."
   - Present one concern at a time with counter: `[1/N]`
   - Each concern has: severity label (CRITICAL/IMPORTANT/SUGGESTION), description, concrete suggestion
   - Wait for user response before presenting next concern
   - Apply agreed changes and commit
6. Output: "Review complete. All concerns resolved." with next steps

**User guidance:**
- Phase 1 ALWAYS comes first, even if reviewer has critical concerns
- One concern at a time with counter — user always knows how many remain
- Commits happen after changes are applied, not batched at the end
- Concerns are ordered by severity: CRITICAL > IMPORTANT > SUGGESTION

**Boundaries:**
- Does NOT accept stages — only reviews them
- Does NOT advance the pipeline
- Does NOT modify state.json pipeline status
- Refuses to run in non-interactive environments

### concert-continue.md

**Frontmatter:**
- `name: concert-continue`
- `description: Session continuation — resumes work after crashes, timeouts, or cross-environment handoffs`
- `tools: Read, Write, Edit, Bash, Glob, Grep, Task`
- `model: balanced`
- `interactive_only: false`

**Role:** Intelligent continuation agent that reads state.json to determine the exact point to resume work. Handles all possible states: mid-task, between tasks, between phases, in planning stages, with failures, with quality loop state, and cross-environment handoffs.

**Execution flow (comprehensive state detection):**
1. Read state.json completely
2. Detect the current state and determine continuation action:

   **If failure block exists:**
   - Assess whether to retry the failed task or suggest debugging
   - If retrying: clear failure block, resume from the failed task
   - If complex: suggest `concert-debug`

   **If quality_loop_state exists:**
   - Resume the code quality loop at the exact position
   - If `phase: "coder"`: spawn coder with prior_findings from previous iterations
   - If `phase: "reviewer"`: spawn reviewer for the current iteration
   - Preserve prior_findings and coder_commits — do NOT restart the loop

   **If mid-execution (tasks_completed < tasks_total):**
   - Determine current phase and task position
   - Resume execution using the same logic as concert-runner

   **If in planning stage (pipeline has a "draft" stage):**
   - Suggest `concert-review` or `concert-accept` for the draft stage

   **If all stages accepted but tasks not planned:**
   - Suggest `concert-plan`

   **If execution complete (tasks_completed == tasks_total):**
   - Suggest `concert-verify`

3. During execution: update state.json continuously for crash safety
4. Write next_steps for the NEXT continuation session (assume it may crash)

**Cross-environment handoff handling:**
- Detect if the branch has uncommitted work (from the previous environment)
- Assess uncommitted work state and either incorporate or continue from last committed point
- Output handoff context: "Resuming from cross-environment handoff. Last environment: [env]. Last action: [action]."

**Operating principles:**
- Always start by reading state.json — never assume state
- Preserve quality_loop_state across continuations — never restart loops
- Support `--max-iterations N` flag to extend quality loop iterations for a stuck task
- Write next_steps that are useful even if this session also crashes

**Boundaries:**
- Does NOT start new missions — only continues existing ones
- Does NOT skip tasks or phases
- Does NOT modify approved mission documents
- Respects the same quality loop rules as concert-runner

## Acceptance Criteria

- [ ] `concert-reviewer.md` includes the complete two-phase review flow
- [ ] `concert-reviewer.md` enforces Phase 1 (user changes) before Phase 2 (reviewer concerns)
- [ ] `concert-reviewer.md` includes one-at-a-time concern presentation with counter
- [ ] `concert-reviewer.md` includes interactive mode detection
- [ ] `concert-continue.md` includes exhaustive state detection for all possible states
- [ ] `concert-continue.md` includes quality_loop_state resumption logic
- [ ] `concert-continue.md` includes cross-environment handoff detection
- [ ] `concert-continue.md` includes --max-iterations flag support
- [ ] Both files follow the agent file format exactly
- [ ] Both files start with the managed header

## Skills

- docs/concert/skills/agent-authoring/SKILL.md
