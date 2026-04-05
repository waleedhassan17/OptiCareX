from rest_framework import serializers

from apps.tenants.models import (
    ClinicalTaxonomy,
    Device,
    Organization,
    Protocol,
    ReferralDestination,
    Site,
)


# ── Organization ──────────────────────────────────────────────────────────


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            "id", "name", "slug", "logo_url", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class OrganizationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            "id", "name", "logo_url", "contact_email", "contact_phone",
            "address", "timezone",
        ]
        read_only_fields = ["id"]


class OrgPlanUsageSerializer(serializers.Serializer):
    plan_name = serializers.CharField()
    max_users = serializers.IntegerField()
    used_users = serializers.IntegerField()
    max_storage_gb = serializers.IntegerField()
    used_storage_gb = serializers.FloatField()
    max_cases_per_month = serializers.IntegerField()
    used_cases_this_month = serializers.IntegerField()
    percentage_used = serializers.FloatField()


# ── Site ──────────────────────────────────────────────────────────────────


class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = [
            "id", "org_id", "name", "address", "timezone",
            "contact_name", "contact_email", "contact_phone",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "org_id", "created_at", "updated_at"]


class SiteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = [
            "name", "address", "timezone",
            "contact_name", "contact_email", "contact_phone",
        ]


# ── Device ────────────────────────────────────────────────────────────────


class DeviceSerializer(serializers.ModelSerializer):
    site_id = serializers.UUIDField(source="site.id", read_only=True)

    class Meta:
        model = Device
        fields = [
            "id", "site_id", "identifier", "camera_model",
            "serial_number", "capture_notes", "is_active",
            "last_used_at", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "last_used_at", "created_at", "updated_at"]


class DeviceCreateSerializer(serializers.Serializer):
    site_id = serializers.UUIDField()
    identifier = serializers.CharField(max_length=120)
    camera_model = serializers.CharField(max_length=120, required=False, default="")
    serial_number = serializers.CharField(max_length=120, required=False, default="")
    capture_notes = serializers.CharField(required=False, default="")

    def validate_site_id(self, value):
        org = self.context["request"].org
        try:
            site = Site.objects.get(id=value, org=org, is_active=True)
        except Site.DoesNotExist:
            raise serializers.ValidationError("Site not found or not active.")
        self._site = site
        return value

    def create(self, validated_data):
        validated_data.pop("site_id")
        return Device.objects.create(
            site=self._site,
            org=self._site.org,
            **validated_data,
        )


class DeviceUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ["identifier", "camera_model", "serial_number", "capture_notes"]
        extra_kwargs = {f: {"required": False} for f in fields}


# ── Referral Destination ──────────────────────────────────────────────────


class ReferralDestinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralDestination
        fields = [
            "id", "name", "specialty", "contact_name", "contact_email",
            "contact_phone", "fax", "address", "routing_notes",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ── Protocol ──────────────────────────────────────────────────────────────


class ProtocolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Protocol
        fields = [
            "id", "name", "version", "severity_label",
            "recommended_action", "follow_up_interval_days",
            "urgency", "is_active", "superseded_by",
            "created_by", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "version", "superseded_by", "created_by",
            "created_at", "updated_at",
        ]


class ProtocolCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Protocol
        fields = [
            "name", "severity_label", "recommended_action",
            "follow_up_interval_days", "urgency",
        ]


class ProtocolVersionSerializer(serializers.Serializer):
    """Read-only serializer for grouped version history."""
    name = serializers.CharField()
    versions = ProtocolSerializer(many=True)


# ── Clinical Taxonomy ─────────────────────────────────────────────────────


class ClinicalTaxonomySerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicalTaxonomy
        fields = [
            "id", "severity_labels", "ungradable_reasons",
            "dme_flags_enabled",
        ]
        read_only_fields = ["id"]
