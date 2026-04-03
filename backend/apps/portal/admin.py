from django.contrib import admin

from .models import PatientDocument, PatientProfile


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "org", "date_of_birth", "preferred_language"]
    list_filter = ["preferred_language"]


@admin.register(PatientDocument)
class PatientDocumentAdmin(admin.ModelAdmin):
    list_display = ["title", "patient", "uploaded_by", "created_at"]
