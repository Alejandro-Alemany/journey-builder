import { describe, it, expect } from "vitest";
import { buildFormGraph, extractFieldsFromFormTemplate } from "./buildFormGraph";
import { BlueprintGraphSchema } from "../api/schemas";
import fixture from "./__fixtures__/blueprint-graph.json";

describe("buildFormGraph (real API fixture)", () => {
  const parsed = BlueprintGraphSchema.parse(fixture);
  const graph = buildFormGraph(parsed);
  const byName = (name: string) => graph.getAllNodes().find((n) => n.name === name)!;

  it("parses the fixture without throwing", () => {
    expect(parsed.nodes.length).toBeGreaterThan(0);
  });

  it("Form D has Form B as direct parent and Form A as transitive ancestor", () => {
    const formD = byName("Form D");
    expect(graph.getDirectParents(formD.id).map((n) => n.name)).toEqual(["Form B"]);
    expect(graph.getTransitiveParents(formD.id).map((n) => n.name)).toEqual([
      "Form A",
    ]);
  });

  it("Form F has Form D and Form E as direct parents", () => {
    const formF = byName("Form F");
    expect(graph.getDirectParents(formF.id).map((n) => n.name).sort()).toEqual([
      "Form D",
      "Form E",
    ]);
  });

  it("excludes the button avantos_type from extracted fields", () => {
    const fields = extractFieldsFromFormTemplate(fixture.forms[0]);
    expect(fields.map((f) => f.id)).not.toContain("button");
  });
});

