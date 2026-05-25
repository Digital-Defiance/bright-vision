import { invoke } from '@tauri-apps/api/core'
import { isTauriRuntime } from './isTauri'

export interface ResourceSnapshot {
  cpuPct: number
  memUsedMb: number
  memTotalMb: number
  memPct: number
  gpuPct: number | null
  scope: string
}

export async function fetchResourceSnapshot(): Promise<ResourceSnapshot | null> {
  if (!isTauriRuntime()) return null
  try {
    return await invoke<ResourceSnapshot>('get_resource_snapshot')
  } catch {
    return null
  }
}

export function formatResourceOverlayLine(s: ResourceSnapshot, showGpu: boolean): string {
  const cpu = `${s.cpuPct.toFixed(0)}% CPU`
  const mem = `${s.memPct.toFixed(0)}% RAM`
  if (showGpu) {
    const gpu =
      s.gpuPct != null ? `${s.gpuPct.toFixed(0)}% GPU` : 'GPU —'
    return `${cpu} · ${mem} · ${gpu}`
  }
  return `${cpu} · ${mem}`
}
