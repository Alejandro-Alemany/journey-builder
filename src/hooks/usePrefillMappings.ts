import { useCallback, useState } from "react";
import type { PrefillMapping, PrefillOption } from "../prefill/types";

export interface PrefillMappingsApi {
  getMapping: (nodeId: string, fieldId: string) => PrefillMapping | undefined;
  setMapping: (nodeId: string, fieldId: string, source: PrefillOption) => void;
  clearMapping: (nodeId: string, fieldId: string) => void;
}

export function usePrefillMappings(): PrefillMappingsApi {
  const [mappings, setMappings] = useState<PrefillMapping[]>([]);

  const getMapping = useCallback(
    (nodeId: string, fieldId: string) =>
      mappings.find(
        (m) => m.targetNodeId === nodeId && m.targetFieldId === fieldId,
      ),
    [mappings],
  );

  const setMapping = useCallback(
    (nodeId: string, fieldId: string, source: PrefillOption) => {
      setMappings((prev) => [
        ...prev.filter(
          (m) => !(m.targetNodeId === nodeId && m.targetFieldId === fieldId),
        ),
        { targetNodeId: nodeId, targetFieldId: fieldId, source },
      ]);
    },
    [],
  );

  const clearMapping = useCallback((nodeId: string, fieldId: string) => {
    setMappings((prev) =>
      prev.filter(
        (m) => !(m.targetNodeId === nodeId && m.targetFieldId === fieldId),
      ),
    );
  }, []);

  return { getMapping, setMapping, clearMapping };
}

