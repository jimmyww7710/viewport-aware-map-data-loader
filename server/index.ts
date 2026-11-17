import express from 'express';

type Point = { id: string; name: string; category: 'A' | 'B' | 'C'; value: number; lat: number; lng: number };
type Line = { id: string; name: string; category: 'A' | 'B' | 'C'; vertices: [number, number][] };
type Bounds = { south: number; west: number; north: number; east: number };

const app = express();
const PORT = 3001;
const bounds = { south: -12, west: 118, north: 8, east: 146 };
const random = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rng = random(202411);
const points: Point[] = Array.from({ length: 200000 }, (_, index) => ({
  id: `point-${index + 1}`,
  name: `Feature ${index + 1}`,
  category: ['A', 'B', 'C'][Math.floor(rng() * 3)] as Point['category'],
  value: Math.round(rng() * 980 + 20),
  lat: bounds.south + rng() * (bounds.north - bounds.south),
  lng: bounds.west + rng() * (bounds.east - bounds.west),
}));
const lines: Line[] = Array.from({ length: 5000 }, (_, index) => {
  let lat = bounds.south + rng() * (bounds.north - bounds.south);
  let lng = bounds.west + rng() * (bounds.east - bounds.west);
  const vertices: [number, number][] = [[lat, lng]];
  for (let vertex = 0; vertex < 3 + Math.floor(rng() * 6); vertex += 1) {
    lat += (rng() - 0.5) * 1.4;
    lng += (rng() - 0.5) * 1.8;
    vertices.push([lat, lng]);
  }
  return { id: `line-${index + 1}`, name: `Route ${index + 1}`, category: ['A', 'B', 'C'][Math.floor(rng() * 3)] as Line['category'], vertices };
});

const parseBounds = (value: string): Bounds => {
  const [west, south, east, north] = value.split(',').map(Number);
  return { west, south, east, north };
};
const inBounds = (lat: number, lng: number, view: Bounds) =>
  lat >= view.south && lat <= view.north && lng >= view.west && lng <= view.east;
const responsePlan = (request: express.Request, response: express.Response, callback: () => void) => {
  const delay = Math.min(3000, Math.max(0, Number(request.query.delay) || 0));
  if (request.query.fail) {
    response.status(Number(request.query.fail)).json({ message: 'Synthetic rate limit: try another viewport.' });
    return;
  }
  setTimeout(callback, delay);
};

app.get('/api/points/clusters', (request, response) => {
  responsePlan(request, response, () => {
    const view = parseBounds(String(request.query.bbox));
    const zoom = Number(request.query.zoom);
    const size = Math.max(0.35, 7 - zoom * 0.38);
    const cells = new Map<string, { lat: number; lng: number; count: number }>();
    points.forEach((point) => {
      if (!inBounds(point.lat, point.lng, view)) return;
      const x = Math.floor(point.lng / size);
      const y = Math.floor(point.lat / size);
      const key = `${x}:${y}`;
      const cell = cells.get(key) ?? { lat: 0, lng: 0, count: 0 };
      cell.lat = (cell.lat * cell.count + point.lat) / (cell.count + 1);
      cell.lng = (cell.lng * cell.count + point.lng) / (cell.count + 1);
      cell.count += 1;
      cells.set(key, cell);
    });
    response.json([...cells.entries()].slice(0, 500).map(([id, cell]) => ({ id: `cluster-${id}`, ...cell })));
  });
});
app.get('/api/points/in-bounds', (request, response) => {
  responsePlan(request, response, () => {
    const view = parseBounds(String(request.query.bbox));
    const result = points.filter((point) => inBounds(point.lat, point.lng, view)).slice(0, 2500);
    response.json(result);
  });
});
app.get('/api/lines/in-bounds', (request, response) => {
  responsePlan(request, response, () => {
    const view = parseBounds(String(request.query.bbox));
    const result = lines.filter((line) => line.vertices.some(([lat, lng]) => inBounds(lat, lng, view))).slice(0, 700);
    response.json(result);
  });
});
app.get('/api/features/:id', (request, response) => {
  const feature = points.find((point) => point.id === request.params.id);
  if (!feature) return response.status(404).json({ message: 'Feature not found.' });
  return response.json(feature);
});
app.listen(PORT, () => console.log(`Synthetic API listening on http://localhost:${PORT}`));
