import {
  animationAdvanceLabel,
  formatDistance,
  type AnimationPhase,
} from '../utils/journeyAnimation'

interface YearOverlayProps {
  displayYear: number | null
  previousYear: number | null
  nextYear: number | null
  phase: AnimationPhase
  stepIndex: number
  gapMessage: string | null
  gapProgress: number
  contextText: string | null
  arrivalPlace: string | null
  birthLabel: string | null
  deathLabel: string | null
  timelineSpan: { start: number | null; end: number | null }
  animationActive: boolean
  playing: boolean
  isComplete: boolean
  traveledDistanceKm: number
  totalDistanceKm: number
  journeyCount: number
  visitedCities: string[]
  canAdvance: boolean
  onAdvance: () => void
  onPause: () => void
}

export function YearOverlay({
  displayYear,
  previousYear,
  nextYear,
  phase,
  stepIndex,
  gapMessage,
  gapProgress,
  contextText,
  arrivalPlace,
  birthLabel,
  deathLabel,
  timelineSpan,
  animationActive,
  playing,
  isComplete,
  traveledDistanceKm,
  totalDistanceKm,
  journeyCount,
  visitedCities,
  canAdvance,
  onAdvance,
  onPause,
}: YearOverlayProps) {
  if (!animationActive) return null

  const advanceLabel = animationAdvanceLabel(
    animationActive,
    playing,
    phase,
    isComplete,
  )

  const showActions = animationActive && !isComplete
  const isTraveling = phase === 'traveling'
  const actionsInTravelBar = isTraveling

  const actions = showActions ? (
    <div
      className={`year-overlay__actions${actionsInTravelBar ? ' year-overlay__actions--travel' : ''}`}
    >
      {playing && (
        <button
          type="button"
          className="year-overlay__btn year-overlay__btn--secondary"
          onClick={onPause}
          aria-label="Pause"
        >
          ⏸
        </button>
      )}
      <button
        type="button"
        className="year-overlay__btn year-overlay__btn--primary"
        onClick={onAdvance}
        disabled={!canAdvance}
        aria-label={advanceLabel}
      >
        {advanceLabel}
      </button>
    </div>
  ) : null

  if (isComplete) {
    return (
      <>
        <div
          className="year-overlay year-overlay--complete"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="year-overlay__summary-stat">
            <span className="year-overlay__summary-value">{journeyCount}</span>
            <span className="year-overlay__summary-label">
              trajet{journeyCount > 1 ? 's' : ''}
            </span>
          </p>
          <p className="year-overlay__summary-stat">
            <span className="year-overlay__summary-value">
              {formatDistance(totalDistanceKm)}
            </span>
            <span className="year-overlay__summary-label">parcourus</span>
          </p>
          {visitedCities.length > 0 && (
            <ul className="year-overlay__cities">
              {visitedCities.map((city) => (
                <li key={city}>{city}</li>
              ))}
            </ul>
          )}
        </div>
        {deathLabel && (
          <p className="year-overlay__life-end">
            <span className="year-overlay__life-label">Décès</span> {deathLabel}
          </p>
        )}
      </>
    )
  }

  if (displayYear == null) return null

  const isGap = phase === 'gap'
  const isYearHold = phase === 'year-hold'
  const isArrivalHold = phase === 'arrival-hold'
  const showBirth = isYearHold && stepIndex === 0 && birthLabel

  const { start, end } = timelineSpan
  const timelinePosition =
    start != null && end != null && end > start
      ? Math.min(1, Math.max(0, (displayYear - start) / (end - start)))
      : null

  return (
    <>
      <div
        className={`year-overlay${isGap ? ' year-overlay--gap' : ''}${isYearHold ? ' year-overlay--hold' : ''}${isArrivalHold ? ' year-overlay--arrival' : ''}${isTraveling ? ' year-overlay--travel' : ''}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {isGap && previousYear != null && (
          <span className="year-overlay__from">{previousYear}</span>
        )}
        {isGap && previousYear != null && (
          <span className="year-overlay__arrow" aria-hidden>
            →
          </span>
        )}
        <span
          className={`year-overlay__year${isGap ? ' year-overlay__year--counting' : ''}`}
        >
          {displayYear}
        </span>
        {isGap && nextYear != null && nextYear !== displayYear && (
          <span className="year-overlay__to">{nextYear}</span>
        )}
        {gapMessage && (
          <span className="year-overlay__gap">{gapMessage}</span>
        )}
        {isGap && previousYear != null && timelineSpan.end != null && (
          <div
            className="year-overlay__gap-bar"
            role="progressbar"
            aria-valuenow={Math.round(gapProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Écoulement du temps"
          >
            <div
              className="year-overlay__gap-bar-fill"
              style={{ width: `${gapProgress * 100}%` }}
            />
          </div>
        )}
        {start != null && end != null && start !== end && timelinePosition != null && (
          <div className="year-overlay__timeline" aria-hidden>
            <span className="year-overlay__timeline-label">{start}</span>
            <div className="year-overlay__timeline-track">
              <div
                className="year-overlay__timeline-fill"
                style={{ width: `${timelinePosition * 100}%` }}
              />
              <div
                className="year-overlay__timeline-marker"
                style={{ left: `${timelinePosition * 100}%` }}
              />
            </div>
            <span className="year-overlay__timeline-label">{end}</span>
          </div>
        )}
        <p className="year-overlay__distance" aria-live="polite">
          {formatDistance(traveledDistanceKm)} parcourus
        </p>
        {showBirth && (
          <p className="year-overlay__life-start">
            <span className="year-overlay__life-label">Naissance</span>{' '}
            {birthLabel}
          </p>
        )}
        {contextText && isYearHold && (
          <p className="year-overlay__story">{contextText}</p>
        )}
        {isArrivalHold && arrivalPlace && (
          <p className="year-overlay__arrival">{arrivalPlace}</p>
        )}
        {isYearHold && !contextText && !gapMessage && !showBirth && (
          <span className="year-overlay__hint">Départ du trajet</span>
        )}
        {!actionsInTravelBar && actions}
      </div>
      {actionsInTravelBar && actions}
    </>
  )
}
