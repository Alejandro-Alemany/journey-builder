# Journey Builder (Prefill Mapping Assessment)

This is a small React + TypeScript app that consumes an “action blueprint graph” API response, builds a DAG of forms, and renders a UI for selecting a form and mapping its fields to “prefill” sources. The core of the assessment is the `prefill/` data-source abstraction: sources are pure functions that, given a target field + graph context, produce pickable prefill options. The UI then stores a serializable mapping (`PrefillMapping`) without leaking source-specific shapes. In dev, Vite proxies `/api/*` to a local mock server so the app can run without a real backend.

## Run locally

### Prerequisites

- **Git**: any recent version
- **Node.js**: **v22.x** recommended (any modern Node should work)
- **npm**: comes with Node

If you don’t already have Node installed, one reliable approach on Linux is `nvm`:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 22
nvm use 22
node --version
npm --version
```

### Install dependencies

```bash
git clone <this-repo>
cd journey-builder
npm ci
```

### Start the mock API server (Terminal A)

The frontend expects to call:

- `GET /api/v1/:tenantId/actions/blueprints/:actionBlueprintId/graph`

In dev, `vite.config.ts` proxies `/api/*` to `http://localhost:3000`, so we just need a tiny HTTP server on port 3000 that returns the included fixture (`src/graph/__fixtures__/blueprint-graph.json`).

Run this exactly (it’s a single-file mock server, no deps):

```bash
node --input-type=module - <<'NODE'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fixturePath = path.join(__dirname, 'src/graph/__fixtures__/blueprint-graph.json')
const fixtureRaw = fs.readFileSync(fixturePath, 'utf8')
const fixture = JSON.parse(fixtureRaw)

const server = http.createServer((req, res) => {
  // Basic CORS so fetch works even if proxy is bypassed.
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  const url = new URL(req.url ?? '/', 'http://localhost:3000')
  const match = url.pathname.match(/^\/api\/v1\/[^/]+\/actions\/blueprints\/[^/]+\/graph$/)

  if (req.method === 'GET' && match) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(fixture))
    return
  }

  res.statusCode = 404
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ error: 'not found', path: url.pathname }))
})

server.listen(3000, () => {
  console.log('Mock API listening on http://localhost:3000')
})
NODE
```

### Start the frontend (Terminal B)

```bash
npm run dev
```

Then open the printed URL (typically `http://localhost:5173`). The app will fetch the blueprint graph through the Vite proxy (`/api/...` → `localhost:3000`) and render the forms + prefill mapping UI.

## Architecture

### `src/api/` — parsing + normalization

`src/api/client.ts` owns the fetch for the blueprint graph endpoint and normalizes small top-level shape differences (e.g. some servers return `id`/`name` instead of `blueprint_id`/`blueprint_name`) before parsing. `src/api/schemas.ts` uses Zod to validate the response, but is intentionally permissive for opaque, JSON-schema-like blobs (e.g. `field_schema`, `ui_schema`, dynamic mappings) so small backend changes don’t break the UI.

### `src/graph/` — DAG model of forms

`buildFormGraph` converts the parsed API response into a small `FormGraph` model plus `FormNode` field metadata extracted from `forms[].field_schema.properties`. Importantly, edges are derived from each node’s `data.prerequisites` (treated as the source of truth for ordering), producing a direction of “prereq → dependent”. `FormGraph` provides traversal helpers used by prefill sources (`getDirectParents`, `getTransitiveParents`) and is defensive against bad data (unknown nodes, cycles).

### `src/prefill/` — data-source abstraction

`src/prefill/types.ts` defines the stable “contract” for sources: a `PrefillDataSource` is a pure function (`getOptions`) from `PrefillContext` → groups of `PrefillOption`s. The returned options are intentionally flat + serializable (`PrefillOption` / `PrefillMapping`) so the UI doesn’t store source-specific shapes. `src/prefill/registry.ts` is the only place where sources are registered.

### `src/components/` — rendering the UI

Components render the form list, field tables, and the “choose a prefill” interactions. They treat `FormGraph` and the prefill registry as “data in, UI out” dependencies, and keep state local to the component tree (selected form, mappings) rather than introducing a global state library for this small surface area.

## Extending with a new data source (example: “Tenant Settings”)

To add a new data source, you only do two things:

- Create a new file in `src/prefill/sources/` that exports a `PrefillDataSource`
- Append it to `src/prefill/registry.ts`

No other files change.

### 1) Add `src/prefill/sources/tenantSettings.ts`

```ts
import type { PrefillDataSource } from '../types'

/**
 * Example data source that reads “Tenant Settings” from the existing globals bag.
 * It returns no options when the group is missing.
 */
export const tenantSettingsSource: PrefillDataSource = {
  id: 'tenant-settings',
  label: 'Tenant Settings',
  getOptions: (ctx) => {
    const groupKey = 'tenantSettings'
    const group = ctx.globals[groupKey]
    if (!group) return []

    return [
      {
        groupId: groupKey,
        groupLabel: group.label,
        options: Object.entries(group.fields).map(([fieldId, field]) => ({
          sourceId: 'tenant-settings',
          groupId: groupKey,
          groupLabel: group.label,
          fieldId,
          fieldLabel: field.label,
          fieldType: field.type,
        })),
      },
    ]
  },
}
```

### 2) Append it to `src/prefill/registry.ts` and you’re done

```ts
import { tenantSettingsSource } from './sources/tenantSettings'

export const dataSources = [
  // ...existing sources...
  tenantSettingsSource,
]
```

That’s it: the UI will automatically show the new “Tenant Settings” section anywhere the prefill picker is rendered, because it iterates the registry.

## Testing

Run tests in watch mode:

```bash
npm run test
```

Run tests once (CI-style):

```bash
npm run test:run
```

What’s covered:

- **Graph construction and traversal** (`src/graph/*`), including fixture-based parsing using `src/graph/__fixtures__/blueprint-graph.json`
- **Field extraction rules**, including filtering out non-data fields like `avantos_type: "button"`

What isn’t covered (by design for this assessment):

- Full UI interaction tests for the prefill modal and mapping workflows (the UI is relatively thin over the graph + sources)

## Design decisions

- **Prerequisites over `edges[]`**: the API returns both `edges[]` and `data.prerequisites`; prerequisites encode “what must run before this form” directly, while `edges[]` can be redundant and diverge. The graph builder derives edges from prerequisites as the single source of truth.
- **Permissive Zod for opaque blobs**: many response fields are JSON-schema-like or dynamic maps. Modeling them as strict schemas would be brittle and irrelevant to the prefill-mapping UI, so the parser uses `.loose()` and `z.unknown()` in those areas.
- **No state library**: state needs here are local (selected node, mappings) and naturally scoped to the component tree; adding a global store would increase surface area without improving clarity for this assessment.
