import { useCallback, useEffect, useRef } from 'react'
import {
  emptyTurnResourcePeak,
  fetchResourceSnapshot,
  finalizeTurnResourceStats,
  mergeSnapshotIntoPeak,
  type TurnResourceAccumulator,
  type TurnResourceStats,
} from '../ipc/resourceSnapshot'
import { isTauriRuntime } from '../ipc/isTauri'

/**
 * Poll system CPU/RAM/GPU while a chat turn is active; keep per-turn avg + peak for stats history.
 */
export function useTurnResourcePeak(
  sampling: boolean,
  pollIntervalSec: number
): {
  resetPeak: () => void
  takePeak: () => TurnResourceStats | undefined
} {
  const peakRef = useRef<TurnResourceAccumulator>(emptyTurnResourcePeak())

  const resetPeak = useCallback(() => {
    peakRef.current = emptyTurnResourcePeak()
  }, [])

  const takePeak = useCallback((): TurnResourceStats | undefined => {
    const stats = finalizeTurnResourceStats(peakRef.current)
    peakRef.current = emptyTurnResourcePeak()
    return stats
  }, [])

  useEffect(() => {
    if (!sampling || !isTauriRuntime()) return

    const poll = async () => {
      const snapshot = await fetchResourceSnapshot()
      if (snapshot) {
        peakRef.current = mergeSnapshotIntoPeak(peakRef.current, snapshot)
      }
    }

    void poll()
    const ms = Math.min(10_000, Math.max(500, pollIntervalSec * 1000))
    const id = window.setInterval(() => void poll(), ms)
    return () => window.clearInterval(id)
  }, [sampling, pollIntervalSec])

  return { resetPeak, takePeak }
}
