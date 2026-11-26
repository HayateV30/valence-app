export type SourceFormat = 'preset' | 'pdb' | 'sdf' | 'mol' | 'xyz' | 'cif' | 'ai';

export type RepresentationMode =
  | 'ball-and-stick'
  | 'space-filling'
  | 'licorice'
  | 'surface';

export type ColorScheme = 'cpk' | 'hydrophobicity' | 'chain';

export type BondOrder = 1 | 1.5 | 2 | 3;

export interface AtomRecord {
  index: number;
  element: string;
  x: number;
  y: number;
  z: number;
  chainId: string;
  residueName: string;
  residueSeq: number;
  atomName: string;
  formalCharge: number;
  hydrophobicity: number; // normalized -1 (hydrophilic) to +1 (hydrophobic)
  degree: number;
}

export interface BondRecord {
  index: number;
  atomA: number;
  atomB: number;
  order: BondOrder;
  lengthAngstrom: number;
  source: 'explicit' | 'inferred';
}

export interface FormulaPart {
  element: string;
  count: number;
}

export interface ElementCount {
  element: string;
  count: number;
  massPercent: number;
}

export interface BondPairFrequency {
  pair: string;
  order: BondOrder;
  count: number;
  avgLength: number;
}

export interface BondSummary {
  single: number;
  double: number;
  triple: number;
  aromatic: number;
  total: number;
  pairFrequencies: BondPairFrequency[];
  avgBondLength: number;
}

export interface MoleculeData {
  id: string;
  name: string;
  subtitle?: string;
  sourceFormat: SourceFormat;
  fileName?: string;
  formulaParts: FormulaPart[];
  formulaString: string;
  molecularWeight: number;
  atomCount: number;
  bondCount: number;
  boundingRadius: number;
  hasChains: boolean;
  atoms: AtomRecord[];
  bonds: BondRecord[];
  elementBreakdown: ElementCount[];
  bondSummary: BondSummary;
}
