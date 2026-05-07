import { useMemo, useState } from "react";
import type { FormGraph } from "@/graph/FormGraph";
import type { FormField, FormNode } from "@/graph/types";
import type { GlobalData, PrefillOption } from "@/prefill/types";
import type { PrefillMappingsApi } from "@/hooks/usePrefillMappings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrefillFieldRow } from "@/components/PrefillFieldRow";
import { PrefillModal } from "@/components/PrefillModal";

interface Props {
  node: FormNode | null;
  graph: FormGraph;
  globals: GlobalData;
  mappingsApi: PrefillMappingsApi;
}

export function PrefillPanel({ node, graph, globals, mappingsApi }: Props) {
  const [modalField, setModalField] = useState<FormField | null>(null);

  const fields = useMemo(() => node?.fields ?? [], [node]);

  if (!node) {
    return (
      <Card className="flex-1">
        <CardHeader className="border-b">
          <CardTitle>Prefill</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Select a form to configure prefill.
        </CardContent>
      </Card>
    );
  }

  const onPick = (option: PrefillOption) => {
    if (!modalField) return;
    mappingsApi.setMapping(node.id, modalField.id, option);
  };

  return (
    <Card className="flex-1">
      <CardHeader className="border-b">
        <CardTitle>{node.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {fields.length === 0 ? (
          <div className="text-muted-foreground">No fields found.</div>
        ) : (
          fields.map((field) => (
            <PrefillFieldRow
              key={field.id}
              field={field}
              mapping={mappingsApi.getMapping(node.id, field.id)}
              onClickUnmapped={() => setModalField(field)}
              onClear={() => mappingsApi.clearMapping(node.id, field.id)}
            />
          ))
        )}
      </CardContent>

      {modalField ? (
        <PrefillModal
          open={Boolean(modalField)}
          onOpenChange={(open) => {
            if (!open) setModalField(null);
          }}
          targetNode={node}
          targetField={modalField}
          graph={graph}
          globals={globals}
          onPick={onPick}
        />
      ) : null}
    </Card>
  );
}


