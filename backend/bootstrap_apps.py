"""Script to bootstrap all Django app directories."""
import os

APPS = [
    "core", "accounts", "tenants", "cases", "inference",
    "clinical", "care", "portal", "notifications",
    "analytics", "audit", "billing",
]

BASE = os.path.join(os.path.dirname(__file__), "apps")

APP_CONFIGS = {
    "core": "Core",
    "accounts": "Accounts",
    "tenants": "Tenants",
    "cases": "Cases",
    "inference": "Inference",
    "clinical": "Clinical",
    "care": "Care",
    "portal": "Portal",
    "notifications": "Notifications",
    "analytics": "Analytics",
    "audit": "Audit",
    "billing": "Billing",
}

for app in APPS:
    app_dir = os.path.join(BASE, app)
    tests_dir = os.path.join(app_dir, "tests")
    os.makedirs(tests_dir, exist_ok=True)

    # __init__.py
    init_path = os.path.join(app_dir, "__init__.py")
    if not os.path.exists(init_path):
        open(init_path, "w").close()

    # apps.py
    apps_path = os.path.join(app_dir, "apps.py")
    if not os.path.exists(apps_path):
        with open(apps_path, "w") as f:
            f.write(f'from django.apps import AppConfig\n\n\nclass {APP_CONFIGS[app]}Config(AppConfig):\n    default_auto_field = "django.db.models.BigAutoField"\n    name = "apps.{app}"\n')

    # models.py
    models_path = os.path.join(app_dir, "models.py")
    if not os.path.exists(models_path):
        with open(models_path, "w") as f:
            f.write("from django.db import models\n")

    # serializers.py
    ser_path = os.path.join(app_dir, "serializers.py")
    if not os.path.exists(ser_path):
        with open(ser_path, "w") as f:
            f.write("from rest_framework import serializers\n")

    # views.py
    views_path = os.path.join(app_dir, "views.py")
    if not os.path.exists(views_path):
        with open(views_path, "w") as f:
            f.write("from rest_framework import viewsets\n")

    # urls.py
    urls_path = os.path.join(app_dir, "urls.py")
    if not os.path.exists(urls_path):
        with open(urls_path, "w") as f:
            f.write('from django.urls import path\n\nurlpatterns = []\n')

    # admin.py
    admin_path = os.path.join(app_dir, "admin.py")
    if not os.path.exists(admin_path):
        with open(admin_path, "w") as f:
            f.write("from django.contrib import admin\n")

    # tests/__init__.py
    tests_init = os.path.join(tests_dir, "__init__.py")
    if not os.path.exists(tests_init):
        open(tests_init, "w").close()

print("All apps bootstrapped successfully!")
