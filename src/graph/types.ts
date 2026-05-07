/**
 * A node in the form DAG. The shape your graph layer works with —
 * not the raw API node. Adapt from the API type in a builder function.
 */
export interface FormNode {
    id: string;              // unique within the graph (the node's own id, not the form template id)
    formId: string;          // which form template this node uses
    name: string;            // display name for the modal/list
    fields: FormField[];
  }
  
  export interface FormField {
    id: string;              // stable field id (used in prefill mappings)
    label: string;           // shown in the modal
    type: string;            // "string" | "number" | "boolean" | etc. — used for type compatibility
  }
  
  /**
   * Directed edge: `from` is a prerequisite of `to`.
   * I.e., `to` can prefill its fields from `from`'s submitted values.
   */
  export interface Edge {
    from: string;            // node id
    to: string;              // node id
  }