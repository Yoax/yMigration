import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import {
  deletePerson,
  getPerson,
  insertPerson,
  listPersons,
  updatePerson,
} from '../db.js'
import type { Person, PersonInput } from '../types.js'

export const personsRouter = Router()

function toPersonRecord(id: string, body: PersonInput): Person {
  return {
    id,
    firstName: body.firstName.trim(),
    lastName: body.lastName?.trim() || null,
    birthYear: body.birthYear ?? null,
    birthPlaceName: body.birthPlaceName?.trim() || null,
    birthLat: body.birthLat == null ? null : Number(body.birthLat),
    birthLng: body.birthLng == null ? null : Number(body.birthLng),
    deathYear: body.deathYear ?? null,
    deathPlaceName: body.deathPlaceName?.trim() || null,
    deathLat: body.deathLat == null ? null : Number(body.deathLat),
    deathLng: body.deathLng == null ? null : Number(body.deathLng),
    notes: body.notes?.trim() || null,
    story: body.story?.trim() || null,
  }
}

personsRouter.get('/', (_req, res) => {
  res.json(listPersons())
})

personsRouter.get('/:id', (req, res) => {
  const person = getPerson(req.params.id)
  if (!person) {
    res.status(404).json({ error: 'Personne introuvable' })
    return
  }
  res.json(person)
})

personsRouter.post('/', (req, res) => {
  const body = req.body as PersonInput
  if (!body.firstName?.trim()) {
    res.status(400).json({ error: 'Le prénom est requis' })
    return
  }

  const person = insertPerson(toPersonRecord(randomUUID(), body))
  res.status(201).json(person)
})

personsRouter.put('/:id', (req, res) => {
  const existing = getPerson(req.params.id)
  if (!existing) {
    res.status(404).json({ error: 'Personne introuvable' })
    return
  }

  const body = req.body as PersonInput
  if (!body.firstName?.trim()) {
    res.status(400).json({ error: 'Le prénom est requis' })
    return
  }

  const updated = updatePerson(toPersonRecord(existing.id, body))
  res.json(updated)
})

personsRouter.delete('/:id', (req, res) => {
  const ok = deletePerson(req.params.id)
  if (!ok) {
    res.status(404).json({ error: 'Personne introuvable' })
    return
  }
  res.status(204).send()
})
