import { buildMoleculeData } from './builder';
import { parseCIF, parsePDB, parseSDFOrMOL, parseXYZ } from './parsers';
import { MoleculeData } from './types';

export interface MoleculePreset {
  id: string;
  labelEn: string;
  labelPt: string;
  categoryEn: string;
  categoryPt: string;
  formatTag: string;
  load: () => MoleculeData;
}

const CAFFEINE_SDF = `Caffeine
  Valence-Preset

 24 25  0  0  0  0  0  0  0  0999 V2000
    0.4712   -0.2584    0.0005 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.8814   -0.5944    0.0001 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.8256    0.4535   -0.0004 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.3095    1.7664   -0.0004 N   0  0  0  0  0  0  0  0  0  0  0  0
    0.0445    2.0840    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.9467    1.0332    0.0005 N   0  0  0  0  0  0  0  0  0  0  0  0
    1.2194   -1.4254    0.0009 N   0  0  0  0  0  0  0  0  0  0  0  0
    0.3407   -2.4609    0.0008 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.9557   -1.9765    0.0003 N   0  0  0  0  0  0  0  0  0  0  0  0
   -3.0402    0.2647   -0.0009 O   0  0  0  0  0  0  0  0  0  0  0  0
   -2.2562    2.8744   -0.0008 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.4272    3.2512    0.0001 O   0  0  0  0  0  0  0  0  0  0  0  0
    2.3736    1.3359    0.0009 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.6689   -1.5476    0.0014 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.6540   -3.4940    0.0010 H   0  0  0  0  0  0  0  0  0  0  0  0
   -2.8935    2.8110    0.8842 H   0  0  0  0  0  0  0  0  0  0  0  0
   -2.8930    2.8104   -0.8861 H   0  0  0  0  0  0  0  0  0  0  0  0
   -1.7114    3.8195   -0.0007 H   0  0  0  0  0  0  0  0  0  0  0  0
    2.8439    0.8920    0.8819 H   0  0  0  0  0  0  0  0  0  0  0  0
    2.5335    2.4148    0.0011 H   0  0  0  0  0  0  0  0  0  0  0  0
    2.8444    0.8923   -0.8800 H   0  0  0  0  0  0  0  0  0  0  0  0
    3.0954   -1.0558   -0.8763 H   0  0  0  0  0  0  0  0  0  0  0  0
    3.0947   -1.0574    0.8805 H   0  0  0  0  0  0  0  0  0  0  0  0
    2.9410   -2.6054    0.0007 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
  4  5  1  0  0  0  0
  5  6  1  0  0  0  0
  6  1  1  0  0  0  0
  1  7  1  0  0  0  0
  7  8  1  0  0  0  0
  8  9  2  0  0  0  0
  9  2  1  0  0  0  0
  3 10  2  0  0  0  0
  4 11  1  0  0  0  0
  5 12  2  0  0  0  0
  6 13  1  0  0  0  0
  7 14  1  0  0  0  0
  8 15  1  0  0  0  0
 11 16  1  0  0  0  0
 11 17  1  0  0  0  0
 11 18  1  0  0  0  0
 13 19  1  0  0  0  0
 13 20  1  0  0  0  0
 13 21  1  0  0  0  0
 14 22  1  0  0  0  0
 14 23  1  0  0  0  0
 14 24  1  0  0  0  0
M  END
$$$$`;

