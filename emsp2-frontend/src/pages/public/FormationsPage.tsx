import { GraduationCap, Laptop, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";

import FormationVisualFallback from "../../components/public/FormationVisualFallback";
import { useFormations } from "../../hooks/useFormations";
import { useMedia } from "../../hooks/useMedia";
import { getFormationPath, getProgramLabel } from "../../utils/formations";

const filters = [
  { value: "ALL", label: "Toutes les formations" },
  { value: "FSP", label: "FSP" },
  { value: "FS-MENUM", label: "FS-MENUM" },
] as const;

const highlights = [
  {
    title: "FSP",
    description: "Le pole historique de l'EMSP pour former les cadres de direction, d'inspection et de controle des postes africaines.",
    icon: GraduationCap,
    link: "/formations/fsp",
    classes: "bg-secondary text-white",
  },
  {
    title: "FS-MENUM",
    description: "Licences et masters professionnels pour accompagner la transformation numerique, logistique et financiere.",
    icon: Laptop,
    link: "/formations/fs-menum",
    classes: "border border-secondary/25 bg-white text-dark",
  },
  {
    title: "MS-RegNUM",
    description: "Le parcours d'excellence internationale en co-diplomation avec Telecom Paris pour les cadres du numerique.",
    icon: ShieldCheck,
    link: "/formations/fs-menum/ms-regnum",
    classes: "border-t-4 border-primary bg-white text-dark",
  },
];

const FormationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeType = searchParams.get("type") || "ALL";
  const { data: heroImages = [] } = useMedia("formations-hero", "image", 1);
  const { data: formations = [], isLoading } = useFormations(
    activeType === "ALL" ? undefined : { type: activeType },
  );

  const groupedCount = useMemo(
    () =>
      formations.reduce<Record<string, number>>((accumulator, item) => {
        accumulator[item.programType] = (accumulator[item.programType] || 0) + 1;
        return accumulator;
      }, {}),
    [formations],
  );

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_58%,#fef9c3_100%)] py-20 text-dark">
        {heroImages[0] ? (
          <img src={heroImages[0].url} alt={heroImages[0].altText || heroImages[0].title} className="absolute inset-0 h-full w-full object-cover opacity-10" />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.2),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-4">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-secondary">Catalogue</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold sm:text-5xl">
            Nos programmes de formation pour les secteurs postal et numerique
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            L'offre EMSP s'articule autour des Formations Superieures Postales, des licences et masters FS-MENUM, ainsi que d'un parcours d'excellence internationale.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {highlights.map(({ title, description, icon: Icon, link, classes }) => (
            <article key={title} className={`rounded-3xl p-6 shadow-sm ${classes}`}>
              <Icon size={30} />
              <h2 className="mt-5 font-display text-2xl font-semibold">{title}</h2>
              <p className={`mt-3 text-sm ${classes.includes("text-white") ? "text-white/90" : "text-slate-600"}`}>{description}</p>
              <Link
                to={link}
                className={`mt-6 inline-flex rounded-md px-4 py-2 font-semibold ${classes.includes("text-white") ? "bg-primary text-dark" : "bg-secondary text-white"}`}
              >
                Explorer
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold text-dark">Catalogue dynamique</h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                Filtre les programmes par grande famille et navigue vers les fiches detaillees de l'offre officielle EMSP.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeType === filter.value ? "bg-secondary text-white" : "border border-secondary/20 bg-white text-secondary"
                  }`}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    if (filter.value === "ALL") {
                      next.delete("type");
                    } else {
                      next.set("type", filter.value);
                    }
                    setSearchParams(next);
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-500">
            {Object.entries(groupedCount).map(([programType, count]) => (
              <span key={programType} className="rounded-full bg-white px-3 py-2 shadow-sm">
                {getProgramLabel(programType as "FSP" | "FS-MENUM" | "FCQ")} : {count}
              </span>
            ))}
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={`formation-skeleton-${index}`} className="h-72 animate-pulse rounded-3xl bg-white shadow-sm" />
              ))
            ) : formations.length > 0 ? (
              formations.map((formation) => (
                <article key={formation.code} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="h-48 bg-slate-100">
                    {formation.coverImage ? (
                      <img
                        src={formation.coverImage.url}
                        alt={formation.coverImage.altText || formation.coverImage.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FormationVisualFallback formation={formation} />
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">{formation.programType}</span>
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-dark">{formation.level}</span>
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-semibold text-dark">
                      {formation.code} - {formation.name}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-slate-500">{formation.duration}</p>
                    <p className="mt-4 line-clamp-4 text-sm text-slate-600">{formation.description}</p>
                    <Link to={getFormationPath(formation)} className="mt-6 inline-flex rounded-md bg-secondary px-4 py-2 font-semibold text-white">
                      Voir le detail
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-secondary/30 bg-white p-10 text-center text-slate-500 md:col-span-2 xl:col-span-3">
                Aucune formation n'est encore publiee dans l'API pour ce filtre.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FormationsPage;
