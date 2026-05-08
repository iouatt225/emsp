import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import FormationVisualFallback from "../../components/public/FormationVisualFallback";
import { useFormations } from "../../hooks/useFormations";
import { useMedia } from "../../hooks/useMedia";
import type { Formation } from "../../types";
import { getFormationPath, getProgramLabel } from "../../utils/formations";

interface FormationCategoryPageProps {
  programType: Formation["programType"];
}

const categoryCopy: Record<
  Formation["programType"],
  { subtitle: string; bullets: string[]; overview: string; admissionsTitle: string; admissions: string[] }
> = {
  FSP: {
    subtitle: "Le pole historique de l'EMSP pour former les leaders et cadres operationnels du secteur postal africain.",
    bullets: ["Cadres de direction", "Pilotage operationnel", "Controle et qualite de service", "Services financiers postaux"],
    overview:
      "Les Formations Superieures Postales regroupent les cycles ADM, INP et CTR. Elles s'adressent prioritairement aux cadres des administrations postales et des services financiers.",
    admissionsTitle: "Cycles disponibles",
    admissions: [
      "ADM : strategie, gouvernance et pilotage des directions postales.",
      "INP : supervision operationnelle, inspection et controle interne.",
      "CTR : exploitation postale, procedures et qualite de service.",
    ],
  },
  "FS-MENUM": {
    subtitle: "Licences, masters professionnels et parcours d'excellence pour accompagner la transformation numerique des organisations.",
    bullets: ["Licences professionnelles", "Masters professionnels", "Competences digitales appliquees", "Ouverture internationale"],
    overview:
      "Le pole Management de l'Economie Numerique s'adresse aux etudiants et aux professionnels de l'ecosysteme digital. Il couvre la logistique, la finance digitale, le marketing, la digitalisation des services et la transformation des organisations.",
    admissionsTitle: "Conditions d'admission",
    admissions: [
      "Licences (L1) : etre titulaire du baccalaureat et reussir au concours d'entree.",
      "Licences (L3) : admission sur concours pour les titulaires de BAC+2 ou BTS tertiaires selon la specialite.",
      "Masters (M1) : acces direct ou concours selon le parcours de licence d'origine.",
      "MS-RegNUM : parcours de reference pour les cadres des autorites de regulation et des ministeres en Afrique.",
    ],
  },
  FCQ: {
    subtitle: "Des formats courts et cibles pour la formation continue et la mise a niveau des professionnels.",
    bullets: ["Formats flexibles", "Calendriers adaptes", "Public en exercice", "Montee en competence rapide"],
    overview:
      "Les formations certifiantes demeurent disponibles pour des besoins specifiques de perfectionnement professionnel, meme lorsque le catalogue public met d'abord l'accent sur la FSP et la FS-MENUM.",
    admissionsTitle: "Acces",
    admissions: [
      "Ouverture selon les sessions publiees par l'EMSP.",
      "Selection sur dossier ou appel a candidatures selon le programme.",
    ],
  },
};

const FormationCategoryPage = ({ programType }: FormationCategoryPageProps) => {
  const { data: heroImages = [] } = useMedia("formations-hero", "image", 1);
  const { data: formations = [], isLoading } = useFormations({ type: programType });

  const licenses = formations.filter((item) => item.type === "LICENCE");
  const masters = formations.filter((item) => item.type === "MASTER");
  const displayFormations = programType === "FS-MENUM" ? [...licenses, ...masters] : formations;

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_58%,#fef9c3_100%)] py-20 text-dark">
        {heroImages[0] ? (
          <img src={heroImages[0].url} alt={heroImages[0].altText || heroImages[0].title} className="absolute inset-0 h-full w-full object-cover opacity-10" />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.2),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-4">
          <p className="text-sm font-medium text-secondary">Accueil / Formations / {getProgramLabel(programType)}</p>
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{getProgramLabel(programType)}</h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">{categoryCopy[programType].subtitle}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 className="font-display text-3xl font-bold text-dark">Vue d'ensemble</h2>
          <p className="mt-4 text-slate-600">
            {categoryCopy[programType].overview}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {categoryCopy[programType].bullets.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <CheckCircle2 className="text-secondary" size={20} />
                <span className="text-sm font-medium text-dark">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl bg-slate-50 p-6">
          <h3 className="font-display text-2xl font-semibold text-dark">{categoryCopy[programType].admissionsTitle}</h3>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Programmes publies</p>
              <p className="mt-2 font-display text-4xl font-bold text-dark">{formations.length}</p>
            </div>
            {programType === "FS-MENUM" ? (
              <>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Licences</p>
                  <p className="mt-2 font-display text-4xl font-bold text-secondary">{licenses.length}</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Masters</p>
                  <p className="mt-2 font-display text-4xl font-bold text-secondary">{masters.length}</p>
                </div>
              </>
            ) : null}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <ul className="space-y-3 text-sm leading-6 text-slate-600">
                {categoryCopy[programType].admissions.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-secondary" size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <h2 className="font-display text-3xl font-bold text-dark">Programmes disponibles</h2>
              <p className="mt-2 text-slate-600">Des fiches React branchees directement sur les donnees Django.</p>
            </div>
            <Link to="/formations" className="rounded-md border border-secondary px-4 py-2 font-semibold text-secondary">
              Retour au catalogue
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, index) => (
                <div key={`formation-category-skeleton-${index}`} className="h-72 animate-pulse rounded-3xl bg-white" />
              ))
            ) : displayFormations.length > 0 ? (
              displayFormations.map((formation) => (
                <article key={formation.code} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="grid md:grid-cols-[0.42fr_0.58fr]">
                    <div className="h-full min-h-56 bg-slate-100">
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
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">{formation.code}</span>
                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-dark">{formation.level}</span>
                      </div>
                      <h3 className="mt-4 font-display text-2xl font-semibold text-dark">{formation.name}</h3>
                      <p className="mt-2 text-sm font-medium text-slate-500">{formation.duration}</p>
                      <p className="mt-4 line-clamp-4 text-sm text-slate-600">{formation.description}</p>
                      <Link to={getFormationPath(formation)} className="mt-6 inline-flex rounded-md bg-secondary px-4 py-2 font-semibold text-white">
                        Ouvrir la fiche
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-secondary/30 bg-white p-10 text-center text-slate-500 lg:col-span-2">
                Aucun programme n'est encore disponible pour cette categorie.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FormationCategoryPage;
