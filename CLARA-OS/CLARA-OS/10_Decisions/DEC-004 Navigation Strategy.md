# DEC-004 Navigation Strategy

## Metadata
- Status: Approved
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Decision
Use 3 floorplan PNG assets with coordinate-based room mapping and simple route instruction overlays.

## Rationale
- Fast implementation with predictable rendering behavior.
- Sufficient for pilot building scope without heavy GIS complexity.

## Implications
- Requires strict data quality in `rooms.json`.
- Route quality depends on room coordinate and corridor graph accuracy.
