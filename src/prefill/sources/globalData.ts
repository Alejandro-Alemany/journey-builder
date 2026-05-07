import type { PrefillDataSource } from "../types";

export const globalDataSource: PrefillDataSource = {
  id: "global",
  label: "Global Data",
  getOptions: (ctx) => {
    return Object.entries(ctx.globals).map(([groupKey, group]) => ({
      groupId: groupKey,
      groupLabel: group.label,
      options: Object.entries(group.fields).map(([fieldId, field]) => ({
        sourceId: "global",
        groupId: groupKey,
        groupLabel: group.label,
        fieldId,
        fieldLabel: field.label,
        fieldType: field.type,
      })),
    }));
  },
};


