import { useState } from 'react'
import { useMapShell } from '../contexts/MapShellContext'
import { MapFloatingControls } from '../components/MapFloatingControls'
import { TransportLegend } from '../components/TransportLegend'
import { WorldMap } from '../components/WorldMap'
import { YearOverlay } from '../components/YearOverlay'

export function MapPage() {
  const { loading, error, filteredMigrations, animation } = useMapShell()
  const [legendOpen, setLegendOpen] = useState(true)

  const count = filteredMigrations.length
  const mapAnimation = animation.animationActive
    ? {
        personMigrations: animation.personMigrations,
        stepIndex: animation.stepIndex,
        segmentProgress: animation.segmentProgress,
        phase: animation.phase,
        isComplete: animation.isComplete,
      }
    : null

  return (
    <div className="app__map-wrapper">
      <MapFloatingControls />
      {loading && <p className="app__status">Chargement de la carte…</p>}
      {error && <p className="app__status app__status--error">{error}</p>}
      {!loading && !error && count === 0 && (
        <p className="app__status">Aucun parcours sélectionné</p>
      )}
      {!loading && !error && count > 0 && (
        <WorldMap migrations={filteredMigrations} animation={mapAnimation} />
      )}
      {animation.animationActive && (
        <YearOverlay
          displayYear={animation.displayYear}
          previousYear={animation.previousYear}
          nextYear={animation.currentTiming?.nextYear ?? null}
          phase={animation.phase}
          stepIndex={animation.stepIndex}
          gapMessage={animation.gapMessage}
          gapProgress={animation.gapProgress}
          contextText={animation.contextText}
          arrivalPlace={animation.arrivalPlace}
          birthLabel={animation.birthLabel}
          deathLabel={animation.deathLabel}
          timelineSpan={animation.timelineSpan}
          animationActive={animation.animationActive}
          playing={animation.playing}
          isComplete={animation.isComplete}
          traveledDistanceKm={animation.traveledDistanceKm}
          totalDistanceKm={animation.totalDistanceKm}
          journeyCount={animation.journeyCount}
          visitedCities={animation.visitedCities}
          canAdvance={animation.canAdvance}
          onAdvance={animation.advancePhase}
          onPause={animation.pause}
        />
      )}
      {!animation.animationActive &&
        (legendOpen ? (
          <aside className="legend" aria-label="Légende">
            <button
              type="button"
              className="legend__toggle"
              onClick={() => setLegendOpen(false)}
              aria-label="Masquer la légende"
            >
              Masquer la légende
            </button>
            <p className="legend__title">Parcours migratoires</p>
            <p className="legend__count">
              {loading
                ? '…'
                : `${count} migration${count > 1 ? 's' : ''} affichée${count > 1 ? 's' : ''}`}
            </p>
            <TransportLegend />
            <p className="legend__hint">
              Cliquez sur une route ou un lieu pour plus de détails
            </p>
          </aside>
        ) : (
          <button
            type="button"
            className="legend__show-btn"
            onClick={() => setLegendOpen(true)}
            aria-label="Afficher la légende"
          >
            Afficher la légende
          </button>
        ))}
    </div>
  )
}
