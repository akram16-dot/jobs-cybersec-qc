import Link from "next/link";

export default function NavHeader({
  current,
}: {
  current: "qc" | "teletravail" | "freelance" | "favoris";
}) {
  const tabs = [
    { key: "qc", href: "/", label: "Québec" },
    { key: "teletravail", href: "/teletravail", label: "Télétravail CA/US" },
    { key: "freelance", href: "/freelance", label: "Freelance" },
    { key: "favoris", href: "/favoris", label: "Favoris" },
  ] as const;

  return (
    <nav
      aria-label="Navigation principale"
      className="inline-flex p-1 rounded-xl bg-ink-800/60 border border-white/[0.06] backdrop-blur-sm shadow-card"
    >
      {tabs.map((t) => {
        const active = t.key === current;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`relative px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                : "text-white/50 hover:text-white/90"
            }`}
          >
            {t.key === "favoris" && (
              <span
                className={`mr-1.5 ${active ? "text-accent-400" : "text-white/30"}`}
              >
                ★
              </span>
            )}
            {t.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-accent-400/80 to-transparent" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
