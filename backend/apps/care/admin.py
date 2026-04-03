from django.contrib import admin

from .models import FollowUp, Referral, Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "status", "assigned_to", "due_date"]
    list_filter = ["status", "category"]


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ["case", "destination", "urgency", "status", "created_at"]
    list_filter = ["status", "urgency"]


@admin.register(FollowUp)
class FollowUpAdmin(admin.ModelAdmin):
    list_display = ["case", "due_date", "status", "assigned_to"]
    list_filter = ["status"]
