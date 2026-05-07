
import type { FormNode, Edge } from "./types";

export class FormGraph {
  private readonly nodesById: Map<string, FormNode>;
  private readonly parentsByNodeId: Map<string, string[]>;
  // ^ adjacency list: nodeId -> list of direct parent (upstream) node ids

  constructor(nodes: FormNode[], edges: Edge[]) {
    this.nodesById = new Map(nodes.map((n) => [n.id, n]));
    this.parentsByNodeId = new Map();

    for (const node of nodes) {
      this.parentsByNodeId.set(node.id, []);
    }

    for (const edge of edges) {
      if (!this.nodesById.has(edge.from) || !this.nodesById.has(edge.to)) {
        // Defensive: skip edges that reference unknown nodes rather than crash.
        // Logged once during build so bad data is visible without breaking the UI.
        console.warn(`FormGraph: edge references unknown node`, edge);
        continue;
      }
      this.parentsByNodeId.get(edge.to)!.push(edge.from);
    }
  }

  getNode(id: string): FormNode | undefined {
    return this.nodesById.get(id);
  }

  getAllNodes(): FormNode[] {
    return Array.from(this.nodesById.values());
  }

  /**
   * Direct upstream nodes — forms that must be submitted immediately before this one.
   */
  getDirectParents(nodeId: string): FormNode[] {
    const parentIds = this.parentsByNodeId.get(nodeId) ?? [];
    return parentIds
      .map((id) => this.nodesById.get(id))
      .filter((n): n is FormNode => n !== undefined);
  }

  /**
   * Transitive ancestors only — excludes direct parents.
   * E.g., for A -> B -> D, getTransitiveParents("D") returns [A] (not B).
   */
  getTransitiveParents(nodeId: string): FormNode[] {
    const all = this.getAllAncestors(nodeId);
    const direct = new Set(this.getDirectParents(nodeId).map((n) => n.id));
    return all.filter((n) => !direct.has(n.id));
  }

  /**
   * All upstream nodes, direct + transitive. BFS from the target node
   * walking parents-of edges. Cycle-safe via visited set (the graph is a DAG,
   * but a defensive check costs nothing and catches bad data).
   */
  getAllAncestors(nodeId: string): FormNode[] {
    if (!this.nodesById.has(nodeId)) return [];

    const visited = new Set<string>();
    const queue: string[] = [...(this.parentsByNodeId.get(nodeId) ?? [])];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const parents = this.parentsByNodeId.get(current) ?? [];
      for (const p of parents) {
        if (!visited.has(p)) queue.push(p);
      }
    }

    return Array.from(visited)
      .map((id) => this.nodesById.get(id))
      .filter((n): n is FormNode => n !== undefined);
  }
}