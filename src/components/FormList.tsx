import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FormNode } from '@/graph/types'
import type { FormGraph } from '@/graph/FormGraph'

interface Props {
  nodes: FormNode[]
  graph: FormGraph
  selectedNodeId: string | null
  onSelect: (nodeId: string) => void
}

function buildChildrenIndex(nodes: FormNode[], graph: FormGraph) {
  const childrenById = new Map<string, FormNode[]>()
  const parentsCountById = new Map<string, number>()

  for (const n of nodes) {
    childrenById.set(n.id, [])
    parentsCountById.set(n.id, 0)
  }

  for (const n of nodes) {
    const parents = graph.getDirectParents(n.id)
    parentsCountById.set(n.id, parents.length)
    for (const p of parents) {
      const list = childrenById.get(p.id)
      if (list) list.push(n)
    }
  }

  for (const [, list] of childrenById) {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  const roots = nodes
    .filter((n) => (parentsCountById.get(n.id) ?? 0) === 0)
    .sort((a, b) => a.name.localeCompare(b.name))

  return { roots, childrenById }
}

export function FormList({ nodes, graph, selectedNodeId, onSelect }: Props) {
  const { roots, childrenById } = buildChildrenIndex(nodes, graph)

  return (
    <Card className="w-80">
      <CardHeader className="border-b">
        <CardTitle>Forms</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {nodes.length === 0 ? (
          <div className="text-muted-foreground">No forms found.</div>
        ) : (
          <div className="flex flex-col gap-1">
            {roots.map((root) => (
              <FormListItem
                key={root.id}
                node={root}
                depth={0}
                childrenById={childrenById}
                selectedNodeId={selectedNodeId}
                onSelect={onSelect}
                path={new Set()}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FormListItem(props: {
  node: FormNode
  depth: number
  childrenById: Map<string, FormNode[]>
  selectedNodeId: string | null
  onSelect: (nodeId: string) => void
  path: Set<string>
}) {
  const { node, depth, childrenById, selectedNodeId, onSelect, path } = props
  const selected = node.id === selectedNodeId

  // Cycle safety: if the data is bad, don’t recurse forever.
  if (path.has(node.id)) {
    return null
  }

  const nextPath = new Set(path)
  nextPath.add(node.id)

  const children = childrenById.get(node.id) ?? []

  return (
    <div className="flex flex-col gap-1">
      <Button
        key={node.id}
        type="button"
        variant="outline"
        className={cn(
          'h-auto w-full justify-start px-2 py-2 text-left',
          selected ? 'bg-accent' : undefined,
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => onSelect(node.id)}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="truncate font-medium">{node.name}</div>
          <div className="truncate text-xs text-muted-foreground">{node.id}</div>
        </div>
      </Button>

      {children.length > 0 ? (
        <div className="flex flex-col gap-1">
          {children.map((child) => (
            <FormListItem
              key={child.id}
              node={child}
              depth={depth + 1}
              childrenById={childrenById}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
              path={nextPath}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

