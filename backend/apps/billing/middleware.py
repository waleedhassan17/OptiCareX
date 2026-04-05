import json

from django.http import JsonResponse
from django.utils import timezone


class PlanLimitMiddleware:
    """
    Enforces billing plan limits before resource creation.

    - Before case creation (POST /api/cases/): checks monthly case limit.
    - Before user creation (POST /api/users/): checks max-user limit.

    Returns 402 if the org has exceeded its plan limits.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method != "POST":
            return self.get_response(request)

        org = getattr(request, "org", None)
        if org is None:
            return self.get_response(request)

        plan = org.plan
        if plan is None:
            return self.get_response(request)

        path = request.path

        # ── Case creation limit ───────────────────────────────────────
        if path.rstrip("/") == "/api/cases":
            from apps.billing.models import UsageRecord

            now = timezone.now()
            usage = UsageRecord.objects.filter(
                org=org,
                period_start__year=now.year,
                period_start__month=now.month,
            ).first()

            used = usage.cases_processed if usage else 0
            if used >= plan.max_cases_per_month:
                return JsonResponse(
                    {"detail": "Monthly case limit reached. Please upgrade your plan."},
                    status=402,
                )

        # ── User creation limit ───────────────────────────────────────
        if path.rstrip("/") == "/api/users":
            active_users = org.users.filter(is_active=True).count()
            if active_users >= plan.max_users:
                return JsonResponse(
                    {"detail": "User limit reached. Please upgrade your plan."},
                    status=402,
                )

        return self.get_response(request)
