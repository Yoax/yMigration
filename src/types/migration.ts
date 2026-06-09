export type TransportMode = 'bateau' | 'avion' | 'marche' | 'train' | 'voiture'

export interface Place {
  name: string
  lat: number
  lng: number
}

export interface PersonLifeEvent {
  year: number | null
  placeName: string | null
  lat: number | null
  lng: number | null
}

export interface Migration {
  id: string
  label?: string
  year?: number
  from: Place
  to: Place
  transport?: TransportMode
  notes?: string
  branch?: string
  personId?: string
  personStory?: string
  personBirth?: PersonLifeEvent
  personDeath?: PersonLifeEvent
}

export interface MigrationData {
  migrations: Migration[]
}
