import type { GlobalData } from "./types";

/**
 * Mock global data. In production this would come from the API.
 * The assessment explicitly allows using whatever global data we want.
 */
export const mockGlobals: GlobalData = {
  action_properties: {
    label: "Action Properties",
    fields: {
      action_id: { label: "Action ID", type: "short-text", value: "act_001" },
      created_at: { label: "Created At", type: "date", value: "2026-01-15" },
    },
  },
  client_organization: {
    label: "Client Organization",
    fields: {
      org_name: {
        label: "Organization Name",
        type: "short-text",
        value: "Acme Corp",
      },
      org_id: { label: "Organization ID", type: "short-text", value: "org_abc" },
    },
  },
};

