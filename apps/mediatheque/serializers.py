from rest_framework import serializers
from django.urls import reverse

from .models import MediaItem


class MediaItemSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = MediaItem
        fields = [
            "id",
            "title",
            "description",
            "alt_text",
            "url",
            "type",
            "video_type",
            "video_url",
            "file_name",
            "category",
            "created_at",
        ]

    def get_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            proxy_url = reverse("media_file_proxy", args=[obj.pk])
            return request.build_absolute_uri(proxy_url)
        if obj.file:
            return obj.file.url
        return obj.video_url or ""

    def get_file_name(self, obj):
        if obj.file:
            return obj.file.name.split("/")[-1]
        return ""

    def validate(self, attrs):
        media_type = attrs.get("type", getattr(self.instance, "type", "image"))
        video_type = attrs.get("video_type", getattr(self.instance, "video_type", ""))
        video_url = attrs.get("video_url", getattr(self.instance, "video_url", ""))
        file_provided = "file" in attrs
        file_value = attrs.get("file") if file_provided else None
        has_file = bool(file_value) if file_provided else bool(getattr(self.instance, "file", None))

        self._clear_file = False

        if media_type in {"image", "document"}:
            if not has_file:
                raise serializers.ValidationError(
                    {"file": "Un fichier est requis pour ce type de media."}
                )
            attrs["video_type"] = ""
            attrs["video_url"] = ""
            return attrs

        normalized_video_type = video_type or ("youtube" if video_url else "upload")

        if normalized_video_type == "youtube":
            if not video_url:
                raise serializers.ValidationError(
                    {"video_url": "Un lien YouTube est requis pour une video YouTube."}
                )
            attrs["video_type"] = "youtube"
            self._clear_file = True
            return attrs

        if not has_file:
            raise serializers.ValidationError(
                {"file": "Un fichier video est requis pour un upload."}
            )

        attrs["video_type"] = "upload"
        attrs["video_url"] = ""
        return attrs

    def update(self, instance, validated_data):
        if getattr(self, "_clear_file", False) and instance.file:
            instance.file.delete(save=False)
            instance.file = ""
            validated_data.pop("file", None)
        return super().update(instance, validated_data)


class MediaItemAdminSerializer(MediaItemSerializer):
    file = serializers.FileField(required=False, allow_null=True)

    class Meta(MediaItemSerializer.Meta):
        fields = MediaItemSerializer.Meta.fields + [
            "file",
            "is_active",
        ]
