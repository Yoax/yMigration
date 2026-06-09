export interface GeocodePlace {
  id: string
  name: string
  lat: number
  lng: number
  detail: string
}

export interface SelectedPlace {
  name: string
  lat: number
  lng: number
}

export function isPlaceSelected(place: SelectedPlace): boolean {
  return (
    place.name.trim().length > 0 &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng)
  )
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`
}
