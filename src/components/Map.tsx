import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { EmergencyRecord, HospitalRecord, ResourceRecord } from '../types';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063176.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

const ambulanceIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1032/1032989.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const emergencyIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35]
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

interface MapProps {
  center: [number, number];
  emergencies?: EmergencyRecord[];
  hospitals?: HospitalRecord[];
  resources?: ResourceRecord[];
  interactive?: boolean;
  onMarkerClick?: (type: 'emergency' | 'hospital' | 'resource', id: string) => void;
}

export default function GlobalMap({ 
  center, 
  emergencies = [], 
  hospitals = [], 
  resources = [], 
  interactive = true,
  onMarkerClick
}: MapProps) {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 shadow-inner">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={interactive}
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ChangeView center={center} />

        {emergencies.map((e) => (
          <Marker 
            key={e.id} 
            position={e.location} 
            icon={emergencyIcon}
            eventHandlers={{
              click: () => onMarkerClick?.('emergency', e.id)
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-red-600">{e.type} Emergency</h3>
                <p className="text-sm">ID: {e.id}</p>
                <p className="text-xs font-mono">Triage Score: {(e.urgencyScore * 100).toFixed(0)}%</p>
                <div className={`mt-1 text-[10px] uppercase font-bold px-1 py-0.5 rounded ${e.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                  {e.priority}
                </div>
              </div>
            </Popup>
            {e.priority === 'Critical' && (
              <Circle 
                center={e.location} 
                radius={500} 
                pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.1 }} 
              />
            )}
          </Marker>
        ))}

        {hospitals.map((h) => (
          <Marker 
            key={h.id} 
            position={h.location} 
            icon={hospitalIcon}
            eventHandlers={{
              click: () => onMarkerClick?.('hospital', h.id)
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-blue-800">{h.name}</h3>
                <p className="text-xs">ICU Capacity: {h.availableIcu}/{h.icuBeds}</p>
                <p className="text-xs">Total Beds: {h.totalBeds}</p>
                <div className="flex gap-1 mt-1">
                  {h.specialization.map(s => (
                    <span key={s} className="text-[8px] bg-blue-50 text-blue-600 px-1 rounded">{s}</span>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {resources.map((r) => (
          <Marker 
            key={r.id} 
            position={r.location} 
            icon={ambulanceIcon}
            eventHandlers={{
              click: () => onMarkerClick?.('resource', r.id)
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">{r.type} {r.id}</h3>
                <p className="text-xs text-gray-500Status:">{r.status}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
