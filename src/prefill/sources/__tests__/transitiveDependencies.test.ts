import { describe, expect, it } from "vitest";
import { FormGraph } from "../../../graph/FormGraph";
import type { Edge, FormField, FormNode } from "../../../graph/types";
import { transitiveDependenciesSource } from "../transitiveDependencies";
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

describe("transitiveDependenciesSource", () => {
  it("returns transitive parents but excludes direct parents", () => {
    // A -> B -> D
    const a = node("a", "Form A", [field("a1", "A1", "short-text")]);
    const b = node("b", "Form B", [field("b1", "B1", "number")]);
    const d = node("d", "Form D", [field("d1", "D1", "short-text")]);
    const graph = new FormGraph(
      [a, b, d],
      [edge("a", "b"), edge("b", "d")],
    );

    const ctx: PrefillContext = {
      graph,
      globals: emptyGlobals,
      targetNode: d,
      targetField: d.fields[0]!,
    };

    const groups = transitiveDependenciesSource.getOptions(ctx);
    expect(groups.map((g) => g.groupId)).toEqual(["a"]);
    expect(groups[0]!.options).toEqual([
      {
        sourceId: "transitive-deps",
        groupId: "a",
        groupLabel: "Form A",
        fieldId: "a1",
        fieldLabel: "A1",
        fieldType: "short-text",
      },
    ]);
  });

  it("walks multiple levels", () => {
    // A -> B -> C -> D
    const a = node("a", "A", [field("a1", "A1", "short-text")]);
    const b = node("b", "B", [field("b1", "B1", "short-text")]);
    const c = node("c", "C", [field("c1", "C1", "short-text")]);
    const d = node("d", "D", [field("d1", "D1", "short-text")]);
    const graph = new FormGraph(
      [a, b, c, d],
      [edge("a", "b"), edge("b", "c"), edge("c", "d")],
    );

    const ctx: PrefillContext = {
      graph,
      globals: emptyGlobals,
      targetNode: d,
      targetField: d.fields[0]!,
    };

    const groups = transitiveDependenciesSource.getOptions(ctx);
    expect(groups.map((g) => g.groupId).sort()).toEqual(["a", "b"]);
  });

  it("returns [] when there are no transitive parents", () => {
    // A -> D (direct only)
    const a = node("a", "A", [field("a1", "A1", "short-text")]);
    const d = node("d", "D", [field("d1", "D1", "short-text")]);
    const graph = new FormGraph([a, d], [edge("a", "d")]);

    const ctx: PrefillContext = {
      graph,
      globals: emptyGlobals,
      targetNode: d,
      targetField: d.fields[0]!,
    };

    expect(transitiveDependenciesSource.getOptions(ctx)).toEqual([]);
  });

  it("sets sourceId correctly on every option", () => {
    // A -> B -> D
    const a = node("a", "A", [field("a1", "A1", "short-text")]);
    const b = node("b", "B", [field("b1", "B1", "short-text")]);
    const d = node("d", "D", [field("d1", "D1", "short-text")]);
    const graph = new FormGraph(
      [a, b, d],
      [edge("a", "b"), edge("b", "d")],
    );

    const ctx: PrefillContext = {
      graph,
      globals: emptyGlobals,
      targetNode: d,
      targetField: d.fields[0]!,
    };

    const groups = transitiveDependenciesSource.getOptions(ctx);
    const allOptions = groups.flatMap((g) => g.options);
    expect(allOptions.length).toBeGreaterThan(0);
    expect(allOptions.every((o) => o.sourceId === "transitive-deps")).toBe(true);
  });
});

