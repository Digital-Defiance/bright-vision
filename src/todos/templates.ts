export const TODO_SPEC_TEMPLATES: Record<string, string> = {
  feature:
    '## Goal\n\n## Requirements\n\n## Acceptance criteria\n- [ ] \n',
  bugfix:
    '## Problem\n\n## Root cause\n\n## Fix verification\n- [ ] Repro fixed\n- [ ] Tests pass\n',
  refactor:
    '## Scope\n\n## Non-goals\n\n## Acceptance criteria\n- [ ] Behavior unchanged\n- [ ] \n',
}

export const SPEC_LAYER_TEMPLATES: Record<
  string,
  { requirements: string; design: string; tasks_md: string }
> = {
  'spec-driven': {
    requirements:
      '### REQ-001\n**WHEN** the user …\n**THE** system **SHALL** …\n\n### REQ-002\n**WHEN** …\n**THE** system **SHALL** …\n',
    design: '## Overview\n\n## Architecture\n\n## Components\n\n## Data flow\n\n',
    tasks_md:
      '## Implementation tasks\n\n- [ ] 1. … (depends: none)\n- [ ] 2. … (depends: 1)\n',
  },
}

export function applyTodoTemplate(name: string | undefined): string {
  if (!name) return ''
  return TODO_SPEC_TEMPLATES[name.trim().toLowerCase()] ?? ''
}

export function applyLayerTemplate(name: string | undefined): {
  requirements: string
  design: string
  tasks_md: string
} | null {
  if (!name) return null
  const layers = SPEC_LAYER_TEMPLATES[name.trim().toLowerCase()]
  return layers ? { ...layers } : null
}
