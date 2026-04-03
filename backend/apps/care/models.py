import uuid

from django.conf import settings
from django.db import models

from apps.core.models import OrgScopedModel, TimestampedModel


class Task(OrgScopedModel, TimestampedModel):
    STATUS_CHOICES = [
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        "cases.Case", on_delete=models.CASCADE, related_name="tasks"
    )
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=60, blank=True, default="")
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="assigned_tasks",
    )
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="open")
    instructions = models.TextField(blank=True, default="")
    completion_notes = models.TextField(blank=True, default="")
    completion_attachment = models.FileField(
        upload_to="care/task_attachments/", blank=True, default=""
    )
    closed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="tasks_created",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Referral(OrgScopedModel, TimestampedModel):
    URGENCY_CHOICES = [
        ("routine", "Routine"),
        ("urgent", "Urgent"),
        ("emergent", "Emergent"),
    ]
    STATUS_CHOICES = [
        ("created", "Created"),
        ("sent", "Sent"),
        ("acknowledged", "Acknowledged"),
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
        ("closed", "Closed"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        "cases.Case", on_delete=models.CASCADE, related_name="referrals"
    )
    destination = models.ForeignKey(
        "tenants.ReferralDestination",
        on_delete=models.PROTECT,
        related_name="referrals",
    )
    urgency = models.CharField(max_length=12, choices=URGENCY_CHOICES, default="routine")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="created")
    notes = models.TextField(blank=True, default="")
    attachments = models.ManyToManyField(
        "cases.CaseAttachment", blank=True, related_name="referrals"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="referrals_created",
    )
    sent_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Referral → {self.destination.name} — Case {str(self.case_id)[:8]}"


class FollowUp(OrgScopedModel, TimestampedModel):
    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("overdue", "Overdue"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        "cases.Case", on_delete=models.CASCADE, related_name="follow_ups"
    )
    referral = models.ForeignKey(
        Referral,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="follow_ups",
    )
    due_date = models.DateField()
    instructions = models.TextField(blank=True, default="")
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="scheduled")
    completed_at = models.DateTimeField(null=True, blank=True)
    completion_notes = models.TextField(blank=True, default="")
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="assigned_follow_ups",
    )
    escalation_sent = models.BooleanField(default=False)

    class Meta:
        ordering = ["due_date"]

    def __str__(self):
        return f"FollowUp {self.due_date} — Case {str(self.case_id)[:8]}"
