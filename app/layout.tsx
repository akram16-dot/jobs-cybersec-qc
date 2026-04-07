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
    "Toutes les offres d'emploi en cybersécurité au Québec, mises à jour chaque jour.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070b14",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased text-white bg-brand-dark relative overflow-x-hidden">
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-brand-navy via-[#0a1020] to-black" />
        <div
          aria-hidden
          className="fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(16,185,129,0.18), transparent 70%)",
          }}
        />
        {children}
      </body>
    </html>
  );
}
