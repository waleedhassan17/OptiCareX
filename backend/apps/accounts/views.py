import secrets
import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from rest_framework import generics, serializers as drf_serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from apps.accounts.models import Invitation
from apps.accounts.serializers import (
    AcceptInvitationSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    InvitationCreateSerializer,
    InvitationListSerializer,
    LoginSerializer,
    MeSerializer,
    ResetPasswordSerializer,
    UserCreateSerializer,
    UserListSerializer,
    UserPayloadSerializer,
    UserUpdateSerializer,
)
from apps.accounts.tasks import (
    send_invitation_email,
    send_password_reset_email,
    send_welcome_email,
)
from apps.audit.models import AuditLog
from apps.core.permissions import IsOrgAdmin
from apps.core.tenant_mixin import TenantQuerysetMixin

User = get_user_model()

LOCKOUT_THRESHOLD = 5
LOCKOUT_DURATION = 900  # 15 minutes in seconds


def _get_client_ip(request):
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def _log_audit(request, action, resource_type, resource_id="", detail=None, user=None):
    AuditLog.objects.create(
        org_id=getattr(user or request.user, "org_id", None),
        actor=user if user and user.is_authenticated else (
            request.user if hasattr(request, "user") and request.user.is_authenticated else None
        ),
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        detail=detail or {},
        ip_address=_get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
    )


def _get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    # Add custom claims to JWT payload
    refresh["email"] = user.email
    refresh["role"] = user.role
    refresh["org_id"] = str(user.org_id) if user.org_id else None
    refresh["site_id"] = str(user.site_id) if user.site_id else None
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


# ═══════════════════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════


