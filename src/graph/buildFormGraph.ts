import { FormGraph } from "./FormGraph";
import type { Edge, FormField, FormNode } from "./types";
import type { ActionBlueprintGraphResponse } from "../api/schemas";

export function buildFormGraph(api: ActionBlueprintGraphResponse): FormGraph {
  const nodes: FormNode[] = api.nodes.map((apiNode) => ({
    id: apiNode.id,
    formId: apiNode.data.component_id ?? apiNode.id,
    name: apiNode.data.name ?? apiNode.id,
    fields: extractFieldsFromForm(apiNode, api.forms),
  }));

  const edges: Edge[] = api.edges.map((e) => ({
    from: e.source,
    to: e.target,
  }));

  return new FormGraph(nodes, edges);
}

function extractFieldsFromForm(
  _apiNode: ActionBlueprintGraphResponse["nodes"][number],
  _forms: ActionBlueprintGraphResponse["forms"] | undefined,
): FormField[] {
  // TODO: implement once we decide how to interpret `forms` + node references.
  return [];
}