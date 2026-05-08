from django.urls import path

from .consumers import AdminDashboardStreamConsumer


websocket_urlpatterns = [
    path("ws/dashboard/stream/", AdminDashboardStreamConsumer.as_asgi()),
]
