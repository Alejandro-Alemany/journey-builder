import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrefillModal } from "@/components/PrefillModal";
import { FormGraph } from "@/graph/FormGraph";
import type { Edge, FormField, FormNode } from "@/graph/types";
import type { GlobalData } from "@/prefill/types";

function field(id: string, label: string, type = "short-text"): FormField {
  return { id, label, type };
}

function node(id: string, name: string, fields: FormField[]): FormNode {
  return { id, formId: `form-${id}`, name, fields };
}

function edge(from: string, to: string): Edge {
  return { from, to };
}

describe("PrefillModal", () => {
  it("Select button is disabled until an option is selected", async () => {
    const user = userEvent.setup();

    const parent = node("p1", "Form A", [field("p_email", "Parent Email")]);
    const target = node("t1", "Form B", [field("t_email", "Target Email")]);
    const graph = new FormGraph([parent, target], [edge("p1", "t1")]);

    const globals: GlobalData = {
      action_properties: {
        label: "Action Properties",
        fields: {
          action_id: { label: "Action ID", type: "short-text", value: "123" },
        },
      },
    };

    const onPick = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <PrefillModal
        open
        onOpenChange={onOpenChange}
        targetNode={target}
        targetField={target.fields[0]!}
        graph={graph}
        globals={globals}
        onPick={onPick}
      />,
    );

    const selectBtn = screen.getByRole("button", { name: "Select" });
    expect(selectBtn).toBeDisabled();

    // Search auto-expands matching groups; selecting an option enables Select.
    await user.type(screen.getByPlaceholderText("Search..."), "action id");
    await user.click(await screen.findByRole("button", { name: "Action ID" }));

    expect(selectBtn).toBeEnabled();
  });

  it("search filters the tree", async () => {
    const user = userEvent.setup();

    const target = node("t1", "Form B", [field("t_email", "Target Email")]);
    const graph = new FormGraph([target], []);

    const globals: GlobalData = {
      action_properties: {
        label: "Action Properties",
        fields: {
          action_id: { label: "Action ID", type: "short-text", value: "123" },
          action_name: { label: "Action Name", type: "short-text", value: "X" },
        },
      },
    };

    render(
      <PrefillModal
        open
        onOpenChange={() => {}}
        targetNode={target}
        targetField={target.fields[0]!}
        graph={graph}
        globals={globals}
        onPick={() => {}}
      />,
    );

    await user.type(screen.getByPlaceholderText("Search..."), "name");
    expect(screen.getByRole("button", { name: "Action Name" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Action ID" })).toBeNull();
  });

  it("Cancel does not fire onPick", async () => {
    const user = userEvent.setup();

    const target = node("t1", "Form B", [field("t_email", "Target Email")]);
    const graph = new FormGraph([target], []);
    const globals: GlobalData = {};
    const onPick = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <PrefillModal
        open
        onOpenChange={onOpenChange}
        targetNode={target}
        targetField={target.fields[0]!}
        graph={graph}
        globals={globals}
        onPick={onPick}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onPick).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

