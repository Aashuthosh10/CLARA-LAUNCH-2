# Navigation UX

## Metadata
- Status: Draft
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## User Flow
1. User asks destination (department/room/office).
2. CLARA confirms destination match and floor/building.
3. UI shows floorplan path with simple step-by-step instructions.
4. User can replay instructions or ask alternate route.

## UX Principles
- Prioritize clarity over map detail density.
- Show current floor and destination floor clearly.
- Use landmarks users can recognize physically.
- Always provide a fallback text route when path rendering is unavailable.

## Integrations
- Data model: [[rooms.json Spec]]
- Asset strategy: [[Floorplan Strategy]]
- Data readiness: [[Navigation Data Requirements]]
