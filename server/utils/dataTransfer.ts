import { getPerson, importDataset, listJourneys, listPersons } from '../db.js'
import type { Journey, Person, TransportMode } from '../types.js'
import { TRANSPORT_MODES } from '../types.js'

export const EXPORT_FORMAT = 'ymigration' as const
export const EXPORT_VERSION = 1

export interface YmigrationExport {
  format: typeof EXPORT_FORMAT
  version: typeof EXPORT_VERSION
  exportedAt: string
  persons: Person[]
  journeys: Journey[]
}

export type ImportMode = 'replace' | 'merge'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parsePerson(value: unknown, index: number): Person {
  if (!isRecord(value)) {
    throw new Error(`Personne #${index + 1} : format invalide`)
  }
  if (typeof value.id !== 'string' || !value.id.trim()) {
    throw new Error(`Personne #${index + 1} : identifiant requis`)
  }
  if (typeof value.firstName !== 'string' || !value.firstName.trim()) {
    throw new Error(`Personne « ${value.id} » : prénom requis`)
  }
  return {
    id: value.id.trim(),
    firstName: value.firstName.trim(),
    lastName:
      typeof value.lastName === 'string'
        ? value.lastName.trim() || null
        : value.lastName == null
          ? null
          : null,
    birthYear:
      value.birthYear == null
        ? null
        : Number.isFinite(Number(value.birthYear))
          ? Number(value.birthYear)
          : null,
    birthPlaceName:
      typeof value.birthPlaceName === 'string'
        ? value.birthPlaceName.trim() || null
        : value.birthPlaceName == null
          ? null
          : null,
    birthLat:
      value.birthLat == null
        ? null
        : Number.isFinite(Number(value.birthLat))
          ? Number(value.birthLat)
          : null,
    birthLng:
      value.birthLng == null
        ? null
        : Number.isFinite(Number(value.birthLng))
          ? Number(value.birthLng)
          : null,
    deathYear:
      value.deathYear == null
        ? null
        : Number.isFinite(Number(value.deathYear))
          ? Number(value.deathYear)
          : null,
    deathPlaceName:
      typeof value.deathPlaceName === 'string'
        ? value.deathPlaceName.trim() || null
        : value.deathPlaceName == null
          ? null
          : null,
    deathLat:
      value.deathLat == null
        ? null
        : Number.isFinite(Number(value.deathLat))
          ? Number(value.deathLat)
          : null,
    deathLng:
      value.deathLng == null
        ? null
        : Number.isFinite(Number(value.deathLng))
          ? Number(value.deathLng)
          : null,
    notes:
      typeof value.notes === 'string'
        ? value.notes.trim() || null
        : value.notes == null
          ? null
          : null,
    story:
      typeof value.story === 'string'
        ? value.story.trim() || null
        : value.story == null
          ? null
          : null,
  }
}

function parseTransport(value: unknown): TransportMode | null {
  if (value == null || value === '') return null
  if (typeof value !== 'string' || !TRANSPORT_MODES.includes(value as TransportMode)) {
    throw new Error(`Transport invalide : ${String(value)}`)
  }
  return value as TransportMode
}

function parseJourney(value: unknown, index: number): Journey {
  if (!isRecord(value)) {
    throw new Error(`Trajet #${index + 1} : format invalide`)
  }
  if (typeof value.id !== 'string' || !value.id.trim()) {
    throw new Error(`Trajet #${index + 1} : identifiant requis`)
  }
  if (typeof value.fromName !== 'string' || !value.fromName.trim()) {
    throw new Error(`Trajet « ${value.id} » : lieu de départ requis`)
  }
  if (typeof value.toName !== 'string' || !value.toName.trim()) {
    throw new Error(`Trajet « ${value.id} » : lieu d'arrivée requis`)
  }
  const fromLat = Number(value.fromLat)
  const fromLng = Number(value.fromLng)
  const toLat = Number(value.toLat)
  const toLng = Number(value.toLng)
  if ([fromLat, fromLng, toLat, toLng].some((n) => Number.isNaN(n))) {
    throw new Error(`Trajet « ${value.id} » : coordonnées invalides`)
  }

  return {
    id: value.id.trim(),
    personId:
      typeof value.personId === 'string'
        ? value.personId.trim() || null
        : value.personId == null
          ? null
          : null,
    year:
      value.year == null
        ? null
        : Number.isFinite(Number(value.year))
          ? Number(value.year)
          : null,
    transport: parseTransport(value.transport),
    fromName: value.fromName.trim(),
    fromLat,
    fromLng,
    toName: value.toName.trim(),
    toLat,
    toLng,
    notes:
      typeof value.notes === 'string'
        ? value.notes.trim() || null
        : value.notes == null
          ? null
          : null,
    branch:
      typeof value.branch === 'string'
        ? value.branch.trim() || null
        : value.branch == null
          ? null
          : null,
  }
}

export function buildExport(): YmigrationExport {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    persons: listPersons(),
    journeys: listJourneys(),
  }
}

export function parseImportPayload(raw: unknown): YmigrationExport {
  if (!isRecord(raw)) {
    throw new Error('Fichier JSON invalide')
  }

  if (raw.format !== EXPORT_FORMAT) {
    throw new Error(
      `Format non reconnu (attendu « ${EXPORT_FORMAT} », reçu « ${String(raw.format)} »)`,
    )
  }
  if (raw.version !== EXPORT_VERSION) {
    throw new Error(
      `Version non supportée (attendu ${EXPORT_VERSION}, reçu ${String(raw.version)})`,
    )
  }
  if (!Array.isArray(raw.persons) || !Array.isArray(raw.journeys)) {
    throw new Error('Le fichier doit contenir les tableaux persons et journeys')
  }

  const persons = raw.persons.map(parsePerson)
  const journeys = raw.journeys.map(parseJourney)

  const personIds = new Set<string>()
  for (const person of persons) {
    if (personIds.has(person.id)) {
      throw new Error(`Identifiant de personne en double : ${person.id}`)
    }
    personIds.add(person.id)
  }

  const journeyIds = new Set<string>()
  for (const journey of journeys) {
    if (journeyIds.has(journey.id)) {
      throw new Error(`Identifiant de trajet en double : ${journey.id}`)
    }
    journeyIds.add(journey.id)
    if (journey.personId && !personIds.has(journey.personId)) {
      throw new Error(
        `Trajet « ${journey.id} » : personne « ${journey.personId} » introuvable dans l'import`,
      )
    }
  }

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt:
      typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
    persons,
    journeys,
  }
}

export function applyImport(
  payload: YmigrationExport,
  mode: ImportMode,
): { persons: number; journeys: number } {
  if (mode === 'merge') {
    for (const journey of payload.journeys) {
      if (journey.personId && !payload.persons.some((p) => p.id === journey.personId)) {
        const existing = getPerson(journey.personId)
        if (!existing) {
          throw new Error(
            `Trajet « ${journey.id} » : personne « ${journey.personId} » absente de la base`,
          )
        }
      }
    }
  }

  return importDataset(payload.persons, payload.journeys, mode)
}

export function exportFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `ymigration-export-${date}.json`
}
