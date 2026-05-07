import { useState } from 'react'
import { useBlueprintGraph } from '@/hooks/useBlueprintGraph'
import { FormList } from '@/components/FormList'
import { usePrefillMappings } from './hooks/usePrefillMappings'
import { PrefillPanel } from './components/PrefillPanel'
import { mockGlobals } from './prefill/globals'

function App() {
  const state = useBlueprintGraph()
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const mappingsApi = usePrefillMappings()

  if (state.status === 'loading') {
    return <div className="p-8">Loading...</div>
  }

  if (state.status === 'error') {
    return (
      <div className="p-8 text-red-500">Error: {state.error.message}</div>
    )
  }

  const nodes = state.graph.getAllNodes()
  const selectedNode = selectedNodeId
    ? state.graph.getNode(selectedNodeId) ?? null
    : null

  return (
    <div className="flex gap-4 p-8">
      <FormList
        nodes={nodes}
        graph={state.graph}
        selectedNodeId={selectedNodeId}
        onSelect={setSelectedNodeId}
      />
      <PrefillPanel
        node={selectedNode}
        graph={state.graph}
        globals={mockGlobals}
        mappingsApi={mappingsApi}
      />
    </div>
  )
}

export default App
