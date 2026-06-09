import { useEffect, useId, useRef, useState } from 'react'
import { useMapShell } from '../contexts/MapShellContext'
import { PersonFilter } from './PersonFilter'

export function PersonFilterMenu() {
  const { persons, selected, setSelected } = useMapShell()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  if (persons.length === 0) return null

  const label =
    selected.size === persons.length
      ? 'Personnes'
      : `Personnes (${selected.size}/${persons.length})`

  return (
    <div className="header-menu" ref={rootRef}>
      <button
        type="button"
        className={`app__nav-link header-menu__trigger${open ? ' header-menu__trigger--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
      >
        {label}
        <span className="header-menu__chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div className="header-menu__dropdown" id={menuId} role="menu">
          <PersonFilter
            persons={persons}
            selected={selected}
            onChange={setSelected}
            variant="menu"
          />
        </div>
      )}
    </div>
  )
}
