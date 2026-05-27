#!/usr/bin/env node
/**
 * Build public docs/data/leaderboard.v1.json from bench-submissions/*.json
 * Run: node scripts/build-bench-leaderboard.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SUBMISSIONS_DIR = path.join(ROOT, 'bench-submissions')
const OUT_FILE = path.join(ROOT, 'docs', 'data', 'leaderboard.v1.json')

const HARDWARE = new Set([
  'apple-silicon',
  'nvidia-desktop',
  'nvidia-laptop',
  'amd-desktop',
  'cpu-only',
  'other',
])

/** @param {unknown} raw */
export function validateSubmission(raw, filename) {
  if (!raw || typeof raw !== 'object') throw new Error(`${filename}: not an object`)
  const o = /** @type {Record<string, unknown>} */ (raw)
  if (o.schemaVersion !== 1) throw new Error(`${filename}: schemaVersion must be 1`)
  const displayName = String(o.displayName ?? '').trim()
  if (displayName.length < 1 || displayName.length > 32) {
    throw new Error(`${filename}: displayName required (1–32 chars)`)
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(displayName)) {
    throw new Error(`${filename}: displayName must be alphanumeric, _ or -`)
  }
  const hardware = String(o.hardware ?? '').trim()
  if (!HARDWARE.has(hardware)) throw new Error(`${filename}: invalid hardware`)
  const model = String(o.model ?? '').trim()
  if (model.length < 1 || model.length > 128) throw new Error(`${filename}: model required`)
  const stats = o.stats
  if (!stats || typeof stats !== 'object') throw new Error(`${filename}: stats required`)
  const s = /** @type {Record<string, unknown>} */ (stats)
  const turnCount = Number(s.turnCount)
  const medianTps = Number(s.medianTps)
  if (!Number.isFinite(turnCount) || turnCount < 1) {
    throw new Error(`${filename}: stats.turnCount must be >= 1`)
  }
  if (!Number.isFinite(medianTps) || medianTps < 0) {
    throw new Error(`${filename}: stats.medianTps required`)
  }
  const submittedAt = String(o.submittedAt ?? '').trim()
  if (!submittedAt) throw new Error(`${filename}: submittedAt required`)
  const submittedBy = o.submittedBy != null ? String(o.submittedBy).trim() : ''
  if (submittedBy && !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(submittedBy)) {
    throw new Error(`${filename}: invalid submittedBy`)
  }
  return {
    schemaVersion: 1,
    displayName,
    hideGitHubOnWall: Boolean(o.hideGitHubOnWall),
    submittedBy: submittedBy || undefined,
    submittedAt,
    hardware,
    model,
    stats: {
      turnCount: Math.round(turnCount),
      medianTps: roundTps(medianTps),
      meanTps: s.meanTps != null ? roundTps(Number(s.meanTps)) : undefined,
      p90ResponseMs: roundMs(s.p90ResponseMs),
      medianResponseMs: roundMs(s.medianResponseMs),
      avgThinkSharePct: roundPct(s.avgThinkSharePct),
      medianPeakGpuPct: roundPct(s.medianPeakGpuPct),
    },
    provenance:
      o.provenance && typeof o.provenance === 'object'
        ? { source: String(/** @type {Record<string, unknown>} */ (o.provenance).source || '') }
        : undefined,
  }
}

function roundTps(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return undefined
  return Math.round(v * 10) / 10
}

function roundMs(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return undefined
  return Math.round(v / 100) * 100
}

function roundPct(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return undefined
  return Math.round(v)
}

/** @param {ReturnType<typeof validateSubmission>} sub */
function toPublicEntry(sub, id) {
  const entry = {
    id,
    displayName: sub.displayName,
    hardware: sub.hardware,
    model: sub.model,
    stats: { ...sub.stats },
    submittedAt: sub.submittedAt,
  }
  if (!sub.hideGitHubOnWall && sub.submittedBy) {
    entry.github = sub.submittedBy
  }
  return entry
}

