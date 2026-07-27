'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LiveRep } from '@bharatsales/shared-types';
import { useEffect } from 'react';

// Fix for default marker icons in Leaflet with webpack/nextjs
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function LiveMapComponent({ reps }: { reps: LiveRep[] }) {
  // Center map on India
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const zoom = 5;

  return (
    <MapContainer 
      center={reps.length > 0 && reps[0].location ? [reps[0].location.lat, reps[0].location.lng] : defaultCenter} 
      zoom={reps.length > 0 ? 12 : zoom} 
      style={{ height: '100%', width: '100%', borderRadius: '1rem', minHeight: '500px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reps.map((rep) => (
        rep.location && (
          <Marker key={rep.id} position={[rep.location.lat, rep.location.lng]}>
            <Popup>
              <div>
                <h3 className="font-bold text-gray-900">{rep.name}</h3>
                <p className="text-sm text-gray-600">Status: <b>{rep.status}</b></p>
                <p className="text-sm text-gray-600">At: {rep.outlet}</p>
                <p className="text-xs text-gray-400">Last updated: {rep.lastUpdate}</p>
              </div>
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
}
