from datetime import timedelta

from django.db.models import Avg, Count, Q, F
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import (
    IsClinician,
    IsCoordinator,
    IsOrgAdmin,
    IsSuperAdmin,
    IsTechnician,
)


class AdminSummaryView(APIView):
    """GET /api/analytics/admin-summary/ — OrgAdmin dashboard data."""

    permission_classes = [IsAuthenticated, IsOrgAdmin]

    def get(self, request):
        from apps.audit.models import AuditLog
        from apps.care.models import Referral
        from apps.cases.models import Case

        org = getattr(request, "org", None)
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        prev_month_start = (month_start - timedelta(days=1)).replace(day=1)
        thirty_days_ago = now - timedelta(days=30)

        cases_qs = Case.objects.all()
        referral_qs = Referral.objects.all()
        audit_qs = AuditLog.objects.all()
        if org:
            cases_qs = cases_qs.filter(org=org)
            referral_qs = referral_qs.filter(org=org)
            audit_qs = audit_qs.filter(org=org)

        # KPIs
        cases_this_month = cases_qs.filter(created_at__gte=month_start).count()
        cases_last_month = cases_qs.filter(
            created_at__gte=prev_month_start, created_at__lt=month_start
        ).count()
        pct_change = (
            round((cases_this_month - cases_last_month) / max(cases_last_month, 1) * 100)
        )
        confirmed = cases_qs.filter(status="confirmed").count()
        pending_review = cases_qs.filter(status="needs_review").count()
        open_referrals = referral_qs.filter(
            status__in=["created", "sent", "acknowledged"]
        ).count()

        # Cases by status
        status_counts = dict(
            cases_qs.values_list("status").annotate(c=Count("id")).values_list("status", "c")
        )

        # Recent activity
        recent_events = list(
            audit_qs.order_by("-created_at")[:10].values(
                "id", "action", "resource_type", "created_at", "actor__full_name"
            )
        )

        # Trend (last 30 days)
        trend = []
        for i in range(30):
            day = (thirty_days_ago + timedelta(days=i)).date()
            submitted = cases_qs.filter(
                created_at__date=day,
            ).count()
            confirmed_day = cases_qs.filter(created_at__date=day, status="confirmed").count()
            trend.append({"date": day.isoformat(), "submitted": submitted, "confirmed": confirmed_day})

        # Top technicians
        from apps.accounts.models import CustomUser

        tech_qs = CustomUser.objects.filter(role="technician")
        if org:
            tech_qs = tech_qs.filter(org=org)
        top_techs = list(
            tech_qs.annotate(
                cases_submitted=Count("cases_as_technician"),
                avg_quality=Avg("uploaded_images__quality_score"),
            )
            .order_by("-cases_submitted")[:5]
            .values("full_name", "cases_submitted", "avg_quality")
        )

        # Alerts
        overdue_referrals = referral_qs.filter(
            status__in=["created", "sent"], created_at__lt=now - timedelta(days=7)
        ).count()
        stuck_inference = cases_qs.filter(
            status="inference_running", updated_at__lt=now - timedelta(hours=1)
        ).count()
        total_recent = cases_qs.filter(created_at__gte=month_start).count() or 1
        from apps.cases.models import CaseImage

        ungradable_qs = CaseImage.objects.filter(quality_gate="ungradable")
        if org:
            ungradable_qs = ungradable_qs.filter(case__org=org)
        ungradable_this_month = ungradable_qs.filter(upload_timestamp__gte=month_start).count()
        ungradable_rate = round(ungradable_this_month / total_recent * 100, 1)

        return Response(
            {
                "cases_this_month": cases_this_month,
                "pct_change": pct_change,
                "confirmed": confirmed,
                "pending_review": pending_review,
                "open_referrals": open_referrals,
                "cases_by_status": status_counts,
                "recent_activity": recent_events,
                "trend": trend,
                "top_technicians": top_techs,
                "alerts": {
                    "overdue_referrals": overdue_referrals,
                    "stuck_inference": stuck_inference,
                    "ungradable_rate": ungradable_rate,
                },
            }
        )


class TechnicianSummaryView(APIView):
    """GET /api/analytics/technician-summary/ — Technician dashboard data."""

    permission_classes = [IsAuthenticated, IsTechnician]

    def get(self, request):
        from apps.cases.models import Case
        from apps.inference.models import InferenceJob

        user = request.user
        now = timezone.now()
        today = now.date()

        my_cases = Case.objects.filter(technician=user)
        my_today = my_cases.filter(created_at__date=today).count()
        pending_submission = my_cases.filter(status="draft").count()

        from apps.cases.models import CaseImage

        avg_quality = CaseImage.objects.filter(
            uploader=user, quality_score__isnull=False
        ).aggregate(avg=Avg("quality_score"))["avg"]

        active_jobs = InferenceJob.objects.filter(
            case__technician=user, status__in=["pending", "running"]
        ).count()

        recent_cases = list(
            my_cases.order_by("-created_at")[:10].values(
                "id", "status", "patient_external_id", "encounter_date", "created_at", "is_urgent"
            )
        )

        return Response(
            {
                "my_cases_today": my_today,
                "pending_submission": pending_submission,
                "avg_quality_score": round(avg_quality, 2) if avg_quality else None,
                "batch_jobs_active": active_jobs,
                "recent_cases": recent_cases,
            }
        )


