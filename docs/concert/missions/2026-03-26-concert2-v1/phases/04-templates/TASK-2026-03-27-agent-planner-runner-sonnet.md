---
task: "agent-planner-runner"
title: "Write agent definitions for concert-planner and concert-continue (execution)"
depends_on: ["default-state-and-config"]
wave: 1
model: sonnet
---

## Objective

Write the full agent definition markdown files for `concert-planner` (the task decomposer) and `concert-continue` (the execution orchestrator). These are the two most complex agents in Concert — the planner decomposes approved plans into executable task files with model-tier optimization, and the runner orchestrates the code quality loop for each task.

The runner is a **lean orchestrator only**. It does NOT contain coder or reviewer instructions. Those live in separate agent files (`concert-coder.md`, `concert-code-reviewer.md`) created by a separate task.

## Files

- `templates/docs/concert/agents/concert-planner.md`
- `templates/docs/concert/agents/concert-continue.md`

## Requirements

- FR-007: Pipeline Stage Execution — Task Planning
- FR-008: Pipeline Stage Execution — Code Execution
- FR-017: Model Tier Routing
- FR-018: Code Quality Loop
- FR-035: Cost-Optimized Task Decomposition
- FR-033: Context Compaction
- FR-040: Documentation Currency
- Architecture Section 8: Code Quality Loop Architecture
- Architecture Section 12: Model Tier Routing

## Agent File Format

Same as other agent tasks — managed header, YAML frontmatter, six XML sections.

## Detailed Instructions

### concert-planner.md

**Frontmatter:**
- `name: concert-planner`
- `description: Task decomposer — breaks approved plans into executable phases, waves, and task files`
- `tools: Read, Write, Edit, Bash, Glob, Grep`
- `model: balanced`
- `interactive_only: false`

**Model tier: balanced (sonnet), not quality (opus).** The planner's work is systematic decomposition — reading structured docs and producing structured task files. This does not require opus-level reasoning. Sonnet produces equivalent quality task files at ~1/5 the cost.

**Role:** Senior engineering manager who decomposes a project into executable task files. The planner reads all approved mission documents, deeply understands the codebase, and produces a task plan optimized for cost efficiency through aggressive model tier downtierring.

**Cache-optimized two-pass execution flow:**

The planner runs as a **single agent** (not subagents) to maximize prompt cache hits. All mission docs are read once at the start and remain cached in the conversation prefix for the entire session. Splitting into per-phase subagents would cause full cache misses on every subagent spawn.

**Pass 1 — Outline (lightweight, gets user review before Pass 2):**
1. Read state.json — verify all required stages are accepted (varies by workflow)
2. Read all mission docs ONCE: VISION.md, REQUIREMENTS.md, ARCHITECTURE.md, UX.md (if present)
3. Read existing *-SPEC.md files and scan codebase structure
4. Produce a phase outline as a single text block:
   ```
   Phase 01: Foundation (3 tasks)
     - project-scaffold (haiku, wave 1, depends: none)
     - types (haiku, wave 2, depends: project-scaffold)
     - default-state-and-config (haiku, wave 3, depends: types)

   Phase 02: Core Library (6 tasks)
     - state-helpers (haiku, wave 1, depends: types, default-state-and-config)
     ...
   ```
5. Output the outline with task counts and model tier distribution
6. Ask: "Does this phase structure look right, or would you like to adjust?"
7. Incorporate feedback and finalize the outline

**Pass 2 — Full task files (uses cached mission docs, references outline):**
8. Using the outline as the working plan (already in context), write each task file:
   - Name: `TASK-YYYY-MM-DD-<slug>-<model>.md`
   - YAML frontmatter: task, title, depends_on, wave, model
   - Body: Objective, Files (exact paths), Requirements (FR/NFR IDs), Tests (or Detailed Instructions for haiku), Acceptance Criteria, Skills
   - Reference the outline for dependencies, not re-reading mission docs
9. Write files sequentially — each Write tool call produces a file without accumulating output context
10. Create `phases/` directory structure with numbered phase directories
11. Update state.json: `pipeline.tasks = "draft"`, `phases_total`, `tasks_total`
12. Commit and output summary with phase/task counts and next steps

**Why single agent, not subagents:**
- Mission docs (~4 large files) are read once and cached in the prefix
- Each subsequent Write benefits from cached input — no re-reading
- Subagents would each re-read all mission docs = 4x cache misses per subagent
- The outline pass produces a compressed working plan that stays in context
- Write tool calls produce files without growing the agent's context significantly

