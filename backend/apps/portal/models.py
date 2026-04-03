import uuid

from django.conf import settings
from django.db import models

from apps.core.models import OrgScopedModel, TimestampedModel


class PatientProfile(OrgScopedModel, TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_profile",
    )
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=30, blank=True, default="")
    preferred_language = models.CharField(max_length=10, default="en")
    consent_signed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Profile: {self.user.full_name}"


class PatientDocument(OrgScopedModel, TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="portal/documents/%Y/%m/")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_documents",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
