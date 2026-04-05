class TenantQuerysetMixin:
    """
    Mixin for DRF viewsets that automatically filters querysets by the
    requesting user's organization (set by TenantMiddleware on request.org).
    SuperAdmin users (request.org is None) see all records.
    """

    def get_queryset(self):
        qs = super().get_queryset()
        org = getattr(self.request, "org", None)

        if org is None:
            # SuperAdmin or unauthenticated — return all
            return qs

        return qs.filter(org=org)
