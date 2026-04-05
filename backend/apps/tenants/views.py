from itertools import groupby
from operator import attrgetter

from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.billing.models import Plan, UsageRecord
from apps.core.permissions import IsOrgAdmin
from apps.core.tenant_mixin import TenantQuerysetMixin
from apps.tenants.models import (
    ClinicalTaxonomy,
    Device,
    Organization,
    Protocol,
    ReferralDestination,
    Site,
)
from apps.tenants.serializers import (
    ClinicalTaxonomySerializer,
    DeviceCreateSerializer,
    DeviceSerializer,
    DeviceUpdateSerializer,
    OrganizationSerializer,
    OrganizationSettingsSerializer,
    OrgPlanUsageSerializer,
    ProtocolCreateSerializer,
    ProtocolSerializer,
    ReferralDestinationSerializer,
    SiteCreateSerializer,
    SiteSerializer,
)


# ═══════════════════════════════════════════════════════════════════════════
# ORGANIZATION SETTINGS — /api/org/
# ═══════════════════════════════════════════════════════════════════════════


class OrgSettingsView(generics.RetrieveUpdateAPIView):
    """GET / PATCH current org settings. OrgAdmin only."""

    serializer_class = OrganizationSettingsSerializer
    permission_classes = [IsOrgAdmin]

    def get_object(self):
        return self.request.org


class OrgPlanUsageView(generics.RetrieveAPIView):
    """GET /api/org/plan/ — returns plan limits + current usage."""

    serializer_class = OrgPlanUsageSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        org = self.request.org
        plan: Plan | None = org.plan if org else None

        # Current-month usage
        now = timezone.now()
        usage = UsageRecord.objects.filter(
            org=org,
            period_start__year=now.year,
            period_start__month=now.month,
        ).first()

        used_users = org.users.filter(is_active=True).count() if org else 0
        used_cases = usage.cases_processed if usage else 0
        used_storage = usage.storage_used_gb if usage else 0.0
        max_cases = plan.max_cases_per_month if plan else 0

        return {
            "plan_name": plan.name if plan else "No plan",
            "max_users": plan.max_users if plan else 0,
            "used_users": used_users,
            "max_storage_gb": plan.max_storage_gb if plan else 0,
            "used_storage_gb": used_storage,
            "max_cases_per_month": max_cases,
            "used_cases_this_month": used_cases,
            "percentage_used": round(
                (used_cases / max_cases * 100) if max_cases else 0, 1
            ),
        }


# ═══════════════════════════════════════════════════════════════════════════
# LEGACY READ-ONLY (kept for backward compat)
# ═══════════════════════════════════════════════════════════════════════════


class OrganizationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", None) == "superadmin":
            return Organization.objects.all()
        org_id = getattr(user, "org_id", None)
        if org_id:
            return Organization.objects.filter(id=org_id)
        return Organization.objects.none()


# ═══════════════════════════════════════════════════════════════════════════
# SITES — /api/sites/
# ═══════════════════════════════════════════════════════════════════════════


