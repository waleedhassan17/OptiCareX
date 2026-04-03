import uuid

from django.conf import settings
from django.db import models


class ClinicalReview(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        "cases.Case", on_delete=models.CASCADE, related_name="clinical_reviews"
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reviews",
    )
    review_round = models.IntegerField(default=1)
    is_override = models.BooleanField(default=False)
    ai_outcome_before = models.CharField(max_length=120, blank=True, default="")
    confirmed_outcome = models.CharField(max_length=120)
    confidence_before = models.FloatField(null=True, blank=True)
    reason_code = models.CharField(max_length=60, blank=True, default="")
    reviewer_notes = models.TextField(blank=True, default="")
    signed_off_at = models.DateTimeField(null=True, blank=True)
    protocol_applied = models.ForeignKey(
        "tenants.Protocol",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviews_applied",
    )

    class Meta:
        ordering = ["-signed_off_at"]

    def __str__(self):
        return f"Review by {self.reviewer} — Case {str(self.case_id)[:8]}"
