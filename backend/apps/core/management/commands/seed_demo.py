"""
seed_demo – populates the database with realistic demo data.

Usage:
    python manage.py seed_demo          # create demo data
    python manage.py seed_demo --flush  # delete existing demo data first
"""

import random
import uuid
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import CustomUser, Invitation
from apps.analytics.models import AnalyticsSnapshot
from apps.audit.models import AuditLog
from apps.billing.models import Plan, UsageRecord
from apps.care.models import FollowUp, Referral, Task
from apps.cases.models import Case, CaseComment, CaseImage, CaseTimeline
from apps.clinical.models import ClinicalReview
from apps.inference.models import InferenceJob, InferenceResult
from apps.notifications.models import NotificationLog, NotificationTemplate
from apps.portal.models import PatientDocument, PatientProfile
from apps.tenants.models import (
    ClinicalTaxonomy,
    Device,
    Organization,
    Protocol,
    ReferralDestination,
    Site,
)

NOW = timezone.now()


class Command(BaseCommand):
    help = "Seed the database with realistic demo data for OptiCareX."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete all existing demo data before seeding.",
        )

    def handle(self, *args, **options):
        if options["flush"]:
            self.stdout.write("Flushing existing data …")
            self._flush()

        self.stdout.write("Seeding demo data …")

        plans = self._create_plans()
        orgs = self._create_orgs(plans)
        superadmin = self._create_superadmin()
        users_by_org = self._create_users(orgs)
        sites_by_org = self._create_sites(orgs)
        devices_by_org = self._create_devices(orgs, sites_by_org)
        ref_dests_by_org = self._create_referral_destinations(orgs)
        protocols_by_org = self._create_protocols(orgs, users_by_org)
        self._create_taxonomies(orgs)
        cases_by_org = self._create_cases(orgs, sites_by_org, devices_by_org, users_by_org, protocols_by_org)
        self._create_images_and_inference(cases_by_org, devices_by_org, users_by_org)
        self._create_clinical_reviews(cases_by_org, users_by_org, protocols_by_org)
        self._create_care(cases_by_org, users_by_org, ref_dests_by_org)
        self._create_notifications(orgs)
        self._create_audit_logs(orgs, users_by_org)
        self._create_analytics(orgs)
        self._create_invitations(orgs, users_by_org)
        self._create_patient_profiles(orgs, users_by_org)

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))

    # ------------------------------------------------------------------
    # Flush
    # ------------------------------------------------------------------
    def _flush(self):
        for model in [
            PatientDocument, PatientProfile, AnalyticsSnapshot,
            NotificationLog, NotificationTemplate, AuditLog,
            FollowUp, Referral, Task, ClinicalReview,
            InferenceResult, InferenceJob, CaseComment,
            CaseTimeline, CaseImage, Case,
            Invitation, CustomUser,
            ClinicalTaxonomy, Protocol, ReferralDestination,
            Device, Site, Organization,
            UsageRecord, Plan,
        ]:
            model.objects.all().delete()

    # ------------------------------------------------------------------
    # Plans
    # ------------------------------------------------------------------
    def _create_plans(self):
        plans = {}
        for name, data in {
            "Starter": {"max_users": 5, "max_storage_gb": 10, "max_cases_per_month": 100, "price_monthly": "49.00",
                         "enabled_modules": ["cases", "inference"]},
            "Professional": {"max_users": 25, "max_storage_gb": 100, "max_cases_per_month": 1000, "price_monthly": "199.00",
                             "enabled_modules": ["cases", "inference", "clinical", "care", "analytics"]},
            "Enterprise": {"max_users": 999, "max_storage_gb": 1000, "max_cases_per_month": 99999, "price_monthly": "499.00",
                           "enabled_modules": ["cases", "inference", "clinical", "care", "analytics", "portal", "audit"]},
        }.items():
            plan, _ = Plan.objects.get_or_create(name=name, defaults=data)
            plans[name] = plan
        return plans

    # ------------------------------------------------------------------
    # Organisations
    # ------------------------------------------------------------------
    def _create_orgs(self, plans):
        orgs = {}
        for name, slug, plan_key in [
            ("Bright Eye Clinic", "bright-eye", "Professional"),
            ("Metro Vision Center", "metro-vision", "Enterprise"),
        ]:
            org, _ = Organization.objects.get_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "plan": plans[plan_key],
                    "timezone": "America/New_York",
                    "contact_email": f"admin@{slug}.example.com",
                    "contact_phone": "+1-555-0100",
                    "is_active": True,
                },
            )
            orgs[slug] = org
        return orgs

    # ------------------------------------------------------------------
    # Super-admin
    # ------------------------------------------------------------------
    def _create_superadmin(self):
        user, created = CustomUser.objects.get_or_create(
            email="superadmin@opticarex.com",
            defaults={
                "full_name": "System Administrator",
                "role": "superadmin",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            user.set_password("admin1234")
            user.save()
        return user

    # ------------------------------------------------------------------
    # Users per org
    # ------------------------------------------------------------------
    def _create_users(self, orgs):
        users_by_org = {}
        user_specs = {
            "bright-eye": [
                ("orgadmin", "alice.bright@example.com", "Alice Bright"),
                ("technician", "tech1.bright@example.com", "Bob Nguyen"),
                ("technician", "tech2.bright@example.com", "Carol Smith"),
                ("clinician", "dr.jones@example.com", "Dr. Rachel Jones"),
                ("clinician", "dr.patel@example.com", "Dr. Amir Patel"),
                ("coordinator", "coord.bright@example.com", "Diana Reyes"),
                ("patient", "patient1.bright@example.com", "Edward Miller"),
                ("patient", "patient2.bright@example.com", "Fiona Chen"),
            ],
            "metro-vision": [
                ("orgadmin", "admin.metro@example.com", "Marcus Lee"),
                ("technician", "tech1.metro@example.com", "Nadia Koval"),
                ("technician", "tech2.metro@example.com", "Oscar Park"),
                ("clinician", "dr.williams@example.com", "Dr. Sarah Williams"),
                ("clinician", "dr.kim@example.com", "Dr. Jin Kim"),
                ("coordinator", "coord.metro@example.com", "Priya Singh"),
                ("patient", "patient1.metro@example.com", "Quinn Torres"),
                ("patient", "patient2.metro@example.com", "Rosa Delgado"),
            ],
        }
        for slug, org in orgs.items():
            org_users = []
            for role, email, name in user_specs.get(slug, []):
                user, created = CustomUser.objects.get_or_create(
                    email=email,
                    defaults={
                        "full_name": name,
                        "role": role,
                        "org": org,
                        "is_staff": role == "orgadmin",
                    },
                )
                if created:
                    user.set_password("demo1234")
                    user.save()
                org_users.append(user)
            users_by_org[slug] = org_users
        return users_by_org

    # ------------------------------------------------------------------
    # Sites
    # ------------------------------------------------------------------
    def _create_sites(self, orgs):
        sites_by_org = {}
        specs = {
            "bright-eye": [
                ("Bright Eye – Downtown", "123 Main St, Springfield"),
                ("Bright Eye – Westside", "456 Oak Ave, Springfield"),
            ],
            "metro-vision": [
                ("Metro Vision HQ", "789 Broadway, Metropolis"),
                ("Metro Vision – North", "321 Elm St, Metropolis"),
            ],
        }
        for slug, org in orgs.items():
            sites = []
            for name, address in specs.get(slug, []):
                site, _ = Site.objects.get_or_create(
                    org=org, name=name, defaults={"address": address, "is_active": True},
                )
                sites.append(site)
            sites_by_org[slug] = sites
        return sites_by_org

    # ------------------------------------------------------------------
    # Devices
    # ------------------------------------------------------------------
    def _create_devices(self, orgs, sites_by_org):
        devices_by_org = {}
        cameras = [
            ("Topcon NW400", "NW400"),
            ("Canon CR-2 AF", "CR2AF"),
            ("Optomed Aurora", "AURORA"),
        ]
        for slug, org in orgs.items():
            devs = []
            for i, site in enumerate(sites_by_org.get(slug, [])):
                model, prefix = cameras[i % len(cameras)]
                dev, _ = Device.objects.get_or_create(
                    org=org,
                    identifier=f"{prefix}-{slug[:3].upper()}-{i+1:03d}",
                    defaults={
                        "site": site,
                        "camera_model": model,
                        "serial_number": f"SN-{uuid.uuid4().hex[:8].upper()}",
                        "is_active": True,
                    },
                )
                devs.append(dev)
            devices_by_org[slug] = devs
        return devices_by_org

    # ------------------------------------------------------------------
    # Referral Destinations
    # ------------------------------------------------------------------
    def _create_referral_destinations(self, orgs):
        ref_dests_by_org = {}
        for slug, org in orgs.items():
            dests = []
            for name, specialty in [
                ("City Eye Hospital", "Retina"),
                ("Regional Ophthalmology", "General Ophthalmology"),
            ]:
                dest, _ = ReferralDestination.objects.get_or_create(
                    org=org, name=name,
                    defaults={
                        "specialty": specialty,
                        "contact_email": f"referrals@{name.lower().replace(' ', '')}.example.com",
                        "contact_phone": "+1-555-0200",
                    },
                )
                dests.append(dest)
            ref_dests_by_org[slug] = dests
        return ref_dests_by_org

    # ------------------------------------------------------------------
    # Protocols
    # ------------------------------------------------------------------
    def _create_protocols(self, orgs, users_by_org):
        protocols_by_org = {}
        for slug, org in orgs.items():
            admins = [u for u in users_by_org.get(slug, []) if u.role == "orgadmin"]
            creator = admins[0] if admins else None
            protos = []
            for name, severity, urgency, action, interval in [
                ("Mild NPDR Protocol", "mild", "routine", "Schedule follow-up in 12 months", 365),
                ("Moderate NPDR Protocol", "moderate", "routine", "Refer to ophthalmologist within 3 months", 90),
                ("Severe NPDR Protocol", "severe", "urgent", "Urgent referral within 2 weeks", 14),
                ("PDR Protocol", "proliferative", "emergent", "Immediate retina specialist referral", 7),
            ]:
                proto, _ = Protocol.objects.get_or_create(
                    org=org, name=name,
                    defaults={
                        "version": 1,
                        "severity_label": severity,
                        "urgency": urgency,
                        "recommended_action": action,
                        "follow_up_interval_days": interval,
                        "created_by": creator,
                    },
                )
                protos.append(proto)
            protocols_by_org[slug] = protos
        return protocols_by_org

    # ------------------------------------------------------------------
    # Clinical Taxonomies
    # ------------------------------------------------------------------
    def _create_taxonomies(self, orgs):
        for slug, org in orgs.items():
            ClinicalTaxonomy.objects.get_or_create(
                org=org,
                defaults={
                    "severity_labels": ["none", "mild", "moderate", "severe", "proliferative"],
                    "dme_flags_enabled": True,
                    "ungradable_reasons": ["poor_quality", "media_opacity", "small_pupil", "patient_motion"],
                },
            )

    # ------------------------------------------------------------------
    # Cases (20 per org)
    # ------------------------------------------------------------------
    def _create_cases(self, orgs, sites_by_org, devices_by_org, users_by_org, protocols_by_org):
        statuses = [
            "new", "new", "imaging_complete", "imaging_complete",
            "ai_analysed", "ai_analysed", "in_review", "in_review",
            "reviewed", "reviewed", "referred", "follow_up_scheduled",
            "follow_up_scheduled", "closed", "closed", "closed",
            "new", "ai_analysed", "in_review", "closed",
        ]
        cases_by_org = {}
        for slug, org in orgs.items():
            techs = [u for u in users_by_org.get(slug, []) if u.role == "technician"]
            clinicians = [u for u in users_by_org.get(slug, []) if u.role == "clinician"]
            sites = sites_by_org.get(slug, [])
            devices = devices_by_org.get(slug, [])
            protocols = protocols_by_org.get(slug, [])
            cases = []
            for i in range(20):
                case, created = Case.objects.get_or_create(
                    org=org,
                    patient_external_id=f"PID-{slug[:3].upper()}-{i+1:04d}",
                    defaults={
                        "encounter_date": (NOW - timedelta(days=random.randint(1, 90))).date(),
                        "site": random.choice(sites) if sites else None,
                        "device": random.choice(devices) if devices else None,
                        "technician": random.choice(techs) if techs else None,
                        "status": statuses[i],
                        "protocol": random.choice(protocols) if protocols else None,
                        "clinician": random.choice(clinicians) if clinicians else None,
                        "is_urgent": i % 7 == 0,
                        "notes": f"Demo case #{i+1} for {org.name}.",
                    },
                )
                if created:
                    CaseTimeline.objects.create(
                        case=case,
                        event_type="created",
                        description="Case created via seed_demo",
                        actor=random.choice(techs) if techs else None,
                    )
                cases.append(case)
            cases_by_org[slug] = cases
        return cases_by_org

    # ------------------------------------------------------------------
    # Images + Inference
    # ------------------------------------------------------------------
    def _create_images_and_inference(self, cases_by_org, devices_by_org, users_by_org):
        outcomes = ["no_dr", "mild_npdr", "moderate_npdr", "severe_npdr", "pdr"]
        severities = ["none", "mild", "moderate", "severe", "proliferative"]

        for slug, cases in cases_by_org.items():
            techs = [u for u in users_by_org.get(slug, []) if u.role == "technician"]
            devices = devices_by_org.get(slug, [])
            for case in cases:
                if case.status == "new":
                    continue
                for idx, eye in enumerate(["OD", "OS"]):
                    img, img_created = CaseImage.objects.get_or_create(
                        case=case, eye_side=eye, sequence_order=idx,
                        defaults={
                            "quality_score": round(random.uniform(0.6, 1.0), 2),
                            "quality_gate": random.choices(["gradable", "borderline", "ungradable"], weights=[80, 15, 5])[0],
                            "checksum": uuid.uuid4().hex,
                            "uploader": random.choice(techs) if techs else None,
                            "upload_timestamp": NOW - timedelta(hours=random.randint(1, 200)),
                            "device": random.choice(devices) if devices else None,
                        },
                    )

                # Inference for cases that have been analysed
                if case.status in ("ai_analysed", "in_review", "reviewed", "referred", "follow_up_scheduled", "closed"):
                    outcome_idx = random.randint(0, 4)
                    job, job_created = InferenceJob.objects.get_or_create(
                        case=case,
                        defaults={
                            "status": "complete",
                            "submitted_at": NOW - timedelta(hours=random.randint(1, 100)),
                            "completed_at": NOW - timedelta(hours=random.randint(0, 50)),
                            "duration_seconds": round(random.uniform(1.5, 12.0), 2),
                            "model_version": "retina-v2.1",
                        },
                    )
                    if job_created:
                        images = CaseImage.objects.filter(case=case)
                        for img in images:
                            InferenceResult.objects.get_or_create(
                                job=job, case_image=img,
                                defaults={
                                    "eye_side": img.eye_side,
                                    "outcome_label": outcomes[outcome_idx],
                                    "severity": severities[outcome_idx],
                                    "confidence": round(random.uniform(0.7, 0.99), 3),
                                    "raw_output": {"scores": {o: round(random.uniform(0, 1), 3) for o in outcomes}},
                                    "model_version": "retina-v2.1",
                                },
                            )

    # ------------------------------------------------------------------
    # Clinical Reviews
    # ------------------------------------------------------------------
    def _create_clinical_reviews(self, cases_by_org, users_by_org, protocols_by_org):
        for slug, cases in cases_by_org.items():
            clinicians = [u for u in users_by_org.get(slug, []) if u.role == "clinician"]
            protocols = protocols_by_org.get(slug, [])
            for case in cases:
                if case.status in ("reviewed", "referred", "follow_up_scheduled", "closed"):
                    ClinicalReview.objects.get_or_create(
                        case=case, review_round=1,
                        defaults={
                            "reviewer": random.choice(clinicians) if clinicians else None,
                            "is_override": random.random() < 0.15,
                            "ai_outcome_before": "moderate_npdr",
                            "confirmed_outcome": random.choice(["mild_npdr", "moderate_npdr", "severe_npdr"]),
                            "confidence_before": round(random.uniform(0.7, 0.95), 3),
                            "reason_code": random.choice(["agree", "disagree_severity", "disagree_outcome"]),
                            "reviewer_notes": "Reviewed per standard protocol.",
                            "signed_off_at": NOW - timedelta(hours=random.randint(1, 48)),
                            "protocol_applied": random.choice(protocols) if protocols else None,
                        },
                    )

    # ------------------------------------------------------------------
    # Care: Tasks, Referrals, Follow-ups
    # ------------------------------------------------------------------
    def _create_care(self, cases_by_org, users_by_org, ref_dests_by_org):
        for slug, cases in cases_by_org.items():
            coordinators = [u for u in users_by_org.get(slug, []) if u.role == "coordinator"]
            techs = [u for u in users_by_org.get(slug, []) if u.role == "technician"]
            dests = ref_dests_by_org.get(slug, [])
            for case in cases:
                # Tasks for certain statuses
                if case.status in ("in_review", "reviewed", "referred", "follow_up_scheduled", "closed"):
                    Task.objects.get_or_create(
                        case=case, title=f"Review follow-up for {case.patient_external_id}",
                        defaults={
                            "org": case.org,
                            "category": random.choice(["review", "imaging", "admin"]),
                            "assigned_to": random.choice(coordinators) if coordinators else None,
                            "due_date": (NOW + timedelta(days=random.randint(1, 30))).date(),
                            "status": "open" if case.status != "closed" else "completed",
                            "instructions": "Please complete as per protocol.",
                            "created_by": random.choice(techs) if techs else None,
                        },
                    )

                # Referrals
                if case.status in ("referred", "closed"):
                    Referral.objects.get_or_create(
                        case=case, destination=random.choice(dests) if dests else None,
                        defaults={
                            "org": case.org,
                            "urgency": random.choice(["routine", "urgent", "emergent"]),
                            "status": "sent" if case.status == "referred" else "completed",
                            "notes": "Referral generated by seed_demo.",
                            "created_by": random.choice(coordinators) if coordinators else None,
                            "sent_at": NOW - timedelta(days=random.randint(1, 14)),
                        },
                    )

                # Follow-ups
                if case.status in ("follow_up_scheduled", "closed"):
                    FollowUp.objects.get_or_create(
                        case=case,
                        defaults={
                            "org": case.org,
                            "due_date": (NOW + timedelta(days=random.randint(7, 90))).date(),
                            "instructions": "Schedule follow-up per protocol.",
                            "status": "scheduled" if case.status == "follow_up_scheduled" else "completed",
                            "assigned_to": random.choice(coordinators) if coordinators else None,
                            "completed_at": NOW if case.status == "closed" else None,
                        },
                    )

    # ------------------------------------------------------------------
    # Notifications
    # ------------------------------------------------------------------
    def _create_notifications(self, orgs):
        templates = [
            ("case_created", "email", "New Case Created", "A new case {{case_id}} has been created."),
            ("referral_sent", "email", "Referral Sent", "Referral for case {{case_id}} sent to {{destination}}."),
            ("review_complete", "sms", "", "Review complete for case {{case_id}}. Outcome: {{outcome}}."),
        ]
        for slug, org in orgs.items():
            for event_type, channel, subject, body in templates:
                tpl, _ = NotificationTemplate.objects.get_or_create(
                    org=org, event_type=event_type, channel=channel,
                    defaults={"subject": subject, "body_template": body, "is_active": True},
                )
            # A few log entries
            for i in range(5):
                NotificationLog.objects.get_or_create(
                    org=org,
                    event_type=templates[i % len(templates)][0],
                    channel=templates[i % len(templates)][1],
                    recipient_email=f"user{i}@example.com",
                    defaults={
                        "status": random.choice(["sent", "delivered"]),
                        "sent_at": NOW - timedelta(hours=random.randint(1, 72)),
                    },
                )

    # ------------------------------------------------------------------
    # Audit Logs (30 per org)
    # ------------------------------------------------------------------
    def _create_audit_logs(self, orgs, users_by_org):
        actions = ["create", "update", "delete", "login", "export"]
        resources = ["Case", "CaseImage", "User", "Referral", "Protocol"]
        for slug, org in orgs.items():
            users = users_by_org.get(slug, [])
            existing = AuditLog.objects.filter(org=org).count()
            to_create = max(0, 30 - existing)
            for i in range(to_create):
                AuditLog.objects.create(
                    org=org,
                    actor=random.choice(users) if users else None,
                    action=random.choice(actions),
                    resource_type=random.choice(resources),
                    resource_id=str(uuid.uuid4()),
                    detail={"demo": True, "index": i},
                    ip_address="192.168.1.{}".format(random.randint(1, 254)),
                    user_agent="seed_demo/1.0",
                )

    # ------------------------------------------------------------------
    # Analytics Snapshots
    # ------------------------------------------------------------------
    def _create_analytics(self, orgs):
        for slug, org in orgs.items():
            for months_ago in range(3):
                start = (NOW - timedelta(days=30 * (months_ago + 1))).date()
                end = (NOW - timedelta(days=30 * months_ago)).date()
                AnalyticsSnapshot.objects.get_or_create(
                    org=org, period_start=start, period_end=end,
                    defaults={
                        "total_cases": random.randint(50, 200),
                        "cases_by_status": {"new": 10, "reviewed": 40, "closed": 30},
                        "avg_turnaround_hours": round(random.uniform(4, 48), 1),
                        "ai_agreement_rate": round(random.uniform(0.80, 0.98), 3),
                        "referral_rate": round(random.uniform(0.05, 0.25), 3),
                    },
                )

    # ------------------------------------------------------------------
    # Invitations
    # ------------------------------------------------------------------
    def _create_invitations(self, orgs, users_by_org):
        for slug, org in orgs.items():
            admins = [u for u in users_by_org.get(slug, []) if u.role == "orgadmin"]
            for i in range(2):
                Invitation.objects.get_or_create(
                    email=f"invite{i+1}.{slug}@example.com",
                    defaults={
                        "role": "technician",
                        "org": org,
                        "expires_at": NOW + timedelta(days=7),
                        "invited_by": admins[0] if admins else None,
                    },
                )

    # ------------------------------------------------------------------
    # Patient Profiles
    # ------------------------------------------------------------------
    def _create_patient_profiles(self, orgs, users_by_org):
        from datetime import date

        for slug, org in orgs.items():
            patients = [u for u in users_by_org.get(slug, []) if u.role == "patient"]
            for i, patient in enumerate(patients):
                PatientProfile.objects.get_or_create(
                    user=patient,
                    defaults={
                        "org": org,
                        "date_of_birth": date(1960 + i * 10, 3, 15),
                        "phone": f"+1-555-0{300 + i}",
                        "preferred_language": "en",
                        "consent_signed_at": NOW - timedelta(days=random.randint(30, 365)),
                    },
                )
