from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsFullAdminAccess

from .models import MediaItem
from .serializers import MediaItemAdminSerializer, MediaItemSerializer
from .views import media_file_proxy


def _parse_limit(value):
    try:
        return max(1, int(value))
    except (TypeError, ValueError):
        return None


@api_view(["GET"])
@permission_classes([AllowAny])
def media_list_api(request):
    queryset = MediaItem.objects.filter(is_active=True).order_by("-created_at")

    category = request.query_params.get("category")
    media_type = request.query_params.get("type")
    limit = _parse_limit(request.query_params.get("limit"))

    if category:
        queryset = queryset.filter(category=category)
    if media_type:
        queryset = queryset.filter(type=media_type)
    if limit:
        queryset = queryset[:limit]

    serializer = MediaItemSerializer(
        queryset,
        many=True,
        context={"request": request},
    )
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def media_detail_api(request, pk):
    item = MediaItem.objects.filter(is_active=True, pk=pk).first()
    if not item:
        return Response({"detail": "Media non trouve."}, status=404)

    serializer = MediaItemSerializer(item, context={"request": request})
    return Response(serializer.data)


class MediaAdminListApi(APIView):
    permission_classes = [IsFullAdminAccess]

    def get(self, request):
        queryset = MediaItem.objects.all().order_by("-created_at")
        category = request.query_params.get("category")
        media_type = request.query_params.get("type")
        search = request.query_params.get("search", "").strip()

        if category:
            queryset = queryset.filter(category=category)
        if media_type:
            queryset = queryset.filter(type=media_type)
        if search:
            queryset = queryset.filter(title__icontains=search)

        serializer = MediaItemAdminSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = MediaItemAdminSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        media_item = serializer.save()
        return Response(MediaItemAdminSerializer(media_item, context={"request": request}).data, status=201)


class MediaAdminDetailApi(APIView):
    permission_classes = [IsFullAdminAccess]

    def get_object(self, pk):
        return MediaItem.objects.filter(pk=pk).first()

    def get(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response({"detail": "Media non trouve."}, status=404)
        return Response(MediaItemAdminSerializer(item, context={"request": request}).data)

    def patch(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response({"detail": "Media non trouve."}, status=404)
        serializer = MediaItemAdminSerializer(item, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MediaItemAdminSerializer(item, context={"request": request}).data)

    def delete(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response({"detail": "Media non trouve."}, status=404)
        item.delete()
        return Response(status=204)


urlpatterns = [
    path("admin/", MediaAdminListApi.as_view(), name="media_admin_list_api"),
    path("admin/<int:pk>/", MediaAdminDetailApi.as_view(), name="media_admin_detail_api"),
    path("<int:pk>/file/", media_file_proxy, name="media_file_proxy"),
    path("", media_list_api, name="media_list_api"),
    path("<int:pk>/", media_detail_api, name="media_detail_api"),
]
