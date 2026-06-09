import Database from 'better-sqlite3'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Journey, Person } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')
const defaultDbPath = join(dataDir, 'ymigration.db')
const legacyDbPath = join(dataDir, 'carte-navarro.db')

function resolveDbPath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH
  if (!existsSync(defaultDbPath) && existsSync(legacyDbPath)) {
    copyFileSync(legacyDbPath, defaultDbPath)
  }
  return defaultDbPath
}

const dbPath = resolveDbPath()

mkdirSync(dataDir, { recursive: true })

export const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS persons (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT,
    birth_year INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS journeys (
    id TEXT PRIMARY KEY,
    person_id TEXT REFERENCES persons(id) ON DELETE SET NULL,
    year INTEGER,
    transport TEXT CHECK (transport IS NULL OR transport IN ('bateau', 'avion', 'marche', 'train', 'voiture')),
    from_name TEXT NOT NULL,
    from_lat REAL NOT NULL,
    from_lng REAL NOT NULL,
    to_name TEXT NOT NULL,
    to_lat REAL NOT NULL,
    to_lng REAL NOT NULL,
    notes TEXT,
    branch TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

const personColumns = [
  `ALTER TABLE persons ADD COLUMN story TEXT`,
  `ALTER TABLE persons ADD COLUMN birth_place_name TEXT`,
  `ALTER TABLE persons ADD COLUMN birth_lat REAL`,
  `ALTER TABLE persons ADD COLUMN birth_lng REAL`,
  `ALTER TABLE persons ADD COLUMN death_year INTEGER`,
  `ALTER TABLE persons ADD COLUMN death_place_name TEXT`,
  `ALTER TABLE persons ADD COLUMN death_lat REAL`,
  `ALTER TABLE persons ADD COLUMN death_lng REAL`,
]
for (const sql of personColumns) {
  try {
    db.exec(sql)
  } catch {
    // colonne déjà présente
  }
}

const personSelect = `
  id, first_name AS firstName, last_name AS lastName,
  birth_year AS birthYear,
  birth_place_name AS birthPlaceName,
  birth_lat AS birthLat,
  birth_lng AS birthLng,
  death_year AS deathYear,
  death_place_name AS deathPlaceName,
  death_lat AS deathLat,
  death_lng AS deathLng,
  notes, story
`

const personRow = db.prepare(`
  SELECT ${personSelect}
  FROM persons WHERE id = ?
`)

const journeyRow = db.prepare(`
  SELECT id, person_id AS personId, year, transport,
         from_name AS fromName, from_lat AS fromLat, from_lng AS fromLng,
         to_name AS toName, to_lat AS toLat, to_lng AS toLng,
         notes, branch
  FROM journeys WHERE id = ?
`)

export function listPersons(): Person[] {
  return db
    .prepare(`
      SELECT ${personSelect}
      FROM persons
      ORDER BY last_name, first_name
    `)
    .all() as Person[]
}

export function getPerson(id: string): Person | undefined {
  return personRow.get(id) as Person | undefined
}

export function insertPerson(person: Person): Person {
  db.prepare(`
    INSERT INTO persons (
      id, first_name, last_name, birth_year,
      birth_place_name, birth_lat, birth_lng,
      death_year, death_place_name, death_lat, death_lng,
      notes, story
    ) VALUES (
      @id, @firstName, @lastName, @birthYear,
      @birthPlaceName, @birthLat, @birthLng,
      @deathYear, @deathPlaceName, @deathLat, @deathLng,
      @notes, @story
    )
  `).run(person)
  return getPerson(person.id)!
}

export function updatePerson(person: Person): Person | undefined {
  const result = db
    .prepare(`
      UPDATE persons
      SET first_name = @firstName, last_name = @lastName,
          birth_year = @birthYear,
          birth_place_name = @birthPlaceName,
          birth_lat = @birthLat,
          birth_lng = @birthLng,
          death_year = @deathYear,
          death_place_name = @deathPlaceName,
          death_lat = @deathLat,
          death_lng = @deathLng,
          notes = @notes, story = @story
      WHERE id = @id
    `)
    .run(person)
  if (result.changes === 0) return undefined
  return getPerson(person.id)
}

export function deletePerson(id: string): boolean {
  const result = db.prepare('DELETE FROM persons WHERE id = ?').run(id)
  return result.changes > 0
}

export function listJourneys(): Journey[] {
  return db
    .prepare(`
      SELECT id, person_id AS personId, year, transport,
             from_name AS fromName, from_lat AS fromLat, from_lng AS fromLng,
             to_name AS toName, to_lat AS toLat, to_lng AS toLng,
             notes, branch
      FROM journeys
      ORDER BY year IS NULL, year, from_name
    `)
    .all() as Journey[]
}

export function getJourney(id: string): Journey | undefined {
  return journeyRow.get(id) as Journey | undefined
}

export function insertJourney(journey: Journey): Journey {
  db.prepare(`
    INSERT INTO journeys (
      id, person_id, year, transport,
      from_name, from_lat, from_lng,
      to_name, to_lat, to_lng,
      notes, branch
    ) VALUES (
      @id, @personId, @year, @transport,
      @fromName, @fromLat, @fromLng,
      @toName, @toLat, @toLng,
      @notes, @branch
    )
  `).run(journey)
  return getJourney(journey.id)!
}

export function updateJourney(journey: Journey): Journey | undefined {
  const result = db
    .prepare(`
      UPDATE journeys SET
        person_id = @personId, year = @year, transport = @transport,
        from_name = @fromName, from_lat = @fromLat, from_lng = @fromLng,
        to_name = @toName, to_lat = @toLat, to_lng = @toLng,
        notes = @notes, branch = @branch
      WHERE id = @id
    `)
    .run(journey)
  if (result.changes === 0) return undefined
  return getJourney(journey.id)
}

export function deleteJourney(id: string): boolean {
  const result = db.prepare('DELETE FROM journeys WHERE id = ?').run(id)
  return result.changes > 0
}

export function countPersons(): number {
  return (db.prepare('SELECT COUNT(*) AS c FROM persons').get() as { c: number }).c
}

export function countJourneys(): number {
  return (db.prepare('SELECT COUNT(*) AS c FROM journeys').get() as { c: number }).c
}

export function clearAllData(): void {
  db.exec('DELETE FROM journeys; DELETE FROM persons;')
}

const upsertPersonStmt = db.prepare(`
  INSERT INTO persons (
    id, first_name, last_name, birth_year,
    birth_place_name, birth_lat, birth_lng,
    death_year, death_place_name, death_lat, death_lng,
    notes, story
  ) VALUES (
    @id, @firstName, @lastName, @birthYear,
    @birthPlaceName, @birthLat, @birthLng,
    @deathYear, @deathPlaceName, @deathLat, @deathLng,
    @notes, @story
  )
  ON CONFLICT(id) DO UPDATE SET
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    birth_year = excluded.birth_year,
    birth_place_name = excluded.birth_place_name,
    birth_lat = excluded.birth_lat,
    birth_lng = excluded.birth_lng,
    death_year = excluded.death_year,
    death_place_name = excluded.death_place_name,
    death_lat = excluded.death_lat,
    death_lng = excluded.death_lng,
    notes = excluded.notes,
    story = excluded.story
`)

const upsertJourneyStmt = db.prepare(`
  INSERT INTO journeys (
    id, person_id, year, transport,
    from_name, from_lat, from_lng,
    to_name, to_lat, to_lng,
    notes, branch
  ) VALUES (
    @id, @personId, @year, @transport,
    @fromName, @fromLat, @fromLng,
    @toName, @toLat, @toLng,
    @notes, @branch
  )
  ON CONFLICT(id) DO UPDATE SET
    person_id = excluded.person_id,
    year = excluded.year,
    transport = excluded.transport,
    from_name = excluded.from_name,
    from_lat = excluded.from_lat,
    from_lng = excluded.from_lng,
    to_name = excluded.to_name,
    to_lat = excluded.to_lat,
    to_lng = excluded.to_lng,
    notes = excluded.notes,
    branch = excluded.branch
`)

export function importDataset(
  persons: Person[],
  journeys: Journey[],
  mode: 'replace' | 'merge',
): { persons: number; journeys: number } {
  const run = db.transaction(() => {
    if (mode === 'replace') {
      clearAllData()
    }
    for (const person of persons) {
      upsertPersonStmt.run(person)
    }
    for (const journey of journeys) {
      upsertJourneyStmt.run(journey)
    }
  })
  run()
  return { persons: persons.length, journeys: journeys.length }
}

export function personDisplayName(person: Person): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ')
}
