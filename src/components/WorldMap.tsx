import { useEffect, useMemo, useRef } from 'react'
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import type { LatLngTuple } from 'leaflet'
import { useRouteCache } from '../hooks/useRouteCache'
import type { Migration, Place } from '../types/migration'
import {
  maxZoomForDistance,
  pathLengthKm,
  pointAtProgress,
  routeDistanceKm,
  type AnimationPhase,
} from '../utils/journeyAnimation'
import { MigrationArc } from './MigrationArc'
import { MigrationPopup } from './MigrationPopup'
import { TravelerMarker } from './TravelerMarker'

const MARKER_COLOR = '#1a3a5c'
const MARKER_RADIUS = 6

export interface MapAnimationView {
  personMigrations: Migration[]
  stepIndex: number
  segmentProgress: number
  phase: AnimationPhase
  isComplete: boolean
}

interface WorldMapProps {
  migrations: Migration[]
  animation?: MapAnimationView | null
}

function placeKey(place: Place) {
  return `${place.lat.toFixed(4)},${place.lng.toFixed(4)}`
}

function collectPlaces(migrations: Migration[]): Map<string, Place> {
  const places = new Map<string, Place>()
  for (const migration of migrations) {
    places.set(placeKey(migration.from), migration.from)
    places.set(placeKey(migration.to), migration.to)
  }
  return places
}

function migrationsAtPlace(
  migrations: Migration[],
  place: Place,
): Migration[] {
  const key = placeKey(place)
  return migrations.filter(
    (m) => placeKey(m.from) === key || placeKey(m.to) === key,
  )
}

function FitBounds({
  migrations,
  getPositions,
}: {
  migrations: Migration[]
  getPositions: (m: Migration) => LatLngTuple[]
}) {
  const map = useMap()

  useEffect(() => {
    if (migrations.length === 0) return

    const bounds = L.latLngBounds([])
    for (const migration of migrations) {
      for (const [lat, lng] of getPositions(migration)) {
        bounds.extend([lat, lng])
      }
    }
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 5 })
    }
  }, [map, migrations, getPositions])

  return null
}

function AnimatedSegmentView({
  animation,
  getPositions,
}: {
  animation: MapAnimationView
  getPositions: (m: Migration) => LatLngTuple[]
}) {
  const map = useMap()
  const lastPanRef = useRef(0)
  const { personMigrations, stepIndex, segmentProgress, phase, isComplete } =
    animation

  const current = personMigrations[stepIndex]

  useEffect(() => {
    if (!isComplete || personMigrations.length === 0) return

    const bounds = L.latLngBounds([])
    for (const migration of personMigrations) {
      for (const [lat, lng] of getPositions(migration)) {
        bounds.extend([lat, lng])
      }
    }
    if (!bounds.isValid()) return

    map.fitBounds(bounds, {
      padding: [72, 72],
      maxZoom: 4,
      animate: true,
      duration: 1.1,
    })
  }, [map, isComplete, personMigrations, getPositions])

  useEffect(() => {
    if (isComplete || !current) return

    const positions = getPositions(current)
    const bounds = L.latLngBounds(positions)
    const distanceKm = pathLengthKm(positions) || routeDistanceKm(current)

    map.fitBounds(bounds, {
      padding: [100, 100],
      maxZoom: maxZoomForDistance(distanceKm),
      animate: true,
      duration: 0.85,
    })
  }, [map, current, stepIndex, getPositions, isComplete])

  useEffect(() => {
    if (!current || phase !== 'traveling') return
    if (segmentProgress <= 0 || segmentProgress >= 1) return

    const now = Date.now()
    if (now - lastPanRef.current < 180) return
    lastPanRef.current = now

    const positions = getPositions(current)
    const traveler = pointAtProgress(positions, segmentProgress)
    map.panTo(traveler, { animate: true, duration: 0.35, noMoveStart: true })
  }, [map, current, phase, segmentProgress, getPositions])

  return null
}

