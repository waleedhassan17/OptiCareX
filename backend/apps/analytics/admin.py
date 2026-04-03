from django.contrib import admin

from .models import AnalyticsSnapshot


@admin.register(AnalyticsSnapshot)
class AnalyticsSnapshotAdmin(admin.ModelAdmin):
    list_display = ["org", "period_start", "period_end", "total_cases", "avg_turnaround_hours"]
    list_filter = ["org"]
