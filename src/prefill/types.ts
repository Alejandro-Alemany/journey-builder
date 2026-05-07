import type { FormGraph } from "../graph/FormGraph";
import type { FormNode, FormField } from "../graph/types";

/**
 * What gets stored when a user picks a prefill source for a field.
 * Flat and serializable — no source-specific shapes leak into it.
 */
export interface PrefillOption {
  sourceId: string; // which DataSource produced this — "direct-deps", etc.
  groupId: string; // "form-a", "action-properties"
  groupLabel: string; // "Form A", "Action Properties"
  fieldId: string; // the field key
  fieldLabel: string; // human-readable label
  fieldType: string; // for type-compatibility filtering
}

export interface PrefillMapping {
  targetNodeId: string;
  targetFieldId: string;
  source: PrefillOption;
}

export interface PrefillOptionGroup {
  groupId: string;
  groupLabel: string;
  options: PrefillOption[];
}

export interface GlobalData {
  // Keep this simple — a flat record of named property bags.
  // The global data source reads from here.
  [groupKey: string]: {
    label: string;
    fields: Record<string, { label: string; type: string; value: string }>;
  };
}

export interface PrefillContext {
  targetNode: FormNode;
  targetField: FormField;
  graph: FormGraph;
  globals: GlobalData;
}

export interface PrefillDataSource {
  /** Stable, unique identifier — "direct-deps", "global", etc. */
  id: string;
  /** Section header label shown in the modal */
  label: string;
  /**
   * Pure function: given the context, return zero or more groups of options.
   * No async, no side effects. Return [] when this source has nothing to offer.
   */
  getOptions(ctx: PrefillContext): PrefillOptionGroup[];
}


