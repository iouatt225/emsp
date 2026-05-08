import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Play, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useMedia } from "../../hooks/useMedia";
import type { MediaItem } from "../../types";
import { formatLongDate } from "../../utils/formatDate";
import { getFileExtension, getYoutubeEmbedUrl, getYoutubeThumbnailUrl } from "../../utils/media";

const tabs = [
  { value: "image", label: "Photos" },
  { value: "video", label: "Videos" },
  { value: "document", label: "Documents" },
] as const;

type MediaTab = (typeof tabs)[number]["value"];

const localGalleryImages: MediaItem[] = [
  {
    id: -101,
    title: "Vie etudiante EMSP",
    url: "/media/imageemsp/IMG-20250705-WA0133.jpg",
    type: "image",
    category: "Vie academique",
    createdAt: "",
    altText: "Etudiants EMSP reunis dans une salle decoree",
  },
  {
    id: -102,
    title: "Conference academique",
    url: "/media/imageemsp/Photo%20de%20Al%C3%A8ve(11).jpg",
    type: "image",
    category: "Conferences",
    createdAt: "",
    altText: "Conference EMSP en salle",
  },
  {
    id: -103,
    title: "Ivoire Tech Forum",
    url: "/media/imageemsp/IMG-20251206-WA0229(1).jpg",
    type: "image",
    category: "Evenements",
    createdAt: "",
    altText: "Delegation EMSP au Ivoire Tech Forum",
  },
  {
    id: -104,
    title: "Temps fort academique",
    url: "/media/imageemsp/IMG-20250605-WA0018.jpg",
    type: "image",
    category: "Vie academique",
    createdAt: "",
    altText: "Temps fort academique EMSP",
  },
  {
    id: -105,
    title: "Promotion EMSP",
    url: "/media/imageemsp/IMG-20250705-WA0078.jpg",
    type: "image",
    category: "Vie academique",
    createdAt: "",
    altText: "Etudiants EMSP lors d'une activite academique",
  },
  {
    id: -106,
    title: "Session de formation",
    url: "/media/imageemsp/Photo%20de%20Al%C3%A8ve(4).jpg",
    type: "image",
    category: "Formations",
    createdAt: "",
    altText: "Session de formation EMSP",
  },
  {
    id: -107,
    title: "Rencontre institutionnelle",
    url: "/media/imageemsp/Photo%20de%20Al%C3%A8ve(9).jpg",
    type: "image",
    category: "Conferences",
    createdAt: "",
    altText: "Rencontre institutionnelle EMSP",
  },
  {
    id: -108,
    title: "Communaute EMSP",
    url: "/media/imageemsp/IMG-20250705-WA0113.jpg",
    type: "image",
    category: "Evenements",
    createdAt: "",
    altText: "Communaute EMSP reunie",
  },
];

