import { Polyline, Popup } from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'
import type { Migration } from '../types/migration'
import { slicePath } from '../utils/journeyAnimation'
import { getTransportStyle, routePathOptions } from '../utils/transport'
import { MigrationPopup } from './MigrationPopup'

interface MigrationArcProps {
  migration: Migration
  positions: LatLngTuple[]
  /** 0–1 : portion visible du trajet. Par défaut : trajet complet. */
  progress?: number
  highlighted?: boolean
  pending?: boolean
}

export function MigrationArc({
  migration,
  positions,
  progress = 1,
  highlighted = false,
  pending = false,
}: MigrationArcProps) {
  const style = getTransportStyle(migration.transport)
  const visiblePositions =
    progress >= 1 ? positions : slicePath(positions, progress)
  const pathOptions = routePathOptions(style)

  if (visiblePositions.length < 2 && progress < 1) return null

  return (
    <>
      <Polyline
        positions={visiblePositions}
        pathOptions={{
          ...pathOptions,
          weight: (pathOptions.weight ?? 3) + 6,
          opacity: 0,
        }}
        eventHandlers={{ click: (e) => e.target.openPopup() }}
      >
        <Popup>
          <MigrationPopup migration={migration} />
        </Popup>
      </Polyline>
      <Polyline
        positions={visiblePositions}
        pathOptions={{
          ...pathOptions,
          weight: highlighted ? (pathOptions.weight ?? 3) + 1 : pathOptions.weight,
          opacity: pending ? 0.35 : highlighted ? 1 : pathOptions.opacity,
          dashArray: pending ? '4 8' : pathOptions.dashArray,
        }}
      />
    </>
  )
}
