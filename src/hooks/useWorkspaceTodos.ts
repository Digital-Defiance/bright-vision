import { invoke } from '@tauri-apps/api/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CoreHttpClient } from '../ipc/httpClient'
import { isTauriRuntime } from '../ipc/isTauri'
import { loadTodoStore, normalizeTodo, saveTodoStore } from '../todos/storage'
import { exportTodoStore, importTodoStore } from '../todos/markdown'
import { applyLayerTemplate, applyTodoTemplate } from '../todos/templates'
import type { ChecklistItem, TodoItem, TodoStore, TodoStatus } from '../todos/types'

function nowIso(): string {
  return new Date().toISOString()
}

function checklistComplete(checklist: ChecklistItem[]): boolean {
  return checklist.length > 0 && checklist.every((c) => c.text.trim() && c.done)
}

export interface WorkspaceTodosApi {
  client: CoreHttpClient
  workspace: string
}

type TodoPatch = Partial<
  Pick<
    TodoItem,
    | 'title'
    | 'spec'
    | 'requirements'
    | 'design'
    | 'tasks_md'
    | 'depends_on'
    | 'branch'
    | 'pr_url'
    | 'status'
    | 'links'
    | 'checklist'
  >
>

export function useWorkspaceTodos(
  workingDir: string,
  api?: WorkspaceTodosApi | null,
  onAutoCompleted?: (todoId: string) => void
) {
  const [store, setStore] = useState<TodoStore | null>(null)
  const [loading, setLoading] = useState(true)
  const [httpReady, setHttpReady] = useState(false)
  const reloadGenerationRef = useRef(0)
  const tauriLocal = isTauriRuntime()

  const mirrorToDisk = useCallback(
    async (next: TodoStore) => {
      if (tauriLocal) await saveTodoStore(workingDir, next)
    },
    [tauriLocal, workingDir]
  )

  const persistLocal = useCallback(
    async (next: TodoStore) => {
      setStore(next)
      await mirrorToDisk(next)
    },
    [mirrorToDisk]
  )

  const reload = useCallback(async () => {
    const generation = ++reloadGenerationRef.current
    const stale = () => generation !== reloadGenerationRef.current
    setLoading(true)
    try {
      if (tauriLocal) {
        const local = await loadTodoStore(workingDir)
        if (!stale()) setStore(local)
      }
      if (api?.client) {
        try {
          await api.client.health()
          try {
            await api.client.importAgentTodoPlan(api.workspace)
          } catch {
            // Agent plan import is best-effort; list still loads local/API store.
          }
          if (stale()) return
          const data = await api.client.listWorkspaceTodos(api.workspace)
          if (stale()) return
          setStore(data)
          setHttpReady(true)
          await mirrorToDisk(data)
          return
        } catch {
          if (!stale()) setHttpReady(false)
        }
      } else {
        setHttpReady(false)
      }
      if (!tauriLocal) {
        const local = await loadTodoStore(workingDir)
        if (!stale()) setStore(local)
      }
    } finally {
      if (!stale()) setLoading(false)
    }
  }, [api, workingDir, tauriLocal, mirrorToDisk])

  useEffect(() => {
    void reload()
  }, [reload])

  const activeTodo = useMemo(() => {
    if (!store?.activeId) return null
    return store.todos.find((t) => t.id === store.activeId) ?? null
  }, [store])

  const applyLocalAutoComplete = (
    id: string,
    patch: TodoPatch,
    todos: TodoItem[],
    activeId: string | null
  ): { todos: TodoItem[]; activeId: string | null; autoCompleted: boolean } => {
    if (!patch.checklist || !checklistComplete(patch.checklist)) {
      return { todos, activeId, autoCompleted: false }
    }
    const next = todos.map((t) => {
      if (t.id !== id || t.status === 'done' || t.status === 'cancelled') return t
      return { ...t, status: 'done' as const, updated_at: nowIso() }
    })
    const autoCompleted = next.some((t) => t.id === id && t.status === 'done')
    const nextActive = autoCompleted && activeId === id ? null : activeId
    if (autoCompleted) onAutoCompleted?.(id)
    return { todos: next, activeId: nextActive, autoCompleted }
  }

  const createTodo = useCallback(
    async (title: string, spec = '', template?: string) => {
      if (httpReady && api) {
        const created = await api.client.createWorkspaceTodo(api.workspace, {
          title,
          spec,
          template,
        })
        await reload()
        return normalizeTodo(created)
      }
      const layers = applyLayerTemplate(template)
      const item: TodoItem = layers
        ? {
            id: crypto.randomUUID().replace(/-/g, ''),
            title: title.trim() || 'Untitled',
            spec: '',
            requirements: layers.requirements,
            design: layers.design,
            tasks_md: layers.tasks_md,
            depends_on: [],
            branch: '',
            pr_url: '',
            status: 'open',
            links: [],
            checklist: [],
            created_at: nowIso(),
            updated_at: nowIso(),
          }
        : {
            id: crypto.randomUUID().replace(/-/g, ''),
            title: title.trim() || 'Untitled',
            spec: spec.trim() || applyTodoTemplate(template),
            requirements: '',
            design: '',
            tasks_md: '',
            depends_on: [],
            branch: '',
            pr_url: '',
            status: 'open',
            links: [],
            checklist: [],
            created_at: nowIso(),
            updated_at: nowIso(),
          }
      const base = store ?? { version: 1, activeId: null, todos: [] }
      await persistLocal({ ...base, todos: [item, ...base.todos] })
      return item
    },
    [httpReady, api, store, persistLocal, reload]
  )

  const updateTodo = useCallback(
    async (id: string, patch: TodoPatch) => {
      if (httpReady && api) {
        const result = await api.client.patchWorkspaceTodo(api.workspace, id, patch)
        if (result.auto_completed) onAutoCompleted?.(id)
        await reload()
        return
      }
      if (!store) return
      let todos = store.todos.map((t) =>
        t.id === id ? { ...t, ...patch, updated_at: nowIso() } : t
      )
      let activeId = store.activeId
      const { todos: t2, activeId: a2, autoCompleted } = applyLocalAutoComplete(
        id,
        patch,
        todos,
        activeId
      )
      todos = t2
      activeId = a2
      if (!autoCompleted && patch.status === 'done' && activeId === id) {
        activeId = null
      }
      await persistLocal({ ...store, todos, activeId })
    },
    [httpReady, api, store, persistLocal, reload, onAutoCompleted]
  )

  const deleteTodo = useCallback(
    async (id: string) => {
      if (httpReady && api) {
        await api.client.deleteWorkspaceTodo(api.workspace, id)
        await reload()
        return
      }
      if (!store) return
      const todos = store.todos.filter((t) => t.id !== id)
      const activeId = store.activeId === id ? null : store.activeId
      await persistLocal({ ...store, todos, activeId })
    },
    [httpReady, api, store, persistLocal, reload]
  )

  const setActiveTodo = useCallback(
    async (id: string | null) => {
      if (httpReady && api) {
        const next = await api.client.setActiveWorkspaceTodo(api.workspace, id)
        setStore(next)
        await mirrorToDisk(next)
        return
      }
      if (!store) return
      let todos = store.todos
      if (id) {
        todos = todos.map((t) => {
          if (t.id !== id) return t
          const status: TodoStatus = t.status === 'open' ? 'in_progress' : t.status
          return { ...t, status, updated_at: nowIso() }
        })
      }
      await persistLocal({ ...store, activeId: id, todos })
    },
    [httpReady, api, store, persistLocal, mirrorToDisk]
  )

  const markDone = useCallback(
    async (id: string) => {
      await updateTodo(id, { status: 'done' })
      if (httpReady && api && store?.activeId === id) {
        const next = await api.client.setActiveWorkspaceTodo(api.workspace, null)
        setStore(next)
        await mirrorToDisk(next)
      } else if (store?.activeId === id) {
        await persistLocal({ ...store, activeId: null })
      }
    },
    [updateTodo, httpReady, api, store, persistLocal, mirrorToDisk]
  )

  const recordTurnLinks = useCallback(
    async (links: string[]) => {
      if (httpReady) return
      if (!store?.activeId || !links.length) return
      const todos = store.todos.map((t) => {
        if (t.id !== store.activeId) return t
        const seen = new Set(t.links)
        const merged = [...t.links]
        for (const link of links) {
          const s = link.trim()
          if (s && !seen.has(s)) {
            merged.push(s)
            seen.add(s)
          }
        }
        return { ...t, links: merged, updated_at: nowIso() }
      })
      await persistLocal({ ...store, todos })
    },
    [httpReady, store, persistLocal]
  )

  const syncSpecFromDisk = useCallback(
    async (id: string) => {
      if (httpReady && api) {
        await api.client.syncWorkspaceSpecFiles(api.workspace, id)
        await reload()
        return
      }
      if (tauriLocal) {
        await invoke('import_todo_spec_files', { workingDir, todoId: id })
        await reload()
        return
      }
      throw new Error('Sync from disk requires the desktop app or a running Vision API session')
    },
    [httpReady, api, tauriLocal, workingDir, reload]
  )

  const moveTodo = useCallback(
    async (id: string, direction: 'up' | 'down') => {
      if (httpReady && api) {
        const next = await api.client.moveWorkspaceTodo(api.workspace, id, direction)
        setStore(next)
        await mirrorToDisk(next)
        return
      }
      if (!store) return
      const idx = store.todos.findIndex((t) => t.id === id)
      if (idx < 0) return
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= store.todos.length) return
      const todos = [...store.todos]
      ;[todos[idx], todos[newIdx]] = [todos[newIdx], todos[idx]]
      await persistLocal({ ...store, todos })
    },
    [httpReady, api, store, persistLocal, mirrorToDisk]
  )

  const importMarkdown = useCallback(
    async (markdown: string, merge: boolean) => {
      if (httpReady && api) {
        const next = await api.client.importWorkspaceTodos(api.workspace, markdown, merge)
        setStore(next)
        await mirrorToDisk(next)
        return
      }
      const base = store ?? (await loadTodoStore(workingDir))
      const next = importTodoStore(markdown, base, merge)
      await persistLocal(next)
    },
    [httpReady, api, store, workingDir, persistLocal, mirrorToDisk]
  )

  const exportMarkdown = useCallback(async (): Promise<string> => {
    if (httpReady && api) {
      return api.client.exportWorkspaceTodos(api.workspace)
    }
    const local = store ?? (await loadTodoStore(workingDir))
    return exportTodoStore(local)
  }, [httpReady, api, store, workingDir])

  return {
    store,
    loading,
    httpReady,
    tauriLocal,
    activeTodo,
    reload,
    createTodo,
    updateTodo,
    deleteTodo,
    setActiveTodo,
    markDone,
    recordTurnLinks,
    exportMarkdown,
    importMarkdown,
    moveTodo,
    syncSpecFromDisk,
  }
}
