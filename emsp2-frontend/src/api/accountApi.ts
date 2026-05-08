import axiosInstance from "./axiosConfig";
import type { User } from "../types";

type RawUser = Partial<User> & {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
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

  const response = await axiosInstance.patch<RawUser>("/auth/me/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return normalizeUser(response.data);
}