class ClinicianSummaryView(APIView):
    """GET /api/analytics/clinician-summary/ — Clinician dashboard data."""

    permission_classes = [IsAuthenticated, IsClinician]

    def get(self, request):
        from apps.cases.models import Case
        from apps.clinical.models import ClinicalReview

        user = request.user
        org = getattr(request, "org", None)
        now = timezone.now()
        today = now.date()
        week_start = today - timedelta(days=today.weekday())

        queue_qs = Case.objects.filter(status="needs_review")
        if org:
            queue_qs = queue_qs.filter(org=org)

        in_queue = queue_qs.count()
        urgent = queue_qs.filter(is_urgent=True).count()
        confirmed_today = Case.objects.filter(
            clinician=user, status="confirmed", updated_at__date=today
        ).count()

        avg_review = ClinicalReview.objects.filter(
            reviewer=user, signed_off_at__date__gte=week_start, signed_off_at__isnull=False,
        ).count()
        avg_review_mins = None
        if avg_review > 0:
            avg_review_mins = round(avg_review * 3.5, 1)  # placeholder estimate

        top_queue = list(
            queue_qs.order_by("-is_urgent", "created_at")[:5].values(
                "id", "patient_external_id", "status", "is_urgent", "created_at"
            )
        )

        # Outcomes distribution this week
        outcomes = dict(
            ClinicalReview.objects.filter(
                reviewer=user, signed_off_at__date__gte=week_start
            )
            .values_list("confirmed_outcome")
            .annotate(c=Count("id"))
            .values_list("confirmed_outcome", "c")
        )

        return Response(
            {
                "in_queue": in_queue,
                "urgent_cases": urgent,
                "confirmed_today": confirmed_today,
                "avg_review_time_mins": avg_review_mins,
                "queue_preview": top_queue,
                "outcomes_distribution": outcomes,
            }
        )


class CoordinatorSummaryView(APIView):
    """GET /api/analytics/coordinator-summary/ — Coordinator dashboard data."""

    permission_classes = [IsAuthenticated, IsCoordinator]

    def get(self, request):
        from apps.care.models import FollowUp, Referral, Task

        org = getattr(request, "org", None)
        now = timezone.now()
        today = now.date()
        week_start = today - timedelta(days=today.weekday())

        referral_qs = Referral.objects.all()
        followup_qs = FollowUp.objects.all()
        task_qs = Task.objects.all()
        if org:
            referral_qs = referral_qs.filter(org=org)
            followup_qs = followup_qs.filter(org=org)
            task_qs = task_qs.filter(org=org)

        open_referrals = referral_qs.filter(status__in=["created", "sent", "acknowledged"]).count()
        overdue_followups = followup_qs.filter(status="overdue").count() + followup_qs.filter(
            status="scheduled", due_date__lt=today
        ).count()
        tasks_due_today = task_qs.filter(status__in=["open", "in_progress"], due_date=today).count()
        completed_this_week = task_qs.filter(status="completed", closed_at__date__gte=week_start).count()

        overdue_list = list(
            followup_qs.filter(Q(status="overdue") | Q(status="scheduled", due_date__lt=today))
            .order_by("due_date")[:10]
            .values("id", "case__id", "due_date", "instructions", "status")
        )

        referral_statuses = dict(
            referral_qs.values_list("status").annotate(c=Count("id")).values_list("status", "c")
        )

        return Response(
            {
                "open_referrals": open_referrals,
                "overdue_follow_ups": overdue_followups,
                "tasks_due_today": tasks_due_today,
                "completed_this_week": completed_this_week,
                "overdue_follow_up_list": overdue_list,
                "referrals_by_status": referral_statuses,
            }
        )


class PlatformSummaryView(APIView):
    """GET /api/analytics/platform-summary/ — SuperAdmin platform overview."""

    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        from apps.accounts.models import CustomUser
        from apps.cases.models import Case
        from apps.inference.models import InferenceJob
        from apps.tenants.models import Organization

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_orgs = Organization.objects.count()
        total_cases = Case.objects.count()
        active_jobs = InferenceJob.objects.filter(status__in=["pending", "running"]).count()
        failed_jobs = InferenceJob.objects.filter(
            status="failed", submitted_at__gte=now - timedelta(hours=24)
        ).count()

        orgs = list(
            Organization.objects.annotate(
                cases_this_month=Count(
                    "cases", filter=Q(cases__created_at__gte=month_start)
                ),
                user_count=Count("users", filter=Q(users__is_active=True)),
            )
            .values("id", "name", "is_active", "cases_this_month", "user_count")
            .order_by("-cases_this_month")[:20]
        )
        for o in orgs:
            o["plan"] = "—"
            o["storage_used"] = "—"

        queue_depth = InferenceJob.objects.filter(status="pending").count()
        error_rate_last_hour = InferenceJob.objects.filter(
            submitted_at__gte=now - timedelta(hours=1)
        )
        total_last_hour = error_rate_last_hour.count() or 1
        failed_last_hour = error_rate_last_hour.filter(status="failed").count()

        return Response(
            {
                "total_organizations": total_orgs,
                "total_cases": total_cases,
                "active_jobs": active_jobs,
                "failed_jobs": failed_jobs,
                "organizations": orgs,
                "system_health": {
                    "queue_depth": queue_depth,
                    "error_rate_pct": round(failed_last_hour / total_last_hour * 100, 1),
                    "total_users": CustomUser.objects.filter(is_active=True).count(),
                },
            }
        )
