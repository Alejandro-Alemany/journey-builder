import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormField, FormNode } from "@/graph/types";
import { FormGraph } from "@/graph/FormGraph";
import type { GlobalData, PrefillMapping, PrefillOption } from "@/prefill/types";
import type { PrefillMappingsApi } from "@/hooks/usePrefillMappings";
import { PrefillPanel } from "@/components/PrefillPanel";

function field(id: string, label: string, type = "short-text"): FormField {
  return { id, label, type };
}

function node(id: string, name: string, fields: FormField[]): FormNode {
  return { id, formId: `form-${id}`, name, fields };
}

function createMappingsApi(
  initial: PrefillMapping[] = [],
): PrefillMappingsApi & {
  setMapping: ReturnType<typeof vi.fn>;
  clearMapping: ReturnType<typeof vi.fn>;
} {
  const byKey = new Map<string, PrefillMapping>();
  for (const m of initial) byKey.set(`${m.targetNodeId}:${m.targetFieldId}`, m);

  return {
    getMapping: (nodeId, fieldId) => byKey.get(`${nodeId}:${fieldId}`),
    setMapping: vi.fn(),
    clearMapping: vi.fn(),
  };
}

describe("PrefillPanel", () => {
  it("clicking an unmapped field opens the modal", async () => {
    const user = userEvent.setup();

    const n = node("n1", "Form 1", [field("f1", "Email")]);
    const graph = new FormGraph([n], []);
    const globals: GlobalData = {};
    const mappingsApi = createMappingsApi();

    render(
      <PrefillPanel node={n} graph={graph} globals={globals} mappingsApi={mappingsApi} />,
    );

    await user.click(screen.getByText("Email"));
    expect(screen.getByText("Select data element to map")).toBeInTheDocument();
  });

  it("mapped state renders source group + field label", () => {
    const n = node("n1", "Form 1", [field("f1", "Email")]);
    const graph = new FormGraph([n], []);
    const globals: GlobalData = {};

    const source: PrefillOption = {
      sourceId: "global",
      groupId: "action_properties",
      groupLabel: "Action Properties",
      fieldId: "action_id",
      fieldLabel: "Action ID",
      fieldType: "short-text",
    };

    const mappingsApi = createMappingsApi([
      { targetNodeId: "n1", targetFieldId: "f1", source },
    ]);

    render(
      <PrefillPanel node={n} graph={graph} globals={globals} mappingsApi={mappingsApi} />,
    );

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText(/Action Properties/)).toBeInTheDocument();
    expect(screen.getByText(/Action ID/)).toBeInTheDocument();
  });

  it("clicking X clears a mapping", async () => {
    const user = userEvent.setup();

    const n = node("n1", "Form 1", [field("f1", "Email")]);
    const graph = new FormGraph([n], []);
    const globals: GlobalData = {};
    const mappingsApi = createMappingsApi([
      {
        targetNodeId: "n1",
        targetFieldId: "f1",
        source: {
          sourceId: "global",
          groupId: "action_properties",
          groupLabel: "Action Properties",
          fieldId: "action_id",
          fieldLabel: "Action ID",
          fieldType: "short-text",
        },
      },
    ]);

    render(
      <PrefillPanel node={n} graph={graph} globals={globals} mappingsApi={mappingsApi} />,
    );

    await user.click(screen.getByLabelText("Clear mapping for Email"));
    expect(mappingsApi.clearMapping).toHaveBeenCalledWith("n1", "f1");
  });
});

