import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FormNode } from '@/graph/types'

interface Props {
  nodes: FormNode[]
  selectedNodeId: string | null
  onSelect: (nodeId: string) => void
}

export function FormList({ nodes, selectedNodeId, onSelect }: Props) {
  return (
    <Card className="w-80">
      <CardHeader className="border-b">
        <CardTitle>Forms</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {nodes.length === 0 ? (
          <div className="text-muted-foreground">No forms found.</div>
        ) : (
          nodes.map((node) => {
            const selected = node.id === selectedNodeId
            return (
              <Button
                key={node.id}
                type="button"
                variant="ghost"
                className={cn(
                  'h-auto w-full justify-start px-2 py-2 text-left',
                  selected ? 'bg-accent' : undefined,
                )}
                onClick={() => onSelect(node.id)}
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="truncate font-medium">{node.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {node.id}
                  </div>
                </div>
              </Button>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

