import { CheckCircle2, GraduationCap, Pencil, Plus, Save, Search, ShieldAlert, Users, Wallet } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import AdminMetricCard from "../../../components/dashboard/AdminMetricCard";
import AdminPageHeader from "../../../components/dashboard/AdminPageHeader";
import SurfaceCard from "../../../components/dashboard/SurfaceCard";
import { HorizontalBars } from "../../../components/dashboard/SvgCharts";
import {
  useAdminStudentOptions,
  useAdminStudents,
  useCreateAdminStudent,
  useUpdateAdminLegacyStudent,
  useUpdateAdminPortalStudent,
} from "../../../hooks/useAdminDashboard";
import type { AdminLegacyStudentPayload, AdminPortalStudentPayload, AdminStudent } from "../../../types";
import { formatCurrency, formatDate } from "../../../utils/formatDate";

const statusClassName = (isActive: boolean) =>
  isActive ? "bg-secondary/10 text-secondary" : "bg-red-50 text-red-600";

const getDefaultLegacyForm = (): AdminLegacyStudentPayload => ({
  matricule: "",
  fullName: "",
  gender: "",
  age: null,
  phone: "",
  hobbies: "",
});

const getDefaultPortalForm = (): AdminPortalStudentPayload => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  matricule: "",
  formationId: 0,
  promotionId: null,
  pays: "CI",
  dateNaissance: "",
  lieuNaissance: "",
  rangPromotion: 1,
  soldeScolarite: 0,
  isActive: true,
  password: "emsp12345",
});

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

    for (const value of Object.values(payload)) {
      if (typeof value === "string") {
        return value;
      }
      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
    }
  }

  return fallback;
};

const AdminStudentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState<"" | "active" | "inactive">("");
  const [country, setCountry] = useState("");
  const [formation, setFormation] = useState("");
  const [editingStudent, setEditingStudent] = useState<AdminStudent | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [legacyForm, setLegacyForm] = useState<AdminLegacyStudentPayload>(getDefaultLegacyForm);
  const [portalForm, setPortalForm] = useState<AdminPortalStudentPayload>(getDefaultPortalForm);

  const { data, isLoading } = useAdminStudents({
    search: search || undefined,
    status: status || undefined,
    country: country || undefined,
    formation: formation || undefined,
  });
  const { data: options } = useAdminStudentOptions();
  const createStudentMutation = useCreateAdminStudent();
  const updateLegacyStudentMutation = useUpdateAdminLegacyStudent();
  const updatePortalStudentMutation = useUpdateAdminPortalStudent();

  const isLegacyDataset = data?.datasetMode === "legacy";
  const isSubmitting =
    createStudentMutation.isPending ||
    updateLegacyStudentMutation.isPending ||
    updatePortalStudentMutation.isPending;

  const filteredPromotions = useMemo(
    () =>
      options?.promotions.filter((promotion) => !portalForm.formationId || promotion.formationId === portalForm.formationId) || [],
    [options?.promotions, portalForm.formationId],
  );

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    const currentSearch = searchParams.get("search") || "";
    if (currentSearch === search) {
      return;
    }
    if (search) {
      nextParams.set("search", search);
    } else {
      nextParams.delete("search");
    }
    setSearchParams(nextParams, { replace: true });
  }, [search, searchParams, setSearchParams]);

  useEffect(() => {
    if (!editingStudent) {
      if (isLegacyDataset) {
        setLegacyForm(getDefaultLegacyForm());
      } else {
        setPortalForm(getDefaultPortalForm());
      }
    }
  }, [editingStudent, isLegacyDataset]);

  useEffect(() => {
    if (portalForm.promotionId && !filteredPromotions.some((promotion) => promotion.id === portalForm.promotionId)) {
      setPortalForm((current) => ({ ...current, promotionId: null }));
    }
  }, [filteredPromotions, portalForm.promotionId]);

  useEffect(() => {
    if (!editingStudent || isLegacyDataset || portalForm.formationId || !options?.formations.length) {
      return;
    }

    setPortalForm((current) => ({
      ...current,
      formationId: editingStudent.formationId || options.formations.find((item) => item.code === editingStudent.formationCode)?.id || 0,
      promotionId:
        editingStudent.promotionId ||
        options.promotions.find(
          (item) => item.label === editingStudent.promotionLabel && item.formationCode === editingStudent.formationCode,
        )?.id ||
        null,
    }));
  }, [editingStudent, isLegacyDataset, options, portalForm.formationId]);

  if (isLoading || !data) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  }

  const countriesMap: Record<string, { label: string; value: number }> = {};
  const formationsMap: Record<string, number> = {};
  const genderMap: Record<string, number> = {};
  const ageMap: Record<string, number> = {};

  for (const item of data.results) {
    if (!countriesMap[item.country]) {
      countriesMap[item.country] = { label: item.countryLabel, value: 0 };
    }
    countriesMap[item.country].value += 1;
    formationsMap[item.formationCode] = (formationsMap[item.formationCode] || 0) + 1;

    if (item.genderLabel) {
      genderMap[item.genderLabel] = (genderMap[item.genderLabel] || 0) + 1;
    }

    if (typeof item.age === "number") {
      const bucket =
        item.age <= 18
          ? "18 ans et moins"
          : item.age <= 21
            ? "19 - 21 ans"
            : item.age <= 24
              ? "22 - 24 ans"
              : "25 ans et plus";
      ageMap[bucket] = (ageMap[bucket] || 0) + 1;
    }
  }

  const countryStats = Object.values(countriesMap).sort((a, b) => b.value - a.value);
  const formationStats = Object.entries(formationsMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const genderStats = Object.entries(genderMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const ageStats = Object.entries(ageMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const countryOptions = Array.from(new Set(data.results.map((item) => item.country)))
    .sort()
    .map((code) => data.results.find((item) => item.country === code))
    .filter(Boolean);

  const formationOptions = Array.from(new Set(data.results.map((item) => item.formationCode)))
    .sort()
    .map((code) => data.results.find((item) => item.formationCode === code))
    .filter(Boolean);

  const primaryChartData = isLegacyDataset ? genderStats : countryStats;
  const secondaryChartData = isLegacyDataset ? ageStats : formationStats;

  const startCreate = () => {
    setEditingStudent(null);
    setFeedback(null);
    if (isLegacyDataset) {
      setLegacyForm(getDefaultLegacyForm());
      return;
    }
    setPortalForm(getDefaultPortalForm());
  };

  const startEdit = (student: AdminStudent) => {
    setEditingStudent(student);
    setFeedback(null);

    if (isLegacyDataset) {
      setLegacyForm({
        matricule: student.matricule,
        fullName: student.fullName,
        gender: (student.gender as "" | "M" | "F") || "",
        age: typeof student.age === "number" ? student.age : null,
        phone: student.phone || "",
        hobbies: student.hobbies || "",
      });
      return;
    }

    setPortalForm({
      firstName: student.firstName || student.fullName.split(" ").slice(0, -1).join(" ") || student.fullName,
      lastName: student.lastName || student.fullName.split(" ").slice(-1).join(" "),
      email: student.email,
      phone: student.phone || "",
      matricule: student.matricule,
      formationId: student.formationId || options?.formations.find((item) => item.code === student.formationCode)?.id || 0,
      promotionId:
        student.promotionId ||
        options?.promotions.find(
          (item) => item.label === student.promotionLabel && item.formationCode === student.formationCode,
        )?.id ||
        null,
      pays: student.country || "CI",
      dateNaissance: student.dateNaissance || "",
      lieuNaissance: student.lieuNaissance || "",
      rangPromotion: student.rank || 1,
      soldeScolarite: student.balance || 0,
      isActive: student.isActive,
      password: "",
    });
  };

  const handleLegacySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    try {
      if (editingStudent) {
        await updateLegacyStudentMutation.mutateAsync({
          matricule: editingStudent.matricule,
          payload: legacyForm,
        });
        setFeedback({ type: "success", text: "Les informations de l'etudiant ont ete mises a jour." });
      } else {
        await createStudentMutation.mutateAsync(legacyForm);
        setFeedback({ type: "success", text: "Le nouvel etudiant legacy a ete ajoute." });
      }
      setEditingStudent(null);
      setLegacyForm(getDefaultLegacyForm());
    } catch (error) {
      setFeedback({ type: "error", text: getErrorMessage(error, "Impossible d'enregistrer cet etudiant.") });
    }
  };

  const handlePortalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    try {
      if (editingStudent) {
        await updatePortalStudentMutation.mutateAsync({
          id: editingStudent.id,
          payload: portalForm,
        });
        setFeedback({ type: "success", text: "Les informations de l'etudiant ont ete mises a jour." });
      } else {
        const response = await createStudentMutation.mutateAsync(portalForm);
        const passwordNote =
          typeof response?.initial_password === "string"
            ? ` Mot de passe initial : ${response.initial_password}.`
            : "";
        setFeedback({ type: "success", text: `Le nouvel etudiant a ete ajoute.${passwordNote}` });
      }
      setEditingStudent(null);
      setPortalForm(getDefaultPortalForm());
    } catch (error) {
      setFeedback({ type: "error", text: getErrorMessage(error, "Impossible d'enregistrer cet etudiant.") });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="Etudiants"
        description={
          isLegacyDataset
            ? "La liste est alimentee directement par les donnees reelles de la table MySQL `etudiant` de la base emsp. Vous pouvez maintenant ajouter et corriger les fiches directement depuis ce module."
            : "Suivi des effectifs, des promotions et des situations administratives. Les filtres ci-dessous permettent d'isoler rapidement une cohorte ou un pays membre."
        }
      >
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          <Plus size={18} />
          {isLegacyDataset ? "Ajouter un etudiant" : "Creer un profil"}
        </button>
      </AdminPageHeader>

      <div className="grid gap-4 xl:grid-cols-4">
        <AdminMetricCard label="Effectif total" value={data.summary.total} helper="etudiants visibles dans la selection" icon={Users} accent="text-secondary" />
        <AdminMetricCard label="Actifs" value={data.summary.active} helper="dossiers disponibles" icon={CheckCircle2} accent="text-dark" />
        <AdminMetricCard label="Suspendus" value={data.summary.inactive} helper="a regulariser" icon={ShieldAlert} accent="text-red-500" />
        <AdminMetricCard
          label="Solde cumule"
          value={formatCurrency(data.summary.outstandingBalance)}
          helper={`${data.summary.promotions} promotions concernees`}
          icon={Wallet}
          accent="text-primary"
        />
      </div>

      <SurfaceCard className="emsp-panel p-5">
        <div className={`grid gap-4 ${isLegacyDataset ? "lg:grid-cols-[1.6fr_1fr]" : "lg:grid-cols-[1.6fr_repeat(3,1fr)]"}`}>
          <label className="emsp-panel flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="search"
              placeholder={isLegacyDataset ? "Rechercher un nom, contact, hobby ou matricule" : "Rechercher un nom, email ou matricule"}
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "" | "active" | "inactive")}
            className="emsp-panel rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Suspendus</option>
          </select>
          {!isLegacyDataset ? (
            <>
              <select
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="emsp-panel rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              >
                <option value="">Tous les pays</option>
                {countryOptions.map((item) => (
                  <option key={item?.country} value={item?.country}>
                    {item?.countryLabel}
                  </option>
                ))}
              </select>
              <select
                value={formation}
                onChange={(event) => setFormation(event.target.value)}
                className="emsp-panel rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              >
                <option value="">Toutes les filieres</option>
                {formationOptions.map((item) => (
                  <option key={item?.formationCode} value={item?.formationCode}>
                    {item?.formationCode} - {item?.formationName}
                  </option>
                ))}
              </select>
            </>
          ) : null}
        </div>
      </SurfaceCard>

      <div className="grid gap-6 2xl:grid-cols-[1.35fr_0.65fr]">
        <SurfaceCard className="emsp-panel overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">Liste officielle</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-dark">{isLegacyDataset ? "Etudiants de la base emsp" : "Cohortes et dossiers"}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Etudiant</th>
                  <th className="px-5 py-4 font-semibold">{isLegacyDataset ? "Contact" : "Formation"}</th>
                  <th className="px-5 py-4 font-semibold">{isLegacyDataset ? "Profil" : "Promotion"}</th>
                  <th className="px-5 py-4 font-semibold">{isLegacyDataset ? "Hobbies" : "Pays"}</th>
                  <th className="px-5 py-4 font-semibold">{isLegacyDataset ? "Age" : "Rang"}</th>
                  <th className="px-5 py-4 font-semibold">{isLegacyDataset ? "Source" : "Solde"}</th>
                  <th className="px-5 py-4 font-semibold">Statut</th>
                  <th className="px-5 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.results.length ? (
                  data.results.map((item) => (
                    <tr key={`${item.source || "student"}-${item.id}-${item.matricule}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {item.photoUrl ? (
                            <img src={item.photoUrl} alt={item.fullName} className="h-11 w-11 rounded-2xl object-cover" />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 font-semibold text-secondary">
                              {item.fullName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-dark">{item.fullName}</p>
                            <p className="text-xs text-slate-500">{item.matricule}</p>
                            {item.enrolledAt ? <p className="text-xs text-slate-400">Inscrit le {formatDate(item.enrolledAt)}</p> : null}
                          </div>
                        </div>
                      </td>

                      {isLegacyDataset ? (
                        <>
                          <td className="px-5 py-4 text-slate-600">
                            <p className="font-medium text-dark">{item.phone || "Non renseigne"}</p>
                            <p className="text-xs text-slate-500">Contact issu de la base emsp</p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            <p className="font-medium text-dark">{item.genderLabel || "Non renseigne"}</p>
                            <p className="text-xs text-slate-500">{typeof item.age === "number" ? `${item.age} ans` : "Age non renseigne"}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            <p className="max-w-[18rem] whitespace-pre-line text-sm">{item.hobbies || "Non renseignes"}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">{typeof item.age === "number" ? `${item.age} ans` : "N/A"}</td>
                          <td className="px-5 py-4 font-medium text-dark">Table etudiant (EMSP)</td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-4 text-slate-600">
                            <p className="font-medium text-dark">{item.formationCode}</p>
                            <p className="text-xs text-slate-500">{item.formationName}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            <p>{item.promotionLabel || "Non affecte"}</p>
                            <p className="text-xs text-slate-500">{item.academicYear || "Sans annee"}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">{item.countryLabel}</td>
                          <td className="px-5 py-4 text-slate-600">#{item.rank}</td>
                          <td className="px-5 py-4 font-medium text-dark">{item.balanceLabel}</td>
                        </>
                      )}

                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(item.isActive)}`}>
                          {item.statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-secondary hover:text-secondary"
                        >
                          <Pencil size={14} />
                          Modifier
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                      Aucun etudiant ne correspond aux filtres selectionnes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard className="emsp-panel p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-secondary">Gestion</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-dark">
                  {editingStudent ? "Modifier l'etudiant" : isLegacyDataset ? "Ajouter un etudiant" : "Creer un profil etudiant"}
                </h2>
              </div>
              {editingStudent ? (
                <button
                  type="button"
                  onClick={startCreate}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-dark"
                >
                  Nouveau
                </button>
              ) : null}
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isLegacyDataset
                ? "Ce formulaire met a jour directement la base EMSP historique."
                : "Ce formulaire cree ou met a jour un compte utilisateur et son dossier etudiant dans le portail."}
            </p>

            {feedback ? (
              <div
                className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
                  feedback.type === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-red-200 bg-red-50 text-red-600"
                }`}
              >
                {feedback.text}
              </div>
            ) : null}

            {isLegacyDataset ? (
              <form onSubmit={handleLegacySubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Matricule</span>
                    <input
                      value={legacyForm.matricule}
                      onChange={(event) => setLegacyForm((current) => ({ ...current, matricule: event.target.value.toUpperCase() }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Sexe</span>
                    <select
                      value={legacyForm.gender}
                      onChange={(event) => setLegacyForm((current) => ({ ...current, gender: event.target.value as "" | "M" | "F" }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    >
                      <option value="">Non renseigne</option>
                      <option value="M">Masculin</option>
                      <option value="F">Feminin</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Nom complet</span>
                  <input
                    value={legacyForm.fullName}
                    onChange={(event) => setLegacyForm((current) => ({ ...current, fullName: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    required
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Age</span>
                    <input
                      type="number"
                      min={0}
                      value={legacyForm.age ?? ""}
                      onChange={(event) =>
                        setLegacyForm((current) => ({
                          ...current,
                          age: event.target.value ? Number(event.target.value) : null,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Contact</span>
                    <input
                      value={legacyForm.phone || ""}
                      onChange={(event) => setLegacyForm((current) => ({ ...current, phone: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Hobbies</span>
                  <textarea
                    rows={3}
                    value={legacyForm.hobbies || ""}
                    onChange={(event) => setLegacyForm((current) => ({ ...current, hobbies: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={18} />
                  {isSubmitting ? "Enregistrement..." : editingStudent ? "Mettre a jour" : "Ajouter l'etudiant"}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePortalSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Prenom</span>
                    <input
                      value={portalForm.firstName}
                      onChange={(event) => setPortalForm((current) => ({ ...current, firstName: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Nom</span>
                    <input
                      value={portalForm.lastName}
                      onChange={(event) => setPortalForm((current) => ({ ...current, lastName: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                      required
                    />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Email</span>
                    <input
                      type="email"
                      value={portalForm.email}
                      onChange={(event) => setPortalForm((current) => ({ ...current, email: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Telephone</span>
                    <input
                      value={portalForm.phone || ""}
                      onChange={(event) => setPortalForm((current) => ({ ...current, phone: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Matricule</span>
                    <input
                      value={portalForm.matricule}
                      onChange={(event) => setPortalForm((current) => ({ ...current, matricule: event.target.value.toUpperCase() }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Pays</span>
                    <select
                      value={portalForm.pays}
                      onChange={(event) => setPortalForm((current) => ({ ...current, pays: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    >
                      {(options?.countries || []).map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Filiere</span>
                    <select
                      value={portalForm.formationId}
                      onChange={(event) => setPortalForm((current) => ({ ...current, formationId: Number(event.target.value), promotionId: null }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                      required
                    >
                      <option value={0}>Selectionner</option>
                      {(options?.formations || []).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.code} - {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Promotion</span>
                    <select
                      value={portalForm.promotionId || ""}
                      onChange={(event) =>
                        setPortalForm((current) => ({
                          ...current,
                          promotionId: event.target.value ? Number(event.target.value) : null,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    >
                      <option value="">Aucune</option>
                      {filteredPromotions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label} - {item.academicYear}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Date de naissance</span>
                    <input
                      type="date"
                      value={portalForm.dateNaissance || ""}
                      onChange={(event) => setPortalForm((current) => ({ ...current, dateNaissance: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Lieu de naissance</span>
                    <input
                      value={portalForm.lieuNaissance || ""}
                      onChange={(event) => setPortalForm((current) => ({ ...current, lieuNaissance: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Rang</span>
                    <input
                      type="number"
                      min={1}
                      value={portalForm.rangPromotion || 1}
                      onChange={(event) =>
                        setPortalForm((current) => ({
                          ...current,
                          rangPromotion: Number(event.target.value) || 1,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-dark">Solde scolarite</span>
                    <input
                      type="number"
                      min={0}
                      value={portalForm.soldeScolarite || 0}
                      onChange={(event) =>
                        setPortalForm((current) => ({
                          ...current,
                          soldeScolarite: Number(event.target.value) || 0,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Mot de passe initial</span>
                  <input
                    type="text"
                    value={portalForm.password || ""}
                    onChange={(event) => setPortalForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder={editingStudent ? "Laisser vide pour conserver l'actuel" : "emsp12345"}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  />
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={portalForm.isActive ?? true}
                    onChange={(event) => setPortalForm((current) => ({ ...current, isActive: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-secondary"
                  />
                  Etudiant actif dans le portail
                </label>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={18} />
                  {isSubmitting ? "Enregistrement..." : editingStudent ? "Mettre a jour" : "Creer le profil"}
                </button>
              </form>
            )}
          </SurfaceCard>

          <SurfaceCard className="emsp-panel p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-secondary/10 p-3 text-secondary">
                <Users size={18} />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-secondary">Repartition</p>
                <h2 className="mt-1 font-display text-xl font-bold text-dark">{isLegacyDataset ? "Par sexe" : "Par pays membres"}</h2>
              </div>
            </div>
            {primaryChartData.length ? (
              <HorizontalBars data={primaryChartData} />
            ) : (
              <p className="text-sm text-slate-500">Aucune repartition disponible.</p>
            )}
          </SurfaceCard>

          <SurfaceCard className="emsp-panel p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-primary/40 p-3 text-dark">
                <GraduationCap size={18} />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-secondary">{isLegacyDataset ? "Profils" : "Programmes"}</p>
                <h2 className="mt-1 font-display text-xl font-bold text-dark">{isLegacyDataset ? "Tranches d'age" : "Par filiere"}</h2>
              </div>
            </div>
            {secondaryChartData.length ? (
              <HorizontalBars data={secondaryChartData} color="#1E293B" />
            ) : (
              <p className="text-sm text-slate-500">Aucune repartition disponible.</p>
            )}
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
};

export default AdminStudentsPage;
