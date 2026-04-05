from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.tenants.views import (
    ClinicalTaxonomyView,
    DeviceViewSet,
    OrgPlanUsageView,
    OrgSettingsView,
    OrganizationViewSet,
    ProtocolViewSet,
    ReferralDestinationViewSet,
    SiteViewSet,
)

router = DefaultRouter()
router.register(r"organizations", OrganizationViewSet, basename="organization")
router.register(r"sites", SiteViewSet, basename="site")
router.register(r"devices", DeviceViewSet, basename="device")
router.register(r"referral-destinations", ReferralDestinationViewSet, basename="referral-destination")
router.register(r"protocols", ProtocolViewSet, basename="protocol")

urlpatterns = [
    # Org settings singleton
    path("org/", OrgSettingsView.as_view(), name="org-settings"),
    path("org/plan/", OrgPlanUsageView.as_view(), name="org-plan-usage"),
    # Clinical taxonomy singleton
    path("taxonomy/", ClinicalTaxonomyView.as_view(), name="clinical-taxonomy"),
    # Router-managed CRUD
    path("", include(router.urls)),
]
