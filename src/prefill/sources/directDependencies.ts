import type { PrefillDataSource } from "../types";

export const directDependenciesSource: PrefillDataSource = {
  id: "direct-deps",
  label: "Direct Dependencies",
  getOptions: (ctx) => {
    const parents = ctx.graph.getDirectParents(ctx.targetNode.id);
    return parents.map((parent) => ({
      groupId: parent.id,
      groupLabel: parent.name,
      options: parent.fields.map((f) => ({
        sourceId: "direct-deps",
        groupId: parent.id,
        groupLabel: parent.name,
        fieldId: f.id,
        fieldLabel: f.label,
        fieldType: f.type,
      })),
    }));
  },
};


