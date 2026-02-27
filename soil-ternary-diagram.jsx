import { useState, useRef, useCallback, useEffect } from "react";

// USDA Soil Texture Classes with polygon vertices [clay, silt, sand] (fractions 0-1)
const TEXTURE_CLASSES = [
  {
    name: "Clay",
    color: "#8B4513",
    description: "≥40% clay, ≤45% sand, ≤40% silt",
    vertices: [
      [0.4, 0.6, 0.0],[0.4, 0.0, 0.6],[1.0, 0.0, 0.0],[1.0, 0.0, 0.0]
    ],
    // Simplified check
    check: (c, si, sa) => c >= 0.4 && si <= 0.4 && sa <= 0.45,
  },
  {
    name: "Sandy Clay",
    color: "#CD5C5C",
    description: "≥35% clay, ≥45% sand",
    check: (c, si, sa) => c >= 0.35 && sa >= 0.45,
  },
  {
    name: "Silty Clay",
    color: "#9370DB",
    description: "≥40% clay, ≥40% silt",
    check: (c, si, sa) => c >= 0.4 && si >= 0.4,
  },
  {
    name: "Sandy Clay Loam",
    color: "#E8836B",
    description: "20-35% clay, <28% silt, ≥45% sand",
    check: (c, si, sa) => c >= 0.2 && c < 0.35 && si < 0.28 && sa >= 0.45,
  },
  {
    name: "Clay Loam",
    color: "#C8764A",
    description: "27-40% clay, 15-55% silt, ≤45% sand",
    check: (c, si, sa) => c >= 0.27 && c < 0.4 && si >= 0.15 && si <= 0.55 && sa <= 0.45,
  },
  {
    name: "Silty Clay Loam",
    color: "#B57ED6",
    description: "27-40% clay, ≥40% silt",
    check: (c, si, sa) => c >= 0.27 && c < 0.4 && si >= 0.4,
  },
  {
    name: "Sandy Loam",
    color: "#F4C06F",
    description: "<20% clay, <30% silt, ≥52% sand (or 7-20% clay + 52% sand)",
    check: (c, si, sa) => {
      if (c < 0.07 && si < 0.5 && sa >= 0.43 && (si + 1.5 * c) < 0.15) return false; // sand
      if (c < 0.2 && sa >= 0.52 && (si + 1.5 * c) >= 0.15) return true;
      if (c >= 0.07 && c < 0.2 && si < 0.28 && sa >= 0.52) return true;
      return false;
    },
  },
  {
    name: "Loam",
    color: "#90C978",
    description: "7-27% clay, 28-50% silt, <53% sand",
    check: (c, si, sa) => c >= 0.07 && c < 0.27 && si >= 0.28 && si < 0.50 && sa < 0.53,
  },
  {
    name: "Silt Loam",
    color: "#6DB5B5",
    description: "<27% clay, ≥50% silt",
    check: (c, si, sa) => c < 0.27 && si >= 0.50 && (c < 0.12 || si >= 0.60),
  },
  {
    name: "Silt",
    color: "#4BABC0",
    description: "<12% clay, ≥80% silt",
    check: (c, si, sa) => c < 0.12 && si >= 0.80,
  },
  {
    name: "Sand",
    color: "#F5E06A",
    description: "<10% clay, <15% silt, ≥85% sand",
    check: (c, si, sa) => c < 0.1 && si < 0.15 && sa >= 0.85,
  },
  {
    name: "Loamy Sand",
    color: "#E8D070",
    description: "<12% clay, 70-90% sand",
    check: (c, si, sa) => sa >= 0.70 && sa < 0.85 && c < 0.15,
  },
];

function classifyTexture(clay, silt, sand) {
  // Priority order matters
  const order = [
    "Clay","Silty Clay","Sandy Clay",
    "Silty Clay Loam","Clay Loam","Sandy Clay Loam",
    "Silt","Silt Loam","Loam","Sandy Loam","Loamy Sand","Sand"
  ];
  for (const name of order) {
    const tc = TEXTURE_CLASSES.find(t => t.name === name);
    if (tc && tc.check(clay, silt, sand)) return tc;
  }
  return { name: "Unclassified", color: "#aaa", description: "Outside USDA classes" };
}

