import NavHeader from "./NavHeader";

interface Props {
  current: "qc" | "teletravail" | "freelance" | "favoris";
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  lastUpdate?: string | null;
  totalJobs?: number;
}

export default function PageHeader({
  current,
  eyebrow,
  title,
  description,
  lastUpdate,
  totalJobs,
}: Props) {
  return (
    <header className="pt-12 sm:pt-20 pb-8 sm:pb-12">
      {/* Ligne d'info top */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-medium text-white/40">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Jobs · Cybersécurité
        </div>
        {lastUpdate && (
          <div className="text-[11px] font-mono text-white/35">
            Dernière mise à jour&nbsp;:{" "}
            <span className="text-white/60">
              {new Date(lastUpdate).toLocaleDateString("fr-CA", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Titre + description */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent-300 text-[11px] font-medium mb-5 uppercase tracking-wider">
          {eyebrow}
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tightest leading-[1.05] text-white">
          {title}
        </h1>
        <p className="mt-5 text-base sm:text-lg text-white/55 leading-relaxed max-w-2xl">
          {description}
        </p>

        {typeof totalJobs === "number" && (
          <div className="mt-7 flex flex-wrap items-center gap-5 text-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-white tabular-nums">
                {totalJobs}
              </span>
              <span className="text-white/40">offres actives</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="text-white/40">
              Agrégation multi-sources · Rafraîchissement quotidien
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-10">
        <NavHeader current={current} />
      </div>
    </header>
  );
}