export function WorldMap({ migrations, animation }: WorldMapProps) {
  const isAnimated = animation != null && animation.personMigrations.length > 0

  const routedMigrations = useMemo(
    () => (isAnimated && animation ? animation.personMigrations : migrations),
    [isAnimated, animation, migrations],
  )

  const { getPositions, loading: routesLoading } =
    useRouteCache(routedMigrations)

  const visibleMigrations = useMemo(() => {
    if (!isAnimated || !animation) return migrations
    const { personMigrations, stepIndex, segmentProgress, phase } = animation
    const completed = personMigrations.slice(0, stepIndex)
    const current = personMigrations[stepIndex]
    if (!current) return completed
    if (
      (phase === 'traveling' && segmentProgress > 0) ||
      phase === 'arrival-hold'
    ) {
      return [...completed, current]
    }
    if (phase === 'year-hold' || phase === 'gap') {
      return completed.length > 0 ? completed : []
    }
    return completed
  }, [migrations, isAnimated, animation])

  const places = useMemo(() => {
    if (!isAnimated || !animation || animation.isComplete) {
      return collectPlaces(
        isAnimated && animation?.isComplete
          ? animation.personMigrations
          : visibleMigrations,
      )
    }
    const { personMigrations, stepIndex, segmentProgress, phase } = animation
    const result = collectPlaces(visibleMigrations)
    const current = personMigrations[stepIndex]
    if (!current) return result

    if (phase === 'year-hold' || (phase === 'traveling' && segmentProgress === 0)) {
      result.set(placeKey(current.from), current.from)
    }
    if (
      (phase === 'traveling' && segmentProgress > 0) ||
      phase === 'arrival-hold'
    ) {
      result.set(placeKey(current.from), current.from)
      result.set(placeKey(current.to), current.to)
    }
    return result
  }, [visibleMigrations, isAnimated, animation])

  const activeMigration =
    isAnimated && animation
      ? animation.personMigrations[animation.stepIndex]
      : null

  const activePositions =
    activeMigration != null ? getPositions(activeMigration) : null

  const travelerPosition =
    activePositions && animation
      ? (animation.phase === 'traveling' && animation.segmentProgress > 0) ||
        animation.phase === 'arrival-hold'
        ? pointAtProgress(
            activePositions,
            animation.phase === 'arrival-hold' ? 1 : animation.segmentProgress,
          )
        : null
      : null

  const showCurrentArc =
    isAnimated &&
    animation &&
    ((animation.phase === 'traveling' && animation.segmentProgress > 0) ||
      animation.phase === 'arrival-hold')

  const showAllPersonArcs =
    isAnimated && animation && animation.isComplete

  return (
    <MapContainer
      className="world-map"
      center={[30, 0]}
      zoom={2}
      scrollWheelZoom
      worldCopyJump
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {isAnimated && animation ? (
        <AnimatedSegmentView
          animation={animation}
          getPositions={getPositions}
        />
      ) : (
        <FitBounds migrations={migrations} getPositions={getPositions} />
      )}

      {isAnimated && animation ? (
        <>
          {animation.personMigrations.map((migration, index) => {
            if (showAllPersonArcs || index < animation.stepIndex) {
              return (
                <MigrationArc
                  key={migration.id}
                  migration={migration}
                  positions={getPositions(migration)}
                  pending={routesLoading}
                  highlighted={showAllPersonArcs}
                />
              )
            }
            if (index === animation.stepIndex && showCurrentArc) {
              const progress =
                animation.phase === 'arrival-hold'
                  ? 1
                  : Math.min(1, animation.segmentProgress)
              return (
                <MigrationArc
                  key={migration.id}
                  migration={migration}
                  positions={getPositions(migration)}
                  progress={progress}
                  highlighted
                  pending={routesLoading}
                />
              )
            }
            return null
          })}
        </>
      ) : (
        migrations.map((migration) => (
          <MigrationArc
            key={migration.id}
            migration={migration}
            positions={getPositions(migration)}
            pending={routesLoading}
          />
        ))
      )}

      {travelerPosition && activeMigration && (
        <TravelerMarker
          position={travelerPosition}
          transport={activeMigration.transport}
        />
      )}

      {[...places.values()].map((place) => {
        const related = migrationsAtPlace(visibleMigrations, place)
        const isOriginOnly =
          isAnimated &&
          animation &&
          activeMigration &&
          placeKey(place) === placeKey(activeMigration.from) &&
          animation.phase === 'year-hold'

        return (
          <CircleMarker
            key={placeKey(place)}
            center={[place.lat, place.lng]}
            radius={isOriginOnly ? MARKER_RADIUS + 3 : MARKER_RADIUS}
            pathOptions={{
              color: '#fff',
              weight: 2,
              fillColor: isOriginOnly ? '#b84a2f' : MARKER_COLOR,
              fillOpacity: 1,
            }}
          >
            <Popup>
              <div className="migration-popup">
                <strong className="migration-popup__label">{place.name}</strong>
                {related.map((m) => (
                  <div key={m.id} className="migration-popup__place-entry">
                    <MigrationPopup migration={m} />
                  </div>
                ))}
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
