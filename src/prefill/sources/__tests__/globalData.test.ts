import { describe, expect, it } from "vitest";
import { FormGraph } from "../../../graph/FormGraph";
import type { FormField, FormNode } from "../../../graph/types";
import { globalDataSource } from "../globalData";
import type { GlobalData, PrefillContext } from "../../types";

const field = (id: string, label: string, type: string): FormField => ({
  id,
  label,
  type,
});

const node = (id: string, name: string, fields: FormField[] = []): FormNode => ({
  id,
  formId: `form-${id}`,
  name,
  fields,
});

describe("globalDataSource", () => {
  it("returns one group per globals top-level key", () => {
    const globals: GlobalData = {
      action_properties: {
        label: "Action Properties",
        fields: {
          action_id: { label: "Action ID", type: "short-text", value: "act_1" },
        },
      },
      org: {
        label: "Org",
        fields: {
          org_id: { label: "Org ID", type: "short-text", value: "org_1" },
          org_name: { label: "Org Name", type: "short-text", value: "Acme" },
        },
      },
    };

    const target = node("t", "Target", [field("t1", "T1", "short-text")]);
    const graph = new FormGraph([target], []);

    const ctx: PrefillContext = {
      graph,
      globals,
      targetNode: target,
      targetField: target.fields[0]!,
    };

    const groups = globalDataSource.getOptions(ctx);
    expect(groups.map((g) => g.groupId).sort()).toEqual(["action_properties", "org"]);
  });

  it("produces options for each globals field and sets sourceId correctly", () => {
    const globals: GlobalData = {
      action_properties: {
        label: "Action Properties",
        fields: {
          created_at: { label: "Created At", type: "date", value: "2026-01-15" },
        },
      },
    };

    const target = node("t", "Target", [field("t1", "T1", "short-text")]);
    const graph = new FormGraph([target], []);

    const ctx: PrefillContext = {
      graph,
      globals,
      targetNode: target,
      targetField: target.fields[0]!,
    };

    expect(globalDataSource.getOptions(ctx)).toEqual([
      {
        groupId: "action_properties",
        groupLabel: "Action Properties",
        options: [
          {
            sourceId: "global",
            groupId: "action_properties",
            groupLabel: "Action Properties",
            fieldId: "created_at",
            fieldLabel: "Created At",
            fieldType: "date",
          },
        ],
      },
    ]);
  });

  it("returns [] when globals is empty", () => {
    const globals: GlobalData = {};
    const target = node("t", "Target", [field("t1", "T1", "short-text")]);
    const graph = new FormGraph([target], []);

    const ctx: PrefillContext = {
      graph,
      globals,
      targetNode: target,
      targetField: target.fields[0]!,
    };

    expect(globalDataSource.getOptions(ctx)).toEqual([]);
  });

  it("ignores the graph and target metadata (driven only by globals)", () => {
    const globals: GlobalData = {
      x: {
        label: "X",
        fields: {
          foo: { label: "Foo", type: "short-text", value: "bar" },
        },
      },
    };

    const n1 = node("n1", "N1", [field("a", "A", "short-text")]);
    const n2 = node("n2", "N2", [field("b", "B", "short-text")]);
    const graph = new FormGraph([n1, n2], []);

    const ctx1: PrefillContext = {
      graph,
      globals,
      targetNode: n1,
      targetField: n1.fields[0]!,
    };
    const ctx2: PrefillContext = {
      graph,
      globals,
      targetNode: n2,
      targetField: n2.fields[0]!,
    };

    expect(globalDataSource.getOptions(ctx1)).toEqual(globalDataSource.getOptions(ctx2));
  });
});

