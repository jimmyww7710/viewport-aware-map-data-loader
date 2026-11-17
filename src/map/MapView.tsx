import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Bounds, Cluster, Line, Point } from '../api/client';

type Props = {
  points: Point[]; clusters: Cluster[]; lines: Line[]; showPoints: boolean; showLines: boolean;
  onMove: (bounds: Bounds, zoom: number) => void; onCursor: (lat: number, lng: number) => void; onSelect: (point: Point) => void;
  onCluster: (cluster: Cluster) => void;
};
const color = (category: string) => ({ A: '#67e8f9', B: '#fbbf24', C: '#fb7185' })[category] ?? '#fff';
export function MapView({ points, clusters, lines, showPoints, showLines, onMove, onCursor, onSelect, onCluster }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map>();
  const layers = useRef<L.LayerGroup[]>([]);
  useEffect(() => {
    if (!root.current) return;
    const instance = L.map(root.current, { zoomControl: false, minZoom: 3, maxZoom: 12 }).setView([-2, 132], 5);
    L.control.zoom({ position: 'bottomright' }).addTo(instance);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', opacity: 0.65 }).addTo(instance);
    const reportViewport = () => {
      const bounds = instance.getBounds();
      onMove({
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast(),
      }, instance.getZoom());
    };
    instance.on('moveend zoomend', reportViewport);
    reportViewport();
    instance.on('mousemove', (event: L.LeafletMouseEvent) => onCursor(event.latlng.lat, event.latlng.lng));
    map.current = instance;
    return () => { instance.remove(); };
  }, [onCursor, onMove]);
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    layers.current.forEach((layer) => layer.remove());
    const pointLayer = L.layerGroup();
    if (showPoints) {
      clusters.forEach((cluster) => L.circleMarker([cluster.lat, cluster.lng], { radius: Math.min(28, 8 + Math.log10(cluster.count) * 8), color: '#67e8f9', fillColor: '#0e7490', fillOpacity: 0.85, weight: 2 }).bindTooltip(`${cluster.count.toLocaleString()} features`).on('click', () => {
        instance.setView([cluster.lat, cluster.lng], Math.min(instance.getZoom() + 2, 8));
        onCluster(cluster);
      }).addTo(pointLayer));
      points.forEach((point) => L.circleMarker([point.lat, point.lng], { radius: 4, color: color(point.category), fillColor: color(point.category), fillOpacity: 0.9, weight: 1 }).bindTooltip(point.name).on('click', () => onSelect(point)).addTo(pointLayer));
    }
    const lineLayer = L.layerGroup();
    if (showLines) lines.forEach((line) => L.polyline(line.vertices, { color: '#fbbf24', opacity: 0.7, weight: 2 }).bindTooltip(line.name).addTo(lineLayer));
    pointLayer.addTo(instance); lineLayer.addTo(instance); layers.current = [pointLayer, lineLayer];
  }, [clusters, lines, onCluster, onSelect, points, showLines, showPoints]);
  return <div ref={root} className="map" />;
}
