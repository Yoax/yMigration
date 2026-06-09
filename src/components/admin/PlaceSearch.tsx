import { useEffect, useId, useRef, useState } from 'react'
import { api } from '../../api/client'
import type { GeocodePlace, SelectedPlace } from '../../types/place'
import { formatCoordinates, isPlaceSelected } from '../../types/place'

interface PlaceSearchProps {
  legend: string
  place: SelectedPlace
  onPlaceChange: (place: SelectedPlace) => void
  required?: boolean
}

export function PlaceSearch({
  legend,
  place,
  onPlaceChange,
  required = false,
}: PlaceSearchProps) {
  const listId = useId()
  const wrapperRef = useRef<HTMLFieldSetElement>(null)
  const [query, setQuery] = useState(place.name)
  const [results, setResults] = useState<GeocodePlace[]>([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const selected = isPlaceSelected(place)

  useEffect(() => {
    setQuery(place.name)
  }, [place.name, place.lat, place.lng])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    if (selected && query === place.name) {
      setResults([])
      return
    }

    const timer = window.setTimeout(() => {
      setLoading(true)
      setSearchError(null)
      api
        .searchPlaces(query)
        .then((items) => {
          setResults(items)
          setOpen(items.length > 0)
        })
        .catch((err: Error) => {
          setResults([])
          setSearchError(err.message)
        })
        .finally(() => setLoading(false))
    }, 350)

    return () => window.clearTimeout(timer)
  }, [query, selected, place.name])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(item: GeocodePlace) {
    onPlaceChange({ name: item.name, lat: item.lat, lng: item.lng })
    setQuery(item.name)
    setResults([])
    setOpen(false)
    setSearchError(null)
  }

  function handleInputChange(value: string) {
    setQuery(value)
    if (selected && value !== place.name) {
      onPlaceChange({ name: value, lat: NaN, lng: NaN })
    } else if (!selected) {
      onPlaceChange({ name: value, lat: NaN, lng: NaN })
    }
    setOpen(true)
  }

  function handleClear() {
    onPlaceChange({ name: '', lat: NaN, lng: NaN })
    setQuery('')
    setResults([])
    setOpen(false)
    setSearchError(null)
  }

  return (
    <fieldset className="admin-form__fieldset place-search" ref={wrapperRef}>
      <legend>{legend}</legend>
      <label className="admin-form__field">
        Ville ou lieu
        <div className="place-search__input-wrap">
          <input
            required={required}
            type="search"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Ex. Perpignan, Montréal…"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
          />
          {selected && (
            <button
              type="button"
              className="place-search__clear"
              onClick={handleClear}
              aria-label="Effacer le lieu"
            >
              ×
            </button>
          )}
        </div>
      </label>

      {loading && <p className="place-search__hint">Recherche en cours…</p>}
      {searchError && <p className="place-search__error">{searchError}</p>}

      {open && results.length > 0 && (
        <ul className="place-search__results" id={listId} role="listbox">
          {results.map((item) => (
            <li key={item.id} role="option">
              <button
                type="button"
                className="place-search__result"
                onClick={() => handleSelect(item)}
              >
                <span className="place-search__result-name">{item.name}</span>
                <span className="place-search__result-detail">{item.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && query.trim().length >= 2 && results.length === 0 && !searchError && (
        <p className="place-search__hint">Aucun résultat — essayez un autre nom</p>
      )}

      {selected ? (
        <p className="place-search__coords" aria-live="polite">
          Coordonnées : {formatCoordinates(place.lat, place.lng)}
        </p>
      ) : (
        query.trim().length > 0 && (
          <p className="place-search__hint place-search__hint--warn">
            Sélectionnez un lieu dans la liste pour enregistrer ses coordonnées
          </p>
        )
      )}
    </fieldset>
  )
}
