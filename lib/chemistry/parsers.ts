import { buildMoleculeData, RawAtomInput, RawBondInput } from './builder';
import { normalizeElementSymbol } from './elements';
import { BondOrder, MoleculeData, SourceFormat } from './types';

function stripExt(name: string): string {
  return name.replace(/\.(pdb|ent|sdf|mol|xyz|cif|mmcif)$/i, '');
}

export function parseXYZ(content: string, fileName = 'structure.xyz'): MoleculeData {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 3) {
    throw new Error('Invalid XYZ file: expected atom count, comment line, and coordinates.');
  }

  const declaredCount = parseInt(lines[0], 10);
  const titleLine = lines[1];
  const atoms: RawAtomInput[] = [];

  for (let i = 2; i < lines.length; i++) {
    const parts = lines[i].split(/\s+/);
    if (parts.length < 4) continue;
    const x = parseFloat(parts[1]);
    const y = parseFloat(parts[2]);
    const z = parseFloat(parts[3]);
    if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) continue;
    atoms.push({
      element: normalizeElementSymbol(parts[0]),
      x,
      y,
      z,
    });
    if (!Number.isNaN(declaredCount) && atoms.length >= declaredCount) break;
  }

  if (atoms.length === 0) {
    throw new Error('No valid atomic coordinates found in XYZ file.');
  }

  const displayName =
    titleLine && !/^\s*$/.test(titleLine) ? titleLine : stripExt(fileName);

  return buildMoleculeData({
    id: `xyz-${Date.now()}`,
    name: displayName,
    sourceFormat: 'xyz',
    fileName,
    atoms,
    inferMissingBonds: true,
  });
}

function mapSdfBondOrder(rawOrder: number): BondOrder {
  if (rawOrder === 2) return 2;
  if (rawOrder === 3) return 3;
  if (rawOrder === 4) return 1.5; // aromatic
  return 1;
}

function mapChargeCode(code: number): number {
  if (code === 1) return 3;
  if (code === 2) return 2;
  if (code === 3) return 1;
  if (code === 5) return -1;
  if (code === 6) return -2;
  if (code === 7) return -3;
  return 0;
}

