# Smart Fish Aquarium — Core Layout & Live Dashboard

Single-page, card-based dashboard built with React, Tailwind CSS, Framer Motion, and Recharts. Part 1 focuses on Core Layout & Live Dashboard with mock live updates every 2 seconds, ready to switch to real MQTT/WebSocket or REST polling.

## Stack

- React + Vite
- Tailwind CSS (dark mode via `class`)
- Framer Motion (animations)
- Recharts (charts placeholder)

## Getting Started

- `npm install`
- `npm run dev`
- Open `http://localhost:5173/`.

## Live Data Modes

- Mock: Default. Generates realistic sensor noise every 2s.
- WS: Subscribes to WebSocket at `VITE_WS_URL` (e.g., `ws://localhost:8080/ws`). Fallbacks to `poll` if not available.
- Poll: Fetches `/api/v1/live` every 2s.

Use the “Mode” select in the header to switch between `mock | ws | poll`.

## Data Contract (Examples)

- Live payload (MQTT/WS): topic `aquarium/sensors/water`
  ```json
  { "ph":7.23,"tds":220,"do":6.4,"ntu":4.2,"temp":26.1,"ts":"2025-11-09T10:12:00Z" }
  ```
- Level topic: `aquarium/sensors/lvl`
  ```json
  { "cm":12.3, "ts":"..." }
  ```
- Actuator state: `aquarium/actuators/state`
  ```json
  {"pump":0,"filter":1,"air":0,"heater":0,"uv":0,"lights":1,"feeder":0,"ts":"..."}
  ```
- Command endpoint (frontend → backend): `POST /api/v1/cmd`
  ```json
  { "device":"pump", "state":1 }
  ```

## Tailwind & Theming

- Dark mode toggled via button in header; applies class to `<html>`.
- Subtle ocean-themed background using gradient; components use soft shadows and rounded corners.

## Components

- `VitalsCard`: Large value + unit, last updated time, colored indicator, subtle pulse on change.
- `StatusChip`: ON/OFF state with “changed X min ago”, toggle posts command with optimistic UI.
- `CameraPanel`: ESP32-CAM placeholder with AI badges and “view live”.
- `QuickActions`: Feed now, Sanitize UV, Refill, Toggle relays — posts `/api/v1/cmd` and shows spinner.
- `AlertsBar`: Horizontal chips; click to open detail panel.
- `FeedWidget`: “Last fed” and next scheduled feed; recommendation line.

## Environment

- Set `VITE_WS_URL` for real WebSocket.
- Backend routes expected:
  - `POST /api/v1/cmd` — body `{ device, state }`
  - `GET /api/v1/live` — combined live payload for polling.

## Accessibility & Responsiveness

- Aria labels on interactive items; keyboard focus ring via Tailwind utilities.
- Responsive grid: desktop 3–4 columns, tablet 2, mobile 1.

## Notes

- Part 1 does not implement backend logic; command POSTs are placeholders.
- Animations are subtle to maintain clarity.

---

# Part 2 — Trends, Automations, AI & Notifications

This extends the app with history charts, automations UI, AI event center, calibration wizards, notifications, and mock backend API hooks.

## New UI Components

- `HistoryChart`: Multi-metric chart with time ranges, dual axes, tooltips, brush, and event overlays.
- `MiniSparkline`: Compact sparklines re-using history data.
- `RulesEditor`: Create/edit rules (conditions, actions, hysteresis, min runtimes).
- `RuleSimulator`: Preview/dry-run over past windows returning simulated actions.
- `AIEventViewer`: Paginated list of vision events with thumbnails and suggested actions.
- `VisionSettings`: Enable detection, sensitivity slider, zone overlays (surface/mid/bottom).
- `CalibrationWizard`: Guided steps for metrics; stores coefficients.
- `NotificationsPanel`: Configure recipients/channels/templates and send test notifications.

## Mock Backend (Dev Server)

The Vite dev server provides mock endpoints defined in `vite.config.js`:

- `GET /api/v1/history?metric=ph&from=ISO&to=ISO` → `{ metric, points: [{ ts, value }] }`
- `GET /api/v1/rules`, `POST /api/v1/rules` (upsert)
- `POST /api/v1/rules/simulate` → `{ actions: [{ ts, device, state }] }`
- `GET/POST /api/v1/ai/events`
- `POST /api/v1/predict` → `{ unsafe_prob, recommendation }`
- `POST /api/v1/calibrate/{metric}` → `{ ok: true }`
- `POST /api/v1/notify/test` → `{ ok: true }`

These endpoints are for development only and mirror the intended backend contract.

## Data & Schema Docs

- OpenAPI spec: `openapi.yaml` documents endpoints and simple schemas.
- Event schema example:
  ```json
  {"type":"gasping","score":0.92,"frame":"s3://...jpg","ts":"...","bbox":[{"x":0.1,"y":0.2,"w":0.2,"h":0.2}]}
  ```

## Integration Notes

- Replace dev server mocks with real REST/MQTT services in production.
- Timeseries DB suggestions: InfluxDB/Timescale for metrics; relational DB for rules/config/events.
- Tables/measurements: metrics(ts, metric, value), events(ts,type,meta), actuator_logs, rules, calibrations.
- Retention: raw 30d, downsampled aggregates retained.
- Security: JWT auth, roles, rate-limits; MQTT watchdog/last-will for offline alerts; enforce hardware interlocks server-side.

## Dev UX

- Mock data generators seed 30 days of points (5-min cadence) for history.
- Consistent schemas surface events in chart overlays and rule simulations.
- Sample Postman collection can be created from `openapi.yaml`.
