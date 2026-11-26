export interface ElementInfo {
  symbol: string;
  atomicNumber: number;
  nameEn: string;
  namePt: string;
  atomicMass: number;
  cpkHex: string;
  covalentRadius: number; // Angstroms
  vdwRadius: number; // Angstroms
  hydrophobicity: number; // -1 (polar/charged) to +1 (hydrophobic)
}

export const ELEMENTS: Record<string, ElementInfo> = {
  H: { symbol: 'H', atomicNumber: 1, nameEn: 'Hydrogen', namePt: 'Hidrogênio', atomicMass: 1.008, cpkHex: '#E5ECE9', covalentRadius: 0.31, vdwRadius: 1.2, hydrophobicity: 0.1 },
  HE: { symbol: 'He', atomicNumber: 2, nameEn: 'Helium', namePt: 'Hélio', atomicMass: 4.0026, cpkHex: '#D9FFFF', covalentRadius: 0.28, vdwRadius: 1.4, hydrophobicity: 0.2 },
  LI: { symbol: 'Li', atomicNumber: 3, nameEn: 'Lithium', namePt: 'Lítio', atomicMass: 6.94, cpkHex: '#CC80FF', covalentRadius: 1.28, vdwRadius: 1.82, hydrophobicity: -0.8 },
  B: { symbol: 'B', atomicNumber: 5, nameEn: 'Boron', namePt: 'Boro', atomicMass: 10.81, cpkHex: '#FFB5B5', covalentRadius: 0.84, vdwRadius: 1.92, hydrophobicity: 0.0 },
  C: { symbol: 'C', atomicNumber: 6, nameEn: 'Carbon', namePt: 'Carbono', atomicMass: 12.011, cpkHex: '#52625B', covalentRadius: 0.76, vdwRadius: 1.7, hydrophobicity: 0.75 },
  N: { symbol: 'N', atomicNumber: 7, nameEn: 'Nitrogen', namePt: 'Nitrogênio', atomicMass: 14.007, cpkHex: '#3B82F6', covalentRadius: 0.71, vdwRadius: 1.55, hydrophobicity: -0.75 },
  O: { symbol: 'O', atomicNumber: 8, nameEn: 'Oxygen', namePt: 'Oxigênio', atomicMass: 15.999, cpkHex: '#EF4444', covalentRadius: 0.66, vdwRadius: 1.52, hydrophobicity: -0.85 },
  F: { symbol: 'F', atomicNumber: 9, nameEn: 'Fluorine', namePt: 'Flúor', atomicMass: 18.998, cpkHex: '#6EE7B7', covalentRadius: 0.57, vdwRadius: 1.47, hydrophobicity: 0.2 },
  NA: { symbol: 'Na', atomicNumber: 11, nameEn: 'Sodium', namePt: 'Sódio', atomicMass: 22.99, cpkHex: '#AB5CF2', covalentRadius: 1.66, vdwRadius: 2.27, hydrophobicity: -0.9 },
  MG: { symbol: 'Mg', atomicNumber: 12, nameEn: 'Magnesium', namePt: 'Magnésio', atomicMass: 24.305, cpkHex: '#10B981', covalentRadius: 1.41, vdwRadius: 1.73, hydrophobicity: -0.5 },
  AL: { symbol: 'Al', atomicNumber: 13, nameEn: 'Aluminum', namePt: 'Alumínio', atomicMass: 26.982, cpkHex: '#BFA6A6', covalentRadius: 1.21, vdwRadius: 1.84, hydrophobicity: -0.3 },
  SI: { symbol: 'Si', atomicNumber: 14, nameEn: 'Silicon', namePt: 'Silício', atomicMass: 28.085, cpkHex: '#F0C8A0', covalentRadius: 1.11, vdwRadius: 2.1, hydrophobicity: 0.35 },
  P: { symbol: 'P', atomicNumber: 15, nameEn: 'Phosphorus', namePt: 'Fósforo', atomicMass: 30.974, cpkHex: '#F97316', covalentRadius: 1.07, vdwRadius: 1.8, hydrophobicity: -0.55 },
  S: { symbol: 'S', atomicNumber: 16, nameEn: 'Sulfur', namePt: 'Enxofre', atomicMass: 32.06, cpkHex: '#EAB308', covalentRadius: 1.05, vdwRadius: 1.8, hydrophobicity: 0.45 },
  CL: { symbol: 'Cl', atomicNumber: 17, nameEn: 'Chlorine', namePt: 'Cloro', atomicMass: 35.45, cpkHex: '#22C55E', covalentRadius: 1.02, vdwRadius: 1.75, hydrophobicity: 0.55 },
  K: { symbol: 'K', atomicNumber: 19, nameEn: 'Potassium', namePt: 'Potássio', atomicMass: 39.098, cpkHex: '#8F40D4', covalentRadius: 2.03, vdwRadius: 2.75, hydrophobicity: -0.9 },
  CA: { symbol: 'Ca', atomicNumber: 20, nameEn: 'Calcium', namePt: 'Cálcio', atomicMass: 40.078, cpkHex: '#34D399', covalentRadius: 1.76, vdwRadius: 2.31, hydrophobicity: -0.6 },
  FE: { symbol: 'Fe', atomicNumber: 26, nameEn: 'Iron', namePt: 'Ferro', atomicMass: 55.845, cpkHex: '#E06633', covalentRadius: 1.32, vdwRadius: 2.0, hydrophobicity: -0.3 },
  CU: { symbol: 'Cu', atomicNumber: 29, nameEn: 'Copper', namePt: 'Cobre', atomicMass: 63.546, cpkHex: '#C88033', covalentRadius: 1.32, vdwRadius: 1.4, hydrophobicity: -0.2 },
  ZN: { symbol: 'Zn', atomicNumber: 30, nameEn: 'Zinc', namePt: 'Zinco', atomicMass: 65.38, cpkHex: '#7D80B0', covalentRadius: 1.22, vdwRadius: 1.39, hydrophobicity: -0.3 },
  BR: { symbol: 'Br', atomicNumber: 35, nameEn: 'Bromine', namePt: 'Bromo', atomicMass: 79.904, cpkHex: '#A62929', covalentRadius: 1.2, vdwRadius: 1.85, hydrophobicity: 0.6 },
  I: { symbol: 'I', atomicNumber: 53, nameEn: 'Iodine', namePt: 'Iodo', atomicMass: 126.9, cpkHex: '#940094', covalentRadius: 1.39, vdwRadius: 1.98, hydrophobicity: 0.7 },
};

