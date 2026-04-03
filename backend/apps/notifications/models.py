import uuid

from django.db import models

from apps.core.models import OrgScopedModel, TimestampedModel


class NotificationTemplate(OrgScopedModel, TimestampedModel):
    CHANNEL_CHOICES = [("email", "Email"), ("sms", "SMS")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=60)
    channel = models.CharField(max_length=8, choices=CHANNEL_CHOICES)
    subject = models.CharField(max_length=255, blank=True, default="")
    body_template = models.TextField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["event_type"]
        unique_together = ["org", "event_type", "channel"]

    def __str__(self):
        return f"{self.event_type} ({self.channel})"


class NotificationLog(models.Model):
    STATUS_CHOICES = [
        ("queued", "Queued"),
        ("sent", "Sent"),
        ("failed", "Failed"),
        ("delivered", "Delivered"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org = models.ForeignKey(
        "tenants.Organization",
        on_delete=models.CASCADE,
        related_name="notification_logs",
    )
    event_type = models.CharField(max_length=60)
    channel = models.CharField(max_length=8)
    recipient_email = models.EmailField(blank=True, default="")
    recipient_phone = models.CharField(max_length=30, blank=True, default="")
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="queued")
    sent_at = models.DateTimeField(null=True, blank=True)
    delivery_status = models.CharField(max_length=60, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-sent_at"]

    def __str__(self):
        return f"{self.event_type} → {self.recipient_email or self.recipient_phone}"
