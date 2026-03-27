# /concert:continue

Resume from where the last session stopped, or advance to the next stage after acceptance.

## Steps

1. Read `docs/concert/state.json` — this is your ONLY source of truth
2. Read the active workflow file (from `workflow_path`)
3. Assess the current state and determine the next action:
   - If no mission exists → output "No active mission. Start one with `/concert:init`"
   - If a planning stage was just accepted (stage status is "accepted" but pipeline has not advanced) → advance to the next planning stage per the workflow, run the appropriate consultant agent, update state.json
   - If tasks were just accepted → advance to execution stage, update state.json, but do NOT auto-run execution — just update state and show next steps
   - If in execution mid-task → resume that task from the last commit
   - If in execution between tasks → start the next task
   - If in execution between task files → start the next task file
   - If in execution between phases → check if planning needed, then execute
   - If all phases done → run verification
   - If there's a `failure` block → assess if continuable or needs debugging
   - If there are `blockers[]` → report them and suggest resolution
4. Execute the determined action following workflow rules
5. Spawn the appropriate agent if needed (see `docs/concert/agents/concert-continue.md`)
6. Update `state.json` continuously (advance `stage` field to the new stage)
7. On completion or session end, update state with clear next steps

## Next Steps

Output is context-dependent:

For planning stages (after advancing and running the consultant):
```
📋 Next steps:
  → Review the plan:   /concert:review
  → Accept the plan:   /concert:accept
  → Check status:      /concert:status
```

For execution (after advancing to execution stage):
```
📋 Next steps:
  → Start execution:    /concert:run
  → Check status:       /concert:status
```

For mid-execution resume:
Output is determined by the continue agent based on current state.
