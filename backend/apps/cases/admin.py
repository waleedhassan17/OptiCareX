from django.contrib import admin

from .models import Case, CaseAttachment, CaseComment, CaseImage, CaseTimeline


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ["id", "patient_external_id", "status", "site", "is_urgent", "created_at"]
    list_filter = ["status", "is_urgent", "org"]
    search_fields = ["patient_external_id"]


@admin.register(CaseImage)
class CaseImageAdmin(admin.ModelAdmin):
    list_display = ["id", "case", "eye_side", "quality_gate", "upload_timestamp"]
    list_filter = ["eye_side", "quality_gate"]


@admin.register(CaseTimeline)
class CaseTimelineAdmin(admin.ModelAdmin):
    list_display = ["case", "event_type", "actor", "created_at"]
    list_filter = ["event_type"]


@admin.register(CaseAttachment)
class CaseAttachmentAdmin(admin.ModelAdmin):
    list_display = ["filename", "case", "uploaded_by", "created_at"]


@admin.register(CaseComment)
class CaseCommentAdmin(admin.ModelAdmin):
    list_display = ["case", "author", "is_internal", "created_at"]
    list_filter = ["is_internal"]
