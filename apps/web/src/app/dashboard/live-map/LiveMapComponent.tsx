'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LiveRep } from '@bharatsales/shared-types';
import { useEffect } from 'react';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

export default function LiveMapComponent({ reps }: { reps: LiveRep[] }) {
  // Center map on India
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const zoom = 5;

  const getCoordinates = (rep: LiveRep): [number, number] | null => {
    if (!rep.location) return null;
    
    // Handle both string and object location formats safely
    if (typeof rep.location === 'string') {
      const parts = rep.location.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
      }
    } else if (typeof rep.location === 'object') {
      const loc = rep.location as any;
      if (loc.lat !== undefined && loc.lng !== undefined) {
        return [parseFloat(loc.lat), parseFloat(loc.lng)];
      }
    }
    return null;
  };

  const safeReps = Array.isArray(reps) ? reps : [];
  const firstValidRepCoords = safeReps.map(getCoordinates).find(coords => coords !== null);

  return (
    <MapContainer 
      center={firstValidRepCoords || defaultCenter} 
      zoom={firstValidRepCoords ? 12 : zoom} 
      style={{ height: '100%', width: '100%', borderRadius: '1rem', minHeight: '500px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {safeReps.map((rep) => {
        const coords = getCoordinates(rep);
        if (!coords) return null;
        
        return (
          <Marker key={rep.id} position={coords}>
            <Popup>
              <div>
                <h3 className="font-bold text-gray-900">{rep.name}</h3>
                <p className="text-sm text-gray-600">Status: <b>{rep.status}</b></p>
                <p className="text-sm text-gray-600">At: {rep.outlet}</p>
                <p className="text-xs text-gray-400">Last updated: {rep.lastUpdate}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