**Model tier assignment rules:**
- Default to haiku — add extra detail (exact code, step-by-step instructions) to make it viable
- Promote to sonnet only when: business logic reasoning, nuanced test writing, multi-file coordination, or complex patterns that haiku cannot handle even with detailed instructions
- Promote to opus only when: security-critical, complex algorithms, architectural decisions
- For each non-haiku assignment, document the rationale in a comment

**User guidance:**
- Task files for haiku include "Detailed Instructions" with explicit code snippets, exact file paths, and step-by-step implementation guides
- Task files for sonnet/opus use "Implementation" or "Requirements" sections that describe intent rather than exact code
- Dependencies between task files must form a valid DAG (no cycles)
- Max tasks per file: respect `execution.max_tasks_per_file` from concert.jsonc
- Max files per phase: respect `execution.max_files_per_phase` from concert.jsonc

**Operating principles:**
- Two-pass: outline for alignment, then full files for execution
- Single agent context: maximize cache hits on mission docs
- Aggressively downtier: the cheapest model that can produce correct output with sufficient guidance
- Every task produces exactly one commit
- Every task has testable acceptance criteria
- Dependency ordering is minimal — only declare dependencies that are truly required
- Tasks should be independently verifiable

**Boundaries:**
- Does NOT execute tasks — only plans them
- Does NOT write code or tests
- Does NOT modify approved mission documents
- Does NOT accept or reject prior stages
- Does NOT split into subagents — stays as a single cached context

### concert-continue.md

**Frontmatter:**
- `name: concert-continue`
- `description: Execution orchestrator — runs the code quality loop for each task`
- `tools: Read, Write, Edit, Bash, Glob, Grep, Task`
- `model: balanced`
- `interactive_only: false`

**Role:** Execution orchestrator — a lean coordinator that manages the code quality loop. The runner contains ONLY orchestration logic: task ordering, state management, quality loop decisions, and failure handling. It does NOT contain coder or reviewer instructions. Those live in separate agent files (`concert-coder.md`, `concert-code-reviewer.md`) that are loaded on-demand.

**Separation of concerns:**

The runner is lean in both environments. Coder and reviewer behaviors are defined in their own agent files:

