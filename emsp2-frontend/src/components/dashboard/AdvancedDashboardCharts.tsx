import { Activity, Globe2, Layers3 } from "lucide-react";

import type { AdminDashboardData } from "../../types";
import { DonutBreakdown, HorizontalBars, MiniLineChart } from "./SvgCharts";
import SurfaceCard from "./SurfaceCard";

interface AdvancedDashboardChartsProps {
  data: AdminDashboardData;
}

const AdvancedDashboardCharts = ({ data }: AdvancedDashboardChartsProps) => {
  const topCountries = data.countryDistribution
    .slice()
    .sort((left, right) => right.total - left.total)
    .slice(0, 6)
    .map((item) => ({
      label: item.pays,
      value: item.total,
    }));

  const topFormations = data.formationDistribution
    .slice(0, 5)
    .map((item) => ({
      label: item.formationName,
      value: item.total,
    }));

  const latestStatusBreakdown = Object.entries(
    data.latestInscriptions.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.status] = (accumulator[item.status] || 0) + 1;
      return accumulator;
    }, {}),
  ).map(([label, value]) => ({ label, value }));
  const donutData = topFormations.length ? topFormations : latestStatusBreakdown;

  const financePulse = data.monthlyFinance.map((item) => ({
    label: item.label,
    value: item.paid,
  }));

  const leadingCountry = topCountries[0];
  const leadingFormation = topFormations[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <SurfaceCard className="overflow-hidden border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_46%),linear-gradient(180deg,_#ffffff,_#f8fafc)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">Vue rapide</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-dark">Origines les plus representes</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Lecture immediate des bassins de recrutement les plus actifs.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-100/70 p-3 text-emerald-700">
            <Globe2 size={20} />
          </div>
        </div>
        <div className="mt-5">
          <HorizontalBars data={topCountries} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-emerald-100">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Pays leader</p>
            <p className="mt-2 font-display text-2xl font-bold text-dark">{leadingCountry?.label || "Aucun"}</p>
            <p className="mt-1 text-sm text-slate-500">{leadingCountry ? `${leadingCountry.value} etudiants` : "Aucune donnee disponible"}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-emerald-100">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Couverture</p>
            <p className="mt-2 font-display text-2xl font-bold text-dark">{data.countryDistribution.length}</p>
            <p className="mt-1 text-sm text-slate-500">zones ou pays suivis dans le dashboard</p>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-6">
        <SurfaceCard className="overflow-hidden border-amber-100 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.16),_transparent_44%),linear-gradient(180deg,_#ffffff,_#fffdf6)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-secondary">Equilibre</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-dark">Filieres et admissions</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Repartition synthese des filieres dominantes et des derniers statuts traites.
              </p>
            </div>
            <div className="rounded-2xl bg-amber-100/70 p-3 text-amber-700">
              <Layers3 size={20} />
            </div>
          </div>
          <div className="mt-5">
            {donutData.length ? (
              <DonutBreakdown data={donutData} />
            ) : (
              <div className="flex h-[260px] items-center justify-center rounded-3xl bg-white/75 text-sm text-slate-400">
                Les repartitions apparaitront apres les premieres inscriptions.
              </div>
            )}
          </div>
          <div className="mt-3 rounded-2xl bg-white/80 p-4 ring-1 ring-amber-100">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Filiere dominante</p>
            <p className="mt-2 font-semibold text-dark">{leadingFormation?.label || "Aucune filiere"}</p>
            <p className="mt-1 text-sm text-slate-500">
              {leadingFormation ? `${leadingFormation.value} inscriptions rattachees` : "Aucune donnee disponible"}
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard className="overflow-hidden border-sky-100 bg-[radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.14),_transparent_40%),linear-gradient(180deg,_#ffffff,_#f8fbff)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-secondary">Rythme</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-dark">Pulse financier</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Courbe legere pour suivre l&apos;encaissement recent sans surcharge du dashboard.
              </p>
            </div>
            <div className="rounded-2xl bg-sky-100/70 p-3 text-sky-700">
              <Activity size={20} />
            </div>
          </div>
          <div className="mt-5">
            <MiniLineChart data={financePulse} stroke="#0EA5E9" fill="rgba(14,165,233,0.14)" />
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
};

export default AdvancedDashboardCharts;
