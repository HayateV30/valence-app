import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const MODEL_NAME = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getErrorStatus(error: unknown): { status: number; message: string } {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message:
        'Gemini free-tier rate limit reached. Please wait a moment and try again.',
    };
  }
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      message:
        'Gemini API access denied. Check GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (msg.includes('400') || msg.includes('API_KEY_INVALID')) {
    return {
      status: 400,
      message: 'Invalid Gemini API request or API key.',
    };
  }
  return { status: 500, message: msg };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action as 'lookup' | 'analyze';
    const locale = body?.locale === 'pt-BR' ? 'pt-BR' : 'en';
    const langInstruction =
      locale === 'pt-BR'
        ? 'Respond in clear Brazilian Portuguese (pt-BR).'
        : 'Respond in clear English.';

    const ai = getAiClient();

    if (action === 'lookup') {
      const query = String(body?.query ?? '').trim();
      if (!query || query.length > 160) {
        return NextResponse.json(
          { error: 'Please provide a valid molecule name or formula (1-160 chars).' },
          { status: 400 },
        );
      }

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Generate an accurate 3D molecular geometry in Angstroms for: "${query}".
Include all heavy atoms and attached hydrogens so the valences are chemically complete.
Keep atom coordinates physically realistic (typical covalent bond lengths: C-C ~1.54 Å, C=C ~1.34 Å, C-H ~1.09 Å, C-O ~1.43 Å, C=O ~1.22 Å, C-N ~1.47 Å, O-H ~0.96 Å, N-H ~1.01 Å) and well-spaced in 3D space.
Provide explicit covalent bond indices (0-based) and bond orders (1, 1.5 for aromatic, 2, or 3).`,
        config: {
          systemInstruction: `You are a computational chemistry structure builder. ${langInstruction} Return only valid JSON matching the schema.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: 'Common molecule name localized to the requested language.',
              },
              subtitle: {
                type: Type.STRING,
                description: 'Brief 1-sentence chemical classification or IUPAC note.',
              },
              atoms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    element: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    z: { type: Type.NUMBER },
                  },
                  required: ['element', 'x', 'y', 'z'],
                },
              },
              bonds: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    atomA: { type: Type.INTEGER },
                    atomB: { type: Type.INTEGER },
                    order: { type: Type.NUMBER },
                  },
                  required: ['atomA', 'atomB', 'order'],
                },
              },
            },
            required: ['name', 'subtitle', 'atoms', 'bonds'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      return NextResponse.json({ result: parsed });
    }

    if (action === 'analyze') {
      const molecule = body?.molecule;
      if (!molecule || !molecule.formulaString) {
        return NextResponse.json(
          { error: 'Missing molecule summary payload.' },
          { status: 400 },
        );
      }

      const compactPrompt = `Analyze this 3D molecule structure:
Name: ${String(molecule.name)}
Formula: ${String(molecule.formulaString)}
Molar Mass: ${Number(molecule.molecularWeight).toFixed(2)} g/mol
Atoms: ${Number(molecule.atomCount)}
Bonds: ${Number(molecule.bondCount)} (Single: ${Number(molecule.bondSummary?.single ?? 0)}, Double: ${Number(molecule.bondSummary?.double ?? 0)}, Triple: ${Number(molecule.bondSummary?.triple ?? 0)}, Aromatic: ${Number(molecule.bondSummary?.aromatic ?? 0)})
Mean Bond Length: ${Number(molecule.bondSummary?.avgBondLength ?? 0).toFixed(3)} Å
Top Bond Pairs: ${JSON.stringify(molecule.bondSummary?.pairFrequencies?.slice(0, 8) ?? [])}`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: compactPrompt,
        config: {
          systemInstruction: `You are an analytical chemistry specialist. ${langInstruction} Keep each section concise, accurate, and easy to read in a laboratory sidebar.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overview: {
                type: Type.STRING,
                description: '2 concise sentences explaining what this molecule is.',
              },
              bondingHighlights: {
                type: Type.STRING,
                description: '2-3 sentences covering covalent bond orders, hybridization, and key functional groups.',
              },
              geometryNotes: {
                type: Type.STRING,
                description: '1-2 sentences on 3D conformation, planarity/chirality, and polarity.',
              },
              applications: {
                type: Type.STRING,
                description: '1-2 sentences on biological, medicinal, or materials significance.',
              },
            },
            required: [
              'overview',
              'bondingHighlights',
              'geometryNotes',
              'applications',
            ],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      return NextResponse.json({ result: parsed });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (error) {
    const { status, message } = getErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
