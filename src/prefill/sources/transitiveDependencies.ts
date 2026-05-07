import type { PrefillDataSource } from "../types";

export const transitiveDependenciesSource: PrefillDataSource = {
  id: "transitive-deps",
  label: "Transitive Dependencies",
  getOptions: (ctx) => {
    const parents = ctx.graph.getTransitiveParents(ctx.targetNode.id);
    return parents.map((parent) => ({
      groupId: parent.id,
      groupLabel: parent.name,
      options: parent.fields.map((f) => ({
        sourceId: "transitive-deps",
        groupId: parent.id,
        groupLabel: parent.name,
        fieldId: f.id,
        fieldLabel: f.label,
        fieldType: f.type,
      })),
    }));
  },
};