// Normalized Kyte-Doolittle residue hydrophobicity (-1 to +1)
export const RESIDUE_HYDROPHOBICITY: Record<string, number> = {
  ILE: 1.0,
  VAL: 0.93,
  LEU: 0.84,
  PHE: 0.62,
  CYS: 0.56,
  MET: 0.42,
  ALA: 0.4,
  GLY: -0.09,
  THR: -0.16,
  SER: -0.18,
  TRP: -0.2,
  TYR: -0.29,
  PRO: -0.36,
  HIS: -0.71,
  GLU: -0.78,
  GLN: -0.78,
  ASP: -0.78,
  ASN: -0.78,
  LYS: -0.87,
  ARG: -1.0,
};

export const CHAIN_PALETTE = [
  '#10B981', // emerald
  '#38BDF8', // sky
  '#F59E0B', // amber
  '#A78BFA', // violet
  '#FB7185', // rose
  '#2DD4BF', // teal
  '#FACC15', // yellow
  '#60A5FA', // blue
];

export function normalizeElementSymbol(raw: string): string {
  const cleaned = raw.trim().replace(/[^a-zA-Z]/g, '');
  if (!cleaned) return 'C';
  const upper = cleaned.toUpperCase();
  if (ELEMENTS[upper]) return ELEMENTS[upper].symbol;
  // Try first two chars then first char
  if (upper.length >= 2 && ELEMENTS[upper.slice(0, 2)]) {
    return ELEMENTS[upper.slice(0, 2)].symbol;
  }
  if (ELEMENTS[upper[0]]) {
    return ELEMENTS[upper[0]].symbol;
  }
  return cleaned[0].toUpperCase() + cleaned.slice(1).toLowerCase();
}

export function getElementInfo(symbol: string): ElementInfo {
  const key = symbol.trim().toUpperCase();
  if (ELEMENTS[key]) return ELEMENTS[key];
  return {
    symbol: symbol || 'X',
    atomicNumber: 0,
    nameEn: symbol || 'Unknown',
    namePt: symbol || 'Desconhecido',
    atomicMass: 12.0,
    cpkHex: '#94A3B8',
    covalentRadius: 0.77,
    vdwRadius: 1.7,
    hydrophobicity: 0,
  };
}

export function getResidueHydrophobicity(
  residueName: string,
  elementSymbol: string,
): number {
  const key = residueName.trim().toUpperCase();
  if (key && RESIDUE_HYDROPHOBICITY[key] !== undefined) {
    return RESIDUE_HYDROPHOBICITY[key];
  }
  return getElementInfo(elementSymbol).hydrophobicity;
}

export function getHydrophobicityColor(score: number): string {
  // -1 (hydrophilic sky-teal #38BDF8) -> 0 (neutral mint-slate #94B8A8) -> +1 (hydrophobic amber-gold #F59E0B)
  const t = Math.max(-1, Math.min(1, score));
  if (t < 0) {
    const u = 1 + t; // 0 at -1, 1 at 0
    return lerpHex('#38BDF8', '#94B8A8', u);
  }
  return lerpHex('#94B8A8', '#F59E0B', t);
}

export function getChainColor(chainId: string): string {
  const clean = (chainId || 'A').trim().toUpperCase();
  let code = 0;
  for (let i = 0; i < clean.length; i++) {
    code += clean.charCodeAt(i);
  }
  return CHAIN_PALETTE[Math.abs(code - 65) % CHAIN_PALETTE.length];
}

function lerpHex(hexA: string, hexB: string, t: number): string {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1)}`;
}
