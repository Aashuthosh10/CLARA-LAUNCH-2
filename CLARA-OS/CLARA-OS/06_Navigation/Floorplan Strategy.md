# Floorplan Strategy

## Metadata
- Status: Draft
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Asset Baseline
Navigation depends on 3 floorplan PNGs representing pilot-relevant levels/blocks.

## Preparation Requirements
- Standardize image orientation and scale assumptions.
- Define coordinate system origin and units per floorplan.
- Mark navigable corridors, stairs/lifts, and restricted zones.

## Runtime Use
- Resolve destination room to floorplan + coordinate target.
- Render route overlay with minimal visual clutter.
- Support non-visual fallback instructions in chat/voice.

Related: [[Navigation Data Requirements]], [[rooms.json Spec]]
