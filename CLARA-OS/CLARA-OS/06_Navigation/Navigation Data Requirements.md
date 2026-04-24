# Navigation Data Requirements

## Metadata
- Status: Draft
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Needed From Floorplan Inputs
- Final 3 PNGs with locked dimensions and orientation.
- Room anchor coordinates (`x`,`y`) for all pilot destinations.
- Corridor connectivity assumptions (graph edges) for route generation.
- Landmark labels for human-readable guidance.

## Needed From Content Team
- Canonical room names and common spoken aliases.
- Department-to-room mappings for office lookup intents.
- Restricted/unavailable areas to avoid routing into.

## Acceptance Criteria
- 100% of pilot-critical destinations are mappable.
- Route instructions validated by on-site walkthrough for top destinations.

Related: [[Floorplan Strategy]], [[rooms.json Spec]], [[Pilot Acceptance Test]]