function dedupeKey(sub) {
  const gh = sub.submittedBy || ''
  return `${gh.toLowerCase()}\0${sub.model.toLowerCase()}`
}

async function loadSubmissions() {
  let names = []
  try {
    names = await readdir(SUBMISSIONS_DIR)
  } catch (e) {
    if (/** @type {NodeJS.ErrnoException} */ (e).code === 'ENOENT') return []
    throw e
  }
  const subs = []
  for (const name of names) {
    if (!name.endsWith('.json')) continue
    if (name.startsWith('.')) continue
    const filePath = path.join(SUBMISSIONS_DIR, name)
    const text = await readFile(filePath, 'utf8')
    const raw = JSON.parse(text)
    const id = name.replace(/\.json$/i, '')
    subs.push({ id, file: name, data: validateSubmission(raw, name) })
  }
  return subs
}

export function buildLeaderboard(subs) {
  const byKey = new Map()
  for (const { id, data } of subs) {
    const key = dedupeKey(data)
    const prev = byKey.get(key)
    if (!prev || data.submittedAt > prev.data.submittedAt) {
      byKey.set(key, { id, data })
    }
  }
  const entries = [...byKey.values()]
    .map(({ id, data }) => toPublicEntry(data, id))
    .sort((a, b) => (b.stats.medianTps ?? 0) - (a.stats.medianTps ?? 0))

  const byModel = new Map()
  for (const e of entries) {
    const family = e.model.split(/[/:]/)[0] || e.model
    const bucket = byModel.get(family) ?? { modelFamily: family, count: 0, tpsSum: 0 }
    bucket.count += 1
    bucket.tpsSum += e.stats.medianTps ?? 0
    byModel.set(family, bucket)
  }
  const modelFamilies = [...byModel.values()]
    .map((b) => ({
      modelFamily: b.modelFamily,
      entryCount: b.count,
      medianOfMedianTps: roundTps(b.tpsSum / b.count),
    }))
    .sort((a, b) => b.entryCount - a.entryCount)

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    entryCount: entries.length,
    privacyNote:
      'Public aggregate only. No prompts, paths, or per-turn logs. GitHub logins appear only when submitters opt in.',
    entries,
    modelFamilies,
  }
}

export async function buildBenchLeaderboard() {
  const subs = await loadSubmissions()
  const leaderboard = buildLeaderboard(subs)
  await writeFile(OUT_FILE, `${JSON.stringify(leaderboard, null, 2)}\n`, 'utf8')
  return { entryCount: leaderboard.entryCount, outFile: OUT_FILE }
}

export function submissionFromIssueFields(fields, login) {
  const displayName = String(fields.display_name ?? '').trim()
  const hardware = String(fields.hardware ?? 'other').trim()
  const model = String(fields.model ?? '').trim()
  const turnCount = Number(fields.turn_count)
  const medianTps = Number(fields.median_tps)
  const hideGitHubOnWall = fields.hide_github === true || fields.hide_github === 'true'
  const raw = {
    schemaVersion: 1,
    displayName,
    hideGitHubOnWall,
    submittedBy: login,
    submittedAt: new Date().toISOString(),
    hardware,
    model,
    stats: {
      turnCount,
      medianTps,
      p90ResponseMs: fields.p90_response_ms ? Number(fields.p90_response_ms) : undefined,
      medianResponseMs: fields.median_response_ms ? Number(fields.median_response_ms) : undefined,
      avgThinkSharePct: fields.avg_think_share_pct
        ? Number(fields.avg_think_share_pct)
        : undefined,
      medianPeakGpuPct: fields.median_peak_gpu_pct
        ? Number(fields.median_peak_gpu_pct)
        : undefined,
    },
    provenance: { source: 'github-issue-form' },
  }
  return validateSubmission(raw, 'issue')
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMain) {
  const result = await buildBenchLeaderboard()
  console.log(`Wrote ${result.entryCount} entries → ${result.outFile}`)
}
