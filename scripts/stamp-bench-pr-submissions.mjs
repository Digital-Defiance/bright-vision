#!/usr/bin/env node
/**
 * Set submittedBy from PR author when missing (merged PR path).
 * Env: PR_AUTHOR, CHANGED_FILES (newline-separated paths)
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

async function main() {
  const author = process.env.PR_AUTHOR?.trim()
  if (!author) throw new Error('PR_AUTHOR required')
  const changed = (process.env.CHANGED_FILES || '')
    .split('\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('bench-submissions/') && f.endsWith('.json'))
  let touched = 0
  for (const rel of changed) {
    const full = path.join(ROOT, rel)
    const text = await readFile(full, 'utf8')
    const data = JSON.parse(text)
    if (data.submittedBy && data.submittedBy !== author) {
      console.warn(`Skip ${rel}: submittedBy already set`)
      continue
    }
    data.submittedBy = author
    if (!data.submittedAt) data.submittedAt = new Date().toISOString()
    await writeFile(full, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
    touched += 1
  }
  console.log(`Stamped ${touched} file(s)`)
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMain) main().catch((e) => {
  console.error(e)
  process.exit(1)
})
