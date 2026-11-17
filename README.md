# Viewport Atlas

Viewport Atlas is a small public demo of viewport-driven map loading with entirely synthetic data.

## What it demonstrates

- Clustered points at low zoom and individual points at high zoom.
- Lines and points are requested only for the active viewport.
- A 300 ms idle debounce, `AbortController` cancellation, and request-identity stale-response protection.
- Bounded marker rendering, explicit loading/error states, and a live request debug overlay.
- Cursor/status UI and a scale-bar treatment without an API key.

The map uses OpenStreetMap tiles and a made-up ocean/desert bounding box. No real locations, company names, or work data are included.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Use the latency slider and the 429 switch to make the race-condition behavior easy to observe.

## The stale-response guard

```text
moveend / zoomend
       |
   300 ms idle
       |
abort previous request ----> request N gets a unique identity
       |                                  |
       +------------------------------> response
                                          |
                          identity === latest?  -- no --> drop
                                          |
                                      swap layer
```

The important check is identity, not response timing. A slow response from an earlier viewport can never overwrite the latest result.

## Trade-off record

See [`TRADEOFFS.md`](./TRADEOFFS.md) for the major implementation choices.

## Performance

See [`PERFORMANCE.md`](./PERFORMANCE.md) for the performance testing procedure,
current implementation, bottlenecks, and optimization roadmap.

## Publishing checklist

- [x] Synthetic data only.
- [x] No API keys or environment files.
- [x] Fresh project with no work repository history.
- [ ] Record real heap measurements after a manual 20-toggle drill before publishing.
