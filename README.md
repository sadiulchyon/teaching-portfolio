# Teaching Portfolio — Soil Science Interactive Components

A collection of interactive React components for teaching soil science concepts in undergraduate and graduate courses.

## Components

### `soil-science/soil-ternary-diagram.jsx`
**USDA Soil Texture Triangle**

An interactive ternary diagram for classifying soil texture according to the USDA Natural Resources Conservation Service (NRCS) system. Features:
- Click or drag inside the triangle to place a sample point
- Real-time texture classification (12 USDA classes)
- Sliders for manual clay/silt input
- Color-coded regions with hover labels
- Dashed guide lines from sample point to each axis

### `soil-science/soil-profile-diagram.jsx`
**Soil Profile Horizons**

An interactive cross-section of a generalized temperate soil profile. Features:
- Click any horizon (O, A, E, B, C, R) to inspect its properties
- Animated property bars for organic carbon, porosity, permeability, and CEC
- Wavy horizon boundaries rendered in SVG
- Depth ruler with approximate inch ranges
- Quick-select tabs at the bottom

## Usage

These components are designed for embedding in course websites, Jupyter Book pages, or any React-based environment.

```bash
# Install dependencies (React 18+)
npm install react react-dom

# Import a component
import SoilTernary from './soil-science/soil-ternary-diagram';
import SoilProfile from './soil-science/soil-profile-diagram';
```

## Folder Structure

```
teaching-portfolio/
├── soil-science/
│   ├── soil-ternary-diagram.jsx
│   └── soil-profile-diagram.jsx
├── docs/          # Documentation assets
├── previews/      # Screenshot previews
└── README.md
```

## Topics

`teaching-portfolio` · `react` · `geoscience` · `soil-science` · `education`

## Source

USDA / FAO generalized soil classifications. Depths are approximate for temperate soils.
