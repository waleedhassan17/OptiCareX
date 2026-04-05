from .base import *  # noqa: F401,F403

DEBUG = True

# ---------------------------------------------------------------------------
# Database — local PostgreSQL or fall back to SQLite
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Override with Postgres if DATABASE_URL is set
import os

_db_url = os.environ.get("DATABASE_URL")
if _db_url:
    import re

    m = re.match(
        r"postgres(?:ql)?://(?P<user>[^:]+):(?P<password>[^@]+)@(?P<host>[^:]+):(?P<port>\d+)/(?P<name>.+)",
        _db_url,
    )
    if m:
        DATABASES["default"] = {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": m.group("name"),
            "USER": m.group("user"),
            "PASSWORD": m.group("password"),
            "HOST": m.group("host"),
            "PORT": m.group("port"),
        }

# ---------------------------------------------------------------------------
# Email — console for dev
# ---------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ---------------------------------------------------------------------------
# S3 / MinIO for local dev
# ---------------------------------------------------------------------------
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "minioadmin")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "minioadmin")
AWS_STORAGE_BUCKET_NAME = os.environ.get("S3_BUCKET", "opticarex-dev")
AWS_S3_ENDPOINT_URL = os.environ.get("AWS_S3_ENDPOINT_URL", "http://localhost:9000")
AWS_S3_REGION_NAME = os.environ.get("AWS_S3_REGION_NAME", "us-east-1")
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None

# Uncomment to use MinIO locally:
# STORAGES["default"]["BACKEND"] = "storages.backends.s3boto3.S3Boto3Storage"

# ---------------------------------------------------------------------------
# Cache — fall back to LocMemCache when Redis is not available
# ---------------------------------------------------------------------------
_redis_url = os.environ.get("REDIS_URL")
if not _redis_url:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }
    # Run Celery tasks synchronously when no broker is available
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True