const MediathequePage = () => {
  const [activeTab, setActiveTab] = useState<MediaTab>("image");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null);

  const { data: items = [], isLoading } = useMedia(undefined, activeTab);

  const displayItems = useMemo(() => {
    if (activeTab !== "image") {
      return items;
    }

    const seenUrls = new Set<string>();
    return [...localGalleryImages, ...items].filter((item) => {
      if (seenUrls.has(item.url)) {
        return false;
      }

      seenUrls.add(item.url);
      return true;
    });
  }, [activeTab, items]);

  useEffect(() => {
    setSelectedCategory("all");
  }, [activeTab]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    displayItems.forEach((item) => {
      if (item.category) unique.add(item.category);
    });
    return ["all", ...Array.from(unique).sort((left, right) => left.localeCompare(right))];
  }, [displayItems]);

  const filteredItems = useMemo(
    () => displayItems.filter((item) => selectedCategory === "all" || item.category === selectedCategory),
    [displayItems, selectedCategory],
  );

  const photos = filteredItems.filter((item) => item.type === "image");
  const documents = filteredItems.filter((item) => item.type === "document");
  const videos = filteredItems.filter((item) => item.type === "video");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
        setSelectedVideo(null);
      }
      if (event.key === "ArrowRight" && lightboxIndex !== null && photos.length > 0) {
        setLightboxIndex((current) => ((current ?? 0) + 1) % photos.length);
      }
      if (event.key === "ArrowLeft" && lightboxIndex !== null && photos.length > 0) {
        setLightboxIndex((current) => ((current ?? 0) - 1 + photos.length) % photos.length);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, photos.length]);

  const activePhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <div className="bg-slate-50">
      <section className="bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_58%,#fef9c3_100%)] py-16 text-dark">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-secondary">Mediatheque</p>
            <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Galerie dynamique photos, videos et documents</h1>
            <p className="mt-4 max-w-2xl text-slate-600">
              Retrouvez les temps forts de l'EMSP, les images de la vie academique, les videos et les ressources publiees par l'ecole.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {localGalleryImages.slice(0, 3).map((item, index) => (
              <img
                key={item.id}
                src={item.url}
                alt={item.altText || item.title}
                className={`h-52 w-full rounded-2xl object-cover shadow-sm ${index === 1 ? "mt-8" : ""}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.value ? "bg-secondary text-white" : "border border-secondary/20 bg-white text-secondary"
                }`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                  selectedCategory === category ? "bg-primary text-dark" : "bg-slate-100 text-slate-600"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === "all" ? "Tous" : category}
              </button>
            ))}
          </div>
        </div>
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`media-skeleton-${index}`} className="h-72 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : activeTab === "image" ? (
          photos.length > 0 ? (
            <div className="mt-10 columns-1 gap-5 md:columns-2 xl:columns-3">
              {photos.map((item, index) => (
                <button
                  key={item.id}
                  className="group relative mb-5 block w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-slate-200 break-inside-avoid"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img src={item.url} alt={item.altText || item.title} className="h-auto w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                  {item.createdAt ? (
                    <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-dark shadow-sm backdrop-blur">
                      {formatLongDate(item.createdAt)}
                    </div>
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-900/15 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 translate-y-4 p-5 text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="font-display text-xl font-semibold">{item.title}</p>
                    {item.description ? <p className="mt-2 text-sm text-white/85">{item.description}</p> : null}
                    {item.createdAt ? (
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
                        Ajoutee le {formatLongDate(item.createdAt)}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-secondary/30 bg-white p-12 text-center text-slate-500">
              Aucune photo disponible pour le moment.
            </div>
          )
        ) : activeTab === "video" ? (
          videos.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {videos.map((item) => {
                const thumbnailUrl = item.videoType === "youtube" && item.videoUrl ? getYoutubeThumbnailUrl(item.videoUrl) : null;
                return (
                  <button
                    key={item.id}
                    className="overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1"
                    onClick={() => setSelectedVideo(item)}
                  >
                    <div className="relative h-56 bg-slate-900">
                      {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt={item.altText || item.title} className="h-full w-full object-cover opacity-85" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-secondary via-emerald-500 to-slate-900" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-dark shadow-lg">
                          <Play size={24} fill="currentColor" />
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-display text-2xl font-semibold text-dark">{item.title}</p>
                        <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                          {item.videoType === "youtube" ? "YouTube" : "Video"}
                        </span>
                      </div>
                      {item.description ? <p className="mt-3 line-clamp-3 text-sm text-slate-600">{item.description}</p> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-secondary/30 bg-white p-12 text-center text-slate-500">
              Aucune video disponible pour le moment.
            </div>
          )
        ) : documents.length > 0 ? (
          <div className="mt-10 space-y-4">
            {documents.map((item) => (
              <article key={item.id} className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 font-semibold text-secondary">
                    {getFileExtension(item.fileName, item.url)}
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-dark">{item.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{item.description || "Document publie dans la mediatheque EMSP."}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                      {item.category || "Document"} • {formatLongDate(item.createdAt)}
                    </p>
                  </div>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-3 font-semibold text-white"
                >
                  <Download size={16} />
                  Telecharger
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-secondary/30 bg-white p-12 text-center text-slate-500">
            Aucun document disponible pour le moment.
          </div>
        )}
      </section>

      <AnimatePresence>
        {activePhoto ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-dark/90 px-4 py-10"
          >
            <div className="mx-auto flex h-full max-w-6xl flex-col">
              <div className="mb-4 flex justify-end">
                <button
                  aria-label="Fermer la lightbox"
                  className="rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                  onClick={() => setLightboxIndex(null)}
                >
                  <X size={22} />
                </button>
              </div>
              <div className="relative flex min-h-0 flex-1 items-center justify-center">
                <button
                  aria-label="Photo precedente"
                  className="absolute left-0 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                  onClick={() => setLightboxIndex((current) => ((current ?? 0) - 1 + photos.length) % photos.length)}
                >
                  <ChevronLeft size={22} />
                </button>
                <img src={activePhoto.url} alt={activePhoto.altText || activePhoto.title} className="max-h-full max-w-full rounded-3xl object-contain" />
                <button
                  aria-label="Photo suivante"
                  className="absolute right-0 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                  onClick={() => setLightboxIndex((current) => ((current ?? 0) + 1) % photos.length)}
                >
                  <ChevronRight size={22} />
                </button>
              </div>
              <div className="mt-6 rounded-3xl bg-white/10 p-5 text-white backdrop-blur">
                <p className="font-display text-2xl font-semibold">{activePhoto.title}</p>
                {activePhoto.description ? <p className="mt-2 text-sm text-white/85">{activePhoto.description}</p> : null}
                {activePhoto.createdAt ? (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                    Ajoutee le {formatLongDate(activePhoto.createdAt)}
                  </p>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedVideo ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-dark/90 px-4 py-10"
          >
            <div className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-bold text-dark">{selectedVideo.title}</h2>
                  {selectedVideo.description ? <p className="mt-2 text-sm text-slate-600">{selectedVideo.description}</p> : null}
                </div>
                <button
                  aria-label="Fermer la video"
                  className="rounded-full bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200"
                  onClick={() => setSelectedVideo(null)}
                >
                  <X size={22} />
                </button>
              </div>
              <div className="overflow-hidden rounded-3xl bg-black">
                {selectedVideo.videoType === "youtube" && selectedVideo.videoUrl ? (
                  <iframe
                    title={selectedVideo.title}
                    src={getYoutubeEmbedUrl(selectedVideo.videoUrl)}
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video controls className="aspect-video w-full" src={selectedVideo.url}>
                    Votre navigateur ne prend pas en charge cette video.
                  </video>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default MediathequePage;
