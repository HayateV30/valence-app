'use client';

import React, { useState } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { ColorScheme, RepresentationMode } from '@/lib/chemistry/types';
import { Locale, TRANSLATIONS } from '@/lib/i18n';

interface BottomToolbarProps {
  locale: Locale;
  representation: RepresentationMode;
  onChangeRepresentation: (mode: RepresentationMode) => void;
  colorScheme: ColorScheme;
  onChangeColorScheme: (scheme: ColorScheme) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onResetView: () => void;
  onExportPng: () => void;
}

const REPRESENTATIONS: RepresentationMode[] = [
  'ball-and-stick',
  'space-filling',
  'licorice',
  'surface',
];

const COLOR_SCHEMES: ColorScheme[] = ['cpk', 'hydrophobicity', 'chain'];

export function BottomToolbar({
  locale,
  representation,
  onChangeRepresentation,
  colorScheme,
  onChangeColorScheme,
  autoRotate,
  onToggleAutoRotate,
  onResetView,
  onExportPng,
}: BottomToolbarProps) {
  const t = TRANSLATIONS[locale];
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="pointer-events-none flex h-full w-full flex-col items-center justify-end px-3 pb-3 sm:pb-5">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 rounded-md border border-emerald-600/25 bg-[#040C09]/94 px-2.5 py-1 text-[11px] font-medium text-emerald-200/80 transition-colors hover:border-emerald-500/45 hover:text-emerald-50 whitespace-nowrap"
      >
        {collapsed ? (
          <ChevronUp className="h-3 w-3 text-emerald-500" />
        ) : (
          <ChevronDown className="h-3 w-3 text-emerald-500" />
        )}
        <span>
          {collapsed ? t.toolbar.showControls : t.toolbar.hideControls}
        </span>
      </button>

      {!collapsed && (
        <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-emerald-600/20 bg-[#040C09]/94 p-1.5 sm:gap-2.5 sm:px-2.5 sm:py-2">
          {/* Representation mode selector */}
          <div className="flex items-center gap-1 rounded-lg bg-[#020705] p-0.5 overflow-x-auto max-w-full">
            {REPRESENTATIONS.map((mode) => {
              const active = representation === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChangeRepresentation(mode)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-emerald-800 text-emerald-50 border border-emerald-500/35 font-semibold'
                      : 'text-emerald-100/75 hover:bg-emerald-800/30 hover:text-emerald-50'
                  }`}
                >
                  {t.toolbar.representations[mode]}
                </button>
              );
            })}
          </div>

          <div
            aria-hidden="true"
            className="hidden h-5 w-px bg-emerald-600/20 md:block"
          />

          {/* Color scheme selector */}
          <div className="flex items-center gap-1 rounded-lg bg-[#020705] p-0.5">
            {COLOR_SCHEMES.map((scheme) => {
              const active = colorScheme === scheme;
              return (
                <button
                  key={scheme}
                  type="button"
                  onClick={() => onChangeColorScheme(scheme)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-emerald-900/70 text-emerald-100 border border-emerald-500/40'
                      : 'text-emerald-100/70 hover:bg-emerald-800/30 hover:text-emerald-50'
                  }`}
                >
                  {t.toolbar.colorSchemes[scheme]}
                </button>
              );
            })}
          </div>

          <div
            aria-hidden="true"
            className="hidden h-5 w-px bg-emerald-600/20 sm:block"
          />

          {/* Camera & utility actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleAutoRotate}
              aria-pressed={autoRotate}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                autoRotate
                  ? 'bg-emerald-900/70 text-emerald-100 border border-emerald-500/40'
                  : 'text-emerald-100/75 hover:bg-emerald-800/30 hover:text-emerald-50'
              }`}
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.toolbar.autoRotate}</span>
            </button>

            <button
              type="button"
              onClick={onResetView}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-100/75 transition-colors hover:bg-emerald-800/30 hover:text-emerald-50 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.toolbar.resetView}</span>
            </button>

            <button
              type="button"
              onClick={onExportPng}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-100/75 transition-colors hover:bg-emerald-800/30 hover:text-emerald-50 whitespace-nowrap shrink-0"
            >
              <Camera className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.toolbar.exportPng}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