class SiteViewSet(TenantQuerysetMixin, viewsets.ModelViewSet):
    queryset = Site.objects.all()
    filterset_fields = ["is_active"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action in ("create", "partial_update", "destroy"):
            return [IsOrgAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return SiteCreateSerializer
        return SiteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Technicians see only their own site
        if user.role == "technician" and user.site_id:
            return qs.filter(id=user.site_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(org=self.request.org)

    def destroy(self, request, *args, **kwargs):
        site = self.get_object()
        # Prevent deletion if active cases exist
        if site.cases.filter(~Q(status="closed")).exists():
            return Response(
                {"detail": "Cannot delete site with active cases."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        site.is_active = False
        site.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════
# DEVICES — /api/devices/
# ═══════════════════════════════════════════════════════════════════════════


class DeviceViewSet(TenantQuerysetMixin, viewsets.ModelViewSet):
    queryset = Device.objects.select_related("site").all()
    filterset_fields = ["site", "is_active"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action in ("create", "partial_update", "destroy"):
            return [IsOrgAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return DeviceCreateSerializer
        if self.action == "partial_update":
            return DeviceUpdateSerializer
        return DeviceSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def destroy(self, request, *args, **kwargs):
        device = self.get_object()
        device.is_active = False
        device.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════════════════════
# REFERRAL DESTINATIONS — /api/referral-destinations/
# ═══════════════════════════════════════════════════════════════════════════


class ReferralDestinationViewSet(TenantQuerysetMixin, viewsets.ModelViewSet):
    queryset = ReferralDestination.objects.all()
    serializer_class = ReferralDestinationSerializer
    filterset_fields = ["specialty", "is_active"]
    search_fields = ["name", "specialty"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action in ("create", "partial_update", "destroy"):
            return [IsOrgAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(org=self.request.org)

    def destroy(self, request, *args, **kwargs):
        dest = self.get_object()
        dest.is_active = False
        dest.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="test-contact")
    def test_contact(self, request, pk=None):
        dest = self.get_object()
        if not dest.contact_email:
            return Response(
                {"detail": "No contact email configured for this destination."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        send_mail(
            subject="OptiCareX — Referral Routing Test",
            message=(
                f"This is a test message from OptiCareX to verify referral "
                f"routing for {dest.name}.\n\n"
                f"If you received this, the contact configuration is correct."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[dest.contact_email],
            fail_silently=False,
        )
        return Response({"detail": "Test email sent."})


# ═══════════════════════════════════════════════════════════════════════════
# PROTOCOLS — /api/protocols/
# ═══════════════════════════════════════════════════════════════════════════


class ProtocolViewSet(TenantQuerysetMixin, viewsets.ModelViewSet):
    queryset = Protocol.objects.all()
    filterset_fields = ["is_active", "urgency"]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_permissions(self):
        if self.action in ("create", "destroy", "new_version"):
            return [IsOrgAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return ProtocolCreateSerializer
        return ProtocolSerializer

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset()).order_by("name", "-version")
        grouped = []
        for name, protos in groupby(qs, key=attrgetter("name")):
            grouped.append({
                "name": name,
                "versions": ProtocolSerializer(list(protos), many=True).data,
            })
        return Response(grouped)

    def perform_create(self, serializer):
        serializer.save(
            org=self.request.org,
            version=1,
            created_by=self.request.user,
        )

    def destroy(self, request, *args, **kwargs):
        protocol = self.get_object()
        # Cannot deactivate if used in active cases
        if protocol.cases.filter(~Q(status="closed")).exists():
            return Response(
                {"detail": "Cannot deactivate a protocol used in active cases."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        protocol.is_active = False
        protocol.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="new-version")
    def new_version(self, request, pk=None):
        old = self.get_object()
        new_protocol = Protocol.objects.create(
            org=old.org,
            name=old.name,
            version=old.version + 1,
            severity_label=old.severity_label,
            recommended_action=old.recommended_action,
            follow_up_interval_days=old.follow_up_interval_days,
            urgency=old.urgency,
            is_active=True,
            created_by=request.user,
        )
        old.is_active = False
        old.superseded_by = new_protocol
        old.save(update_fields=["is_active", "superseded_by"])
        return Response(
            ProtocolSerializer(new_protocol).data,
            status=status.HTTP_201_CREATED,
        )


# ═══════════════════════════════════════════════════════════════════════════
# CLINICAL TAXONOMY — /api/taxonomy/
# ═══════════════════════════════════════════════════════════════════════════


class ClinicalTaxonomyView(generics.RetrieveUpdateAPIView):
    """GET / PATCH the single ClinicalTaxonomy for the org."""

    serializer_class = ClinicalTaxonomySerializer
    permission_classes = [IsOrgAdmin]

    def get_object(self):
        org = self.request.org
        taxonomy, _created = ClinicalTaxonomy.objects.get_or_create(org=org)
        return taxonomy
