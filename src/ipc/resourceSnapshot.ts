import { invoke } from '@tauri-apps/api/core'
import { isTauriRuntime } from './isTauri'

export interface ResourceSnapshot {
  cpuPct: number
  memUsedMb: number
  memTotalMb: number
  memPct: number
  gpuPct: number | null
  /** `nvidia-smi` | `macos-ioreg` when GPU % is available */
  gpuSource?: string | null
  scope: string
}

/** Running max + sums while polling during an active chat turn. */
export interface TurnResourceAccumulator {
  peakCpuPct: number
  peakMemPct: number
  peakGpuPct: number | null
  sumCpuPct: number
  sumMemPct: number
  sumGpuPct: number
  gpuSampleCount: number
  sampleCount: number
}

/** Finalized per-turn CPU/RAM/GPU stats for timing history. */
export interface TurnResourceStats {
  peakCpuPct: number
  peakMemPct: number
  peakGpuPct: number | null
  avgCpuPct: number
  avgMemPct: number
  avgGpuPct: number | null
  sampleCount: number
}

/** @deprecated Use TurnResourceAccumulator */
export type TurnResourcePeak = TurnResourceAccumulator

export function emptyTurnResourcePeak(): TurnResourceAccumulator {
  return {
    peakCpuPct: 0,
    peakMemPct: 0,
    peakGpuPct: null,
    sumCpuPct: 0,
    sumMemPct: 0,
    sumGpuPct: 0,
    gpuSampleCount: 0,
    sampleCount: 0,
  }
}

export function hasTurnResourcePeak(accum: TurnResourceAccumulator): boolean {
  return accum.sampleCount > 0
}

export function hasTurnResourceStats(stats: TurnResourceStats): boolean {
  return stats.sampleCount > 0
}

export function mergeSnapshotIntoPeak(
  peak: TurnResourceAccumulator,
  snapshot: ResourceSnapshot
): TurnResourceAccumulator {
  const gpuPct = snapshot.gpuPct
  return {
    peakCpuPct: Math.max(peak.peakCpuPct, snapshot.cpuPct),
    peakMemPct: Math.max(peak.peakMemPct, snapshot.memPct),
    peakGpuPct:
      gpuPct != null ? Math.max(peak.peakGpuPct ?? 0, gpuPct) : peak.peakGpuPct,
    sumCpuPct: peak.sumCpuPct + snapshot.cpuPct,
    sumMemPct: peak.sumMemPct + snapshot.memPct,
    sumGpuPct: peak.sumGpuPct + (gpuPct ?? 0),
    gpuSampleCount: peak.gpuSampleCount + (gpuPct != null ? 1 : 0),
    sampleCount: peak.sampleCount + 1,
  }
}

export function finalizeTurnResourceStats(
  accum: TurnResourceAccumulator
): TurnResourceStats | undefined {
  if (accum.sampleCount <= 0) return undefined
  const n = accum.sampleCount
  return {
    peakCpuPct: accum.peakCpuPct,
    peakMemPct: accum.peakMemPct,
    peakGpuPct: accum.peakGpuPct,
    avgCpuPct: accum.sumCpuPct / n,
    avgMemPct: accum.sumMemPct / n,
    avgGpuPct:
      accum.gpuSampleCount > 0 ? accum.sumGpuPct / accum.gpuSampleCount : null,
    sampleCount: n,
  }
}

export function formatPeakPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return `${Math.round(n)}%`
}

/** Compact `avg / peak` for timing history cells. */
export function formatAvgPeakPct(
  avg: number | null | undefined,
  peak: number | null | undefined
): string {
  const a = avg != null && Number.isFinite(avg) ? Math.round(avg) : null
  const p = peak != null && Number.isFinite(peak) ? Math.round(peak) : null
  if (a == null && p == null) return '—'
  if (a == null) return `${p}%`
  if (p == null) return `${a}%`
  return `${a} / ${p}%`
}

export type ResourcePctDisplay = 'avgPeak' | 'peak' | 'avg'

/** Format CPU/RAM/GPU cell per Settings display mode. */
export function formatResourcePct(
  avg: number | null | undefined,
  peak: number | null | undefined,
  mode: ResourcePctDisplay
): string {
  if (mode === 'avgPeak') return formatAvgPeakPct(avg, peak)
  if (mode === 'peak') return formatPeakPct(peak)
  return formatPeakPct(avg)
}

export interface ResourceOverlayRow {
  id: 'cpu' | 'ram' | 'gpu'
  label: string
  value: string
  title?: string
}

export async function fetchResourceSnapshot(): Promise<ResourceSnapshot | null> {
  if (!isTauriRuntime()) return null
  try {
    return await invoke<ResourceSnapshot>('get_resource_snapshot')
  } catch {
    return null
  }
}

/** One-line summary (tests / wide layouts). */
export function formatResourceOverlayLine(s: ResourceSnapshot, showGpu: boolean): string {
  return resourceOverlayRows(s, showGpu)
    .map((r) => `${r.value} ${r.label}`.trim())
    .join(' · ')
}

/** Stacked rows for the narrow nav rail — avoids awkward mid-string wraps. */
export function resourceOverlayRows(
  s: ResourceSnapshot,
  showGpu: boolean
): ResourceOverlayRow[] {
  const rows: ResourceOverlayRow[] = [
    { id: 'cpu', label: 'CPU', value: `${s.cpuPct.toFixed(0)}%` },
    {
      id: 'ram',
      label: 'RAM',
      value: `${s.memPct.toFixed(0)}%`,
      title: `${s.memUsedMb} / ${s.memTotalMb} MB system memory`,
    },
  ]
  if (showGpu) {
    rows.push(
      s.gpuPct != null
        ? {
            id: 'gpu',
            label: 'GPU',
            value: `${s.gpuPct.toFixed(0)}%`,
            title:
              s.gpuSource === 'macos-ioreg'
                ? 'Apple GPU (Device Utilization from IOKit)'
                : s.gpuSource === 'nvidia-smi'
                  ? 'NVIDIA GPU (nvidia-smi)'
                  : undefined,
          }
        : {
            id: 'gpu',
            label: 'GPU',
            value: '—',
            title:
              'GPU % unavailable (needs NVIDIA nvidia-smi or Apple Silicon IOKit)',
          }
    )
  }
  return rows
}
