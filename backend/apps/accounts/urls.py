from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.accounts.views import (
    AcceptInvitationView,
    ChangePasswordView,
    CustomTokenRefreshView,
    ForgotPasswordView,
    InvitationViewSet,
    LoginView,
    LogoutView,
    MeView,
    ResetPasswordView,
    UserViewSet,
)

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"invitations", InvitationViewSet, basename="invitation")

urlpatterns = [
    # Auth endpoints
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", CustomTokenRefreshView.as_view(), name="auth-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="auth-forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="auth-reset-password"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    # Public invitation accept
    path("invitations/accept/", AcceptInvitationView.as_view(), name="invitation-accept"),
]
