import { useRef } from 'react'
import {
  etaCompletionFraction,
  monotonicEtaCompletionPercent,
  type TurnEtaEstimate,
} from '../utils/turnEtaEstimate'

/** Determinate 0–100 ETA bar value; null when ETA label is hidden. */
export function useMonotonicEtaProgress(
  eta: TurnEtaEstimate | null | undefined,
  elapsedMs: number
): number | null {
  const maxFractionRef = useRef(0)

  const fraction = eta != null ? etaCompletionFraction(eta, elapsedMs) : null

  if (fraction == null) {
    maxFractionRef.current = 0
    return null
  }

  const { percent, maxFraction } = monotonicEtaCompletionPercent(
    maxFractionRef.current,
    fraction
  )
  maxFractionRef.current = maxFraction
  return percent
}