const ASPIRIN_SDF = `Aspirin (Acetylsalicylic Acid)
  Valence-Preset

 21 21  0  0  0  0  0  0  0  0999 V2000
    0.8588   -0.2512    0.0384 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.0176    0.8359   -0.0258 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.3911    0.6194   -0.0954 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.8842   -0.6800   -0.1047 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.0160   -1.7660   -0.0439 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.3554   -1.5544    0.0273 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.3230   -0.0325    0.1194 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.8520    1.0573    0.0147 O   0  0  0  0  0  0  0  0  0  0  0  0
    3.0385   -1.1583    0.3204 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.4785    2.1260   -0.0504 O   0  0  0  0  0  0  0  0  0  0  0  0
   -0.0885    3.0819    0.7905 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.9628    2.8746    1.5947 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.5535    4.4328    0.6134 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.0628    1.4660   -0.1450 H   0  0  0  0  0  0  0  0  0  0  0  0
   -2.9502   -0.8482   -0.1592 H   0  0  0  0  0  0  0  0  0  0  0  0
   -1.4048   -2.7753   -0.0522 H   0  0  0  0  0  0  0  0  0  0  0  0
    1.0318   -2.3983    0.0736 H   0  0  0  0  0  0  0  0  0  0  0  0
    3.9896   -0.9554    0.3676 H   0  0  0  0  0  0  0  0  0  0  0  0
    0.1180    5.1572    1.3016 H   0  0  0  0  0  0  0  0  0  0  0  0
    1.6226    4.3642    0.8190 H   0  0  0  0  0  0  0  0  0  0  0  0
    0.3910    4.7695   -0.4126 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  4  0  0  0  0
  2  3  4  0  0  0  0
  3  4  4  0  0  0  0
  4  5  4  0  0  0  0
  5  6  4  0  0  0  0
  6  1  4  0  0  0  0
  1  7  1  0  0  0  0
  7  8  2  0  0  0  0
  7  9  1  0  0  0  0
  2 10  1  0  0  0  0
 10 11  1  0  0  0  0
 11 12  2  0  0  0  0
 11 13  1  0  0  0  0
  3 14  1  0  0  0  0
  4 15  1  0  0  0  0
  5 16  1  0  0  0  0
  6 17  1  0  0  0  0
  9 18  1  0  0  0  0
 13 19  1  0  0  0  0
 13 20  1  0  0  0  0
 13 21  1  0  0  0  0
M  END
$$$$`;

const GLUCOSE_SDF = `Alpha-D-Glucose
  Valence-Preset

 24 24  0  0  0  0  0  0  0  0999 V2000
    0.6600   -0.2520   -0.4610 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.6180   -1.0840   -0.2890 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.8400   -0.2140   -0.5940 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.6930    1.1060    0.1680 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.3710    1.8160   -0.1300 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.7280    0.9640    0.2070 O   0  0  0  0  0  0  0  0  0  0  0  0
   -0.2330    3.1330    0.6250 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2690    4.0270    0.2580 O   0  0  0  0  0  0  0  0  0  0  0  0
    1.7660   -1.0190   -0.0110 O   0  0  0  0  0  0  0  0  0  0  0  0
   -0.6770   -2.2380   -1.1060 O   0  0  0  0  0  0  0  0  0  0  0  0
   -3.0120   -0.8920   -0.1940 O   0  0  0  0  0  0  0  0  0  0  0  0
   -2.7520    1.9810   -0.1960 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.7490   -0.0170   -1.5310 H   0  0  0  0  0  0  0  0  0  0  0  0
   -0.6280   -1.4000    0.7640 H   0  0  0  0  0  0  0  0  0  0  0  0
   -1.9110   -0.0080   -1.6740 H   0  0  0  0  0  0  0  0  0  0  0  0
   -1.7490    0.8870    1.2460 H   0  0  0  0  0  0  0  0  0  0  0  0
   -0.3040    2.0290   -1.2080 H   0  0  0  0  0  0  0  0  0  0  0  0
   -0.2890    2.9480    1.7070 H   0  0  0  0  0  0  0  0  0  0  0  0
    0.7480    3.5880    0.4220 H   0  0  0  0  0  0  0  0  0  0  0  0
   -1.1530    4.8610    0.7280 H   0  0  0  0  0  0  0  0  0  0  0  0
    2.5870   -0.5420   -0.1900 H   0  0  0  0  0  0  0  0  0  0  0  0
   -1.4910   -2.7100   -0.9020 H   0  0  0  0  0  0  0  0  0  0  0  0
   -3.7760   -0.3710   -0.4610 H   0  0  0  0  0  0  0  0  0  0  0  0
   -3.5750    1.5640    0.0880 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
  4  5  1  0  0  0  0
  5  6  1  0  0  0  0
  6  1  1  0  0  0  0
  5  7  1  0  0  0  0
  7  8  1  0  0  0  0
  1  9  1  0  0  0  0
  2 10  1  0  0  0  0
  3 11  1  0  0  0  0
  4 12  1  0  0  0  0
  1 13  1  0  0  0  0
  2 14  1  0  0  0  0
  3 15  1  0  0  0  0
  4 16  1  0  0  0  0
  5 17  1  0  0  0  0
  7 18  1  0  0  0  0
  7 19  1  0  0  0  0
  8 20  1  0  0  0  0
  9 21  1  0  0  0  0
 10 22  1  0  0  0  0
 11 23  1  0  0  0  0
 12 24  1  0  0  0  0
M  END
$$$$`;

