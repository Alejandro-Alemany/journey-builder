import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FormNode } from '@/graph/types'

interface Props {
  node: FormNode | null
}

export function FormDetailPanel({ node }: Props) {
  if (!node) {
    return (
      <Card className="flex-1">
        <CardHeader className="border-b">
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Select a form to view its fields.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex-1">
      <CardHeader className="border-b">
        <CardTitle>{node.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {node.fields.length === 0 ? (
          <div className="text-muted-foreground">No fields found.</div>
        ) : (
          node.fields.map((field) => (
            <div key={field.id} className="rounded-lg border p-3">
              <div className="font-medium">{field.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span>{field.id}</span>
                <span className="mx-2">•</span>
                <span>{field.type}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

