# CLARA Frontend

React/Vite kiosk UI for CLARA.

## Run

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5176`.

## Environment

Create `frontend/.env.local` only when overriding defaults:

```bash
VITE_WS_URL=ws://localhost:6969/ws/clara
VITE_VOICE_INPUT_MODE=browser
```

`VITE_VOICE_INPUT_MODE=backend` switches mic capture to the backend audio path.
