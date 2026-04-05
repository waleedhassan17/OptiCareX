from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """Allows access only to super-admin users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "superadmin"
        )


class IsOrgAdmin(BasePermission):
    """Allows access to organization administrators (+ superadmin)."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) in ("superadmin", "orgadmin")
        )


class IsOrgAdminOnly(BasePermission):
    """Allows access strictly to orgadmin role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "orgadmin"
        )


class IsTechnician(BasePermission):
    """Allows access to technicians (and above)."""

    ALLOWED_ROLES = {"superadmin", "orgadmin", "technician"}

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) in self.ALLOWED_ROLES
        )


class IsClinician(BasePermission):
    """Allows access to clinicians (and above)."""

    ALLOWED_ROLES = {"superadmin", "orgadmin", "clinician"}

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) in self.ALLOWED_ROLES
        )


class IsCoordinator(BasePermission):
    """Allows access to care coordinators (and above)."""

    ALLOWED_ROLES = {"superadmin", "orgadmin", "coordinator"}

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) in self.ALLOWED_ROLES
        )


class IsPatient(BasePermission):
    """Allows access to patients viewing their own data."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "patient"
        )
