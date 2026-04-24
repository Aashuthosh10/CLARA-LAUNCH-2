# Voice Pipeline

## Metadata
- Status: In Review
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Voice Turn Flow
1. Capture speech input in selected language.
2. STT transcription via Sarvam.
3. Retrieval + generation via RAG + Groq.
4. TTS synthesis via Sarvam.
5. Frontend playback and state reset.

## Required Guarantees
- No overlapping TTS playback across retries or interruptions.
- No truncation when backend emits completed response audio.
- Cancel action cleanly stops downstream synthesis/playback path.

## Degradation Behavior
- If voice provider fails, keep text answer path alive when possible.
- Emit explicit terminal errors for user-visible recovery messaging.

Validation: [[Voice Pipeline Test Cases]], [[Failure Recovery]]
