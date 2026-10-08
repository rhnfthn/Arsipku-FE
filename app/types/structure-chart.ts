export interface StructureChartNode {
  id: string;
  type: 'direktorat' | 'unit' | 'position' | 'member';
  name: string;
  organizationCode?: string | number;
  positionCode?: string | number;
  persnum?: string | number;
  bodTag?: string;
  startDate?: string;
  endDate?: string;
  children: StructureChartNode[];
  _positionsLoaded?: boolean;
  _personsLoaded?: boolean;
}

export type StructureChartAction =
  | 'toggle'
  | 'load-members'
  | 'add-unit'
  | 'add-position'
  | 'add-member'
  | 'edit'
  | 'delete';
