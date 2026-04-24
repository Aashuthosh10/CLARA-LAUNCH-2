# Regression Checklist

## Metadata
- Status: In Review
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Must-Run Paths
- Core kiosk state flow transitions.
- Chat mode request/response lifecycle.
- Voice mode lifecycle including cancel and error recovery.
- Navigation lookup and route display path.
- Department card data render and interaction links.

## Non-Functional
- Latency trends against [[Latency Budget]].
- UI stability under kiosk display and touch usage.
- WS resilience under brief connectivity disruptions.

## Release Gate
All critical regressions must be resolved or explicitly waived in [[Release Status]].
