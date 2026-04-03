import uuid

from django.db import models


class InferenceJob(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("running", "Running"),
        ("complete", "Complete"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        "cases.Case", on_delete=models.CASCADE, related_name="inference_jobs"
    )
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="pending")
    celery_task_id = models.CharField(max_length=255, blank=True, default="")
    submitted_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.FloatField(null=True, blank=True)
    error_reason = models.TextField(blank=True, default="")
    retry_count = models.IntegerField(default=0)
    model_version = models.CharField(max_length=60, default="v1.0")

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"Job {str(self.id)[:8]} ({self.status}) — Case {str(self.case_id)[:8]}"


class InferenceResult(models.Model):
    EYE_SIDE_CHOICES = [("OD", "OD — Right"), ("OS", "OS — Left")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(
        InferenceJob, on_delete=models.CASCADE, related_name="results"
    )
    case_image = models.ForeignKey(
        "cases.CaseImage", on_delete=models.CASCADE, related_name="inference_results"
    )
    eye_side = models.CharField(max_length=2, choices=EYE_SIDE_CHOICES)
    outcome_label = models.CharField(max_length=120)
    severity = models.CharField(max_length=60, blank=True, default="")
    confidence = models.FloatField()
    raw_output = models.JSONField(default=dict, blank=True)
    heatmap_url = models.URLField(blank=True, default="")
    model_version = models.CharField(max_length=60, default="v1.0")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.outcome_label} ({self.confidence:.0%}) — {self.eye_side}"
