import { useState } from "react";

const HORIZONS = [
  {
    id: "O",
    label: "O Horizon",
    depth: "0–2 in",
    color: "#2d1a0e",
    textColor: "#d4b896",
    height: 60,
    icon: "🍂",
    composition: "Organic matter (litter, humus)",
    texture: "Fibrous / decomposing",
    pH: "4.5–6.0",
    roots: "Dense surface roots",
    notes: "Formed by accumulation of organic debris. Subdivided into Oi (fresh litter) and Oa (humus). Often absent in arid soils.",
    properties: [
      { key: "Organic C", val: ">20%", bar: 95 },
      { key: "Porosity", val: "High", bar: 85 },
      { key: "Permeability", val: "High", bar: 88 },
      { key: "CEC", val: "Very High", bar: 92 },
    ],
    pattern: "organic",
  },
  {
    id: "A",
    label: "A Horizon",
    depth: "2–12 in",
    color: "#3b2409",
    textColor: "#d4b896",
    height: 110,
    icon: "🌱",
    composition: "Mineral soil + organic matter",
    texture: "Granular / crumb",
    pH: "5.5–7.0",
    roots: "Abundant fine roots",
    notes: "Topsoil. Darkened by humus. Zone of maximum biological activity. Subject to eluviation — soluble minerals leach downward.",
    properties: [
      { key: "Organic C", val: "2–10%", bar: 60 },
      { key: "Porosity", val: "High", bar: 75 },
      { key: "Permeability", val: "Moderate-High", bar: 70 },
      { key: "CEC", val: "High", bar: 72 },
    ],
    pattern: "topsoil",
  },
  {
    id: "E",
    label: "E Horizon",
    depth: "12–18 in",
    color: "#9e8c72",
    textColor: "#1a0f00",
    height: 70,
    icon: "💧",
    composition: "Leached mineral soil",
    texture: "Platy / massive",
    pH: "5.0–6.5",
    roots: "Moderate",
    notes: "Eluviation zone. Clay, Fe/Al oxides, and organic matter are leached to lower horizons. Light gray or pale color. Common in humid forest soils (Spodosols, Alfisols).",
    properties: [
      { key: "Organic C", val: "<1%", bar: 12 },
      { key: "Porosity", val: "Moderate", bar: 55 },
      { key: "Permeability", val: "Moderate", bar: 58 },
      { key: "CEC", val: "Low", bar: 22 },
    ],
    pattern: "eluvial",
  },
  {
    id: "B",
    label: "B Horizon",
    depth: "18–40 in",
    color: "#7a4b1e",
    textColor: "#f5dfc0",
    height: 130,
    icon: "⬇️",
    composition: "Illuviated clays, Fe/Al oxides",
    texture: "Blocky / prismatic",
    pH: "6.0–7.5",
    roots: "Sparse to moderate",
    notes: "Subsoil / illuviation zone. Accumulates clay, Fe-Al oxides, carbonates, or humus translocated from A/E. Often redder/browner than adjacent horizons due to Fe oxide coatings.",
    properties: [
      { key: "Organic C", val: "0.5–2%", bar: 28 },
      { key: "Porosity", val: "Low-Moderate", bar: 38 },
      { key: "Permeability", val: "Low-Moderate", bar: 35 },
      { key: "CEC", val: "Moderate", bar: 50 },
    ],
    pattern: "subsoil",
  },
  {
    id: "C",
    label: "C Horizon",
    depth: "40–60 in",
    color: "#b08060",
    textColor: "#1a0f00",
    height: 100,
    icon: "🪨",
    composition: "Weathered parent material",
    texture: "Variable / massive",
    pH: "7.0–8.5",
    roots: "Very sparse",
    notes: "Partially weathered bedrock fragments or unconsolidated parent material. Little to no pedogenic alteration. Provides mineral inputs to upper horizons via weathering.",
    properties: [
      { key: "Organic C", val: "<0.5%", bar: 5 },
      { key: "Porosity", val: "Low", bar: 22 },
      { key: "Permeability", val: "Low", bar: 20 },
      { key: "CEC", val: "Low", bar: 18 },
    ],
    pattern: "parent",
  },
  {
    id: "R",
    label: "R Horizon",
    depth: ">60 in",
    color: "#6b6b6b",
    textColor: "#e0e0e0",
    height: 80,
    icon: "⛰️",
    composition: "Unweathered bedrock",
    texture: "Massive / hard",
    pH: "Variable",
    roots: "None",
    notes: "Consolidated bedrock (granite, limestone, basalt, etc.). Defines the base of the soil profile. Limits rooting depth and drainage. R horizon is not pedogenic — it is the geological substrate.",
    properties: [
      { key: "Organic C", val: "~0%", bar: 0 },
      { key: "Porosity", val: "Very Low", bar: 8 },
      { key: "Permeability", val: "Very Low", bar: 5 },
      { key: "CEC", val: "Negligible", bar: 2 },
    ],
    pattern: "bedrock",
  },
];

