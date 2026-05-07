import { useEffect, useState } from 'react'
import { fetchBlueprintGraph } from './api/client'
import type { ActionBlueprintGraphResponse } from './api/schemas'

function App() {
  const [data, setData] = useState<ActionBlueprintGraphResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function run() {
      setLoading(true)
      setError(null)

      try {
        // TODO: Replace these with real IDs (or wire up inputs/router params)
        const res = await fetchBlueprintGraph({
          tenantId: 't_67890',
          actionBlueprintId: 'bp_12345',
          signal: controller.signal,
        })
        setData(res)
        setError(null)
      } catch (e) {
        // In React dev (Strict Mode), effects may run twice and the first run gets aborted.
        // Treat AbortError as a non-error so it doesn't flash on screen.
        if (e instanceof DOMException && e.name === 'AbortError') {
          return
        }

        setError(e instanceof Error ? e.message : String(e))
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    void run()
    return () => controller.abort()
  }, [])

  return (
    <>
      <h1>Forms</h1>

      {loading ? <p>Loading…</p> : null}
      {error ? <p>{error}</p> : null}

      <ul>
        {(data?.forms ?? []).map((f) => (
          <li key={f.id}>
            {f.name ?? f.id} ({f.id})
          </li>
        ))}
      </ul>
    </>
  )
}

export default App
