import {
  animationAdvanceLabel,
  formatDistance,
  type AnimationPhase,
} from '../utils/journeyAnimation'

interface AnimationOverlayProps {
  personLabel: string | null
  personStory: string | null
  displayYear: number | null
  previousYear: number | null
  nextYear: number | null
  phase: AnimationPhase
  phaseLabel: string
  stepIndex: number
  totalSteps: number
  segmentProgress: number
  gapMessage: string | null
  gapProgress: number
  contextText: string | null
  arrivalPlace: string | null
  departurePlace: string | null
  routeSummary: string | null
  birthLabel: string | null
  deathLabel: string | null
  lifeTimelineSpan: { start: number | null; end: number | null }
  animationActive: boolean
  playing: boolean
  isComplete: boolean
  traveledDistanceKm: number
  totalDistanceKm: number
  segmentDistanceKm: number
  journeyCount: number
  visitedCities: string[]
  citiesSoFar: string[]
  canAdvance: boolean
  onAdvance: () => void
  onPause: () => void
}

function LifeTimeline({
  displayYear,
  span,
  variant = 'default',
}: {
  displayYear: number | null
  span: { start: number | null; end: number | null }
  variant?: 'default' | 'gap'
}) {
  const { start, end } = span
  if (start == null || end == null || start === end || displayYear == null) {
    return null
  }

  const position = Math.min(1, Math.max(0, (displayYear - start) / (end - start)))

  return (
    <div
      className={`anim-overlay__timeline${variant === 'gap' ? ' anim-overlay__timeline--gap' : ''}`}
      aria-label={`Position dans la vie : ${displayYear}, entre ${start} et ${end}`}
    >
      <span className="anim-overlay__timeline-label">{start}</span>
      <div className="anim-overlay__timeline-track">
        <div
          className="anim-overlay__timeline-fill"
          style={{ width: `${position * 100}%` }}
        />
        <div
          className="anim-overlay__timeline-marker"
          style={{ left: `${position * 100}%` }}
          aria-hidden
        />
      </div>
      <span className="anim-overlay__timeline-label">{end}</span>
    </div>
  )
}

function OverlayActions({
  playing,
  canAdvance,
  advanceLabel,
  onAdvance,
  onPause,
  variant = 'default',
}: {
  playing: boolean
  canAdvance: boolean
  advanceLabel: string
  onAdvance: () => void
  onPause: () => void
  variant?: 'default' | 'gap'
}) {
  return (
    <div
      className={`anim-overlay__actions${variant === 'gap' ? ' anim-overlay__actions--gap' : ''}`}
    >
      {playing && (
        <button
          type="button"
          className="anim-overlay__btn anim-overlay__btn--secondary"
          onClick={onPause}
          aria-label="Pause"
        >
          ⏸
        </button>
      )}
      <button
        type="button"
        className="anim-overlay__btn anim-overlay__btn--primary"
        onClick={onAdvance}
        disabled={!canAdvance}
        aria-label={advanceLabel}
      >
        {advanceLabel}
      </button>
    </div>
  )
}

