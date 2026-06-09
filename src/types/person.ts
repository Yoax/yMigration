export interface Person {
  id: string
  firstName: string
  lastName: string | null
  birthYear: number | null
  birthPlaceName: string | null
  birthLat: number | null
  birthLng: number | null
  deathYear: number | null
  deathPlaceName: string | null
  deathLat: number | null
  deathLng: number | null
  notes: string | null
  story: string | null
}

export interface PersonInput {
  firstName: string
  lastName?: string | null
  birthYear?: number | null
  birthPlaceName?: string | null
  birthLat?: number | null
  birthLng?: number | null
  deathYear?: number | null
  deathPlaceName?: string | null
  deathLat?: number | null
  deathLng?: number | null
  notes?: string | null
  story?: string | null
}

export function personDisplayName(person: Person): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ')
}

export function formatLifeEvent(
  year: number | null | undefined,
  placeName: string | null | undefined,
): string | null {
  const place = placeName?.trim()
  const hasYear = year != null
  if (!hasYear && !place) return null
  if (hasYear && place) return `${place} (${year})`
  if (hasYear) return String(year)
  return place!
}

export function formatBirth(person: Person): string | null {
  return formatLifeEvent(person.birthYear, person.birthPlaceName)
}

export function formatDeath(person: Person): string | null {
  return formatLifeEvent(person.deathYear, person.deathPlaceName)
}
