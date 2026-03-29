---
name: "code-review"
description: "Wrapper for the code-review skill workflow. Use when: reviewing changes, finding risk, and creating follow-up requirement threads."
argument-hint: "[scope]"
agent: "Vibe Agent Orchestrator"
---

Run a structured code review over the requested scope.

Workflow:
1. Parse optional review scope.
2. Load and follow the `code-review` skill priorities and output format.
3. Report evidence-backed findings ordered by severity.
4. Create requirement threads for unresolved issues when needed.

Constraints:
- Prioritize correctness, security, reliability, tests, and maintainability.
- Provide concrete evidence and minimal actionable recommendations.
- Distinguish must-fix findings from optional improvements.