function PhaseBody({
  phase,
  stepIndex,
  displayYear,
  previousYear,
  nextYear,
  gapMessage,
  gapProgress,
  contextText,
  arrivalPlace,
  departurePlace,
  routeSummary,
  birthLabel,
  personStory,
  segmentProgress,
  segmentDistanceKm,
  traveledDistanceKm,
}: {
  phase: AnimationPhase
  stepIndex: number
  displayYear: number | null
  previousYear: number | null
  nextYear: number | null
  gapMessage: string | null
  gapProgress: number
  contextText: string | null
  arrivalPlace: string | null
  departurePlace: string | null
  routeSummary: string | null
  birthLabel: string | null
  personStory: string | null
  segmentProgress: number
  segmentDistanceKm: number
  traveledDistanceKm: number
}) {
  const isIntro = phase === 'year-hold' && stepIndex === 0
  const segmentTraveledKm = segmentDistanceKm * segmentProgress

  if (phase === 'year-hold') {
    return (
      <>
        {displayYear != null && (
          <p className="anim-overlay__year anim-overlay__year--hero">{displayYear}</p>
        )}
        {departurePlace && (
          <p className="anim-overlay__place anim-overlay__place--departure">
            Départ · {departurePlace}
          </p>
        )}
        {isIntro && birthLabel && (
          <p className="anim-overlay__life">
            <span className="anim-overlay__life-label">Naissance</span> {birthLabel}
          </p>
        )}
        {(contextText || (isIntro && personStory)) && (
          <p className="anim-overlay__story">{contextText ?? personStory}</p>
        )}
        {!contextText && !personStory && !isIntro && (
          <p className="anim-overlay__hint">Préparation du départ</p>
        )}
      </>
    )
  }

  if (phase === 'traveling') {
    return (
      <>
        {displayYear != null && (
          <p className="anim-overlay__year anim-overlay__year--compact">{displayYear}</p>
        )}
        {routeSummary && (
          <p className="anim-overlay__route">{routeSummary}</p>
        )}
        <p className="anim-overlay__km anim-overlay__km--segment" aria-live="polite">
          {formatDistance(segmentTraveledKm)}
          {segmentDistanceKm > 0 && (
            <span className="anim-overlay__km-of">
              {' '}
              / {formatDistance(segmentDistanceKm)}
            </span>
          )}
        </p>
      </>
    )
  }

  if (phase === 'arrival-hold') {
    return (
      <>
        {displayYear != null && (
          <p className="anim-overlay__year anim-overlay__year--hero">{displayYear}</p>
        )}
        {arrivalPlace && (
          <p className="anim-overlay__place anim-overlay__place--arrival">{arrivalPlace}</p>
        )}
        {departurePlace && (
          <p className="anim-overlay__route anim-overlay__route--muted">
            depuis {departurePlace}
          </p>
        )}
      </>
    )
  }

  if (phase === 'gap') {
    return (
      <>
        <div className="anim-overlay__gap-years">
          {previousYear != null && (
            <span className="anim-overlay__gap-from">{previousYear}</span>
          )}
          {previousYear != null && (
            <span className="anim-overlay__gap-arrow" aria-hidden>
              →
            </span>
          )}
          {displayYear != null && (
            <span className="anim-overlay__year anim-overlay__year--gap">
              {displayYear}
            </span>
          )}
          {nextYear != null && nextYear !== displayYear && (
            <span className="anim-overlay__gap-to">{nextYear}</span>
          )}
        </div>
        {gapMessage && <p className="anim-overlay__gap-msg">{gapMessage}</p>}
        {previousYear != null && (
          <div
            className="anim-overlay__gap-bar"
            role="progressbar"
            aria-valuenow={Math.round(gapProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Écoulement du temps"
          >
            <div
              className="anim-overlay__gap-bar-fill"
              style={{ width: `${gapProgress * 100}%` }}
            />
          </div>
        )}
        <p className="anim-overlay__km anim-overlay__km--muted">
          {formatDistance(traveledDistanceKm)} parcourus au total
        </p>
      </>
    )
  }

  return null
}

export function AnimationOverlay({
  personLabel,
  personStory,
  displayYear,
  previousYear,
  nextYear,
  phase,
  phaseLabel,
  stepIndex,
  totalSteps,
  segmentProgress,
  gapMessage,
  gapProgress,
  contextText,
  arrivalPlace,
  departurePlace,
  routeSummary,
  birthLabel,
  deathLabel,
  lifeTimelineSpan,
  animationActive,
  playing,
  isComplete,
  traveledDistanceKm,
  totalDistanceKm,
  segmentDistanceKm,
  journeyCount,
  visitedCities,
  citiesSoFar,
  canAdvance,
  onAdvance,
  onPause,
}: AnimationOverlayProps) {
  if (!animationActive) return null

  const advanceLabel = animationAdvanceLabel(
    animationActive,
    playing,
    phase,
    isComplete,
  )

  const showActions = !isComplete
  const isGap = phase === 'gap'
  const isTravel = phase === 'traveling'

  if (isComplete) {
    return (
      <div
        className="anim-overlay anim-overlay--complete"
        aria-live="polite"
        aria-atomic="true"
      >
        <header className="anim-overlay__header">
          {personLabel && (
            <span className="anim-overlay__person">{personLabel}</span>
          )}
          <span className="anim-overlay__phase">Parcours terminé</span>
        </header>

        <main className="anim-overlay__body anim-overlay__body--fade">
          <div className="anim-overlay__summary">
            <p className="anim-overlay__summary-stat">
              <span className="anim-overlay__summary-value">{journeyCount}</span>
              <span className="anim-overlay__summary-label">
                trajet{journeyCount > 1 ? 's' : ''}
              </span>
            </p>
            <p className="anim-overlay__summary-stat">
              <span className="anim-overlay__summary-value">
                {formatDistance(totalDistanceKm)}
              </span>
              <span className="anim-overlay__summary-label">parcourus</span>
            </p>
          </div>
          {visitedCities.length > 0 && (
            <ol className="anim-overlay__cities" aria-label="Villes visitées">
              {visitedCities.map((city) => (
                <li key={city}>{city}</li>
              ))}
            </ol>
          )}
          {deathLabel && (
            <p className="anim-overlay__life anim-overlay__life--end">
              <span className="anim-overlay__life-label">Décès</span> {deathLabel}
            </p>
          )}
        </main>

        <footer className="anim-overlay__footer">
          <LifeTimeline
            displayYear={displayYear ?? lifeTimelineSpan.end}
            span={lifeTimelineSpan}
          />
        </footer>
      </div>
    )
  }

  if (displayYear == null && phase !== 'year-hold') return null

  return (
    <div
      className={`anim-overlay anim-overlay--${phase}${isTravel ? ' anim-overlay--travel' : ''}${isGap ? ' anim-overlay--gap' : ''}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <header className="anim-overlay__header">
        {personLabel && (
          <span className="anim-overlay__person">{personLabel}</span>
        )}
        <span className="anim-overlay__step">
          Étape {stepIndex + 1} / {totalSteps}
        </span>
        <span className="anim-overlay__phase">{phaseLabel}</span>
      </header>

      <main
        key={`${phase}-${stepIndex}`}
        className="anim-overlay__body anim-overlay__body--fade"
      >
        <PhaseBody
          phase={phase}
          stepIndex={stepIndex}
          displayYear={displayYear}
          previousYear={previousYear}
          nextYear={nextYear}
          gapMessage={gapMessage}
          gapProgress={gapProgress}
          contextText={contextText}
          arrivalPlace={arrivalPlace}
          departurePlace={departurePlace}
          routeSummary={routeSummary}
          birthLabel={birthLabel}
          personStory={personStory}
          segmentProgress={segmentProgress}
          segmentDistanceKm={segmentDistanceKm}
          traveledDistanceKm={traveledDistanceKm}
        />
        {citiesSoFar.length > 0 && phase !== 'gap' && (
          <p className="anim-overlay__cities-inline" aria-label="Villes atteintes">
            {citiesSoFar.join(' → ')}
          </p>
        )}
      </main>

      <footer className="anim-overlay__footer">
        <LifeTimeline
          displayYear={displayYear}
          span={lifeTimelineSpan}
          variant={isGap ? 'gap' : 'default'}
        />
        {!isGap && (
          <p className="anim-overlay__km anim-overlay__km--total" aria-live="polite">
            {formatDistance(traveledDistanceKm)} parcourus
          </p>
        )}
        {showActions && (
          <OverlayActions
            playing={playing}
            canAdvance={canAdvance}
            advanceLabel={advanceLabel}
            onAdvance={onAdvance}
            onPause={onPause}
            variant={isGap ? 'gap' : 'default'}
          />
        )}
      </footer>
    </div>
  )
}