| Agent file | Purpose | Loaded when |
|------------|---------|-------------|
| `concert-continue.md` | Orchestration: task ordering, state, quality loop decisions, telemetry | Always (it's the entry point) |
| `concert-coder.md` | TDD implementation: read task, write tests, implement, verify, commit | When it's time to code a task |
| `concert-code-reviewer.md` | Code review: read diff against acceptance criteria, rate findings by severity | When it's time to review a task |

How these are invoked depends on the environment:

| Environment | How runner uses coder/reviewer |
|-------------|-------------------------------|
| Claude Code | Spawn coder as subagent (Task tool) with `concert-coder.md` instructions. Spawn reviewer as subagent with `concert-code-reviewer.md` instructions. Runner stays lean at ~15% context. |
| GitHub Agents UI | Runner reads `concert-coder.md` on demand when entering coder mode. After coding, reads `concert-code-reviewer.md` when entering reviewer mode. Earlier instructions get compressed by Claude's context management as conversation progresses. Runner file itself stays small. |

**Cache-optimized execution flow:**

1. Read state.json for execution position (current_phase, current_task_file, current_task_index)
2. Read the current phase's task files in wave order
3. For each task:
   a. Read task file frontmatter for model tier and task content
   b. Resolve model tier via `concert.jsonc` → `model_tiers`
   c. Identify applicable skill file paths from task's Skills section
   d. **Enter coder mode:**
      - **Claude Code:** Spawn coder subagent with task file content (pre-loaded), skill file paths, model tier, and instruction to read `concert-coder.md`
      - **GitHub:** Read `concert-coder.md`, then implement the task following those instructions
      - Coder reads skills and codebase files (cached in prefix for iterations)
      - Coder implements TDD: tests first, implement, verify
      - Coder commits with conventional commit format
      - Coder returns: commit SHA, confidence level, files changed
   e. **Enter reviewer mode (fresh each iteration):**
      - **Claude Code:** Spawn fresh reviewer subagent with task file content, diff, and instruction to read `concert-code-reviewer.md`
      - **GitHub:** Read `concert-code-reviewer.md`, then review the diff
      - Reviewer rates findings: CRIT, MAJ, MIN, NTH, or PASS
      - Reviewer returns structured findings
   f. **Quality loop decision (always orchestrator logic):**
      - PASS (zero findings): proceed to next task
      - CRIT/MAJ findings AND iteration < max_review_iterations:
        **Claude Code:** CONTINUE the same Coder (SendMessage) with findings — coder's context is cached
        **GitHub:** Continue in the same conversation with findings — context already loaded
      - After max iterations with only MIN/NTH remaining: proceed with success
      - After max iterations with CRIT/MAJ remaining: stop with failure
   g. Update state.json: tasks_completed++, telemetry record, history entry
   h. Update PHASE-SUMMARY
4. After all tasks in phase:
   a. Spawn/invoke Documentation Agent to update higher-level docs
   b. Mark phase complete
   c. Update WIP PR body
5. On failure: write failure block to state.json, stop immediately

**Cache optimization rationale:**

| Subagent | Lifecycle | Why |
|----------|-----------|-----|
| Coder | Spawn once per task, continue across iterations (CC) / single context (GitHub) | Task file + skills + codebase stay cached. SendMessage adds only the reviewer findings. |
| Reviewer | Fresh spawn each iteration (CC) / re-read agent file each iteration (GitHub) | Each iteration reviews a different diff. Prior diffs in context could confuse the review. Reviewer context is lightweight. |
| Documentation Agent | Fresh spawn per phase | Runs once after all tasks. Reads PHASE-SUMMARY + commits. No iteration loop. |

**What the orchestrator pre-loads vs. what coder/reviewer reads:**

| Content | Who reads it | Why |
|---------|-------------|-----|
| Task file content | Orchestrator reads, passes to coder/reviewer | Orchestrator already reads it for model tier. Avoids one Read call per subagent. |
| Coder/reviewer agent file | Coder/reviewer reads on demand | Keeps orchestrator lean. Agent instructions loaded only when needed. |
| Skill file paths | Orchestrator passes paths, coder reads content | Skills can be large. Coder reads once, cached for iterations. |
| Codebase files | Coder reads as needed | Coder discovers which files to modify during implementation. |
| Diff | Orchestrator computes (git diff), passes to reviewer | Reviewer doesn't need git access. |

**State management detail:**
- After each task completion: update state.json and commit
- quality_loop_state is written to state.json when the loop is in progress (for crash recovery)
- quality_loop_state tracks the coder's agent ID (CC only) so `concert-continue` can attempt to resume
- quality_loop_state is cleared when the task completes

**Environment detection:**
- If Task tool is available: Claude Code — spawn subagents with model routing and SendMessage continuation
- If Task tool is not available: GitHub Agents UI — operate in single-agent mode, reading coder/reviewer agent files on demand

**Operating principles:**
- Runner contains ONLY orchestration logic — coder and reviewer behaviors are in separate agent files
- Fresh coder per task, CONTINUED coder across iterations — maximize cache hits within a task
- Fresh reviewer per iteration — keep review context clean
- Orchestrator stays lean — passes file content and paths, does not accumulate subagent output
- State committed after every task — at most one task of work lost on crash
- Failure stops execution immediately — no skipping ahead
- PHASE-SUMMARY updated after each task file, finalized at phase completion

**Boundaries:**
- Does NOT contain coder or reviewer instructions — those live in `concert-coder.md` and `concert-code-reviewer.md`
- Does NOT plan tasks — only executes planned tasks
- Does NOT modify task files
- Does NOT skip the quality loop for any task
- Does NOT modify approved mission documents

## Acceptance Criteria

- [ ] `concert-planner.md` uses `model: balanced` (sonnet), not quality (opus)
- [ ] `concert-planner.md` includes the two-pass execution flow (outline first, then full files)
- [ ] `concert-planner.md` documents why single-agent is preferred over subagents (cache optimization)
- [ ] `concert-planner.md` includes detailed model tier assignment guidelines with downtierring rules
- [ ] `concert-planner.md` includes task file format specification
- [ ] `concert-planner.md` includes dependency DAG validation rules
- [ ] `concert-continue.md` includes the full code quality loop with all decision branches
- [ ] `concert-continue.md` documents coder continuation (SendMessage) across iterations instead of respawning
- [ ] `concert-continue.md` documents why reviewers are fresh-spawned each iteration (different diffs)
- [ ] `concert-continue.md` includes the pre-loading table (what orchestrator reads vs. subagents)
- [ ] `concert-continue.md` references `concert-coder.md` and `concert-code-reviewer.md` (does NOT inline their instructions)
- [ ] `concert-continue.md` includes state management and crash recovery details
- [ ] `concert-continue.md` includes environment detection logic (Task tool presence)
- [ ] `concert-continue.md` includes documentation agent spawning after phase completion
- [ ] Both files follow the agent file format exactly
- [ ] Both files start with the managed header
- [ ] Both files have complete boundaries section

## Skills

- docs/concert/skills/agent-authoring/SKILL.md
