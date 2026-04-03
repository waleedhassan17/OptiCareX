from django.contrib import admin

from .models import Plan, UsageRecord


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ["name", "price_monthly", "max_users", "max_cases_per_month", "is_active"]
    list_filter = ["is_active"]


@admin.register(UsageRecord)
class UsageRecordAdmin(admin.ModelAdmin):
    list_display = ["org", "period_start", "period_end", "cases_processed", "active_users"]
    list_filter = ["org"]
