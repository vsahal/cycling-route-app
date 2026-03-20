import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function FlyToRoute({ center, geojson }) {
  const map = useMap()

  useEffect(() => {
    if (!geojson) return
    // Fit map to route bounds
    const coords = geojson.features?.[0]?.geometry?.coordinates
    if (!coords || coords.length === 0) return

    const lats = coords.map((c) => c[1])
    const lngs = coords.map((c) => c[0])
    const bounds = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ]
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [geojson, map])

  return null
}

const AUSTIN = [30.2672, -97.7431]

export default function MapView({ routeData }) {
  const [defaultCenter, setDefaultCenter] = useState(AUSTIN)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setDefaultCenter([pos.coords.latitude, pos.coords.longitude]),
      () => setDefaultCenter(AUSTIN)
    )
  }, [])

  const center = routeData?.start_coords
    ? [routeData.start_coords[0], routeData.start_coords[1]]
    : defaultCenter

  const routeStyle = {
    color: '#2d6a4f',
    weight: 5,
    opacity: 0.85,
  }

  return (
    <div style={styles.container}>
      <MapContainer
        key={center.join(',')}
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%', borderRadius: 12 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {routeData?.route_geojson && (
          <>
            <GeoJSON data={routeData.route_geojson} style={routeStyle} />
            <FlyToRoute center={center} geojson={routeData.route_geojson} />
          </>
        )}

        {routeData?.start_coords && (
          <CircleMarker
            center={[routeData.start_coords[0], routeData.start_coords[1]]}
            radius={10}
            pathOptions={{ color: '#fff', fillColor: '#e63946', fillOpacity: 1, weight: 2 }}
          />
        )}
      </MapContainer>
    </div>
  )
}

const styles = {
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    minHeight: 400,
  },
}
