import type { TodoItem } from './types'
import { migrateTodoLayers } from './layers'
import type { ImplementationStep } from './tasksMd'

function layerOrPlaceholder(text: string, placeholder: string): string {
  return text.trim() || placeholder
}

/** Prepended once per active-task activation (UI fallback when API inject is off). */
export function formatTodoContext(todo: TodoItem, allTodos?: TodoItem[]): string {
  const item = migrateTodoLayers(todo)
  const lines = [`[Active task: ${item.title} · id ${item.id.slice(0, 8)}]`, '']
  if (item.branch.trim()) {
    lines.push(`**Git branch:** ${item.branch.trim()}`)
  }
  if (item.pr_url.trim()) {
    lines.push(`**Pull request:** ${item.pr_url.trim()}`)
  }
  if (item.branch.trim() || item.pr_url.trim()) {
    lines.push('')
  }

  if (item.depends_on.length && allTodos?.length) {
    const pending: string[] = []
    for (const depId of item.depends_on) {
      const dep = allTodos.find((t) => t.id === depId || t.id.startsWith(depId))
      if (dep && dep.status !== 'done') {
        pending.push(`${dep.title} (${dep.id.slice(0, 8)})`)
      }
    }
    if (pending.length) {
      lines.push(`**Blocked by:** ${pending.join(', ')}`, '')
    }
  }

  lines.push(
    '## Requirements',
    layerOrPlaceholder(item.requirements, '(No requirements yet.)'),
    '',
    '## Design',
    layerOrPlaceholder(item.design, '(No design yet.)'),
    '',
    '## Implementation tasks',
    layerOrPlaceholder(item.tasks_md, '(No implementation tasks yet.)')
  )

  if (item.spec.trim() && item.spec.trim() !== item.requirements.trim()) {
    lines.push('', '## Legacy specification', item.spec.trim())
  }

  if (item.checklist?.length) {
    lines.push('', '## Checklist')
    for (const entry of item.checklist) {
      lines.push(`- [${entry.done ? 'x' : ' '}] ${entry.text}`)
    }
  }
  lines.push('', '---', '')
  return lines.join('\n')
}

export function buildStartWorkMessage(todo: TodoItem, allTodos: TodoItem[]): string {
  const item = migrateTodoLayers(todo)
  const blocked = item.depends_on.some((depId) => {
    const dep = allTodos.find((t) => t.id === depId || t.id.startsWith(depId))
    return dep && dep.status !== 'done'
  })
  if (blocked) {
    return (
      'Implement the active task per the injected requirements, design, and implementation tasks. ' +
      'Resolve or acknowledge blocking dependencies first.'
    )
  }
  return (
    'Implement the active task per the injected requirements, design, and implementation tasks. ' +
    'Work through implementation tasks in order; update the checklist as you complete acceptance items.'
  )
}

export function buildImplementStepMessage(step: ImplementationStep, todo: TodoItem): string {
  const blocked =
    todo.depends_on.length > 0
      ? ' Acknowledge any blocking dependencies noted in context before coding.'
      : ''
  return (
    `Implement only implementation task ${step.number}: ${step.text}. ` +
    `Do not implement other numbered tasks in this turn unless required as a direct dependency.${blocked}`
  )
}
