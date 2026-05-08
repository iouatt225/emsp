import { Link, useLocation } from "react-router-dom";

const LABELS: Record<string, string> = {
  formations: "Formations",
  inscription: "Inscription",
  actualites: "Actualites",
  mediatheque: "Mediatheque",
  contact: "Contact",
  login: "Connexion",
  register: "Inscription portail",
  etudiant: "Portail etudiant",
  chauffeur: "Portail chauffeur",
  admin: "Administration",
  dashboard: "Tableau de bord",
  notes: "Notes",
  edt: "Emploi du temps",
  paiements: "Paiements",
  documents: "Documents",
  forum: "Forum",
  stages: "Stages",
  transport: "Gestion transport",
  etudiants: "Etudiants",
  scolarite: "Scolarite",
  comptabilite: "Comptabilite",
  enseignants: "Enseignants",
  candidatures: "Candidatures",
  statistiques: "Statistiques",
  parametres: "Parametres",
};

const humanize = (segment: string) => LABELS[segment] || segment.replace(/-/g, " ");

const Breadcrumbs = ({ className = "" }: { className?: string }) => {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (!segments.length) return null;

  const crumbs = [{ label: "Accueil", to: "/" }].concat(
    segments.map((seg, idx) => ({
      label: humanize(seg),
      to: "/" + segments.slice(0, idx + 1).join("/"),
    })),
  );

  return (
    <nav aria-label="Fil d'ariane" className={`text-xs text-slate-500 ${className}`}>
      <ol className="flex flex-wrap items-center gap-2">
        {crumbs.map((c, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li key={c.to} className="flex items-center gap-2">
              {isLast ? (
                <span className="font-medium text-slate-700">{c.label}</span>
              ) : (
                <Link to={c.to} className="hover:text-secondary">
                  {c.label}
                </Link>
              )}
              {!isLast ? <span className="text-slate-300">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;

