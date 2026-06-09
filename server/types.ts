export type TransportMode = 'bateau' | 'avion' | 'marche' | 'train' | 'voiture'

export const TRANSPORT_MODES: TransportMode[] = [
  'bateau',
  'avion',
  'marche',
  'train',
  'voiture',
]

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

export interface PersonLifeEvent {
  year: number | null
  placeName: string | null
  lat: number | null
  lng: number | null
}

export interface Journey {
  id: string
  personId: string | null
  year: number | null
  transport: TransportMode | null
  fromName: string
  fromLat: number
  fromLng: number
  toName: string
  toLat: number
  toLng: number
  notes: string | null
  branch: string | null
}

export interface JourneyInput {
  personId?: string | null
  year?: number | null
  transport?: TransportMode | null
  fromName: string
  fromLat: number
  fromLng: number
  toName: string
  toLat: number
  toLng: number
  notes?: string | null
  branch?: string | null
}

export interface MigrationResponse {
  id: string
  label?: string
  year?: number
  from: { name: string; lat: number; lng: number }
  to: { name: string; lat: number; lng: number }
  transport?: TransportMode
  notes?: string
  branch?: string
  personId?: string
  personStory?: string
  personBirth?: PersonLifeEvent
  personDeath?: PersonLifeEvent
}
