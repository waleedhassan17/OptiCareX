import re

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.models import Invitation

User = get_user_model()

PASSWORD_REGEX = re.compile(
    r"^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]).{8,}$"
)
PASSWORD_ERROR = (
    "Password must be at least 8 characters with 1 uppercase letter, "
    "1 number, and 1 special character."
)


def validate_password_strength(value):
    if not PASSWORD_REGEX.match(value):
        raise serializers.ValidationError(PASSWORD_ERROR)
    return value


# ── Auth serializers ──────────────────────────────────────────────────────


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserPayloadSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "role", "org_id", "site_id", "avatar_url"]
        read_only_fields = fields


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password_strength])


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password_strength])


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "full_name", "role", "org_id", "site_id",
            "phone", "avatar_url", "last_login_at", "created_at",
        ]
        read_only_fields = ["id", "email", "role", "org_id", "site_id", "last_login_at", "created_at"]


# ── User management serializers ──────────────────────────────────────────


class UserListSerializer(serializers.ModelSerializer):
    site_name = serializers.CharField(source="site.name", default="", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "full_name", "role", "site_id", "site_name",
            "is_active", "last_login_at", "created_at",
        ]
        read_only_fields = fields


class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "full_name", "role", "site"]

    def validate_role(self, value):
        if value == "superadmin":
            raise serializers.ValidationError("Cannot create superadmin users.")
        return value


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "phone", "avatar_url", "role", "site"]
        extra_kwargs = {
            "full_name": {"required": False},
            "phone": {"required": False},
            "avatar_url": {"required": False},
            "role": {"required": False},
            "site": {"required": False},
        }


# ── Invitation serializers ───────────────────────────────────────────────


class InvitationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ["email", "role", "site"]

    def validate_role(self, value):
        if value == "superadmin":
            raise serializers.ValidationError("Cannot invite superadmin users.")
        return value


class InvitationListSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = Invitation
        fields = [
            "id", "email", "role", "site", "token", "is_accepted",
            "expires_at", "invited_by", "created_at", "status",
        ]
        read_only_fields = fields

    def get_status(self, obj):
        if obj.is_accepted:
            return "accepted"
        from django.utils import timezone
        if obj.expires_at < timezone.now():
            return "expired"
        return "pending"


class AcceptInvitationSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    full_name = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True, validators=[validate_password_strength])
