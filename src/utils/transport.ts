import type { PathOptions } from 'leaflet'
import type { LatLngTuple } from 'leaflet'
import type { Migration, Place, TransportMode } from '../types/migration'
import { arcPoints } from './arcPoints'

export type { TransportMode }

export const TRANSPORT_MODES: TransportMode[] = [
  'bateau',
  'avion',
  'marche',
  'train',
  'voiture',
]

export interface TransportStyle {
  label: string
  icon: string
  color: string
  dashArray?: string
  lineType: 'arc' | 'direct'
  weight: number
}

const DEFAULT_STYLE: TransportStyle = {
  label: 'Non précisé',
  icon: '→',
  color: '#b84a2f',
  lineType: 'arc',
  weight: 3,
}

export const transportStyles: Record<TransportMode, TransportStyle> = {
  bateau: {
    label: 'Bateau',
    icon: '⛵',
    color: '#1e6b9e',
    lineType: 'arc',
    weight: 3,
  },
  avion: {
    label: 'Avion',
    icon: '✈️',
    color: '#5c4d9e',
    dashArray: '10 8',
    lineType: 'arc',
    weight: 3,
  },
  marche: {
    label: 'À pied',
    icon: '🚶',
    color: '#6b7c3e',
    dashArray: '2 8',
    lineType: 'direct',
    weight: 2,
  },
  train: {
    label: 'Train',
    icon: '🚂',
    color: '#8b4513',
    dashArray: '14 4 2 4',
    lineType: 'direct',
    weight: 3,
  },
  voiture: {
    label: 'Voiture',
    icon: '🚗',
    color: '#4a4a4a',
    dashArray: '6 5',
    lineType: 'direct',
    weight: 3,
  },
}

export function getTransportStyle(mode?: TransportMode): TransportStyle {
  if (!mode) return DEFAULT_STYLE
  return transportStyles[mode]
}

export function routePositions(
  from: Place,
  to: Place,
  lineType: TransportStyle['lineType'],
): LatLngTuple[] {
  if (lineType === 'direct') {
    return [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ]
  }
  return arcPoints(from, to)
}

export function routePathOptions(style: TransportStyle): PathOptions {
  return {
    color: style.color,
    weight: style.weight,
    opacity: 0.9,
    dashArray: style.dashArray,
  }
}

export function migrationRoutePositions(migration: Migration): LatLngTuple[] {
  const style = getTransportStyle(migration.transport)
  return routePositions(migration.from, migration.to, style.lineType)
}
