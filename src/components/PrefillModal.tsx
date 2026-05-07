import { useEffect, useMemo, useState } from "react";
import type {
  GlobalData,
  PrefillContext,
  PrefillOption,
  PrefillOptionGroup,
} from "@/prefill/types";
import type { FormGraph } from "@/graph/FormGraph";
import type { FormField, FormNode } from "@/graph/types";
import { dataSources } from "@/prefill/registry";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetNode: FormNode;
  targetField: FormField;
  graph: FormGraph;
  globals: GlobalData;
  onPick: (option: PrefillOption) => void;
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

export function PrefillModal({
  open,
  onOpenChange,
  targetNode,
  targetField,
  graph,
  globals,
  onPick,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<PrefillOption | null>(
    null,
  );
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedOption(null);
    setExpandedGroupIds(new Set());
    setSearchQuery("");
  }, [open]);

  const allGroups: PrefillOptionGroup[] = useMemo(() => {
    const ctx: PrefillContext = { targetNode, targetField, graph, globals };
    return dataSources.flatMap((s) => s.getOptions(ctx));
  }, [targetNode, targetField, graph, globals]);

  const q = normalizeQuery(searchQuery);

  const filteredGroups = useMemo(() => {
    if (!q) return allGroups;
    return allGroups
      .map((g) => ({
        ...g,
        options: g.options.filter((o) =>
          o.fieldLabel.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.options.length > 0);
  }, [allGroups, q]);

  const autoExpandedIds = useMemo(() => {
    if (!q) return null;
    return new Set(filteredGroups.map((g) => g.groupId));
  }, [filteredGroups, q]);

  function isExpanded(groupId: string): boolean {
    if (autoExpandedIds) return autoExpandedIds.has(groupId);
    return expandedGroupIds.has(groupId);
  }

  function toggleGroup(groupId: string) {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[560px] w-[90vw] max-w-5xl flex-col gap-0 p-0 sm:max-w-5xl"
        showCloseButton
      >
        <DialogHeader className="border-b p-6 pb-4">
          <DialogTitle>Select data element to map</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          <div className="flex w-2/5 min-h-0 flex-col border-r bg-muted/10">
            <div className="p-4 pb-3">
              <div className="mb-2 text-sm font-medium">Available data</div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-8"
                />
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1 px-2 pb-3">
              <div className="space-y-1 px-2 pt-1">
                {filteredGroups.length === 0 ? (
                  <div className="px-2 py-6 text-sm text-muted-foreground">
                    No matching fields.
                  </div>
                ) : (
                  filteredGroups.map((group) => {
                    const expanded = isExpanded(group.groupId);
                    return (
                      <div key={group.groupId} className="select-none">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/50"
                          onClick={() => toggleGroup(group.groupId)}
                        >
                          {expanded ? (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground" />
                          )}
                          <span className="truncate text-sm font-medium">
                            {group.groupLabel}
                          </span>
                        </button>

                        {expanded ? (
                          <div className="ml-6 mt-1 flex flex-col gap-1">
                            {group.options.map((opt) => {
                              const selected =
                                selectedOption?.sourceId === opt.sourceId &&
                                selectedOption?.groupId === opt.groupId &&
                                selectedOption?.fieldId === opt.fieldId;
                              return (
                                <button
                                  key={`${opt.sourceId}:${opt.groupId}:${opt.fieldId}`}
                                  type="button"
                                  className={cn(
                                    "rounded-md px-2 py-1 text-left text-sm hover:bg-muted/50",
                                    selected ? "bg-accent" : undefined,
                                  )}
                                  onClick={() => setSelectedOption(opt)}
                                >
                                  <span className="truncate">{opt.fieldLabel}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex min-h-0 flex-1 flex-col p-4">
            {!selectedOption ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Select a field on the left to preview it.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-base font-medium">
                  {selectedOption.fieldLabel}
                </div>
                <div className="text-sm text-muted-foreground">
                  From <span className="font-medium">{selectedOption.groupLabel}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Type: <span className="font-medium">{selectedOption.fieldType}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t bg-muted/30 p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selectedOption}
            onClick={() => {
              if (!selectedOption) return;
              onPick(selectedOption);
              onOpenChange(false);
            }}
          >
            Select
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