export function parseSDFOrMOL(
  content: string,
  fileName = 'structure.sdf',
): MoleculeData {
  // Handle multi-molecule SDF by taking the first record up to $$$$
  const firstRecord = content.split(/\$\$\$\$/)[0];
  const lines = firstRecord.split(/\r?\n/);

  if (lines.length < 4) {
    throw new Error('Invalid MOL/SDF file: header block is incomplete.');
  }

  const title = lines[0].trim() || stripExt(fileName);
  const countsLine = lines[3];

  const isV3000 = /V3000/i.test(countsLine) || /M\s+V30\s+BEGIN\s+CTAB/i.test(firstRecord);
  const atoms: RawAtomInput[] = [];
  const explicitBonds: RawBondInput[] = [];

  if (isV3000) {
    let inAtomBlock = false;
    let inBondBlock = false;
    const atomIdMap = new Map<number, number>();

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (/^M\s+V30\s+BEGIN\s+ATOM/i.test(line)) {
        inAtomBlock = true;
        continue;
      }
      if (/^M\s+V30\s+END\s+ATOM/i.test(line)) {
        inAtomBlock = false;
        continue;
      }
      if (/^M\s+V30\s+BEGIN\s+BOND/i.test(line)) {
        inBondBlock = true;
        continue;
      }
      if (/^M\s+V30\s+END\s+BOND/i.test(line)) {
        inBondBlock = false;
        continue;
      }

      if (inAtomBlock && line.startsWith('M  V30')) {
        const tokens = line.replace(/^M\s+V30\s+/, '').split(/\s+/);
        if (tokens.length >= 5) {
          const origId = parseInt(tokens[0], 10);
          const element = normalizeElementSymbol(tokens[1]);
          const x = parseFloat(tokens[2]);
          const y = parseFloat(tokens[3]);
          const z = parseFloat(tokens[4]);
          if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
            atomIdMap.set(origId, atoms.length);
            atoms.push({ element, x, y, z });
          }
        }
      } else if (inBondBlock && line.startsWith('M  V30')) {
        const tokens = line.replace(/^M\s+V30\s+/, '').split(/\s+/);
        if (tokens.length >= 4) {
          const order = mapSdfBondOrder(parseInt(tokens[1], 10));
          const aIdx = atomIdMap.get(parseInt(tokens[2], 10));
          const bIdx = atomIdMap.get(parseInt(tokens[3], 10));
          if (aIdx !== undefined && bIdx !== undefined) {
            explicitBonds.push({ atomA: aIdx, atomB: bIdx, order });
          }
        }
      }
    }
  } else {
    // V2000 fixed-width or whitespace-tolerant counts line
    let atomCount = parseInt(countsLine.slice(0, 3).trim(), 10);
    let bondCount = parseInt(countsLine.slice(3, 6).trim(), 10);

    if (Number.isNaN(atomCount) || Number.isNaN(bondCount)) {
      const parts = countsLine.trim().split(/\s+/);
      atomCount = parseInt(parts[0], 10);
      bondCount = parseInt(parts[1], 10) || 0;
    }

    if (Number.isNaN(atomCount) || atomCount <= 0) {
      throw new Error('Could not read atom count in MOL/SDF V2000 header.');
    }

    const atomStart = 4;
    for (let i = 0; i < atomCount && atomStart + i < lines.length; i++) {
      const line = lines[atomStart + i];
      const parts = line.trim().split(/\s+/);
      let x: number;
      let y: number;
      let z: number;
      let element: string;
      let charge = 0;

      if (line.length >= 34 && !Number.isNaN(parseFloat(line.slice(0, 10)))) {
        x = parseFloat(line.slice(0, 10));
        y = parseFloat(line.slice(10, 20));
        z = parseFloat(line.slice(20, 30));
        element = normalizeElementSymbol(line.slice(31, 34).trim() || parts[3] || 'C');
        const chgField = parseInt(line.slice(36, 39).trim(), 10);
        if (!Number.isNaN(chgField)) charge = mapChargeCode(chgField);
      } else if (parts.length >= 4) {
        x = parseFloat(parts[0]);
        y = parseFloat(parts[1]);
        z = parseFloat(parts[2]);
        element = normalizeElementSymbol(parts[3]);
      } else {
        continue;
      }

      if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
        atoms.push({ element, x, y, z, formalCharge: charge });
      }
    }

    const bondStart = atomStart + atomCount;
    for (let i = 0; i < bondCount && bondStart + i < lines.length; i++) {
      const line = lines[bondStart + i];
      let a = parseInt(line.slice(0, 3).trim(), 10);
      let b = parseInt(line.slice(3, 6).trim(), 10);
      let ord = parseInt(line.slice(6, 9).trim(), 10);

      if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(ord)) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 3) continue;
        a = parseInt(parts[0], 10);
        b = parseInt(parts[1], 10);
        ord = parseInt(parts[2], 10);
      }

      if (!Number.isNaN(a) && !Number.isNaN(b)) {
        explicitBonds.push({
          atomA: a - 1,
          atomB: b - 1,
          order: mapSdfBondOrder(ord),
        });
      }
    }
  }

  if (atoms.length === 0) {
    throw new Error('No atoms parsed from MOL/SDF file.');
  }

  const fmt: SourceFormat = /\.mol$/i.test(fileName) ? 'mol' : 'sdf';
  return buildMoleculeData({
    id: `${fmt}-${Date.now()}`,
    name: title,
    sourceFormat: fmt,
    fileName,
    atoms,
    explicitBonds,
    inferMissingBonds: explicitBonds.length === 0,
  });
}

function inferPdbElement(atomName: string, explicitCol: string): string {
  const col = explicitCol.trim();
  if (col) return normalizeElementSymbol(col);
  const cleaned = atomName.trim().replace(/^[0-9]+/, '');
  if (!cleaned) return 'C';
  // Common PDB atom names: CA (alpha carbon), CB, CG, CD, NZ, OG1, FE, MG
  if (['CA', 'CB', 'CG', 'CD', 'CE', 'CZ', 'CH'].includes(cleaned.toUpperCase())) {
    return 'C';
  }
  return normalizeElementSymbol(cleaned[0]);
}

