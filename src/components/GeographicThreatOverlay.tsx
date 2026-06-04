/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  MapPin, 
  Flame, 
  Waves, 
  ShieldAlert, 
  TrendingUp, 
  Info, 
  RefreshCw, 
  Crosshair, 
  Maximize2,
  Grid,
  Radio,
  Sliders,
  ChevronRight,
  Gauge
} from 'lucide-react';
import { StressTestReport, HorizonProjection } from '../types';

interface ThreatOverlayProps {
  activeReport: StressTestReport;
  currentHorizon: HorizonProjection;
  policySensitivity: number; // 0 to 100
}

type ThreatType = 'FLOOD' | 'WILDFIRE' | 'SUBSIDENCE';
type VisualMode = 'CONTOUR' | 'HEXAMESH' | 'GRID';

interface Hotspot {
  x: number; // 0 to 100 relative
  y: number; // 0 to 100 relative
  weight: number; // base intensity
  radius: number; // coverage radius (0 to 100 percentage layout)
}

interface FeatureNode {
  id: string;
  name: string;
  x: number; 
  y: number;
  type: 'INFRASTRUCTURE' | 'PORTFOLIO' | 'CRITICAL_DEFENSE' | 'HYDRAULIC_UNIT';
  description: string;
}

export function GeographicThreatOverlay({
  activeReport,
  currentHorizon,
  policySensitivity
}: ThreatOverlayProps) {
  const [selectedThreat, setSelectedThreat] = useState<ThreatType>('FLOOD');
  const [visualMode, setVisualMode] = useState<VisualMode>('CONTOUR');
  const [resolution, setResolution] = useState<'LOW' | 'MED' | 'HIGH'>('MED');
  const [selectedNode, setSelectedNode] = useState<FeatureNode | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; lat: number; lng: number; val: number } | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Extract base coordinates from report
  const baseCoordinates = useMemo(() => {
    // Expected structure: "25.7907° N, 80.1300° W"
    const coordsStr = activeReport.coordinates;
    const match = coordsStr.match(/([0-9.]+)[^0-9.]+([0-9.]+)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return {
          lat,
          lng,
          latDir: coordsStr.includes('S') ? 'S' : 'N',
          lngDir: coordsStr.includes('E') ? 'E' : 'W'
        };
      }
    }
    return { lat: 25.7907, lng: 80.1300, latDir: 'N', lngDir: 'W' };
  }, [activeReport.coordinates]);

  // Determine site archetype for landscape generation
  const siteArchetype = useMemo(() => {
    const loc = activeReport.location.toLowerCase();
    if (loc.includes('miami') || loc.includes('beach') || loc.includes('florida')) return 'MIAMI';
    if (loc.includes('phoenix') || loc.includes('desert') || loc.includes('arizona')) return 'PHOENIX';
    if (loc.includes('rotterdam') || loc.includes('netherlands') || loc.includes('polder')) return 'ROTTERDAM';
    if (loc.includes('sai kung') || loc.includes('kong')) return 'SAIKUNG';
    if (loc.includes('valley') || loc.includes('fresno')) return 'CENTRALVALLEY';
    return 'PROCEDURAL';
  }, [activeReport.location]);

  // Generate unique, reproducible procedural landmarks and geography based on location hash
  const mapConfig = useMemo(() => {
    // Quick hashing function
    let hash = 0;
    const str = activeReport.location;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seedRandom = (offset: number) => {
      const v = Math.sin(hash + offset) * 10000;
      return v - Math.floor(v);
    };

    // Define geographical bounds (in fake micro-degrees)
    const bounds = {
      minLat: baseCoordinates.lat - 0.04,
      maxLat: baseCoordinates.lat + 0.04,
      minLng: baseCoordinates.lng - 0.04,
      maxLng: baseCoordinates.lng + 0.04
    };

    // 1. Coordinates and geography layout representation
    let landPaths: [number, number][][] = [];
    let waterPaths: [number, number][][] = [];
    let keyNodes: FeatureNode[] = [];
    let floodHotspots: Hotspot[] = [];
    let wildfireHotspots: Hotspot[] = [];
    let subsidenceHotspots: Hotspot[] = [];

    // Pre-planned visual mock architectures
    if (siteArchetype === 'MIAMI') {
      // Barrier island + coast layout
      landPaths = [
        // Coastal mainland strip (left side)
        [[0, 0], [25, 0], [28, 30], [23, 70], [26, 100], [0, 100]],
        // Barrier island (right side)
        [[68, 10], [78, 12], [82, 45], [78, 85], [72, 95], [64, 55]]
      ];
      waterPaths = [
        // Biscayne Bay canal inlets
        [[23, 30], [30, 31], [27, 36], [23, 35]],
        [[24, 60], [32, 62], [28, 68], [24, 67]]
      ];
      keyNodes = [
        { id: '1', name: "Ocean Drive Portfolio Area", x: 75, y: 30, type: 'PORTFOLIO', description: "High-value vintage beachfront assets with shallow porous limestone foundations." },
        { id: '2', name: "Indian Creek Estate Unit", x: 72, y: 75, type: 'PORTFOLIO', description: "Ultra-luxury residential strip with private water bulkhead defenses." },
        { id: '3', name: "Biscayne Pump Station #4", x: 26, y: 48, type: 'INFRASTRUCTURE', description: "Key urban pluvial clearing pump. Subject to tidal backflow locks." },
        { id: '4', name: "South Beach Shoreline Dike", x: 74, y: 92, type: 'CRITICAL_DEFENSE', description: "Compacted sand dune barrier. Highly vulnerable to Category 4+ swells." }
      ];
      floodHotspots = [
        { x: 45, y: 50, weight: 0.8, radius: 45 }, // Bay waters
        { x: 15, y: 15, weight: 0.5, radius: 30 }, // Mainland drainage
        { x: 74, y: 90, weight: 0.9, radius: 25 }, // Beach coastal front
        { x: 70, y: 25, weight: 0.6, radius: 20 }  // Island interior canals
      ];
      wildfireHotspots = [
        { x: 10, y: 80, weight: 0.1, radius: 10 } // Urban context (Zero wildfire threat practically)
      ];
      subsidenceHotspots = [
        { x: 72, y: 45, weight: 0.75, radius: 35 }, // Island limestone collapse
        { x: 24, y: 20, weight: 0.5, radius: 30 }  // Reclaimed land swamp soils
      ];

    } else if (siteArchetype === 'PHOENIX') {
      // Valley flat + mountain range edges
      landPaths = [
        // North-east mountain preserve (hills)
        [[60, 0], [100, 0], [100, 60], [85, 45], [70, 25]],
        // South-west small mountain butte
        [[0, 80], [30, 85], [25, 100], [0, 100]]
      ];
      keyNodes = [
        { id: '1', name: "Foothills Estate Enclave", x: 78, y: 15, type: 'PORTFOLIO', description: "High-tier homes integrated into dry scrubland wilderness margins." },
        { id: '2', name: "Central Valley Cooling Node", x: 45, y: 60, type: 'INFRASTRUCTURE', description: "Massive electrical substation cooling grid transformers." },
        { id: '3', name: "Salt River Fluvial Canal", x: 50, y: 50, type: 'HYDRAULIC_UNIT', description: "Dry wash channel designed to route monsoon flood water." },
        { id: '4', name: "Valley Aquifer Recharge Well", x: 32, y: 35, type: 'INFRASTRUCTURE', description: "Deep extraction well monitoring massive volume drawdown collapse." }
      ];
      floodHotspots = [
        { x: 50, y: 50, weight: 0.75, radius: 15 }, // River wash canal
        { x: 38, y: 88, weight: 0.4, radius: 20 }  // Impounded desert depression
      ];
      wildfireHotspots = [
        { x: 80, y: 15, weight: 0.85, radius: 30 }, // Foothill scrub boundaries
        { x: 15, y: 90, weight: 0.6, radius: 25 }   // Scrubland outskirts
      ];
      subsidenceHotspots = [
        { x: 42, y: 55, weight: 0.8, radius: 45 }, // Flat residential agricultural clay basin (Deep clay collapse)
        { x: 30, y: 30, weight: 0.52, radius: 32 }
      ];

    } else if (siteArchetype === 'ROTTERDAM') {
      // Extensive polders, canals, massive delta dikes
      landPaths = [
        // Polder block A (North-west)
        [[0, 0], [45, 0], [45, 40], [0, 40]],
        // Polder block B (East side)
        [[55, 0], [100, 0], [100, 100], [55, 100]],
        // Polder block C (South-west)
        [[0, 50], [45, 50], [45, 100], [0, 100]]
      ];
      waterPaths = [
        // Massive central shipping canal & river arteries
        [[0, 40], [45, 40], [45, 50], [0, 50]],
        [[45, 0], [55, 0], [55, 100], [45, 100]]
      ];
      keyNodes = [
        { id: '1', name: "Maeslant Surge Gate Complex", x: 50, y: 15, type: 'CRITICAL_DEFENSE', description: "Automated floating storm surge barrier. Critical defense point." },
        { id: '2', name: "South Polder Sub-sea Housing", x: 22, y: 78, type: 'PORTFOLIO', description: "Vulnerable residential zones resting 6.2 meters below mean sea level." },
        { id: '3', name: "Deep Drainage Bio-Sponge Basin", x: 78, y: 45, type: 'HYDRAULIC_UNIT', description: "Constructed wetlands storing excessive rainfall to prevent inner dike collapse." },
        { id: '4', name: "Canal Sluice Lock Port Alpha", x: 45, y: 50, type: 'INFRASTRUCTURE', description: "Automated lock regulating inner polder water tables against tide rises." }
      ];
      floodHotspots = [
        { x: 50, y: 60, weight: 0.9, radius: 25 }, // Main transport shipping canal
        { x: 22, y: 78, weight: 0.68, radius: 28 }, // Sub-sea polder depth points
        { x: 82, y: 25, weight: 0.45, radius: 18 }
      ];
      wildfireHotspots = [
        { x: 90, y: 90, weight: 0.05, radius: 10 } // Saturated soil climate (Near 0)
      ];
      subsidenceHotspots = [
        { x: 22, y: 78, weight: 0.88, radius: 35 }, // Low clay-peat polders sub-sea
        { x: 78, y: 45, weight: 0.72, radius: 25 }  // Silt drainage consolidation zone
      ];

    } else if (siteArchetype === 'SAIKUNG') {
      // Dynamic islands + coastal mountains
      landPaths = [
        // Mountain peninsula
        [[0, 10], [35, 15], [45, 35], [20, 50], [0, 55]],
        // Island A (East)
        [[65, 30], [85, 25], [92, 55], [70, 60], [60, 45]],
        // Island B (South)
        [[35, 75], [55, 70], [58, 90], [38, 95]]
      ];
      keyNodes = [
        { id: '1', name: "Monastery Valley Villa Estate", x: 22, y: 28, type: 'PORTFOLIO', description: "Luxury hillside estates. Vulnerable to tropical cascade landslides." },
        { id: '2', name: "Sai Kung Sea Wall Terminal", x: 42, y: 34, type: 'CRITICAL_DEFENSE', description: "Reinforced coastal seawall protecting harbor residential district." },
        { id: '3', name: "Offshore Aquaculture Grid", x: 52, y: 52, type: 'INFRASTRUCTURE', description: "Marine cage farms highly susceptible to toxic red-tide blooms." },
        { id: '4', name: "Hilltop Meteorological Station", x: 76, y: 42, type: 'INFRASTRUCTURE', description: "Radar dome tracking inbound intense Pacific typhoons." }
      ];
      floodHotspots = [
        { x: 48, y: 48, weight: 0.8, radius: 30 }, // Open harbor water
        { x: 42, y: 34, weight: 0.7, radius: 15 }, // Sea wall margin
        { x: 38, y: 88, weight: 0.5, radius: 20 }
      ];
      wildfireHotspots = [
        { x: 20, y: 20, weight: 0.75, radius: 25 }, // Dense hillside secondary woodlands
        { x: 78, y: 45, weight: 0.62, radius: 28 }
      ];
      subsidenceHotspots = [
        { x: 40, y: 32, weight: 0.45, radius: 20 }, // Coastal reclamation muds
        { x: 15, y: 42, weight: 0.3, radius: 15 }
      ];

    } else if (siteArchetype === 'CENTRALVALLEY') {
      // Regular agricultural grid lanes
      landPaths = [
        // Valley grid cells (simulated as field rectangles)
        [[5, 5], [45, 5], [45, 45], [5, 45]],
        [[52, 5], [95, 5], [95, 45], [52, 45]],
        [[5, 52], [45, 52], [45, 95], [5, 95]],
        [[52, 52], [95, 52], [95, 95], [52, 95]]
      ];
      keyNodes = [
        { id: '1', name: "Corporate Packing Facility Accord", x: 42, y: 42, type: 'INFRASTRUCTURE', description: "Central sorting plant with heavy groundwater extraction pipes." },
        { id: '2', name: "Tulare Basin Agricultural Tract", x: 25, y: 75, type: 'PORTFOLIO', description: "Large farming assets positioned inside historic flat lake depressions." },
        { id: '3', name: "Friant-Kern Bypass Canal", x: 48, y: 50, type: 'HYDRAULIC_UNIT', description: "Concrete water-delivery canal warping from extreme soil sinking." },
        { id: '4', name: "Subsidence Core Laser Tower", x: 72, y: 22, type: 'INFRASTRUCTURE', description: "Differential GPS and laser interferometer monitoring land surface drop." }
      ];
      floodHotspots = [
        { x: 25, y: 75, weight: 0.8, radius: 35 }, // Rebuilt Tulare Basin lake pooling
        { x: 48, y: 50, weight: 0.5, radius: 15 }  // Canal fracture breach point
      ];
      wildfireHotspots = [
        { x: 82, y: 15, weight: 0.7, radius: 25 },  // Foothill brush edges of the valley
        { x: 12, y: 88, weight: 0.45, radius: 20 }
      ];
      subsidenceHotspots = [
        { x: 50, y: 50, weight: 0.98, radius: 55 }, // Extreme central aquifer volume exhaustion (Sinking core)
        { x: 25, y: 30, weight: 0.82, radius: 35 }
      ];

    } else {
      // Procedural fallback based on land hash
      // Generate some interesting looking concentric landmasses
      const centerX = Math.floor(seedRandom(1) * 30) + 35; // 35 to 65
      const centerY = Math.floor(seedRandom(2) * 30) + 35;
      const polyCount = 3;
      
      for (let p = 0; p < polyCount; p++) {
        const path: [number, number][] = [];
        const numPoints = 6 + p;
        const radBase = 15 + p * 15;
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const noise = seedRandom(p * 10 + i) * 12 - 6;
          const x = centerX + Math.cos(angle) * (radBase + noise);
          const y = centerY + Math.sin(angle) * (radBase + noise);
          path.push([Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y))]);
        }
        landPaths.push(path);
      }

      keyNodes = [
        { id: '1', name: `Portfolio Core: ${activeReport.location.split(',')[0]}`, x: centerX - 5, y: centerY - 5, type: 'PORTFOLIO', description: `Sited at regional baseline elevation coordinates near focal assets.` },
        { id: '2', name: "Infrastructure Hub Beta", x: centerX + 18, y: centerY + 12, type: 'INFRASTRUCTURE', description: "Primary regional substations, logistics grids, and water pumps." },
        { id: '3', name: "Fluvial Sluice / Flood Containment", x: Math.max(10, centerX - 25), y: Math.max(10, centerY - 20), type: 'HYDRAULIC_UNIT', description: "Drainage works and localized flood containment basin." }
      ];

      floodHotspots = [
        { x: centerX - 20, y: centerY - 20, weight: seedRandom(5) * 0.5 + 0.4, radius: 35 },
        { x: centerX + 30, y: centerY + 10, weight: seedRandom(6) * 0.4 + 0.3, radius: 25 }
      ];
      wildfireHotspots = [
        { x: centerX + 25, y: centerY - 28, weight: seedRandom(7) * 0.6 + 0.3, radius: 32 },
        { x: centerX - 30, y: centerY + 28, weight: seedRandom(8) * 0.5 + 0.2, radius: 25 }
      ];
      subsidenceHotspots = [
        { x: centerX + 5, y: centerY + 5, weight: seedRandom(9) * 0.7 + 0.3, radius: 45 },
        { x: centerX - 10, y: centerY + 20, weight: seedRandom(10) * 0.4 + 0.3, radius: 30 }
      ];
    }

    return {
      bounds,
      landPaths,
      waterPaths,
      keyNodes,
      hotspots: {
        FLOOD: floodHotspots,
        WILDFIRE: wildfireHotspots,
        SUBSIDENCE: subsidenceHotspots
      }
    };
  }, [activeReport.location, baseCoordinates, siteArchetype]);

  // Adjust hotspot weights dynamically based on policySensitivity and selected decadal projections
  const modulatedHotspots = useMemo(() => {
    // Read the decadal risk factors from current metrics
    // e.g. "18% Decadal"
    const floodMetricsVal = currentHorizon.metrics.floodProb;
    const floodNum = parseFloat(floodMetricsVal) || 20;
    const floodScale = floodNum / 50; // Normalize around 50%

    // Average temperature rise increases Wildfire threat
    const tempStr = currentHorizon.metrics.averageTemp;
    const tempNum = parseFloat(tempStr) || 20;
    const wildfireScale = Math.max(0.2, (tempNum - 15) / 12); 

    // Aquifer status and subsidence probability
    const aquiferStatus = currentHorizon.metrics.localAquifer.toUpperCase();
    const subsidenceStr = currentHorizon.metrics.foundationIntegrity;
    const foundationInt = parseFloat(subsidenceStr) || 90;
    const foundationSinkingFactor = (100 - foundationInt) / 50; // Sinking scale (15% loss -> scale)
    const subsidenceScale = Math.max(0.1, foundationSinkingFactor + (aquiferStatus.includes('DEPLETED') || aquiferStatus.includes('UNUSABLE') ? 0.4 : 0.1));

    // Policy coefficient: values above 50 increase hazard multipliers (high carbon pathway), values below decrease them (aggressive carbon tax drawdown)
    const policyCoeff = 0.5 + (policySensitivity / 100);

    return mapConfig.hotspots[selectedThreat].map(h => {
      let threatMultiplier = 1.0;
      if (selectedThreat === 'FLOOD') threatMultiplier = floodScale;
      else if (selectedThreat === 'WILDFIRE') threatMultiplier = wildfireScale;
      else if (selectedThreat === 'SUBSIDENCE') threatMultiplier = subsidenceScale;

      return {
        ...h,
        weight: Math.min(1.0, Math.max(0.05, h.weight * threatMultiplier * policyCoeff))
      };
    });
  }, [mapConfig.hotspots, selectedThreat, currentHorizon, policySensitivity]);

  // Generate matrix points for D3 to compute contours or grid mesh depending on resolution
  const gridResolution = useMemo(() => {
    if (resolution === 'LOW') return 12; // 12x12 grid cells
    if (resolution === 'MED') return 24; // 24x24 grid cells
    return 48; // 48x48 dense grid cells
  }, [resolution]);

  const gridPoints = useMemo(() => {
    const points: { x: number; y: number; val: number; lat: number; lng: number }[] = [];
    const step = 100 / gridResolution;
    
    const latSpan = mapConfig.bounds.maxLat - mapConfig.bounds.minLat;
    const lngSpan = mapConfig.bounds.maxLng - mapConfig.bounds.minLng;

    for (let cY = 0; cY <= gridResolution; cY++) {
      const yPercent = (cY / gridResolution) * 100;
      const currentLat = mapConfig.bounds.maxLat - (cY / gridResolution) * latSpan;

      for (let cX = 0; cX <= gridResolution; cX++) {
        const xPercent = (cX / gridResolution) * 100;
        const currentLng = mapConfig.bounds.minLng + (cX / gridResolution) * lngSpan;

        // Calculate threat value at this grid cell as a distance-weighted sum of hotspots
        let accumulatedIntensity = 0;
        modulatedHotspots.forEach(h => {
          const dx = xPercent - h.x;
          const dy = yPercent - h.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < h.radius) {
            // Gaussian-like falloff
            const factor = Math.exp(-Math.pow(dist / (h.radius * 0.6), 2));
            accumulatedIntensity += h.weight * factor;
          }
        });

        points.push({
          x: xPercent,
          y: yPercent,
          lat: currentLat,
          lng: currentLng,
          val: Math.min(1.0, accumulatedIntensity)
        });
      }
    }
    return points;
  }, [gridResolution, modulatedHotspots, mapConfig.bounds]);

  // Render D3 Visual Elements inside SVG
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    // Clear out any previous dynamic groups (we keep static layers defined in JSX)
    svg.select(".d3-dynamic-content").remove();

    const width = 640;
    const height = 480;

    const dynamicGroup = svg.append("g").attr("class", "d3-dynamic-content");

    // Color Scales
    const threatColorScales = {
      FLOOD: d3.scaleSequential()
        .domain([0, 1])
        .interpolator(d3.interpolateRgbBasis(["rgba(8, 20, 40, 0)", "rgba(14, 52, 90, 0.4)", "rgba(56, 189, 248, 0.65)", "rgba(59, 130, 246, 0.95)", "#38bdf8"])),
      WILDFIRE: d3.scaleSequential()
        .domain([0, 1])
        .interpolator(d3.interpolateRgbBasis(["rgba(15, 10, 10, 0)", "rgba(120, 30, 15, 0.4)", "rgba(239, 68, 68, 0.65)", "rgba(249, 115, 22, 0.95)", "#facc15"])),
      SUBSIDENCE: d3.scaleSequential()
        .domain([0, 1])
        .interpolator(d3.interpolateRgbBasis(["rgba(12, 12, 15, 0)", "rgba(75, 55, 30, 0.45)", "rgba(196, 167, 125, 0.7)", "rgba(224, 180, 100, 0.95)", "#ffffff"]))
    };

    const activeScale = threatColorScales[selectedThreat];

    if (visualMode === 'GRID') {
      // Draw grid cells
      const cellWidth = width / gridResolution;
      const cellHeight = height / gridResolution;

      dynamicGroup.append("g")
        .attr("class", "grid-cells-layer")
        .selectAll("rect")
        .data(gridPoints)
        .enter()
        .append("rect")
        .attr("x", (d: any) => (d.x / 100) * width - cellWidth / 2)
        .attr("y", (d: any) => (d.y / 100) * height - cellHeight / 2)
        .attr("width", cellWidth)
        .attr("height", cellHeight)
        .attr("fill", (d: any) => activeScale(d.val))
        .attr("stroke", "rgba(255,255,255,0.015)")
        .attr("stroke-width", 0.5)
        .on("mousemove", function(event, d: any) {
          d3.select(this)
            .attr("stroke", selectedThreat === 'FLOOD' ? "#38bdf8" : selectedThreat === 'WILDFIRE' ? "#ef4444" : "#c4a77d")
            .attr("stroke-width", 1.5);
          setHoveredCell(d);
        })
        .on("mouseleave", function() {
          d3.select(this)
            .attr("stroke", "rgba(255,255,255,0.015)")
            .attr("stroke-width", 0.5);
          setHoveredCell(null);
        });

    } else if (visualMode === 'HEXAMESH') {
      // Draw custom dense dots/hex elements using coordinates
      const elementSize = Math.max(3, 40 / gridResolution);

      dynamicGroup.append("g")
        .attr("class", "hexamesh-layer")
        .selectAll("circle")
        .data(gridPoints)
        .enter()
        .append("circle")
        .attr("cx", (d: any) => (d.x / 100) * width)
        .attr("cy", (d: any) => (d.y / 100) * height)
        .attr("r", (d: any) => elementSize * (0.4 + d.val * 0.8))
        .attr("fill", (d: any) => activeScale(d.val))
        .attr("opacity", (d: any) => d.val > 0.05 ? 0.9 : 0.08)
        .attr("stroke", (d: any) => d.val > 0.6 ? "rgba(255,255,255,0.15)" : "none")
        .attr("stroke-width", 0.5)
        .on("mousemove", function(event, d: any) {
          d3.select(this)
            .attr("r", elementSize * 2)
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 1.0);
          setHoveredCell(d);
        })
        .on("mouseleave", function(event, d: any) {
          d3.select(this)
            .attr("r", elementSize * (0.4 + d.val * 0.8))
            .attr("stroke", d.val > 0.6 ? "rgba(255,255,255,0.15)" : "none")
            .attr("stroke-width", 0.5);
          setHoveredCell(null);
        });

    } else {
      // CONTOUR MODE: Draw elegant ISO contour curves using d3.contours
      const nx = gridResolution + 1;
      const ny = gridResolution + 1;

      // Restructure plain 1D gridPoints values into a continuous 2D Array for D3 contour generator
      const gridValues = new Array(nx * ny);
      gridPoints.forEach((p, idx) => {
        gridValues[idx] = p.val;
      });

      const contours = d3.contours()
        .size([nx, ny])
        .thresholds(d3.range(0.05, 1.0, 0.08))(gridValues);

      const scaleX = d3.scaleLinear().domain([0, nx - 1]).range([0, width]);
      const scaleY = d3.scaleLinear().domain([0, ny - 1]).range([0, height]);

      // Draw standard SVG paths using d3 geometries
      const pathGenerator = d3.geoPath().projection(
        d3.geoTransform({
          point: function(x, y) {
            this.stream.point(scaleX(x), scaleY(y));
          }
        })
      );

      dynamicGroup.append("g")
        .attr("class", "contours-layer")
        .selectAll("path")
        .data(contours)
        .enter()
        .append("path")
        .attr("d", pathGenerator)
        .attr("fill", d => activeScale(d.value))
        .attr("opacity", 0.65)
        .attr("stroke", d => activeScale(d.value))
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 0.8)
        .on("mousemove", function(event, d) {
          // Find the closest point in gridPoints to display tooltip info
          const [mx, my] = d3.pointer(event);
          const px = (mx / width) * 100;
          const py = (my / height) * 100;
          
          let closest = gridPoints[0];
          let minDist = Infinity;
          gridPoints.forEach(p => {
            const dist = Math.sqrt(Math.pow(p.x - px, 2) + Math.pow(p.y - py, 2));
            if (dist < minDist) {
              minDist = dist;
              closest = p;
            }
          });

          d3.select(this)
            .attr("opacity", 0.85)
            .attr("stroke-width", 1.5);
          
          setHoveredCell({
            ...closest,
            val: Math.max(closest.val, d.value) // reflect the contour threshold band
          });
        })
        .on("mouseleave", function() {
          d3.select(this)
            .attr("opacity", 0.65)
            .attr("stroke-width", 0.5);
          setHoveredCell(null);
        });
    }

    // Overlay active radar scanner sweeps
    if (isScanning) {
      const scanLine = dynamicGroup.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", width)
        .attr("y2", 0)
        .attr("stroke", selectedThreat === 'FLOOD' ? "rgba(56, 189, 248, 0.45)" : selectedThreat === 'WILDFIRE' ? "rgba(239, 68, 68, 0.45)" : "rgba(196, 167, 125, 0.45)")
        .attr("stroke-width", 2.5)
        .attr("class", "scanner-sweep-element");

      const animateScan = () => {
        scanLine
          .attr("y1", 0)
          .attr("y2", 0)
          .attr("opacity", 1)
          .transition()
          .duration(3800)
          .ease(d3.easeLinear)
          .attr("y1", height)
          .attr("y2", height)
          .transition()
          .duration(0)
          .attr("y1", 0)
          .attr("y2", 0)
          .on("end", animateScan);
      };
      
      animateScan();
    }

  }, [gridPoints, visualMode, selectedThreat, isScanning, gridResolution, modulatedHotspots]);

  // Translate cell value into human text
  const getRiskLabel = (val: number) => {
    if (val < 0.15) return { text: 'Nominal Risk', color: 'text-safe-green', bg: 'bg-safe-green/10', border: 'border-safe-green/20' };
    if (val < 0.45) return { text: 'Moderate Risk', color: 'text-zinc-400', bg: 'bg-zinc-800/35', border: 'border-zinc-700/20' };
    if (val < 0.75) return { text: 'High Exposure', color: 'text-accent-gold', bg: 'bg-accent-gold/10', border: 'border-accent-gold/20' };
    return { text: 'CRITICAL ZONE', color: 'text-danger-red font-extrabold', bg: 'bg-danger-red/10', border: 'border-danger-red/30' };
  };

  const threatColorTheme = useMemo(() => {
    if (selectedThreat === 'FLOOD') return { themeColor: '#38bdf8', rawRGB: '56, 189, 248' };
    if (selectedThreat === 'WILDFIRE') return { themeColor: '#ef4444', rawRGB: '239, 68, 68' };
    return { themeColor: '#c4a77d', rawRGB: '196, 167, 125' };
  }, [selectedThreat]);

  return (
    <div 
      id="geographic-threat-overlay-root" 
      className="xl:col-span-12 border border-border-dark bg-[#0a0d14] overflow-hidden flex flex-col font-mono text-xs text-[#e5e5e5] h-full"
    >
      {/* 1. COMPONENT HEADER */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-border-dark bg-[#0f121d] px-4 py-3 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-accent-gold/15 border border-accent-gold/20 text-accent-gold">
            <Layers size={16} />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#ffffff] flex items-center gap-1.5">
              Geographic Threat Overlay 
              <span className="text-[9px] px-1.5 py-0.5 bg-danger-red/15 text-danger-red border border-danger-red/25 rounded-sm uppercase tracking-normal animate-pulse">
                ACTUARIAL SCAN
              </span>
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              D3 spatial contour mesh aligned to localized micro-climate coordinates
            </p>
          </div>
        </div>

        {/* Dynamic coordinate readout */}
        <div className="flex items-center gap-4 text-[10px] bg-bg-dark/80 border border-border-dark px-3 py-1.5 self-start md:self-auto">
          <div className="flex items-center gap-1 text-zinc-500">
            <MapPin size={12} className="text-accent-gold" />
            <span className="text-zinc-400">FOCUS:</span>
          </div>
          <span className="font-bold text-[#ffffff] truncate max-w-[140px] md:max-w-none">
            {activeReport.location.toUpperCase()}
          </span>
          <span className="text-[#888888]">
            [{activeReport.coordinates}]
          </span>
        </div>
      </div>

      {/* 2. MAIN LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1">
        
        {/* LEFT COLUMN: CONTROL & METRICS PANEL (span 4/12) */}
        <div className="lg:col-span-4 border-r border-border-dark p-4 flex flex-col gap-4 text-left bg-gradient-to-b from-[#0a0d14] to-[#080a10]">
          
          {/* A. THREAT SELECTION LAYERS */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#c4a77d] rounded-full" />
              Active Environmental Layer
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                id="threat-btn-flood"
                onClick={() => { setSelectedThreat('FLOOD'); if(selectedNode) setSelectedNode(null); }}
                className={`py-2 px-2 border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedThreat === 'FLOOD'
                    ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                    : 'bg-bg-dark/40 border-border-dark text-[#888888] hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                <Waves size={14} className={selectedThreat === 'FLOOD' ? 'animate-bounce' : ''} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Flood Risk</span>
              </button>

              <button
                id="threat-btn-wildfire"
                onClick={() => { setSelectedThreat('WILDFIRE'); if(selectedNode) setSelectedNode(null); }}
                className={`py-2 px-2 border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedThreat === 'WILDFIRE'
                    ? 'bg-red-500/10 border-red-500 text-red-400'
                    : 'bg-bg-dark/40 border-border-dark text-[#888888] hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                <Flame size={14} className={selectedThreat === 'WILDFIRE' ? 'animate-pulse' : ''} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Wildfire</span>
              </button>

              <button
                id="threat-btn-subsidence"
                onClick={() => { setSelectedThreat('SUBSIDENCE'); if(selectedNode) setSelectedNode(null); }}
                className={`py-2 px-2 border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  selectedThreat === 'SUBSIDENCE'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                    : 'bg-bg-dark/40 border-border-dark text-[#888888] hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                <TrendingUp size={14} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Subsidence</span>
              </button>
            </div>
          </div>

          {/* B. VISUAL STYLE SELECTORS */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-bold tracking-widest text-[#888888] uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#c4a77d] rounded-full" />
              D3 Spatial Core Engine
            </span>
            <div className="grid grid-cols-3 gap-1 px-1 py-1 bg-bg-dark/80 border border-border-dark">
              {(['CONTOUR', 'HEXAMESH', 'GRID'] as VisualMode[]).map((mode) => (
                <button
                  key={mode}
                  id={`visual-mode-btn-${mode.toLowerCase()}`}
                  onClick={() => setVisualMode(mode)}
                  className={`py-1.5 text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                    visualMode === mode
                      ? 'bg-zinc-800 text-white font-black'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {mode === 'CONTOUR' ? 'Contour' : mode === 'HEXAMESH' ? 'Hex-Mesh' : 'Grid'}
                </button>
              ))}
            </div>
          </div>

          {/* C. SCANNING PROBE RESOLUTION */}
          <div className="flex justify-between items-center gap-4 bg-bg-dark/40 border border-border-dark/60 p-2.5">
            <div className="flex flex-col items-start">
              <span className="text-[8px] tracking-widest text-zinc-500 uppercase font-black">Probe Density</span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">{resolution}-Fidelity</span>
            </div>
            <div className="flex gap-1">
              {(['LOW', 'MED', 'HIGH'] as const).map((lvl) => (
                <button
                  key={lvl}
                  id={`probe-resolution-btn-${lvl.toLowerCase()}`}
                  onClick={() => setResolution(lvl)}
                  className={`w-8 py-1 rounded-sm text-[8px] font-extrabold uppercase border text-center transition-all cursor-pointer ${
                    resolution === lvl
                      ? 'bg-accent-gold/15 border-accent-gold text-accent-gold'
                      : 'bg-bg-dark border-border-dark text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {lvl[0]}
                </button>
              ))}
            </div>
          </div>

          {/* D. LIVE SCAN FEED / HORIZON SYNC */}
          <div className="border border-border-dark bg-bg-dark/60 p-3 rounded-sm flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold tracking-widest text-zinc-500 uppercase flex items-center gap-1">
                <Radio size={10} className="text-accent-gold animate-pulse" />
                D3 Spatial Actuarial Feed
              </span>
              <button 
                id="toggle-radar-scan-btn"
                onClick={() => setIsScanning(!isScanning)}
                className="text-[8px] uppercase tracking-wider text-accent-gold hover:underline cursor-pointer flex items-center gap-1 font-bold"
              >
                <RefreshCw size={8} className={isScanning ? "animate-spin" : ""} />
                {isScanning ? 'Lock Sweep' : 'Engage Sweep'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-[#0f121d] border border-border-dark p-2 text-left">
                <div className="text-zinc-500 text-[8px] uppercase font-bold">Horizon Focus</div>
                <div className="font-extrabold text-accent-gold tracking-widest mt-0.5">
                  {currentHorizon.horizon} YEARS ({currentHorizon.year})
                </div>
              </div>
              <div className="bg-[#0f121d] border border-border-dark p-2 text-left">
                <div className="text-zinc-500 text-[8px] uppercase font-bold">Map Projection</div>
                <div className="font-extrabold text-[#ffffff] tracking-wide mt-0.5">
                  Mercator Bounds
                </div>
              </div>
            </div>

            {/* Dynamic Local Threat Analysis Details */}
            <div className="mt-1 text-[11px] leading-relaxed text-zinc-400 bg-surface-dark/40 p-2 borders border-border-dark/40">
              <span className="text-[10px] text-zinc-400 font-bold block mb-1">
                {selectedThreat} ANALYSIS NARRATIVE:
              </span>
              {selectedThreat === 'FLOOD' && (
                <span>
                  Pluvial surface accumulation risk is currently mapped as{' '}
                  <span className="text-[#38bdf8] font-bold">{currentHorizon.metrics.floodProb}</span>{' '}
                  under active emissions multiplier. Sea lock out-gates operate under reduced tidal gravity drainage velocity.
                </span>
              )}
              {selectedThreat === 'WILDFIRE' && (
                <span>
                  Extended heat indexes exceeding{' '}
                  <span className="text-red-400 font-bold">{currentHorizon.metrics.heatIndexDays}</span>{' '}
                  and average temperatures trending around <span className="text-red-400 font-bold">{currentHorizon.metrics.averageTemp}</span>{' '}
                  substantially expand organic scrub fuel combustion coefficients along suburban buffer assets.
                </span>
              )}
              {selectedThreat === 'SUBSIDENCE' && (
                <span>
                  Structural foundation indices decline to{' '}
                  <span className="text-amber-400 font-bold">{currentHorizon.metrics.foundationIntegrity}</span>{' '}
                  owing to extensive aquifer exhaustion level: <span className="text-amber-400 font-bold">{currentHorizon.metrics.localAquifer}</span>. 
                  Subterranean silt and peat cavities consolidate under sustained high load pressures.
                </span>
              )}
            </div>
          </div>

          {/* E. SELECTED COORDINATE DETAILS / NODE HUD */}
          <div className="flex-1 flex flex-col justify-end">
            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div
                  key="node-hud"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                  className="border border-[#c4a77d]/35 bg-[#121210] p-3 text-left flex flex-col gap-2 rounded-sm"
                >
                  <div className="flex items-center justify-between border-b border-[#c4a77d]/20 pb-1.5">
                    <span className="text-[9px] font-black text-accent-gold uppercase tracking-widest flex items-center gap-1">
                      <Crosshair size={10} className="animate-spin" />
                      Locked Target Probe
                    </span>
                    <button
                      id="close-hud-btn"
                      onClick={() => setSelectedNode(null)}
                      className="text-zinc-500 hover:text-zinc-200 hover:underline text-[9px] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase">{selectedNode.type}</span>
                    <h4 className="text-xs font-bold text-white tracking-wide mt-0.5">
                      {selectedNode.name}
                    </h4>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    {selectedNode.description}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#c4a77d]/10 text-[9px]">
                    <div className="bg-bg-dark/80 px-2 py-1">
                      <span className="text-zinc-500 block">Relative Coordinates</span>
                      <span className="text-[#ffffff] font-bold">X: {selectedNode.x}%, Y: {selectedNode.y}%</span>
                    </div>
                    <div className="bg-bg-dark/80 px-2 py-1">
                      <span className="text-zinc-500 block">Empirical Impact</span>
                      <span className="text-danger-red font-bold uppercase tracking-wider">Critical Exposure</span>
                    </div>
                  </div>
                </motion.div>
              ) : hoveredCell ? (
                <motion.div
                  key="cell-hud"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border border-border-dark bg-bg-dark/50 p-3 text-left flex flex-col gap-2"
                >
                  <div className="text-[8px] font-bold text-zinc-500 tracking-widest uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#38bdf8] rounded-full animate-ping" />
                    Grid Coordinate Probe
                  </div>
                  <div className="flex justify-between items-center bg-[#07090f] p-1.5 border border-border-dark rounded-sm">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 uppercase">Latitude Bounds</span>
                      <span className="text-[10px] font-bold font-mono text-[#ffffff]">
                        {hoveredCell.lat.toFixed(5)}° {baseCoordinates.latDir}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 uppercase">Longitude Bounds</span>
                      <span className="text-[10px] font-bold font-mono text-[#ffffff]">
                        {hoveredCell.lng.toFixed(5)}° {baseCoordinates.lngDir}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`px-2 py-1 text-[10px] font-black tracking-wider uppercase border rounded-sm ${getRiskLabel(hoveredCell.val).bg} ${getRiskLabel(hoveredCell.val).color} ${getRiskLabel(hoveredCell.val).border}`}>
                      {getRiskLabel(hoveredCell.val).text}
                    </div>
                    <span className="text-zinc-400 font-bold text-[11px]">
                      Value: {(hoveredCell.val * 100).toFixed(0)}% Intensity
                    </span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="static-hud"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border border-dashed border-border-dark p-4 text-center text-zinc-500 flex flex-col items-center justify-center gap-1.5 bg-[#080a10]/40 rounded-sm"
                >
                  <Info size={16} className="text-zinc-600 block" />
                  <span className="text-[10px] font-bold">PROBE SCAN STATION ACTIVE</span>
                  <span className="text-[9px] text-zinc-600 leading-normal max-w-[200px]">
                    Hover over heatmap cells, contours or tap map landmarks to acquire locked coordinates and analyze localized risk.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* RIGHT COLUMN: INTERACTIVE D3 SVG MAP CANVAS (span 8/12) */}
        <div className="lg:col-span-8 bg-[#04060b] relative flex flex-col justify-between overflow-hidden group select-none min-h-[460px] lg:min-h-[500px]">
          
          {/* TOP INNER BAR: Threat level index indicator */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 text-left bg-zinc-950/80 backdrop-blur-md border border-border-dark p-2.5 rounded-sm">
            <span className="text-[8px] tracking-widest text-[#888888] font-bold uppercase flex items-center gap-1">
              <Crosshair size={9} className="text-accent-gold" />
              Empirical Sensor Scale ({selectedThreat})
            </span>
            <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px] font-black">
              <span className="text-zinc-600">0%</span>
              <div className="flex gap-0.5 h-2 w-28 border border-zinc-800 p-0.5 bg-zinc-900">
                <div className="h-full w-[25%] opacity-50" style={{ backgroundColor: selectedThreat === 'FLOOD' ? '#0ea5e9' : selectedThreat === 'WILDFIRE' ? '#ef4444' : '#c4a77d' }} />
                <div className="h-full w-[25%] opacity-70" style={{ backgroundColor: selectedThreat === 'FLOOD' ? '#38bdf8' : selectedThreat === 'WILDFIRE' ? '#f87171' : '#c4a77d' }} />
                <div className="h-full w-[25%] opacity-90" style={{ backgroundColor: selectedThreat === 'FLOOD' ? '#60a5fa' : selectedThreat === 'WILDFIRE' ? '#facc15' : '#e0b464' }} />
                <div className="h-full w-[25%]" style={{ backgroundColor: selectedThreat === 'FLOOD' ? '#ffffff' : selectedThreat === 'WILDFIRE' ? '#ffffff' : '#ffffff' }} />
              </div>
              <span style={{ color: threatColorTheme.themeColor }}>100% EXPOSURE</span>
            </div>
          </div>

          <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-zinc-950/80 backdrop-blur-md border border-border-dark px-2.5 py-1 rounded-sm text-[8px] text-zinc-500 uppercase font-black">
            <span className="w-1.5 h-1.5 rounded-full bg-safe-green animate-pulse" />
            D3 Spatial Canvas Rendered
          </div>

          {/* D3 RENDER SVG VIEWPORT */}
          <div className="flex-1 flex items-center justify-center relative p-6">
            <div className="relative border border-border-dark bg-bg-dark h-[480px] w-[640px] shadow-2xl overflow-hidden shadow-[#000000]">
              
              {/* Outer compass marks / graticules */}
              <div className="absolute bottom-1 right-2 z-10 font-mono text-[8px] text-zinc-600 uppercase flex items-center gap-2">
                <span>Contour Map Overlay v3.9</span>
                <span className="text-zinc-400">FPS: 60/60</span>
              </div>

              {/* Grid backdrop lines behind everything */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:20px_20px]" />

              <svg
                ref={svgRef}
                viewBox="0 0 640 480"
                width="100%"
                height="100%"
                id="d3-threat-overlay-svg-canvas"
                style={{ background: '#05070c' }}
                className="block relative cursor-crosshair"
              >
                {/* 1. LAYER A: STATIC LAND AREA SHAPES IN BACKGROUND */}
                <g className="landmaps-shape-layer" opacity={0.16}>
                  {mapConfig.landPaths.map((path, pIdx) => (
                    <path
                      key={`land-${pIdx}`}
                      d={d3.line()
                        .x(d => (d[0] / 100) * 640)
                        .y(d => (d[1] / 100) * 480)
                        .curve(d3.curveCardinalClosed.tension(0.45))(path) || undefined}
                      fill="#888888"
                      stroke="#888888"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                    />
                  ))}
                </g>

                {/* 2. LAYER B: CANAL / WATER PATHS */}
                <g className="canal-paths-layer" opacity={0.25}>
                  {mapConfig.waterPaths && mapConfig.waterPaths.map((path, wIdx) => (
                    <path
                      key={`water-${wIdx}`}
                      d={d3.line()
                        .x(d => (d[0] / 100) * 640)
                        .y(d => (d[1] / 100) * 480)
                        .curve(d3.curveCardinalClosed.tension(0.35))(path) || undefined}
                      fill="#0e345a"
                      stroke="#0e345a"
                      strokeWidth={1}
                    />
                  ))}
                </g>

                {/* 3. LAYER C: LAT/LNG BOUNDARY TICK OVERLAYS */}
                <g className="bounding-ticks-coordinates text-[7px]" fill="rgba(255,255,255,0.18)" opacity={1}>
                  {/* Top Tick markers */}
                  {[0, 25, 50, 75, 100].map((perc, tIdx) => {
                    const latSpan = mapConfig.bounds.maxLat - mapConfig.bounds.minLat;
                    const lngSpan = mapConfig.bounds.maxLng - mapConfig.bounds.minLng;
                    const currentLatVal = mapConfig.bounds.maxLat - (perc / 100) * latSpan;
                    const currentLngVal = mapConfig.bounds.minLng + (perc / 100) * lngSpan;

                    return (
                      <g key={`ticks-${tIdx}`}>
                        {/* Upper edge X markers */}
                        <line x1={(perc / 100) * 640} y1={0} x2={(perc / 100) * 640} y2={6} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                        <text x={(perc / 100) * 640 + 3} y={12} textAnchor="start" fontFamily="JetBrains Mono">
                          {currentLngVal.toFixed(3)}°{baseCoordinates.lngDir}
                        </text>

                        {/* Left edge Y markers */}
                        <line x1={0} y1={(perc / 100) * 480} x2={6} y2={(perc / 100) * 480} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                        <text x={8} y={(perc / 100) * 480 + 3} textAnchor="start" fontFamily="JetBrains Mono">
                          {currentLatVal.toFixed(3)}°{baseCoordinates.latDir}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* DYNAMIC CONTENT DROPPED IN BY D3 EFFECT GOES HERE IN REALTIME */}

                {/* 4. LAYER D: LANDMARK / PHYSICAL INFRASTRUCTURE TARGET NODES OVERLAY */}
                <g className="key-nodes-overlay-layer">
                  {mapConfig.keyNodes.map((node) => {
                    const mappedX = (node.x / 100) * 640;
                    const mappedY = (node.y / 100) * 480;
                    const isTargetLocked = selectedNode?.id === node.id;

                    const nodeColors = {
                      PORTFOLIO: { bg: '#c4a77d', border: '#ffffff' },
                      INFRASTRUCTURE: { bg: '#38bdf8', border: '#1e3a8a' },
                      CRITICAL_DEFENSE: { bg: '#ef4444', border: '#ffffff' },
                      HYDRAULIC_UNIT: { bg: '#10b981', border: '#064e3b' }
                    };

                    const currentColors = nodeColors[node.type] || nodeColors.PORTFOLIO;

                    return (
                      <g 
                        key={node.id} 
                        transform={`translate(${mappedX}, ${mappedY})`}
                        className="cursor-pointer group/node"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNode(node);
                        }}
                      >
                        {/* Dynamic pulse ripple glow ring if threat level in this zone is high */}
                        <circle 
                          r={isTargetLocked ? 12 : 6.5} 
                          fill="none" 
                          stroke={currentColors.bg} 
                          strokeWidth={isTargetLocked ? 2 : 1.2}
                          className="animate-ping" 
                          opacity={isTargetLocked ? 0.8 : 0.25}
                        />

                        {/* Outer crosshair ring on hover */}
                        <circle 
                          r={10} 
                          fill="none" 
                          stroke="#ffffff" 
                          strokeWidth={0.8} 
                          strokeDasharray="2 2"
                          className="opacity-0 group-hover/node:opacity-60 transition-opacity"
                        />

                        {/* Solid center dot */}
                        <circle 
                          r={4.5} 
                          fill={currentColors.bg} 
                          stroke="#05070c" 
                          strokeWidth={1.5}
                        />

                        {/* Text Label Backdrop */}
                        <rect 
                          x={6} 
                          y={-12} 
                          width={node.name.length * 5.2 + 8} 
                          height={12} 
                          fill="#05070c" 
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth={0.5}
                          rx={1.5}
                          className="opacity-20 group-hover/node:opacity-100 transition-opacity"
                        />

                        {/* Text label string */}
                        <text 
                          x={10} 
                          y={-3} 
                          fill="#ffffff" 
                          fontSize={6.8} 
                          fontWeight="black"
                          fontFamily="JetBrains Mono"
                          className="text-[#ffffff] opacity-35 group-hover/node:opacity-100 transition-opacity"
                        >
                          {node.name.toUpperCase()}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          </div>

          {/* LOWER INNER LEGEND BAR: Displays visual indicators and decadal trend warning */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-border-dark bg-[#070a0f] p-3 text-[10px] gap-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-zinc-500 uppercase tracking-widest font-black text-[9px]">Map Legend:</span>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded bg-sky-400/80 border border-sky-400/30" />
                <span>Flood Extent</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded bg-red-500/80 border border-red-500/30" />
                <span>Wildfire Fuel</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded bg-accent-gold/80 border border-accent-gold/30" />
                <span>Subsidence Sinking</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span className="text-[9px]">Key Assets / Sensors</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1 bg-danger-red/10 border border-danger-red/15 text-danger-red font-bold text-[9px] uppercase tracking-wider self-start sm:self-auto">
              <ShieldAlert size={11} className="animate-bounce" />
              <span>Severe Decadal Decelerator Risk Trigger: {activeReport.transitionLiabilityDecade}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
