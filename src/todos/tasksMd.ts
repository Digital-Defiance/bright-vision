export interface ImplementationStep {
  number: number
  text: string
  done: boolean
}

const STEP_LINE =
  /^\s*-\s*\[([ xX])\]\s*(\d+)\.\s*(.+?)(?:\s*\(depends:\s*[^)]+\))?\s*$/i
const STEP_LINE_PLAIN = /^\s*(\d+)\.\s*(.+?)(?:\s*\(depends:\s*[^)]+\))?\s*$/i

/** Parse numbered implementation tasks from ``tasks_md`` markdown. */
export function parseImplementationSteps(tasksMd: string): ImplementationStep[] {
  const steps: ImplementationStep[] = []
  for (const line of tasksMd.replace(/\r\n/g, '\n').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let m = STEP_LINE.exec(trimmed)
    if (m) {
      steps.push({
        number: parseInt(m[2], 10),
        text: m[3].trim(),
        done: m[1].toLowerCase() === 'x',
      })
      continue
    }
    m = STEP_LINE_PLAIN.exec(trimmed)
    if (m) {
      steps.push({
        number: parseInt(m[1], 10),
        text: m[2].trim(),
        done: false,
      })
    }
  }
  return steps.sort((a, b) => a.number - b.number)
}
