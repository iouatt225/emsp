import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponseRedirect
from django.urls import reverse
from django.shortcuts import render

from apps.actualites.image_utils import attach_article_display_images
from apps.actualites.models import Article
from apps.formations.models import Filiere
from apps.mediatheque.models import MediaItem

REACT_DIST_DIR = settings.BASE_DIR / "emsp2-frontend" / "dist"
REACT_ASSETS_DIR = REACT_DIST_DIR / "assets"
EMSP_FRONTEND_DIR = settings.BASE_DIR / "emsp-frontend"
EMSP_FRONTEND_ASSETS_DIR = EMSP_FRONTEND_DIR / "assets"
EMSP_DASHBOARD_DIR = EMSP_FRONTEND_DIR / "dashboard"
EMSP_FRONTEND_JS_DIR = EMSP_FRONTEND_DIR / "js"

NOUVEAU_DASHBOARD_DIR = (
    settings.BASE_DIR
    / "nouveau_dashboard"
    / "codervent.com"
    / "maxton"
    / "demo"
    / "vertical-menu"
)
NOUVEAU_DASHBOARD_ASSETS_DIR = NOUVEAU_DASHBOARD_DIR / "assets"


def home(request):
    """Page d'accueil publique basee sur Purdue."""

    def get_media(category):
        return MediaItem.objects.filter(category=category, is_active=True).first()

    def get_media_list(category, limit=None):
        queryset = MediaItem.objects.filter(
            category=category,
            is_active=True,
            type="image",
        ).order_by("-created_at")
        if limit:
            return queryset[:limit]
        return queryset

    articles_recents = list(
        Article.objects.filter(is_published=True).select_related("cover").order_by("-publie_le")[:3]
    )
    attach_article_display_images(articles_recents)

    context = {
        "hero_image": get_media("hero"),
        "hero_images": get_media_list("hero", limit=5),
        "about_image": get_media("about"),
        "why_image": get_media("why"),
        "promo_image": get_media("promo"),
        "drapeaux_images": get_media_list("drapeaux", limit=8),
        "partenaires_images": get_media_list("partenaires", limit=12),
        "filieres_home": Filiere.objects.filter(is_active=True).order_by("ordre")[:8],
        "formations_vedette": Filiere.objects.filter(is_active=True).order_by("ordre")[:4],
        "articles_recents": articles_recents,
        "enseignants_home": [],
        "temoignages": [],
        "why_items": [],
    }
    return render(request, "public/home.html", context)


def contact(request):
    return render(request, "public/contact.html")


def a_propos(request):
    return render(request, "public/a_propos.html")


def newsletter_subscribe(request):
    return HttpResponseRedirect(reverse("core:home"))


def react_app(request, path=""):
    index_path = REACT_DIST_DIR / "index.html"
    if not index_path.exists():
        return home(request)

    return FileResponse(index_path.open("rb"), content_type="text/html; charset=utf-8")


def react_asset(request, path):
    asset_path = (REACT_ASSETS_DIR / Path(path)).resolve()

    if REACT_ASSETS_DIR.resolve() not in asset_path.parents or not asset_path.is_file():
        raise Http404("Asset frontend introuvable.")

    content_type, _ = mimetypes.guess_type(asset_path.name)
    return FileResponse(asset_path.open("rb"), content_type=content_type or "application/octet-stream")


def emsp_frontend_asset(request, path):
    asset_path = (EMSP_FRONTEND_ASSETS_DIR / Path(path)).resolve()

    if EMSP_FRONTEND_ASSETS_DIR.resolve() in asset_path.parents and asset_path.is_file():
        content_type, _ = mimetypes.guess_type(asset_path.name)
        return FileResponse(asset_path.open("rb"), content_type=content_type or "application/octet-stream")

    return react_asset(request, path)


def emsp_frontend_page(request, path):
    page_path = (EMSP_FRONTEND_DIR / Path(path)).resolve()

    if EMSP_FRONTEND_DIR.resolve() not in page_path.parents or not page_path.is_file():
        raise Http404("Page frontend introuvable.")

    content_type, _ = mimetypes.guess_type(page_path.name)
    return FileResponse(page_path.open("rb"), content_type=content_type or "text/html; charset=utf-8")


def emsp_frontend_js(request, path):
    asset_path = (EMSP_FRONTEND_JS_DIR / Path(path)).resolve()

    if EMSP_FRONTEND_JS_DIR.resolve() not in asset_path.parents or not asset_path.is_file():
        raise Http404("Script frontend introuvable.")

    content_type, _ = mimetypes.guess_type(asset_path.name)
    return FileResponse(asset_path.open("rb"), content_type=content_type or "application/javascript")


def emsp_dashboard_file(request, path="index.html"):
    requested_path = Path(path or "index.html")
    if str(path).endswith("/"):
        requested_path = requested_path / "index.html"

    dashboard_path = (EMSP_DASHBOARD_DIR / requested_path).resolve()

    if EMSP_DASHBOARD_DIR.resolve() not in dashboard_path.parents and dashboard_path != EMSP_DASHBOARD_DIR.resolve():
        raise Http404("Fichier dashboard introuvable.")
    if not dashboard_path.is_file():
        raise Http404("Fichier dashboard introuvable.")

    content_type, _ = mimetypes.guess_type(dashboard_path.name)
    return FileResponse(dashboard_path.open("rb"), content_type=content_type or "application/octet-stream")


def nouveau_dashboard_app(request, portal=None, path=""):
    index_path = NOUVEAU_DASHBOARD_DIR / "index.html"
    if not index_path.exists():
        raise Http404("Le template `nouveau_dashboard` est introuvable.")
    return FileResponse(index_path.open("rb"), content_type="text/html; charset=utf-8")


def nouveau_dashboard_asset(request, portal=None, path=""):
    asset_path = (NOUVEAU_DASHBOARD_ASSETS_DIR / Path(path)).resolve()

    if NOUVEAU_DASHBOARD_ASSETS_DIR.resolve() not in asset_path.parents or not asset_path.is_file():
        raise Http404("Asset dashboard introuvable.")

    content_type, _ = mimetypes.guess_type(asset_path.name)
    return FileResponse(asset_path.open("rb"), content_type=content_type or "application/octet-stream")
