import { z } from 'zod'

/**
 * NOTE:
 * This schema is intentionally permissive in areas where the API returns
 * JSON-schema-like blobs (e.g. `field_schema`, `ui_schema`) or dynamic mappings.
 * Those are modeled as `z.unknown()` / `z.record(z.string(), z.unknown())` so small backend
 * changes don’t break the frontend parser.
 */

const IsoDateStringSchema = z.string()

const EdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
})

// --- Branch condition (example shows a simple binary expression) ---

const ConditionOperandSchema = z
  .object({
    type: z.string(),
  })
  .loose()

const ConditionSchema = z
  .object({
    type: z.string(),
  })
  .loose()

const BranchSchema = z
  .object({
    $schema: z.string().optional(),
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    tenant_id: z.string().optional(),
    condition: z
      .object({
        type: z.literal('binary').or(z.string()),
        operator: z.string(),
        left: ConditionOperandSchema,
        right: ConditionOperandSchema,
      })
      .loose()
      .or(ConditionSchema)
      .optional(),
    created_at: IsoDateStringSchema.optional(),
    created_by: z.string().optional(),
    updated_at: IsoDateStringSchema.optional(),
  })
  .loose()

// --- Reusable “mapping” shapes used widely in the response ---

const ComponentRefSchema = z
  .object({
    type: z.string(),
    component_key: z.string().optional(),
    output_key: z.string().optional(),
    is_metadata: z.boolean().optional(),
  })
  .loose()

const KeyValueUnknownRecordSchema = z.record(z.string(), z.unknown())

// --- Forms ---

const DynamicFieldConfigPayloadFieldSchema = z
  .object({
    component_key: z.string().optional(),
    is_metadata: z.boolean().optional(),
    output_key: z.string().optional(),
    type: z.string().optional(),
  })
  .loose()

const DynamicFieldConfigEntrySchema = z
  .object({
    endpoint_id: z.string().optional(),
    selector_field: z.string().optional(),
    output_key: z.string().optional(),
    no_results_message: z.string().optional(),
    payload_fields: z
      .record(z.string(), DynamicFieldConfigPayloadFieldSchema)
      .optional(),
    child_form_javascript: KeyValueUnknownRecordSchema.optional(),
    e_signature_mappings: KeyValueUnknownRecordSchema.optional(),
    pdf_preview_payloads: KeyValueUnknownRecordSchema.optional(),
  })
  .loose()

const EmbeddedJsSchema = z
  .object({
    prefix: z.string().optional(),
    custom_javascript: z.string().optional(),
    custom_javascript_functions: z.string().optional(),
    triggering_fields: z.array(z.string()).optional(),
    imported_js_function_config: z.array(KeyValueUnknownRecordSchema).optional(),
  })
  .loose()

const FormSchema = z
  .object({
    $schema: z.string().optional(),
    id: z.string(),
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    created_at: IsoDateStringSchema.optional(),
    created_by: z.string().optional(),
    updated_at: IsoDateStringSchema.optional(),

    is_reusable: z.boolean().optional(),

    // JS-related fields
    custom_javascript: z.string().nullable().optional(),
    custom_javascript_execute_on_load: z.boolean().optional(),
    custom_javascript_functions: z.string().nullable().optional(),
    custom_javascript_triggering_fields: z.array(z.string()).optional(),
    embedded_js: z.array(EmbeddedJsSchema).optional(),
    imported_js_function_config: z.array(KeyValueUnknownRecordSchema).optional(),

    // Mappings
    default_input_mapping: z.record(z.string(), z.unknown()).optional(),
    default_output_mapping: z.record(z.string(), z.unknown()).optional(),

    // Schema-ish blobs (JSON Schema / JsonForms)
    field_schema: z.unknown().optional(),
    ui_schema: z.unknown().optional(),

    dynamic_field_config: z.record(z.string(), DynamicFieldConfigEntrySchema).optional(),
  })
  .loose()

// --- Triggers ---

const TriggerErrorMessageTemplateSchema = z
  .object({
    message: z.string(),
    pattern: z.string(),
  })
  .loose()

const TriggerSchema = z
  .object({
    $schema: z.string().optional(),
    id: z.string(),
    name: z.string().optional(),
    created_at: IsoDateStringSchema.optional(),
    updated_at: IsoDateStringSchema.optional(),

    trigger_service_id: z.string().optional(),
    request_method: z.string().optional(),
    timeout_seconds: z.number().optional(),

    path_template: z.string().optional(),
    path_template_variables: z.array(z.string()).optional(),
    payload_type: z.string().optional(),
    payload_template: z.record(z.string(), z.unknown()).optional(),
    payload_template_variables: z.array(z.string()).optional(),
    query_parameter_template: z.record(z.string(), z.unknown()).optional(),
    query_parameter_template_variables: z.array(z.string()).optional(),
    custom_headers_template: z.record(z.string(), z.unknown()).optional(),
    custom_headers_template_variables: z.array(z.string()).optional(),

    output_mapping: z.record(z.string(), z.unknown()).optional(),
    error_message_template: z.array(TriggerErrorMessageTemplateSchema).optional(),
  })
  .loose()

