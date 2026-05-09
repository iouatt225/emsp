import type { LucideIcon } from "lucide-react";
import { Bell, BusFront, FileText, FolderOpen, GraduationCap, Image, LayoutDashboard, Receipt, Settings2, ShieldCheck, UserRound, Users } from "lucide-react";

import type { User } from "../types";

export type AdminRole = Extract<User["role"], "staff" | "compta" | "admin" | "direction">;

export interface AdminPortalItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
  allowedRoles: AdminRole[];
}

export const fullAdminRoles: AdminRole[] = ["staff", "compta", "admin"];
export const limitedAdminRoles: AdminRole[] = ["staff", "compta", "admin", "direction"];
export const staticAdminDashboardPath = "/admin/dashboard";

export const adminPortalItems: AdminPortalItem[] = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Vue globale et indicateurs",
    allowedRoles: fullAdminRoles,
  },
  {
    to: "/admin/etudiants",
    label: "Etudiants",
    icon: Users,
    description: "Effectifs, dossiers et promotions",
    allowedRoles: limitedAdminRoles,
  },
  {
    to: "/admin/scolarite",
    label: "Scolarite",
    icon: GraduationCap,
    description: "Notes, emplois du temps et resultats",
    allowedRoles: limitedAdminRoles,
  },
  {
    to: "/admin/comptabilite",
    label: "Comptabilite",
    icon: Receipt,
    description: "Paiements, recus et relances",
    allowedRoles: limitedAdminRoles,
  },
  {
    to: "/admin/transport",
    label: "Transport",
    icon: BusFront,
    description: "Cars, paiements et expirations",
    allowedRoles: limitedAdminRoles,
  },
  {
    to: "/admin/utilisateurs",
    label: "Utilisateurs",
    icon: UserRound,
    description: "Comptes, roles et acces",
    allowedRoles: fullAdminRoles,
  },
  {
    to: "/admin/candidatures",
    label: "Candidatures",
    icon: FolderOpen,
    description: "Dossiers a consulter et confirmer",
    allowedRoles: fullAdminRoles,
  },
  {
    to: "/admin/enseignants",
    label: "Enseignants",
    icon: Bell,
    description: "Liste temporaire et notifications directes",
    allowedRoles: fullAdminRoles,
  },
  {
    to: "/admin/statistiques",
    label: "Statistiques",
    icon: ShieldCheck,
    description: "Analyses par pays et filiere",
    allowedRoles: fullAdminRoles,
  },
  {
    to: "/admin/mediatheque",
    label: "Mediatheque",
    icon: Image,
    description: "Visuels, documents et videos",
    allowedRoles: fullAdminRoles,
  },
  {
    to: "/admin/actualites",
    label: "Actualites",
    icon: FileText,
    description: "Publication et suivi editorial",
    allowedRoles: fullAdminRoles,
  },
  {
    to: "/admin/parametres",
    label: "Parametres",
    icon: Settings2,
    description: "Configuration generale du portail",
    allowedRoles: fullAdminRoles,
  },
];

export const getAdminHomePath = (_role?: User["role"] | null) => staticAdminDashboardPath;

export const getVisibleAdminPortalItems = (role?: User["role"] | null) =>
  adminPortalItems.filter((item) => item.allowedRoles.includes((role || "admin") as AdminRole));

export const canAccessAdminPath = (role: User["role"] | null | undefined, path: string) => {
  if (!path.startsWith("/admin")) {
    return true;
  }

  if (path === "/admin" || path === "/admin/") {
    return true;
  }

  const normalizedPath = path === "/admin/medias" ? "/admin/mediatheque" : path;
  const matchingItem = adminPortalItems.find(
    (item) => normalizedPath === item.to || normalizedPath.startsWith(`${item.to}/`),
  );

  if (!matchingItem) {
    return limitedAdminRoles.includes((role || "admin") as AdminRole);
  }

  return matchingItem.allowedRoles.includes((role || "admin") as AdminRole);
};
