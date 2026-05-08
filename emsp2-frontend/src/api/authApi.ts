import axiosInstance from "./axiosConfig";
import { normalizeUser } from "./accountApi";
import type { User } from "../types";

interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export async function login(payload: { email: string; password: string }) {
  const response = await axiosInstance.post<LoginResponse>("/auth/login/", payload);
  return {
    ...response.data,
    user: normalizeUser(response.data.user) as User,
  };
}
