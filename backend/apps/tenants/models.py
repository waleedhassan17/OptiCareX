import uuid

from django.conf import settings
from django.db import models

from apps.core.models import OrgScopedModel, TimestampedModel


class Organization(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True)
    logo_url = models.URLField(blank=True, default="")
    timezone = models.CharField(max_length=50, default="UTC")
    plan = models.ForeignKey(
        "billing.Plan",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="organizations",
    )
    is_active = models.BooleanField(default=True)
    contact_email = models.EmailField(blank=True, default="")
    contact_phone = models.CharField(max_length=30, blank=True, default="")
    address = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Site(OrgScopedModel, TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, default="")
    timezone = models.CharField(max_length=50, default="UTC")
    contact_name = models.CharField(max_length=255, blank=True, default="")
    contact_email = models.EmailField(blank=True, default="")
    contact_phone = models.CharField(max_length=30, blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.org.name})"


class Device(OrgScopedModel, TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name="devices")
    identifier = models.CharField(max_length=120)
    camera_model = models.CharField(max_length=120, blank=True, default="")
    serial_number = models.CharField(max_length=120, blank=True, default="")
    capture_notes = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["identifier"]

    def __str__(self):
        return f"{self.identifier} @ {self.site.name}"


class ReferralDestination(OrgScopedModel, TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    specialty = models.CharField(max_length=120, blank=True, default="")
    contact_name = models.CharField(max_length=255, blank=True, default="")
    contact_email = models.EmailField(blank=True, default="")
    contact_phone = models.CharField(max_length=30, blank=True, default="")
    fax = models.CharField(max_length=30, blank=True, default="")
    address = models.TextField(blank=True, default="")
    routing_notes = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Protocol(OrgScopedModel, TimestampedModel):
    URGENCY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    version = models.IntegerField(default=1)
    severity_label = models.CharField(max_length=60, blank=True, default="")
    recommended_action = models.TextField(blank=True, default="")
    follow_up_interval_days = models.IntegerField(null=True, blank=True)
    urgency = models.CharField(max_length=10, choices=URGENCY_CHOICES, default="medium")
    is_active = models.BooleanField(default=True)
    superseded_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supersedes",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="protocols_created",
    )

    class Meta:
        ordering = ["name", "-version"]

    def __str__(self):
        return f"{self.name} v{self.version}"


class ClinicalTaxonomy(OrgScopedModel, TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    severity_labels = models.JSONField(default=list, blank=True)
    dme_flags_enabled = models.BooleanField(default=False)
    ungradable_reasons = models.JSONField(default=list, blank=True)

    class Meta:
        verbose_name_plural = "clinical taxonomies"

    def __str__(self):
        return f"Taxonomy for {self.org.name}"
