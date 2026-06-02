export function getYoutubeVideoId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.slice(1) || null;
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      if (parsedUrl.searchParams.get("v")) {
        return parsedUrl.searchParams.get("v");
      }
      const segments = parsedUrl.pathname.split("/").filter(Boolean);
      const embedIndex = segments.findIndex((segment) => segment === "embed");
      if (embedIndex !== -1 && segments[embedIndex + 1]) {
        return segments[embedIndex + 1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function getYoutubeEmbedUrl(url: string): string {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) {
    return url;
  }
  return `https://www.youtube.com/embed/${videoId}`;
}

export function getYoutubeThumbnailUrl(url: string): string | null {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) {
    return null;
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getFileExtension(fileName?: string, url?: string): string {
  const source = fileName || url || "";
  const cleaned = source.split("?")[0];
  const extension = cleaned.split(".").pop();
  return extension ? extension.toUpperCase() : "FICHIER";
}

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const getBackendBaseUrl = () => {
  const configuredBaseUrl =
    import.meta.env.VITE_MEDIA_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.REACT_APP_API_BASE_URL ||
    "";

  if (configuredBaseUrl) {
    if (configuredBaseUrl.startsWith("http://") || configuredBaseUrl.startsWith("https://")) {
      return normalizeBaseUrl(configuredBaseUrl.replace(/\/api\/?$/, ""));
    }

    if (configuredBaseUrl.startsWith("/")) {
      return typeof window !== "undefined" ? normalizeBaseUrl(window.location.origin) : "";
    }

    return normalizeBaseUrl(configuredBaseUrl.replace(/\/api\/?$/, ""));
  }

  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
    return normalizeBaseUrl(origin);
  }

  return "";
};

export function resolvePublicAssetUrl(url?: string | null): string {
  if (!url) {
    return "";
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("//") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  if (!url.startsWith("/media/") && !url.startsWith("/static/")) {
    return url;
  }

  const backendBaseUrl = getBackendBaseUrl();
  return backendBaseUrl ? `${backendBaseUrl}${url}` : url;
}