function PatternDef() {
  return (
    <defs>
      <pattern id="organicPat" patternUnits="userSpaceOnUse" width="8" height="8">
        <rect width="8" height="8" fill="#2d1a0e" />
        <line x1="0" y1="0" x2="8" y2="8" stroke="#1a0a04" strokeWidth="1" />
        <line x1="8" y1="0" x2="0" y2="8" stroke="#3e2010" strokeWidth="0.5" />
      </pattern>
      <pattern id="eluvialPat" patternUnits="userSpaceOnUse" width="10" height="4">
        <rect width="10" height="4" fill="#9e8c72" />
        <rect x="0" y="1" width="10" height="1.5" fill="#b8a888" opacity="0.5" />
      </pattern>
      <pattern id="bedrockPat" patternUnits="userSpaceOnUse" width="20" height="10">
        <rect width="20" height="10" fill="#6b6b6b" />
        <polygon points="0,10 10,0 20,10" fill="#585858" />
        <polygon points="0,0 10,10 20,0" fill="#7a7a7a" opacity="0.4" />
      </pattern>
      <pattern id="parentPat" patternUnits="userSpaceOnUse" width="16" height="12">
        <rect width="16" height="12" fill="#b08060" />
        <ellipse cx="4" cy="5" rx="3" ry="2" fill="#987050" opacity="0.5" />
        <ellipse cx="12" cy="8" rx="3" ry="2" fill="#c89070" opacity="0.4" />
      </pattern>
    </defs>
  );
}

