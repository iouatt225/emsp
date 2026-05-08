from django.urls import path, re_path
from django.views.generic.base import RedirectView

from . import views

app_name = "core"

urlpatterns = [
    path("", views.react_app, name="home"),
    path("index.html", RedirectView.as_view(url="/", permanent=False), name="legacy_public_home"),
    path("admin/", views.react_app, name="admin_dashboard_redirect"),
    re_path(r"^admin/.+$", views.react_app, name="admin_dashboard_deep_redirect"),
    path("dashboard/", RedirectView.as_view(url="/admin/dashboard", permanent=False), name="dashboard_redirect"),
    path("dashboard/<path:path>", RedirectView.as_view(url="/admin/dashboard", permanent=False), name="emsp_dashboard_file"),
    path("login", views.react_app, name="login"),
    path("login.html", RedirectView.as_view(url="/login", permanent=False), name="legacy_login_page"),
    path("js/<path:path>", views.emsp_frontend_js, name="emsp_frontend_js"),
    path("contact/", views.react_app, name="contact"),
    path("newsletter/subscribe/", views.newsletter_subscribe, name="newsletter_subscribe"),
    path("a-propos/", views.a_propos, name="a_propos"),
    path("legacy/", views.home, name="legacy_home"),
    path("legacy/contact/", views.contact, name="legacy_contact"),
    path("assets/<path:path>", views.emsp_frontend_asset, name="frontend_asset"),
    re_path(
        r"^(?!(?:django-admin|api|assets|media|static)(?:/|$)|(?:a-propos|newsletter)(?:/|$)|mediatheque/hero-image(?:/|$)).*$",
        views.react_app,
        name="react_app",
    ),
]
