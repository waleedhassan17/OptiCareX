from django.http import JsonResponse


class TenantMiddleware:
    """
    Runs after JWT authentication. Reads the authenticated user's org_id,
    loads the Organization, and attaches it to ``request.org``.

    SuperAdmin users get ``request.org = None`` (global access).
    Unauthenticated requests (public endpoints) also get ``request.org = None``.
    """

    PUBLIC_PREFIXES = (
        "/api/auth/login",
        "/api/auth/refresh",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/auth/invitations/accept",
        "/api/invitations/accept",
        "/api/schema",
        "/api/docs",
        "/api/redoc",
        "/admin",
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.org = None

        # Skip tenant resolution for public/unauthenticated endpoints
        if any(request.path.startswith(p) for p in self.PUBLIC_PREFIXES):
            return self.get_response(request)

        user = getattr(request, "user", None)
        if user is None or not getattr(user, "is_authenticated", False):
            return self.get_response(request)

        # SuperAdmin has global access
        if getattr(user, "role", None) == "superadmin":
            return self.get_response(request)

        org_id = getattr(user, "org_id", None)
        if org_id is None:
            return JsonResponse(
                {"detail": "Organization inactive or not found"},
                status=403,
            )

        from apps.tenants.models import Organization

        try:
            org = Organization.objects.get(id=org_id, is_active=True)
        except Organization.DoesNotExist:
            return JsonResponse(
                {"detail": "Organization inactive or not found"},
                status=403,
            )

        request.org = org
        return self.get_response(request)
