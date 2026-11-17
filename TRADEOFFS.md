# Trade-off record

## 2026-11-17 — Express mock API instead of Vite middleware

The mock API runs as a small Express process beside Vite. Vite middleware would reduce the process count, but a separate server keeps the API contract visible and makes the synthetic delay, rate-limit response, and seeded dataset easy to inspect or replace. The cost is one extra dev process, handled by `concurrently`.

## 2026-11-17 — Leaflet layer groups instead of a canvas/WebGL renderer

Leaflet was chosen because it is dependency-light, has no API-key requirement, and makes the viewport lifecycle easy to explain in a portfolio demo. Canvas or WebGL would render more points efficiently, but would obscure the cancellation and cleanup story that this demo is intended to teach.

## 2026-11-17 — Leaflet-reported viewport state

The map reports `getBounds()` and `getZoom()` after initialization and after each completed move or zoom. The app stores that snapshot and uses it for the debounced data requests, keeping the requested point, cluster, and line data aligned with the visible map. The trade-off is that requests wait for the viewport to settle rather than updating continuously during a gesture.
