import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LatLngTuple } from 'leaflet'
import { api } from '../api/client'
import type { Migration } from '../types/migration'
import { migrationRoutePositions } from '../utils/transport'

function migrationsKey(migrations: Migration[]): string {
  return migrations
    .map(
      (m) =>
        `${m.id}:${m.transport}:${m.from.lat},${m.from.lng}:${m.to.lat},${m.to.lng}`,
    )
    .join('|')
}

export function useRouteCache(migrations: Migration[]) {
  const [cache, setCache] = useState<Map<string, LatLngTuple[]>>(new Map())
  const [loading, setLoading] = useState(false)

  const key = useMemo(() => migrationsKey(migrations), [migrations])

  useEffect(() => {
    if (migrations.length === 0) {
      setCache(new Map())
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all(
      migrations.map(async (migration) => {
        try {
          const positions = await api.getRoute(migration)
          return [migration.id, positions] as const
        } catch {
          return [
            migration.id,
            migrationRoutePositions(migration),
          ] as const
        }
      }),
    )
      .then((entries) => {
        if (!cancelled) {
          setCache(new Map(entries))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [key, migrations])

  const getPositions = useCallback(
    (migration: Migration): LatLngTuple[] => {
      return cache.get(migration.id) ?? migrationRoutePositions(migration)
    },
    [cache],
  )

  return { getPositions, loading, ready: cache.size > 0 || migrations.length === 0 }
}
