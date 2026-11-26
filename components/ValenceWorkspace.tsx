'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { AuthGate } from '@/components/AuthGate';
import { BottomToolbar } from '@/components/BottomToolbar';
import { HeaderBar } from '@/components/HeaderBar';
import {
  MoleculeCanvas,
  MoleculeCanvasHandle,
} from '@/components/MoleculeCanvas';
import {
  AiBondingAnalysis,
  SidebarOverlay,
} from '@/components/SidebarOverlay';
import { buildMoleculeData } from '@/lib/chemistry/builder';
import { parseChemicalFile } from '@/lib/chemistry/parsers';
import { MOLECULE_PRESETS } from '@/lib/chemistry/presets';
import {
  BondOrder,
  ColorScheme,
  MoleculeData,
  RepresentationMode,
} from '@/lib/chemistry/types';
import { Locale, TRANSLATIONS } from '@/lib/i18n';

const LOCALE_STORAGE_KEY = 'valence_locale';
const LOCALE_EVENT = 'valence-locale-change';

function subscribeLocale(callback: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === LOCALE_STORAGE_KEY) callback();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(LOCALE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(LOCALE_EVENT, callback);
  };
}

function getLocaleSnapshot(): Locale {
  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'pt-BR' || saved === 'en') return saved;
  } catch {
    // Ignore storage failures
  }
  return 'en';
}

function getLocaleServerSnapshot(): Locale {
  return 'en';
}

