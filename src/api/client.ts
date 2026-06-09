import type { LatLngTuple } from 'leaflet'
import type { Journey, JourneyInput } from '../types/journey'
import type { Migration, MigrationData } from '../types/migration'
import type { GeocodePlace } from '../types/place'
import type { ImportMode, ImportResult } from '../types/dataExport'
import type { Person, PersonInput } from '../types/person'

const API_BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Erreur ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  searchPlaces: (q: string) =>
    request<GeocodePlace[]>(`/geocode?q=${encodeURIComponent(q)}`),
  getRoute: (migration: Migration) => {
    const params = new URLSearchParams({
      fromLat: String(migration.from.lat),
      fromLng: String(migration.from.lng),
      toLat: String(migration.to.lat),
      toLng: String(migration.to.lng),
    })
    if (migration.transport) params.set('transport', migration.transport)
    return request<{ positions: LatLngTuple[] }>(`/route?${params}`).then(
      (r) => r.positions,
    )
  },
  getMigrations: () => request<MigrationData>('/journeys/migrations'),
  getPersons: () => request<Person[]>('/persons'),
  createPerson: (data: PersonInput) =>
    request<Person>('/persons', { method: 'POST', body: JSON.stringify(data) }),
  updatePerson: (id: string, data: PersonInput) =>
    request<Person>(`/persons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePerson: (id: string) =>
    request<void>(`/persons/${id}`, { method: 'DELETE' }),
  getJourneys: () => request<Journey[]>('/journeys'),
  createJourney: (data: JourneyInput) =>
    request<Journey>('/journeys', { method: 'POST', body: JSON.stringify(data) }),
  updateJourney: (id: string, data: JourneyInput) =>
    request<Journey>(`/journeys/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteJourney: (id: string) =>
    request<void>(`/journeys/${id}`, { method: 'DELETE' }),
  exportData: async () => {
    const response = await fetch(`${API_BASE}/data/export`)
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string
      } | null
      throw new Error(body?.error ?? `Erreur ${response.status}`)
    }
    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition')
    const match = disposition?.match(/filename="([^"]+)"/)
    const filename = match?.[1] ?? 'ymigration-export.json'
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  },
  importData: (data: unknown, mode: ImportMode) =>
    request<ImportResult>('/data/import', {
      method: 'POST',
      body: JSON.stringify({ data, mode }),
    }),
  resetData: () =>
    request<{ ok: true }>('/data/reset', { method: 'POST' }),
}
