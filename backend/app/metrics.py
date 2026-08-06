from typing import Any, Final

from prometheus_client import Counter, Gauge, Histogram
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import (
    Appointment,
    Doctor,
    Document,
    MedicalRecord,
    Patient,
    Prescription,
    User,
)


HTTP_REQUESTS: Final = Counter(
    "mediflow_http_requests_total",
    "Total HTTP requests processed by MediFlow",
    ["method", "path", "status"],
)

HTTP_LATENCY: Final = Histogram(
    "mediflow_http_request_seconds",
    "HTTP request latency in seconds",
    ["path"],
)

USERS_TOTAL: Final = Gauge(
    "mediflow_users_total",
    "Total number of registered users",
)

PATIENTS_TOTAL: Final = Gauge(
    "mediflow_patients_total",
    "Total number of registered patients",
)

DOCTORS_TOTAL: Final = Gauge(
    "mediflow_doctors_total",
    "Total number of registered doctors",
)

APPOINTMENTS_TOTAL: Final = Gauge(
    "mediflow_appointments_total",
    "Total appointments grouped by status",
    ["status"],
)

MEDICAL_RECORDS_TOTAL: Final = Gauge(
    "mediflow_medical_records_total",
    "Total number of medical records",
)

PRESCRIPTIONS_TOTAL: Final = Gauge(
    "mediflow_prescriptions_total",
    "Total number of prescription items",
)

DOCUMENTS_TOTAL: Final = Gauge(
    "mediflow_documents_total",
    "Total number of uploaded documents",
)

LOGIN_ATTEMPTS_TOTAL: Final = Counter(
    "mediflow_login_attempts_total",
    "Login attempts grouped by result",
    ["result"],
)

DOCUMENT_UPLOADS_TOTAL: Final = Counter(
    "mediflow_document_uploads_total",
    "Successfully uploaded documents",
)

CONSULTATIONS_COMPLETED_TOTAL: Final = Counter(
    "mediflow_consultations_completed_total",
    "Consultations completed successfully",
)

AI_SUMMARY_REQUESTS_TOTAL: Final = Counter(
    "mediflow_ai_summary_requests_total",
    "AI summary requests grouped by result",
    ["result"],
)

APPOINTMENT_STATUSES: Final = (
    "booked",
    "confirmed",
    "completed",
    "cancelled",
)


def scalar_count(
    db: Session,
    model: type[Any],
) -> int:
    value = db.scalar(
        select(func.count()).select_from(model)
    )
    return int(value or 0)


def refresh_business_metrics(db: Session) -> None:
    USERS_TOTAL.set(scalar_count(db, User))
    PATIENTS_TOTAL.set(scalar_count(db, Patient))
    DOCTORS_TOTAL.set(scalar_count(db, Doctor))
    MEDICAL_RECORDS_TOTAL.set(
        scalar_count(db, MedicalRecord)
    )
    PRESCRIPTIONS_TOTAL.set(
        scalar_count(db, Prescription)
    )
    DOCUMENTS_TOTAL.set(
        scalar_count(db, Document)
    )

    for status in APPOINTMENT_STATUSES:
        APPOINTMENTS_TOTAL.labels(
            status=status
        ).set(0)

    status_rows = db.execute(
        select(
            Appointment.status,
            func.count(Appointment.id),
        ).group_by(Appointment.status)
    ).all()

    for status, count in status_rows:
        APPOINTMENTS_TOTAL.labels(
            status=str(status)
        ).set(int(count))