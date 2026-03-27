# /concert:accept [stage]

Accept the current stage's plan, create project-level spec, finalize the stage.

## Steps

1. Read `docs/concert/state.json` → get current stage, mission_path, workflow_path
2. Read the active workflow file to determine the next stage after acceptance
3. If `[stage]` is provided, accept that stage; otherwise accept the current stage
4. Mark the current stage as "accepted" in `state.json` → `pipeline`
5. Create or update the project-level spec file:
   - `vision` accepted → write `docs/concert/VISION-SPEC.md`
   - `requirements` accepted → write `docs/concert/REQUIREMENTS-SPEC.md`
   - `architecture` accepted → write `docs/concert/ARCHITECTURE-SPEC.md`
   - `ux` accepted → write `docs/concert/UX-SPEC.md`
   - `tasks` accepted → no spec, just mark as accepted
6. Update `state.json` with the accepted status (do NOT advance to the next stage — that is the job of `/concert:continue`)
7. Update human status display (WIP PR body)
8. Commit the spec file and state changes
9. Show current status (what was just accepted)

## Next Steps

After accept, output:
```
📋 Next steps:
  → Continue to next stage:  /concert:continue
  → Check status:            /concert:status
```

**Important:** Accept does NOT advance to the next stage or start it. It only finalizes the current stage. The user explicitly runs `/concert:continue` to begin the next stage.
