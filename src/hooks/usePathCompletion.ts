import { invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'
import { isTauriRuntime } from '../ipc/isTauri'
import { parseFileCommandInput } from '../utils/fileCommandComplete'

export function usePathCompletion(workingDir: string, inputValue: string) {
  const [paths, setPaths] = useState<string[]>([])
  const parsed = parseFileCommandInput(inputValue)

  useEffect(() => {
    if (!parsed) {
      setPaths([])
      return
    }
    if (!isTauriRuntime()) {
      setPaths([])
      return
    }
    const handle = window.setTimeout(() => {
      void invoke<string[]>('complete_workspace_path', {
        workingDir,
        prefix: parsed.pathPrefix,
        limit: 25,
      })
        .then(setPaths)
        .catch(() => setPaths([]))
    }, 120)
    return () => window.clearTimeout(handle)
  }, [workingDir, parsed?.pathPrefix, parsed?.command])

  return { paths, active: Boolean(parsed) }
}
