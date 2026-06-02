"""
Compatibility entrypoint for Render's default `gunicorn app:app` start command.

This exposes the Django WSGI callable as `app` so the service can boot even if
the Render start command was created from the generic Python template.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "emsp1.settings")

app = get_wsgi_application()