const ETHANOL_XYZ = `9
Ethanol (C2H5OH)
C   -0.0470   -0.6680    0.0000
C   -1.1580    0.3690    0.0000
O    1.1990    0.0290    0.0000
H   -0.0880   -1.3120    0.8860
H   -0.0880   -1.3120   -0.8860
H   -1.1190    1.0140   -0.8850
H   -1.1190    1.0140    0.8850
H   -2.1260   -0.1410    0.0000
H    1.9150   -0.6180    0.0000`;

const PEPTIDE_PDB = `HEADER    SYNTHETIC ALPHA-HELIX PEPTIDE
TITLE     ALANINE-LEUCINE-GLUTAMATE ALPHA HELIX (PDB)
ATOM      1  N   ALA A   1      -1.458   1.229   0.000  1.00 10.00           N
ATOM      2  CA  ALA A   1      -0.461   0.165   0.000  1.00 10.00           C
ATOM      3  C   ALA A   1       0.923   0.808   0.000  1.00 10.00           C
ATOM      4  O   ALA A   1       1.044   2.031   0.000  1.00 10.00           O
ATOM      5  CB  ALA A   1      -0.629  -0.752   1.213  1.00 10.00           C
ATOM      6  N   LEU A   2       1.959  -0.025   0.000  1.00 10.00           N
ATOM      7  CA  LEU A   2       3.347   0.440   0.000  1.00 10.00           C
ATOM      8  C   LEU A   2       3.770   1.028  -1.345  1.00 10.00           C
ATOM      9  O   LEU A   2       4.530   1.995  -1.425  1.00 10.00           O
ATOM     10  CB  LEU A   2       4.262  -0.729   0.388  1.00 10.00           C
ATOM     11  CG  LEU A   2       5.736  -0.415   0.651  1.00 10.00           C
ATOM     12  CD1 LEU A   2       6.544  -1.691   0.892  1.00 10.00           C
ATOM     13  CD2 LEU A   2       5.887   0.528   1.842  1.00 10.00           C
ATOM     14  N   GLU A   3       3.249   0.422  -2.405  1.00 10.00           N
ATOM     15  CA  GLU A   3       3.525   0.875  -3.758  1.00 10.00           C
ATOM     16  C   GLU A   3       2.890   2.238  -4.018  1.00 10.00           C
ATOM     17  O   GLU A   3       3.465   3.076  -4.716  1.00 10.00           O
ATOM     18  CB  GLU A   3       2.981  -0.145  -4.763  1.00 10.00           C
ATOM     19  CG  GLU A   3       3.226   0.220  -6.224  1.00 10.00           C
ATOM     20  CD  GLU A   3       2.711  -0.816  -7.211  1.00 10.00           C
ATOM     21  OE1 GLU A   3       1.529  -1.201  -7.068  1.00 10.00           O
ATOM     22  OE2 GLU A   3       3.491  -1.239  -8.097  1.00 10.00           O
ATOM     23  N   VAL B   1       1.711   2.448  -3.433  1.00 10.00           N
ATOM     24  CA  VAL B   1       1.016   3.719  -3.588  1.00 10.00           C
ATOM     25  C   VAL B   1       1.773   4.864  -2.921  1.00 10.00           C
ATOM     26  O   VAL B   1       1.883   5.946  -3.495  1.00 10.00           O
ATOM     27  CB  VAL B   1      -0.415   3.619  -3.035  1.00 10.00           C
ATOM     28  CG1 VAL B   1      -1.189   4.922  -3.223  1.00 10.00           C
ATOM     29  CG2 VAL B   1      -1.137   2.449  -3.694  1.00 10.00           C
ATOM     30  N   LYS B   2       2.288   4.614  -1.719  1.00 10.00           N
ATOM     31  CA  LYS B   2       3.025   5.623  -0.968  1.00 10.00           C
ATOM     32  C   LYS B   2       4.369   5.932  -1.622  1.00 10.00           C
ATOM     33  O   LYS B   2       4.725   7.102  -1.760  1.00 10.00           O
ATOM     34  CB  LYS B   2       3.237   5.134   0.467  1.00 10.00           C
ATOM     35  CG  LYS B   2       3.947   6.135   1.368  1.00 10.00           C
ATOM     36  CD  LYS B   2       4.170   5.579   2.770  1.00 10.00           C
ATOM     37  CE  LYS B   2       4.872   6.588   3.669  1.00 10.00           C
ATOM     38  NZ  LYS B   2       5.091   6.040   5.032  1.00 10.00           N
END`;

