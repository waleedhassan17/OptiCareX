from django.contrib import admin

from .models import ClinicalReview


@admin.register(ClinicalReview)
class ClinicalReviewAdmin(admin.ModelAdmin):
    list_display = ["case", "reviewer", "review_round", "confirmed_outcome", "is_override", "signed_off_at"]
    list_filter = ["is_override", "confirmed_outcome"]
