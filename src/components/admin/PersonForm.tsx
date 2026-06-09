import { useState, type FormEvent } from 'react'
import type { Person, PersonInput } from '../../types/person'
import { isPlaceSelected } from '../../types/place'
import { PlaceSearch } from './PlaceSearch'

interface PersonFormProps {
  initial?: Person
  onSubmit: (data: PersonInput) => Promise<void>
  onCancel?: () => void
}

const emptyForm: PersonInput = {
  firstName: '',
  lastName: '',
  birthYear: null,
  birthPlaceName: '',
  birthLat: NaN,
  birthLng: NaN,
  deathYear: null,
  deathPlaceName: '',
  deathLat: NaN,
  deathLng: NaN,
  notes: '',
  story: '',
}

function personToForm(person: Person): PersonInput {
  return {
    firstName: person.firstName,
    lastName: person.lastName ?? '',
    birthYear: person.birthYear,
    birthPlaceName: person.birthPlaceName ?? '',
    birthLat: person.birthLat ?? NaN,
    birthLng: person.birthLng ?? NaN,
    deathYear: person.deathYear,
    deathPlaceName: person.deathPlaceName ?? '',
    deathLat: person.deathLat ?? NaN,
    deathLng: person.deathLng ?? NaN,
    notes: person.notes ?? '',
    story: person.story ?? '',
  }
}

function placeFromForm(
  name: string | null | undefined,
  lat: number | null | undefined,
  lng: number | null | undefined,
) {
  return {
    name: name ?? '',
    lat: lat ?? NaN,
    lng: lng ?? NaN,
  }
}

export function PersonForm({ initial, onSubmit, onCancel }: PersonFormProps) {
  const [form, setForm] = useState<PersonInput>(
    initial ? personToForm(initial) : emptyForm,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const birthPlace = placeFromForm(
    form.birthPlaceName,
    form.birthLat,
    form.birthLng,
  )
  const deathPlace = placeFromForm(
    form.deathPlaceName,
    form.deathLat,
    form.deathLng,
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const birthSelected = isPlaceSelected(birthPlace)
      const deathSelected = isPlaceSelected(deathPlace)

      await onSubmit({
        firstName: form.firstName,
        lastName: form.lastName || null,
        birthYear: form.birthYear == null ? null : Number(form.birthYear),
        birthPlaceName: birthSelected ? birthPlace.name : null,
        birthLat: birthSelected ? birthPlace.lat : null,
        birthLng: birthSelected ? birthPlace.lng : null,
        deathYear: form.deathYear == null ? null : Number(form.deathYear),
        deathPlaceName: deathSelected ? deathPlace.name : null,
        deathLat: deathSelected ? deathPlace.lat : null,
        deathLng: deathSelected ? deathPlace.lng : null,
        notes: form.notes || null,
        story: form.story || null,
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
        {initial ? 'Modifier la personne' : 'Ajouter une personne'}
      </h3>
      {error && <p className="admin-form__error">{error}</p>}
      <label className="admin-form__field">
        Prénom *
        <input
          required
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
      </label>
      <label className="admin-form__field">
        Nom
        <input
          value={form.lastName ?? ''}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
      </label>

      <fieldset className="admin-form__group">
        <legend>Naissance</legend>
        <label className="admin-form__field">
          Année
          <input
            type="number"
            value={form.birthYear ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                birthYear: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </label>
        <PlaceSearch
          legend="Lieu de naissance"
          place={birthPlace}
          onPlaceChange={(p) =>
            setForm({
              ...form,
              birthPlaceName: p.name,
              birthLat: p.lat,
              birthLng: p.lng,
            })
          }
        />
      </fieldset>

      <fieldset className="admin-form__group">
        <legend>Décès (facultatif)</legend>
        <label className="admin-form__field">
          Année
          <input
            type="number"
            value={form.deathYear ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                deathYear: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </label>
        <PlaceSearch
          legend="Lieu de décès"
          place={deathPlace}
          onPlaceChange={(p) =>
            setForm({
              ...form,
              deathPlaceName: p.name,
              deathLat: p.lat,
              deathLng: p.lng,
            })
          }
        />
      </fieldset>

      <label className="admin-form__field">
        Notes internes
        <textarea
          rows={2}
          value={form.notes ?? ''}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Rappels pour l'administration (non affichés sur la carte)"
        />
      </label>
      <label className="admin-form__field">
        Récit et éléments clés
        <textarea
          rows={5}
          value={form.story ?? ''}
          onChange={(e) => setForm({ ...form, story: e.target.value })}
          placeholder="Contexte familial, motivations du départ, éléments marquants… Affiché au début de l'animation."
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
