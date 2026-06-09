import type { Migration } from '../types/migration'
import { getTransportStyle } from '../utils/transport'

interface MigrationPopupProps {
  migration: Migration
}

export function MigrationPopup({ migration }: MigrationPopupProps) {
  const { label, year, from, to, notes, transport } = migration
  const transportStyle = getTransportStyle(transport)

  return (
    <div className="migration-popup">
      {label && <strong className="migration-popup__label">{label}</strong>}
      {year != null && (
        <p className="migration-popup__year">{year}</p>
      )}
      <p className="migration-popup__route">
        {from.name} → {to.name}
      </p>
      {transport && (
        <p
          className="migration-popup__transport"
          style={{ color: transportStyle.color }}
        >
          <span className="migration-popup__transport-icon" aria-hidden>
            {transportStyle.icon}
          </span>
          {transportStyle.label}
        </p>
      )}
      {notes && <p className="migration-popup__notes">{notes}</p>}
    </div>
  )
}
