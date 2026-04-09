import Link from "next/link";

export default function NavHeader({
  current,
}: {
  current: "qc" | "teletravail" | "freelance" | "favoris";
}) {
  const tabs = [
    { key: "qc", href: "/", label: "Québec" },
    { key: "teletravail", href: "/teletravail", label: "Télétravail CA/US" },
    { key: "freelance", href: "/freelance", label: "Freelance mondial" },
    { key: "favoris", href: "/favoris", label: "★ Favoris" },
  ] as const;

  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = t.key === current;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              active
                ? "bg-emerald-500 text-black border-emerald-400"
                : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
