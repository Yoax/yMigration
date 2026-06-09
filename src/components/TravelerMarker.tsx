import { useMemo } from 'react'
import { Marker } from 'react-leaflet'
import L from 'leaflet'
import type { LatLngTuple } from 'leaflet'
import type { TransportMode } from '../types/migration'
import { getTransportStyle } from '../utils/transport'

interface TravelerMarkerProps {
  position: LatLngTuple
  transport?: TransportMode
}

function createTransportIcon(emoji: string) {
  return L.divIcon({
    className: 'traveler-marker',
    html: `<span class="traveler-marker__emoji">${emoji}</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

export function TravelerMarker({ position, transport }: TravelerMarkerProps) {
  const icon = useMemo(
    () => createTransportIcon(getTransportStyle(transport).icon),
    [transport],
  )

  return <Marker position={position} icon={icon} zIndexOffset={1000} />
}
