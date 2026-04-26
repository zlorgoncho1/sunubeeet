"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { env } from "@/lib/env";
import { spectatorApi } from "@/lib/api/services/spectator";
import { sitesApi } from "@/lib/api/services/sites";
import { usePolling } from "@/lib/realtime/usePolling";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { SEVERITY_COLORS } from "@/lib/i18n/labels";
import type { Incident, Site } from "@/lib/types";

// Fallback token should be configured via NEXT_PUBLIC_MAPBOX_TOKEN env variable
const FALLBACK_TOKEN = "";


export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const incidentMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const siteMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const incidentsRef = useRef<Incident[]>([]);
  const sitesRef = useRef<Site[]>([]);

  const geo = useGeolocation({ watch: true });

  // Initialisation map (une fois)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = env.MAPBOX_TOKEN || FALLBACK_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [geo.longitude, geo.latitude],
      zoom: 16.2,
      pitch: 0,
      attributionControl: false,
      cooperativeGestures: false,
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marker utilisateur (suivi)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const lng = geo.longitude;
    const lat = geo.latitude;

    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.style.cssText = "position:relative;width:1.125rem;height:1.125rem;";
      el.innerHTML = `
        <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:3rem;height:3rem;background:rgba(59,130,246,0.22);border-radius:9999px;"></div>
        <div style="position:relative;width:1.125rem;height:1.125rem;background:#3b82f6;border-radius:9999px;border:3px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.25);"></div>
      `;
      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([lng, lat]);
    }
  }, [geo.latitude, geo.longitude]);

  // Polling des incidents et sites proches
  usePolling(async () => {
    const map = mapRef.current;
    if (!map || geo.loading) return;

    try {
      const [incidents, sites] = await Promise.all([
        spectatorApi.incidentsNearby({ lat: geo.latitude, lng: geo.longitude, radius: 2000 }).catch(() => incidentsRef.current),
        sitesApi.nearby({ lat: geo.latitude, lng: geo.longitude, radius: 2000 }).catch(() => sitesRef.current),
      ]);

      incidentsRef.current = incidents;
      sitesRef.current = sites;

      // Reset markers
      incidentMarkersRef.current.forEach((m) => m.remove());
      incidentMarkersRef.current = [];
      siteMarkersRef.current.forEach((m) => m.remove());
      siteMarkersRef.current = [];

      // Incidents
      incidents.forEach((inc) => {
        const el = document.createElement("div");
        const color = SEVERITY_COLORS[inc.severity] ?? "#ef4444";
        el.style.cssText = `width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 4px ${color}33;cursor:pointer;`;
        const m = new mapboxgl.Marker({ element: el })
          .setLngLat([inc.longitude, inc.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 12, closeButton: false }).setHTML(
              `<div style="font-family:Manrope, sans-serif;padding:4px;">
                <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#888;">${inc.category}</div>
                <div style="font-size:13px;color:#111;font-weight:500;margin-top:2px;">${inc.reference}</div>
              </div>`,
            ),
          )
          .addTo(map);
        incidentMarkersRef.current.push(m);
      });

      // Sites
      sites.forEach((site) => {
        const el = document.createElement("div");
        el.style.cssText = `width:24px;height:24px;border-radius:9999px;background:white;border:2px solid #10b981;display:flex;align-items:center;justify-content:center;font-size:12px;color:#10b981;font-weight:600;`;
        el.textContent = site.name.charAt(0).toUpperCase();
        const m = new mapboxgl.Marker({ element: el })
          .setLngLat([site.longitude, site.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(
              `<div style="font-family:Manrope, sans-serif;padding:4px;">
                <div style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#888;">${site.type}</div>
                <div style="font-size:13px;color:#111;font-weight:500;margin-top:2px;">${site.name}</div>
                ${site.phone ? `<a style="font-size:11px;color:#10b981;display:block;margin-top:4px;" href="tel:${site.phone}">${site.phone}</a>` : ""}
              </div>`,
            ),
          )
          .addTo(map);
        siteMarkersRef.current.push(m);
      });
    } catch {
      // ignore
    }
  }, { intervalMs: 15000, enabled: !geo.loading });

  return (
    <div className="absolute inset-0 z-0">
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
