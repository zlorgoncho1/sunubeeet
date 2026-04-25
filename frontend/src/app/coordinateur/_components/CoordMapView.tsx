"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import {
  Incident,
  Agent,
  Site,
  SEVERITY_COLORS,
  QR_STATIONS,
} from "../data";
import { env } from "@/lib/env";

const VENUE: [number, number] = [-17.4602, 14.69];

type MapViewType = "Heatmap" | "Agents" | "QR";

interface CoordMapViewProps {
  incidents: Incident[];
  agents: Agent[];
  sites: Site[];
  selectedId: string | null;
  activeView: MapViewType;
  onSelectIncident: (id: string) => void;
}

export default function CoordMapView({
  incidents,
  agents,
  sites,
  selectedId,
  activeView,
  onSelectIncident,
}: CoordMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

   // Init map once
   useEffect(() => {
     if (!containerRef.current || mapRef.current) return;

     if (env.MAPBOX_TOKEN) {
       mapboxgl.accessToken = env.MAPBOX_TOKEN;
     }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: VENUE,
      zoom: 15.5,
      pitch: 0,
      attributionControl: false,
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when data or selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function addMarkers() {
      if (!map) return;
      // Clear existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const showIncidents = activeView === "Heatmap" || activeView === "Agents";
      const showAgents = activeView === "Agents" || activeView === "Heatmap";
      const showQR = activeView === "QR" || activeView === "Heatmap";

      // ── Incident markers ──────────────────────────────────
      if (showIncidents) {
        incidents.forEach((inc) => {
          const isSelected = inc.id === selectedId;
          const color = SEVERITY_COLORS[inc.severity];
          const isCritical = inc.severity === "critique";

          const el = document.createElement("div");
          el.style.cssText = "cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;";

          if (isCritical) {
            el.innerHTML = `
              <div style="
                position:absolute;
                width:2rem;height:2rem;
                background:${color};opacity:0.2;
                border-radius:9999px;
                animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
              "></div>
              <div style="
                position:relative;
                width:${isSelected ? "1.1rem" : "0.85rem"};
                height:${isSelected ? "1.1rem" : "0.85rem"};
                background:${color};
                border-radius:9999px;
                border:${isSelected ? "3px solid #000" : "2px solid white"};
                box-shadow:0 2px 6px rgba(0,0,0,0.25);
                z-index:10;
              "></div>
            `;
          } else {
            el.innerHTML = `
              <div style="
                width:${isSelected ? "1.1rem" : "0.75rem"};
                height:${isSelected ? "1.1rem" : "0.75rem"};
                background:${color};
                border-radius:9999px;
                border:${isSelected ? "3px solid #000" : "2px solid white"};
                box-shadow:0 2px 6px rgba(0,0,0,0.2);
              "></div>
            `;
          }

          // Label
          const label = document.createElement("div");
          label.style.cssText = `
            position:absolute;top:110%;left:50%;transform:translateX(-50%);
            white-space:nowrap;
            background:${isSelected ? "#000" : "rgba(255,255,255,0.92)"};
            color:${isSelected ? "#fff" : "#212529"};
            font-size:10px;font-weight:500;
            padding:2px 6px;border-radius:6px;
            border:1px solid ${isSelected ? "#000" : "rgba(0,0,0,0.08)"};
            box-shadow:0 1px 3px rgba(0,0,0,0.12);
            pointer-events:none;
          `;
          label.textContent = inc.id;
          el.appendChild(label);

          el.addEventListener("click", () => onSelectIncident(inc.id));

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat(inc.coordinates)
            .addTo(map!);
          markersRef.current.push(marker);
        });
      }

      // ── Agent markers ──────────────────────────────────────
      if (showAgents) {
        agents.forEach((agent) => {
          const statusColor =
            agent.status === "disponible"
              ? "#22c55e"
              : agent.status === "en_route"
              ? "#a855f7"
              : "#3b82f6";

          const el = document.createElement("div");
          el.style.cssText = "cursor:default;position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;";
          el.innerHTML = `
            <div style="
              width:0.65rem;height:0.65rem;
              background:${statusColor};
              border-radius:9999px;
              border:2px solid white;
              box-shadow:0 1px 4px rgba(0,0,0,0.2);
            "></div>
            <div style="
              white-space:nowrap;
              background:rgba(255,255,255,0.92);
              color:#6c757d;
              font-size:9px;font-weight:500;
              padding:1px 4px;border-radius:4px;
              border:1px solid rgba(0,0,0,0.06);
              pointer-events:none;
            ">${agent.name.split(" ")[0]}</div>
          `;

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat(agent.coordinates)
            .addTo(map!);
          markersRef.current.push(marker);
        });
      }

      // ── QR station markers ─────────────────────────────────
      if (showQR) {
        QR_STATIONS.forEach((qr) => {
          const el = document.createElement("div");
          el.style.cssText = "cursor:default;position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;";
          el.innerHTML = `
            <div style="
              width:0.55rem;height:0.55rem;
              background:#9ca3af;
              border-radius:2px;
              border:1.5px solid white;
              box-shadow:0 1px 3px rgba(0,0,0,0.15);
            "></div>
            <div style="
              white-space:nowrap;
              background:rgba(255,255,255,0.88);
              color:#6c757d;
              font-size:8px;font-weight:500;
              padding:1px 3px;border-radius:3px;
              border:1px solid rgba(0,0,0,0.05);
            ">${qr.label}</div>
          `;

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat(qr.coordinates)
            .addTo(map!);
          markersRef.current.push(marker);
        });
      }

      // ── Site markers (hôpital…) ────────────────────────────
      sites.forEach((site) => {
        const el = document.createElement("div");
        el.style.cssText = "cursor:default;position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;";
        el.innerHTML = `
          <div style="
            width:1.25rem;height:1.25rem;
            background:white;
            border:1.5px solid #bfdbfe;
            border-radius:4px;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 6px rgba(0,0,0,0.15);
            color:#3b82f6;font-size:10px;font-weight:700;
          ">H</div>
          <div style="
            white-space:nowrap;
            background:rgba(255,255,255,0.92);
            color:#1d4ed8;
            font-size:9px;font-weight:500;
            padding:1px 5px;border-radius:4px;
            border:1px solid rgba(0,0,0,0.06);
          ">${site.name}</div>
        `;

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(site.coordinates)
          .addTo(map!);
        markersRef.current.push(marker);
      });
    }

    if (map.isStyleLoaded()) {
      addMarkers();
    } else {
      map.once("load", addMarkers);
    }
  }, [incidents, agents, sites, selectedId, activeView, onSelectIncident]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
