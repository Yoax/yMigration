import type { JourneyAnimationState } from '../hooks/useJourneyAnimation'
import {
  animationAdvanceLabel,
  formatDistance,
} from '../utils/journeyAnimation'
import { getTransportStyle } from '../utils/transport'

interface AnimationControlsProps {
  animation: JourneyAnimationState
  variant?: 'menu' | 'panel'
}

export function AnimationControls({
  animation,
  variant = 'panel',
}: AnimationControlsProps) {
  const {
    persons,
    personKey,
    personMigrations,
    stepIndex,
    segmentProgress,
    phase,
    playing,
    animationActive,
    isComplete,
    totalDistanceKm,
    canAdvance,
    currentMigration,
    currentTiming,
    displayYear,
    previousYear,
    gapMessage,
    gapProgress,
    contextText,
    arrivalPlace,
    birthLabel,
    deathLabel,
    timelineSpan,
    setPersonKey,
    advancePhase,
    pause,
    reset,
    stepBackward,
  } = animation

  const total = personMigrations.length
  const progressRatio =
    total > 0 ? (stepIndex + segmentProgress) / total : 0

  const displayStep = Math.min(
    total,
    isComplete ? total : Math.max(1, stepIndex + (segmentProgress > 0 ? 1 : 0)),
  )

  const nextLabel = animationAdvanceLabel(
    animationActive,
    playing,
    phase,
    isComplete,
  )
  const controlsOnMap = variant === 'menu' && animationActive && !isComplete

  const Tag = variant === 'menu' ? 'div' : 'aside'

  return (
    <Tag
      className={`animation-panel${variant === 'menu' ? ' animation-panel--menu' : ''}`}
      aria-label="Animation du parcours"
    >
      {variant === 'panel' && (
        <p className="animation-panel__title">Parcours animé</p>
      )}

      <label className="animation-panel__field">
        Personne
        <select
          value={personKey ?? ''}
          onChange={(e) => setPersonKey(e.target.value || null)}
        >
          <option value="">— Choisir —</option>
          {persons.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      {personKey && total === 0 && (
        <p className="animation-panel__hint">Aucun trajet pour cette personne</p>
      )}

      {personKey && total > 0 && (
        <>
          {controlsOnMap && (
            <p className="animation-panel__hint animation-panel__hint--on-map">
              L’animation se pilote depuis la carte.
            </p>
          )}

          {animationActive &&
            birthLabel &&
            stepIndex === 0 &&
            phase === 'year-hold' &&
            !controlsOnMap && (
              <p className="animation-panel__life">
                <span className="animation-panel__life-label">Naissance</span>{' '}
                {birthLabel}
              </p>
            )}

          {isComplete && deathLabel && !controlsOnMap && (
            <p className="animation-panel__life">
              <span className="animation-panel__life-label">Décès</span>{' '}
              {deathLabel}
            </p>
          )}

          {timelineSpan.start != null && timelineSpan.end != null && !controlsOnMap && (
            <p className="animation-panel__timeline" aria-hidden>
              Période {timelineSpan.start} — {timelineSpan.end}
            </p>
          )}

          {animationActive && displayYear != null && !controlsOnMap && (
            <div
              className={`animation-panel__year${phase === 'gap' ? ' animation-panel__year--gap' : ''}`}
              aria-live="polite"
            >
              {phase === 'gap' && previousYear != null && (
                <span className="animation-panel__year-from">
                  {previousYear} →{' '}
                </span>
              )}
              {displayYear}
              {gapMessage && (
                <span className="animation-panel__year-gap">{gapMessage}</span>
              )}
              {phase === 'gap' && (
                <div
                  className="animation-panel__gap-bar"
                  style={{ width: `${gapProgress * 100}%` }}
                />
              )}
            </div>
          )}

          {animationActive && contextText && phase === 'year-hold' && !controlsOnMap && (
            <p className="animation-panel__story">{contextText}</p>
          )}

          {animationActive && arrivalPlace && phase === 'arrival-hold' && !controlsOnMap && (
            <p className="animation-panel__arrival">{arrivalPlace}</p>
          )}

          {!controlsOnMap && (
            <>
              <div className="animation-panel__progress" aria-live="polite">
                <span className="animation-panel__step">
                  Étape {displayStep} / {total}
                </span>
                {currentMigration && !isComplete && (
                  <span className="animation-panel__detail">
                    {currentMigration.from.name} → {currentMigration.to.name}
                    {currentMigration.transport && (
                      <> · {getTransportStyle(currentMigration.transport).icon}</>
                    )}
                    {currentTiming && (
                      <> · {formatDistance(currentTiming.distanceKm)}</>
                    )}
                  </span>
                )}
                {isComplete && (
                  <span className="animation-panel__detail">
                    Parcours terminé
                    {totalDistanceKm > 0 && (
                      <> · {formatDistance(totalDistanceKm)} parcourus</>
                    )}
                  </span>
                )}
              </div>

              <div
                className="animation-panel__bar"
                role="progressbar"
                aria-valuenow={displayStep}
                aria-valuemin={0}
                aria-valuemax={total}
              >
                <div
                  className="animation-panel__bar-fill"
                  style={{ width: `${progressRatio * 100}%` }}
                />
              </div>
            </>
          )}

          {!controlsOnMap && (
            <div className="animation-panel__actions">
            <button
              type="button"
              className="animation-panel__btn"
              onClick={reset}
              title="Recommencer"
              aria-label="Recommencer"
            >
              ↺
            </button>
            <button
              type="button"
              className="animation-panel__btn"
              onClick={stepBackward}
              disabled={!animationActive && stepIndex === 0}
              title="Étape précédente"
              aria-label="Étape précédente"
            >
              ←
            </button>
            {playing && (
              <button
                type="button"
                className="animation-panel__btn"
                onClick={pause}
                title="Pause"
                aria-label="Pause"
              >
                ⏸
              </button>
            )}
            <button
              type="button"
              className="animation-panel__btn animation-panel__btn--primary animation-panel__btn--advance"
              onClick={advancePhase}
              disabled={animationActive ? !canAdvance : false}
              title={nextLabel}
              aria-label={nextLabel}
            >
              {nextLabel}
            </button>
            </div>
          )}

          {!animationActive && (
            <p className="animation-panel__hint">
              Cliquez sur « Commencer » pour afficher le premier trajet sur la carte.
            </p>
          )}
          {animationActive && !playing && !isComplete && phase !== 'traveling' && !controlsOnMap && (
            <p className="animation-panel__hint">
              Avancez manuellement à chaque étape du parcours.
            </p>
          )}
        </>
      )}

      {!personKey && (
        <p className="animation-panel__hint">
          Sélectionnez une personne pour voir son parcours se dessiner étape par étape
        </p>
      )}
    </Tag>
  )
}
