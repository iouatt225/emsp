import type { User } from "../types";
import { limitedAdminRoles, staticAdminDashboardPath } from "./adminPortal";

export const studentHomePath = "/etudiant/dashboard";
export const driverHomePath = "/chauffeur/transport";

export const isAdminFamilyRole = (role?: User["role"] | null) =>
  limitedAdminRoles.includes((role || "etudiant") as (typeof limitedAdminRoles)[number]);

export const isDriverRole = (role?: User["role"] | null) => role === "chauffeur";

export const getUserHomePath = (role?: User["role"] | null) => {
  if (isAdminFamilyRole(role)) return staticAdminDashboardPath;
  if (isDriverRole(role)) return driverHomePath;
  return studentHomePath;
};