export default function SoilProfile() {
  const [selected, setSelected] = useState(HORIZONS[1]);
  const [hovered, setHovered] = useState(null);

  const totalH = HORIZONS.reduce((s, h) => s + h.height, 0);

  // cumulative y offsets
  let cumY = 0;
  const horizonRects = HORIZONS.map((h) => {
    const y = cumY;
    cumY += h.height;
    return { ...h, y };
  });

  const getFill = (h) => {
    if (h.pattern === "eluvial") return "url(#eluvialPat)";
    if (h.pattern === "bedrock") return "url(#bedrockPat)";
    if (h.pattern === "organic") return "url(#organicPat)";
    if (h.pattern === "parent") return "url(#parentPat)";
    return h.color;
  };

  const profileW = 180;
  const svgH = totalH + 10;

  return (
    <div style={{
      background: "linear-gradient(160deg, #0d1117 0%, #161b22 60%, #1a1f2e 100%)",
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: "'Courier New', monospace",
      padding: "24px 16px", boxSizing: "border-box", color: "#cdd9e5"
    }}>
      <div style={{ fontSize: "20px", fontWeight: "bold", color: "#e6c87a", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "4px" }}>
        Soil Profile
      </div>
      <div style={{ fontSize: "11px", color: "#6a7a8a", marginBottom: "20px", letterSpacing: "1px" }}>
        Click a horizon to inspect properties
      </div>

      <div style={{ display: "flex", gap: "28px", alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>

        {/* Soil profile SVG */}
        <div style={{ display: "flex", gap: "0px", alignItems: "flex-start" }}>

          {/* Depth ruler */}
          <div style={{ width: "52px", paddingTop: "5px", marginRight: "4px" }}>
            {horizonRects.map((h) => (
              <div key={h.id} style={{
                height: `${h.height}px`, display: "flex", alignItems: "flex-start",
                justifyContent: "flex-end", paddingRight: "6px", paddingTop: "2px",
                borderTop: "1px solid #333", boxSizing: "border-box",
                color: "#5a7a8a", fontSize: "9px"
              }}>
                {h.depth.split("–")[0]}
              </div>
            ))}
          </div>

          {/* Profile */}
          <svg width={profileW} height={svgH} style={{ display: "block", borderRadius: "6px", overflow: "hidden", cursor: "pointer" }}>
            <PatternDef />

            {horizonRects.map((h) => {
              const isSelected = selected?.id === h.id;
              const isHovered = hovered === h.id;
              // Wavy bottom boundary using a path
              const waveAmp = h.id === "R" ? 0 : 3;
              const y2 = h.y + h.height;
              const wavePoints = [];
              for (let x = 0; x <= profileW; x += 20) {
                wavePoints.push(`${x},${y2 + (Math.sin(x * 0.3 + h.y * 0.1) * waveAmp)}`);
              }
              const wavePath = `M0,${h.y} L${profileW},${h.y} L${profileW},${y2} Q${wavePoints.join(" ")} Z`;

              return (
                <g key={h.id}
                  onClick={() => setSelected(h)}
                  onMouseEnter={() => setHovered(h.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <path d={wavePath} fill={getFill(h)} />
                  {/* Highlight overlay */}
                  {(isSelected || isHovered) && (
                    <rect x="0" y={h.y} width={profileW} height={h.height}
                      fill="#ffffff" opacity={isSelected ? 0.12 : 0.06} />
                  )}
                  {/* Selected left bar */}
                  {isSelected && <rect x="0" y={h.y} width="4" height={h.height} fill="#e6c87a" />}

                  {/* Horizon label */}
                  <text x={isSelected ? 14 : 10} y={h.y + h.height / 2 - 6} fontSize="16" fill={h.textColor}
                    fontWeight="bold" opacity="0.9" style={{ pointerEvents: "none" }}>
                    {h.id}
                  </text>
                  <text x={isSelected ? 14 : 10} y={h.y + h.height / 2 + 10} fontSize="8.5" fill={h.textColor}
                    opacity="0.7" style={{ pointerEvents: "none" }}>
                    {h.label.replace(`${h.id} `, "")}
                  </text>

                  {/* Horizon boundary line */}
                  <line x1="0" y1={h.y} x2={profileW} y2={h.y} stroke="#ffffff" strokeWidth="0.7" strokeOpacity="0.15" strokeDasharray={h.id === "O" ? "none" : "4,3"} />

                  {/* Root drawings for upper horizons */}
                  {(h.id === "A" || h.id === "O") && [30, 70, 120, 155].map((rx, i) => (
                    <line key={i} x1={rx} y1={h.y + 4} x2={rx + (i % 2 === 0 ? 8 : -8)} y2={h.y + h.height - 4}
                      stroke="#2a5c1a" strokeWidth="1" strokeOpacity="0.4" />
                  ))}
                  {h.id === "B" && [50, 130].map((rx, i) => (
                    <line key={i} x1={rx} y1={h.y + 10} x2={rx + (i % 2 === 0 ? 5 : -5)} y2={h.y + 60}
                      stroke="#3a4a1a" strokeWidth="0.8" strokeOpacity="0.25" />
                  ))}

                  {/* Stone/particle dots for C and B */}
                  {h.id === "C" && [20, 60, 100, 140, 40, 90, 160].map((sx, i) => (
                    <ellipse key={i} cx={sx} cy={h.y + 20 + (i * 11) % 60} rx="6" ry="4"
                      fill="#987050" opacity="0.35" />
                  ))}
                </g>
              );
            })}

            {/* Depth label on right */}
            <text x={profileW - 4} y={svgH - 4} fontSize="8" fill="#4a6a7a" textAnchor="end">depth (in)</text>
          </svg>

          {/* Right: depth end labels */}
          <div style={{ width: "40px", paddingTop: "5px", marginLeft: "4px" }}>
            {horizonRects.map((h) => (
              <div key={h.id} style={{
                height: `${h.height}px`, display: "flex", alignItems: "flex-end",
                paddingLeft: "4px", paddingBottom: "2px", boxSizing: "border-box",
                color: "#5a7a8a", fontSize: "9px"
              }}>
                {h.depth.split("–")[1] || ">60"}
              </div>
            ))}
          </div>
        </div>

        {/* Info panel */}
        {selected && (
          <div style={{
            width: "280px", minWidth: "240px",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${selected.color}88`,
            borderRadius: "12px", padding: "18px", boxSizing: "border-box",
            boxShadow: `0 0 30px ${selected.color}33`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{
                width: "40px", height: "40px", background: selected.color,
                borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", flexShrink: 0,
                border: "1px solid rgba(255,255,255,0.15)"
              }}>
                {selected.icon}
              </div>
              <div>
                <div style={{ color: "#e6c87a", fontSize: "18px", fontWeight: "bold", letterSpacing: "2px" }}>{selected.id}</div>
                <div style={{ color: "#8a9aaa", fontSize: "11px" }}>{selected.label} · {selected.depth}</div>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
              {[
                { k: "Composition", v: selected.composition },
                { k: "Texture", v: selected.texture },
                { k: "pH Range", v: selected.pH },
                { k: "Root Activity", v: selected.roots },
              ].map(({ k, v }) => (
                <div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "6px", padding: "8px" }}>
                  <div style={{ color: "#5a7a8a", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>{k}</div>
                  <div style={{ color: "#cdd9e5", fontSize: "10px" }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Property bars */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ color: "#5a7a8a", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Properties</div>
              {selected.properties.map(({ key, val, bar }) => (
                <div key={key} style={{ marginBottom: "7px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ color: "#9aaabb", fontSize: "10px" }}>{key}</span>
                    <span style={{ color: "#e6c87a", fontSize: "10px" }}>{val}</span>
                  </div>
                  <div style={{ background: "#1a2430", borderRadius: "3px", height: "5px", overflow: "hidden" }}>
                    <div style={{
                      width: `${bar}%`, height: "100%", borderRadius: "3px",
                      background: `linear-gradient(90deg, ${selected.color}, ${selected.color}99)`,
                      transition: "width 0.4s ease"
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px", borderLeft: `3px solid ${selected.color}` }}>
              <div style={{ color: "#8a9aaa", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Key Processes</div>
              <div style={{ color: "#b8c8d8", fontSize: "11px", lineHeight: "1.6" }}>{selected.notes}</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom horizon tabs */}
      <div style={{ display: "flex", gap: "6px", marginTop: "18px", flexWrap: "wrap", justifyContent: "center" }}>
        {HORIZONS.map((h) => (
          <button key={h.id} onClick={() => setSelected(h)} style={{
            padding: "5px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold",
            cursor: "pointer", letterSpacing: "1px", transition: "all 0.2s",
            background: selected?.id === h.id ? h.color : "rgba(255,255,255,0.05)",
            color: selected?.id === h.id ? h.textColor : "#8a9aaa",
            border: `1px solid ${selected?.id === h.id ? h.color : "#2a3a4a"}`,
            fontFamily: "'Courier New', monospace"
          }}>
            {h.id}
          </button>
        ))}
      </div>

      <div style={{ color: "#2a4a5a", fontSize: "9px", marginTop: "14px", letterSpacing: "1px" }}>
        USDA / FAO generalized soil profile · depths approximate for temperate soils
      </div>
    </div>
  );
}
