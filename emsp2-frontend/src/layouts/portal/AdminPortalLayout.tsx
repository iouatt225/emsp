import { Bell, Camera, Loader2, LogOut, Moon, Search, Sun, UserRound, X } from "lucide-react";
import { motion } from "framer-motion";
import { ChangeEvent, KeyboardEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { fetchAdminPayments } from "../../api/financeApi";
import { fetchAdminApplications } from "../../api/inscriptionsApi";
import { fetchAdminMedia } from "../../api/mediaApi";
import { fetchAdminNews } from "../../api/newsApi";
import { fetchAdminStudents } from "../../api/portalApi";
import { updateCurrentUserProfile } from "../../api/accountApi";
import axiosInstance from "../../api/axiosConfig";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import { getVisibleAdminPortalItems } from "../../config/adminPortal";
import { useAuth } from "../../hooks/useAuth";
import { usePortalTheme } from "../../hooks/usePortalTheme";
import { useSiteConfig } from "../../hooks/useSiteConfig";

const AdminOutletFallback = () => (
  <div className="flex min-h-[320px] items-center justify-center">
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-maxton">
      <Loader2 size={18} className="animate-spin text-secondary" />
      Chargement du module...
    </div>
  </div>
);

type GlobalSearchItem = {
  id: string;
  title: string;
  subtitle: string;
  to: string;
};

type GlobalSearchSection = {
  label: string;
  items: GlobalSearchItem[];
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  to?: string;
};

type TransportOverviewSummary = {
  summary?: {
    cars: number;
    communes: number;
    routes: number;
    drivers: number;
    paid_this_month: number;
    paid_this_year: number;
  };
};

const buildSearchUrl = (basePath: string, query: string) => `${basePath}?search=${encodeURIComponent(query)}`;

const AdminPortalLayout = () => {
  const { user, logout, setUser } = useAuth();
  const { isDark, toggleTheme } = usePortalTheme();
  const { data: site } = useSiteConfig();
  const items = getVisibleAdminPortalItems(user?.role);
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchSections, setSearchSections] = useState<GlobalSearchSection[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationsLoadedAt, setNotificationsLoadedAt] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: user?.username || user?.email || "",
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  });
  const [profilePreview, setProfilePreview] = useState(user?.avatarUrl || "");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profileFeedback, setProfileFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const notificationContainerRef = useRef<HTMLDivElement | null>(null);
  const profileObjectUrlRef = useRef<string | null>(null);

  const roleBadgeClass =
    user?.role === "admin"
      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
      : user?.role === "direction"
        ? "bg-primary/25 text-amber-100 ring-1 ring-primary/35"
        : "bg-white/10 text-white ring-1 ring-white/15";

  const displayName = useMemo(() => {
    const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
    if (fullName) return fullName;
    if (user?.username) return user.username;
    if (user?.email) return user.email.split("@")[0];
    return "Admin EMSP";
  }, [user?.email, user?.firstName, user?.lastName, user?.username]);

  const canAccess = (path: string) => items.some((item) => item.to === path);

  useEffect(() => {
    setProfileForm({
      username: user?.username || user?.email || "",
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    });
    if (profileObjectUrlRef.current) {
      URL.revokeObjectURL(profileObjectUrlRef.current);
      profileObjectUrlRef.current = null;
    }
    setProfileFile(null);
    setProfilePreview(user?.avatarUrl || "");
  }, [user?.avatarUrl, user?.email, user?.firstName, user?.lastName, user?.phone, user?.username]);

  useEffect(
    () => () => {
      if (profileObjectUrlRef.current) {
        URL.revokeObjectURL(profileObjectUrlRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notificationContainerRef.current && !notificationContainerRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname, location.search]);

  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const nextNotifications: NotificationItem[] = [];

      if (!user?.firstName || !user?.lastName || !user?.avatarUrl) {
        nextNotifications.push({
          id: "profile-incomplete",
          title: "Profil admin a completer",
          description: "Ajoutez votre photo et verifiez vos informations de compte.",
        });
      }

      const requests: Promise<void>[] = [];

      if (canAccess("/admin/comptabilite")) {
        requests.push(
          fetchAdminPayments({ status: "pending" }).then((data) => {
            if (data.summary.pendingCount > 0) {
              nextNotifications.push({
                id: "payments-pending",
                title: `${data.summary.pendingCount} paiements en attente`,
                description: "Des transactions demandent une verification comptable.",
                to: "/admin/comptabilite?status=pending",
              });
            }
          }),
        );
      }

      if (canAccess("/admin/candidatures")) {
        requests.push(
          fetchAdminApplications({ status: "submitted" }).then((data) => {
            if (data.summary.pending > 0) {
              nextNotifications.push({
                id: "applications-pending",
                title: `${data.summary.pending} candidatures a traiter`,
                description: "Des dossiers attendent une prise en charge.",
                to: "/admin/candidatures?status=submitted",
              });
            }
          }),
        );
      }

      if (canAccess("/admin/transport")) {
        requests.push(
          axiosInstance.get<TransportOverviewSummary>("/scolarite/admin/transport/").then((response) => {
            const summary = response.data.summary;
            if (!summary) return;
            if (summary.cars === 0) {
              nextNotifications.push({
                id: "transport-cars-empty",
                title: "Aucun car configure",
                description: "Ajoutez un premier vehicule dans la section transport.",
                to: "/admin/transport",
              });
            }
            if (summary.drivers === 0) {
              nextNotifications.push({
                id: "transport-drivers-empty",
                title: "Aucun chauffeur actif",
                description: "Pensez a creer un compte chauffeur et a l'affecter a un car.",
                to: "/admin/transport",
              });
            }
          }),
        );
      }

      await Promise.allSettled(requests);

      setNotifications(nextNotifications);
      setNotificationsLoadedAt(Date.now());
    } catch (error) {
      console.error(error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    if (!searchValue.trim() || searchValue.trim().length < 2) {
      setSearchSections([]);
      setIsSearching(false);
      return;
    }

    const query = searchValue.trim();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);

        const quickItems = items
          .filter((item) =>
            `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 4)
          .map<GlobalSearchItem>((item) => ({
            id: item.to,
            title: item.label,
            subtitle: item.description,
            to: item.to,
          }));

        const requests: Array<Promise<GlobalSearchSection | null>> = [];

        if (canAccess("/admin/etudiants")) {
          requests.push(
            fetchAdminStudents({ search: query }).then((data) => ({
              label: "Etudiants",
              items: data.results.slice(0, 4).map((student) => ({
                id: `student-${student.id}`,
                title: student.fullName,
                subtitle: `${student.matricule} - ${student.formationCode || student.formationName || "EMSP"}`,
                to: buildSearchUrl("/admin/etudiants", query),
              })),
            })),
          );
        }

        if (canAccess("/admin/candidatures")) {
          requests.push(
            fetchAdminApplications({ search: query }).then((data) => ({
              label: "Candidatures",
              items: data.results.slice(0, 4).map((application) => ({
                id: `application-${application.id}`,
                title: `${application.firstName} ${application.lastName}`.trim(),
                subtitle: `${application.dossierNumber} - ${application.formationCode}`,
                to: buildSearchUrl("/admin/candidatures", query),
              })),
            })),
          );
        }

        if (canAccess("/admin/comptabilite")) {
          requests.push(
            fetchAdminPayments({ search: query }).then((data) => ({
              label: "Paiements",
              items: data.results.slice(0, 4).map((payment) => ({
                id: `payment-${payment.id}`,
                title: payment.studentName,
                subtitle: `${payment.reference} - ${payment.statusLabel}`,
                to: buildSearchUrl("/admin/comptabilite", query),
              })),
            })),
          );
        }

        if (canAccess("/admin/actualites")) {
          requests.push(
            fetchAdminNews({ search: query }).then((data) => ({
              label: "Actualites",
              items: data.slice(0, 4).map((article) => ({
                id: `news-${article.id}`,
                title: article.title,
                subtitle: article.status === "published" ? "Publie" : "Brouillon",
                to: buildSearchUrl("/admin/actualites", query),
              })),
            })),
          );
        }

        if (canAccess("/admin/mediatheque")) {
          requests.push(
            fetchAdminMedia({ search: query }).then((data) => ({
              label: "Mediatheque",
              items: data.slice(0, 4).map((media) => ({
                id: `media-${media.id}`,
                title: media.title,
                subtitle: `${media.type} - ${media.category || "sans categorie"}`,
                to: buildSearchUrl("/admin/mediatheque", query),
              })),
            })),
          );
        }

        const results = await Promise.allSettled(requests);
        if (cancelled) return;

        const dynamicSections = results
          .filter((result): result is PromiseFulfilledResult<GlobalSearchSection | null> => result.status === "fulfilled")
          .map((result) => result.value)
          .filter((section): section is GlobalSearchSection => Boolean(section && section.items.length));

        const sections: GlobalSearchSection[] = [];
        if (quickItems.length) {
          sections.push({ label: "Navigation", items: quickItems });
        }
        sections.push(...dynamicSections);

        setSearchSections(sections);
      } catch (error) {
        console.error(error);
        if (!cancelled) setSearchSections([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [items, searchValue]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
    setIsSearchOpen(true);
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen((current) => {
      const next = !current;
      if (next && !notificationsLoading) {
        const isStale = !notificationsLoadedAt || Date.now() - notificationsLoadedAt > 3 * 60 * 1000;
        if (isStale) {
          void loadNotifications();
        }
      }
      return next;
    });
  };

  const handleSearchSelect = (to: string) => {
    navigate(to);
    setIsSearchOpen(false);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const firstResult = searchSections.flatMap((section) => section.items)[0];
      if (firstResult) {
        event.preventDefault();
        handleSearchSelect(firstResult.to);
      }
    }
  };

  const handleProfileSubmit = async () => {
    try {
      setIsSavingProfile(true);
      setProfileFeedback(null);
      const updatedUser = await updateCurrentUserProfile({
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        phone: profileForm.phone.trim(),
        avatarFile: profileFile,
      });
      if (updatedUser) {
        setUser(updatedUser);
        setProfilePreview(updatedUser.avatarUrl || "");
        setProfileFile(null);
        setProfileFeedback({ type: "success", text: "Profil admin mis a jour avec succes." });
      }
    } catch (error: unknown) {
      console.error(error);
      const payload = (error as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const firstMessage =
        (typeof payload?.detail === "string" && payload.detail) ||
        Object.values(payload || {}).flatMap((value) => (Array.isArray(value) ? value : [value])).find((value) => typeof value === "string");
      setProfileFeedback({
        type: "error",
        text: typeof firstMessage === "string" ? firstMessage : "Impossible de mettre le profil a jour.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    if (profileObjectUrlRef.current) {
      URL.revokeObjectURL(profileObjectUrlRef.current);
    }
    const nextObjectUrl = URL.createObjectURL(nextFile);
    profileObjectUrlRef.current = nextObjectUrl;
    setProfileFile(nextFile);
    setProfilePreview(nextObjectUrl);
    setProfileFeedback(null);
  };

  const handleAvatarDelete = async () => {
    try {
      setIsSavingProfile(true);
      setProfileFeedback(null);
      const updatedUser = await updateCurrentUserProfile({ removeAvatar: true });
      if (updatedUser) {
        if (profileObjectUrlRef.current) {
          URL.revokeObjectURL(profileObjectUrlRef.current);
          profileObjectUrlRef.current = null;
        }
        setUser(updatedUser);
        setProfileFile(null);
        setProfilePreview("");
        setProfileFeedback({ type: "success", text: "Photo de profil supprimee." });
      }
    } catch (error) {
      console.error(error);
      setProfileFeedback({ type: "error", text: "Impossible de supprimer la photo de profil." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="maxton-portal-shell">
      <div className="mx-auto flex min-h-screen max-w-[1760px]">
        <aside
          className={`maxton-sidebar hidden shrink-0 flex-col px-4 py-6 text-white transition-[width,padding] duration-300 lg:flex ${
            isSidebarExpanded ? "w-[280px] px-5" : "w-[106px] px-3"
          }`}
          onMouseEnter={() => setIsSidebarExpanded(true)}
          onMouseLeave={() => setIsSidebarExpanded(false)}
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <div className={`space-y-3 ${isSidebarExpanded ? "" : "flex flex-col items-center"}`}>
              {site?.logoUrl ? (
                <div className={`rounded-2xl bg-white px-3 py-3 shadow-inner ring-1 ring-black/5 ${isSidebarExpanded ? "" : "w-full"}`}>
                  <img src={site.logoUrl} alt={site.logoAlt} className="mx-auto h-auto max-h-14 w-full object-contain" />
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-amber-400 font-display text-xl font-bold text-maxton-navy shadow-lg">
                  E
                </div>
              )}
              <div className={`overflow-hidden transition-all duration-300 ${isSidebarExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-indigo-200/90">Maxton - EMSP</p>
                <p className="mt-1 font-display text-lg font-bold leading-snug">{site?.siteName || "EMSP"}</p>
                <p className="mt-1 text-xs leading-snug text-white/65">{site?.slogan || "Pilotage institutionnel"}</p>
              </div>
            </div>
            <div
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 ${roleBadgeClass} ${
                isSidebarExpanded ? "" : "mx-auto"
              }`}
            >
              {user?.role || "admin"}
            </div>
          </div>

          <nav className="mt-6 flex flex-1 flex-col gap-1">
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.to} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `group flex items-center rounded-xl py-2.5 text-sm font-medium transition-all ${
                        isSidebarExpanded ? "gap-3 px-3" : "justify-center px-2"
                      } ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-500/90 to-secondary/90 text-white shadow-lg shadow-emerald-900/25"
                          : "text-white/72 hover:bg-white/10 hover:text-white"
                      }`
                    }
                    title={!isSidebarExpanded ? item.label : undefined}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10 transition group-hover:bg-white/15">
                      <Icon size={17} />
                    </span>
                    <span
                      className={`truncate overflow-hidden whitespace-nowrap transition-all duration-300 ${
                        isSidebarExpanded ? "max-w-[180px] opacity-100" : "max-w-0 opacity-0"
                      }`}
                    >
                      {item.label}
                    </span>
                  </NavLink>
                </motion.div>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
            className={`mt-4 flex items-center justify-center rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/12 ${
              isSidebarExpanded ? "gap-2 px-4" : "px-2"
            }`}
            title={!isSidebarExpanded ? "Deconnexion" : undefined}
          >
            <LogOut size={17} />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                isSidebarExpanded ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
              }`}
            >
              Deconnexion
            </span>
          </button>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="emsp-topbar sticky top-0 z-30 px-4 py-3 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="w-full">
                <Breadcrumbs className="mb-3" />
              </div>

              <div ref={searchContainerRef} className="relative min-w-[260px] flex-1">
                <div className="emsp-panel flex items-center gap-3 rounded-full bg-slate-50/90 px-4 py-2.5 shadow-sm">
                  <Search size={18} className="shrink-0 text-slate-400" />
                  <input
                    value={searchValue}
                    onChange={handleSearchChange}
                    onFocus={() => setIsSearchOpen(true)}
                    onKeyDown={handleSearchKeyDown}
                    type="search"
                    placeholder="Rechercher etudiants, dossiers, formations..."
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                  {isSearching ? <Loader2 size={16} className="animate-spin text-slate-400" /> : null}
                </div>

                {isSearchOpen && searchValue.trim() ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-40 rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_28px_70px_-38px_rgba(15,23,42,0.35)]">
                    {searchSections.length ? (
                      <div className="space-y-3">
                        {searchSections.map((section) => (
                          <div key={section.label}>
                            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{section.label}</p>
                            <div className="mt-2 space-y-1">
                              {section.items.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => handleSearchSelect(item.to)}
                                  className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50"
                                >
                                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-secondary/70" />
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-dark">{item.title}</span>
                                    <span className="block truncate text-xs text-slate-500">{item.subtitle}</span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-3 py-2 text-sm text-slate-500">Aucun resultat pour cette recherche.</p>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="emsp-panel relative rounded-full p-2.5 text-slate-600 shadow-sm transition hover:border-secondary hover:text-secondary"
                  aria-label={isDark ? "Activer le theme clair" : "Activer le theme sombre"}
                  title={isDark ? "Theme clair" : "Theme sombre"}
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div ref={notificationContainerRef} className="relative">
                  <button
                    type="button"
                    onClick={handleNotificationsToggle}
                    className="emsp-panel relative rounded-full p-2.5 text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
                    aria-label="Notifications"
                  >
                    <Bell size={18} />
                    {notifications.length ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" /> : null}
                  </button>

                  {isNotificationsOpen ? (
                    <div className="absolute right-0 top-[calc(100%+10px)] z-40 w-[360px] max-w-[88vw] rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_28px_70px_-38px_rgba(15,23,42,0.35)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-dark">Notifications</p>
                          <p className="text-xs text-slate-500">Alertes utiles du portail admin</p>
                        </div>
                        {notificationsLoading ? <Loader2 size={16} className="animate-spin text-slate-400" /> : null}
                      </div>
                      <div className="mt-4 space-y-2">
                        {notifications.length ? (
                          notifications.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                if (item.to) navigate(item.to);
                                if (item.id === "profile-incomplete") setIsProfileOpen(true);
                                setIsNotificationsOpen(false);
                              }}
                              className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-secondary/20 hover:bg-slate-50"
                            >
                              <p className="text-sm font-semibold text-dark">{item.title}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                            </button>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                            Aucune notification critique pour le moment.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="emsp-panel flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 shadow-sm transition hover:border-secondary/20"
                >
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-secondary/25 to-secondary/5 text-sm font-bold text-secondary ring-1 ring-secondary/20">
                    {profilePreview ? (
                      <img src={profilePreview} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      user?.firstName?.[0] || displayName[0] || "A"
                    )}
                  </div>
                  <div className="hidden min-w-0 sm:block">
                    <p className="truncate text-sm font-semibold text-dark">{displayName}</p>
                    <p className="text-[11px] capitalize text-slate-500">{user?.role || "admin"}</p>
                  </div>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 md:px-6">
            <Suspense fallback={<AdminOutletFallback />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>

      {isProfileOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/55 px-4 pb-4 sm:items-center sm:pb-0">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Profil admin</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-dark">Gerer mon compte</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="rounded-2xl bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {profileFeedback ? (
              <div
                className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                  profileFeedback.type === "success"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {profileFeedback.text}
              </div>
            ) : null}

            <div className="mt-5 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
                  {profilePreview ? (
                    <img src={profilePreview} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <UserRound size={42} className="text-slate-300" />
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">
                    <Camera size={18} />
                    Ajouter ou changer la photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleAvatarDelete()}
                    disabled={isSavingProfile || (!profilePreview && !profileFile)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
                  >
                    Supprimer la photo
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-dark">
                  Nom d'utilisateur
                  <input
                    value={profileForm.username}
                    onChange={(event) => setProfileForm((current) => ({ ...current, username: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal text-slate-700 outline-none"
                  />
                </label>
                <label className="block text-sm font-semibold text-dark">
                  Email
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal text-slate-700 outline-none"
                  />
                </label>
                <label className="block text-sm font-semibold text-dark">
                  Prenom
                  <input
                    value={profileForm.firstName}
                    onChange={(event) => setProfileForm((current) => ({ ...current, firstName: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal text-slate-700 outline-none"
                  />
                </label>
                <label className="block text-sm font-semibold text-dark">
                  Nom
                  <input
                    value={profileForm.lastName}
                    onChange={(event) => setProfileForm((current) => ({ ...current, lastName: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal text-slate-700 outline-none"
                  />
                </label>
                <label className="block text-sm font-semibold text-dark sm:col-span-2">
                  Telephone
                  <input
                    value={profileForm.phone}
                    onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal text-slate-700 outline-none"
                  />
                </label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 sm:col-span-2">
                  Role actuel: <span className="font-semibold capitalize text-dark">{user?.role || "admin"}</span>
                </div>
                <div className="sm:col-span-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleProfileSubmit()}
                    disabled={isSavingProfile}
                    className="rounded-2xl bg-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {isSavingProfile ? "Enregistrement..." : "Enregistrer les modifications"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(false)}
                    className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminPortalLayout;
