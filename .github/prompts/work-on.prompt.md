---
name: "work-on"
description: "Work on a specific requirement until it reaches its next status. Use when: iteratively implementing a requirement and advancing it through the lifecycle."
argument-hint: "<REQ-ID> [target-status]"
agent: "Vibe Agent Orchestrator"
---

Work on a requirement by implementing its spec until the next lifecycle status is reached.

Workflow:
1. Parse required `REQ-ID` and optional `target-status` from arguments. Validate format (`REQ-<digits>`). If `target-status` is provided, validate it is a known status.
2. Read `.requirement-manifest.json` and look up the requirement's current status.
3. **Determine the next status** using the lifecycle transition map (or use the explicit `target-status` if provided):
   - PROPOSED → IN_PROGRESS
   - IN_PROGRESS → CODE_REVIEW
   - CODE_REVIEW → MERGED
   - MERGED → DEPLOYED
   - BLOCKED → IN_PROGRESS
   - BACKLOG → IN_PROGRESS
   If the current status is DEPLOYED or CANCELLED, report that the requirement is in a terminal state and stop.
4. **Check worktree**: Read `.worktree-manifest.json` and verify the requirement has an active worktree.
   - If the requirement is PROPOSED (or BACKLOG) and has no worktree, **auto-invoke `/start-work <REQ-ID>`** to create the worktree and advance to IN_PROGRESS, then continue from step 5.
   - If the requirement is in any other status and has no worktree, tell the user to run `/start-work <REQ-ID>` first and stop.
5. **Load the spec**: Find the requirement spec file in `docs/requirements/` matching the `REQ-ID`. Read Description, Success Criteria, Technical Notes, and Development Plan.
6. **Iterate on implementation**:
   - Follow the Development Plan steps in order.
   - For each step, implement the required changes in the worktree.
   - After each step, check the Success Criteria — mark items done as they are satisfied.
   - Continue until all Success Criteria are met or the user intervenes.
7. **Confirm before advancing**: Once all criteria appear met, ask the user whether to advance the status. Do not auto-advance without confirmation.
8. **Advance status**: Run `scripts/update-requirement-status.sh <REQ-ID> <next-status>` to persist the transition.
9. **Regenerate docs**: Run `scripts/regenerate-docs.sh` to keep REQUIREMENTS.md, STATUS.md, ROADMAP.md, and DEPENDENCIES.md in sync.
10. Summarize what was done and the new status.

Constraints:
- If the requirement does not exist in the manifest, report the error and stop.
- If the requirement is in a terminal status (DEPLOYED, CANCELLED), explain that there is no next status and stop.
- If there is no active worktree and the requirement is PROPOSED or BACKLOG, auto-invoke `/start-work` to bootstrap it. For other statuses without a worktree, suggest `/start-work` and stop.
- Never skip the user confirmation step before advancing status.
- Surface any script failures exactly.
- If the spec is too vague to determine completion, ask clarifying questions rather than guessing.
