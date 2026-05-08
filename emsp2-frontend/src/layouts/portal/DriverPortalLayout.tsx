import { BusFront, LogOut, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import Breadcrumbs from "../../components/common/Breadcrumbs";
import { useAuth } from "../../hooks/useAuth";
import { usePortalTheme } from "../../hooks/usePortalTheme";

const driverItems = [{ to: "/chauffeur/transport", label: "Transport", icon: BusFront }];

const DriverPortalLayout = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = usePortalTheme();
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const syncOnlineState = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);
    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  return (
    <div className="maxton-portal-shell min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1420px]">
        <aside className="maxton-sidebar-student hidden min-h-screen w-[220px] shrink-0 border-r border-white/10 px-3 py-5 text-white sm:block">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-sm font-bold">
                {user?.firstName?.[0] || "C"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user ? `${user.firstName} ${user.lastName}` : "Chauffeur EMSP"}</p>
                <p className="truncate text-xs text-white/65">Portail chauffeur</p>
              </div>
            </div>
          </div>

          <nav className="mt-5 space-y-1" aria-label="Navigation chauffeur">
            {driverItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? "bg-emerald-500 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
            className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10"
          >
            <LogOut size={17} />
            Deconnexion
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="emsp-topbar sticky top-0 z-30 px-4 py-3">
            <div className="mx-auto max-w-[1200px]">
              <div className="hidden sm:block">
                <Breadcrumbs className="mb-2" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-600">EMSP</p>
                  <h1 className="truncate font-display text-lg font-bold text-dark sm:text-2xl">Espace chauffeur</h1>
                </div>
                <div className="flex items-center gap-2">
                  {!isOnline ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                      Hors ligne
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="emsp-panel rounded-xl p-2.5 text-slate-600 shadow-sm transition hover:border-secondary hover:text-secondary"
                    aria-label={isDark ? "Activer le theme clair" : "Activer le theme sombre"}
                    title={isDark ? "Theme clair" : "Theme sombre"}
                  >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                  <div className="emsp-panel rounded-xl px-3 py-2 text-right text-xs shadow-sm">
                    <span className="block font-semibold text-dark">{user ? `${user.firstName} ${user.lastName}` : "Chauffeur"}</span>
                    <span className="text-slate-500 capitalize">{user?.role || "chauffeur"}</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5">
            <div className="mx-auto max-w-[1200px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DriverPortalLayout;
