import json
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


class AuditMiddleware:
    """Logs every mutating HTTP request (POST, PUT, PATCH, DELETE)."""

    MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.method in self.MUTATING_METHODS:
            self._log_request(request, response)

        return response

    def _get_client_ip(self, request):
        x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded:
            return x_forwarded.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "")

    def _log_request(self, request, response):
        user = request.user if hasattr(request, "user") and request.user.is_authenticated else None

        log_data = {
            "user_id": user.pk if user else None,
            "user_email": getattr(user, "email", None),
            "org_id": getattr(user, "org_id", None),
            "method": request.method,
            "endpoint": request.get_full_path(),
            "status_code": response.status_code,
            "ip_address": self._get_client_ip(request),
            "timestamp": timezone.now().isoformat(),
        }

        logger.info("AUDIT: %s", json.dumps(log_data, default=str))

        # Persist to AuditLog model if available
        try:
            from apps.audit.models import AuditLog

            if hasattr(AuditLog, "objects"):
                AuditLog.objects.create(
                    user=user,
                    org_id=getattr(user, "org_id", None),
                    method=request.method,
                    endpoint=request.get_full_path(),
                    status_code=response.status_code,
                    ip_address=self._get_client_ip(request),
                )
        except Exception:
            # Model might not be migrated yet during initial setup
            pass