const QUARTZ_CIF = `data_quartz_alpha
_chemical_name_common 'Alpha-Quartz (SiO2)'
_cell_length_a 4.916
_cell_length_b 4.916
_cell_length_c 5.405
_cell_angle_alpha 90.0
_cell_angle_beta 90.0
_cell_angle_gamma 120.0
loop_
_atom_site_label
_atom_site_type_symbol
_atom_site_fract_x
_atom_site_fract_y
_atom_site_fract_z
Si1 Si 0.4697 0.0000 0.0000
Si2 Si 0.0000 0.4697 0.6667
Si3 Si 0.5303 0.5303 0.3333
O1 O 0.4135 0.2669 0.1191
O2 O 0.2669 0.4135 0.5476
O3 O 0.7331 0.1466 0.7858
O4 O 0.5865 0.8534 0.2142
O5 O 0.8534 0.5865 0.4524
O6 O 0.1466 0.7331 0.8809`;

function buildFullereneC60(): MoleculeData {
  // Golden-ratio truncated icosahedron coordinates scaled to C-C ~1.42 A
  const phi = (1 + Math.sqrt(5)) / 2;
  const rawPts: [number, number, number][] = [];
  const addPermutations = (a: number, b: number, c: number) => {
    const signsA = a === 0 ? [0] : [a, -a];
    const signsB = b === 0 ? [0] : [b, -b];
    const signsC = c === 0 ? [0] : [c, -c];
    for (const sa of signsA) {
      for (const sb of signsB) {
        for (const sc of signsC) {
          rawPts.push([sa, sb, sc]);
          rawPts.push([sb, sc, sa]);
          rawPts.push([sc, sa, sb]);
        }
      }
    }
  };
  addPermutations(0, 1, 3 * phi);
  addPermutations(1, 2 + phi, 2 * phi);
  addPermutations(phi, 2, 2 * phi + 1);

  // Deduplicate and scale by ~0.71 to match 1.42 A C-C bond length
  const unique: [number, number, number][] = [];
  for (const p of rawPts) {
    if (
      !unique.some(
        (u) =>
          Math.abs(u[0] - p[0]) < 1e-4 &&
          Math.abs(u[1] - p[1]) < 1e-4 &&
          Math.abs(u[2] - p[2]) < 1e-4,
      )
    ) {
      unique.push(p);
    }
  }

  const scale = 0.71;
  const atoms = unique.map(([x, y, z]) => ({
    element: 'C',
    x: x * scale,
    y: y * scale,
    z: z * scale,
  }));

  // Connect nearest C-C neighbors (~1.42 A)
  const bonds = [];
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const dx = atoms[i].x - atoms[j].x;
      const dy = atoms[i].y - atoms[j].y;
      const dz = atoms[i].z - atoms[j].z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 1.65) {
        bonds.push({ atomA: i, atomB: j, order: 1.5 as const });
      }
    }
  }

  return buildMoleculeData({
    id: 'preset-c60',
    name: 'Buckminsterfullerene (C60)',
    sourceFormat: 'preset',
    atoms,
    explicitBonds: bonds,
    inferMissingBonds: false,
  });
}

