import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_welcome_email(self, email, temp_password):
    try:
        send_mail(
            subject="Welcome to OptiCareX",
            message=(
                f"Your account has been created.\n\n"
                f"Email: {email}\n"
                f"Temporary password: {temp_password}\n\n"
                f"Please log in and change your password immediately.\n"
                f"{settings.FRONTEND_URL}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as exc:
        logger.exception("Failed to send welcome email to %s", email)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_invitation_email(self, email, token):
    try:
        invite_url = f"{settings.FRONTEND_URL}/accept-invite?token={token}"
        send_mail(
            subject="You've been invited to OptiCareX",
            message=(
                f"You have been invited to join OptiCareX.\n\n"
                f"Click the link below to accept your invitation:\n"
                f"{invite_url}\n\n"
                f"This invitation expires in 72 hours."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as exc:
        logger.exception("Failed to send invitation email to %s", email)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_password_reset_email(self, email, token):
    try:
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_mail(
            subject="OptiCareX Password Reset",
            message=(
                f"A password reset was requested for your account.\n\n"
                f"Click the link below to reset your password:\n"
                f"{reset_url}\n\n"
                f"This link expires in 1 hour. If you did not request this, "
                f"please ignore this email."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as exc:
        logger.exception("Failed to send password reset email to %s", email)
        raise self.retry(exc=exc)
