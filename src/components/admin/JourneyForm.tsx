import { useState, type FormEvent } from 'react'
import { TRANSPORT_MODES } from '../../utils/transport'
import type { Journey, JourneyInput } from '../../types/journey'
import type { Person } from '../../types/person'
import { personDisplayName } from '../../types/person'
import type { TransportMode } from '../../types/migration'
import { isPlaceSelected } from '../../types/place'
import { PlaceSearch } from './PlaceSearch'

interface JourneyFormProps {
  persons: Person[]
  initial?: Journey
  onSubmit: (data: JourneyInput) => Promise<void>
  onCancel?: () => void
}

const emptyForm: JourneyInput = {
  personId: '',
  year: null,
  transport: null,
  fromName: '',
  fromLat: NaN,
  fromLng: NaN,
  toName: '',
  toLat: NaN,
  toLng: NaN,
  notes: '',
  branch: '',
}

function journeyToForm(journey: Journey): JourneyInput {
  return {
    personId: journey.personId ?? '',
    year: journey.year,
    transport: journey.transport,
    fromName: journey.fromName,
    fromLat: journey.fromLat,
    fromLng: journey.fromLng,
    toName: journey.toName,
    toLat: journey.toLat,
    toLng: journey.toLng,
    notes: journey.notes ?? '',
    branch: journey.branch ?? '',
  }
}

export function JourneyForm({ persons, initial, onSubmit, onCancel }: JourneyFormProps) {
  const [form, setForm] = useState<JourneyInput>(
    initial ? journeyToForm(initial) : emptyForm,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fromPlace = {
    name: form.fromName,
    lat: form.fromLat,
    lng: form.fromLng,
  }
  const toPlace = {
    name: form.toName,
    lat: form.toLat,
    lng: form.toLng,
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!isPlaceSelected(fromPlace)) {
      setError('Sélectionnez le lieu de départ dans la liste de recherche')
      return
    }
    if (!isPlaceSelected(toPlace)) {
      setError("Sélectionnez le lieu d'arrivée dans la liste de recherche")
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        ...form,
        personId: form.personId || null,
        year: form.year == null ? null : Number(form.year),
        transport: form.transport || null,
        notes: form.notes || null,
        branch: form.branch || null,
        fromLat: Number(form.fromLat),
        fromLng: Number(form.fromLng),
        toLat: Number(form.toLat),
        toLng: Number(form.toLng),
      })
      if (!initial) setForm(emptyForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h3 className="admin-form__title">
        {initial ? 'Modifier le trajet' : 'Ajouter un trajet'}
      </h3>
      {error && <p className="admin-form__error">{error}</p>}
      <label className="admin-form__field">
        Personne
        <select
          value={form.personId ?? ''}
          onChange={(e) => setForm({ ...form, personId: e.target.value })}
        >
          <option value="">— Aucune —</option>
          {persons.map((p) => (
            <option key={p.id} value={p.id}>
              {personDisplayName(p)}
            </option>
          ))}
        </select>
      </label>
      <div className="admin-form__row">
        <label className="admin-form__field">
          Année
          <input
            type="number"
            value={form.year ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                year: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </label>
        <label className="admin-form__field">
          Transport
          <select
            value={form.transport ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                transport: (e.target.value || null) as TransportMode | null,
              })
            }
          >
            <option value="">— Non précisé —</option>
            {TRANSPORT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>
      </div>

      <PlaceSearch
        legend="Départ"
        required
        place={fromPlace}
        onPlaceChange={(p) =>
          setForm({
            ...form,
            fromName: p.name,
            fromLat: p.lat,
            fromLng: p.lng,
          })
        }
      />

      <PlaceSearch
        legend="Arrivée"
        required
        place={toPlace}
        onPlaceChange={(p) =>
          setForm({
            ...form,
            toName: p.name,
            toLat: p.lat,
            toLng: p.lng,
          })
        }
      />

      <label className="admin-form__field">
        Contexte et récit de ce trajet
        <textarea
          rows={4}
          value={form.notes ?? ''}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Circonstances du voyage, dates précises, anecdotes… Affiché pendant l'animation à cette étape."
        />
      </label>
      <div className="admin-form__actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : initial ? 'Mettre à jour' : 'Ajouter'}
        </button>
        {onCancel && (
          <button type="button" className="admin-form__btn-secondary" onClick={onCancel}>
            Annuler
          </button>
        )}
      </div>
    </form>
  )
}