export const MOLECULE_PRESETS: MoleculePreset[] = [
  {
    id: 'preset-caffeine',
    labelEn: 'Caffeine',
    labelPt: 'Cafeína',
    categoryEn: 'Alkaloid · SDF',
    categoryPt: 'Alcaloide · SDF',
    formatTag: 'SDF',
    load: () => ({
      ...parseSDFOrMOL(CAFFEINE_SDF, 'caffeine.sdf'),
      id: 'preset-caffeine',
      sourceFormat: 'preset',
    }),
  },
  {
    id: 'preset-aspirin',
    labelEn: 'Aspirin',
    labelPt: 'Aspirina',
    categoryEn: 'Pharmaceutical · SDF',
    categoryPt: 'Fármaco · SDF',
    formatTag: 'SDF',
    load: () => ({
      ...parseSDFOrMOL(ASPIRIN_SDF, 'aspirin.sdf'),
      id: 'preset-aspirin',
      sourceFormat: 'preset',
    }),
  },
  {
    id: 'preset-glucose',
    labelEn: 'Alpha-D-Glucose',
    labelPt: 'Alfa-D-Glicose',
    categoryEn: 'Carbohydrate · SDF',
    categoryPt: 'Carboidrato · SDF',
    formatTag: 'SDF',
    load: () => ({
      ...parseSDFOrMOL(GLUCOSE_SDF, 'glucose.sdf'),
      id: 'preset-glucose',
      sourceFormat: 'preset',
    }),
  },
  {
    id: 'preset-c60',
    labelEn: 'Fullerene C60',
    labelPt: 'Fulereno C60',
    categoryEn: 'Nanostructure',
    categoryPt: 'Nanoestrutura',
    formatTag: '3D',
    load: buildFullereneC60,
  },
  {
    id: 'preset-peptide',
    labelEn: 'Peptide Helix (A/B)',
    labelPt: 'Hélice Peptídica (A/B)',
    categoryEn: 'Biopolymer · PDB',
    categoryPt: 'Biopolímero · PDB',
    formatTag: 'PDB',
    load: () => ({
      ...parsePDB(PEPTIDE_PDB, 'peptide_helix.pdb'),
      id: 'preset-peptide',
      sourceFormat: 'preset',
    }),
  },
  {
    id: 'preset-quartz',
    labelEn: 'Alpha-Quartz (SiO2)',
    labelPt: 'Quartzo Alfa (SiO2)',
    categoryEn: 'Crystal · CIF',
    categoryPt: 'Cristal · CIF',
    formatTag: 'CIF',
    load: () => ({
      ...parseCIF(QUARTZ_CIF, 'quartz.cif'),
      id: 'preset-quartz',
      sourceFormat: 'preset',
    }),
  },
  {
    id: 'preset-ethanol',
    labelEn: 'Ethanol',
    labelPt: 'Etanol',
    categoryEn: 'Alcohol · XYZ',
    categoryPt: 'Álcool · XYZ',
    formatTag: 'XYZ',
    load: () => ({
      ...parseXYZ(ETHANOL_XYZ, 'ethanol.xyz'),
      id: 'preset-ethanol',
      sourceFormat: 'preset',
    }),
  },
];
