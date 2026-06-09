import { Router } from 'express'
import type { TransportMode } from '../types.js'
import { computeRoute } from '../utils/geo.js'

export const routingRouter = Router()

const TRANSPORTS: TransportMode[] = [
  'bateau',
  'avion',
  'marche',
  'train',
  'voiture',
]

const cache = new Map<string, [number, number][]>()

function cacheKey(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  transport: string,
) {
  return [
    transport,
    fromLat.toFixed(3),
    fromLng.toFixed(3),
    toLat.toFixed(3),
    toLng.toFixed(3),
  ].join(':')
}

function parseCoord(value: unknown, label: string): number {
  const n = Number(value)
  if (!Number.isFinite(n)) throw new Error(`${label} invalide`)
  return n
}

routingRouter.get('/', async (req, res) => {
  try {
    const fromLat = parseCoord(req.query.fromLat, 'fromLat')
    const fromLng = parseCoord(req.query.fromLng, 'fromLng')
    const toLat = parseCoord(req.query.toLat, 'toLat')
    const toLng = parseCoord(req.query.toLng, 'toLng')
    const transport =
      typeof req.query.transport === 'string' &&
      TRANSPORTS.includes(req.query.transport as TransportMode)
        ? (req.query.transport as TransportMode)
        : null

    const key = cacheKey(fromLat, fromLng, toLat, toLng, transport ?? 'default')
    const cached = cache.get(key)
    if (cached) {
      res.json({ positions: cached })
      return
    }

    const positions = await computeRoute(
      { lat: fromLat, lng: fromLng },
      { lat: toLat, lng: toLng },
      transport,
    )

    cache.set(key, positions)
    res.json({ positions })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur de calcul de route'
    res.status(400).json({ error: message })
  }
})