// --- State model schema (high-level) ---

const StateSchema = z
  .object({
    name: z.string(),
    display_name: z.string().optional(),
    display_color: z.string().optional(),
    description: z.string().optional(),
    is_final: z.boolean().optional(),
    is_required: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .loose()

const TransitionSchema = z
  .object({
    key: z.string(),
    display_name: z.string().optional(),
    from_states: z.array(z.string()).optional(),
    to_state: z.string().optional(),
    priority: z.number().optional(),
    input_schema: z.array(z.unknown()).optional(),
    condition: ComponentRefSchema.optional(),
    trigger: z.unknown().optional(),
    on_transition: z.unknown().optional(),
  })
  .loose()

const StateModelSchemaSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    initial_state: z.string().optional(),
    data_schema: z.unknown().optional(),
    states: z.array(StateSchema).optional(),
    transitions: z.array(TransitionSchema).optional(),
  })
  .loose()

// --- Node data (very wide; keep permissive but capture common fields) ---

const DurationSchema = z
  .object({
    number: z.number(),
    unit: z.string(),
  })
  .loose()

const DlSourceSchema = z
  .object({
    kind: z.string().optional(),
    path: z.string().optional(),
    field: z.string().optional(),
  })
  .loose()

const DlInputMappingEntrySchema = z
  .object({
    type: z.string(),
    source: DlSourceSchema.optional(),
  })
  .loose()

const DlWritebackTargetSchema = z
  .object({
    path: z.string().optional(),
    anchor: z
      .object({
        field: z.string().optional(),
        id_field: z.string().optional(),
      })
      .loose()
      .optional(),
  })
  .loose()

const DlOutputMappingEntrySchema = z
  .object({
    type: z.string(),
    source: z.object({ field: z.string() }).loose().optional(),
    target: DlWritebackTargetSchema.optional(),
  })
  .loose()

const DbOutputMappingEntrySchema = z
  .object({
    table: z.string().optional(),
    column: z.string().optional(),
    record_id: ComponentRefSchema.optional(),
    validation: ComponentRefSchema.optional(),
  })
  .loose()

const OutputMappingEntrySchema = z
  .object({
    parent_output_key: z.string().optional(),
    child_component_key: z.string().optional(),
    child_output_key: z.string().optional(),
  })
  .loose()

const NodeDataSchema = z
  .object({
    // Component identity
    id: z.string().optional(),
    name: z.string().optional(),
    component_id: z.string().optional(),
    component_key: z.string().optional(),
    component_type: z.string().optional(),

    // Relationships / composition
    child_components: z.array(z.string()).optional(),

    // Scheduling / SLA
    scheduled_delay: DurationSchema.optional(),
    sla_duration: DurationSchema.optional(),

    // Mappings (these are frequently “record-of-record” shapes)
    input_mapping: z.record(z.string(), ComponentRefSchema).optional(),
    output_mapping: z.array(OutputMappingEntrySchema).optional(),
    db_output_mapping: z
      .record(z.string(), DbOutputMappingEntrySchema)
      .optional(),
    dl_input_mapping: z.record(z.string(), DlInputMappingEntrySchema).optional(),
    dl_output_mapping: z.record(z.string(), DlOutputMappingEntrySchema).optional(),

    // Various config flags / misc
    hidden: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    task_tags: z.array(z.string()).optional(),
    permitted_roles: z.array(z.string()).optional(),
    visibility_roles: z.array(z.string()).optional(),
    prerequisites: z.array(z.string()).optional(),

    // Expressions / runtime strings
    expression: z.string().optional(),
    run_name: z.string().optional(),
    run_context: z.string().optional(),
    section_name: z.string().optional(),
  })
  .loose()

const NodeSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    hidden: z.boolean().optional(),
    position: z
      .object({
        x: z.number(),
        y: z.number(),
      })
      .loose(),
    data: NodeDataSchema,
  })
  .loose()

// --- Top-level response ---

export const ActionBlueprintGraphResponseSchema = z
  .object({
    $schema: z.string().optional(),

    tenant_id: z.string(),

    blueprint_id: z.string(),
    blueprint_name: z.string().optional(),

    version_id: z.string(),
    version_number: z.string().optional(),
    version_notes: z.string().nullable().optional(),

    status: z.string().optional(),

    edges: z.array(EdgeSchema),
    nodes: z.array(NodeSchema),

    branches: z.array(BranchSchema).optional(),
    forms: z.array(FormSchema).optional(),
    triggers: z.array(TriggerSchema).optional(),

    promoted_data_order: z.array(z.string()).optional(),
    component_task_priorities: z.record(z.string(), z.string()).optional(),

    custom_javascript_function_id: z.string().nullable().optional(),
    custom_status_configuration: z.unknown().nullable().optional(),

    state_model_schema: StateModelSchemaSchema.optional(),
  })
  .loose()

export type ActionBlueprintGraphResponse = z.infer<
  typeof ActionBlueprintGraphResponseSchema
>

