import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../api/client'
import {
  useJourneyAnimation,
  type JourneyAnimationState,
} from '../hooks/useJourneyAnimation'
import type { Migration } from '../types/migration'
import {
  extractPersons,
  migrationsForPerson,
  personKeyForMigration,
  type PersonOption,
} from '../utils/journeyAnimation'

interface MapShellContextValue {
  migrations: Migration[]
  loading: boolean
  error: string | null
  filteredMigrations: Migration[]
  persons: PersonOption[]
  selected: Set<string>
  setSelected: (selected: Set<string>) => void
  animation: JourneyAnimationState
}

const MapShellContext = createContext<MapShellContextValue | null>(null)

export function MapShellProvider({ children }: { children: ReactNode }) {
  const [migrations, setMigrations] = useState<Migration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [persons, setPersons] = useState<PersonOption[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filterInitialized, setFilterInitialized] = useState(false)

  const allPersons = useMemo(() => extractPersons(migrations), [migrations])

  const filteredMigrations = useMemo(
    () =>
      migrations.filter((m) => selected.has(personKeyForMigration(m))),
    [migrations, selected],
  )

  const animation = useJourneyAnimation(filteredMigrations)

  useEffect(() => {
    api
      .getMigrations()
      .then((data) => setMigrations(data.migrations))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setPersons(allPersons)
  }, [allPersons])

  useEffect(() => {
    if (!filterInitialized && allPersons.length > 0) {
      setSelected(new Set(allPersons.map((p) => p.key)))
      setFilterInitialized(true)
    }
  }, [allPersons, filterInitialized])

  useEffect(() => {
    if (!animation.personKey) return
    const visible = migrationsForPerson(
      filteredMigrations,
      animation.personKey,
    )
    if (visible.length === 0) {
      animation.setPersonKey(null)
      animation.reset()
    }
  }, [
    filteredMigrations,
    animation.personKey,
    animation.setPersonKey,
    animation.reset,
  ])

  const value = useMemo(
    () => ({
      migrations,
      loading,
      error,
      filteredMigrations,
      persons,
      selected,
      setSelected,
      animation,
    }),
    [migrations, loading, error, filteredMigrations, persons, selected, animation],
  )

  return (
    <MapShellContext.Provider value={value}>{children}</MapShellContext.Provider>
  )
}

export function useMapShell() {
  const ctx = useContext(MapShellContext)
  if (!ctx) {
    throw new Error('useMapShell doit être utilisé dans MapShellProvider')
  }
  return ctx
}