// Convert ternary [clay, silt, sand] to SVG xy coords
// Triangle: top=clay=100%, bottom-left=sand=100%, bottom-right=silt=100%
function ternaryToXY(clay, silt, sand, cx, cy, size) {
  // Equilateral triangle
  // top vertex: clay
  // bottom-left: sand
  // bottom-right: silt
  const h = (Math.sqrt(3) / 2) * size;
  const topX = cx;
  const topY = cy - (2 / 3) * h;
  const blX = cx - size / 2;
  const blY = cy + (1 / 3) * h;
  const brX = cx + size / 2;
  const brY = cy + (1 / 3) * h;

  const x = clay * topX + sand * blX + silt * brX;
  const y = clay * topY + sand * blY + silt * brY;
  return { x, y };
}

function xyToTernary(px, py, cx, cy, size) {
  const h = (Math.sqrt(3) / 2) * size;
  const topX = cx, topY = cy - (2 / 3) * h;
  const blX = cx - size / 2, blY = cy + (1 / 3) * h;
  const brX = cx + size / 2, brY = cy + (1 / 3) * h;

  // Solve for barycentric coordinates
  const denom = (blY - brY) * (topX - brX) + (brX - blX) * (topY - brY);
  const clay = ((blY - brY) * (px - brX) + (brX - blX) * (py - brY)) / denom;
  const sand = ((brY - topY) * (px - brX) + (topX - brX) * (py - brY)) / denom;
  const silt = 1 - clay - sand;
  return { clay, silt, sand };
}

function isInsideTriangle(clay, silt, sand) {
  return clay >= 0 && silt >= 0 && sand >= 0 && Math.abs(clay + silt + sand - 1) < 0.01;
}

// Predefined USDA regions as arrays of [clay, silt, sand] vertices
const USDA_REGIONS = [
  { name: "Sand", color: "#F5E06A", opacity: 0.75, pts: [[0,0.05,0.95],[0,0.15,0.85],[0.1,0.15,0.75],[0.1,0,0.9],[0,0,1]] },
  { name: "Loamy Sand", color: "#E8D070", opacity: 0.75, pts: [[0,0.15,0.85],[0.15,0.15,0.70],[0.15,0,0.85],[0.1,0,0.9],[0.1,0.15,0.75]] },
  { name: "Sandy Loam", color: "#F4C06F", opacity: 0.75, pts: [[0,0.50,0.50],[0.07,0.43,0.50],[0.07,0.28,0.65],[0.20,0.28,0.52],[0.20,0,0.80],[0.15,0,0.85],[0.15,0.15,0.70],[0,0.20,0.80]] },
  { name: "Loam", color: "#90C978", opacity: 0.75, pts: [[0.07,0.28,0.65],[0.27,0.28,0.45],[0.27,0.23,0.50],[0.20,0.28,0.52]] },
  { name: "Silt Loam", color: "#6DB5B5", opacity: 0.75, pts: [[0,0.80,0.20],[0,1,0],[0.12,0.88,0],[0.27,0.73,0],[0.27,0.28,0.45],[0.07,0.28,0.65],[0.07,0.43,0.50],[0,0.50,0.50],[0,0.80,0.20]] },
  { name: "Silt", color: "#4BABC0", opacity: 0.75, pts: [[0,1,0],[0,0.80,0.20],[0.12,0.88,0],[0,1,0]] },
  { name: "Sandy Clay Loam", color: "#E8836B", opacity: 0.75, pts: [[0.20,0.28,0.52],[0.27,0.23,0.50],[0.27,0.28,0.45],[0.35,0.28,0.37],[0.35,0,0.65],[0.20,0,0.80]] },
  { name: "Clay Loam", color: "#C8764A", opacity: 0.75, pts: [[0.27,0.28,0.45],[0.40,0.20,0.40],[0.40,0.28,0.32],[0.35,0.28,0.37],[0.27,0.28,0.45]] },
  // Simplified approximations
  { name: "Silty Clay Loam", color: "#B57ED6", opacity: 0.75, pts: [[0.27,0.73,0],[0.40,0.60,0],[0.40,0.28,0.32],[0.27,0.28,0.45]] },
  { name: "Sandy Clay", color: "#CD5C5C", opacity: 0.75, pts: [[0.35,0,0.65],[0.35,0.28,0.37],[0.40,0.28,0.32],[0.40,0.20,0.40],[0.55,0.0,0.45],[0.35,0,0.65]] },
  { name: "Silty Clay", color: "#9370DB", opacity: 0.75, pts: [[0.40,0.60,0],[1.0,0.0,0],[0.40,0.20,0.40],[0.40,0.60,0]] },
  { name: "Clay", color: "#8B4513", opacity: 0.75, pts: [[0.55,0,0.45],[0.40,0.20,0.40],[1.0,0.0,0],[0.55,0,0.45]] },
];

