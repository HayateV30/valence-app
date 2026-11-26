import {
  AtomRecord,
  BondOrder,
  BondPairFrequency,
  BondRecord,
  ElementCount,
  FormulaPart,
  MoleculeData,
  SourceFormat,
} from './types';
import {
  getElementInfo,
  getResidueHydrophobicity,
  normalizeElementSymbol,
} from './elements';

export interface RawAtomInput {
  element: string;
  x: number;
  y: number;
  z: number;
  chainId?: string;
  residueName?: string;
  residueSeq?: number;
  atomName?: string;
  formalCharge?: number;
}

export interface RawBondInput {
  atomA: number;
  atomB: number;
  order?: BondOrder;
}

export interface BuildMoleculeOptions {
  id: string;
  name: string;
  subtitle?: string;
  sourceFormat: SourceFormat;
  fileName?: string;
  atoms: RawAtomInput[];
  explicitBonds?: RawBondInput[];
  inferMissingBonds?: boolean;
}

function buildHillFormula(counts: Map<string, number>): {
  parts: FormulaPart[];
  text: string;
} {
  const parts: FormulaPart[] = [];
  if (counts.has('C')) {
    parts.push({ element: 'C', count: counts.get('C')! });
    if (counts.has('H')) {
      parts.push({ element: 'H', count: counts.get('H')! });
    }
    const others = Array.from(counts.keys())
      .filter((el) => el !== 'C' && el !== 'H')
      .sort();
    for (const el of others) {
      parts.push({ element: el, count: counts.get(el)! });
    }
  } else {
    const sorted = Array.from(counts.keys()).sort();
    for (const el of sorted) {
      parts.push({ element: el, count: counts.get(el)! });
    }
  }

  const text = parts
    .map((p) => (p.count > 1 ? `${p.element}${p.count}` : p.element))
    .join('');

  return { parts, text };
}

function inferCovalentBondsSpatial(atoms: AtomRecord[]): RawBondInput[] {
  const n = atoms.length;
  if (n < 2) return [];

  // Cell size 2.8 A covers max covalent radius sum + tolerance (1.7 + 1.7 + 0.45)
  const cellSize = 3.2;
  const grid = new Map<string, number[]>();

  for (let i = 0; i < n; i++) {
    const a = atoms[i];
    const cx = Math.floor(a.x / cellSize);
    const cy = Math.floor(a.y / cellSize);
    const cz = Math.floor(a.z / cellSize);
    const key = `${cx},${cy},${cz}`;
    const bucket = grid.get(key);
    if (bucket) bucket.push(i);
    else grid.set(key, [i]);
  }

  const inferred: RawBondInput[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < n; i++) {
    const a = atoms[i];
    const infoA = getElementInfo(a.element);
    const cx = Math.floor(a.x / cellSize);
    const cy = Math.floor(a.y / cellSize);
    const cz = Math.floor(a.z / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const neighbors = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
          if (!neighbors) continue;

          for (const j of neighbors) {
            if (j <= i) continue;
            const b = atoms[j];

            // Skip inter-chain covalent inference if distinct chains exist
            if (a.chainId && b.chainId && a.chainId !== b.chainId) continue;

            // Avoid H-H bonding unless it's pure H2
            if (a.element === 'H' && b.element === 'H' && n > 2) continue;

            const infoB = getElementInfo(b.element);
            const maxDist = infoA.covalentRadius + infoB.covalentRadius + 0.42;
            const minDist = 0.4;

            const vx = a.x - b.x;
            const vy = a.y - b.y;
            const vz = a.z - b.z;
            const distSq = vx * vx + vy * vy + vz * vz;

            if (distSq >= minDist * minDist && distSq <= maxDist * maxDist) {
              const pairKey = `${i}:${j}`;
              if (!seen.has(pairKey)) {
                seen.add(pairKey);
                inferred.push({ atomA: i, atomB: j, order: 1 });
              }
            }
          }
        }
      }
    }
  }

  return inferred;
}

