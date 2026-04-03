import uuid

from django.conf import settings
from django.db import models

from apps.core.models import OrgScopedModel, TimestampedModel


class Case(OrgScopedModel, TimestampedModel):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("submitted", "Submitted"),
        ("inference_running", "Inference Running"),
        ("inference_complete", "Inference Complete"),
        ("needs_review", "Needs Review"),
        ("confirmed", "Confirmed"),
        ("referral_created", "Referral Created"),
        ("followup_scheduled", "Follow-Up Scheduled"),
        ("closed", "Closed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient_external_id = models.CharField(max_length=120, blank=True, default="")
    encounter_date = models.DateField()
    site = models.ForeignKey(
        "tenants.Site", on_delete=models.CASCADE, related_name="cases"
    )
    device = models.ForeignKey(
        "tenants.Device",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cases",
    )
    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="cases_as_technician",
    )
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default="draft")
    notes = models.TextField(blank=True, default="")
    protocol = models.ForeignKey(
        "tenants.Protocol",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cases",
    )
    clinician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cases_as_clinician",
    )
    is_urgent = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Case {self.id!s:.8} — {self.status}"


class CaseImage(models.Model):
    EYE_SIDE_CHOICES = [("OD", "OD — Right"), ("OS", "OS — Left")]
    QUALITY_GATE_CHOICES = [
        ("gradable", "Gradable"),
        ("borderline", "Borderline"),
        ("ungradable", "Ungradable"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="images")
    eye_side = models.CharField(max_length=2, choices=EYE_SIDE_CHOICES)
    image_original = models.FileField(upload_to="cases/images/originals/")
    image_thumbnail = models.FileField(
        upload_to="cases/images/thumbnails/", blank=True, default=""
    )
    quality_score = models.FloatField(null=True, blank=True)
    quality_gate = models.CharField(
        max_length=12, choices=QUALITY_GATE_CHOICES, blank=True, default=""
    )
    ungradable_reason = models.CharField(max_length=120, blank=True, default="")
    checksum = models.CharField(max_length=64, blank=True, default="")
    uploader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_images",
    )
    upload_timestamp = models.DateTimeField(auto_now_add=True)
    device = models.ForeignKey(
        "tenants.Device",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="captured_images",
    )
    sequence_order = models.IntegerField(default=1)

    class Meta:
        ordering = ["case", "sequence_order"]

    def __str__(self):
        return f"Image {self.eye_side} — Case {str(self.case_id)[:8]}"


class CaseTimeline(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="timeline")
    event_type = models.CharField(max_length=60)
    description = models.TextField(blank=True, default="")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="timeline_events",
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.event_type} — Case {str(self.case_id)[:8]}"


class CaseAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="cases/attachments/")
    filename = models.CharField(max_length=255)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_attachments",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.filename


class CaseComment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="case_comments",
    )
    body = models.TextField()
    is_internal = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Comment by {self.author} — Case {str(self.case_id)[:8]}"
