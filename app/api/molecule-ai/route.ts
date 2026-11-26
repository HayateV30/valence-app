import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import firebaseConfig from '../../../firebase-applet-config.json';
import {
  AuthError,
  InputError,
  MAX_BODY_BYTES,
  QuotaContext,
  QuotaError,
  allowIp,
  chargeAction,
  parseAiInput,
  readQuota,
  remainingToday,
  tryLockUser,
  unlockUser,
} from '@/lib/server/aiGuard';

const MODEL_NAME = 'gemini-4-hydrogen';

const QUOTA_CTX: QuotaContext = {
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId,
};

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

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
  if (error instanceof InputError) return { status: 400, message: error.message };
  if (error instanceof AuthError) return { status: 401, message: error.message };
  if (error instanceof QuotaError) {
    return { status: 429, message: 'Daily limit of AI actions reached. Try again tomorrow (UTC).' };
  }
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('RESOURCE_EXHAUSTED') || /\b429\b/.test(msg)) {
    return {
      status: 429,
      message:
        'Gemini free-tier rate limit reached. Please wait a moment and try again.',
    };
  }
  if (msg.includes('PERMISSION_DENIED') || /\b403\b/.test(msg)) {
    return {
      status: 403,
      message:
        'Gemini API access denied. Check GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (msg.includes('API_KEY_INVALID') || /\b400\b/.test(msg)) {
    return {
      status: 400,
      message: 'Invalid Gemini API request or API key.',
    };
  }
  console.error('molecule-ai failed:', msg);
  return { status: 500, message: 'The AI request failed. Please try again.' };
}

async function readBody(req: NextRequest): Promise<unknown> {
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) throw new InputError('Request body is too large.');
  const raw = await req.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    throw new InputError('Request body is too large.');
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new InputError('Request body is not valid JSON.');
  }
}

export async function POST(req: NextRequest) {
  if (!allowIp(clientIp(req))) {
    return NextResponse.json(
      { error: 'Too many requests. Wait a minute and try again.' },
      { status: 429 },
    );
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) {
    return NextResponse.json({ error: 'Sign in to use the AI features.' }, { status: 401 });
  }

  let lockedUid: string | null = null;
  try {
    const input = parseAiInput(await readBody(req));

    // Verifies the token through Firestore and reads today's count before any Gemini call.
    const quota = await readQuota(QUOTA_CTX, idToken);
    if (!tryLockUser(quota.uid)) {
      return NextResponse.json(
        { error: 'Another AI request is still running. Wait for it to finish.' },
        { status: 429 },
      );
    }
    lockedUid = quota.uid;
    if (remainingToday(quota) <= 0) throw new QuotaError('Daily limit reached.');

    // The action is charged only after Gemini answered (see chargeAfterSuccess).
    const chargeAfterSuccess = async () => {
      try {
        await chargeAction(QUOTA_CTX, idToken, quota, input.action);
      } catch (err) {
        if (!(err instanceof QuotaError)) throw err;
        // The document changed since the read (for example a file import): read again once.
        const fresh = await readQuota(QUOTA_CTX, idToken);
        await chargeAction(QUOTA_CTX, idToken, fresh, input.action);
      }
    };

    const locale = input.locale;
    const langInstruction =
      locale === 'pt-BR'
        ? 'Respond in clear Brazilian Portuguese (pt-BR).'
        : 'Respond in clear English.';

    const ai = getAiClient();

    if (input.action === 'lookup') {
      const query = input.query;

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
      if (!parsed || !Array.isArray(parsed.atoms) || parsed.atoms.length === 0) {
        throw new Error('Gemini returned no atoms.');
      }
      if (parsed.atoms.length > 2000) parsed.atoms = parsed.atoms.slice(0, 2000);
      await chargeAfterSuccess();
      return NextResponse.json({ result: parsed });
    }

    {
      const molecule = input.molecule;
      const pairs = molecule.pairFrequencies
        .map((p) => `${p.pair} (order ${p.order}, ${p.count}x, ${p.avgLength.toFixed(3)} Å)`)
        .join('; ');

      const compactPrompt = `Analyze this 3D molecule structure:
Name: ${molecule.name}
Formula: ${molecule.formulaString}
Molar Mass: ${molecule.molecularWeight.toFixed(2)} g/mol
Atoms: ${molecule.atomCount}
Bonds: ${molecule.bondCount} (Single: ${molecule.single}, Double: ${molecule.double}, Triple: ${molecule.triple}, Aromatic: ${molecule.aromatic})
Mean Bond Length: ${molecule.avgBondLength.toFixed(3)} Å
Top Bond Pairs: ${pairs || 'none'}`;

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
      if (!parsed || typeof parsed.overview !== 'string') {
        throw new Error('Gemini returned no analysis.');
      }
      await chargeAfterSuccess();
      return NextResponse.json({ result: parsed });
    }
  } catch (error) {
    const { status, message } = getErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  } finally {
    if (lockedUid) unlockUser(lockedUid);
  }
}