export default function SoilTernary() {
  const svgRef = useRef(null);
  const [point, setPoint] = useState({ clay: 0.30, silt: 0.40, sand: 0.30 });
  const [dragging, setDragging] = useState(false);
  const [sliderClay, setSliderClay] = useState(30);
  const [sliderSilt, setSliderSilt] = useState(40);
  const [hovered, setHovered] = useState(null);

  const W = 560, H = 520;
  const cx = 280, cy = 270, size = 400;

  const classification = classifyTexture(point.clay, point.silt, point.sand);

  const getTrianglePos = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const tern = xyToTernary(px, py, cx, cy, size);
    if (!isInsideTriangle(tern.clay, tern.silt, tern.sand)) return null;
    return tern;
  }, [cx, cy, size]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const t = getTrianglePos(e);
    if (!t) return;
    const clay = Math.max(0, Math.min(1, t.clay));
    const silt = Math.max(0, Math.min(1, t.silt));
    const sand = Math.max(0, Math.min(1, t.sand));
    setPoint({ clay, silt, sand });
    setSliderClay(Math.round(clay * 100));
    setSliderSilt(Math.round(silt * 100));
  }, [dragging, getTrianglePos]);

  const handleMouseDown = useCallback((e) => {
    const t = getTrianglePos(e);
    if (!t) return;
    setDragging(true);
    const clay = Math.max(0, Math.min(1, t.clay));
    const silt = Math.max(0, Math.min(1, t.silt));
    const sand = Math.max(0, Math.min(1, t.sand));
    setPoint({ clay, silt, sand });
    setSliderClay(Math.round(clay * 100));
    setSliderSilt(Math.round(silt * 100));
  }, [getTrianglePos]);

  const handleMouseUp = () => setDragging(false);

  // Slider handlers
  const handleClaySlider = (val) => {
    const c = val / 100;
    const remaining = 1 - c;
    const sRatio = point.silt / (point.silt + point.sand || 1);
    const si = remaining * sRatio;
    const sa = remaining * (1 - sRatio);
    setSliderClay(val);
    setSliderSilt(Math.round(si * 100));
    setPoint({ clay: c, silt: si, sand: sa });
  };

  const handleSiltSlider = (val) => {
    const si = val / 100;
    const remaining = 1 - si;
    const cRatio = point.clay / (point.clay + point.sand || 1);
    const c = remaining * cRatio;
    const sa = remaining * (1 - cRatio);
    setSliderSilt(val);
    setSliderClay(Math.round(c * 100));
    setPoint({ clay: c, silt: si, sand: sa });
  };

  const dotPos = ternaryToXY(point.clay, point.silt, point.sand, cx, cy, size);

  // Draw grid lines
  const gridLines = [];
  for (let v = 0.1; v < 1.0; v += 0.1) {
    const vr = Math.round(v * 10) / 10;
    // Constant clay lines (horizontal-ish)
    const p1 = ternaryToXY(vr, 0, 1 - vr, cx, cy, size);
    const p2 = ternaryToXY(vr, 1 - vr, 0, cx, cy, size);
    gridLines.push(<line key={`c${vr}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.4" />);
    // Constant silt lines
    const s1 = ternaryToXY(0, vr, 1 - vr, cx, cy, size);
    const s2 = ternaryToXY(1 - vr, vr, 0, cx, cy, size);
    gridLines.push(<line key={`si${vr}`} x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.4" />);
    // Constant sand lines
    const sa1 = ternaryToXY(0, 1 - vr, vr, cx, cy, size);
    const sa2 = ternaryToXY(1 - vr, 0, vr, cx, cy, size);
    gridLines.push(<line key={`sa${vr}`} x1={sa1.x} y1={sa1.y} x2={sa2.x} y2={sa2.y} stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.4" />);
  }

  // Tick labels
  const ticks = [];
  for (let v = 0.1; v <= 0.9; v += 0.1) {
    const vr = Math.round(v * 10) / 10;
    const pct = Math.round(vr * 100);
    // Clay axis (left side): clay goes from bottom to top
    const clayPt = ternaryToXY(vr, 1 - vr, 0, cx, cy, size);
    ticks.push(<text key={`ct${vr}`} x={clayPt.x - 22} y={clayPt.y + 4} fontSize="9" fill="#ccc" textAnchor="middle">{pct}</text>);
    // Sand axis (bottom): increases left to right from bottom-left
    const sandPt = ternaryToXY(0, 1 - vr, vr, cx, cy, size);
    ticks.push(<text key={`sat${vr}`} x={sandPt.x} y={sandPt.y + 16} fontSize="9" fill="#ccc" textAnchor="middle">{pct}</text>);
    // Silt axis (right side)
    const siltPt = ternaryToXY(vr, 0, 1 - vr, cx, cy, size);
    ticks.push(<text key={`sit${vr}`} x={siltPt.x + 20} y={siltPt.y + 4} fontSize="9" fill="#ccc" textAnchor="middle">{pct}</text>);
  }

  const topV = ternaryToXY(1, 0, 0, cx, cy, size);
  const blV = ternaryToXY(0, 0, 1, cx, cy, size);
  const brV = ternaryToXY(0, 1, 0, cx, cy, size);

  return (
    <div style={{
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: "'Georgia', serif", padding: "20px", boxSizing: "border-box"
    }}>
      <div style={{ color: "#e8d5a3", fontSize: "22px", fontWeight: "bold", marginBottom: "4px", letterSpacing: "2px", textTransform: "uppercase" }}>
        USDA Soil Texture Triangle
      </div>
      <div style={{ color: "#8aabb5", fontSize: "12px", marginBottom: "16px", fontStyle: "italic" }}>
        Click or drag inside the triangle to classify soil texture
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>
        {/* SVG Triangle */}
        <div style={{ position: "relative" }}>
          <svg
            ref={svgRef}
            width={W} height={H}
            style={{ cursor: dragging ? "grabbing" : "crosshair", maxWidth: "100%", display: "block" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <defs>
              <clipPath id="triClip">
                <polygon points={`${topV.x},${topV.y} ${blV.x},${blV.y} ${brV.x},${brV.y}`} />
              </clipPath>
            </defs>

            {/* Background triangle */}
            <polygon
              points={`${topV.x},${topV.y} ${blV.x},${blV.y} ${brV.x},${brV.y}`}
              fill="#1a2a3a" stroke="#4a7a9b" strokeWidth="1.5"
            />

            {/* Colored regions */}
            <g clipPath="url(#triClip)">
              {USDA_REGIONS.map((region) => {
                const pts = region.pts.map(([c, si, sa]) => {
                  const p = ternaryToXY(c, si, sa, cx, cy, size);
                  return `${p.x},${p.y}`;
                }).join(" ");
                return (
                  <polygon
                    key={region.name}
                    points={pts}
                    fill={region.color}
                    opacity={hovered === region.name ? 0.95 : region.opacity}
                    stroke="#fff"
                    strokeWidth="0.8"
                    onMouseEnter={() => setHovered(region.name)}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })}
            </g>

            {/* Grid lines */}
            {gridLines}

            {/* Triangle border */}
            <polygon
              points={`${topV.x},${topV.y} ${blV.x},${blV.y} ${brV.x},${brV.y}`}
              fill="none" stroke="#7ab5d0" strokeWidth="2"
            />

            {/* Tick labels */}
            {ticks}

            {/* Axis labels */}
            <text x={topV.x} y={topV.y - 20} textAnchor="middle" fontSize="13" fill="#e8d5a3" fontWeight="bold">% Clay</text>
            <text x={blV.x - 10} y={blV.y + 28} textAnchor="middle" fontSize="13" fill="#e8d5a3" fontWeight="bold">% Sand</text>
            <text x={brV.x + 10} y={brV.y + 28} textAnchor="middle" fontSize="13" fill="#e8d5a3" fontWeight="bold">% Silt</text>

            {/* Region labels */}
            {USDA_REGIONS.map((region) => {
              const avg = region.pts.reduce((acc, p) => ({ c: acc.c + p[0], si: acc.c + p[1], sa: acc.sa + p[2] }), { c: 0, si: 0, sa: 0 });
              const n = region.pts.length;
              const avgC = region.pts.reduce((a, p) => a + p[0], 0) / n;
              const avgSi = region.pts.reduce((a, p) => a + p[1], 0) / n;
              const avgSa = region.pts.reduce((a, p) => a + p[2], 0) / n;
              const pos = ternaryToXY(avgC, avgSi, avgSa, cx, cy, size);
              const words = region.name.split(" ");
              return (
                <g key={`lbl-${region.name}`}>
                  {words.map((word, i) => (
                    <text
                      key={i}
                      x={pos.x} y={pos.y + (i - (words.length - 1) / 2) * 11}
                      textAnchor="middle" fontSize="8.5" fill="#fff"
                      fontWeight="600" style={{ pointerEvents: "none", textShadow: "0 0 3px #000" }}
                    >
                      {word}
                    </text>
                  ))}
                </g>
              );
            })}

            {/* Lines from dot to axes */}
            {[
              ternaryToXY(point.clay, 1 - point.clay, 0, cx, cy, size),
              ternaryToXY(0, point.silt, 1 - point.silt, cx, cy, size),
              ternaryToXY(1 - point.sand, 0, point.sand, cx, cy, size),
            ].map((ep, i) => (
              <line key={i} x1={dotPos.x} y1={dotPos.y} x2={ep.x} y2={ep.y}
                stroke="#fff" strokeWidth="0.8" strokeDasharray="4,3" strokeOpacity="0.6" />
            ))}

            {/* Dot */}
            <circle cx={dotPos.x} cy={dotPos.y} r="10" fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.4" />
            <circle cx={dotPos.x} cy={dotPos.y} r="6" fill={classification.color} stroke="#fff" strokeWidth="2" style={{ cursor: "grab", filter: "drop-shadow(0 0 6px rgba(255,255,255,0.7))" }} />
          </svg>
        </div>

        {/* Info Panel */}
        <div style={{ width: "200px", minWidth: "200px" }}>
          {/* Classification result */}
          <div style={{
            background: "rgba(255,255,255,0.06)", border: `2px solid ${classification.color}`,
            borderRadius: "10px", padding: "14px", marginBottom: "16px",
            boxShadow: `0 0 20px ${classification.color}44`
          }}>
            <div style={{ color: "#8aabb5", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Texture Class</div>
            <div style={{ color: classification.color, fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>{classification.name}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {[
                { label: "Clay", val: point.clay, color: "#8B4513" },
                { label: "Silt", val: point.silt, color: "#4BABC0" },
                { label: "Sand", val: point.sand, color: "#F5E06A" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ color: "#aaa", fontSize: "11px", width: "32px" }}>{label}</div>
                  <div style={{ flex: 1, background: "#1a2a3a", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                    <div style={{ width: `${val * 100}%`, height: "100%", background: color, borderRadius: "4px", transition: "width 0.1s" }} />
                  </div>
                  <div style={{ color: "#e8d5a3", fontSize: "11px", width: "34px", textAlign: "right" }}>{Math.round(val * 100)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
            <div style={{ color: "#8aabb5", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Adjust Values</div>
            {[
              { label: "Clay %", val: sliderClay, handler: handleClaySlider, color: "#8B4513" },
              { label: "Silt %", val: sliderSilt, handler: handleSiltSlider, color: "#4BABC0" },
            ].map(({ label, val, handler, color }) => (
              <div key={label} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "#ccc", fontSize: "11px" }}>{label}</span>
                  <span style={{ color: color, fontSize: "11px", fontWeight: "bold" }}>{val}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={val}
                  onChange={(e) => handler(Number(e.target.value))}
                  style={{ width: "100%", accentColor: color, cursor: "pointer" }}
                />
              </div>
            ))}
            <div style={{ color: "#666", fontSize: "10px", fontStyle: "italic", marginTop: "4px" }}>
              Sand = {Math.round(point.sand * 100)}% (auto-calculated)
            </div>
          </div>

          {/* Legend */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px" }}>
            <div style={{ color: "#8aabb5", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Legend</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {USDA_REGIONS.map((r) => (
                <div key={r.name} style={{ display: "flex", alignItems: "center", gap: "4px", width: "100%" }}>
                  <div style={{ width: "10px", height: "10px", background: r.color, borderRadius: "2px", flexShrink: 0 }} />
                  <span style={{ color: r.name === classification.name ? "#fff" : "#999", fontSize: "10px", fontWeight: r.name === classification.name ? "bold" : "normal" }}>
                    {r.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ color: "#4a6a7a", fontSize: "10px", marginTop: "12px" }}>
        Source: USDA Natural Resources Conservation Service (NRCS) Soil Texture Classification
      </div>
    </div>
  );
}
