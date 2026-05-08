import { Clock3, GraduationCap, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";

import AdminPageHeader from "../../../components/dashboard/AdminPageHeader";
import AdvancedDashboardCharts from "../../../components/dashboard/AdvancedDashboardCharts";
import SurfaceCard from "../../../components/dashboard/SurfaceCard";
import { getVisibleAdminPortalItems } from "../../../config/adminPortal";
import { useAuth } from "../../../hooks/useAuth";
import { AreaComparisonChart, DonutBreakdown, HorizontalBars, MiniLineChart } from "../../../components/dashboard/SvgCharts";
import { useAdminDashboard, useFinanceSummary } from "../../../hooks/useAdminDashboard";

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const { data, isLoading } = useAdminDashboard();
  const { data: finance } = useFinanceSummary();

  if (isLoading || !data) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  }

  const kpis = [
    {
      label: "Total Etudiants",
      value: data.kpis.totalStudents,
      helper: "+12% vs annee precedente",
      icon: Users,
      accent: "text-secondary",
    },
    {
      label: "Taux de Recouvrement",
      value: `${data.kpis.recoveryRate.toFixed(1)}%`,
      helper: "progression financiere",
      icon: TrendingUp,
      accent: "text-secondary",
    },
    {
      label: "Taux de Reussite",
      value: `${data.kpis.successRate.toFixed(1)}%`,
      helper: "comparatif semestre precedent",
      icon: GraduationCap,
      accent: "text-dark",
    },
    {
      label: "Inscriptions en attente",
      value: data.kpis.pendingApplications,
      helper: "a traiter",
      icon: Clock3,
      accent: "text-primary",
    },
  ];

  const quickLinks = getVisibleAdminPortalItems(user?.role);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="Dashboard"
        description="Pilotez les activites cles de l'EMSP depuis ce tableau de bord centralise."
      >
        <Link
          to="/"
          className="inline-flex items-center rounded-2xl border border-secondary/20 bg-white px-4 py-2.5 text-sm font-semibold text-secondary transition hover:border-secondary hover:bg-secondary hover:text-white"
        >
          Retour a la page d'accueil
        </Link>
      </AdminPageHeader>

      <div className="grid gap-4 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <SurfaceCard key={item.label} className="emsp-panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className={`mt-4 font-display text-3xl font-bold ${item.accent}`}>{item.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.helper}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 text-secondary">
                  <Icon size={20} />
                </div>
              </div>
            </SurfaceCard>
          );
        })}
      </div>

      <SurfaceCard className="emsp-panel p-6">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.24em] text-secondary">Navigation rapide</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-dark">Modules du dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="emsp-panel rounded-3xl bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-secondary/40 hover:bg-white hover:shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold text-dark">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </SurfaceCard>

      <div className="grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
        <SurfaceCard className="emsp-panel p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-secondary">Inscriptions</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-dark">Evolution sur 5 ans</h2>
          <div className="mt-6">
            <MiniLineChart data={data.yearlyEnrolments.map((item) => ({ label: item.year, value: item.total }))} />
          </div>
        </SurfaceCard>
        <SurfaceCard className="emsp-panel p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-secondary">Effectifs</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-dark">Par pays membres</h2>
          <div className="mt-6">
            <HorizontalBars data={data.countryDistribution.map((item) => ({ label: item.pays, value: item.total }))} />
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SurfaceCard className="emsp-panel p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-secondary">Filiere</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-dark">Repartition par filiere</h2>
          <div className="mt-6">
            <DonutBreakdown data={data.formationDistribution.map((item) => ({ label: item.formationName, value: item.total }))} />
          </div>
        </SurfaceCard>
        <SurfaceCard className="emsp-panel p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-secondary">Finance</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-dark">Recouvrement mensuel</h2>
          <div className="mt-6">
            <AreaComparisonChart data={finance?.evolution || data.monthlyFinance} />
          </div>
          {finance ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Recettes du mois</p>
                <p className="mt-2 font-display text-2xl font-bold text-dark">{finance.monthlyRevenue.toLocaleString("fr-FR")} FCFA</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Paiements en attente</p>
                <p className="mt-2 font-display text-2xl font-bold text-dark">{finance.pendingPayments}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Impayes</p>
                <p className="mt-2 font-display text-2xl font-bold text-red-500">{finance.unpaidTotal.toLocaleString("fr-FR")} FCFA</p>
              </div>
            </div>
          ) : null}
        </SurfaceCard>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-secondary">Analyse rapide</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-dark">Vue legere du pilotage</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Graphiques compacts et immediats, optimises pour un affichage plus rapide en production.
          </p>
        </div>
        <AdvancedDashboardCharts data={data} />
      </div>

      <SurfaceCard className="emsp-panel p-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">Admissions</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-dark">Dernieres inscriptions</h2>
          </div>
          <span className="rounded-full bg-primary/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-dark">
            A traiter
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Nom</th>
                <th className="px-5 py-4 font-semibold">Pays</th>
                <th className="px-5 py-4 font-semibold">Filiere</th>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.latestInscriptions.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4 font-medium text-dark">{item.name}</td>
                  <td className="px-5 py-4 text-slate-600">{item.country}</td>
                  <td className="px-5 py-4 text-slate-600">{item.formation}</td>
                  <td className="px-5 py-4 text-slate-600">{item.date}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
};

export default AdminDashboardPage;
