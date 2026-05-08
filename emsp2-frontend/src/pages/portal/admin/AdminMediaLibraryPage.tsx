import { CheckCircle2, FileText, Image as ImageIcon, Pencil, PlayCircle, Save, Search, Shapes, Trash2, UploadCloud, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import AdminMetricCard from "../../../components/dashboard/AdminMetricCard";
import AdminPageHeader from "../../../components/dashboard/AdminPageHeader";
import SurfaceCard from "../../../components/dashboard/SurfaceCard";
import { useAdminMedia, useCreateAdminMedia, useDeleteAdminMedia, useUpdateAdminMedia } from "../../../hooks/useAdminDashboard";
import { formatDate } from "../../../utils/formatDate";
import type { AdminMediaItem, AdminMediaPayload } from "../../../types";

const mediaTypeLabel: Record<string, string> = {
  image: "Image",
  video: "Video",
  document: "Document",
};

const suggestedCategories = [
  "hero",
  "about",
  "why",
  "promo",
  "drapeaux",
  "partenaires",
  "actualites",
  "documents",
  "videos",
];

const initialMediaForm: AdminMediaPayload = {
  title: "",
  description: "",
  altText: "",
  type: "image",
  category: "",
  isActive: true,
  videoType: "upload",
  videoUrl: "",
  file: null,
};

const AdminMediaLibraryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [type, setType] = useState<"" | "image" | "video" | "document">("");
  const [category, setCategory] = useState("");
  const [mediaForm, setMediaForm] = useState<AdminMediaPayload>(initialMediaForm);
  const [editingMedia, setEditingMedia] = useState<AdminMediaItem | null>(null);
  const [feedback, setFeedback] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof AdminMediaPayload, string>>>({});

  const { data, isLoading } = useAdminMedia({
    search: search || undefined,
    type: type || undefined,
    category: category || undefined,
  });
  const createMediaMutation = useCreateAdminMedia();
  const updateMediaMutation = useUpdateAdminMedia();
  const deleteMediaMutation = useDeleteAdminMedia();

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

  const handleMediaFieldChange = <K extends keyof AdminMediaPayload>(field: K, value: AdminMediaPayload[K]) => {
    setFeedback("");
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMediaForm((current) => ({ ...current, [field]: value }));
  };

  const validateMediaForm = () => {
    const nextErrors: Partial<Record<keyof AdminMediaPayload, string>> = {};

    if (!mediaForm.title.trim()) {
      nextErrors.title = "Le titre du media est requis.";
    }
    if (mediaForm.type === "video" && mediaForm.videoType === "youtube" && !mediaForm.videoUrl?.trim()) {
      nextErrors.videoUrl = "Le lien YouTube est requis pour ce type de video.";
    }
    if (!editingMedia && (mediaForm.type === "image" || mediaForm.type === "document" || mediaForm.videoType === "upload") && !mediaForm.file) {
      nextErrors.file = "Choisis un fichier a televerser.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreateMedia = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateMediaForm()) {
      return;
    }

    if (editingMedia) {
      await updateMediaMutation.mutateAsync({ id: editingMedia.id, payload: mediaForm });
      setFeedback("Media modifie avec succes.");
    } else {
      await createMediaMutation.mutateAsync(mediaForm);
      setFeedback("Media ajoute avec succes dans la mediatheque.");
    }
    setErrors({});
    setEditingMedia(null);
    setMediaForm(initialMediaForm);
  };

  const resetMediaForm = () => {
    setEditingMedia(null);
    setFeedback("");
    setErrors({});
    setMediaForm(initialMediaForm);
  };

  const startEdit = (item: AdminMediaItem) => {
    setEditingMedia(item);
    setFeedback("");
    setErrors({});
    setMediaForm({
      title: item.title,
      description: item.description || "",
      altText: item.altText || "",
      type: item.type,
      category: item.category || "",
      isActive: item.isActive,
      videoType: item.videoType || (item.type === "video" ? "upload" : "upload"),
      videoUrl: item.videoUrl || (item.videoType === "youtube" ? item.url : ""),
      file: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (item: AdminMediaItem) => {
    const confirmed = window.confirm(`Supprimer le media "${item.title}" ?`);
    if (!confirmed) return;
    await deleteMediaMutation.mutateAsync(item.id);
    if (editingMedia?.id === item.id) {
      resetMediaForm();
    }
    setFeedback("Media supprime.");
  };

  if (isLoading || !data) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  }

  const images = data.filter((item) => item.type === "image").length;
  const videos = data.filter((item) => item.type === "video").length;
  const documents = data.filter((item) => item.type === "document").length;
  const categories = Array.from(new Set(data.map((item) => item.category).filter(Boolean))).sort();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="Mediatheque"
        description="Catalogue central des visuels, videos et documents de l'ecole. Cette vue donne un acces rapide aux assets utilises dans le site et les publications."
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <AdminMetricCard label="Assets visibles" value={data.length} helper="elements renvoyes par le filtre" icon={Shapes} accent="text-secondary" />
        <AdminMetricCard label="Images" value={images} helper="photos, logos et couvertures" icon={ImageIcon} accent="text-dark" />
        <AdminMetricCard label="Videos" value={videos} helper="uploads et liens integres" icon={PlayCircle} accent="text-primary" />
        <AdminMetricCard label="Actifs" value={data.filter((item) => item.isActive).length} helper={`${documents} documents disponibles`} icon={CheckCircle2} accent="text-secondary" />
      </div>

      <SurfaceCard className="emsp-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">Ajout rapide</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-dark">
              {editingMedia ? `Modifier ${editingMedia.title}` : "Deposer un nouveau media"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Charge ici des images, videos ou documents. Les medias actifs seront aussitot disponibles dans les APIs publiques et les pages React qui utilisent leur categorie.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            {editingMedia ? (
              <button
                type="button"
                onClick={resetMediaForm}
                className="inline-flex cursor-pointer items-center gap-2 font-semibold text-slate-600 transition hover:text-secondary"
              >
                <X size={16} />
                Annuler la modification
              </button>
            ) : (
              "Categories utiles : hero, drapeaux, partenaires, actualites, promo"
            )}
          </div>
        </div>

        {feedback ? (
          <div className="mt-6 rounded-2xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-secondary">
            {feedback}
          </div>
        ) : null}
        {createMediaMutation.isError || updateMediaMutation.isError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            L'enregistrement du media a echoue. Verifie le type choisi et les champs obligatoires.
          </div>
        ) : null}

        <form className="mt-6 space-y-5" onSubmit={handleCreateMedia}>
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr_0.9fr]">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-dark">Titre*</span>
              <input
                value={mediaForm.title}
                onChange={(event) => handleMediaFieldChange("title", event.target.value)}
                className="emsp-panel w-full rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary"
                placeholder="Ex. Logo partenaire, video ceremonie, brochure d'admission"
              />
              {errors.title ? <span className="mt-2 block text-sm text-red-600">{errors.title}</span> : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-dark">Type*</span>
              <select
                value={mediaForm.type}
                onChange={(event) => {
                  const nextType = event.target.value as AdminMediaPayload["type"];
                  setFeedback("");
                  setErrors({});
                  setMediaForm((current) => ({
                    ...current,
                    type: nextType,
                    file: nextType === "video" && current.videoType === "youtube" ? null : current.file,
                    videoType: nextType === "video" ? current.videoType || "upload" : "upload",
                    videoUrl: nextType === "video" ? current.videoUrl : "",
                  }));
                }}
                className="emsp-panel w-full rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-dark">Categorie</span>
              <input
                value={mediaForm.category}
                onChange={(event) => handleMediaFieldChange("category", event.target.value)}
                className="emsp-panel w-full rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary"
                placeholder="hero, drapeaux, partenaires..."
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {Array.from(new Set([...suggestedCategories, ...categories])).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleMediaFieldChange("category", item)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  mediaForm.category === item ? "bg-secondary text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-dark">Description</span>
              <textarea
                rows={4}
                value={mediaForm.description}
                onChange={(event) => handleMediaFieldChange("description", event.target.value)}
                className="emsp-panel w-full rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-dark">Texte alternatif</span>
              <textarea
                rows={4}
                value={mediaForm.altText}
                onChange={(event) => handleMediaFieldChange("altText", event.target.value)}
                className="emsp-panel w-full rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary"
              />
            </label>
          </div>

          {mediaForm.type === "video" ? (
            <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-dark">Source video</span>
                <select
                  value={mediaForm.videoType}
                  onChange={(event) => {
                    const nextVideoType = event.target.value as "upload" | "youtube";
                    setFeedback("");
                    setErrors({});
                    setMediaForm((current) => ({
                      ...current,
                      videoType: nextVideoType,
                      videoUrl: nextVideoType === "youtube" ? current.videoUrl : "",
                      file: nextVideoType === "youtube" ? null : current.file,
                    }));
                  }}
                  className="emsp-panel w-full rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary"
                >
                  <option value="upload">Fichier video</option>
                  <option value="youtube">Lien YouTube</option>
                </select>
              </label>
              {mediaForm.videoType === "youtube" ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Lien YouTube*</span>
                  <input
                    value={mediaForm.videoUrl}
                    onChange={(event) => handleMediaFieldChange("videoUrl", event.target.value)}
                    className="emsp-panel w-full rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {errors.videoUrl ? <span className="mt-2 block text-sm text-red-600">{errors.videoUrl}</span> : null}
                </label>
              ) : (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-dark">Fichier video*</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(event) => handleMediaFieldChange("file", event.target.files?.[0] || null)}
                    className="emsp-panel w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-secondary"
                  />
                  <p className="mt-2 text-sm text-slate-500">{mediaForm.file ? mediaForm.file.name : "MP4, MOV ou autre format video"}</p>
                  {errors.file ? <span className="mt-2 block text-sm text-red-600">{errors.file}</span> : null}
                </label>
              )}
            </div>
          ) : (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-dark">
                {mediaForm.type === "image" ? "Fichier image*" : "Document*"}
              </span>
              <input
                type="file"
                accept={mediaForm.type === "image" ? "image/*" : ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"}
                onChange={(event) => handleMediaFieldChange("file", event.target.files?.[0] || null)}
                className="emsp-panel w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-secondary"
              />
              <p className="mt-2 text-sm text-slate-500">{mediaForm.file ? mediaForm.file.name : "Choisis le fichier a publier dans la mediatheque"}</p>
              {errors.file ? <span className="mt-2 block text-sm text-red-600">{errors.file}</span> : null}
            </label>
          )}

          <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-dark">
            <input
              type="checkbox"
              checked={mediaForm.isActive}
              onChange={(event) => handleMediaFieldChange("isActive", event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-secondary focus:ring-secondary"
            />
            Publier ce media immediatement
          </label>

          <button
            type="submit"
            disabled={createMediaMutation.isPending || updateMediaMutation.isPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-5 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {editingMedia ? <Save size={18} /> : <UploadCloud size={18} />}
            {createMediaMutation.isPending || updateMediaMutation.isPending
              ? "Enregistrement..."
              : editingMedia
                ? "Modifier le media"
                : "Ajouter a la mediatheque"}
          </button>
        </form>
      </SurfaceCard>

      <SurfaceCard className="emsp-panel p-5">
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr]">
          <label className="emsp-panel flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="search"
              placeholder="Titre ou description"
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
            />
          </label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as "" | "image" | "video" | "document")}
            className="emsp-panel rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
          >
            <option value="">Tous les types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="emsp-panel rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
          >
            <option value="">Toutes les categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {data.length ? (
          data.map((item) => (
            <SurfaceCard key={item.id} className="emsp-panel overflow-hidden">
              <div className="flex h-56 items-center justify-center bg-slate-100">
                {item.type === "image" && item.url ? (
                  <img src={item.url} alt={item.altText || item.title} className="h-full w-full object-cover" />
                ) : item.type === "video" ? (
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <PlayCircle size={42} />
                    <p className="text-sm">Video</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <FileText size={42} />
                    <p className="text-sm">Document</p>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {mediaTypeLabel[item.type]}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isActive ? "bg-secondary/10 text-secondary" : "bg-red-50 text-red-600"}`}>
                      {item.isActive ? "Actif" : "Masque"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-secondary hover:text-secondary"
                    >
                      <Pencil size={14} />
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      Supprimer
                    </button>
                  </div>
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold text-dark">{item.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{item.category || "Sans categorie"}</p>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                  {item.description || item.altText || "Aucune description fournie pour cet asset."}
                </p>
                <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                  <span>Ajoute le {formatDate(item.createdAt)}</span>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="font-semibold text-secondary">
                      Ouvrir
                    </a>
                  ) : null}
                </div>
              </div>
            </SurfaceCard>
          ))
        ) : (
          <SurfaceCard className="emsp-panel col-span-full px-6 py-16 text-center text-sm text-slate-500">
            Aucun media ne correspond aux filtres selectionnes.
          </SurfaceCard>
        )}
      </div>
    </div>
  );
};

export default AdminMediaLibraryPage;
