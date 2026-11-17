export type Bounds = { south: number; west: number; north: number; east: number };
export type Cluster = { id: string; lat: number; lng: number; count: number };
export type Point = { id: string; name: string; category: 'A' | 'B' | 'C'; value: number; lat: number; lng: number };
export type Line = { id: string; name: string; category: 'A' | 'B' | 'C'; vertices: [number, number][] };

const query = (bounds: Bounds) => `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
export async function fetchJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal });
  if (!response.ok) throw new Error((await response.json()).message ?? `Request failed (${response.status})`);
  return response.json() as Promise<T>;
}
export const getClusters = (bounds: Bounds, zoom: number, signal: AbortSignal, delay: number, fail: boolean) =>
  fetchJson<Cluster[]>(`/api/points/clusters?bbox=${query(bounds)}&zoom=${zoom}&delay=${delay}${fail ? '&fail=429' : ''}`, signal);
export const getPoints = (bounds: Bounds, signal: AbortSignal, delay: number, fail: boolean) =>
  fetchJson<Point[]>(`/api/points/in-bounds?bbox=${query(bounds)}&delay=${delay}${fail ? '&fail=429' : ''}`, signal);
export const getLines = (bounds: Bounds, signal: AbortSignal, delay: number, fail: boolean) =>
  fetchJson<Line[]>(`/api/lines/in-bounds?bbox=${query(bounds)}&delay=${delay}${fail ? '&fail=429' : ''}`, signal);
