import { useEffect, useState } from 'react'
import { fetchBlueprintGraph } from '@/api/client'
import { BlueprintGraphSchema } from '@/api/schemas'
import { buildFormGraph } from '@/graph/buildFormGraph'
import type { FormGraph } from '@/graph/FormGraph'

type State =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; graph: FormGraph }

export function useBlueprintGraph(): State {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    async function run() {
      setState({ status: 'loading' })

      try {
        // TODO: Replace these with real IDs (or wire up inputs/router params)
        const res = await fetchBlueprintGraph({
          tenantId: 't_67890',
          actionBlueprintId: 'bp_12345',
          signal: controller.signal,
        })

        const api = BlueprintGraphSchema.parse(res)
        const graph = buildFormGraph(api)
        setState({ status: 'ready', graph })
      } catch (e) {
        // In React dev (Strict Mode), effects may run twice and the first run gets aborted.
        // Treat AbortError as a non-error so it doesn't flash on screen.
        if (e instanceof DOMException && e.name === 'AbortError') return
        setState({
          status: 'error',
          error: e instanceof Error ? e : new Error(String(e)),
        })
      }
    }

    void run()
    return () => controller.abort()
  }, [])

  return state
}

