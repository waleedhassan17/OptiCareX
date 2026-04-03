from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["action", "resource_type", "actor", "org", "created_at"]
    list_filter = ["action", "resource_type"]
    search_fields = ["resource_id"]
    readonly_fields = ["id", "org", "actor", "action", "resource_type", "resource_id", "detail", "ip_address", "user_agent", "created_at"]
