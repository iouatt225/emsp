import axiosInstance from "./axiosConfig";
import type { AdminMediaItem, AdminMediaPayload, MediaItem } from "../types";
import { resolvePublicAssetUrl } from "../utils/media";

interface RawMediaItem {
  id: number;
  title: string;
  url: string;
  type: "image" | "video" | "document";
  category: string;
  created_at?: string;
  alt_text?: string;
  description?: string;
  video_type?: "upload" | "youtube";
  video_url?: string;
  file_name?: string;
}

interface RawAdminMediaItem extends RawMediaItem {
  is_active: boolean;
}

function mapMediaItem(item: RawMediaItem): MediaItem {
  return {
    id: item.id,
    title: item.title,
    url: resolvePublicAssetUrl(item.url),
    type: item.type,
    category: item.category,
    createdAt: item.created_at || "",
    altText: item.alt_text,
    description: item.description,
    videoType: item.video_type,
    videoUrl: item.video_url,
    fileName: item.file_name,
  };
}

function mapAdminMediaItem(item: RawAdminMediaItem): AdminMediaItem {
  return {
    ...mapMediaItem(item),
    isActive: item.is_active,
  };
}

export async function fetchMedia(params?: { category?: string; type?: "image" | "video" | "document"; limit?: number }) {
  const response = await axiosInstance.get<{ results?: RawMediaItem[] } | RawMediaItem[]>("/media/", {
    params,
  });
  const items = Array.isArray(response.data) ? response.data : response.data.results || [];
  return items.map<MediaItem>(mapMediaItem);
}

export async function fetchMediaById(id: number) {
  const response = await axiosInstance.get<RawMediaItem>(`/media/${id}/`);
  return mapMediaItem(response.data);
}

export async function fetchAdminMedia(params?: { category?: string; type?: "image" | "video" | "document"; search?: string }) {
  const response = await axiosInstance.get<RawAdminMediaItem[]>("/media/admin/", {
    params,
  });
  return response.data.map<AdminMediaItem>(mapAdminMediaItem);
}

export async function createAdminMedia(payload: AdminMediaPayload) {
  const response = await axiosInstance.post<RawAdminMediaItem>("/media/admin/", buildAdminMediaFormData(payload));

  return mapAdminMediaItem(response.data);
}

export async function updateAdminMedia(id: number, payload: AdminMediaPayload) {
  const response = await axiosInstance.patch<RawAdminMediaItem>(`/media/admin/${id}/`, buildAdminMediaFormData(payload));

  return mapAdminMediaItem(response.data);
}

export async function deleteAdminMedia(id: number) {
  await axiosInstance.delete(`/media/admin/${id}/`);
}

function buildAdminMediaFormData(payload: AdminMediaPayload) {
  const formData = new FormData();

  formData.append("title", payload.title);
  formData.append("type", payload.type);
  formData.append("is_active", String(payload.isActive));

  if (payload.description) {
    formData.append("description", payload.description);
  }
  if (payload.altText) {
    formData.append("alt_text", payload.altText);
  }
  if (payload.category) {
    formData.append("category", payload.category);
  }
  if (payload.type === "video") {
    formData.append("video_type", payload.videoType || (payload.videoUrl ? "youtube" : "upload"));
    if (payload.videoUrl) {
      formData.append("video_url", payload.videoUrl);
    }
  }
  if (payload.file && !(payload.type === "video" && payload.videoType === "youtube")) {
    formData.append("file", payload.file);
  }

  return formData;
}
