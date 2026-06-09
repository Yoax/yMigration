import type { LatLngTuple } from 'leaflet'
import type { Migration, TransportMode } from '../types/migration'
import { migrationRoutePositions } from './transport'

export interface PersonOption {
  key: string
  label: string
}

export type AnimationPhase = 'year-hold' | 'traveling' | 'arrival-hold' | 'gap'

export function animationAdvanceLabel(
  animationActive: boolean,
  playing: boolean,
  phase: AnimationPhase,
  isComplete: boolean,
): string {
  if (isComplete) return 'Terminé'
  if (!animationActive) return 'Commencer'
  if (playing) return 'Trajet en cours…'
  if (phase === 'year-hold') return 'Lancer le trajet'
  if (phase === 'traveling') return 'Terminer le trajet'
  return 'Étape suivante'
}

export const YEAR_HOLD_MS = 1600
export const ARRIVAL_HOLD_MS = 2000
export const MIN_TRAVEL_MS = 2500
export const MAX_TRAVEL_MS = 10000
export const MS_PER_KM = 1.4

const SPEEDS_KMH: Record<TransportMode, number> = {
  marche: 4,
  train: 90,
  voiture: 70,
  bateau: 28,
  avion: 750,
}

const DEFAULT_SPEED_KMH = 45

export interface SegmentTiming {
  migration: Migration
  year: number | null
  distanceKm: number
  travelDurationMs: number
  gapAfterMs: number
  gapLabel: string | null
  gapYears: number | null
  nextYear: number | null
}

export function personKeyForMigration(m: Migration): string {
  return m.personId ?? m.label ?? m.id
}

export function extractPersons(migrations: Migration[]): PersonOption[] {
  const map = new Map<string, PersonOption>()
  for (const m of migrations) {
    const key = personKeyForMigration(m)
    if (!map.has(key)) {
      map.set(key, { key, label: m.label ?? 'Sans nom' })
    }
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'fr'))
}

export function migrationsForPerson(
  migrations: Migration[],
  personKey: string,
): Migration[] {
  return migrations.filter((m) => personKeyForMigration(m) === personKey)
}

