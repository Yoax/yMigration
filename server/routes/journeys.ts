import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import {
  deleteJourney,
  getJourney,
  getPerson,
  insertJourney,
  listJourneys,
  personDisplayName,
  updateJourney,
} from '../db.js'
import type {
  JourneyInput,
  MigrationResponse,
  Person,
  PersonLifeEvent,
  TransportMode,
} from '../types.js'
import { TRANSPORT_MODES } from '../types.js'

export const journeysRouter = Router()

function isValidTransport(value: unknown): value is TransportMode {
  return typeof value === 'string' && TRANSPORT_MODES.includes(value as TransportMode)
}

function validateJourneyInput(body: JourneyInput): string | null {
  if (!body.fromName?.trim()) return 'Le lieu de départ est requis'
  if (!body.toName?.trim()) return "Le lieu d'arrivée est requis"
  if (body.fromLat == null || Number.isNaN(Number(body.fromLat))) {
    return 'Latitude de départ invalide'
  }
  if (body.fromLng == null || Number.isNaN(Number(body.fromLng))) {
    return 'Longitude de départ invalide'
  }
  if (body.toLat == null || Number.isNaN(Number(body.toLat))) {
    return "Latitude d'arrivée invalide"
  }
  if (body.toLng == null || Number.isNaN(Number(body.toLng))) {
    return "Longitude d'arrivée invalide"
  }
  if (body.transport != null && !isValidTransport(body.transport)) {
    return 'Moyen de transport invalide'
  }
  if (body.personId) {
    const person = getPerson(body.personId)
    if (!person) return 'Personne associée introuvable'
  }
  return null
}

function toJourneyRecord(id: string, body: JourneyInput) {
  return {
    id,
    personId: body.personId ?? null,
    year: body.year ?? null,
    transport: body.transport ?? null,
    fromName: body.fromName.trim(),
    fromLat: Number(body.fromLat),
    fromLng: Number(body.fromLng),
    toName: body.toName.trim(),
    toLat: Number(body.toLat),
    toLng: Number(body.toLng),
    notes: body.notes?.trim() || null,
    branch: body.branch?.trim() || null,
  }
}

function toLifeEvent(
  year: number | null,
  placeName: string | null,
  lat: number | null,
  lng: number | null,
): PersonLifeEvent | undefined {
  if (year == null && !placeName) return undefined
  return { year, placeName, lat, lng }
}

function attachPersonLife(migration: MigrationResponse, person: Person): void {
  const birth = toLifeEvent(
    person.birthYear,
    person.birthPlaceName,
    person.birthLat,
    person.birthLng,
  )
  const death = toLifeEvent(
    person.deathYear,
    person.deathPlaceName,
    person.deathLat,
    person.deathLng,
  )
  if (birth) migration.personBirth = birth
  if (death) migration.personDeath = death
}

function journeyToMigration(journey: ReturnType<typeof listJourneys>[number]): MigrationResponse {
  const person = journey.personId ? getPerson(journey.personId) : undefined
  const migration: MigrationResponse = {
    id: journey.id,
    from: { name: journey.fromName, lat: journey.fromLat, lng: journey.fromLng },
    to: { name: journey.toName, lat: journey.toLat, lng: journey.toLng },
  }

  if (person) {
    migration.label = personDisplayName(person)
    migration.personId = person.id
    if (person.story) migration.personStory = person.story
    attachPersonLife(migration, person)
  }
  if (journey.year != null) migration.year = journey.year
  if (journey.transport) migration.transport = journey.transport
  if (journey.notes) migration.notes = journey.notes
  if (journey.branch) migration.branch = journey.branch

  return migration
}

journeysRouter.get('/migrations', (_req, res) => {
  const migrations = listJourneys().map(journeyToMigration)
  res.json({ migrations })
})

journeysRouter.get('/', (_req, res) => {
  res.json(listJourneys())
})

journeysRouter.get('/:id', (req, res) => {
  const journey = getJourney(req.params.id)
  if (!journey) {
    res.status(404).json({ error: 'Trajet introuvable' })
    return
  }
  res.json(journey)
})

journeysRouter.post('/', (req, res) => {
  const body = req.body as JourneyInput
  const error = validateJourneyInput(body)
  if (error) {
    res.status(400).json({ error })
    return
  }

  const journey = insertJourney(toJourneyRecord(randomUUID(), body))
  res.status(201).json(journey)
})

journeysRouter.put('/:id', (req, res) => {
  const existing = getJourney(req.params.id)
  if (!existing) {
    res.status(404).json({ error: 'Trajet introuvable' })
    return
  }

  const body = req.body as JourneyInput
  const error = validateJourneyInput(body)
  if (error) {
    res.status(400).json({ error })
    return
  }

  const updated = updateJourney(toJourneyRecord(existing.id, body))
  res.json(updated)
})

journeysRouter.delete('/:id', (req, res) => {
  const ok = deleteJourney(req.params.id)
  if (!ok) {
    res.status(404).json({ error: 'Trajet introuvable' })
    return
  }
  res.status(204).send()
})
