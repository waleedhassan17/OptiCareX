from django.contrib import admin

from .models import InferenceJob, InferenceResult


@admin.register(InferenceJob)
class InferenceJobAdmin(admin.ModelAdmin):
    list_display = ["id", "case", "status", "model_version", "submitted_at", "completed_at"]
    list_filter = ["status", "model_version"]


@admin.register(InferenceResult)
class InferenceResultAdmin(admin.ModelAdmin):
    list_display = ["id", "job", "eye_side", "outcome_label", "severity", "confidence"]
    list_filter = ["outcome_label", "severity"]
