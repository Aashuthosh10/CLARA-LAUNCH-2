# rooms.json Spec

## Metadata
- Status: Draft
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Purpose
Provide canonical room/location metadata for lookup, routing, and UI display.

## Required Fields
- `id`: stable canonical room identifier
- `name`: display name
- `aliases`: alternate names users may ask
- `building`
- `floor`
- `x`, `y`: coordinate on floorplan image
- `type`: office/classroom/lab/service
- `department`: optional owning department key

## Optional Fields
- `landmark`
- `notes`
- `isPublic`

## Validation Rules
- IDs must be unique and stable.
- Coordinates must be within floorplan bounds.
- Aliases cannot collide ambiguously without explicit priority rule.

See: [[Navigation UX]], [[Department Content Mapping]]
