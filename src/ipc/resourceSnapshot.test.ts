import { describe, expect, it } from 'vitest'
import {
  emptyTurnResourcePeak,
  finalizeTurnResourceStats,
  formatAvgPeakPct,
  formatResourcePct,
  formatResourceOverlayLine,
  hasTurnResourcePeak,
  mergeSnapshotIntoPeak,
  resourceOverlayRows,
} from './resourceSnapshot'

const sample = {
  cpuPct: 16,
  memUsedMb: 48555,
  memTotalMb: 65536,
  memPct: 74,
  gpuPct: null as number | null,
  scope: 'system',
}

describe('resourceSnapshot', () => {
  it('builds stacked rows with GPU dash when unknown', () => {
    const rows = resourceOverlayRows(sample, true)
    expect(rows.map((r) => r.label)).toEqual(['CPU', 'RAM', 'GPU'])
    expect(rows[0].value).toBe('16%')
    expect(rows[1].value).toBe('74%')
    expect(rows[2].value).toBe('—')
  })

  it('includes GPU percent when present', () => {
    const rows = resourceOverlayRows({ ...sample, gpuPct: 42 }, true)
    expect(rows[2].value).toBe('42%')
  })

  it('formatResourceOverlayLine joins rows', () => {
    expect(formatResourceOverlayLine(sample, true)).toContain('16%')
    expect(formatResourceOverlayLine(sample, true)).toContain('GPU')
  })

  it('tracks per-turn avg and peak across polls', () => {
    let peak = emptyTurnResourcePeak()
    expect(hasTurnResourcePeak(peak)).toBe(false)
    peak = mergeSnapshotIntoPeak(peak, { ...sample, cpuPct: 10, memPct: 50 })
    peak = mergeSnapshotIntoPeak(peak, { ...sample, cpuPct: 99, memPct: 80, gpuPct: 55 })
    expect(hasTurnResourcePeak(peak)).toBe(true)
    expect(peak.peakCpuPct).toBe(99)
    expect(peak.peakMemPct).toBe(80)
    expect(peak.peakGpuPct).toBe(55)
    expect(peak.sampleCount).toBe(2)

    const stats = finalizeTurnResourceStats(peak)
    expect(stats?.avgCpuPct).toBe(54.5)
    expect(stats?.avgMemPct).toBe(65)
    expect(stats?.avgGpuPct).toBe(55)
    expect(formatAvgPeakPct(stats?.avgCpuPct, stats?.peakCpuPct)).toBe('55 / 99%')
    expect(formatResourcePct(stats?.avgCpuPct, stats?.peakCpuPct, 'avgPeak')).toBe('55 / 99%')
    expect(formatResourcePct(stats?.avgCpuPct, stats?.peakCpuPct, 'avg')).toBe('55%')
    expect(formatResourcePct(stats?.avgCpuPct, stats?.peakCpuPct, 'peak')).toBe('99%')
  })
})
