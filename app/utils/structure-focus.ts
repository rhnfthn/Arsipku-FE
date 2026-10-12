import type { StructureChartNode } from '../types/structure-chart';

export const getStructureFocusPath = (
  nodes: StructureChartNode[],
  id: string,
): StructureChartNode[] => {
  for (const node of nodes) {
    if (node.type !== 'direktorat' && node.type !== 'unit') continue;
    if (String(node.id) === id) return [node];
    const path = getStructureFocusPath(node.children || [], id);
    if (path.length) return [node, ...path];
  }
  return [];
};
