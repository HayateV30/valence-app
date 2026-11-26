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
  TI: { symbol: 'Ti', atomicNumber: 22, nameEn: 'Titanium', namePt: 'Titânio', atomicMass: 47.867, cpkHex: '#BFC2C7', covalentRadius: 1.6, vdwRadius: 2.0, hydrophobicity: -0.3 },
  CR: { symbol: 'Cr', atomicNumber: 24, nameEn: 'Chromium', namePt: 'Cromo', atomicMass: 51.996, cpkHex: '#8A99C7', covalentRadius: 1.39, vdwRadius: 2.0, hydrophobicity: -0.3 },
  MN: { symbol: 'Mn', atomicNumber: 25, nameEn: 'Manganese', namePt: 'Manganês', atomicMass: 54.938, cpkHex: '#9C7AC7', covalentRadius: 1.39, vdwRadius: 2.0, hydrophobicity: -0.3 },
  CO: { symbol: 'Co', atomicNumber: 27, nameEn: 'Cobalt', namePt: 'Cobalto', atomicMass: 58.933, cpkHex: '#F090A0', covalentRadius: 1.26, vdwRadius: 2.0, hydrophobicity: -0.3 },
  NI: { symbol: 'Ni', atomicNumber: 28, nameEn: 'Nickel', namePt: 'Níquel', atomicMass: 58.693, cpkHex: '#50D050', covalentRadius: 1.24, vdwRadius: 1.63, hydrophobicity: -0.3 },
  AS: { symbol: 'As', atomicNumber: 33, nameEn: 'Arsenic', namePt: 'Arsênio', atomicMass: 74.922, cpkHex: '#BD80E3', covalentRadius: 1.19, vdwRadius: 1.85, hydrophobicity: 0.0 },
  SE: { symbol: 'Se', atomicNumber: 34, nameEn: 'Selenium', namePt: 'Selênio', atomicMass: 78.971, cpkHex: '#FFA100', covalentRadius: 1.2, vdwRadius: 1.9, hydrophobicity: 0.45 },
  MO: { symbol: 'Mo', atomicNumber: 42, nameEn: 'Molybdenum', namePt: 'Molibdênio', atomicMass: 95.95, cpkHex: '#54B5B5', covalentRadius: 1.54, vdwRadius: 2.0, hydrophobicity: -0.3 },
  PD: { symbol: 'Pd', atomicNumber: 46, nameEn: 'Palladium', namePt: 'Paládio', atomicMass: 106.42, cpkHex: '#006985', covalentRadius: 1.39, vdwRadius: 1.63, hydrophobicity: -0.2 },
  AG: { symbol: 'Ag', atomicNumber: 47, nameEn: 'Silver', namePt: 'Prata', atomicMass: 107.87, cpkHex: '#C0C0C0', covalentRadius: 1.45, vdwRadius: 1.72, hydrophobicity: -0.2 },
  CD: { symbol: 'Cd', atomicNumber: 48, nameEn: 'Cadmium', namePt: 'Cádmio', atomicMass: 112.41, cpkHex: '#FFD98F', covalentRadius: 1.44, vdwRadius: 1.58, hydrophobicity: -0.3 },
  SN: { symbol: 'Sn', atomicNumber: 50, nameEn: 'Tin', namePt: 'Estanho', atomicMass: 118.71, cpkHex: '#668080', covalentRadius: 1.39, vdwRadius: 2.17, hydrophobicity: 0.0 },
  PT: { symbol: 'Pt', atomicNumber: 78, nameEn: 'Platinum', namePt: 'Platina', atomicMass: 195.08, cpkHex: '#D0D0E0', covalentRadius: 1.36, vdwRadius: 1.75, hydrophobicity: -0.2 },
  AU: { symbol: 'Au', atomicNumber: 79, nameEn: 'Gold', namePt: 'Ouro', atomicMass: 196.97, cpkHex: '#FFD123', covalentRadius: 1.36, vdwRadius: 1.66, hydrophobicity: -0.2 },
  HG: { symbol: 'Hg', atomicNumber: 80, nameEn: 'Mercury', namePt: 'Mercúrio', atomicMass: 200.59, cpkHex: '#B8B8D0', covalentRadius: 1.32, vdwRadius: 1.55, hydrophobicity: -0.2 },
  PB: { symbol: 'Pb', atomicNumber: 82, nameEn: 'Lead', namePt: 'Chumbo', atomicMass: 207.2, cpkHex: '#575961', covalentRadius: 1.46, vdwRadius: 2.02, hydrophobicity: -0.2 },
};

