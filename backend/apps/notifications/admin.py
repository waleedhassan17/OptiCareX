from django.contrib import admin

from .models import NotificationLog, NotificationTemplate


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ["event_type", "channel", "org", "is_active"]
    list_filter = ["channel", "is_active"]


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ["event_type", "channel", "recipient_email", "status", "sent_at"]
    list_filter = ["status", "channel"]
