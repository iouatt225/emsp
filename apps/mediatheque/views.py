import mimetypes

from django.http import FileResponse, Http404, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.templatetags.static import static

from .models import MediaItem


def hero_image(request):
    item = MediaItem.objects.filter(category="hero", is_active=True).first()
    if item and item.url:
        return HttpResponseRedirect(item.url)
    return HttpResponseRedirect(static("purdue/images/all-img/home-image.png"))


def media_index(request):
    raise Http404("Page media non implementee")


def media_file_proxy(request, pk):
    item = get_object_or_404(MediaItem, pk=pk)
    if not item.file:
        raise Http404("Fichier media introuvable.")

    try:
        item.file.open("rb")
    except Exception as exc:
        raise Http404("Fichier media introuvable.") from exc

    content_type, _ = mimetypes.guess_type(item.file.name)
    return FileResponse(item.file, content_type=content_type or "application/octet-stream")