export function sortMigrationsByYear(items: Migration[]): Migration[] {
  return [...items].sort((a, b) => {
    const ya = a.year ?? Number.MAX_SAFE_INTEGER
    const yb = b.year ?? Number.MAX_SAFE_INTEGER
    if (ya !== yb) return ya - yb
    return a.from.name.localeCompare(b.from.name, 'fr')
  })
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

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

export function routeDistanceKm(migration: Migration): number {
  return pathLengthKm(migrationRoutePositions(migration))
}

function speedForMigration(migration: Migration): number {
  if (migration.transport) return SPEEDS_KMH[migration.transport]
  return DEFAULT_SPEED_KMH
}

/** Durée du tracé animé : proportionnelle à la distance réelle. */
export function travelDurationMs(migration: Migration): number {
  const distanceKm = routeDistanceKm(migration)
  const speed = speedForMigration(migration)
  const estimatedHours = distanceKm / speed
  const base = MIN_TRAVEL_MS + distanceKm * MS_PER_KM
  const speedFactor = Math.min(1.4, Math.max(0.75, estimatedHours / 12))
  return Math.round(
    Math.min(MAX_TRAVEL_MS, Math.max(MIN_TRAVEL_MS, base * speedFactor)),
  )
}

export function formatYearsGap(years: number): string {
  if (years <= 0) return 'Peu de temps après'
  if (years === 1) return '1 an plus tard'
  return `${years} ans plus tard`
}

export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

/** Année affichée pendant l'écart temporel entre deux trajets. */
export function interpolateYear(
  fromYear: number,
  toYear: number,
  progress: number,
): number {
  return Math.round(fromYear + (toYear - fromYear) * easeInOutCubic(progress))
}

export function yearHoldDurationMs(
  migration: Migration | null,
  personStory: string | null | undefined,
  isFirstStep: boolean,
): number {
  let ms = YEAR_HOLD_MS
  const text =
    migration?.notes?.trim() ||
    (isFirstStep ? personStory?.trim() : undefined)
  if (text) ms += Math.min(5500, Math.max(800, text.length * 32))
  return ms
}

export function personTimelineSpan(migrations: Migration[]): {
  start: number | null
  end: number | null
} {
  const years = migrations
    .map((m) => m.year)
    .filter((y): y is number => y != null)
  if (years.length === 0) return { start: null, end: null }
  return { start: Math.min(...years), end: Math.max(...years) }
}

export function animationContextText(
  phase: AnimationPhase,
  migration: Migration | null,
  personStory: string | null | undefined,
  stepIndex: number,
): string | null {
  if (phase !== 'year-hold' || !migration) return null
  if (migration.notes?.trim()) return migration.notes.trim()
  if (stepIndex === 0 && personStory?.trim()) return personStory.trim()
  return null
}

/** Villes visitées dans l'ordre du parcours (sans doublon consécutif). */
export function collectVisitedCities(migrations: Migration[]): string[] {
  const cities: string[] = []
  for (const migration of migrations) {
    const last = cities[cities.length - 1]
    if (migration.from.name !== last) {
      cities.push(migration.from.name)
    }
    if (migration.to.name !== cities[cities.length - 1]) {
      cities.push(migration.to.name)
    }
  }
  return cities
}

/** Distance cumulée parcourue pendant l'animation. */
export function computeTraveledDistanceKm(
  timeline: SegmentTiming[],
  stepIndex: number,
  segmentProgress: number,
  phase: AnimationPhase,
): number {
  if (timeline.length === 0) return 0

  let sum = 0
  for (let i = 0; i < stepIndex; i++) {
    sum += timeline[i].distanceKm
  }

  const current = timeline[stepIndex]
  if (!current) return sum

  let progress = 0
  if (phase === 'traveling') {
    progress = segmentProgress
  } else if (phase === 'arrival-hold' || phase === 'gap') {
    progress = 1
  }

  return sum + current.distanceKm * progress
}

/** Pause entre deux trajets : proportionnelle aux années écoulées. */
export function gapDurationMs(
  previousYear: number | null,
  nextYear: number | null,
): { durationMs: number; gapYears: number | null; label: string | null } {
  if (previousYear == null || nextYear == null) {
    return { durationMs: 2800, gapYears: null, label: null }
  }
  const gapYears = nextYear - previousYear
  if (gapYears <= 0) {
    return {
      durationMs: 2000,
      gapYears: 0,
      label: 'La même année',
    }
  }
  const durationMs = Math.min(
    22000,
    Math.max(3500, 900 + gapYears * 320),
  )
  return {
    durationMs,
    gapYears,
    label: formatYearsGap(gapYears),
  }
}

export function buildSegmentTimeline(migrations: Migration[]): SegmentTiming[] {
  return migrations.map((migration, index) => {
    const next = migrations[index + 1]
    const gap = next
      ? gapDurationMs(migration.year ?? null, next.year ?? null)
      : { durationMs: 0, gapYears: null, label: null }

    return {
      migration,
      year: migration.year ?? null,
      distanceKm: routeDistanceKm(migration),
      travelDurationMs: travelDurationMs(migration),
      gapAfterMs: gap.durationMs,
      gapLabel: gap.label,
      gapYears: gap.gapYears,
      nextYear: next?.year ?? null,
    }
  })
}

export function maxZoomForDistance(distanceKm: number): number {
  if (distanceKm < 120) return 11
  if (distanceKm < 400) return 9
  if (distanceKm < 1200) return 8
  if (distanceKm < 3500) return 6
  return 5
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 100) return `${Math.round(km)} km`
  return `${Math.round(km).toLocaleString('fr-FR')} km`
}

export function slicePath(
  positions: LatLngTuple[],
  progress: number,
): LatLngTuple[] {
  if (positions.length === 0) return []
  if (progress <= 0) return [positions[0]]
  if (progress >= 1) return positions

  const exactIndex = progress * (positions.length - 1)
  const endIndex = Math.max(1, Math.ceil(exactIndex))
  const slice = positions.slice(0, endIndex + 1)
  const i = endIndex - 1
  const t = exactIndex - i
  const [lat1, lng1] = positions[i]
  const [lat2, lng2] = positions[i + 1] ?? positions[i]
  slice[slice.length - 1] = [
    lat1 + (lat2 - lat1) * t,
    lng1 + (lng2 - lng1) * t,
  ]
  return slice
}

export function pointAtProgress(
  positions: LatLngTuple[],
  progress: number,
): LatLngTuple {
  if (positions.length === 0) return [0, 0]
  if (progress <= 0) return positions[0]
  if (progress >= 1) return positions[positions.length - 1]

  const exactIndex = progress * (positions.length - 1)
  const i = Math.floor(exactIndex)
  const t = exactIndex - i
  const [lat1, lng1] = positions[i]
  const [lat2, lng2] = positions[i + 1]
  return [lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t]
}
