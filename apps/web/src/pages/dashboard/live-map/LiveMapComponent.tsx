import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import { LiveRep } from '@bharatsales/shared-types';
import { useEffect, useRef } from 'react';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import L from 'leaflet';
import { CHART_THEME } from '@bharatsales/ui';

/** Marker colours — same meaning as the status dots in the side panel. */
const REP_STATUS_COLORS: Record<string, string> = {
  'At Outlet': CHART_THEME.success,
  Traveling: CHART_THEME.primary,
  'On Break': CHART_THEME.warning,
};
const OFFLINE_COLOR = CHART_THEME.neutral;

function getRepCoordinates(rep: LiveRep): [number, number] | null {
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
}

/** Pans to the selected rep and opens its popup. */
function FocusSelected({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!coords) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    map.flyTo(coords, Math.max(map.getZoom(), 14), { animate: !reduceMotion, duration: 0.6 });
  }, [coords?.[0], coords?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function LiveMapComponent({
  reps,
  selectedId,
  onSelect,
}: {
  reps: LiveRep[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  // Center map on India
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const zoom = 5;
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  const createIcon = (status: string, selected: boolean) => {
    const size = selected ? 22 : 16;
    const color = REP_STATUS_COLORS[status] ?? OFFLINE_COLOR;
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color:${color};width:${size}px;height:${size}px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 ${selected ? 3 : 0}px rgba(27,79,216,.45),0 2px 4px rgba(15,23,42,.4);"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
      tooltipAnchor: [0, -size / 2],
    });
  };

  const safeReps = Array.isArray(reps) ? reps : [];
  const firstValidRepCoords = safeReps.map(getRepCoordinates).find(coords => coords !== null);
  const selectedRep = selectedId ? safeReps.find(r => r.id === selectedId) : undefined;
  const selectedCoords = selectedRep ? getRepCoordinates(selectedRep) : null;

  useEffect(() => {
    if (selectedId) markerRefs.current[selectedId]?.openPopup();
  }, [selectedId]);

  return (
    <MapContainer
      center={firstValidRepCoords || defaultCenter}
      zoom={firstValidRepCoords ? 12 : zoom}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FocusSelected coords={selectedCoords} />
      {safeReps.map((rep) => {
        const coords = getRepCoordinates(rep);
        if (!coords) return null;
        const selected = rep.id === selectedId;

        return (
          <Marker
            key={rep.id}
            position={coords}
            icon={createIcon(rep.status, selected)}
            zIndexOffset={selected ? 1000 : 0}
            ref={(m) => { markerRefs.current[rep.id] = m; }}
            eventHandlers={{ click: () => onSelect?.(rep.id) }}
          >
            <Tooltip permanent direction="top" offset={[0, -12]} className="text-xs font-semibold">
              {rep.name}
            </Tooltip>
            <Popup>
              <div className="min-w-[10rem] space-y-0.5">
                <h3 className="font-semibold text-gray-900">{rep.name}</h3>
                <p className="text-sm text-gray-700">{rep.status}</p>
                {rep.outlet && <p className="text-sm text-gray-600">At: {rep.outlet}</p>}
                <p className="text-xs text-gray-500">Updated {rep.lastUpdate}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
