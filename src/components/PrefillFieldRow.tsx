import type { PrefillMapping } from "@/prefill/types";
import type { FormField } from "@/graph/types";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  field: FormField;
  mapping: PrefillMapping | undefined;
  onClickUnmapped: () => void;
  onClear: () => void;
}

export function PrefillFieldRow({
  field,
  mapping,
  onClickUnmapped,
  onClear,
}: Props) {
  const isMapped = Boolean(mapping);

  return (
    <div
      role="button"
      tabIndex={isMapped ? -1 : 0}
      className={cn(
        "flex items-center justify-between rounded-lg border px-3 py-2",
        isMapped ? "bg-blue-300/40" : "hover:bg-muted/30 cursor-pointer",
      )}
      onClick={() => {
        if (!isMapped) onClickUnmapped();
      }}
      onKeyDown={(e) => {
        if (isMapped) return;
        if (e.key === "Enter" || e.key === " ") onClickUnmapped();
      }}
    >
      <div className="min-w-0">
        {!mapping ? (
          <div className="truncate font-medium">{field.label}</div>
        ) : (
          <div className="truncate">
            <span className="font-medium">{field.label}</span>
            <span className="text-muted-foreground">
              {": "}
              {mapping.source.groupLabel}.{mapping.source.fieldLabel}
            </span>
          </div>
        )}
      </div>

      {mapping ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          aria-label={`Clear mapping for ${field.label}`}
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}

