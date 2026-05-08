import { Clock3, Receipt, Search, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import AdminMetricCard from "../../../components/dashboard/AdminMetricCard";
import AdminPageHeader from "../../../components/dashboard/AdminPageHeader";
import SurfaceCard from "../../../components/dashboard/SurfaceCard";
import { AreaComparisonChart } from "../../../components/dashboard/SvgCharts";
import { useAdminPayments, useFinanceSummary } from "../../../hooks/useAdminDashboard";
import { formatCurrency, formatDateTime } from "../../../utils/formatDate";

const paymentStatusClassName: Record<string, string> = {
  confirmed: "bg-secondary/10 text-secondary",
  pending: "bg-primary/40 text-dark",
  failed: "bg-red-50 text-red-600",
  refunded: "bg-slate-100 text-slate-600",
};

const operatorLabel: Record<string, string> = {
  orange: "Orange Money",
  mtn: "MTN MoMo",
  wave: "Wave",
};

const AdminAccountingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState<"" | "pending" | "confirmed" | "failed" | "refunded">(
    (searchParams.get("status") as "" | "pending" | "confirmed" | "failed" | "refunded") || "",
  );
  const [operator, setOperator] = useState<"" | "orange" | "mtn" | "wave">("");

  const { data: finance } = useFinanceSummary();
  const { data, isLoading } = useAdminPayments({
    search: search || undefined,
    status: status || undefined,
    operator: operator || undefined,
  });

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setStatus((searchParams.get("status") as "" | "pending" | "confirmed" | "failed" | "refunded") || "");
  }, [searchParams]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    const currentSearch = searchParams.get("search") || "";
    const currentStatus = (searchParams.get("status") as "" | "pending" | "confirmed" | "failed" | "refunded") || "";

    if (currentSearch === search && currentStatus === status) {
      return;
    }

    if (search) {
      nextParams.set("search", search);
    } else {
      nextParams.delete("search");
    }

    if (status) {
      nextParams.set("status", status);
    } else {
      nextParams.delete("status");
    }

    setSearchParams(nextParams, { replace: true });
  }, [search, searchParams, setSearchParams, status]);

  if (isLoading || !data) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="Comptabilite"
        description="Lecture consolidee des paiements, encaissements et relances. Les indicateurs financiers sont relies au tableau de recouvrement et a l'historique des transactions."
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <AdminMetricCard
          label="Recettes confirmees"
          value={formatCurrency(finance?.monthlyRevenue || data.summary.confirmedTotal)}
          helper="paiements encaisses"
          icon={Wallet}
          accent="text-secondary"
        />
        <AdminMetricCard
          label="Taux de recouvrement"
          value={`${(finance?.recoveryRate || 0).toFixed(1)}%`}
          helper="sur la population suivie"
          icon={TrendingUp}
          accent="text-dark"
        />
        <AdminMetricCard label="Paiements en attente" value={data.summary.pendingCount} helper="transactions a suivre" icon={Clock3} accent="text-primary" />
        <AdminMetricCard
          label="Impayes"
          value={formatCurrency(finance?.unpaidTotal || 0)}
          helper={`${data.summary.totalTransactions} transactions dans la vue`}
          icon={Receipt}
          accent="text-red-500"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SurfaceCard className="emsp-panel p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-secondary">Recouvrement</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-dark">Evolution mensuelle</h2>
          <div className="mt-6">
            <AreaComparisonChart data={finance?.evolution || []} />
          </div>
        </SurfaceCard>

        <SurfaceCard className="emsp-panel p-5">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_repeat(2,1fr)]">
            <label className="emsp-panel flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                type="search"
                placeholder="Reference, nom ou matricule"
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as "" | "pending" | "confirmed" | "failed" | "refunded")}
              className="emsp-panel rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
            >
              <option value="">Tous les statuts</option>
              <option value="confirmed">Confirmes</option>
              <option value="pending">En attente</option>
              <option value="failed">Echoues</option>
              <option value="refunded">Rembourses</option>
            </select>
            <select
              value={operator}
              onChange={(event) => setOperator(event.target.value as "" | "orange" | "mtn" | "wave")}
              className="emsp-panel rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
            >
              <option value="">Tous les operateurs</option>
              <option value="orange">Orange Money</option>
              <option value="mtn">MTN MoMo</option>
              <option value="wave">Wave</option>
            </select>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Confirmes</p>
              <p className="mt-2 font-display text-2xl font-bold text-secondary">{data.summary.confirmedCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">En attente</p>
              <p className="mt-2 font-display text-2xl font-bold text-dark">{data.summary.pendingCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">A traiter</p>
              <p className="mt-2 font-display text-2xl font-bold text-red-500">{data.summary.failedCount}</p>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="emsp-panel overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-sm uppercase tracking-[0.24em] text-secondary">Transactions</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-dark">Journal des paiements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Etudiant</th>
                <th className="px-5 py-4 font-semibold">Formation</th>
                <th className="px-5 py-4 font-semibold">Montant</th>
                <th className="px-5 py-4 font-semibold">Operateur</th>
                <th className="px-5 py-4 font-semibold">Reference</th>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.results.length ? (
                data.results.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-5 py-4 text-slate-600">
                      <p className="font-medium text-dark">{payment.studentName}</p>
                      <p className="text-xs text-slate-500">
                        {payment.matricule} - {payment.studentCountry}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{payment.formationName}</td>
                    <td className="px-5 py-4 font-medium text-dark">{formatCurrency(payment.montant)}</td>
                    <td className="px-5 py-4 text-slate-600">
                      <p>{operatorLabel[payment.operateur] || payment.operateur}</p>
                      <p className="text-xs text-slate-500">{payment.phoneNumber || "Sans numero"}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <p className="font-medium text-dark">{payment.reference || "Sans reference"}</p>
                      <p className="text-xs text-slate-500">{payment.description}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDateTime(payment.createdAt)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusClassName[payment.statut] || paymentStatusClassName.pending}`}>
                        {payment.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                    Aucune transaction ne correspond aux filtres selectionnes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
};

export default AdminAccountingPage;
