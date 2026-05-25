import { invoke } from '@tauri-apps/api/core'
import { isTauriRuntime } from './isTauri'

/** Sum readable bytes for workspace-relative paths (desktop). Web returns 0. */
export async function estimatePathsContextChars(
  workingDir: string,
  paths: string[]
): Promise<number> {
  if (!isTauriRuntime() || !paths.length) return 0
  try {
    return await invoke<number>('estimate_paths_context_chars', {
      workingDir,
      paths,
    })
  } catch {
    return 0
  }
}
