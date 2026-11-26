'use client';

import React, { useMemo, useState } from 'react';
import { Sparkles, Loader2, X, Search } from 'lucide-react';
import { BondOrder, MoleculeData } from '@/lib/chemistry/types';
import { getElementInfo } from '@/lib/chemistry/elements';
import { Locale, TRANSLATIONS } from '@/lib/i18n';

export interface AiBondingAnalysis {
  overview: string;
  bondingHighlights: string;
  geometryNotes: string;
  applications: string;
}

interface SidebarOverlayProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  molecule: MoleculeData;
  selectedAtomIndex: number | null;
  selectedBondIndex: number | null;
  onSelectAtom: (index: number | null) => void;
  onSelectBond: (index: number | null) => void;
  aiAnalysis: AiBondingAnalysis | null;
  aiAnalyzing: boolean;
  quotaExhausted: boolean;
  onRequestAiAnalysis: () => void;
}

type SidebarTab = 'overview' | 'bonds' | 'atoms';

function formatBondOrderLabel(order: BondOrder, locale: Locale): string {
  const b = TRANSLATIONS[locale].sidebar.bondOrders;
  if (order === 2) return b.double;
  if (order === 3) return b.triple;
  if (order === 1.5) return b.aromatic;
  return b.single;
}

function bondSymbol(order: BondOrder): string {
  if (order === 2) return '=';
  if (order === 3) return '≡';
  if (order === 1.5) return '≈';
  return '–';
}

