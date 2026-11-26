'use client';

import React, { useRef, useState } from 'react';
import {
  Atom,
  Languages,
  Loader2,
  LogOut,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Upload,
} from 'lucide-react';
import { MOLECULE_PRESETS } from '@/lib/chemistry/presets';
import { Locale, TRANSLATIONS } from '@/lib/i18n';

interface HeaderBarProps {
  locale: Locale;
  onToggleLocale: () => void;
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  onImportFile: (file: File) => void;
  onAiLookup: (query: string) => Promise<void>;
  aiLoading: boolean;
  quotaUsed: number;
  quotaLimit: number;
  userEmail: string | null;
  onSignOut: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function HeaderBar({
  locale,
  onToggleLocale,
  activePresetId,
  onSelectPreset,
  onImportFile,
  onAiLookup,
  aiLoading,
  quotaUsed,
  quotaLimit,
  userEmail,
  onSignOut,
  sidebarOpen,
  onToggleSidebar,
}: HeaderBarProps) {
  const t = TRANSLATIONS[locale];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');

  const quotaExhausted = quotaUsed >= quotaLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || aiLoading || quotaExhausted) return;
    await onAiLookup(trimmed);
  };

  return (
    <header className="relative z-20 border-b border-emerald-600/20 bg-[#030A07]/95 px-3 py-2 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2.5 lg:flex-nowrap lg:gap-4">
        {/* Zone 1: Brand Wordmark + Preset Picker */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <Atom className="h-5 w-5 text-emerald-500" />
            <span className="text-base font-semibold tracking-tight text-emerald-50">
              {t.appName}
            </span>
          </div>

          <select
            aria-label={t.header.presetsLabel}
            value={activePresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="h-9 max-w-[160px] sm:max-w-[190px] rounded-lg border border-emerald-600/25 bg-[#06120D] px-2.5 text-xs font-medium text-emerald-50 focus:border-emerald-500 focus:outline-none"
          >
            {MOLECULE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {locale === 'pt-BR' ? preset.labelPt : preset.labelEn} (
                {preset.formatTag})
              </option>
            ))}
            {!MOLECULE_PRESETS.some((p) => p.id === activePresetId) && (
              <option value={activePresetId}>
                {locale === 'pt-BR' ? 'Personalizada' : 'Custom Loaded'}
              </option>
            )}
          </select>
        </div>

        {/* Zone 2: AI Molecule Lookup (gemini-4-hydrogen) */}
        <form
          onSubmit={handleSubmit}
          className="order-3 flex w-full items-center gap-1.5 lg:order-2 lg:max-w-md lg:flex-1"
        >
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-500/75" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={aiLoading || quotaExhausted}
              placeholder={
                quotaExhausted
                  ? t.header.quotaReachedShort
                  : t.header.searchPlaceholder
              }
              className="h-9 w-full rounded-lg border border-emerald-600/25 bg-[#06120D] pl-8 pr-3 text-xs text-emerald-50 placeholder:text-emerald-200/40 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || aiLoading || quotaExhausted}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-800 px-3 text-xs font-semibold text-emerald-50 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
          >
            {aiLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{aiLoading ? t.header.searching : t.header.searchButton}</span>
          </button>
        </form>

        {/* Zone 3: Quota · Import · Language Toggle · Account · Inspector Toggle */}
        <div className="order-2 flex items-center gap-1.5 sm:gap-2 lg:order-3 shrink-0">
          <div
            title={userEmail ?? undefined}
            className="hidden sm:flex items-center gap-1.5 px-2 text-xs text-emerald-200/75 whitespace-nowrap shrink-0"
          >
            <span
              className={`font-mono-tabular font-semibold ${
                quotaExhausted ? 'text-amber-400' : 'text-emerald-300'
              }`}
            >
              {quotaUsed}/{quotaLimit}
            </span>
            <span className="hidden xl:inline text-emerald-100/55">
              {t.header.dailyActionsUnit}
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdb,.ent,.sdf,.mol,.xyz,.cif,.mmcif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportFile(file);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            disabled={quotaExhausted}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-600/25 bg-[#06120D] px-2.5 sm:px-3 text-xs font-medium text-emerald-100 transition-colors hover:border-emerald-500/45 hover:bg-[#0A1D15] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
          >
            <Upload className="h-3.5 w-3.5 text-emerald-500" />
            <span className="hidden md:inline">{t.header.importFile}</span>
          </button>

          <button
            type="button"
            onClick={onToggleLocale}
            title={t.languageNextTitle}
            aria-label={t.languageNextTitle}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-600/25 bg-[#06120D] px-2.5 text-xs font-medium text-emerald-100 transition-colors hover:border-emerald-500/45 hover:bg-[#0A1D15] whitespace-nowrap shrink-0"
          >
            <Languages className="h-3.5 w-3.5 text-emerald-500" />
            <span>{t.languageButtonLabel}</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            title={`${t.header.signOut}${userEmail ? ` (${userEmail})` : ''}`}
            aria-label={t.header.signOut}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-600/25 bg-[#06120D] px-2.5 text-xs font-medium text-emerald-200/80 transition-colors hover:border-emerald-500/45 hover:text-emerald-50 whitespace-nowrap shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onToggleSidebar}
            title={
              sidebarOpen
                ? t.header.toggleSidebarClose
                : t.header.toggleSidebarOpen
            }
            aria-label={
              sidebarOpen
                ? t.header.toggleSidebarClose
                : t.header.toggleSidebarOpen
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-[#071610] px-2.5 text-xs font-medium text-emerald-100 transition-colors hover:border-emerald-500/50 hover:bg-[#0B2218] whitespace-nowrap shrink-0"
          >
            {sidebarOpen ? (
              <PanelRightClose className="h-4 w-4 text-emerald-500" />
            ) : (
              <PanelRightOpen className="h-4 w-4 text-emerald-500" />
            )}
            <span className="hidden sm:inline">
              {sidebarOpen
                ? t.header.toggleSidebarClose
                : t.header.toggleSidebarOpen}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
