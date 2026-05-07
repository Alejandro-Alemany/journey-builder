import { FormGraph } from "./FormGraph";
import type { Edge, FormField, FormNode } from "./types";
import type { BlueprintGraph } from "../api/schemas";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickLabel(fieldKey: string, def: Record<string, unknown>): string {
  const title = def.title;
  return typeof title === "string" && title.trim() ? title : fieldKey;
}

function pickType(def: Record<string, unknown>): string {
  // The backend’s `avantos_type` encodes the UI/control semantics more precisely
  // than JSON Schema `type` (which can be overly generic like "string" / "object").
  const avantosType = def.avantos_type;
  if (typeof avantosType === "string" && avantosType.trim()) return avantosType;

  const jsonSchemaType = def.type;
  if (typeof jsonSchemaType === "string" && jsonSchemaType.trim())
    return jsonSchemaType;

  return "unknown";
}

function isDeniedAvantosType(avantosType: unknown): boolean {
  // “button” is an action control, not a data-bearing field — exclude it from prefill mappings.
  return avantosType === "button";
}

export function extractFieldsFromFormTemplate(formTemplate: unknown): FormField[] {
  if (!isObject(formTemplate)) return [];

  const fieldSchema = formTemplate.field_schema;
  if (!isObject(fieldSchema)) return [];

  const properties = fieldSchema.properties;
  if (!isObject(properties)) return [];

  const fields: FormField[] = [];

  for (const [key, rawDef] of Object.entries(properties)) {
    if (!isObject(rawDef)) {
      console.warn(
        `extractFieldsFromFormTemplate: skipping non-object field definition`,
        { key, def: rawDef },
      );
      continue;
    }

    if (isDeniedAvantosType(rawDef.avantos_type)) continue;

    fields.push({
      id: key,
      label: pickLabel(key, rawDef),
      type: pickType(rawDef),
    });
  }

  return fields;
}

export function buildFormGraph(api: BlueprintGraph): FormGraph {
  const formsById = new Map((api.forms ?? []).map((f) => [f.id, f]));

  const nodes: FormNode[] = api.nodes.map((apiNode) => {
    const formId = apiNode.data.component_id ?? apiNode.id;
    const template = formsById.get(formId);

    if (!template) {
      console.warn(`buildFormGraph: missing form template`, {
        nodeId: apiNode.id,
        formId,
      });
    }

    return {
      id: apiNode.id,
      formId,
      name: apiNode.data.name ?? apiNode.id,
      fields: template ? extractFieldsFromFormTemplate(template) : [],
    };
  });

  const edges: Edge[] = [];
  for (const node of api.nodes) {
    // `edges[]` duplicates relationship information and can diverge; the node’s explicit
    // `prerequisites` list is the source of truth for “what must run before this form”.
    const prereqs = node.data.prerequisites ?? [];
    for (const prereqId of prereqs) {
      edges.push({ from: prereqId, to: node.id });
    }
  }

  return new FormGraph(nodes, edges);
}