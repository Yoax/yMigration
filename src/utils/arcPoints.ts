import type { LatLngTuple } from 'leaflet'

const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

/** Great-circle arc between two coordinates, sampled for Leaflet polylines. */
export function arcPoints(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  segments = 64,
): LatLngTuple[] {
  const lat1 = toRad(from.lat)
  const lng1 = toRad(from.lng)
  const lat2 = toRad(to.lat)
  const lng2 = toRad(to.lng)

  const sinLat1 = Math.sin(lat1)
  const cosLat1 = Math.cos(lat1)
  const sinLat2 = Math.sin(lat2)
  const cosLat2 = Math.cos(lat2)
  const deltaLng = lng2 - lng1

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          cosLat1 * cosLat2 * Math.sin(deltaLng / 2) ** 2,
      ),
    )

  if (d === 0) {
    return [[from.lat, from.lng]]
  }

  const points: LatLngTuple[] = []

  for (let i = 0; i <= segments; i++) {
    const f = i / segments
    const a = Math.sin((1 - f) * d) / Math.sin(d)
    const b = Math.sin(f * d) / Math.sin(d)

    const x = a * cosLat1 * Math.cos(lng1) + b * cosLat2 * Math.cos(lng2)
    const y = a * cosLat1 * Math.sin(lng1) + b * cosLat2 * Math.sin(lng2)
    const z = a * sinLat1 + b * sinLat2

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y))
    const lng = Math.atan2(y, x)

    points.push([toDeg(lat), toDeg(lng)])
  }

  return points
}
