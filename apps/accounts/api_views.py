from django.http import JsonResponse
from django.contrib.auth import get_user_model
from rest_framework import serializers, status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.permissions import IsFullAdminAccess
from apps.mediatheque.models import MediaItem
from apps.scolarite.demo import ensure_admin_bootstrap_data, ensure_portal_demo_data

from .serializers import LoginSerializer, UserSerializer


User = get_user_model()


def health(request):
    return JsonResponse({"app": "accounts", "status": "ok"})


class LoginApiView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        bootstrap_users = ensure_admin_bootstrap_data()
        ensure_portal_demo_data(bootstrap_users=bootstrap_users)
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class CurrentUserApiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = CurrentUserUpdateSerializer(
            data=request.data,
            context={"request": request, "user": request.user},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        user = request.user
        previous_avatar = user.avatar
        data = serializer.validated_data

        for field in ["username", "email", "first_name", "last_name", "phone"]:
            if field in data:
                setattr(user, field, data[field])

        remove_avatar = data.get("remove_avatar", False)
        avatar_file = data.get("avatar")

        if remove_avatar:
            user.avatar = None

        if avatar_file:
            avatar_item = MediaItem.objects.create(
                title=f"avatar-{user.username or user.pk}",
                alt_text=user.full_name,
                type="image",
                category="account-avatar",
                file=avatar_file,
                is_active=True,
            )
            user.avatar = avatar_item

        user.save()

        if previous_avatar and previous_avatar != user.avatar and previous_avatar.category == "account-avatar":
            previous_avatar.delete()

        return Response(UserSerializer(user, context={"request": request}).data)


class CurrentUserUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=True, max_length=150)
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    avatar = serializers.FileField(required=False)
    remove_avatar = serializers.BooleanField(required=False)

    def validate_username(self, value):
        username = value.strip()
        user = self.context["user"]
        if not username:
            raise serializers.ValidationError("Le nom d'utilisateur est requis.")
        if User.objects.filter(username__iexact=username).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est deja utilise.")
        return username

    def validate_email(self, value):
        email = value.strip().lower()
        user = self.context["user"]
        if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Un utilisateur existe deja avec cet email.")
        return email


class AdminUserWriteSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    email = serializers.EmailField()
    role = serializers.CharField(max_length=20)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True)
    is_active = serializers.BooleanField(required=False)

    def validate_email(self, value):
        email = value.strip().lower()
        user = self.context.get("user")
        qs = User.objects.filter(email__iexact=email)
        if user:
            qs = qs.exclude(pk=user.pk)
        if qs.exists():
            raise serializers.ValidationError("Un utilisateur existe deja avec cet email.")
        return email

    def validate_role(self, value):
        role = str(value or "").strip().lower()
        allowed = {choice[0] for choice in User.ROLE_CHOICES}
        if role not in allowed:
            raise serializers.ValidationError("Role invalide.")
        return role


def _paginate(request, queryset):
    try:
        page = max(1, int(request.query_params.get("page", 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        page_size = max(1, min(100, int(request.query_params.get("page_size", 20))))
    except (TypeError, ValueError):
        page_size = 20
    start = (page - 1) * page_size
    return queryset.count(), queryset[start:start + page_size]


class AdminUserListCreateApiView(APIView):
    permission_classes = [IsAuthenticated, IsFullAdminAccess]

    def get(self, request):
        queryset = User.objects.order_by("last_name", "first_name", "email")
        count, rows = _paginate(request, queryset)
        return Response({"count": count, "results": UserSerializer(rows, many=True, context={"request": request}).data})

    def post(self, request):
        serializer = AdminUserWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = User(
            username=data["email"],
            email=data["email"],
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            role=data["role"],
            phone=data.get("phone", ""),
            is_active=data.get("is_active", True),
        )
        user.set_password(data.get("password") or "emsp12345")
        user.save()
        return Response(UserSerializer(user, context={"request": request}).data, status=status.HTTP_201_CREATED)


class AdminUserDetailApiView(APIView):
    permission_classes = [IsAuthenticated, IsFullAdminAccess]

    def get_object(self, pk):
        user = User.objects.filter(pk=pk).first()
        if user is None:
            raise NotFound("Utilisateur introuvable.")
        return user

    def get(self, request, pk):
        return Response(UserSerializer(self.get_object(pk), context={"request": request}).data)

    def put(self, request, pk):
        user = self.get_object(pk)
        serializer = AdminUserWriteSerializer(data=request.data, context={"user": user})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user.username = data["email"]
        user.email = data["email"]
        user.first_name = data.get("first_name", "")
        user.last_name = data.get("last_name", "")
        user.role = data["role"]
        user.phone = data.get("phone", "")
        if "is_active" in data:
            user.is_active = data["is_active"]
        if data.get("password"):
            user.set_password(data["password"])
        user.save()
        return Response(UserSerializer(user, context={"request": request}).data)

    def patch(self, request, pk):
        user = self.get_object(pk)
        if "is_active" in request.data:
            user.is_active = bool(request.data["is_active"])
            user.save(update_fields=["is_active"])
        return Response(UserSerializer(user, context={"request": request}).data)

    def delete(self, request, pk):
        user = self.get_object(pk)
        if user.pk == request.user.pk:
            raise serializers.ValidationError({"detail": "Vous ne pouvez pas supprimer votre propre compte."})
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserResetPasswordApiView(APIView):
    permission_classes = [IsAuthenticated, IsFullAdminAccess]

    def post(self, request, pk):
        user = User.objects.filter(pk=pk).first()
        if user is None:
            raise NotFound("Utilisateur introuvable.")
        password = request.data.get("password") or "emsp12345"
        user.set_password(password)
        user.save(update_fields=["password"])
        return Response({"detail": "Mot de passe reinitialise.", "temporary_password": password})