export function parsePDB(content: string, fileName = 'structure.pdb'): MoleculeData {
  const lines = content.split(/\r?\n/);
  let title = '';
  const atoms: RawAtomInput[] = [];
  const serialToIndex = new Map<number, number>();
  const explicitBonds: RawBondInput[] = [];

  for (const line of lines) {
    const rec = line.slice(0, 6).trim().toUpperCase();
    if (rec === 'TITLE' || rec === 'HEADER') {
      const text = line.slice(10).trim();
      if (text && !title) title = text;
    } else if (rec === 'MODEL' && atoms.length > 0) {
      // Stop after first model for NMR ensembles
      break;
    } else if (rec === 'ATOM' || rec === 'HETATM') {
      const serial = parseInt(line.slice(6, 11).trim(), 10);
      const atomName = line.slice(12, 16).trim();
      const altLoc = line.slice(16, 17).trim();
      if (altLoc && altLoc !== 'A' && altLoc !== '1') continue;

      const residueName = line.slice(17, 20).trim();
      const chainId = line.slice(21, 22).trim() || 'A';
      const residueSeq = parseInt(line.slice(22, 26).trim(), 10) || 1;
      const x = parseFloat(line.slice(30, 38).trim());
      const y = parseFloat(line.slice(38, 46).trim());
      const z = parseFloat(line.slice(46, 54).trim());
      const elementCol = line.slice(76, 78);

      if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) continue;

      const element = inferPdbElement(atomName, elementCol);
      const idx = atoms.length;
      if (!Number.isNaN(serial)) serialToIndex.set(serial, idx);

      atoms.push({
        element,
        x,
        y,
        z,
        chainId,
        residueName,
        residueSeq,
        atomName,
      });
    } else if (rec === 'CONECT') {
      const tokens = line
        .slice(6)
        .trim()
        .split(/\s+/)
        .map((t) => parseInt(t, 10))
        .filter((n) => !Number.isNaN(n));
      if (tokens.length >= 2) {
        const originIdx = serialToIndex.get(tokens[0]);
        if (originIdx !== undefined) {
          for (let k = 1; k < tokens.length; k++) {
            const targetIdx = serialToIndex.get(tokens[k]);
            if (targetIdx !== undefined && targetIdx !== originIdx) {
              explicitBonds.push({ atomA: originIdx, atomB: targetIdx, order: 1 });
            }
          }
        }
      }
    }
  }

  if (atoms.length === 0) {
    throw new Error('No ATOM or HETATM records found in PDB file.');
  }

  return buildMoleculeData({
    id: `pdb-${Date.now()}`,
    name: title || stripExt(fileName),
    sourceFormat: 'pdb',
    fileName,
    atoms,
    explicitBonds,
    inferMissingBonds: true,
  });
}

function tokenizeCifLine(line: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < line.length) {
    while (i < line.length && /\s/.test(line[i])) i++;
    if (i >= line.length) break;
    if (line[i] === '#') break;
    if (line[i] === "'" || line[i] === '"') {
      const quote = line[i++];
      const start = i;
      while (i < line.length && line[i] !== quote) i++;
      tokens.push(line.slice(start, i));
      i++;
    } else {
      const start = i;
      while (i < line.length && !/\s/.test(line[i])) i++;
      tokens.push(line.slice(start, i));
    }
  }
  return tokens;
}

function parseCifFloat(raw: string | undefined): number {
  if (!raw) return NaN;
  const cleaned = raw.replace(/\([0-9]+\)$/, '');
  return parseFloat(cleaned);
}

function fractionalToCartesian(
  fx: number,
  fy: number,
  fz: number,
  a: number,
  b: number,
  c: number,
  alphaDeg: number,
  betaDeg: number,
  gammaDeg: number,
): [number, number, number] {
  const deg2rad = Math.PI / 180;
  const alpha = alphaDeg * deg2rad;
  const beta = betaDeg * deg2rad;
  const gamma = gammaDeg * deg2rad;

  const cosA = Math.cos(alpha);
  const cosB = Math.cos(beta);
  const cosG = Math.cos(gamma);
  const sinG = Math.sin(gamma) || 1;

  const volumeFactor = Math.sqrt(
    Math.max(1e-6, 1 - cosA * cosA - cosB * cosB - cosG * cosG + 2 * cosA * cosB * cosG),
  );

  const x = a * fx + b * cosG * fy + c * cosB * fz;
  const y = b * sinG * fy + (c * (cosA - cosB * cosG)) / sinG * fz;
  const z = ((c * volumeFactor) / sinG) * fz;
  return [x, y, z];
}