export function SidebarOverlay({
  open,
  onClose,
  locale,
  molecule,
  selectedAtomIndex,
  selectedBondIndex,
  onSelectAtom,
  onSelectBond,
  aiAnalysis,
  aiAnalyzing,
  quotaExhausted,
  onRequestAiAnalysis,
}: SidebarOverlayProps) {
  const t = TRANSLATIONS[locale];
  const [activeTab, setActiveTab] = useState<SidebarTab>('overview');
  const [bondFilter, setBondFilter] = useState('');
  const [atomFilter, setAtomFilter] = useState('');

  const filteredBonds = useMemo(() => {
    const q = bondFilter.trim().toLowerCase();
    if (!q) return molecule.bonds.slice(0, 250);
    return molecule.bonds
      .filter((bond) => {
        const a = molecule.atoms[bond.atomA];
        const b = molecule.atoms[bond.atomB];
        const sym = bondSymbol(bond.order);
        const pair = `${a.element}${sym}${b.element}`.toLowerCase();
        const revPair = `${b.element}${sym}${a.element}`.toLowerCase();
        const ordLabel = formatBondOrderLabel(bond.order, locale).toLowerCase();
        return (
          pair.includes(q) ||
          revPair.includes(q) ||
          ordLabel.includes(q) ||
          `${a.element}${b.element}`.toLowerCase().includes(q)
        );
      })
      .slice(0, 250);
  }, [molecule, bondFilter, locale]);

  const filteredAtoms = useMemo(() => {
    const q = atomFilter.trim().toLowerCase();
    if (!q) return molecule.atoms.slice(0, 300);
    return molecule.atoms
      .filter((atom) => {
        const elInfo = getElementInfo(atom.element);
        const elName =
          locale === 'pt-BR' ? elInfo.namePt.toLowerCase() : elInfo.nameEn.toLowerCase();
        return (
          atom.element.toLowerCase().includes(q) ||
          elName.includes(q) ||
          atom.residueName.toLowerCase().includes(q) ||
          atom.chainId.toLowerCase().includes(q) ||
          String(atom.index + 1) === q
        );
      })
      .slice(0, 300);
  }, [molecule, atomFilter, locale]);

  if (!open) return null;

  const selectedAtom =
    selectedAtomIndex !== null ? molecule.atoms[selectedAtomIndex] : null;
  const selectedBond =
    selectedBondIndex !== null ? molecule.bonds[selectedBondIndex] : null;

  return (
    <aside
      aria-label={t.appName}
      className="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l border-emerald-600/20 bg-[#040C09]/94 text-emerald-50 sm:w-[376px]"
    >
      {/* Molecule Header & Formula Readout */}
      <div className="border-b border-emerald-600/20 px-5 pt-4 pb-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-emerald-400/90 uppercase">
              {molecule.sourceFormat.toUpperCase()}
              {molecule.fileName ? ` · ${molecule.fileName}` : ''}
            </p>
            <h2 className="mt-0.5 truncate text-base font-semibold tracking-tight text-emerald-50">
              {molecule.name}
            </h2>
            {molecule.subtitle && (
              <p className="mt-0.5 line-clamp-2 text-xs text-emerald-100/65">
                {molecule.subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.header.toggleSidebarClose}
            className="rounded-lg p-1.5 text-emerald-200/70 transition-colors hover:bg-emerald-800/35 hover:text-emerald-50 sm:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Subscripted Chemical Formula & Tabular Key Metrics */}
        <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-emerald-600/15 pt-3">
          <div>
            <p className="text-[11px] text-emerald-100/55">{t.sidebar.formula}</p>
            <p className="mt-0.5 font-mono-tabular text-base font-semibold text-emerald-200">
              {molecule.formulaParts.map((part) => (
                <React.Fragment key={part.element}>
                  <span>{part.element}</span>
                  {part.count > 1 && (
                    <sub className="text-[11px] font-medium text-emerald-300/90">
                      {part.count}
                    </sub>
                  )}
                </React.Fragment>
              ))}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-emerald-100/55">{t.sidebar.molarMass}</p>
            <p className="mt-0.5 font-mono-tabular text-base font-semibold text-emerald-50">
              {molecule.molecularWeight.toFixed(2)}{' '}
              <span className="text-xs font-normal text-emerald-200/60">g/mol</span>
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 text-xs text-emerald-100/70">
          <span className="font-mono-tabular">
            {molecule.atomCount} {t.sidebar.atomsLabel.toLowerCase()}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">
            {molecule.bondCount} {t.sidebar.bondsLabel.toLowerCase()}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">
            {molecule.bondSummary.avgBondLength > 0
              ? `${molecule.bondSummary.avgBondLength.toFixed(2)} Å`
              : '—'}
          </span>
        </div>
      </div>

      {/* Selected Atom / Bond Inspection Callout */}
      {(selectedAtom || selectedBond) && (
        <div className="border-b border-emerald-600/25 bg-[#071610] px-5 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-emerald-300">
              {selectedAtom
                ? t.sidebar.selectedAtomTitle
                : t.sidebar.selectedBondTitle}
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectAtom(null);
                onSelectBond(null);
              }}
              className="text-[11px] font-medium text-emerald-200/70 hover:text-emerald-100"
            >
              {t.sidebar.clearSelection}
            </button>
          </div>

          {selectedAtom && (
            <div className="mt-1 space-y-0.5 text-xs">
              <p className="font-medium text-emerald-50">
                #{selectedAtom.index + 1} {selectedAtom.element} (
                {locale === 'pt-BR'
                  ? getElementInfo(selectedAtom.element).namePt
                  : getElementInfo(selectedAtom.element).nameEn}
                ) · {selectedAtom.degree} {t.sidebar.bondsLabel.toLowerCase()}
              </p>
              <p className="font-mono-tabular text-[11px] text-emerald-200/75">
                ({selectedAtom.x.toFixed(2)}, {selectedAtom.y.toFixed(2)},{' '}
                {selectedAtom.z.toFixed(2)}) Å
                {selectedAtom.residueName
                  ? ` · ${selectedAtom.residueName} ${selectedAtom.residueSeq} (${selectedAtom.chainId})`
                  : ''}
              </p>
            </div>
          )}

          {selectedBond && (
            <div className="mt-1 space-y-0.5 text-xs">
              <p className="font-medium text-emerald-50">
                {molecule.atoms[selectedBond.atomA]?.element}
                {selectedBond.atomA + 1} {bondSymbol(selectedBond.order)}{' '}
                {molecule.atoms[selectedBond.atomB]?.element}
                {selectedBond.atomB + 1} ·{' '}
                {formatBondOrderLabel(selectedBond.order, locale)}
              </p>
              <p className="font-mono-tabular text-[11px] text-emerald-200/75">
                {selectedBond.lengthAngstrom.toFixed(3)} Å ·{' '}
                {selectedBond.source === 'explicit'
                  ? t.sidebar.bondTable.explicit
                  : t.sidebar.bondTable.inferred}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Segmented Inspector Tabs */}
      <div className="px-5 pt-3">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-[#020705] p-1">
          {(['overview', 'bonds', 'atoms'] as SidebarTab[]).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'border border-emerald-500/35 bg-emerald-800 text-emerald-50 font-semibold'
                    : 'text-emerald-100/70 hover:text-emerald-50'
                }`}
              >
                {t.sidebar.tabs[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Element Composition */}
            <section>
              <h3 className="text-xs font-semibold text-emerald-200/85">
                {t.sidebar.elementComposition}
              </h3>
              <div className="mt-2.5 space-y-2">
                {molecule.elementBreakdown.map((item) => {
                  const elInfo = getElementInfo(item.element);
                  const elName = locale === 'pt-BR' ? elInfo.namePt : elInfo.nameEn;
                  return (
                    <div key={item.element} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-sm border border-white/15"
                            style={{ backgroundColor: elInfo.cpkHex }}
                          />
                          <span className="font-medium text-emerald-50">
                            {item.element}
                          </span>
                          <span className="text-emerald-100/60">{elName}</span>
                        </div>
                        <span className="font-mono-tabular text-emerald-200/85">
                          {item.count} ({item.massPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#020705]">
                        <div
                          className="h-full rounded-full bg-emerald-600/80"
                          style={{ width: `${Math.max(4, item.massPercent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Bond Order Distribution */}
            <section className="border-t border-emerald-600/20 pt-4">
              <h3 className="text-xs font-semibold text-emerald-200/85">
                {t.sidebar.bondingBreakdown}
              </h3>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                {[
                  { label: t.sidebar.bondOrders.single, count: molecule.bondSummary.single },
                  { label: t.sidebar.bondOrders.double, count: molecule.bondSummary.double },
                  { label: t.sidebar.bondOrders.triple, count: molecule.bondSummary.triple },
                  {
                    label: t.sidebar.bondOrders.aromatic,
                    count: molecule.bondSummary.aromatic,
                  },
                ].map((entry) => (
                  <div
                    key={entry.label}
                    className="rounded-lg border border-emerald-600/20 bg-[#030906] px-3 py-2"
                  >
                    <p className="text-[11px] text-emerald-100/60">{entry.label}</p>
                    <p className="mt-0.5 font-mono-tabular text-base font-semibold text-emerald-50">
                      {entry.count}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Bond Connectivity Pairs */}
            {molecule.bondSummary.pairFrequencies.length > 0 && (
              <section className="border-t border-emerald-600/20 pt-4">
                <h3 className="text-xs font-semibold text-emerald-200/85">
                  {t.sidebar.topBondPairs}
                </h3>
                <div className="mt-2.5 space-y-1.5">
                  {molecule.bondSummary.pairFrequencies.slice(0, 8).map((pf) => (
                    <div
                      key={`${pf.pair}-${pf.order}`}
                      className="flex items-center justify-between rounded-md bg-[#030906] px-3 py-1.5 text-xs"
                    >
                      <span className="font-mono-tabular font-medium text-emerald-100">
                        {pf.pair}
                      </span>
                      <div className="flex items-center gap-3 font-mono-tabular text-emerald-200/75">
                        <span>×{pf.count}</span>
                        <span>{pf.avgLength.toFixed(2)} Å</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* AI Bonding Summary via gemini-4-hydrogen */}
            <section className="border-t border-emerald-600/20 pt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-emerald-200/85">
                  {t.sidebar.aiSectionTitle}
                </h3>
              </div>

              {!aiAnalysis && (
                <button
                  type="button"
                  disabled={aiAnalyzing || quotaExhausted}
                  onClick={onRequestAiAnalysis}
                  className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-600/35 bg-emerald-900/45 px-3 py-2.5 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-800/55 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {aiAnalyzing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-300" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                  )}
                  <span>
                    {aiAnalyzing
                      ? t.sidebar.aiAnalyzing
                      : t.sidebar.aiExplainButton}
                  </span>
                </button>
              )}

              {aiAnalysis && (
                <div className="mt-3 space-y-3 rounded-lg border border-emerald-600/20 bg-[#030906] p-3.5 text-xs leading-relaxed">
                  <div>
                    <p className="font-semibold text-emerald-300">
                      {t.sidebar.aiSummaryOverview}
                    </p>
                    <p className="mt-1 text-emerald-100/85">{aiAnalysis.overview}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-300">
                      {t.sidebar.aiBondingHighlights}
                    </p>
                    <p className="mt-1 text-emerald-100/85">
                      {aiAnalysis.bondingHighlights}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-300">
                      {t.sidebar.aiGeometryNotes}
                    </p>
                    <p className="mt-1 text-emerald-100/85">
                      {aiAnalysis.geometryNotes}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-300">
                      {t.sidebar.aiApplications}
                    </p>
                    <p className="mt-1 text-emerald-100/85">
                      {aiAnalysis.applications}
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'bonds' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-500/75" />
              <input
                type="text"
                value={bondFilter}
                onChange={(e) => setBondFilter(e.target.value)}
                placeholder={t.sidebar.filterBondsPlaceholder}
                className="h-8 w-full rounded-lg border border-emerald-600/25 bg-[#020705] pl-8 pr-3 text-xs text-emerald-50 placeholder:text-emerald-200/40 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {filteredBonds.length === 0 ? (
              <p className="py-8 text-center text-xs text-emerald-100/50">
                {t.sidebar.noMatches}
              </p>
            ) : (
              <div className="divide-y divide-emerald-600/15 rounded-lg border border-emerald-600/20 bg-[#030906]">
                {filteredBonds.map((bond) => {
                  const a = molecule.atoms[bond.atomA];
                  const b = molecule.atoms[bond.atomB];
                  const selected = selectedBondIndex === bond.index;
                  return (
                    <button
                      key={bond.index}
                      type="button"
                      onClick={() => {
                        onSelectAtom(null);
                        onSelectBond(bond.index);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                        selected
                          ? 'bg-emerald-800/40 text-emerald-50'
                          : 'hover:bg-emerald-800/25 text-emerald-100/85'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-mono-tabular font-medium">
                          {a.element}
                          {bond.atomA + 1} {bondSymbol(bond.order)} {b.element}
                          {bond.atomB + 1}
                        </p>
                        <p className="text-[11px] text-emerald-200/60">
                          {formatBondOrderLabel(bond.order, locale)} ·{' '}
                          {bond.source === 'explicit'
                            ? t.sidebar.bondTable.explicit
                            : t.sidebar.bondTable.inferred}
                        </p>
                      </div>
                      <span className="font-mono-tabular text-xs font-semibold text-emerald-300 shrink-0">
                        {bond.lengthAngstrom.toFixed(3)} Å
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'atoms' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-500/75" />
              <input
                type="text"
                value={atomFilter}
                onChange={(e) => setAtomFilter(e.target.value)}
                placeholder={t.sidebar.filterAtomsPlaceholder}
                className="h-8 w-full rounded-lg border border-emerald-600/25 bg-[#020705] pl-8 pr-3 text-xs text-emerald-50 placeholder:text-emerald-200/40 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {filteredAtoms.length === 0 ? (
              <p className="py-8 text-center text-xs text-emerald-100/50">
                {t.sidebar.noMatches}
              </p>
            ) : (
              <div className="divide-y divide-emerald-600/15 rounded-lg border border-emerald-600/20 bg-[#030906]">
                {filteredAtoms.map((atom) => {
                  const elInfo = getElementInfo(atom.element);
                  const selected = selectedAtomIndex === atom.index;
                  return (
                    <button
                      key={atom.index}
                      type="button"
                      onClick={() => {
                        onSelectBond(null);
                        onSelectAtom(atom.index);
                      }}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors ${
                        selected
                          ? 'bg-emerald-800/40 text-emerald-50'
                          : 'hover:bg-emerald-800/25 text-emerald-100/85'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/20"
                          style={{ backgroundColor: elInfo.cpkHex }}
                        />
                        <div className="min-w-0">
                          <p className="font-mono-tabular font-medium truncate">
                            #{atom.index + 1} {atom.element}
                            {atom.residueName
                              ? ` · ${atom.residueName}${atom.residueSeq}:${atom.chainId}`
                              : ''}
                          </p>
                          <p className="font-mono-tabular text-[11px] text-emerald-200/60">
                            ({atom.x.toFixed(2)}, {atom.y.toFixed(2)},{' '}
                            {atom.z.toFixed(2)})
                          </p>
                        </div>
                      </div>
                      <span className="font-mono-tabular text-[11px] text-emerald-300/85 shrink-0">
                        {atom.degree} {t.sidebar.atomTable.degree.toLowerCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
