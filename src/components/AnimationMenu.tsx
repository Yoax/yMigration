import { useEffect, useId, useRef, useState } from 'react'
import { useMapShell } from '../contexts/MapShellContext'
import { AnimationControls } from './AnimationControls'

export function AnimationMenu() {
  const { animation } = useMapShell()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  const { playing, animationActive, isComplete, phase } = animation
  const menuLocked = animationActive && !isComplete

  const label = playing
    ? 'Animation ▶'
    : isComplete
      ? 'Parcours terminé'
      : animationActive
        ? phase === 'year-hold'
          ? 'Parcours animé'
          : 'Parcours animé…'
        : 'Parcours animé'

  useEffect(() => {
    if (menuLocked) setOpen(false)
  }, [menuLocked])

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

  function handleToggle() {
    if (menuLocked) return
    setOpen((v) => !v)
  }

  return (
    <div className="header-menu" ref={rootRef}>
      <button
        type="button"
        className={`app__nav-link header-menu__trigger${open ? ' header-menu__trigger--open' : ''}${playing || animationActive ? ' header-menu__trigger--active' : ''}${menuLocked ? ' header-menu__trigger--locked' : ''}`}
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        title={
          menuLocked
            ? 'Contrôles disponibles sur la carte pendant l’animation'
            : undefined
        }
      >
        {label}
        {!menuLocked && (
          <span className="header-menu__chevron" aria-hidden>
            ▾
          </span>
        )}
      </button>
      {open && !menuLocked && (
        <div className="header-menu__dropdown" id={menuId} role="dialog">
          <AnimationControls animation={animation} variant="menu" />
        </div>
      )}
    </div>
  )
}
