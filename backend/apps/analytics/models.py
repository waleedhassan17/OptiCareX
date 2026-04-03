import uuid

from django.db import models

from apps.core.models import OrgScopedModel


class AnalyticsSnapshot(OrgScopedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    period_start = models.DateField()
    period_end = models.DateField()
    total_cases = models.PositiveIntegerField(default=0)
    cases_by_status = models.JSONField(default=dict, blank=True)
    avg_turnaround_hours = models.FloatField(default=0)
    ai_agreement_rate = models.FloatField(default=0)
    referral_rate = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-period_start"]
        unique_together = ["org", "period_start", "period_end"]

    def __str__(self):
        return f"Analytics {self.org} {self.period_start}–{self.period_end}"
