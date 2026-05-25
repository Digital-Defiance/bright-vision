import type { TodoItem } from './types'

/** Move legacy ``spec`` into ``requirements`` when three-layer fields are empty. */
export function migrateTodoLayers(todo: TodoItem): TodoItem {
  if (
    todo.spec.trim() &&
    !todo.requirements.trim() &&
    !todo.design.trim() &&
    !todo.tasks_md.trim()
  ) {
    return { ...todo, requirements: todo.spec.trim() }
  }
  return todo
}

export function isTodoBlocked(todo: TodoItem, allTodos: TodoItem[]): boolean {
  return todo.depends_on.some((depId) => {
    const dep = allTodos.find((t) => t.id === depId || t.id.startsWith(depId))
    return dep != null && dep.status !== 'done'
  })
}

/** Topological sort: dependencies before dependents; cyclic deps keep stable tail order. */
export function sortTodosByDependencies(todos: TodoItem[]): TodoItem[] {
  const visited = new Set<string>()
  const out: TodoItem[] = []

  const visit = (item: TodoItem) => {
    if (visited.has(item.id)) return
    for (const depId of item.depends_on) {
      const dep = todos.find((t) => t.id === depId || t.id.startsWith(depId))
      if (dep) visit(dep)
    }
    visited.add(item.id)
    out.push(item)
  }

  for (const t of todos) visit(t)
  return out
}
