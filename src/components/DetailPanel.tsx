import type { Point } from '../api/client';
export function DetailPanel({ point, onClose }: { point: Point | null; onClose: () => void }) {
  if (!point) return <div className="empty-detail"><span>↖</span><p>Select a point to inspect its synthetic attributes.</p></div>;
  return <div className="detail"><div className="detail-title"><div><div className="eyebrow">Feature detail</div><h2>{point.name}</h2></div><button onClick={onClose} aria-label="Close detail">×</button></div><div className="detail-grid"><div><span>ID</span><strong>{point.id}</strong></div><div><span>Category</span><strong className={`tag ${point.category.toLowerCase()}`}>{point.category}</strong></div><div><span>Value</span><strong>{point.value}</strong></div><div><span>Latitude</span><strong>{point.lat.toFixed(4)}°</strong></div><div><span>Longitude</span><strong>{point.lng.toFixed(4)}°</strong></div></div></div>;
}