// All 118 symbols in atomic-number order, with standard atomic weights (mass number
// of the most stable isotope for elements without one). Elements without a full
// entry above still get the right symbol, atomic number and mass.
const PERIODIC_TABLE =
  'H 1.008 He 4.0026 Li 6.94 Be 9.0122 B 10.81 C 12.011 N 14.007 O 15.999 F 18.998 Ne 20.18 ' +
  'Na 22.99 Mg 24.305 Al 26.982 Si 28.085 P 30.974 S 32.06 Cl 35.45 Ar 39.948 K 39.098 Ca 40.078 ' +
  'Sc 44.956 Ti 47.867 V 50.942 Cr 51.996 Mn 54.938 Fe 55.845 Co 58.933 Ni 58.693 Cu 63.546 Zn 65.38 ' +
  'Ga 69.723 Ge 72.63 As 74.922 Se 78.971 Br 79.904 Kr 83.798 Rb 85.468 Sr 87.62 Y 88.906 Zr 91.224 ' +
  'Nb 92.906 Mo 95.95 Tc 98 Ru 101.07 Rh 102.91 Pd 106.42 Ag 107.87 Cd 112.41 In 114.82 Sn 118.71 ' +
  'Sb 121.76 Te 127.6 I 126.9 Xe 131.29 Cs 132.91 Ba 137.33 La 138.91 Ce 140.12 Pr 140.91 Nd 144.24 ' +
  'Pm 145 Sm 150.36 Eu 151.96 Gd 157.25 Tb 158.93 Dy 162.5 Ho 164.93 Er 167.26 Tm 168.93 Yb 173.05 ' +
  'Lu 174.97 Hf 178.49 Ta 180.95 W 183.84 Re 186.21 Os 190.23 Ir 192.22 Pt 195.08 Au 196.97 Hg 200.59 ' +
  'Tl 204.38 Pb 207.2 Bi 208.98 Po 209 At 210 Rn 222 Fr 223 Ra 226 Ac 227 Th 232.04 ' +
  'Pa 231.04 U 238.03 Np 237 Pu 244 Am 243 Cm 247 Bk 247 Cf 251 Es 252 Fm 257 ' +
  'Md 258 No 259 Lr 266 Rf 267 Db 268 Sg 269 Bh 270 Hs 269 Mt 278 Ds 281 ' +
  'Rg 282 Cn 285 Nh 286 Fl 289 Mc 290 Lv 293 Ts 294 Og 294';

const PERIODIC: { symbol: string; mass: number }[] = [];
const PERIODIC_BY_SYMBOL = new Map<string, { atomicNumber: number; mass: number }>();
{
  const tokens = PERIODIC_TABLE.split(' ');
  for (let i = 0; i < tokens.length; i += 2) {
    const symbol = tokens[i];
    const mass = parseFloat(tokens[i + 1]);
    PERIODIC.push({ symbol, mass });
    PERIODIC_BY_SYMBOL.set(symbol, { atomicNumber: PERIODIC.length, mass });
  }
}

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

/**
 * Turns a raw element field ("Se", "FE", "Fe3+", "C1A", "H12A", "6") into a symbol.
 * Only the leading letters count, so a CIF/PDB label like "C1A" is carbon, not calcium.
 * A two-letter symbol is taken when its second letter is lowercase ("Co1"), or when the
 * letters are upper case and form an element with a full entry ("FE", "CL", "HG").
 * Never falls back to "whatever the first letter is" for an unknown pair: returns "X".
 */
export function normalizeElementSymbol(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d+$/.test(trimmed)) {
    const z = parseInt(trimmed, 10);
    return PERIODIC[z - 1]?.symbol ?? 'X';
  }
  const letters = trimmed.replace(/^[^A-Za-z]+/, '').match(/^[A-Za-z]+/)?.[0] ?? '';
  if (!letters) return 'C';

  const first = letters[0].toUpperCase();
  if (letters.length >= 2) {
    const two = first + letters[1].toLowerCase();
    const secondIsLower = letters[1] !== letters[1].toUpperCase();
    if (secondIsLower && PERIODIC_BY_SYMBOL.has(two)) return two;
    if (!secondIsLower && ELEMENTS[two.toUpperCase()]) return two;
  }
  if (PERIODIC_BY_SYMBOL.has(first)) return first;
  return 'X';
}

export function getElementInfo(symbol: string): ElementInfo {
  const key = symbol.trim().toUpperCase();
  if (ELEMENTS[key]) return ELEMENTS[key];
  const known = PERIODIC_BY_SYMBOL.get(symbol.trim());
  return {
    symbol: symbol || 'X',
    atomicNumber: known?.atomicNumber ?? 0,
    nameEn: symbol || 'Unknown',
    namePt: symbol || 'Desconhecido',
    atomicMass: known?.mass ?? 0,
    cpkHex: known ? '#C8A0E0' : '#94A3B8',
    // Elements without a full entry are mostly metals: a generic metal radius keeps
    // metal-ligand bonds inside the inference cut-off.
    covalentRadius: known ? 1.4 : 0.77,
    vdwRadius: known ? 2.0 : 1.7,
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
