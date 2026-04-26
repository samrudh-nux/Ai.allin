import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EmergencyRecord, HospitalRecord, ResourceRecord } from './types';

// ─── Fix Leaflet default icon paths (broken in Vite builds) ─────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Custom SVG Icon Factory ─────────────────────────────────────────────────
function makeSvgIcon(svg: string, size = 32): L.DivIcon {
  return L.divIcon({
    html: svg,
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor:[0, -(size / 2)],
  });
}

const ICONS = {
  emergency: {
    Critical: makeSvgIcon(`
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="#ef4444" stroke="#fff" stroke-width="2"/>
        <text x="16" y="21" text-anchor="middle" font-size="16" fill="white">🚨</text>
      </svg>`),
    Moderate: makeSvgIcon(`
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="#f59e0b" stroke="#fff" stroke-width="2"/>
        <text x="16" y="21" text-anchor="middle" font-size="16" fill="white">⚠️</text>
      </svg>`),
    Low: makeSvgIcon(`
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
        <text x="16" y="21" text-anchor="middle" font-size="16" fill="white">ℹ️</text>
      </svg>`),
  },
  hospital: {
    High:   makeSvgIcon(`<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="28" height="28" rx="6" fill="#dc2626" stroke="#fff" stroke-width="2"/><text x="16" y="22" text-anchor="middle" font-size="18" fill="white">🏥</text></svg>`),
    Medium: makeSvgIcon(`<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="28" height="28" rx="6" fill="#2563eb" stroke="#fff" stroke-width="2"/><text x="16" y="22" text-anchor="middle" font-size="18" fill="white">🏥</text></svg>`),
    Low:    makeSvgIcon(`<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="28" height="28" rx="6" fill="#16a34a" stroke="#fff" stroke-width="2"/><text x="16" y="22" text-anchor="middle" font-size="18" fill="white">🏥</text></svg>`),
  },
  resource: {
    Ambulance: makeSvgIcon(`<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="14" fill="#10b981" stroke="#fff" stroke-width="2"/><text x="16" y="22" text-anchor="middle" font-size="16" fill="white">🚑</text></svg>`),
    Police:    makeSvgIcon(`<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="14" fill="#3b82f6" stroke="#fff" stroke-width="2"/><text x="16" y="22" text-anchor="middle" font-size="16" fill="white">🚓</text></svg>`),
  },
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface GlobalMapProps {
  center:         [number, number];
  emergencies:    EmergencyRecord[];
  hospitals:      HospitalRecord[];
  resources:      ResourceRecord[];
  onMarkerClick:  (type: 'emergency' | 'hospital' | 'resource', id: string) => void;
}

// ─── Helper: format popup HTML ────────────────────────────────────────────────
function emergencyPopup(e: EmergencyRecord): string {
  const priorityColor = e.priority === 'Critical' ? '#ef4444' : e.priority === 'Moderate' ? '#f59e0b' : '#3b82f6';
  return `
    <div style="font-family:system-ui;min-width:200px;padding:4px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="background:${priorityColor};color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:99px;text-transform:uppercase">${e.priority}</span>
        <span style="font-size:11px;color:#64748b;font-weight:700">${e.id}</span>
      </div>
      <p style="font-size:13px;font-weight:900;color:#0f172a;margin:0 0 4px">${e.subtype || e.type}</p>
      <p style="font-size:11px;color:#64748b;margin:0 0 6px">📍 ${e.locationName || 'Unknown location'}</p>
      <p style="font-size:11px;color:#64748b;margin:0 0 4px">👤 ${e.citizen || '—'}</p>
      ${e.assignedResource ? `<p style="font-size:11px;color:#10b981;font-weight:700;margin:0">🚑 ${e.assignedResource} dispatched</p>` : '<p style="font-size:11px;color:#f59e0b;font-weight:700;margin:0">⏳ Awaiting dispatch</p>'}
      <p style="font-size:10px;color:#94a3b8;margin:4px 0 0">${new Date(e.timestamp).toLocaleTimeString()}</p>
    </div>`;
}

function hospitalPopup(h: HospitalRecord): string {
  const icuPct = Math.round((h.availableIcu / h.icuBeds) * 100);
  const loadColor = h.load === 'High' ? '#ef4444' : h.load === 'Medium' ? '#f59e0b' : '#10b981';
  return `
    <div style="font-family:system-ui;min-width:200px;padding:4px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="background:${loadColor};color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:99px">${h.load} Load</span>
      </div>
      <p style="font-size:13px;font-weight:900;color:#0f172a;margin:0 0 4px">${h.name}</p>
      <p style="font-size:11px;color:#64748b;margin:0 0 6px">${h.type}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:6px">
        <div style="background:#f1f5f9;border-radius:6px;padding:6px;text-align:center">
          <p style="font-size:10px;color:#94a3b8;font-weight:700;margin:0">ICU FREE</p>
          <p style="font-size:16px;font-weight:900;color:${icuPct < 20 ? '#ef4444' : '#0f172a'};margin:0">${h.availableIcu}</p>
        </div>
        <div style="background:#f1f5f9;border-radius:6px;padding:6px;text-align:center">
          <p style="font-size:10px;color:#94a3b8;font-weight:700;margin:0">BEDS FREE</p>
          <p style="font-size:16px;font-weight:900;color:#0f172a;margin:0">${h.availableBeds}</p>
        </div>
      </div>
      <p style="font-size:10px;color:#64748b;margin:0">🔬 ${h.specialization.join(' · ')}</p>
    </div>`;
}

function resourcePopup(r: ResourceRecord, assignedTo?: EmergencyRecord): string {
  const statusColor = r.status === 'Available' ? '#10b981' : r.status === 'On Mission' ? '#ef4444' : r.status === 'En Route' ? '#3b82f6' : '#64748b';
  return `
    <div style="font-family:system-ui;min-width:180px;padding:4px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="background:${statusColor};color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:99px">${r.status}</span>
      </div>
      <p style="font-size:13px;font-weight:900;color:#0f172a;margin:0 0 4px">${r.id}</p>
      <p style="font-size:11px;color:#64748b;margin:0 0 4px">${r.type}</p>
      ${assignedTo ? `<p style="font-size:11px;color:#f59e0b;font-weight:700;margin:0">→ ${assignedTo.id}: ${assignedTo.subtype}</p>` : ''}
      <p style="font-size:10px;color:#94a3b8;margin:4px 0 0;font-family:monospace">${(r.location[0] as number).toFixed(4)}, ${(r.location[1] as number).toFixed(4)}</p>
    </div>`;
}

// ─── Map Component ────────────────────────────────────────────────────────────
export default function GlobalMap({ center, emergencies, hospitals, resources, onMarkerClick }: GlobalMapProps) {
  const mapRef       = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Marker layer refs — keyed by id for efficient update/removal
  const emergencyLayerRef = useRef<Map<string, L.Marker>>(new Map());
  const hospitalLayerRef  = useRef<Map<string, L.Marker>>(new Map());
  const resourceLayerRef  = useRef<Map<string, L.Marker>>(new Map());
  const routeLayerRef     = useRef<Map<string, L.Polyline>>(new Map());

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center:        [12.9716, 77.5946], // Bengaluru
      zoom:          12,
      zoomControl:   true,
      attributionControl: true,
    });

    // Dark tile layer — matches the dashboard's dark/slate aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains:  'abcd',
      maxZoom:     19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Pan to center when it changes ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, mapRef.current.getZoom(), { animate: true });
  }, [center]);

  // ── Draw route lines between dispatched resources and emergencies ──────────
  const drawRoutes = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove old routes
    routeLayerRef.current.forEach(line => line.remove());
    routeLayerRef.current.clear();

    resources.forEach(r => {
      if (r.status !== 'On Mission' && r.status !== 'En Route') return;
      const em = emergencies.find(e => e.assignedResource === r.id);
      if (!em) return;

      const line = L.polyline(
        [r.location as [number, number], em.location as [number, number]],
        {
          color:     '#3b82f6',
          weight:    2,
          opacity:   0.6,
          dashArray: '6 4',
        }
      ).addTo(map);

      routeLayerRef.current.set(r.id, line);
    });
  }, [resources, emergencies]);

  // ── Sync emergency markers ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const currentIds = new Set(emergencies.map(e => e.id));

    // Remove stale
    emergencyLayerRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) { marker.remove(); emergencyLayerRef.current.delete(id); }
    });

    // Add/update
    emergencies.forEach(e => {
      const icon  = ICONS.emergency[e.priority as keyof typeof ICONS.emergency] ?? ICONS.emergency.Moderate;
      const popup = emergencyPopup(e);
      const latlng: [number, number] = e.location as [number, number];

      const existing = emergencyLayerRef.current.get(e.id);
      if (existing) {
        existing.setLatLng(latlng).setIcon(icon).setPopupContent(popup);
      } else {
        const marker = L.marker(latlng, { icon })
          .addTo(map)
          .bindPopup(popup, { maxWidth: 240, className: 'aneis-popup' });

        marker.on('click', () => onMarkerClick('emergency', e.id));
        emergencyLayerRef.current.set(e.id, marker);
      }
    });
  }, [emergencies, onMarkerClick]);

  // ── Sync hospital markers ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const currentIds = new Set(hospitals.map(h => h.id));

    hospitalLayerRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) { marker.remove(); hospitalLayerRef.current.delete(id); }
    });

    hospitals.forEach(h => {
      const icon  = ICONS.hospital[h.load as keyof typeof ICONS.hospital] ?? ICONS.hospital.Medium;
      const popup = hospitalPopup(h);
      const latlng: [number, number] = h.location as [number, number];

      const existing = hospitalLayerRef.current.get(h.id);
      if (existing) {
        existing.setLatLng(latlng).setIcon(icon).setPopupContent(popup);
      } else {
        const marker = L.marker(latlng, { icon })
          .addTo(map)
          .bindPopup(popup, { maxWidth: 240, className: 'aneis-popup' });

        marker.on('click', () => onMarkerClick('hospital', h.id));
        hospitalLayerRef.current.set(h.id, marker);
      }
    });
  }, [hospitals, onMarkerClick]);

  // ── Sync resource markers ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const currentIds = new Set(resources.map(r => r.id));

    resourceLayerRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) { marker.remove(); resourceLayerRef.current.delete(id); }
    });

    resources.forEach(r => {
      const iconKey = r.type as 'Ambulance' | 'Police';
      const icon    = ICONS.resource[iconKey] ?? ICONS.resource.Ambulance;
      const assignedTo = emergencies.find(e => e.assignedResource === r.id);
      const popup   = resourcePopup(r, assignedTo);
      const latlng: [number, number] = r.location as [number, number];

      const existing = resourceLayerRef.current.get(r.id);
      if (existing) {
        existing.setLatLng(latlng).setIcon(icon).setPopupContent(popup);
      } else {
        const marker = L.marker(latlng, { icon })
          .addTo(map)
          .bindPopup(popup, { maxWidth: 220, className: 'aneis-popup' });

        marker.on('click', () => onMarkerClick('resource', r.id));
        resourceLayerRef.current.set(r.id, marker);
      }
    });

    drawRoutes();
  }, [resources, emergencies, onMarkerClick, drawRoutes]);

  return (
    <>
      {/* Leaflet popup custom styles injected once */}
      <style>{`
        .aneis-popup .leaflet-popup-content-wrapper {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          border: 1px solid #e2e8f0;
          padding: 0;
        }
        .aneis-popup .leaflet-popup-content {
          margin: 12px;
        }
        .aneis-popup .leaflet-popup-tip {
          background: #fff;
        }
        .leaflet-container {
          font-family: system-ui, sans-serif;
        }
      `}</style>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', borderRadius: 'inherit', minHeight: 400 }}
      />
    </>
  );
}
