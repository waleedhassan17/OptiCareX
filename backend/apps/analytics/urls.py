from django.urls import path

from .views import (
    AdminSummaryView,
    ClinicianSummaryView,
    CoordinatorSummaryView,
    PlatformSummaryView,
    TechnicianSummaryView,
)

urlpatterns = [
    path("admin-summary/", AdminSummaryView.as_view(), name="admin-summary"),
    path("technician-summary/", TechnicianSummaryView.as_view(), name="technician-summary"),
    path("clinician-summary/", ClinicianSummaryView.as_view(), name="clinician-summary"),
    path("coordinator-summary/", CoordinatorSummaryView.as_view(), name="coordinator-summary"),
    path("platform-summary/", PlatformSummaryView.as_view(), name="platform-summary"),
]
