import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePrefillMappings } from "./usePrefillMappings";
import type { PrefillOption } from "../prefill/types";

const opt = (overrides: Partial<PrefillOption> = {}): PrefillOption => ({
  sourceId: "global",
  groupId: "action_properties",
  groupLabel: "Action Properties",
  fieldId: "action_id",
  fieldLabel: "Action ID",
  fieldType: "short-text",
  ...overrides,
});

describe("usePrefillMappings", () => {
  it("getMapping returns undefined for a non-existent mapping", () => {
    const { result } = renderHook(() => usePrefillMappings());
    expect(result.current.getMapping("n1", "f1")).toBeUndefined();
  });

  it("setMapping adds a mapping; getMapping finds it", () => {
    const { result } = renderHook(() => usePrefillMappings());

    act(() => {
      result.current.setMapping("n1", "f1", opt({ fieldId: "x" }));
    });

    const mapping = result.current.getMapping("n1", "f1");
    expect(mapping).toEqual({
      targetNodeId: "n1",
      targetFieldId: "f1",
      source: opt({ fieldId: "x" }),
    });
  });

  it("setMapping overwrites an existing mapping for the same (nodeId, fieldId)", () => {
    const { result } = renderHook(() => usePrefillMappings());

    act(() => {
      result.current.setMapping("n1", "f1", opt({ fieldId: "a" }));
      result.current.setMapping("n1", "f1", opt({ fieldId: "b" }));
    });

    expect(result.current.getMapping("n1", "f1")?.source.fieldId).toBe("b");
  });

  it("setMapping does not affect mappings for other (nodeId, fieldId) pairs", () => {
    const { result } = renderHook(() => usePrefillMappings());

    act(() => {
      result.current.setMapping("n1", "f1", opt({ fieldId: "a" }));
      result.current.setMapping("n2", "f1", opt({ fieldId: "b" }));
      result.current.setMapping("n1", "f2", opt({ fieldId: "c" }));
    });

    expect(result.current.getMapping("n1", "f1")?.source.fieldId).toBe("a");
    expect(result.current.getMapping("n2", "f1")?.source.fieldId).toBe("b");
    expect(result.current.getMapping("n1", "f2")?.source.fieldId).toBe("c");
  });

  it("clearMapping removes a mapping", () => {
    const { result } = renderHook(() => usePrefillMappings());

    act(() => {
      result.current.setMapping("n1", "f1", opt({ fieldId: "a" }));
    });
    expect(result.current.getMapping("n1", "f1")).toBeDefined();

    act(() => {
      result.current.clearMapping("n1", "f1");
    });
    expect(result.current.getMapping("n1", "f1")).toBeUndefined();
  });

  it("clearMapping is a no-op for non-existent mappings", () => {
    const { result } = renderHook(() => usePrefillMappings());

    act(() => {
      result.current.clearMapping("n1", "f1");
    });

    expect(result.current.getMapping("n1", "f1")).toBeUndefined();
  });
});