export function ValenceWorkspace() {
  const {
    user,
    authReady,
    signingIn,
    authError,
    quota,
    signInWithGoogle,
    signOutUser,
    consumeDailyAction,
  } = useAuth();

  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getLocaleServerSnapshot,
  );
  const [activePresetId, setActivePresetId] = useState<string>(
    MOLECULE_PRESETS[0].id,
  );
  const [molecule, setMolecule] = useState<MoleculeData>(() =>
    MOLECULE_PRESETS[0].load(),
  );
  const [representation, setRepresentation] =
    useState<RepresentationMode>('ball-and-stick');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('cpk');
  const [autoRotate, setAutoRotate] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [selectedAtomIndex, setSelectedAtomIndex] = useState<number | null>(
    null,
  );
  const [selectedBondIndex, setSelectedBondIndex] = useState<number | null>(
    null,
  );

  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisCache, setAiAnalysisCache] = useState<
    Record<string, AiBondingAnalysis>
  >({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const canvasRef = useRef<MoleculeCanvasHandle | null>(null);
  const t = TRANSLATIONS[locale];

  // Sync sidebar visibility when crossing mobile breakpoint
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => {
      setSidebarOpen(!e.matches);
    };
    const timer = window.setTimeout(() => {
      if (mql.matches) setSidebarOpen(false);
    }, 0);
    mql.addEventListener('change', onChange);
    return () => {
      window.clearTimeout(timer);
      mql.removeEventListener('change', onChange);
    };
  }, []);

  const toggleLocale = useCallback(() => {
    const next: Locale = getLocaleSnapshot() === 'en' ? 'pt-BR' : 'en';
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      window.dispatchEvent(new Event(LOCALE_EVENT));
    } catch {
      // Ignore storage failures
    }
  }, []);

  const handleSelectPreset = useCallback((presetId: string) => {
    const preset = MOLECULE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setBannerError(null);
    setActivePresetId(preset.id);
    setSelectedAtomIndex(null);
    setSelectedBondIndex(null);
    setMolecule(preset.load());
  }, []);

  const handleImportFile = useCallback(
    async (file: File) => {
      setBannerError(null);
      if (quota.actionCount >= quota.limit) {
        setBannerError(t.errors.quotaExceeded);
        return;
      }

      try {
        const text = await file.text();
        const parsed = parseChemicalFile(text, file.name);
        const allowed = await consumeDailyAction('import');
        if (!allowed) {
          setBannerError(t.errors.quotaExceeded);
          return;
        }
        setActivePresetId(parsed.id);
        setSelectedAtomIndex(null);
        setSelectedBondIndex(null);
        setMolecule(parsed);
        setSidebarOpen(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t.errors.parseFailed;
        setBannerError(`${t.errors.parseFailed} ${msg}`);
      }
    },
    [consumeDailyAction, quota.actionCount, quota.limit, t.errors],
  );

  const handleAiLookup = useCallback(
    async (query: string) => {
      setBannerError(null);
      if (quota.actionCount >= quota.limit) {
        setBannerError(t.errors.quotaExceeded);
        return;
      }

      setAiLoading(true);
      try {
        const allowed = await consumeDailyAction('lookup');
        if (!allowed) {
          setBannerError(t.errors.quotaExceeded);
          return;
        }

        const res = await fetch('/api/molecule-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'lookup',
            query,
            locale,
          }),
        });

        const payload = await res.json();
        if (!res.ok || payload.error) {
          throw new Error(payload.error || t.errors.aiFailed);
        }

        const result = payload.result;
        if (!result || !Array.isArray(result.atoms) || result.atoms.length === 0) {
          throw new Error(t.errors.aiFailed);
        }

        const explicitBonds = Array.isArray(result.bonds)
          ? result.bonds.map(
              (b: { atomA: number; atomB: number; order?: number }) => {
                const ord: BondOrder =
                  b.order === 2
                    ? 2
                    : b.order === 3
                      ? 3
                      : b.order === 1.5
                        ? 1.5
                        : 1;
                return {
                  atomA: Number(b.atomA),
                  atomB: Number(b.atomB),
                  order: ord,
                };
              },
            )
          : [];

        const built = buildMoleculeData({
          id: `ai-${Date.now()}`,
          name: String(result.name || query),
          subtitle: result.subtitle ? String(result.subtitle) : undefined,
          sourceFormat: 'ai',
          atoms: result.atoms,
          explicitBonds,
          inferMissingBonds: true,
        });

        setActivePresetId(built.id);
        setSelectedAtomIndex(null);
        setSelectedBondIndex(null);
        setMolecule(built);
        setSidebarOpen(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t.errors.aiFailed;
        setBannerError(msg);
      } finally {
        setAiLoading(false);
      }
    },
    [consumeDailyAction, locale, quota.actionCount, quota.limit, t.errors],
  );

  const analysisKey = `${molecule.id}:${molecule.formulaString}:${locale}`;
  const currentAnalysis = aiAnalysisCache[analysisKey] ?? null;

  const handleRequestAiAnalysis = useCallback(async () => {
    setBannerError(null);
    if (currentAnalysis) return;
    if (quota.actionCount >= quota.limit) {
      setBannerError(t.errors.quotaExceeded);
      return;
    }

    setAiAnalyzing(true);
    try {
      const allowed = await consumeDailyAction('analyze');
      if (!allowed) {
        setBannerError(t.errors.quotaExceeded);
        return;
      }

      const res = await fetch('/api/molecule-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          locale,
          molecule: {
            name: molecule.name,
            formulaString: molecule.formulaString,
            molecularWeight: molecule.molecularWeight,
            atomCount: molecule.atomCount,
            bondCount: molecule.bondCount,
            bondSummary: molecule.bondSummary,
          },
        }),
      });

      const payload = await res.json();
      if (!res.ok || payload.error) {
        throw new Error(payload.error || t.errors.aiFailed);
      }

      setAiAnalysisCache((prev) => ({
        ...prev,
        [analysisKey]: payload.result as AiBondingAnalysis,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.errors.aiFailed;
      setBannerError(msg);
    } finally {
      setAiAnalyzing(false);
    }
  }, [
    analysisKey,
    consumeDailyAction,
    currentAnalysis,
    locale,
    molecule,
    quota.actionCount,
    quota.limit,
    t.errors,
  ]);

  if (!authReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#020705] text-emerald-200">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthGate
        locale={locale}
        onToggleLocale={toggleLocale}
        onSignIn={signInWithGoogle}
        signingIn={signingIn}
        authError={authError}
      />
    );
  }

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden bg-[#020705] text-[#ECFDF5]"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDraggingFile(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingFile(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void handleImportFile(file);
      }}
    >
      <HeaderBar
        locale={locale}
        onToggleLocale={toggleLocale}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onImportFile={handleImportFile}
        onAiLookup={handleAiLookup}
        aiLoading={aiLoading}
        quotaUsed={quota.actionCount}
        quotaLimit={quota.limit}
        userEmail={user.email}
        onSignOut={signOutUser}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <main className="relative flex-1 overflow-hidden">
        {/* 3D WebGL Stage */}
        <div className="h-full w-full">
          <MoleculeCanvas
            ref={canvasRef}
            molecule={molecule}
            representation={representation}
            colorScheme={colorScheme}
            autoRotate={autoRotate}
            selectedAtomIndex={selectedAtomIndex}
            selectedBondIndex={selectedBondIndex}
            onSelectAtom={setSelectedAtomIndex}
            onSelectBond={setSelectedBondIndex}
            webglLostLabel={t.errors.webglLost}
          />
        </div>

        {/* Dismissible Error / Quota Alert */}
        {bannerError && (
          <div
            role="alert"
            className={`absolute left-4 top-4 z-30 flex max-w-md items-start gap-2.5 rounded-lg border border-amber-400/30 bg-[#141A0F]/95 px-3.5 py-2.5 text-xs text-amber-100 ${
              sidebarOpen ? 'sm:right-[392px]' : ''
            }`}
          >
            <span className="flex-1 leading-relaxed">{bannerError}</span>
            <button
              type="button"
              onClick={() => setBannerError(null)}
              aria-label="Dismiss"
              className="rounded p-0.5 text-amber-200/70 hover:text-amber-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Bottom Representation & Camera Toolbar */}
        <div
          className={`pointer-events-none absolute inset-0 z-10 ${
            sidebarOpen ? 'sm:pr-[376px]' : ''
          }`}
        >
          <BottomToolbar
            locale={locale}
            representation={representation}
            onChangeRepresentation={setRepresentation}
            colorScheme={colorScheme}
            onChangeColorScheme={setColorScheme}
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((v) => !v)}
            onResetView={() => canvasRef.current?.resetCamera()}
            onExportPng={() => canvasRef.current?.exportPng()}
          />
        </div>

        {/* Collapsible Right Sidebar Overlay */}
        <SidebarOverlay
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          locale={locale}
          molecule={molecule}
          selectedAtomIndex={selectedAtomIndex}
          selectedBondIndex={selectedBondIndex}
          onSelectAtom={setSelectedAtomIndex}
          onSelectBond={setSelectedBondIndex}
          aiAnalysis={currentAnalysis}
          aiAnalyzing={aiAnalyzing}
          quotaExhausted={quota.actionCount >= quota.limit}
          onRequestAiAnalysis={handleRequestAiAnalysis}
        />

        {/* Drag-and-Drop Chemical File Overlay */}
        {isDraggingFile && (
          <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center border-2 border-dashed border-emerald-600/70 bg-[#020705]/88 p-6">
            <div className="flex flex-col items-center text-center">
              <Upload className="h-8 w-8 text-emerald-500" />
              <p className="mt-3 text-base font-semibold text-emerald-50">
                {t.dropzone.overlayTitle}
              </p>
              <p className="mt-1 text-xs text-emerald-200/75">
                {t.dropzone.overlaySubtitle}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
