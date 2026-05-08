from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone",
            "is_active",
            "avatar_url",
        ]

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if obj.avatar and obj.avatar.file and request:
            return request.build_absolute_uri(obj.avatar.file.url)
        if obj.avatar and obj.avatar.file:
            return obj.avatar.file.url
        return ""


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        password = attrs["password"]
        user = User.objects.filter(email__iexact=email).first()

        if not user or not user.check_password(password):
            raise serializers.ValidationError({"detail": "Identifiants invalides."})

        if not user.is_active:
            raise serializers.ValidationError({"detail": "Votre compte est inactif."})

        refresh = RefreshToken.for_user(user)
        request = self.context.get("request")

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user, context={"request": request}).data,
        }
