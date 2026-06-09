import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Migration } from '../types/migration'
import { formatLifeEvent } from '../types/person'
import {
  animationContextText,
  buildSegmentTimeline,
  collectVisitedCities,
  computeTraveledDistanceKm,
  extractPersons,
  interpolateYear,
  migrationsForPerson,
  personTimelineSpan,
  sortMigrationsByYear,
  type AnimationPhase,
  type PersonOption,
  type SegmentTiming,
} from '../utils/journeyAnimation'

export interface JourneyAnimationState {
  persons: PersonOption[]
  personKey: string | null
  personMigrations: Migration[]
  timeline: SegmentTiming[]
  stepIndex: number
  segmentProgress: number
  gapProgress: number
  phase: AnimationPhase
  playing: boolean
  animationActive: boolean
  isComplete: boolean
  totalDistanceKm: number
  traveledDistanceKm: number
  visitedCities: string[]
  journeyCount: number
  canAdvance: boolean
  currentMigration: Migration | null
  currentTiming: SegmentTiming | null
  displayYear: number | null
  previousYear: number | null
  gapMessage: string | null
  personStory: string | null
  timelineSpan: { start: number | null; end: number | null }
  contextText: string | null
  arrivalPlace: string | null
  birthLabel: string | null
  deathLabel: string | null
  setPersonKey: (key: string | null) => void
  advancePhase: () => void
  pause: () => void
  reset: () => void
  stepBackward: () => void
}

interface AnimRef {
  stepIndex: number
  progress: number
  phase: AnimationPhase
  phaseStartedAt: number
  gapProgress: number
}

function initialAnimRef(): AnimRef {
  return {
    stepIndex: 0,
    progress: 0,
    phase: 'year-hold',
    phaseStartedAt: 0,
    gapProgress: 0,
  }
}

