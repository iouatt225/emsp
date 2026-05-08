import { CheckCircle2, Clock3, FileCheck2, FileText, Search, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import AdminMetricCard from "../../../components/dashboard/AdminMetricCard";
import AdminPageHeader from "../../../components/dashboard/AdminPageHeader";
import SurfaceCard from "../../../components/dashboard/SurfaceCard";
import {
  useAdminApplicationDetail,
  useAdminApplications,
  useUpdateAdminApplicationStatus,
} from "../../../hooks/useAdminDashboard";
import { formatDateTime, formatLongDate } from "../../../utils/formatDate";

const statusClassName: Record<string, string> = {
  submitted: "bg-amber-100 text-amber-700",
  under_review: "bg-sky-100 text-sky-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const payload = (error as { response?: { data?: unknown } })?.response?.data;

  if (!payload) {
    return fallback;
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload === "object" && payload !== null) {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string") {
      return detail;
    }
  }

  return fallback;
};

const AdminApplicationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState<"" | "submitted" | "under_review" | "accepted" | "rejected">(
    (searchParams.get("status") as "" | "submitted" | "under_review" | "accepted" | "rejected") || "",
  );
  const [selectedApplicationId, setSelectedApplicationId] = useState<number>();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data, isLoading } = useAdminApplications({
    search: search || undefined,
    status: status || undefined,
  });
  const { data: applicationDetail, isLoading: isDetailLoading } = useAdminApplicationDetail(selectedApplicationId);
  const updateStatusMutation = useUpdateAdminApplicationStatus();

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setStatus((searchParams.get("status") as "" | "submitted" | "under_review" | "accepted" | "rejected") || "");
  }, [searchParams]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    const currentSearch = searchParams.get("search") || "";
    const currentStatus = (searchParams.get("status") as "" | "submitted" | "under_review" | "accepted" | "rejected") || "";

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

  useEffect(() => {
    if (!data?.results.length) {
      setSelectedApplicationId(undefined);
      return;
    }

    if (!selectedApplicationId || !data.results.some((item) => item.id === selectedApplicationId)) {
      setSelectedApplicationId(data.results[0].id);
    }
  }, [data?.results, selectedApplicationId]);

  const selectedSummary = useMemo(
    () => data?.results.find((item) => item.id === selectedApplicationId),
    [data?.results, selectedApplicationId],
  );

  if (isLoading || !data) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  }

  const handleStatusUpdate = async (nextStatus: "under_review" | "accepted" | "rejected") => {
    if (!selectedApplicationId) {
      return;
    }

    setFeedback(null);

    try {
      await updateStatusMutation.mutateAsync({ id: selectedApplicationId, status: nextStatus });
      const successText =
        nextStatus === "accepted"
          ? "Le dossier a ete confirme avec succes."
          : nextStatus === "under_review"
            ? "Le dossier a ete marque comme en cours d'examen."
            : "Le dossier a ete marque comme refuse.";
      setFeedback({ type: "success", text: successText });
    } catch (error) {
      setFeedback({ type: "error", text: getErrorMessage(error, "Impossible de mettre a jour ce dossier.") });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Admissions"
        title="Candidatures"
        description="Consultez chaque dossier de candidature, ouvrez les pieces jointes et confirmez rapidement les admissions depuis l'administration."
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <AdminMetricCard label="Total dossiers" value={data.summary.total} helper="candidatures recensees" icon={FileText} accent="text-dark" />
        <AdminMetricCard label="A traiter" value={data.summary.pending} helper="soumis ou en examen" icon={Clock3} accent="text-primary" />
        <AdminMetricCard label="Confirmes" value={data.summary.accepted} helper="dossiers valides" icon={CheckCircle2} accent="text-secondary" />
        <AdminMetricCard label="Refuses" value={data.summary.rejected} helper="dossiers closes" icon={XCircle} accent="text-red-500" />
      </div>

      <SurfaceCard className="emsp-panel p-5">
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <label className="emsp-panel flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="search"
              placeholder="Rechercher un dossier, un nom, un email ou une filiere"
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "" | "submitted" | "under_review" | "accepted" | "rejected")}
            className="emsp-panel rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="submitted">Soumis</option>
            <option value="under_review">En examen</option>
            <option value="accepted">Confirmes</option>
            <option value="rejected">Refuses</option>
          </select>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard className="emsp-panel overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">Dossiers recus</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-dark">Liste des candidatures</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Candidat</th>
                  <th className="px-5 py-4 font-semibold">Formation</th>
                  <th className="px-5 py-4 font-semibold">Nationalite</th>
                  <th className="px-5 py-4 font-semibold">Depot</th>
                  <th className="px-5 py-4 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.results.length ? (
                  data.results.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedApplicationId(item.id)}
                      className={`cursor-pointer transition hover:bg-slate-50 ${selectedApplicationId === item.id ? "bg-secondary/5" : ""}`}
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-dark">{item.fullName}</p>
                        <p className="text-xs text-slate-500">{item.dossierNumber}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <p className="font-medium text-dark">{item.formationCode}</p>
                        <p className="text-xs text-slate-500">{item.formationName}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{item.nationalityLabel}</td>
                      <td className="px-5 py-4 text-slate-600">{formatDateTime(item.createdAt)}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName[item.status] || "bg-slate-100 text-slate-600"}`}>
                          {item.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                      Aucune candidature ne correspond aux filtres selectionnes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SurfaceCard>

        <SurfaceCard className="emsp-panel p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-secondary">Dossier detaille</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-dark">
                {selectedSummary ? selectedSummary.fullName : "Selectionnez un dossier"}
              </h2>
            </div>
            {selectedSummary ? (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName[selectedSummary.status] || "bg-slate-100 text-slate-600"}`}>
                {selectedSummary.statusLabel}
              </span>
            ) : null}
          </div>

          {feedback ? (
            <div
              className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
                feedback.type === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {feedback.text}
            </div>
          ) : null}

          {isDetailLoading ? (
            <div className="mt-6 h-72 animate-pulse rounded-3xl bg-slate-100" />
          ) : applicationDetail ? (
            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleStatusUpdate("under_review")}
                  disabled={updateStatusMutation.isPending}
                  className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                >
                  Marquer en examen
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusUpdate("accepted")}
                  disabled={updateStatusMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                >
                  <FileCheck2 size={16} />
                  Confirmer le dossier
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={updateStatusMutation.isPending}
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                >
                  Refuser
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Numero de dossier</p>
                  <p className="mt-2 font-semibold text-dark">{applicationDetail.dossierNumber}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Date de depot</p>
                  <p className="mt-2 font-semibold text-dark">{formatDateTime(applicationDetail.createdAt)}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4 rounded-3xl border border-slate-200 p-5">
                  <h3 className="font-display text-xl font-semibold text-dark">Identite</h3>
                  <div className="space-y-3 text-sm text-slate-600">
                    <p><span className="font-semibold text-dark">Nom :</span> {applicationDetail.fullName}</p>
                    <p><span className="font-semibold text-dark">Email :</span> {applicationDetail.email}</p>
                    <p><span className="font-semibold text-dark">Telephone :</span> {applicationDetail.phone}</p>
                    <p><span className="font-semibold text-dark">WhatsApp :</span> {applicationDetail.whatsapp || "Non renseigne"}</p>
                    <p><span className="font-semibold text-dark">Naissance :</span> {formatLongDate(applicationDetail.dateOfBirth)} a {applicationDetail.placeOfBirth}</p>
                    <p><span className="font-semibold text-dark">Nationalite :</span> {applicationDetail.nationalityLabel}</p>
                    <p><span className="font-semibold text-dark">Residence :</span> {applicationDetail.residenceCountry}</p>
                    <p><span className="font-semibold text-dark">Adresse :</span> {applicationDetail.address}</p>
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-slate-200 p-5">
                  <h3 className="font-display text-xl font-semibold text-dark">Parcours</h3>
                  <div className="space-y-3 text-sm text-slate-600">
                    <p><span className="font-semibold text-dark">Formation :</span> {applicationDetail.formationCode} - {applicationDetail.formationName}</p>
                    <p><span className="font-semibold text-dark">Diplome :</span> {applicationDetail.highestDegreeLabel}</p>
                    <p><span className="font-semibold text-dark">Etablissement :</span> {applicationDetail.institutionName}</p>
                    <p><span className="font-semibold text-dark">Annee d'obtention :</span> {applicationDetail.graduationYear}</p>
                    <p><span className="font-semibold text-dark">Pays du diplome :</span> {applicationDetail.diplomaCountry}</p>
                    <p><span className="font-semibold text-dark">Experience :</span> {applicationDetail.professionalExperience || "Non renseignee"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 p-5">
                <h3 className="font-display text-xl font-semibold text-dark">Motivation</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {applicationDetail.motivationText || "Aucun texte de motivation saisi."}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 p-5">
                <h3 className="font-display text-xl font-semibold text-dark">Pieces jointes</h3>
                <div className="mt-4 grid gap-3">
                  <a href={applicationDetail.acknowledgementUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-secondary transition hover:bg-secondary hover:text-white">
                    Accuse de reception
                  </a>
                  <a href={applicationDetail.transcriptUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-secondary transition hover:bg-secondary hover:text-white">
                    Releve de notes
                  </a>
                  <a href={applicationDetail.diplomaUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-secondary transition hover:bg-secondary hover:text-white">
                    Diplome
                  </a>
                  {applicationDetail.motivationFileUrl ? (
                    <a href={applicationDetail.motivationFileUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-secondary transition hover:bg-secondary hover:text-white">
                      Lettre de motivation
                    </a>
                  ) : null}
                  {applicationDetail.additionalDocuments.map((document) => (
                    <a
                      key={document.id}
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-secondary transition hover:bg-secondary hover:text-white"
                    >
                      Document complementaire : {document.originalName}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">Selectionnez une candidature pour consulter son dossier complet.</p>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
};

export default AdminApplicationsPage;
