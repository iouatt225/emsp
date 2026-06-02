from django.db import models
from django.urls import reverse


class MediaItem(models.Model):
    TYPE_CHOICES = [("image", "Image"), ("video", "Video"), ("document", "Document")]
    VIDEO_TYPE_CHOICES = [("upload", "Upload"), ("youtube", "YouTube")]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    alt_text = models.CharField(max_length=200, blank=True)
    file = models.FileField(upload_to="media/%Y/%m/", blank=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default="image")
    video_url = models.URLField(blank=True)
    video_type = models.CharField(max_length=20, choices=VIDEO_TYPE_CHOICES, blank=True)
    category = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

    @property
    def url(self):
        if self.file:
            if self.pk:
                return reverse("media_file_proxy", args=[self.pk])
            return self.file.url
        if self.video_url:
            return self.video_url
        return ""
