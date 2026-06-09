import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import {
  clearAllData,
  countJourneys,
  countPersons,
  importDataset,
  insertJourney,
  insertPerson,
} from './db.js'
import type { Journey, Person, TransportMode } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface LegacySeedMigration {
  id: string
  label?: string
  year?: number
  transport?: TransportMode
  from: { name: string; lat: number; lng: number }
  to: { name: string; lat: number; lng: number }
  notes?: string
  branch?: string
}

interface StructuredSeedFile {
  format?: string
  version?: number
  persons: Person[]
  journeys: Journey[]
}

interface LegacySeedFile {
  migrations: LegacySeedMigration[]
}

function loadStructuredSeed(): StructuredSeedFile | null {
  const seedPath = join(__dirname, '..', 'src', 'data', 'seed.json')
  try {
    const raw = readFileSync(seedPath, 'utf-8')
    const data = JSON.parse(raw) as StructuredSeedFile
    if (Array.isArray(data.persons) && Array.isArray(data.journeys)) {
      return data
    }
  } catch {
    // fichier absent ou invalide
  }
  return null
}

function loadLegacySeed(): LegacySeedFile {
  const seedPath = join(__dirname, '..', 'src', 'data', 'migrations.json')
  const raw = readFileSync(seedPath, 'utf-8')
  return JSON.parse(raw) as LegacySeedFile
}

function seedFromStructured(data: StructuredSeedFile): number {
  importDataset(data.persons, data.journeys, 'replace')
  console.log(
    `Base d'exemple chargée : ${data.persons.length} personne(s), ${data.journeys.length} trajet(s)`,
  )
  return data.journeys.length
}

function seedFromLegacy(): number {
  const data = loadLegacySeed()
  const personIds = new Map<string, string>()

  for (const migration of data.migrations) {
    let personId: string | null = null

    if (migration.label) {
      const existing = personIds.get(migration.label)
      if (existing) {
        personId = existing
      } else {
        personId = randomUUID()
        const parts = migration.label.trim().split(/\s+/)
        const firstName = parts[0] ?? migration.label
        const lastName = parts.length > 1 ? parts.slice(1).join(' ') : null
        insertPerson({
          id: personId,
          firstName,
          lastName,
          birthYear: null,
          birthPlaceName: null,
          birthLat: null,
          birthLng: null,
          deathYear: null,
          deathPlaceName: null,
          deathLat: null,
          deathLng: null,
          notes: migration.branch
            ? `Branche : ${migration.branch} (données fictives)`
            : 'Données fictives de démonstration',
          story: null,
        })
        personIds.set(migration.label, personId)
      }
    }

    insertJourney({
      id: migration.id,
      personId,
      year: migration.year ?? null,
      transport: migration.transport ?? null,
      fromName: migration.from.name,
      fromLat: migration.from.lat,
      fromLng: migration.from.lng,
      toName: migration.to.name,
      toLat: migration.to.lat,
      toLng: migration.to.lng,
      notes: migration.notes ?? null,
      branch: migration.branch ?? null,
    })
  }

  console.log(
    `Base chargée : ${personIds.size} personne(s), ${data.migrations.length} trajet(s)`,
  )
  return data.migrations.length
}

export function seedFromFile(): number {
  const structured = loadStructuredSeed()
  if (structured) {
    return seedFromStructured(structured)
  }
  return seedFromLegacy()
}

export function seedIfEmpty(): void {
  if (countPersons() > 0 || countJourneys() > 0) return
  seedFromFile()
}

export function reseedDatabase(): number {
  clearAllData()
  return seedFromFile()
}
