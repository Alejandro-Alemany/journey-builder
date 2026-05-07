import { describe, expect, it } from "vitest";
import { FormGraph } from "../../../graph/FormGraph";
import type { Edge, FormField, FormNode } from "../../../graph/types";
import { directDependenciesSource } from "../directDependencies";
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

const edge = (from: string, to: string): Edge => ({ from, to });

const emptyGlobals: GlobalData = {};

describe("directDependenciesSource", () => {
  it("returns one group per direct parent node", () => {
    // B -> D, C -> D
    const b = node("b", "Form B", [field("b_email", "B Email", "short-text")]);
    const c = node("c", "Form C", [
      field("c_phone", "C Phone", "short-text"),
      field("c_age", "C Age", "number"),
    ]);
    const d = node("d", "Form D", [field("d_target", "D Target", "short-text")]);

    const graph = new FormGraph([b, c, d], [edge("b", "d"), edge("c", "d")]);

    const ctx: PrefillContext = {
      graph,
      globals: emptyGlobals,
      targetNode: d,
      targetField: d.fields[0]!,
    };

    const groups = directDependenciesSource.getOptions(ctx);
    expect(groups.map((g) => g.groupId).sort()).toEqual(["b", "c"]);

    const groupB = groups.find((g) => g.groupId === "b")!;
    expect(groupB.groupLabel).toBe("Form B");
    expect(groupB.options).toEqual([
      {
        sourceId: "direct-deps",
        groupId: "b",
        groupLabel: "Form B",
        fieldId: "b_email",
        fieldLabel: "B Email",
        fieldType: "short-text",
      },
    ]);

    const groupC = groups.find((g) => g.groupId === "c")!;
    expect(groupC.options.map((o) => o.fieldId).sort()).toEqual([
      "c_age",
      "c_phone",
    ]);
  });

  it("returns [] when the target node has no direct parents", () => {
    const a = node("a", "Form A", [field("a1", "A1", "short-text")]);
    const graph = new FormGraph([a], []);

    const ctx: PrefillContext = {
      graph,
      globals: emptyGlobals,
      targetNode: a,
      targetField: a.fields[0]!,
    };

    expect(directDependenciesSource.getOptions(ctx)).toEqual([]);
  });

  it("sets sourceId correctly on every option", () => {
    const parent = node("p", "Parent", [
      field("p1", "P1", "short-text"),
      field("p2", "P2", "number"),
    ]);
    const child = node("c", "Child", [field("c1", "C1", "short-text")]);
    const graph = new FormGraph([parent, child], [edge("p", "c")]);

    const ctx: PrefillContext = {
      graph,
      globals: emptyGlobals,
      targetNode: child,
      targetField: child.fields[0]!,
    };

    const groups = directDependenciesSource.getOptions(ctx);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.options.every((o) => o.sourceId === "direct-deps")).toBe(
      true,
    );
  });

  it("returns an empty options array for a parent with no fields", () => {
    const parent = node("p", "Parent", []);
    const child = node("c", "Child", [field("c1", "C1", "short-text")]);
    const graph = new FormGraph([parent, child], [edge("p", "c")]);

    const ctx: PrefillContext = {
      graph,
      globals: emptyGlobals,
      targetNode: child,
      targetField: child.fields[0]!,
    };

    const groups = directDependenciesSource.getOptions(ctx);
    expect(groups).toEqual([
      { groupId: "p", groupLabel: "Parent", options: [] },
    ]);
  });
});

