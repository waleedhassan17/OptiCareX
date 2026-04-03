from django.contrib import admin

from .models import ClinicalTaxonomy, Device, Organization, Protocol, ReferralDestination, Site


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "plan", "is_active", "created_at"]
    list_filter = ["is_active", "plan"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = ["name", "org", "is_active"]
    list_filter = ["org", "is_active"]


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ["identifier", "site", "camera_model", "is_active"]
    list_filter = ["is_active", "site"]


@admin.register(ReferralDestination)
class ReferralDestinationAdmin(admin.ModelAdmin):
    list_display = ["name", "specialty", "org"]
    list_filter = ["org"]


@admin.register(Protocol)
class ProtocolAdmin(admin.ModelAdmin):
    list_display = ["name", "version", "severity_label", "urgency", "org"]
    list_filter = ["urgency", "org"]


@admin.register(ClinicalTaxonomy)
class ClinicalTaxonomyAdmin(admin.ModelAdmin):
    list_display = ["org", "dme_flags_enabled"]
    list_filter = ["dme_flags_enabled"]
