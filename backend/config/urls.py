from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from apps.accounts.views import UserViewSet, InvitationViewSet
from apps.tenants.views import (
    ClinicalTaxonomyView,
    DeviceViewSet,
    OrgPlanUsageView,
    OrgSettingsView,
    ProtocolViewSet,
    ReferralDestinationViewSet,
    SiteViewSet,
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"invitations", InvitationViewSet, basename="invitation")
router.register(r"sites", SiteViewSet, basename="site")
router.register(r"devices", DeviceViewSet, basename="device")
router.register(r"referral-destinations", ReferralDestinationViewSet, basename="referral-destination")
router.register(r"protocols", ProtocolViewSet, basename="protocol")

urlpatterns = [
    path("admin/", admin.site.urls),
    # API schema & docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # Auth
    path("api/auth/", include("apps.accounts.urls")),
    # Org settings (singleton)
    path("api/org/", OrgSettingsView.as_view(), name="org-settings"),
    path("api/org/plan/", OrgPlanUsageView.as_view(), name="org-plan-usage"),
    # Clinical taxonomy (singleton)
    path("api/taxonomy/", ClinicalTaxonomyView.as_view(), name="clinical-taxonomy"),
    # Router-managed CRUD (users, invitations, sites, devices, referrals, protocols)
    path("api/", include(router.urls)),
    # Legacy tenants prefix
    path("api/tenants/", include("apps.tenants.urls")),
    # Other apps
    path("api/cases/", include("apps.cases.urls")),
    path("api/inference/", include("apps.inference.urls")),
    path("api/clinical/", include("apps.clinical.urls")),
    path("api/care/", include("apps.care.urls")),
    path("api/portal/", include("apps.portal.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/audit/", include("apps.audit.urls")),
    path("api/billing/", include("apps.billing.urls")),
]
