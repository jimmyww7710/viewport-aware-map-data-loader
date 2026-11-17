import { useCallback, useRef, useState } from 'react';
import type { Bounds, Cluster, Line, Point } from './api/client';
import { getClusters, getLines, getPoints } from './api/client';
import { MapView } from './map/MapView';
import { useViewportLayer } from './map/useViewportLayer';
import { LayerPanel } from './components/LayerPanel';
import { DetailPanel } from './components/DetailPanel';
import { DebugOverlay } from './debug/DebugOverlay';
import './styles.css';

export default function App() {
  const [points, setPoints] = useState<Point[]>([]); const [clusters, setClusters] = useState<Cluster[]>([]); const [lines, setLines] = useState<Line[]>([]);
  const [showPoints, setShowPoints] = useState(true); const [showLines, setShowLines] = useState(true); const [selected, setSelected] = useState<Point | null>(null);
  const [delay, setDelay] = useState(650); const [fail, setFail] = useState(false); const [stats, setStats] = useState({ requests: 0, aborted: 0, stale: 0 }); const [viewportVersion, setViewportVersion] = useState(0);
  const viewport = useRef({ bounds: { south: -12, west: 118, north: 8, east: 146 } as Bounds, zoom: 5 });
  const getViewport = useCallback(() => viewport.current, []);
  const loadPoints = useCallback((bounds: Bounds, zoom: number, signal: AbortSignal): Promise<(Cluster | Point)[]> => zoom >= 8 ? getPoints(bounds, signal, delay, fail) : getClusters(bounds, zoom, signal, delay, fail), [delay, fail]);
  const loadLines = useCallback((bounds: Bounds, _zoom: number, signal: AbortSignal) => getLines(bounds, signal, delay, fail), [delay, fail]);
  const track = useCallback((metric: { request: boolean; aborted: boolean; stale: boolean }) => setStats((current) => ({ requests: current.requests + (metric.request ? 1 : 0), aborted: current.aborted + (metric.aborted ? 1 : 0), stale: current.stale + (metric.stale ? 1 : 0) })), []);
  const updatePoints = useCallback((data: (Cluster | Point)[]) => {
    if (data.length && 'count' in data[0]) {
      setClusters(data.filter((item): item is Cluster => 'count' in item));
      setPoints([]);
    } else {
      setPoints(data.filter((item): item is Point => 'name' in item));
      setClusters([]);
    }
  }, []);
  const updateLines = useCallback((data: Line[]) => setLines(data), []);
  const handleMove = useCallback((bounds: Bounds, zoom: number) => {
    viewport.current = { bounds, zoom };
    setViewportVersion((version) => version + 1);
  }, []);
  const handleCursor = useCallback((lat: number, lng: number) => setCursor(`${lat.toFixed(2)}°, ${lng.toFixed(2)}°`), []);
  const handleSelect = useCallback((point: Point) => setSelected(point), []);
  const handleCluster = useCallback(() => undefined, []);
  const pointsState = useViewportLayer(showPoints, getViewport, loadPoints, updatePoints, track, 300, viewportVersion);
  const linesState = useViewportLayer(showLines, getViewport, loadLines, updateLines, track, 300, viewportVersion);
  const total = clusters.length + points.length + lines.length;
  const [cursor, setCursor] = useState('—');
  const statusText = pointsState.error || linesState.error || 'Synthetic ocean / desert bounding box';
  return <main className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark">✦</div><div><div className="brand-name">Viewport Atlas</div><div className="brand-sub">A viewport-first map loading lab</div></div></div><div className="top-actions"><span className="live"><i /> synthetic data</span><button className="outline-button" onClick={() => window.open('https://github.com', '_blank')}>View source ↗</button></div></header>
    <div className="workspace"><aside className="sidebar"><div className="sidebar-intro"><div className="eyebrow">INTERACTIVE DEMO</div><h1>Only load<br /><em>what you see.</em></h1><p>Explore a map that fetches synthetic features only when the viewport settles. Zoom out for clusters. Zoom in for detail.</p></div><LayerPanel showPoints={showPoints} showLines={showLines} setShowPoints={setShowPoints} setShowLines={setShowLines} /><section className="panel-section"><div className="section-label">Request lab</div><label className="range-label">Artificial latency <output>{delay}ms</output></label><input type="range" min="0" max="2000" step="50" value={delay} onChange={(event) => setDelay(Number(event.target.value))} /><label className="toggle compact"><input type="checkbox" checked={fail} onChange={(event) => setFail(event.target.checked)} /><span className="switch" />Simulate 429 errors</label><p className="hint">Make the delay high, then pan quickly to see stale responses get dropped.</p></section><div className="sidebar-foot"><span>Cursor</span><strong>{cursor}</strong></div></aside><section className="map-stage"><MapView points={points} clusters={clusters} lines={lines} showPoints={showPoints} showLines={showLines} onMove={handleMove} onCursor={handleCursor} onSelect={handleSelect} onCluster={handleCluster} /><div className="map-caption"><span>{statusText}</span><span>Zoom threshold <b>8</b></span></div><DebugOverlay requests={stats.requests} aborted={stats.aborted} stale={stats.stale} markerCount={total} loading={pointsState.loading || linesState.loading} error={pointsState.error || linesState.error} /><div className="scale"><div className="scale-line" /><span>500 km</span></div></section><aside className="details"><DetailPanel point={selected} onClose={() => setSelected(null)} /><div className="how-it-works"><div className="eyebrow">THE LOOP</div><div className="step"><b>01</b><span>Viewport settles</span></div><div className="step"><b>02</b><span>Previous request aborts</span></div><div className="step"><b>03</b><span>Latest response wins</span></div></div></aside></div>
  </main>;
}
