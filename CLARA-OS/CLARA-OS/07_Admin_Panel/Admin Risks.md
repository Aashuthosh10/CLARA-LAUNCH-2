# Admin Risks

## Metadata
- Status: Draft
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Key Risks
- Over-permissive controls can introduce unsafe knowledge changes.
- Missing audit trail makes incident root-cause hard.
- Slow panel performance can block support workflow during pilot.
- Poor filtering can hide critical session failures.

## Mitigations
- Ship strict admin-lite permissions and explicit action logging.
- Define non-negotiable audit fields for every update action.
- Keep scope narrow until pilot data justifies expansion.

Related: [[Admin Lite Scope]], [[Failure Recovery]]
