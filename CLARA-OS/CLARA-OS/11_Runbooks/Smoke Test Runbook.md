# Smoke Test Runbook

## Metadata
- Status: In Review
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Preconditions
- Backend and frontend are running with expected environment variables.
- Test operator has access to pilot test prompts and destination list.

## Execution Order
1. Backend health + websocket contract checks.
2. Core UI flow check (wake, language, chat turn).
3. Voice turn check (including cancel path).
4. Navigation and department lookup spot checks.
5. Error-path check for graceful recovery messaging.

## Completion
- Record pass/fail per step in [[Smoke Test Checklist]].
- Raise blockers in [[Open Blockers]] with owner assignment.