export function parseCIF(content: string, fileName = 'structure.cif'): MoleculeData {
  const lines = content.split(/\r?\n/);
  let title = '';
  let cellA = 1;
  let cellB = 1;
  let cellC = 1;
  let alpha = 90;
  let beta = 90;
  let gamma = 90;

  // Read scalar metadata
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('data_') && !title) {
      title = line.slice(5).trim();
    } else if (line.startsWith('_chemical_name_common') || line.startsWith('_struct.title')) {
      const tokens = tokenizeCifLine(line);
      if (tokens[1] && tokens[1] !== '?') title = tokens[1];
    } else if (line.startsWith('_cell_length_a') || line.startsWith('_cell.length_a')) {
      const val = parseCifFloat(tokenizeCifLine(line)[1]);
      if (!Number.isNaN(val)) cellA = val;
    } else if (line.startsWith('_cell_length_b') || line.startsWith('_cell.length_b')) {
      const val = parseCifFloat(tokenizeCifLine(line)[1]);
      if (!Number.isNaN(val)) cellB = val;
    } else if (line.startsWith('_cell_length_c') || line.startsWith('_cell.length_c')) {
      const val = parseCifFloat(tokenizeCifLine(line)[1]);
      if (!Number.isNaN(val)) cellC = val;
    } else if (line.startsWith('_cell_angle_alpha') || line.startsWith('_cell.angle_alpha')) {
      const val = parseCifFloat(tokenizeCifLine(line)[1]);
      if (!Number.isNaN(val)) alpha = val;
    } else if (line.startsWith('_cell_angle_beta') || line.startsWith('_cell.angle_beta')) {
      const val = parseCifFloat(tokenizeCifLine(line)[1]);
      if (!Number.isNaN(val)) beta = val;
    } else if (line.startsWith('_cell_angle_gamma') || line.startsWith('_cell.angle_gamma')) {
      const val = parseCifFloat(tokenizeCifLine(line)[1]);
      if (!Number.isNaN(val)) gamma = val;
    }
  }

  const atoms: RawAtomInput[] = [];
  const labelToIndex = new Map<string, number>();
  const explicitBonds: RawBondInput[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.toLowerCase() === 'loop_') {
      i++;
      const headers: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('_')) {
        headers.push(lines[i].trim());
        i++;
      }

      const isAtomSiteLoop = headers.some((h) => h.startsWith('_atom_site'));
      const isBondLoop = headers.some((h) => h.startsWith('_chem_comp_bond'));

      const rows: string[][] = [];
      let pendingTokens: string[] = [];
      while (i < lines.length) {
        const rowLine = lines[i].trim();
        if (
          !rowLine ||
          rowLine.startsWith('#') ||
          rowLine.toLowerCase() === 'loop_' ||
          rowLine.startsWith('_') ||
          rowLine.startsWith('data_')
        ) {
          break;
        }
        const tokens = tokenizeCifLine(rowLine);
        pendingTokens.push(...tokens);
        while (pendingTokens.length >= headers.length && headers.length > 0) {
          rows.push(pendingTokens.slice(0, headers.length));
          pendingTokens = pendingTokens.slice(headers.length);
        }
        i++;
      }

      if (isAtomSiteLoop) {
        const colIdx = (candidates: string[]) =>
          headers.findIndex((h) => candidates.includes(h.toLowerCase()));

        const symIdx = colIdx(['_atom_site.type_symbol', '_atom_site_type_symbol']);
        const labelIdx = colIdx([
          '_atom_site.label_atom_id',
          '_atom_site_label',
          '_atom_site.id',
        ]);
        const chainIdx = colIdx(['_atom_site.auth_asym_id', '_atom_site.label_asym_id']);
        const resNameIdx = colIdx(['_atom_site.label_comp_id', '_atom_site.auth_comp_id']);
        const resSeqIdx = colIdx(['_atom_site.auth_seq_id', '_atom_site.label_seq_id']);

        const cxIdx = colIdx(['_atom_site.cartn_x', '_atom_site_cartn_x']);
        const cyIdx = colIdx(['_atom_site.cartn_y', '_atom_site_cartn_y']);
        const czIdx = colIdx(['_atom_site.cartn_z', '_atom_site_cartn_z']);

        const fxIdx = colIdx(['_atom_site.fract_x', '_atom_site_fract_x']);
        const fyIdx = colIdx(['_atom_site.fract_y', '_atom_site_fract_y']);
        const fzIdx = colIdx(['_atom_site.fract_z', '_atom_site_fract_z']);

        for (const row of rows) {
          let x = NaN;
          let y = NaN;
          let z = NaN;

          if (cxIdx >= 0 && cyIdx >= 0 && czIdx >= 0) {
            x = parseCifFloat(row[cxIdx]);
            y = parseCifFloat(row[cyIdx]);
            z = parseCifFloat(row[czIdx]);
          } else if (fxIdx >= 0 && fyIdx >= 0 && fzIdx >= 0) {
            const fx = parseCifFloat(row[fxIdx]);
            const fy = parseCifFloat(row[fyIdx]);
            const fz = parseCifFloat(row[fzIdx]);
            if (!Number.isNaN(fx) && !Number.isNaN(fy) && !Number.isNaN(fz)) {
              [x, y, z] = fractionalToCartesian(
                fx,
                fy,
                fz,
                cellA,
                cellB,
                cellC,
                alpha,
                beta,
                gamma,
              );
            }
          }

          if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) continue;

          const rawSym = symIdx >= 0 ? row[symIdx] : labelIdx >= 0 ? row[labelIdx] : 'C';
          const element = normalizeElementSymbol(rawSym);
          const atomName = labelIdx >= 0 ? row[labelIdx] : `${element}${atoms.length + 1}`;
          const chainId = chainIdx >= 0 && row[chainIdx] !== '.' && row[chainIdx] !== '?' ? row[chainIdx] : 'A';
          const residueName =
            resNameIdx >= 0 && row[resNameIdx] !== '.' && row[resNameIdx] !== '?'
              ? row[resNameIdx]
              : '';
          const residueSeq = resSeqIdx >= 0 ? parseInt(row[resSeqIdx], 10) || 1 : 1;

          labelToIndex.set(atomName, atoms.length);
          atoms.push({
            element,
            x,
            y,
            z,
            chainId,
            residueName,
            residueSeq,
            atomName,
          });
        }
      } else if (isBondLoop) {
        const colIdx = (candidates: string[]) =>
          headers.findIndex((h) => candidates.includes(h.toLowerCase()));
        const a1Idx = colIdx(['_chem_comp_bond.atom_id_1']);
        const a2Idx = colIdx(['_chem_comp_bond.atom_id_2']);
        const ordIdx = colIdx(['_chem_comp_bond.value_order']);
        const aromIdx = colIdx(['_chem_comp_bond.pdbx_aromatic_flag']);

        if (a1Idx >= 0 && a2Idx >= 0) {
          for (const row of rows) {
            const idxA = labelToIndex.get(row[a1Idx]);
            const idxB = labelToIndex.get(row[a2Idx]);
            if (idxA !== undefined && idxB !== undefined) {
              const rawOrd = (ordIdx >= 0 ? row[ordIdx] : 'SING').toUpperCase();
              const isArom = aromIdx >= 0 && row[aromIdx].toUpperCase() === 'Y';
              let order: BondOrder = 1;
              if (isArom || rawOrd.startsWith('AROM')) order = 1.5;
              else if (rawOrd.startsWith('DOUB')) order = 2;
              else if (rawOrd.startsWith('TRIP')) order = 3;
              explicitBonds.push({ atomA: idxA, atomB: idxB, order });
            }
          }
        }
      }
      continue;
    }
    i++;
  }

  if (atoms.length === 0) {
    throw new Error('No _atom_site coordinates found in CIF/mmCIF file.');
  }

  return buildMoleculeData({
    id: `cif-${Date.now()}`,
    name: title || stripExt(fileName),
    sourceFormat: 'cif',
    fileName,
    atoms,
    explicitBonds,
    inferMissingBonds: true,
  });
}

export function parseChemicalFile(content: string, fileName: string): MoleculeData {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.xyz')) return parseXYZ(content, fileName);
  if (lower.endsWith('.sdf') || lower.endsWith('.mol')) {
    return parseSDFOrMOL(content, fileName);
  }
  if (lower.endsWith('.pdb') || lower.endsWith('.ent')) {
    return parsePDB(content, fileName);
  }
  if (lower.endsWith('.cif') || lower.endsWith('.mmcif')) {
    return parseCIF(content, fileName);
  }

  // Fallback content sniffing
  if (/^(ATOM|HETATM|HEADER|TITLE)\s/m.test(content)) {
    return parsePDB(content, fileName);
  }
  if (/V2000|V3000|M\s+END/m.test(content)) {
    return parseSDFOrMOL(content, fileName);
  }
  if (/_atom_site/i.test(content)) {
    return parseCIF(content, fileName);
  }
  return parseXYZ(content, fileName);
}
