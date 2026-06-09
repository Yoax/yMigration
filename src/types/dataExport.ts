import type { Journey } from './journey'
import type { Person } from './person'

export const EXPORT_FORMAT = 'ymigration' as const
export const EXPORT_VERSION = 1

export interface YmigrationExport {
  format: typeof EXPORT_FORMAT
  version: typeof EXPORT_VERSION
  exportedAt: string
  persons: Person[]
  journeys: Journey[]
}

export type ImportMode = 'replace' | 'merge'

export interface ImportResult {
  ok: true
  mode: ImportMode
  persons: number
  journeys: number
  exportedAt: string
}
