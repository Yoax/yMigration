import type { PersonOption } from '../utils/journeyAnimation'

interface PersonFilterProps {
  persons: PersonOption[]
  selected: Set<string>
  onChange: (selected: Set<string>) => void
  variant?: 'menu' | 'panel'
}

export function PersonFilter({
  persons,
  selected,
  onChange,
  variant = 'panel',
}: PersonFilterProps) {
  function toggle(key: string) {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange(next)
  }

  function selectAll() {
    onChange(new Set(persons.map((p) => p.key)))
  }

  function selectNone() {
    onChange(new Set())
  }

  if (persons.length === 0) return null

  const allSelected = selected.size === persons.length
  const noneSelected = selected.size === 0

  return (
    <div
      className={`person-filter${variant === 'menu' ? ' person-filter--menu' : ''}`}
    >
      <div className="person-filter__header">
        <span className="person-filter__title">Afficher sur la carte</span>
        <span className="person-filter__actions">
          <button
            type="button"
            className="person-filter__link"
            onClick={selectAll}
            disabled={allSelected}
          >
            Tout
          </button>
          <span aria-hidden> · </span>
          <button
            type="button"
            className="person-filter__link"
            onClick={selectNone}
            disabled={noneSelected}
          >
            Aucun
          </button>
        </span>
      </div>
      <ul className="person-filter__list">
        {persons.map((person) => (
          <li key={person.key}>
            <label className="person-filter__item">
              <input
                type="checkbox"
                checked={selected.has(person.key)}
                onChange={() => toggle(person.key)}
              />
              <span>{person.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
