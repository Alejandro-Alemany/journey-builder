import {
  ActionBlueprintGraphResponseSchema,
  type ActionBlueprintGraphResponse,
} from './schemas'

export type FetchBlueprintGraphParams = {
  tenantId: string
  actionBlueprintId: string
  /**
   * NOTE: The current backend stub serves a single graph per blueprint and
   * does not include a version segment in the route.
   */
  blueprintVersionId?: string

  /**
   * Optional bearer token. If omitted, no Authorization header is sent.
   */
  token?: string

  /**
   * Override the base URL. Defaults to `import.meta.env.VITE_API_BASE_URL`.
   * Example: "https://admin-ui.dev-sandbox.workload.avantos-ai.net"
   */
  baseUrl?: string

  /**
   * Optional AbortSignal for request cancellation.
   */
  signal?: AbortSignal
}

async function readErrorBody(res: Response): Promise<string | undefined> {
  try {
    const text = await res.text()
    return text || undefined
  } catch {
    return undefined
  }
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

export async function fetchBlueprintGraph(
  params: FetchBlueprintGraphParams,
): Promise<ActionBlueprintGraphResponse> {
  const baseUrl = params.baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? ''
  if (import.meta.env.PROD && !baseUrl) {
    throw new Error('Missing API base URL. Set VITE_API_BASE_URL.')
  }

  const url = joinUrl(
    baseUrl,
    `/api/v1/${encodeURIComponent(params.tenantId)}/actions/blueprints/${encodeURIComponent(
      params.actionBlueprintId,
    )}/graph`,
  )

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
      Accept: 'application/json',
    },
    signal: params.signal,
  })

  if (!res.ok) {
    const body = await readErrorBody(res)
    throw new Error(
      `fetchBlueprintGraph failed: ${res.status} ${res.statusText}${
        body ? `\n${body}` : ''
      }`,
    )
  }

  const json: unknown = await res.json()

  // Backends differ slightly in top-level identifiers:
  // - canonical: { tenant_id, blueprint_id, blueprint_name, version_id, ... }
  // - some servers: { tenant_id, id, name, description, category, ... } (no version_id)
  //
  // Normalize to the canonical shape before Zod parsing.
  const normalized: unknown =
    json && typeof json === 'object'
      ? (() => {
          const obj = json as Record<string, unknown>

          const tenant_id =
            (typeof obj.tenant_id === 'string' ? obj.tenant_id : undefined) ??
            params.tenantId

          const blueprint_id =
            (typeof obj.blueprint_id === 'string'
              ? obj.blueprint_id
              : undefined) ??
            (typeof obj.id === 'string' ? obj.id : undefined) ??
            params.actionBlueprintId

          const blueprint_name =
            (typeof obj.blueprint_name === 'string'
              ? obj.blueprint_name
              : undefined) ?? (typeof obj.name === 'string' ? obj.name : undefined)

          return {
            tenant_id,
            blueprint_id,
            ...(blueprint_name ? { blueprint_name } : {}),
            ...obj,
          }
        })()
      : json

  return ActionBlueprintGraphResponseSchema.parse(normalized)
}