export function buildMoleculeData(options: BuildMoleculeOptions): MoleculeData {
  if (!options.atoms || options.atoms.length === 0) {
    throw new Error('No atoms found in molecular structure.');
  }

  // Compute centroid to center molecule at origin
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  for (const raw of options.atoms) {
    sumX += raw.x;
    sumY += raw.y;
    sumZ += raw.z;
  }
  const cx = sumX / options.atoms.length;
  const cy = sumY / options.atoms.length;
  const cz = sumZ / options.atoms.length;

  const atoms: AtomRecord[] = options.atoms.map((raw, index) => {
    const element = normalizeElementSymbol(raw.element);
    const residueName = (raw.residueName ?? '').trim();
    const chainId = (raw.chainId ?? 'A').trim() || 'A';
    return {
      index,
      element,
      x: raw.x - cx,
      y: raw.y - cy,
      z: raw.z - cz,
      chainId,
      residueName,
      residueSeq: raw.residueSeq ?? 1,
      atomName: (raw.atomName ?? `${element}${index + 1}`).trim(),
      formalCharge: raw.formalCharge ?? 0,
      hydrophobicity: getResidueHydrophobicity(residueName, element),
      degree: 0,
    };
  });

  // Bounding radius
  let maxRadiusSq = 1;
  for (const atom of atoms) {
    const dSq = atom.x * atom.x + atom.y * atom.y + atom.z * atom.z;
    if (dSq > maxRadiusSq) maxRadiusSq = dSq;
  }
  const boundingRadius = Math.sqrt(maxRadiusSq) + 1.8;

  // Merge explicit bonds and inferred bonds if needed
  const bondMap = new Map<
    string,
    { atomA: number; atomB: number; order: BondOrder; source: 'explicit' | 'inferred' }
  >();

  for (const b of options.explicitBonds ?? []) {
    if (
      b.atomA >= 0 &&
      b.atomB >= 0 &&
      b.atomA < atoms.length &&
      b.atomB < atoms.length &&
      b.atomA !== b.atomB
    ) {
      const lo = Math.min(b.atomA, b.atomB);
      const hi = Math.max(b.atomA, b.atomB);
      const key = `${lo}:${hi}`;
      bondMap.set(key, {
        atomA: lo,
        atomB: hi,
        order: b.order ?? 1,
        source: 'explicit',
      });
    }
  }

  const shouldInfer =
    options.inferMissingBonds !== false &&
    (bondMap.size === 0 || options.sourceFormat === 'pdb' || options.sourceFormat === 'cif');

  if (shouldInfer) {
    const inferred = inferCovalentBondsSpatial(atoms);
    for (const b of inferred) {
      const key = `${b.atomA}:${b.atomB}`;
      if (!bondMap.has(key)) {
        bondMap.set(key, {
          atomA: b.atomA,
          atomB: b.atomB,
          order: b.order ?? 1,
          source: 'inferred',
        });
      }
    }
  }

  const bonds: BondRecord[] = [];
  let single = 0;
  let doubleCount = 0;
  let triple = 0;
  let aromatic = 0;
  let totalLength = 0;

  const pairMap = new Map<
    string,
    { pair: string; order: BondOrder; count: number; totalLen: number }
  >();

  let bondIdx = 0;
  for (const entry of bondMap.values()) {
    const a = atoms[entry.atomA];
    const b = atoms[entry.atomB];
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    const lengthAngstrom = Math.sqrt(dx * dx + dy * dy + dz * dz);

    a.degree += 1;
    b.degree += 1;

    if (entry.order === 1) single += 1;
    else if (entry.order === 2) doubleCount += 1;
    else if (entry.order === 3) triple += 1;
    else aromatic += 1;

    totalLength += lengthAngstrom;

    const [el1, el2] =
      a.element <= b.element ? [a.element, b.element] : [b.element, a.element];
    const sym =
      entry.order === 2
        ? '='
        : entry.order === 3
          ? '≡'
          : entry.order === 1.5
            ? '≈'
            : '–';
    const pairLabel = `${el1}${sym}${el2}`;
    const pairKey = `${pairLabel}:${entry.order}`;
    const existingPair = pairMap.get(pairKey);
    if (existingPair) {
      existingPair.count += 1;
      existingPair.totalLen += lengthAngstrom;
    } else {
      pairMap.set(pairKey, {
        pair: pairLabel,
        order: entry.order,
        count: 1,
        totalLen: lengthAngstrom,
      });
    }

    bonds.push({
      index: bondIdx++,
      atomA: entry.atomA,
      atomB: entry.atomB,
      order: entry.order,
      lengthAngstrom,
      source: entry.source,
    });
  }

  // Element counts & molecular weight
  const counts = new Map<string, number>();
  let molecularWeight = 0;
  const chains = new Set<string>();

  for (const atom of atoms) {
    counts.set(atom.element, (counts.get(atom.element) ?? 0) + 1);
    molecularWeight += getElementInfo(atom.element).atomicMass;
    chains.add(atom.chainId);
  }

  const { parts, text } = buildHillFormula(counts);

  const elementBreakdown: ElementCount[] = Array.from(counts.entries())
    .map(([element, count]) => ({
      element,
      count,
      massPercent:
        molecularWeight > 0
          ? ((count * getElementInfo(element).atomicMass) / molecularWeight) * 100
          : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const pairFrequencies: BondPairFrequency[] = Array.from(pairMap.values())
    .map((p) => ({
      pair: p.pair,
      order: p.order,
      count: p.count,
      avgLength: p.totalLen / p.count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    id: options.id,
    name: options.name,
    subtitle: options.subtitle,
    sourceFormat: options.sourceFormat,
    fileName: options.fileName,
    formulaParts: parts,
    formulaString: text,
    molecularWeight,
    atomCount: atoms.length,
    bondCount: bonds.length,
    boundingRadius,
    hasChains: chains.size > 1 || atoms.some((a) => a.residueName.length > 0),
    atoms,
    bonds,
    elementBreakdown,
    bondSummary: {
      single,
      double: doubleCount,
      triple,
      aromatic,
      total: bonds.length,
      pairFrequencies,
      avgBondLength: bonds.length > 0 ? totalLength / bonds.length : 0,
    },
  };
}
