import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractFieldsFromFormTemplate } from "./buildFormGraph";

describe("extractFieldsFromFormTemplate", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("extracts id/label/type correctly for a typical field", () => {
    const template = {
      field_schema: {
        properties: {
          email: {
            avantos_type: "short-text",
            format: "email",
            title: "Email",
            type: "string",
          },
        },
      },
    };

    expect(extractFieldsFromFormTemplate(template)).toEqual([
      { id: "email", label: "Email", type: "short-text" },
    ]);
  });

  it("falls back to field key when title is missing", () => {
    const template = {
      field_schema: {
        properties: {
          dynamic_checkbox_group: {
            avantos_type: "checkbox-group",
            type: "array",
          },
        },
      },
    };

    expect(extractFieldsFromFormTemplate(template)).toEqual([
      {
        id: "dynamic_checkbox_group",
        label: "dynamic_checkbox_group",
        type: "checkbox-group",
      },
    ]);
  });

  it("prefers avantos_type over JSON Schema type", () => {
    const template = {
      field_schema: {
        properties: {
          foo: { avantos_type: "long-text", type: "string", title: "Foo" },
        },
      },
    };

    expect(extractFieldsFromFormTemplate(template)[0]?.type).toBe("long-text");
  });

  it('returns "unknown" when neither type field is present', () => {
    const template = {
      field_schema: {
        properties: {
          mystery: { title: "Mystery" },
        },
      },
    };

    expect(extractFieldsFromFormTemplate(template)).toEqual([
      { id: "mystery", label: "Mystery", type: "unknown" },
    ]);
  });

  it('skips fields with avantos_type: "button"', () => {
    const template = {
      field_schema: {
        properties: {
          button: { avantos_type: "button", title: "Button", type: "object" },
          email: { avantos_type: "short-text", title: "Email", type: "string" },
        },
      },
    };

    expect(extractFieldsFromFormTemplate(template)).toEqual([
      { id: "email", label: "Email", type: "short-text" },
    ]);
  });

  it("skips non-object property defs without throwing", () => {
    const template = {
      field_schema: {
        properties: {
          ok: { avantos_type: "short-text", title: "OK", type: "string" },
          bad: "nope",
        },
      },
    };

    const fields = extractFieldsFromFormTemplate(template);
    expect(fields).toEqual([{ id: "ok", label: "OK", type: "short-text" }]);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("returns [] for missing/malformed field_schema", () => {
    expect(extractFieldsFromFormTemplate({})).toEqual([]);
    expect(extractFieldsFromFormTemplate({ field_schema: null })).toEqual([]);
    expect(extractFieldsFromFormTemplate({ field_schema: { properties: null } })).toEqual(
      [],
    );
  });

  it("returns [] for null/non-object input", () => {
    expect(extractFieldsFromFormTemplate(null)).toEqual([]);
    expect(extractFieldsFromFormTemplate("nope")).toEqual([]);
    expect(extractFieldsFromFormTemplate(123)).toEqual([]);
  });
});

