
import { describe, it, expect } from "vitest";
import { FormGraph } from "./FormGraph";
import type { FormNode, Edge } from "./types";

const node = (id: string): FormNode => ({
  id,
  formId: `form-${id}`,
  name: `Form ${id.toUpperCase()}`,
  fields: [],
});

const edge = (from: string, to: string): Edge => ({ from, to });

describe("FormGraph", () => {
  describe("getDirectParents", () => {
    it("returns immediate upstream nodes", () => {
      // A -> B -> D, C -> D
      const g = new FormGraph(
        [node("a"), node("b"), node("c"), node("d")],
        [edge("a", "b"), edge("b", "d"), edge("c", "d")],
      );
      expect(g.getDirectParents("d").map((n) => n.id).sort()).toEqual(["b", "c"]);
    });

    it("returns [] for a root node", () => {
      const g = new FormGraph([node("a")], []);
      expect(g.getDirectParents("a")).toEqual([]);
    });

    it("returns [] for an unknown node id", () => {
      const g = new FormGraph([node("a")], []);
      expect(g.getDirectParents("nonexistent")).toEqual([]);
    });
  });

  describe("getTransitiveParents", () => {
    it("returns ancestors but excludes direct parents", () => {
      // A -> B -> D
      const g = new FormGraph(
        [node("a"), node("b"), node("d")],
        [edge("a", "b"), edge("b", "d")],
      );
      const result = g.getTransitiveParents("d").map((n) => n.id);
      expect(result).toEqual(["a"]);
    });

    it("walks multiple levels", () => {
      // A -> B -> C -> D
      const g = new FormGraph(
        [node("a"), node("b"), node("c"), node("d")],
        [edge("a", "b"), edge("b", "c"), edge("c", "d")],
      );
      expect(g.getTransitiveParents("d").map((n) => n.id).sort()).toEqual(["a", "b"]);
    });

    it("handles diamonds without duplicates", () => {
      //   A
      //  / \
      // B   C
      //  \ /
      //   D
      const g = new FormGraph(
        [node("a"), node("b"), node("c"), node("d")],
        [edge("a", "b"), edge("a", "c"), edge("b", "d"), edge("c", "d")],
      );
      expect(g.getTransitiveParents("d").map((n) => n.id)).toEqual(["a"]);
    });
  });

  describe("getAllAncestors", () => {
    it("returns direct + transitive ancestors", () => {
      // A -> B -> D
      const g = new FormGraph(
        [node("a"), node("b"), node("d")],
        [edge("a", "b"), edge("b", "d")],
      );
      expect(g.getAllAncestors("d").map((n) => n.id).sort()).toEqual(["a", "b"]);
    });
  });

  describe("constructor", () => {
    it("ignores edges referencing unknown nodes", () => {
      const g = new FormGraph(
        [node("a")],
        [edge("a", "ghost")],
      );
      expect(g.getDirectParents("a")).toEqual([]);
    });
  });
});