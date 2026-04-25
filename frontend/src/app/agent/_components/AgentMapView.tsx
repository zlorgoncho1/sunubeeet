"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Mission, NEARBY_INCIDENTS } from "../data";
import { env } from "@/lib/env";

// Use environment variable from .env.local or .env.production
if (env.MAPBOX_TOKEN) {
  mapboxgl.accessToken = env.MAPBOX_TOKEN;
}

const AGENT_POSITION = { lat: 14.6922, lng: -17.4462 };

interface Props {
  activeMission: Mission | null;
}

export default function AgentMapView({ activeMission }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [AGENT_POSITION.lng, AGENT_POSITION.lat],
      zoom: 15.5,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      // Agent position marker
      const agentEl = document.createElement("div");
      agentEl.className = "agent-marker";
      agentEl.style.cssText = `
        width: 40px; height: 40px; border-radius: 50%;
        background: #3b82f6; border: 3px solid white;
        box-shadow: 0 0 0 4px rgba(59,130,246,0.3), 0 4px 12px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; color: white; font-weight: 600;
      `;
      agentEl.textContent = "Moi";
      new mapboxgl.Marker({ element: agentEl })
        .setLngLat([AGENT_POSITION.lng, AGENT_POSITION.lat])
        .addTo(map);

      // Nearby incidents
      NEARBY_INCIDENTS.forEach((inc) => {
        const el = document.createElement("div");
        const color = inc.severity === "élevé" ? "#f97316" : "#eab308";
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 50%;
          background: ${color}; border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          cursor: pointer;
        `;
        new mapboxgl.Marker({ element: el })
          .setLngLat([inc.lng, inc.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(
              `<div style="font-family:Manrope,sans-serif;font-size:12px;padding:4px 2px"><strong>${inc.id}</strong><br/>${inc.title}</div>`
            )
          )
          .addTo(map);
      });

      // Active mission marker
      if (activeMission) {
        const missionEl = document.createElement("div");
        missionEl.style.cssText = `
          width: 36px; height: 36px; border-radius: 50%;
          background: #ef4444; border: 3px solid white;
          box-shadow: 0 0 0 6px rgba(239,68,68,0.25), 0 4px 12px rgba(0,0,0,0.5);
          animation: pulse 1.5s infinite;
        `;
        new mapboxgl.Marker({ element: missionEl })
          .setLngLat([activeMission.lng, activeMission.lat])
          .addTo(map);

        // Fly to mission
        map.flyTo({
          center: [activeMission.lng, activeMission.lat],
          zoom: 16,
          duration: 1500,
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [activeMission]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
