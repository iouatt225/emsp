import axiosInstance from "./axiosConfig";
import type { AdminPortalUser, AdminPortalUserPayload, User } from "../types";

type RawUser = Partial<User> & {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  is_active?: boolean;
};

export const normalizeUser = (raw: RawUser | null | undefined): User | null => {
  if (!raw || !raw.id) {
    return null;
  }

  return {
    id: raw.id,
    username: raw.username || raw.email || "",
    email: raw.email || "",
    firstName: raw.firstName || raw.first_name || "",
    lastName: raw.lastName || raw.last_name || "",
    role: (raw.role || "etudiant") as User["role"],
    phone: raw.phone || "",
    avatarUrl: raw.avatarUrl || raw.avatar_url || "",
    isActive: typeof raw.isActive === "boolean" ? raw.isActive : typeof raw.is_active === "boolean" ? raw.is_active : true,
  };
};

export async function updateCurrentUserProfile(payload: {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarFile?: File | null;
  removeAvatar?: boolean;
}) {
  const formData = new FormData();

  if (payload.username !== undefined) formData.append("username", payload.username);
  if (payload.email !== undefined) formData.append("email", payload.email);
  if (payload.firstName !== undefined) formData.append("first_name", payload.firstName);
  if (payload.lastName !== undefined) formData.append("last_name", payload.lastName);
  if (payload.phone !== undefined) formData.append("phone", payload.phone);
  if (payload.avatarFile) formData.append("avatar", payload.avatarFile);
  if (payload.removeAvatar) formData.append("remove_avatar", "true");

  const response = await axiosInstance.patch<RawUser>("/auth/me/", formData);

  return normalizeUser(response.data);
}

type RawAdminUserListResponse = {
  count: number;
  results: RawUser[];
};

const normalizeAdminUser = (raw: RawUser): AdminPortalUser => ({
  ...(normalizeUser(raw) as User),
  isActive: typeof raw.isActive === "boolean" ? raw.isActive : typeof raw.is_active === "boolean" ? raw.is_active : true,
});

export async function fetchAdminUsers() {
  const response = await axiosInstance.get<RawAdminUserListResponse>("/auth/users/");
  return {
    count: response.data.count,
    results: response.data.results.map(normalizeAdminUser),
  };
}

export async function createAdminUser(payload: AdminPortalUserPayload) {
  const response = await axiosInstance.post<RawUser>("/auth/users/", {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    role: payload.role,
    phone: payload.phone || "",
    password: payload.password || undefined,
    is_active: payload.isActive ?? true,
  });
  return normalizeAdminUser(response.data);
}

export async function updateAdminUser(id: number, payload: AdminPortalUserPayload) {
  const response = await axiosInstance.put<RawUser>(`/auth/users/${id}/`, {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    role: payload.role,
    phone: payload.phone || "",
    password: payload.password || undefined,
    is_active: payload.isActive ?? true,
  });
  return normalizeAdminUser(response.data);
}

export async function toggleAdminUserStatus(id: number, isActive: boolean) {
  const response = await axiosInstance.patch<RawUser>(`/auth/users/${id}/`, {
    is_active: isActive,
  });
  return normalizeAdminUser(response.data);
}

export async function deleteAdminUser(id: number) {
  await axiosInstance.delete(`/auth/users/${id}/`);
}

export async function resetAdminUserPassword(id: number, password = "emsp12345") {
  const response = await axiosInstance.post<{ detail: string; temporary_password: string }>(`/auth/users/${id}/reset-password/`, {
    password,
  });
  return response.data;
}
