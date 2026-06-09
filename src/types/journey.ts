import type { TransportMode } from './migration'

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
