# Performance

This document describes how to measure Viewport Atlas performance, what the
current implementation does, and the next optimization opportunities.

## Current performance design

- Viewport data is requested after `moveend` and `zoomend`.
- Requests use a 300 ms idle debounce.
- A new request aborts the previous request with `AbortController`.
- Request identity checks prevent a stale response from replacing newer data.
- Low zoom levels request clusters; zoom 8 and above request individual points.
- The API limits responses to 500 clusters, 2,500 points, and 700 lines.
- The debug overlay reports request, abort, stale-response, rendered-feature,
  loading, and error state.
- The request lab can add synthetic latency from 0 to 2,000 ms and simulate
  HTTP 429 responses.

The demo intentionally uses synthetic data: 200,000 points and 5,000 lines.
The mock server currently evaluates viewport membership by scanning those
arrays for each request.

## Running a manual performance test

Start the application:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, then use the following scenarios.

### Initial load

1. Open the map with both layers enabled.
2. Record the time until the first visible data appears.
3. Check the Network panel for the points/clusters and lines requests.
4. Record response duration, payload size, and returned feature count.

### Rapid pan and zoom

1. Set artificial latency to 1,000–2,000 ms.
2. Pan and zoom repeatedly before requests finish.
3. Confirm that aborted requests and stale responses are reported.
4. Confirm that the visible data always belongs to the latest viewport.

### Rendering load

1. Zoom to 8 or above to display individual points.
2. Test with points enabled and lines disabled.
3. Test with lines enabled and points disabled.
4. Repeat with both layers enabled.
5. Record FPS, long tasks, scripting time, rendering time, and paint time.

### Error and weak-network behavior

1. Enable simulated 429 errors.
2. Confirm that the error state is visible and stale data is not presented as
   the latest response.
3. Use Chrome DevTools Network throttling to test Slow 3G and offline behavior.

### Long-session memory check

1. Take a Chrome Memory heap snapshot before testing.
2. Pan and zoom continuously for 5–10 minutes.
3. Take another snapshot and compare retained Leaflet layers, markers, and
   event handlers.
4. Repeat after forcing garbage collection when DevTools makes that option
   available.

## Recommended measurements

Use Chrome DevTools:

- **Performance:** FPS, long tasks, scripting, rendering, and painting.
- **Network:** request count, duration, status, payload size, and cancellation.
- **Memory:** heap snapshots and retained Leaflet objects.
- **Rendering:** FPS meter and paint flashing.

For each scenario, record:

- first-data-render latency;
- p50 and p95 request latency;
- request, abort, and stale-response counts;
- returned feature count and payload size;
- minimum and average FPS;
- long-task duration;
- heap size before and after a long session.

## Suggested acceptance targets

These are initial targets and should be validated on the supported test
hardware:

| Metric | Initial target |
| --- | ---: |
| First visible data | p95 < 1 second |
| Stable pan/zoom frame rate | >= 55 FPS |
| Long tasks during interaction | < 50 ms |
| Stale data replacing current data | 0 occurrences |
| Heap growth after a 10-minute session | No continuous growth |
| HTTP 429 handling | Visible error state |

## Current gaps

There are no dedicated performance tests or browser automation tests yet.
The existing Vitest script is available for unit tests, but the repository
currently has no `*.test.*` or `*.spec.*` files. The debug overlay also does
not yet record request timings, payload sizes, FPS, long tasks, or heap usage.

## Optimization roadmap

### Priority 0: improve measurement

- Record request start, response, abort, stale, payload-size, and feature-count
  timings.
- Add `performance.mark`/`performance.measure` around request and render
  phases.
- Add FPS and long-task measurements to a development-only diagnostic view.
- Establish repeatable browser scenarios before changing implementation.

### Priority 1: reduce frontend rendering cost

- Use Leaflet Canvas or a WebGL renderer for large point sets.
- Avoid recreating every marker and polyline when only part of the data changes.
- Keep a layer cache and apply incremental additions, removals, and updates.
- Throttle cursor state updates with `requestAnimationFrame`.
- Limit tooltips and click handlers on very large, mostly non-interactive sets.

### Priority 1: reduce backend query cost

- Index points by a fixed spatial grid so a bbox query does not scan all
  200,000 points.
- Precompute clusters for common zoom levels.
- Use an R-tree or another spatial index as the dataset grows.
- Stop expensive work when the client connection has already closed.

### Priority 2: reduce network cost

- Enable gzip or Brotli compression.
- Return only fields required by the active layer.
- Add cache headers or ETags for repeat viewport requests.
- Consider tile-based responses or vector tiles for larger datasets.

## Regression testing

Run the normal checks before and after performance changes:

```bash
npm test
npm run build
```

Performance comparisons should use the same browser, viewport size, dataset,
network profile, latency setting, and interaction script. Compare p95 latency,
minimum FPS, long tasks, payload size, and heap behavior rather than relying
on a single subjective run.
