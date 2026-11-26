import * as THREE from 'three';
import { AtomRecord, ColorScheme } from '@/lib/chemistry/types';
import {
  getChainColor,
  getElementInfo,
  getHydrophobicityColor,
} from '@/lib/chemistry/elements';

function getAtomHex(atom: AtomRecord, colorScheme: ColorScheme): string {
  if (colorScheme === 'hydrophobicity') {
    return getHydrophobicityColor(atom.hydrophobicity);
  }
  if (colorScheme === 'chain') {
    return getChainColor(atom.chainId);
  }
  return getElementInfo(atom.element).cpkHex;
}

/**
 * Generates a smooth, watertight triangulated molecular surface (Gaussian electron-density
 * isosurface) using Surface Nets in Angstrom coordinates with per-vertex color blending.
 */
export function buildMolecularSurfaceGeometry(
  atoms: AtomRecord[],
  colorScheme: ColorScheme,
): THREE.BufferGeometry {
  if (atoms.length === 0) return new THREE.BufferGeometry();

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const a of atoms) {
    if (a.x < minX) minX = a.x;
    if (a.y < minY) minY = a.y;
    if (a.z < minZ) minZ = a.z;
    if (a.x > maxX) maxX = a.x;
    if (a.y > maxY) maxY = a.y;
    if (a.z > maxZ) maxZ = a.z;
  }

  const pad = 2.6;
  minX -= pad;
  minY -= pad;
  minZ -= pad;
  maxX += pad;
  maxY += pad;
  maxZ += pad;

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const spanZ = maxZ - minZ;
  const maxSpan = Math.max(spanX, spanY, spanZ, 4);

  const maxRes = atoms.length > 250 ? 34 : 38;
  const step = maxSpan / maxRes;
  const nx = Math.max(12, Math.min(44, Math.ceil(spanX / step) + 1));
  const ny = Math.max(12, Math.min(44, Math.ceil(spanY / step) + 1));
  const nz = Math.max(12, Math.min(44, Math.ceil(spanZ / step) + 1));

  const dx = spanX / (nx - 1);
  const dy = spanY / (ny - 1);
  const dz = spanZ / (nz - 1);

  const totalPts = nx * ny * nz;
  const field = new Float32Array(totalPts);
  const colR = new Float32Array(totalPts);
  const colG = new Float32Array(totalPts);
  const colB = new Float32Array(totalPts);

  const tmpColor = new THREE.Color();

  // Splatted Gaussian electron density per atom
  for (let aIdx = 0; aIdx < atoms.length; aIdx++) {
    const atom = atoms[aIdx];
    const vdw = getElementInfo(atom.element).vdwRadius;
    const cutoff = vdw * 2.15;
    const invR2 = 2.1 / (vdw * vdw);

    tmpColor.set(getAtomHex(atom, colorScheme));
    const ar = tmpColor.r;
    const ag = tmpColor.g;
    const ab = tmpColor.b;

    const ix0 = Math.max(0, Math.floor((atom.x - cutoff - minX) / dx));
    const ix1 = Math.min(nx - 1, Math.ceil((atom.x + cutoff - minX) / dx));
    const iy0 = Math.max(0, Math.floor((atom.y - cutoff - minY) / dy));
    const iy1 = Math.min(ny - 1, Math.ceil((atom.y + cutoff - minY) / dy));
    const iz0 = Math.max(0, Math.floor((atom.z - cutoff - minZ) / dz));
    const iz1 = Math.min(nz - 1, Math.ceil((atom.z + cutoff - minZ) / dz));

    const cutoffSq = cutoff * cutoff;

    for (let iz = iz0; iz <= iz1; iz++) {
      const pz = minZ + iz * dz - atom.z;
      const pz2 = pz * pz;
      const zOffset = iz * nx * ny;
      for (let iy = iy0; iy <= iy1; iy++) {
        const py = minY + iy * dy - atom.y;
        const pyz2 = pz2 + py * py;
        if (pyz2 > cutoffSq) continue;
        const yzOffset = zOffset + iy * nx;
        for (let ix = ix0; ix <= ix1; ix++) {
          const px = minX + ix * dx - atom.x;
          const d2 = pyz2 + px * px;
          if (d2 > cutoffSq) continue;
          const density = Math.exp(-d2 * invR2);
          const idx = yzOffset + ix;
          field[idx] += density;
          colR[idx] += ar * density;
          colG[idx] += ag * density;
          colB[idx] += ab * density;
        }
      }
    }
  }

  const iso = 0.36;
  const cxMax = nx - 1;
  const cyMax = ny - 1;
  const czMax = nz - 1;

  const cellVertex = new Int32Array(cxMax * cyMax * czMax).fill(-1);
  const positions: number[] = [];
  const colors: number[] = [];

  const edges: [number, number][] = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];

  const cornerOffsets = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, 1],
  ];

  const cornerVals = new Float32Array(8);

  // Step 1: Place one smooth vertex inside every active surface cell
  for (let z = 0; z < czMax; z++) {
    for (let y = 0; y < cyMax; y++) {
      for (let x = 0; x < cxMax; x++) {
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          const [ox, oy, oz] = cornerOffsets[c];
          const val = field[(z + oz) * nx * ny + (y + oy) * nx + (x + ox)];
          cornerVals[c] = val;
          if (val >= iso) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;

        let sx = 0;
        let sy = 0;
        let sz = 0;
        let count = 0;

        for (let e = 0; e < 12; e++) {
          const [c0, c1] = edges[e];
          const v0 = cornerVals[c0];
          const v1 = cornerVals[c1];
          if ((v0 >= iso) === (v1 >= iso)) continue;
          const t = (iso - v0) / (v1 - v0 || 1e-6);
          const o0 = cornerOffsets[c0];
          const o1 = cornerOffsets[c1];
          sx += o0[0] + (o1[0] - o0[0]) * t;
          sy += o0[1] + (o1[1] - o0[1]) * t;
          sz += o0[2] + (o1[2] - o0[2]) * t;
          count++;
        }

        if (count === 0) continue;

        const vx = minX + (x + sx / count) * dx;
        const vy = minY + (y + sy / count) * dy;
        const vz = minZ + (z + sz / count) * dz;

        const pIdx = z * nx * ny + y * nx + x;
        const weight = Math.max(field[pIdx], 1e-5);
        // Average over surrounding grid corner weighted colors
        let wr = 0;
        let wg = 0;
        let wb = 0;
        let wSum = 0;
        for (let c = 0; c < 8; c++) {
          const [ox, oy, oz] = cornerOffsets[c];
          const gIdx = (z + oz) * nx * ny + (y + oy) * nx + (x + ox);
          const fw = field[gIdx];
          if (fw > 1e-5) {
            wr += colR[gIdx];
            wg += colG[gIdx];
            wb += colB[gIdx];
            wSum += fw;
          }
        }
        const denom = wSum > 1e-5 ? wSum : weight;

        const vIndex = positions.length / 3;
        positions.push(vx, vy, vz);
        colors.push(
          Math.min(1, wr / denom),
          Math.min(1, wg / denom),
          Math.min(1, wb / denom),
        );
        cellVertex[z * cxMax * cyMax + y * cxMax + x] = vIndex;
      }
    }
  }

  const indices: number[] = [];
  const getCell = (x: number, y: number, z: number) =>
    cellVertex[z * cxMax * cyMax + y * cxMax + x];

  // Step 2: Emit dual quads for every crossing grid edge
  // X-aligned edges (shared by 4 cells in y, z)
  for (let z = 1; z < czMax; z++) {
    for (let y = 1; y < cyMax; y++) {
      for (let x = 0; x < cxMax; x++) {
        const v0 = field[z * nx * ny + y * nx + x];
        const v1 = field[z * nx * ny + y * nx + (x + 1)];
        const inside0 = v0 >= iso;
        const inside1 = v1 >= iso;
        if (inside0 === inside1) continue;

        const a = getCell(x, y - 1, z - 1);
        const b = getCell(x, y, z - 1);
        const c = getCell(x, y, z);
        const d = getCell(x, y - 1, z);
        if (a < 0 || b < 0 || c < 0 || d < 0) continue;

        if (inside0) {
          indices.push(a, b, c, a, c, d);
        } else {
          indices.push(a, c, b, a, d, c);
        }
      }
    }
  }

  // Y-aligned edges (shared by 4 cells in x, z)
  for (let z = 1; z < czMax; z++) {
    for (let y = 0; y < cyMax; y++) {
      for (let x = 1; x < cxMax; x++) {
        const v0 = field[z * nx * ny + y * nx + x];
        const v1 = field[z * nx * ny + (y + 1) * nx + x];
        const inside0 = v0 >= iso;
        const inside1 = v1 >= iso;
        if (inside0 === inside1) continue;

        const a = getCell(x - 1, y, z - 1);
        const b = getCell(x - 1, y, z);
        const c = getCell(x, y, z);
        const d = getCell(x, y, z - 1);
        if (a < 0 || b < 0 || c < 0 || d < 0) continue;

        if (inside0) {
          indices.push(a, b, c, a, c, d);
        } else {
          indices.push(a, c, b, a, d, c);
        }
      }
    }
  }

  // Z-aligned edges (shared by 4 cells in x, y)
  for (let z = 0; z < czMax; z++) {
    for (let y = 1; y < cyMax; y++) {
      for (let x = 1; x < cxMax; x++) {
        const v0 = field[z * nx * ny + y * nx + x];
        const v1 = field[(z + 1) * nx * ny + y * nx + x];
        const inside0 = v0 >= iso;
        const inside1 = v1 >= iso;
        if (inside0 === inside1) continue;

        const a = getCell(x - 1, y - 1, z);
        const b = getCell(x, y - 1, z);
        const c = getCell(x, y, z);
        const d = getCell(x - 1, y, z);
        if (a < 0 || b < 0 || c < 0 || d < 0) continue;

        if (inside0) {
          indices.push(a, b, c, a, c, d);
        } else {
          indices.push(a, c, b, a, d, c);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}
