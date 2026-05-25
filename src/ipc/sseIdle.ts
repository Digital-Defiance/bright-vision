/** SSE read stalled — core HTTP stream open but no new events. */

export type SseIdlePhase = 'before_first_event' | 'after_events'

export class SseIdleTimeoutError extends Error {
  readonly phase: SseIdlePhase

  constructor(phase: SseIdlePhase) {
    super(
      phase === 'before_first_event'
        ? 'No response from Vision core for 5 minutes. Check that the core API is running and Ollama is up.'
        : 'Turn stalled — no events from core for 90s. Ollama may have unloaded the model (empty /api/ps). Use Stop, Ping LLM in Settings, then retry.'
    )
    this.name = 'SseIdleTimeoutError'
    this.phase = phase
  }
}

/** First model byte can take minutes on cold load; after events, stall sooner. */
export const SSE_IDLE_MS_BEFORE_FIRST = 300_000
export const SSE_IDLE_MS_AFTER_EVENT = 90_000

export async function readStreamChunkWithIdleTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  gotEvent: boolean
): Promise<ReadableStreamReadResult<Uint8Array>> {
  const limit = gotEvent ? SSE_IDLE_MS_AFTER_EVENT : SSE_IDLE_MS_BEFORE_FIRST
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      reader.read(),
      new Promise<ReadableStreamReadResult<Uint8Array>>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new SseIdleTimeoutError(gotEvent ? 'after_events' : 'before_first_event')
            ),
          limit
        )
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}
