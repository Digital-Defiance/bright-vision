/**
 * Heuristic checks that generated three-layer specs are usable (EARS + tasks).
 * Shared by unit tests and Playwright e2e.
 */

export interface SpecLayerAssessment {
  ok: boolean
  issues: string[]
}

export interface SpecLayers {
  requirements: string
  design: string
  tasks_md: string
}

/** True when design text traces back to REQ ids (or equivalent) in requirements. */
export function designReferencesRequirements(requirements: string, design: string): boolean {
  const req = (requirements || '').trim()
  const des = (design || '').trim()
  if (!des || !/REQ-\d+/i.test(req)) return true
  if (/REQ-\d+/i.test(des)) return true
  const nums = [...req.matchAll(/REQ-(\d+)/gi)].map((m) => m[1]).filter(Boolean)
  if (nums.some((n) => new RegExp(`\\b${n}\\b`).test(des))) return true
  if (/\brequirement\s*\d+/i.test(des)) return true
  return false
}

export function assessGeneratedSpecLayers(layers: SpecLayers): SpecLayerAssessment {
  const issues: string[] = []
  const req = (layers.requirements || '').trim()
  const design = (layers.design || '').trim()
  const tasks = (layers.tasks_md || '').trim()

  if (!req) issues.push('requirements empty')
  if (!design) issues.push('design empty')
  if (!tasks) issues.push('tasks_md empty')

  if (req) {
    if (!/REQ-\d+/i.test(req)) issues.push('requirements missing REQ-### id')
    if (!/\bshall\b/i.test(req)) issues.push('requirements missing SHALL')
    if (!/\bwhen\b/i.test(req)) issues.push('requirements missing WHEN')
  }

  if (tasks && !/(?:^\s*[-*]\s*\[[ xX]\]\s*)?\d+\.\s+/m.test(tasks)) {
    issues.push('tasks_md missing numbered implementation steps')
  }

  if (design && req && !designReferencesRequirements(req, design)) {
    if (!(tasks && designReferencesRequirements(req, tasks))) {
      issues.push('design does not reference any REQ id')
    }
  }

  return { ok: issues.length === 0, issues }
}

/** Mock / fixture content that passes {@link assessGeneratedSpecLayers}. */
export const MOCK_SANE_SPEC_LAYERS: SpecLayers = {
  requirements: `### REQ-001
**WHEN** the user opens the feature
**THE** system **SHALL** show the task spec layers.

### REQ-002
**WHEN** the user saves requirements
**THE** system **SHALL** persist markdown under \`.cecli/specs/{id}/\`.`,
  design: `## Overview
Covers REQ-001 UI flow and REQ-002 disk sync.`,
  tasks_md: `- [ ] 1. Wire generate-spec API for REQ-001 (depends: none)
- [ ] 2. Add e2e coverage for REQ-002 (depends: 1)`,
}