class LoginView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(ratelimit(key="ip", rate="10/m", method="POST", block=True))
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        # Check account lockout
        lockout_key = f"login_lockout:{email}"
        if cache.get(lockout_key):
            return Response(
                {"detail": "Account temporarily locked due to too many failed attempts. Try again in 15 minutes."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"detail": "Account is deactivated."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.check_password(password):
            # Track failed attempts
            fail_key = f"login_fails:{email}"
            fails = cache.get(fail_key, 0) + 1
            cache.set(fail_key, fails, timeout=LOCKOUT_DURATION)

            if fails >= LOCKOUT_THRESHOLD:
                cache.set(lockout_key, True, timeout=LOCKOUT_DURATION)
                cache.delete(fail_key)

            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Successful login — clear failed attempts
        cache.delete(f"login_fails:{email}")

        # Update last_login_at
        user.last_login_at = timezone.now()
        user.save(update_fields=["last_login_at"])

        tokens = _get_tokens_for_user(user)
        _log_audit(request, "LOGIN", "user", str(user.id), user=user)

        return Response({
            **tokens,
            "user": UserPayloadSerializer(user).data,
        })


class CustomTokenRefreshView(TokenRefreshView):
    """Standard SimpleJWT token refresh."""
    pass


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response(
                {"detail": "Invalid or already blacklisted token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        _log_audit(request, "LOGOUT", "user", str(request.user.id))
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        # Always return success to prevent email enumeration
        try:
            user = User.objects.get(email=email, is_active=True)
            token = str(uuid.uuid4())
            cache.set(f"pwd_reset:{token}", str(user.id), timeout=3600)  # 1 hour TTL
            send_password_reset_email.delay(email, token)
        except User.DoesNotExist:
            pass

        return Response({"detail": "If that email exists, a reset link has been sent."})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = str(serializer.validated_data["token"])
        cache_key = f"pwd_reset:{token}"
        user_id = cache.get(cache_key)

        if not user_id:
            return Response(
                {"detail": "Invalid or expired reset token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid or expired reset token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        cache.delete(cache_key)

        return Response({"detail": "Password has been reset successfully."})


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MeSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data["current_password"]):
            return Response(
                {"detail": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response({"detail": "Password changed successfully."})


# ═══════════════════════════════════════════════════════════════════════════
# USER MANAGEMENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════


class UserViewSet(TenantQuerysetMixin, viewsets.ModelViewSet):
    queryset = User.objects.select_related("site").all()
    filterset_fields = ["role", "site", "is_active"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_permissions(self):
        if self.action in ("list", "create"):
            return [IsOrgAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action == "partial_update":
            return UserUpdateSerializer
        return UserListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        # Non-admin users can only see their own record
        user = self.request.user
        if user.role not in ("superadmin", "orgadmin"):
            return qs.filter(id=user.id)
        return qs

    def perform_create(self, serializer):
        temp_password = secrets.token_urlsafe(12)
        user = serializer.save(
            org=self.request.org,
        )
        user.set_password(temp_password)
        user.save(update_fields=["password"])

        send_welcome_email.delay(user.email, temp_password)
        _log_audit(self.request, "USER_CREATED", "user", str(user.id), detail={"email": user.email})

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        # Non-admin users can only update their own record
        if request.user.role not in ("superadmin", "orgadmin") and obj.id != request.user.id:
            self.permission_denied(request, message="You can only update your own record.")

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        if request.user.role not in ("superadmin", "orgadmin"):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        user.is_active = False
        user.save(update_fields=["is_active"])

        # Blacklist all outstanding tokens for this user
        tokens = OutstandingToken.objects.filter(user=user)
        for token in tokens:
            BlacklistedToken.objects.get_or_create(token=token)

        _log_audit(request, "USER_DEACTIVATED", "user", str(user.id), detail={"email": user.email})
        return Response({"detail": "User deactivated."})

    @action(detail=True, methods=["post"], url_path="reactivate")
    def reactivate(self, request, pk=None):
        if request.user.role not in ("superadmin", "orgadmin"):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        user.is_active = True
        user.save(update_fields=["is_active"])

        _log_audit(request, "USER_REACTIVATED", "user", str(user.id), detail={"email": user.email})
        return Response({"detail": "User reactivated."})


# ═══════════════════════════════════════════════════════════════════════════
# INVITATION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════


class InvitationViewSet(TenantQuerysetMixin, viewsets.ModelViewSet):
    queryset = Invitation.objects.all()
    filterset_fields = ["is_accepted", "role"]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_permissions(self):
        return [IsOrgAdmin()]

    def get_serializer_class(self):
        if self.action == "create":
            return InvitationCreateSerializer
        return InvitationListSerializer

    def perform_create(self, serializer):
        from datetime import timedelta

        invitation = serializer.save(
            org=self.request.org,
            invited_by=self.request.user,
            expires_at=timezone.now() + timedelta(hours=72),
        )
        send_invitation_email.delay(invitation.email, str(invitation.token))
        _log_audit(
            self.request, "INVITATION_CREATED", "invitation",
            str(invitation.id), detail={"email": invitation.email, "role": invitation.role},
        )

    @action(detail=True, methods=["post"], url_path="resend")
    def resend(self, request, pk=None):
        from datetime import timedelta

        invitation = self.get_object()
        if invitation.is_accepted:
            return Response(
                {"detail": "Invitation already accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitation.token = uuid.uuid4()
        invitation.expires_at = timezone.now() + timedelta(hours=72)
        invitation.save(update_fields=["token", "expires_at"])

        send_invitation_email.delay(invitation.email, str(invitation.token))
        return Response({"detail": "Invitation resent."})

    def perform_destroy(self, instance):
        if instance.is_accepted:
            raise drf_serializers.ValidationError("Cannot cancel an accepted invitation.")
        _log_audit(
            self.request, "INVITATION_CANCELLED", "invitation",
            str(instance.id), detail={"email": instance.email},
        )
        instance.delete()


class AcceptInvitationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AcceptInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]

        try:
            invitation = Invitation.objects.get(token=token, is_accepted=False)
        except Invitation.DoesNotExist:
            return Response(
                {"detail": "Invalid or already used invitation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if invitation.expires_at < timezone.now():
            return Response(
                {"detail": "Invitation has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if a user with this email already exists
        if User.objects.filter(email=invitation.email).exists():
            return Response(
                {"detail": "A user with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create_user(
            email=invitation.email,
            password=serializer.validated_data["password"],
            full_name=serializer.validated_data["full_name"],
            role=invitation.role,
            org=invitation.org,
            site=invitation.site,
            invited_by=invitation.invited_by,
        )

        invitation.is_accepted = True
        invitation.save(update_fields=["is_accepted"])

        tokens = _get_tokens_for_user(user)

        _log_audit(
            request, "INVITATION_ACCEPTED", "invitation",
            str(invitation.id), detail={"email": user.email}, user=user,
        )

        return Response({
            **tokens,
            "user": UserPayloadSerializer(user).data,
        }, status=status.HTTP_201_CREATED)
