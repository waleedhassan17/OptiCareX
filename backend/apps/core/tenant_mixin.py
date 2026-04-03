class TenantQuerysetMixin:
    """
    Mixin for DRF viewsets that automatically filters querysets by the
    requesting user's organization. SuperAdmin users see all records.
    """

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        if getattr(user, "role", None) == "super_admin":
            return qs

        org_id = getattr(user, "org_id", None)
        if org_id is not None:
            return qs.filter(org_id=org_id)

        return qs.none()
