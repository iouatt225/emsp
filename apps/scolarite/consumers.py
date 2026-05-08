import asyncio
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken, TokenError

from .dashboard_visuals import build_dashboard_stream_point, build_dashboard_stream_seed

User = get_user_model()
ALLOWED_ROLES = {"staff", "compta", "admin"}


@database_sync_to_async
def _resolve_user_from_token(token: str):
    if not token:
        return None

    try:
        access_token = AccessToken(token)
        user_id = access_token.get("user_id")
    except TokenError:
        return None

    user = User.objects.filter(pk=user_id, is_active=True).first()
    if user is None or user.role not in ALLOWED_ROLES:
        return None
    return user


@database_sync_to_async
def _stream_seed():
    return build_dashboard_stream_seed()


@database_sync_to_async
def _stream_point():
    return build_dashboard_stream_point()


class AdminDashboardStreamConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        query = parse_qs(self.scope["query_string"].decode("utf-8"))
        token = query.get("token", [""])[0]
        self.user = await _resolve_user_from_token(token)

        if self.user is None:
            await self.close(code=4401)
            return

        await self.accept()
        await self.send_json({"type": "seed", "points": await _stream_seed()})
        self.stream_task = asyncio.create_task(self._stream_loop())

    async def disconnect(self, close_code):
        stream_task = getattr(self, "stream_task", None)
        if stream_task:
            stream_task.cancel()

    async def _stream_loop(self):
        try:
            while True:
                await asyncio.sleep(4)
                await self.send_json({"type": "point", "point": await _stream_point()})
        except asyncio.CancelledError:
            return
