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

  // The local backend stub may omit some top-level identifiers.
  // Fill them from request params so the rest of the response can still be validated.
  const normalized: unknown =
    json && typeof json === 'object'
      ? {
          tenant_id: params.tenantId,
          blueprint_id: params.actionBlueprintId,
          version_id: params.blueprintVersionId ?? 'stub',
          ...(json as Record<string, unknown>),
        }
      : json

  return ActionBlueprintGraphResponseSchema.parse(normalized)
}

