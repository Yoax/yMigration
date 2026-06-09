import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { DataTransferPanel } from '../components/admin/DataTransferPanel'
import { StartMyJourneyPanel } from '../components/admin/StartMyJourneyPanel'
import { JourneyForm } from '../components/admin/JourneyForm'
import { PersonForm } from '../components/admin/PersonForm'
import type { Journey } from '../types/journey'
import type { Person, PersonInput } from '../types/person'
import { formatBirth, formatDeath, personDisplayName } from '../types/person'
import type { JourneyInput } from '../types/journey'
import { getTransportStyle } from '../utils/transport'

export function AdminPage() {
  const [persons, setPersons] = useState<Person[]>([])
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [editingJourney, setEditingJourney] = useState<Journey | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, j] = await Promise.all([api.getPersons(), api.getJourneys()])
      setPersons(p)
      setJourneys(j)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreatePerson(data: PersonInput) {
    await api.createPerson(data)
    setEditingPerson(null)
    await load()
  }

  async function handleUpdatePerson(data: PersonInput) {
    if (!editingPerson) return
    await api.updatePerson(editingPerson.id, data)
    setEditingPerson(null)
    await load()
  }

  async function handleDeletePerson(id: string) {
    if (!confirm('Supprimer cette personne ?')) return
    await api.deletePerson(id)
    if (editingPerson?.id === id) setEditingPerson(null)
    await load()
  }

  async function handleCreateJourney(data: JourneyInput) {
    await api.createJourney(data)
    setEditingJourney(null)
    await load()
  }

  async function handleUpdateJourney(data: JourneyInput) {
    if (!editingJourney) return
    await api.updateJourney(editingJourney.id, data)
    setEditingJourney(null)
    await load()
  }

  async function handleDeleteJourney(id: string) {
    if (!confirm('Supprimer ce trajet ?')) return
    await api.deleteJourney(id)
    if (editingJourney?.id === id) setEditingJourney(null)
    await load()
  }

  const personById = new Map(persons.map((p) => [p.id, p]))

  async function handleDataReset() {
    setEditingPerson(null)
    setEditingJourney(null)
    await load()
  }

  return (
    <main className="admin">
      {loading && <p className="admin__status">Chargement…</p>}
      {error && <p className="admin__status admin__status--error">{error}</p>}

      <StartMyJourneyPanel onReset={handleDataReset} />
      <DataTransferPanel onImported={load} />

      <section className="admin__section">
        <h2 className="admin__heading">Personnes</h2>
        <div className="admin__grid">
          <PersonForm
            key={editingPerson?.id ?? 'new-person'}
            initial={editingPerson ?? undefined}
            onSubmit={editingPerson ? handleUpdatePerson : handleCreatePerson}
            onCancel={editingPerson ? () => setEditingPerson(null) : undefined}
          />
          <div className="admin__list-wrap">
            <ul className="admin__list">
              {persons.map((person) => (
                <li key={person.id} className="admin__list-item">
                  <div>
                    <strong>{personDisplayName(person)}</strong>
                    {formatBirth(person) && (
                      <p className="admin__meta">
                        Naissance : {formatBirth(person)}
                      </p>
                    )}
                    {formatDeath(person) && (
                      <p className="admin__meta">Décès : {formatDeath(person)}</p>
                    )}
                    {person.notes && <p className="admin__notes">{person.notes}</p>}
                  </div>
                  <div className="admin__list-actions">
                    <button type="button" onClick={() => setEditingPerson(person)}>
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="admin__btn-danger"
                      onClick={() => handleDeletePerson(person.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
              {persons.length === 0 && !loading && (
                <li className="admin__empty">Aucune personne enregistrée</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      <section className="admin__section">
        <h2 className="admin__heading">Trajets</h2>
        <div className="admin__grid">
          <JourneyForm
            key={editingJourney?.id ?? 'new-journey'}
            persons={persons}
            initial={editingJourney ?? undefined}
            onSubmit={editingJourney ? handleUpdateJourney : handleCreateJourney}
            onCancel={editingJourney ? () => setEditingJourney(null) : undefined}
          />
          <div className="admin__list-wrap">
            <ul className="admin__list">
              {journeys.map((journey) => {
                const person = journey.personId
                  ? personById.get(journey.personId)
                  : undefined
                const transport = journey.transport
                  ? getTransportStyle(journey.transport)
                  : null
                return (
                  <li key={journey.id} className="admin__list-item">
                    <div>
                      <strong>
                        {journey.fromName} → {journey.toName}
                      </strong>
                      <p className="admin__meta">
                        {person ? personDisplayName(person) : 'Sans personne'}
                        {journey.year != null && ` · ${journey.year}`}
                        {transport && ` · ${transport.icon} ${transport.label}`}
                      </p>
                      {journey.notes && <p className="admin__notes">{journey.notes}</p>}
                    </div>
                    <div className="admin__list-actions">
                      <button type="button" onClick={() => setEditingJourney(journey)}>
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="admin__btn-danger"
                        onClick={() => handleDeleteJourney(journey.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </li>
                )
              })}
              {journeys.length === 0 && !loading && (
                <li className="admin__empty">Aucun trajet enregistré</li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}
