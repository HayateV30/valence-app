import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Valence — 3D Molecular Viewer & Structural Inspector',
  description:
    'Interactive 3D molecule viewer supporting PDB, SDF/MOL, XYZ, and CIF formats, multiple structural views, atomic bonding inspection, EN/PT-BR localization, and gemini-4-hydrogen molecular insights.',
  openGraph: {
    title: 'Valence — 3D Molecular Viewer & Structural Inspector',
    description:
      'Interactive 3D molecule viewer supporting PDB, SDF/MOL, XYZ, and CIF formats, multiple structural views, atomic bonding inspection, and gemini-4-hydrogen molecular insights.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Valence — 3D Molecular Viewer & Structural Inspector',
    description:
      'Interactive 3D molecule viewer supporting PDB, SDF/MOL, XYZ, and CIF formats, multiple structural views, and atomic bonding inspection.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${plusJakartaSans.variable} ${ibmPlexMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#020705] text-[#ECFDF5] antialiased selection:bg-emerald-700/40 selection:text-emerald-100"
      >
        {children}
      </body>
    </html>
  );
}
