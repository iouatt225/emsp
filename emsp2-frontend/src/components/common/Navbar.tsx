import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import MegaMenu from "./MegaMenu";
import { navigationConfig } from "../../config/navigation";
import { limitedAdminRoles, staticAdminDashboardPath } from "../../config/adminPortal";
import { getUserHomePath } from "../../config/portalAccess";
import { useAuth } from "../../hooks/useAuth";
import { useSiteConfig } from "../../hooks/useSiteConfig";

const Navbar = () => {
  const [isSticky, setIsSticky] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [formationsOpen, setFormationsOpen] = useState(false);
  const [desktopMegaOpen, setDesktopMegaOpen] = useState(false);
  const { data: site } = useSiteConfig();
  const { user, isAuthenticated } = useAuth();

  const portalHref = !isAuthenticated ? "/login" : getUserHomePath(user?.role);
  const adminHref = !isAuthenticated
    ? "/login"
    : limitedAdminRoles.includes((user?.role || "etudiant") as (typeof limitedAdminRoles)[number])
      ? staticAdminDashboardPath
      : getUserHomePath(user?.role);
  const portalLabel = user?.role === "chauffeur" ? "Espace Chauffeur" : "Espace Etudiant";

  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`z-50 w-full bg-white transition-all duration-300 ${isSticky ? "sticky top-0 shadow-md" : "relative shadow-sm"}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2" aria-label="Logo EMSP">
          {site?.logoUrl ? (
            <img
              src={site.logoUrl}
              alt={site.logoAlt || "Logo EMSP"}
              className="h-12 w-auto max-w-[160px] object-contain"
            />
          ) : (
            <span className="font-display text-2xl font-bold text-dark">{site?.siteName || "EMSP"}</span>
          )}
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navigationConfig.map((item) => {
            if (item.megaMenu) {
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setDesktopMegaOpen(true)}
                  onMouseLeave={() => setDesktopMegaOpen(false)}
                >
                  <button
                    className="inline-flex items-center gap-1 font-medium text-dark transition hover:text-secondary"
                    aria-label="Menu Formations"
                  >
                    {item.label}
                    <ChevronDown size={16} />
                  </button>
                  <MegaMenu open={desktopMegaOpen} columns={item.megaMenu} />
                </div>
              );
            }
            return (
              <NavLink
                key={item.label}
                to={item.path || "/"}
                className={({ isActive }) =>
                  `font-medium transition hover:text-secondary ${isActive ? "text-secondary" : "text-dark"}`
                }
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={portalHref}
            className="rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            {portalLabel}
          </a>
          <a
            href={adminHref}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-dark transition hover:bg-amber-400"
          >
            Administration
          </a>
        </div>

        <button
          className="inline-flex items-center rounded-md border border-slate-200 p-2 lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir menu mobile"
        >
          <Menu size={20} />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25 }}
              className="fixed left-0 top-0 z-50 h-full w-[300px] bg-secondary p-5 text-white"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-display text-xl font-bold">{site?.siteName || "EMSP"}</span>
                <button onClick={() => setMobileOpen(false)} aria-label="Fermer menu mobile">
                  <X size={22} />
                </button>
              </div>

              <ul className="space-y-3">
                {navigationConfig.map((item) => {
                  if (item.megaMenu) {
                    return (
                      <li key={item.label}>
                        <button
                          className="flex w-full items-center justify-between py-2 font-medium"
                          onClick={() => setFormationsOpen((state) => !state)}
                        >
                          {item.label}
                          <ChevronDown size={16} className={formationsOpen ? "rotate-180" : ""} />
                        </button>
                        <AnimatePresence>
                          {formationsOpen ? (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-2 rounded-md bg-emerald-600/40 p-3">
                                {item.megaMenu.flatMap((col) =>
                                  col.links.map((link) => (
                                    <Link
                                      key={link.path}
                                      to={link.path}
                                      className="flex items-center gap-2 py-1 text-sm"
                                      onClick={() => setMobileOpen(false)}
                                    >
                                      <ChevronRight size={14} />
                                      {link.label}
                                    </Link>
                                  )),
                                )}
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </li>
                    );
                  }
                  return (
                    <li key={item.label}>
                      <Link to={item.path || "/"} className="block py-2 font-medium" onClick={() => setMobileOpen(false)}>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 space-y-2">
                <a
                  href={portalHref}
                  className="block rounded-md bg-white px-4 py-2 text-center text-sm font-semibold text-secondary"
                  onClick={() => setMobileOpen(false)}
                >
                  {portalLabel}
                </a>
                <a
                  href={adminHref}
                  className="block rounded-md bg-primary px-4 py-2 text-center text-sm font-semibold text-dark"
                  onClick={() => setMobileOpen(false)}
                >
                  Administration
                </a>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
