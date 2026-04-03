import uuid

from django.db import models


class Plan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    max_users = models.IntegerField()
    max_storage_gb = models.IntegerField()
    max_cases_per_month = models.IntegerField()
    enabled_modules = models.JSONField(default=list, blank=True)
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class UsageRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org = models.ForeignKey(
        "tenants.Organization",
        on_delete=models.CASCADE,
        related_name="usage_records",
    )
    period_start = models.DateField()
    period_end = models.DateField()
    cases_processed = models.IntegerField(default=0)
    storage_used_gb = models.FloatField(default=0)
    active_users = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-period_start"]
        unique_together = ["org", "period_start"]

    def __str__(self):
        return f"{self.org} — {self.period_start} to {self.period_end}"
