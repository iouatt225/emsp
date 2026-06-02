from pathlib import Path
from zlib import crc32

from django.conf import settings
from django.urls import reverse
from django.utils.encoding import filepath_to_uri


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ARTICLE_FALLBACK_DIR = settings.MEDIA_ROOT / "imageemsp"


def _media_url_for_path(path: Path) -> str:
    relative_path = path.relative_to(settings.MEDIA_ROOT).as_posix()
    return f"{settings.MEDIA_URL}{filepath_to_uri(relative_path)}"


def get_article_fallback_images():
    if not ARTICLE_FALLBACK_DIR.exists():
        return []

    return sorted(
        [
            path
            for path in ARTICLE_FALLBACK_DIR.iterdir()
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
        ],
        key=lambda item: item.name.lower(),
    )


def attach_article_display_images(articles):
    fallback_images = get_article_fallback_images()
    total_images = len(fallback_images)

    for article in articles:
        if getattr(article, "cover", None):
            article.display_image_url = reverse("media_file_proxy", args=[article.cover.pk]) if article.cover.pk else article.cover.url
            article.display_image_alt = article.cover.alt_text or article.titre
            article.display_image_is_fallback = False
            continue

        if total_images:
            base_index = article.pk or crc32(article.slug.encode("utf-8"))
            image_path = fallback_images[(base_index - 1) % total_images]
            article.display_image_url = _media_url_for_path(image_path)
            article.display_image_alt = f"Illustration de {article.titre}"
            article.display_image_is_fallback = True
            continue

        article.display_image_url = ""
        article.display_image_alt = article.titre
        article.display_image_is_fallback = False

    return articles
