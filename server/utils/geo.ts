import { createRequire } from 'node:module'
import type { TransportMode } from '../types.js'

const require = createRequire(import.meta.url)
const searoute = require('searoute-js') as SearouteFn

interface SearouteFn {
  (
    origin: GeoJsonPoint,
    destination: GeoJsonPoint,
    units?: string,
  ): { geometry: { coordinates: [number, number][] } } | null
}

interface GeoJsonPoint {
  type: 'Feature'
  properties: Record<string, never>
  geometry: { type: 'Point'; coordinates: [number, number] }
}

export type LatLng = { lat: number; lng: number }
export type LatLngTuple = [number, number]

const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const r = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function pathLengthKm(positions: LatLngTuple[]): number {
  let total = 0
  for (let i = 1; i < positions.length; i++) {
    const [lat1, lng1] = positions[i - 1]
    const [lat2, lng2] = positions[i]
    total += haversineKm(lat1, lng1, lat2, lng2)
  }
  return total
}

export function arcPoints(
  from: LatLng,
  to: LatLng,
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

  if (d === 0) return [[from.lat, from.lng]]

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

function toGeoPoint({ lat, lng }: LatLng): GeoJsonPoint {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: [lng, lat] },
  }
}

/** Route maritime via le réseau de navigation Eurostat (searoute-js). */
function seaRoutePositions(from: LatLng, to: LatLng): LatLngTuple[] {
  const route = searoute(toGeoPoint(from), toGeoPoint(to), 'kilometers')
  const coordinates = route?.geometry?.coordinates

  if (!coordinates?.length) {
    throw new Error('Aucune route maritime trouvée')
  }

  return coordinates.map(([lng, lat]) => [lat, lng] as LatLngTuple)
}

export async function osrmRoute(
  from: LatLng,
  to: LatLng,
  profile: 'foot' | 'driving',
): Promise<LatLngTuple[]> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`

  const response = await fetch(url, {
    headers: { 'User-Agent': 'yMigration/1.0 (migration map)' },
  })

  if (!response.ok) {
    throw new Error('OSRM indisponible')
  }

  const data = (await response.json()) as {
    code?: string
    routes?: { geometry?: { coordinates?: [number, number][] } }[]
  }

  const coordinates = data.routes?.[0]?.geometry?.coordinates
  if (!coordinates?.length) {
    throw new Error('Aucun itinéraire terrestre trouvé')
  }

  return coordinates.map(([lng, lat]) => [lat, lng] as LatLngTuple)
}

async function landRoute(
  from: LatLng,
  to: LatLng,
  profile: 'foot' | 'driving',
): Promise<LatLngTuple[]> {
  const directKm = haversineKm(from.lat, from.lng, to.lat, to.lng)

  try {
    const route = await osrmRoute(from, to, profile)
    const routeKm = pathLengthKm(route)

    if (directKm > 400 && routeKm > directKm * 2.8) {
      throw new Error('Itinéraire terrestre improbable')
    }

    return route
  } catch {
    if (directKm <= 600) {
      return [
        [from.lat, from.lng],
        [to.lat, to.lng],
      ]
    }
    throw new Error('Pas de route terrestre')
  }
}

function maritimeRoute(from: LatLng, to: LatLng): LatLngTuple[] {
  return seaRoutePositions(from, to)
}

export async function computeRoute(
  from: LatLng,
  to: LatLng,
  transport?: TransportMode | null,
): Promise<LatLngTuple[]> {
  switch (transport) {
    case 'marche':
      return landRoute(from, to, 'foot')
    case 'train':
    case 'voiture':
      return landRoute(from, to, 'driving')
    case 'avion':
      return arcPoints(from, to)
    case 'bateau':
      return Promise.resolve(maritimeRoute(from, to))
    default:
      return arcPoints(from, to)
  }
}
