# Chat UI Spec

## Metadata
- Status: Draft
- Owner: Person 2 Frontend
- Last Updated: 2026-04-24


## Layout
- Primary pane for conversation history with clear latest response emphasis.
- Input region supports touch text entry and quick mode switching to voice.
- Header shows language, connectivity state, and reset affordance.

## Message Behavior
- User turns and CLARA turns visually differentiated.
- Source attribution rendered for factual responses when available.
- Error states use short remediation text with retry/escalate options.

## Interaction Rules
- Disable new turn submit when one active turn is processing.
- On cancel, show explicit cancellation state and return to ready input.

Dependencies: [[WebSocket Contract]], [[Frontend State Flow]]
