import { Router } from 'express'

export const geocodeRouter = Router()

interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  municipality?: string
  state?: string
  country?: string
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  type?: string
  address?: NominatimAddress
}

export interface GeocodePlace {
  id: string
  name: string
  lat: number
  lng: number
  detail: string
}

function formatPlaceName(item: NominatimResult): string {
  const addr = item.address
  if (addr) {
    const city =
      addr.city ?? addr.town ?? addr.village ?? addr.municipality
    const country = addr.country
    if (city && country) return `${city}, ${country}`
    if (city && addr.state) return `${city}, ${addr.state}`
  }
  const parts = item.display_name.split(',').map((p) => p.trim())
  return parts.slice(0, 2).join(', ')
}

geocodeRouter.get('/', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''

  if (q.length < 2) {
    res.json([])
    return
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', q)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '8')
    url.searchParams.set('addressdetails', '1')

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'yMigration/1.0 (migration map)',
        'Accept-Language': 'fr',
      },
    })

    if (!response.ok) {
      res.status(502).json({ error: 'Service de géocodage indisponible' })
      return
    }

    const results = (await response.json()) as NominatimResult[]

    const places: GeocodePlace[] = results.map((item) => ({
      id: String(item.place_id),
      name: formatPlaceName(item),
      lat: Number(item.lat),
      lng: Number(item.lon),
      detail: item.display_name,
    }))

    res.json(places)
  } catch {
    res.status(502).json({ error: 'Erreur lors de la recherche du lieu' })
  }
})
