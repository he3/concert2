---
task: "agent-planner-runner"
title: "Write agent definitions for concert-planner and concert-runner"
depends_on: ["default-state-and-config"]
wave: 1
model: sonnet
---

## Objective

Write the full agent definition markdown files for `concert-planner` (the task decomposer) and `concert-runner` (the execution orchestrator). These are the two most complex agents in Concert — the planner decomposes approved plans into executable task files with model-tier optimization, and the runner orchestrates the full code quality loop (orchestrator-coder-reviewer) for each task.

## Files

- `templates/docs/concert/agents/concert-planner.md`
- `templates/docs/concert/agents/concert-runner.md`

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
- `model: quality`
- `interactive_only: false`

**Role:** Senior engineering manager who decomposes a project into executable task files. The planner reads all approved mission documents, deeply understands the codebase, and produces a task plan optimized for cost efficiency through aggressive model tier downtierring.

**Execution flow (must be very detailed — this is the orchestration brain):**
1. Read state.json — verify all required stages are accepted (varies by workflow)
2. Read all mission docs: VISION.md, REQUIREMENTS.md, ARCHITECTURE.md, UX.md (if present)
3. Read existing *-SPEC.md files and deeply scan codebase
4. Design phases: logical groupings of related work, numbered 01-NN
5. Within each phase, design waves: dependency ordering within a phase
6. For each task file:
   - Name: `TASK-YYYY-MM-DD-<slug>-<model>.md`
   - YAML frontmatter: task, title, depends_on, wave, model
   - Body: Objective, Files (exact paths), Requirements (FR/NFR IDs), Tests (or Detailed Instructions for haiku), Acceptance Criteria, Skills
7. Model tier assignment:
   - Default to haiku — add extra detail (exact code, step-by-step instructions) to make it viable
   - Promote to sonnet only when: business logic reasoning, nuanced test writing, multi-file coordination, or complex patterns that haiku cannot handle even with detailed instructions
   - Promote to opus only when: security-critical, complex algorithms, architectural decisions
   - For each non-haiku assignment, document the rationale in a comment
8. Create `phases/` directory structure with numbered phase directories
9. Update state.json: `pipeline.tasks = "planned"`, `phases_total`, `tasks_total`
10. Commit and output summary with phase/task counts and next steps

**User guidance:**
- Task files for haiku include "Detailed Instructions" with explicit code snippets, exact file paths, and step-by-step implementation guides
- Task files for sonnet/opus use "Implementation" or "Requirements" sections that describe intent rather than exact code
- Dependencies between task files must form a valid DAG (no cycles)
- Max tasks per file: respect `execution.max_tasks_per_file` from concert.jsonc
- Max files per phase: respect `execution.max_files_per_phase` from concert.jsonc

**Operating principles:**
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

### concert-runner.md

**Frontmatter:**
- `name: concert-runner`
- `description: Execution orchestrator — runs the code quality loop for each task`
- `tools: Read, Write, Edit, Bash, Glob, Grep, Task`
- `model: balanced`
- `interactive_only: false`

**Role:** Execution orchestrator that manages the code quality loop. Keeps its own context to ~15% of the window. Spawns fresh subagents (coder, reviewer) for each task. Manages state transitions, telemetry, and failure handling.

**Execution flow (critical — this is the runtime engine):**
1. Read state.json for execution position (current_phase, current_task_file, current_task_index)
2. Read the current phase's task files in wave order
3. For each task:
   a. Read task frontmatter for model tier
   b. Resolve model tier via `concert.jsonc` → `task_models`
   c. Load applicable skills from task's Skills section
   d. **Spawn Coder subagent** with: task file path, skill paths, model tier
      - Coder reads task, implements TDD (tests first, then implement, then verify)
      - Coder commits with conventional commit format
      - Coder returns: commit SHA, confidence level, files changed
   e. **Spawn Reviewer subagent** with: task file path, diff (from coder's commit), model = balanced
      - Reviewer reads task spec, reviews diff against acceptance criteria
      - Reviewer rates findings: CRIT, MAJ, MIN, NTH, or PASS
      - Reviewer returns structured findings
   f. **Quality loop decision:**
      - PASS (zero findings): proceed to next task
      - Any findings exist AND iteration < max_review_iterations: spawn Coder again with findings
      - After max iterations with only MIN/NTH remaining: proceed with success
      - After max iterations with CRIT/MAJ remaining: stop with failure
   g. Update state.json: tasks_completed++, telemetry record, history entry
   h. Update PHASE-SUMMARY
4. After all tasks in phase:
   a. Spawn Documentation Agent to update higher-level docs
   b. Mark phase complete
   c. Update WIP PR body
5. On failure: write failure block to state.json, stop immediately

**State management detail:**
- After each task completion: update state.json and commit
- quality_loop_state is written to state.json when the loop is in progress (for crash recovery)
- quality_loop_state is cleared when the task completes
- The orchestrator passes file paths to subagents, not file contents (context efficiency)

**Environment detection:**
- If Task tool is available: Claude Code — spawn subagents with model routing
- If Task tool is not available: GitHub Agents UI — operate as single-agent (orchestrator acts as coder and reviewer in sequence)

**Operating principles:**
- Fresh subagent per task — no context accumulation from prior tasks
- State committed after every task — at most one task of work lost on crash
- Failure stops execution immediately — no skipping ahead
- PHASE-SUMMARY updated after each task file, finalized at phase completion

**Boundaries:**
- Does NOT plan tasks — only executes planned tasks
- Does NOT modify task files
- Does NOT skip the quality loop for any task
- Does NOT modify approved mission documents

## Acceptance Criteria

- [ ] `concert-planner.md` includes detailed model tier assignment guidelines with downtierring rules
- [ ] `concert-planner.md` includes task file format specification
- [ ] `concert-planner.md` includes dependency DAG validation rules
- [ ] `concert-runner.md` includes the full code quality loop with all decision branches
- [ ] `concert-runner.md` includes state management and crash recovery details
- [ ] `concert-runner.md` includes environment detection logic
- [ ] `concert-runner.md` includes documentation agent spawning after phase completion
- [ ] Both files follow the agent file format exactly
- [ ] Both files start with the managed header
- [ ] Both files have complete boundaries section

## Skills

- docs/concert/skills/agent-authoring/SKILL.md
