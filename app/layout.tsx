import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jobs Cybersécurité Québec",
  description:
    "Agrégateur d'offres d'emploi en cybersécurité au Québec, en télétravail CA/US et en freelance mondial. Mis à jour chaque jour.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e1a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased text-white bg-ink-900 relative overflow-x-hidden">
        {/* Base sombre */}
        <div className="fixed inset-0 -z-20 bg-ink-900" />
        {/* Halo accent coloré en haut */}
        <div
          aria-hidden
          className="fixed inset-0 -z-10 bg-halo pointer-events-none"
        />
        {/* Grille discrète */}
        <div
          aria-hidden
          className="fixed inset-0 -z-10 bg-grid pointer-events-none"
        />
        {children}
      </body>
    </html>
  );
}
