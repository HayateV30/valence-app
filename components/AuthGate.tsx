'use client';

import React from 'react';
import { Atom, Languages, Loader2, LogIn } from 'lucide-react';
import { Locale, TRANSLATIONS } from '@/lib/i18n';

interface AuthGateProps {
  locale: Locale;
  onToggleLocale: () => void;
  onSignIn: () => void;
  signingIn: boolean;
  authError: string | null;
}

export function AuthGate({
  locale,
  onToggleLocale,
  onSignIn,
  signingIn,
  authError,
}: AuthGateProps) {
  const t = TRANSLATIONS[locale];

  const errorMessage =
    authError === 'popup-closed'
      ? t.auth.errorPopupClosed
      : authError === 'unverified'
        ? t.auth.errorUnverified
        : authError
          ? t.auth.errorGeneric
          : null;

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between bg-[radial-gradient(circle_at_50%_35%,#05140D_0%,#020705_70%)] p-6 sm:p-10">
      <header className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <Atom className="h-5 w-5 text-emerald-500" />
          <span className="text-lg font-semibold tracking-tight text-emerald-50">
            {t.appName}
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleLocale}
          title={t.languageNextTitle}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-600/25 bg-[#040C09] px-3 py-2 text-xs font-medium text-emerald-100 transition-colors hover:border-emerald-500/45 hover:bg-[#071610] whitespace-nowrap shrink-0"
        >
          <Languages className="h-3.5 w-3.5 text-emerald-500" />
          <span>{t.languageButtonLabel}</span>
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-col">
        <div className="rounded-2xl border border-emerald-600/20 bg-[#040C09] p-7 sm:p-9">
          <p className="text-xs font-medium tracking-wide text-emerald-400/90">
            {t.tagline}
          </p>

          <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-emerald-50 sm:text-3xl">
            {t.auth.heading}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-emerald-100/75">
            {t.auth.subheading}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-y border-emerald-600/15 py-3 text-xs text-emerald-200/70">
            <span>{t.auth.formatsNote}</span>
            <span aria-hidden="true">·</span>
            <span>{t.auth.quotaNote}</span>
            <span aria-hidden="true">·</span>
            <span>{t.auth.modelNote}</span>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-rose-400/25 bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-200"
            >
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={onSignIn}
            disabled={signingIn}
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-lg border border-emerald-500/35 bg-emerald-800 px-5 py-3 text-sm font-semibold text-emerald-50 transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signingIn ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            <span>{signingIn ? t.auth.signingIn : t.auth.signInButton}</span>
          </button>
        </div>
      </main>

      <footer className="text-center text-xs text-emerald-100/45">
        {t.appName} · {t.auth.quotaNote}
      </footer>
    </div>
  );
}
