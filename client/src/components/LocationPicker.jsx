import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon issue in React/Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Default location: Bengaluru
const DEFAULT_POSITION = [12.9716, 77.5946];

function LocationMarker({ position, onLocationChange }) {
  const map = useMapEvents({
    click(e) {
      onLocationChange(
        e.latlng.lat,
        e.latlng.lng
      );
    },
  });

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  if (!position) return null;

  return (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (event) => {
          const marker = event.target;
          const newPosition = marker.getLatLng();

          onLocationChange(
            newPosition.lat,
            newPosition.lng
          );
        },
      }}
    />
  );
}

export default function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
}) {
  const [position, setPosition] = useState(
    latitude !== null &&
      latitude !== undefined &&
      longitude !== null &&
      longitude !== undefined
      ? [Number(latitude), Number(longitude)]
      : DEFAULT_POSITION
  );

  useEffect(() => {
    if (
      latitude !== null &&
      latitude !== undefined &&
      longitude !== null &&
      longitude !== undefined
    ) {
      setPosition([
        Number(latitude),
        Number(longitude),
      ]);
    }
  }, [latitude, longitude]);

  const handleLocationChange = (lat, lng) => {
    const newPosition = [lat, lng];

    setPosition(newPosition);

    onLocationChange(lat, lng);
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <div className="mb-3">
        <h2 className="font-bold text-lg text-slate-800">
          Exact Property Location
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Click anywhere on the map or drag the marker
          to select the exact property location.
        </p>
      </div>

      <div className="h-[350px] w-full overflow-hidden rounded-lg border border-slate-300">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocationMarker
            position={position}
            onLocationChange={handleLocationChange}
          />
        </MapContainer>
      </div>

      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-500">
            Latitude
          </p>

          <p className="font-semibold text-slate-800">
            {latitude !== null &&
            latitude !== undefined
              ? Number(latitude).toFixed(6)
              : "Not selected"}
          </p>
        </div>

        <div className="border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-500">
            Longitude
          </p>

          <p className="font-semibold text-slate-800">
            {longitude !== null &&
            longitude !== undefined
              ? Number(longitude).toFixed(6)
              : "Not selected"}
          </p>
        </div>
      </div>
    </div>
  );
}