export function useJourneyAnimation(
  migrations: Migration[],
): JourneyAnimationState {
  const persons = useMemo(() => extractPersons(migrations), [migrations])
  const [personKey, setPersonKeyState] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [segmentProgress, setSegmentProgress] = useState(0)
  const [gapProgress, setGapProgress] = useState(0)
  const [phase, setPhase] = useState<AnimationPhase>('year-hold')
  const [playing, setPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef<number | null>(null)
  const animRef = useRef<AnimRef>(initialAnimRef())

  const personMigrations = useMemo(() => {
    if (!personKey) return []
    return sortMigrationsByYear(migrationsForPerson(migrations, personKey))
  }, [migrations, personKey])

  const timeline = useMemo(
    () => buildSegmentTimeline(personMigrations),
    [personMigrations],
  )

  const personStory = personMigrations[0]?.personStory ?? null

  const timelineSpan = useMemo(
    () => personTimelineSpan(personMigrations),
    [personMigrations],
  )

  const journeyCount = personMigrations.length

  const visitedCities = useMemo(
    () => collectVisitedCities(personMigrations),
    [personMigrations],
  )

  const totalDistanceKm = useMemo(
    () => timeline.reduce((sum, segment) => sum + segment.distanceKm, 0),
    [timeline],
  )

  const traveledDistanceKm = useMemo(
    () =>
      computeTraveledDistanceKm(timeline, stepIndex, segmentProgress, phase),
    [timeline, stepIndex, segmentProgress, phase],
  )

  const isComplete =
    hasStarted &&
    timeline.length > 0 &&
    animRef.current.stepIndex >= timeline.length - 1 &&
    animRef.current.progress >= 1 &&
    animRef.current.phase === 'traveling'

  const animationActive =
    hasStarted && personKey != null && personMigrations.length > 0

  const canAdvance =
    personKey != null &&
    timeline.length > 0 &&
    !playing &&
    !isComplete

  const currentTiming =
    timeline.length > 0 && stepIndex < timeline.length
      ? timeline[stepIndex]
      : null

  const currentMigration = currentTiming?.migration ?? null

  const displayYear = useMemo(() => {
    if (!currentTiming) return null
    if (
      phase === 'gap' &&
      currentTiming.year != null &&
      currentTiming.nextYear != null
    ) {
      return interpolateYear(
        currentTiming.year,
        currentTiming.nextYear,
        gapProgress,
      )
    }
    return currentTiming.year
  }, [currentTiming, phase, gapProgress])

  const previousYear = useMemo(() => {
    if (phase !== 'gap' || !currentTiming) return null
    return currentTiming.year
  }, [currentTiming, phase])

  const gapMessage = phase === 'gap' ? (currentTiming?.gapLabel ?? null) : null

  const contextText = useMemo(
    () =>
      animationContextText(phase, currentMigration, personStory, stepIndex),
    [phase, currentMigration, personStory, stepIndex],
  )

  const arrivalPlace =
    phase === 'arrival-hold' ? (currentMigration?.to.name ?? null) : null

  const personProfile = personMigrations[0]

  const birthLabel = useMemo(() => {
    if (!personProfile?.personBirth) return null
    return formatLifeEvent(
      personProfile.personBirth.year,
      personProfile.personBirth.placeName,
    )
  }, [personProfile])

  const deathLabel = useMemo(() => {
    if (!personProfile?.personDeath) return null
    return formatLifeEvent(
      personProfile.personDeath.year,
      personProfile.personDeath.placeName,
    )
  }, [personProfile])

  const syncState = useCallback(() => {
    setStepIndex(animRef.current.stepIndex)
    setSegmentProgress(animRef.current.progress)
    setGapProgress(animRef.current.gapProgress)
    setPhase(animRef.current.phase)
  }, [])

  const beginYearHold = useCallback(
    (step: number) => {
      animRef.current = {
        stepIndex: step,
        progress: 0,
        phase: 'year-hold',
        phaseStartedAt: 0,
        gapProgress: 0,
      }
      syncState()
    },
    [syncState],
  )

  const setPersonKey = useCallback((key: string | null) => {
    setPersonKeyState(key)
    animRef.current = initialAnimRef()
    setStepIndex(0)
    setSegmentProgress(0)
    setGapProgress(0)
    setPhase('year-hold')
    setPlaying(false)
    setHasStarted(false)
  }, [])

  const reset = useCallback(() => {
    animRef.current = initialAnimRef()
    setStepIndex(0)
    setSegmentProgress(0)
    setGapProgress(0)
    setPhase('year-hold')
    setPlaying(false)
    setHasStarted(false)
  }, [])

  const pause = useCallback(() => {
    setPlaying(false)
  }, [])

  const advancePhase = useCallback(() => {
    if (!personKey || timeline.length === 0 || playing) return

    if (!hasStarted) {
      setHasStarted(true)
      return
    }

    setPlaying(false)

    const state = animRef.current
    const timing = timeline[state.stepIndex]
    if (!timing) return

    const now = performance.now()

    if (state.phase === 'year-hold') {
      animRef.current = {
        ...state,
        phase: 'traveling',
        progress: 0,
        phaseStartedAt: now,
      }
      syncState()
      setPlaying(true)
      return
    }

    if (state.phase === 'traveling') {
      animRef.current = {
        ...state,
        progress: 1,
        phase: 'arrival-hold',
        phaseStartedAt: now,
      }
      syncState()
      return
    }

    if (state.phase === 'arrival-hold') {
      if (state.stepIndex >= timeline.length - 1) {
        animRef.current = {
          stepIndex: state.stepIndex,
          progress: 1,
          phase: 'traveling',
          phaseStartedAt: now,
          gapProgress: 0,
        }
        syncState()
        return
      }

      if (timing.gapLabel && timing.nextYear != null) {
        animRef.current = {
          ...state,
          progress: 1,
          phase: 'gap',
          phaseStartedAt: now,
          gapProgress: 1,
        }
      } else {
        beginYearHold(state.stepIndex + 1)
      }
      syncState()
      return
    }

    if (state.phase === 'gap') {
      beginYearHold(state.stepIndex + 1)
    }
  }, [personKey, timeline, playing, hasStarted, syncState, beginYearHold])

  const stepBackward = useCallback(() => {
    if (!personKey || timeline.length === 0) return
    setPlaying(false)

    const { stepIndex: i } = animRef.current
    if (i > 0) {
      beginYearHold(i - 1)
    } else {
      setHasStarted(false)
      animRef.current = initialAnimRef()
      syncState()
    }
  }, [personKey, timeline.length, beginYearHold, syncState])

  useEffect(() => {
    animRef.current = initialAnimRef()
    setStepIndex(0)
    setSegmentProgress(0)
    setGapProgress(0)
    setPhase('year-hold')
    setHasStarted(false)
    setPlaying(false)
  }, [personKey])

  useEffect(() => {
    if (!playing || !personKey || timeline.length === 0) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastTickRef.current = null
      return
    }

    const tick = (now: number) => {
      const state = animRef.current
      if (state.phase !== 'traveling') {
        setPlaying(false)
        return
      }

      const timing = timeline[state.stepIndex]
      if (!timing) {
        setPlaying(false)
        return
      }

      if (lastTickRef.current == null) {
        lastTickRef.current = now
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const delta = now - lastTickRef.current
      lastTickRef.current = now

      const nextProgress = state.progress + delta / timing.travelDurationMs

      if (nextProgress < 1) {
        animRef.current = { ...state, progress: nextProgress }
        syncState()
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      animRef.current = {
        stepIndex: state.stepIndex,
        progress: 1,
        phase: 'arrival-hold',
        phaseStartedAt: now,
        gapProgress: 0,
      }
      syncState()
      setPlaying(false)
      lastTickRef.current = null
    }

    lastTickRef.current = null
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [playing, personKey, timeline, syncState])

  return {
    persons,
    personKey,
    personMigrations,
    timeline,
    stepIndex,
    segmentProgress,
    gapProgress,
    phase,
    playing,
    animationActive,
    isComplete,
    totalDistanceKm,
    traveledDistanceKm,
    visitedCities,
    journeyCount,
    canAdvance,
    currentMigration,
    currentTiming,
    displayYear,
    previousYear,
    gapMessage,
    personStory,
    timelineSpan,
    contextText,
    arrivalPlace,
    birthLabel,
    deathLabel,
    setPersonKey,
    advancePhase,
    pause,
    reset,
    stepBackward,
  }
}
