type Props = { showPoints: boolean; showLines: boolean; setShowPoints: (value: boolean) => void; setShowLines: (value: boolean) => void; };
export function LayerPanel({ showPoints, showLines, setShowPoints, setShowLines }: Props) {
  return <section className="panel-section"><div className="section-label">Visible layers</div>
    <label className="toggle layer-toggle"><input className="layer-checkbox" type="checkbox" checked={showPoints} onChange={(event) => setShowPoints(event.target.checked)} /><span className="swatch cyan" />Points <small>clusters / detail</small></label>
    <label className="toggle layer-toggle"><input className="layer-checkbox" type="checkbox" checked={showLines} onChange={(event) => setShowLines(event.target.checked)} /><span className="swatch amber" />Lines <small>viewport only</small></label>
  </section>;
}
