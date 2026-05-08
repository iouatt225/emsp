import { CheckCircle2, Clock3, FileText, Pencil, Plus, Save, Search, Tags, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import AdminMetricCard from "../../../components/dashboard/AdminMetricCard";
import AdminPageHeader from "../../../components/dashboard/AdminPageHeader";
import SurfaceCard from "../../../components/dashboard/SurfaceCard";
import {
  useAdminMedia,
  useAdminNews,
  useCreateAdminMedia,
  useCreateAdminNews,
  useDeleteAdminNews,
  useUpdateAdminNews,
} from "../../../hooks/useAdminDashboard";
import { formatDate, formatDateTime } from "../../../utils/formatDate";
import type { AdminNewsArticle, AdminNewsPayload } from "../../../types";

interface NewsFormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tagsText: string;
  isPublished: boolean;
  coverId: string;
}

const emptyForm: NewsFormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  tagsText: "",
  isPublished: true,
  coverId: "",
};

const statusClassName = (isPublished: boolean) =>
  isPublished ? "bg-secondary/10 text-secondary" : "bg-primary/40 text-dark";

const toFormState = (article: AdminNewsArticle): NewsFormState => ({
  title: article.title,
  slug: article.slug,
  excerpt: article.excerpt,
  content: article.content,
  tagsText: article.tags.join(", "),
  isPublished: article.isPublished,
  coverId: article.coverImage ? String(article.coverImage.id) : "",
});

const toPayload = (form: NewsFormState, coverId?: number | null): AdminNewsPayload => ({
  title: form.title.trim(),
  slug: form.slug.trim() || undefined,
  excerpt: form.excerpt.trim(),
  content: form.content.trim(),
  tags: form.tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean),
  isPublished: form.isPublished,
  coverId,
});

const MediaPreview = ({ article }: { article: AdminNewsArticle }) => {
  if (!article.coverImage?.url) {
    return (
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <FileText size={42} />
        <p className="text-sm">Aucune couverture</p>
      </div>
    );
  }

  if (article.coverImage.type === "video") {
    return (
      <video
        src={article.coverImage.url}
        controls
        className="h-full w-full object-cover"
        aria-label={article.coverImage.altText || article.title}
      />
    );
  }

  return <img src={article.coverImage.url} alt={article.coverImage.altText || article.title} className="h-full w-full object-cover" />;
};

const AdminNewsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState<"" | "published" | "draft">("");
  const [form, setForm] = useState<NewsFormState>(emptyForm);
  const [editingArticle, setEditingArticle] = useState<AdminNewsArticle | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useAdminNews({
    search: search || undefined,
    status: status || undefined,
  });
  const { data: mediaItems = [] } = useAdminMedia({});
  const createMediaMutation = useCreateAdminMedia();
  const createNewsMutation = useCreateAdminNews();
  const updateNewsMutation = useUpdateAdminNews();
  const deleteNewsMutation = useDeleteAdminNews();

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

  const coverOptions = useMemo(
    () => mediaItems.filter((item) => item.type === "image" || item.type === "video"),
    [mediaItems],
  );

  if (isLoading || !data) {
    return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  }

  const publishedCount = data.filter((item) => item.isPublished).length;
  const draftCount = data.filter((item) => !item.isPublished).length;
  const taggedCount = data.filter((item) => item.tags.length > 0).length;
  const isSaving = createNewsMutation.isPending || updateNewsMutation.isPending || createMediaMutation.isPending;

  const resetForm = () => {
    setForm(emptyForm);
    setCoverFile(null);
    setEditingArticle(null);
    setError("");
  };

  const startEdit = (article: AdminNewsArticle) => {
    setEditingArticle(article);
    setForm(toFormState(article));
    setCoverFile(null);
    setFeedback("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("");
    setError("");

    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      setError("Le titre, l'extrait et le contenu sont obligatoires.");
      return;
    }

    try {
      let coverId = form.coverId ? Number(form.coverId) : null;

      if (coverFile) {
        const isVideo = coverFile.type.startsWith("video/");
        const media = await createMediaMutation.mutateAsync({
          title: `${form.title.trim()} - couverture`,
          description: form.excerpt.trim(),
          altText: form.title.trim(),
          type: isVideo ? "video" : "image",
          category: "actualites",
          isActive: true,
          videoType: isVideo ? "upload" : "upload",
          file: coverFile,
        });
        coverId = media.id;
      }

      const payload = toPayload(form, coverId);

      if (editingArticle) {
        await updateNewsMutation.mutateAsync({ id: editingArticle.id, payload });
        setFeedback("Actualite modifiee avec succes.");
      } else {
        await createNewsMutation.mutateAsync(payload);
        setFeedback("Actualite ajoutee avec succes.");
      }
      resetForm();
    } catch {
      setError("L'enregistrement a echoue. Verifie les champs et le media choisi.");
    }
  };

  const handleDelete = async (article: AdminNewsArticle) => {
    const confirmed = window.confirm(`Supprimer l'actualite "${article.title}" ?`);
    if (!confirmed) return;

    await deleteNewsMutation.mutateAsync(article.id);
    if (editingArticle?.id === article.id) {
      resetForm();
    }
    setFeedback("Actualite supprimee.");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Administration"
        title="Actualites"
        description="Ajoute des textes, photos et videos pour alimenter la section actualites du site public."
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <AdminMetricCard label="Articles visibles" value={data.length} helper="resultats selon la selection" icon={FileText} accent="text-secondary" />
        <AdminMetricCard label="Publies" value={publishedCount} helper="visibles sur le site public" icon={CheckCircle2} accent="text-dark" />
        <AdminMetricCard label="Brouillons" value={draftCount} helper="en attente de validation" icon={Clock3} accent="text-primary" />
        <AdminMetricCard label="Tagues" value={taggedCount} helper="articles relies a des thematiques" icon={Tags} accent="text-secondary" />
      </div>

      <SurfaceCard className="emsp-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">
              {editingArticle ? "Modification" : "Ajout rapide"}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-dark">
              {editingArticle ? `Modifier ${editingArticle.title}` : "Nouvelle actualite"}
            </h2>
          </div>
          {editingArticle ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-secondary hover:text-secondary"
            >
              <X size={17} />
              Annuler
            </button>
          ) : null}
        </div>

        {feedback ? <div className="mt-5 rounded-2xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-secondary">{feedback}</div> : null}
        {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.8fr_0.7fr]">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-dark">Titre*</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="emsp-panel w-full rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary"
                placeholder="Titre de l'actualite"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-dark">Slug</span>
              <input
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                className="emsp-panel w-full rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary"
                placeholder="auto si vide"
              />
            </label>
            <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-dark xl:mt-7">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-secondary focus:ring-secondary"
              />
              Publier
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-dark">Extrait*</span>
            <textarea
              rows={3}
              value={form.excerpt}
              onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
              className="emsp-panel w-full rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-dark">Texte de l'article*</span>
            <textarea
              rows={7}
              value={form.content}
              onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
              className="emsp-panel w-full rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary"
            />
          </label>

          <div className="grid gap-5 xl:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-dark">Tags</span>
              <input
                value={form.tagsText}
                onChange={(event) => setForm((current) => ({ ...current, tagsText: event.target.value }))}
                className="emsp-panel w-full rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary"
                placeholder="Vie scolaire, partenariat, formation"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-dark">Media existant</span>
              <select
                value={form.coverId}
                onChange={(event) => setForm((current) => ({ ...current, coverId: event.target.value }))}
                className="emsp-panel w-full rounded-2xl px-4 py-3 text-sm outline-none transition focus:border-secondary"
              >
                <option value="">Aucun</option>
                {coverOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.type})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-dark">Nouvelle photo ou video</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(event) => setCoverFile(event.target.files?.[0] || null)}
                className="emsp-panel w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-secondary"
              />
              <span className="mt-2 block text-xs text-slate-500">{coverFile ? coverFile.name : "Remplace le media existant si choisi."}</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-secondary px-5 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {editingArticle ? <Save size={18} /> : <Plus size={18} />}
            {isSaving ? "Enregistrement..." : editingArticle ? "Modifier l'actualite" : "Ajouter l'actualite"}
          </button>
        </form>
      </SurfaceCard>

      <SurfaceCard className="emsp-panel p-5">
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <label className="emsp-panel flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="search"
              placeholder="Rechercher un titre, un slug ou un contenu"
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "" | "published" | "draft")}
            className="emsp-panel rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="published">Publies</option>
            <option value="draft">Brouillons</option>
          </select>
        </div>
      </SurfaceCard>

      <div className="grid gap-6">
        {data.length ? (
          data.map((article) => (
            <SurfaceCard key={article.id} className="emsp-panel overflow-hidden">
              <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
                <div className="flex min-h-[240px] items-center justify-center bg-slate-100">
                  <MediaPreview article={article} />
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(article.isPublished)}`}>
                        {article.status}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(article)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-secondary hover:text-secondary"
                      >
                        <Pencil size={16} />
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(article)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                  <h2 className="mt-4 font-display text-3xl font-bold text-dark">{article.title}</h2>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{article.excerpt}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {article.tags.length ? (
                      article.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Sans tag</span>
                    )}
                  </div>
                  <div className="mt-6 grid gap-3 text-sm text-slate-500 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p>Auteur</p>
                      <p className="mt-1 font-medium text-dark">{article.authorName}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p>Slug</p>
                      <p className="mt-1 font-medium text-dark">{article.slug}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p>Mise a jour</p>
                      <p className="mt-1 font-medium text-dark">{formatDateTime(article.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </SurfaceCard>
          ))
        ) : (
          <SurfaceCard className="emsp-panel px-6 py-16 text-center text-sm text-slate-500">
            Aucun article ne correspond aux filtres selectionnes.
          </SurfaceCard>
        )}
      </div>
    </div>
  );
};

export default AdminNewsPage;
