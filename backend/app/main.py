from datetime import datetime
from time import perf_counter
from uuid import uuid4

import redis
from fastapi import (
    Depends,
    FastAPI,
    File,
    HTTPException,
    Request,
    Response,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .logging_config import configure_logging
from .metrics import (
    AI_SUMMARY_REQUESTS_TOTAL,
    CONSULTATIONS_COMPLETED_TOTAL,
    DOCUMENT_UPLOADS_TOTAL,
    HTTP_LATENCY,
    HTTP_REQUESTS,
    LOGIN_ATTEMPTS_TOTAL,
    refresh_business_metrics,
)
from .models import (
    Appointment,
    AuditLog,
    Department,
    Doctor,
    Document,
    MedicalRecord,
    Patient,
    Prescription,
    Slot,
    User,
)
from .schemas import (
    AppointmentCreate,
    AppointmentReschedule,
    ConsultationIn,
    DoctorCreate,
    LoginIn,
    ProfileUpdate,
    RegisterIn,
    SlotCreate,
    UserStatusUpdate,
)
from .security import (
    create_token,
    current_user,
    hash_password,
    require_roles,
    verify_password,
)
from .seed import seed
from .storage import (
    download as storage_download,
    ensure_bucket,
    upload as storage_upload,
)
from .tracing import setup_tracing


app = FastAPI(
    title="MediFlow One API",
    version="2.0.0",
)

# FastAPI -> OpenTelemetry -> Alloy -> Tempo
setup_tracing(app)

# FastAPI -> JSON log file -> Alloy -> Loki
logger = configure_logging()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://dev.mediflow.example.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    seed()
    ensure_bucket()

    logger.info(
        "MediFlow backend started",
        extra={
            "event": "application_startup",
        },
    )


@app.middleware("http")
async def metrics_and_logging_middleware(
    request: Request,
    call_next,
) -> Response:
    path = request.url.path

    request_id = request.headers.get(
        "X-Request-ID",
        str(uuid4()),
    )

    start_time = perf_counter()

    try:
        with HTTP_LATENCY.labels(path=path).time():
            response = await call_next(request)

        duration_ms = round(
            (perf_counter() - start_time) * 1000,
            2,
        )

        HTTP_REQUESTS.labels(
            method=request.method,
            path=path,
            status=str(response.status_code),
        ).inc()

        response.headers["X-Request-ID"] = request_id

        logger.info(
            "HTTP request completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "event": "http_request",
            },
        )

        return response

    except Exception:
        duration_ms = round(
            (perf_counter() - start_time) * 1000,
            2,
        )

        HTTP_REQUESTS.labels(
            method=request.method,
            path=path,
            status="500",
        ).inc()

        logger.exception(
            "HTTP request failed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": path,
                "status_code": 500,
                "duration_ms": duration_ms,
                "event": "http_request_error",
            },
        )

        raise


def audit(
    db: Session,
    user: User | None,
    action: str,
    entity: str,
    entity_id: object | None = None,
    detail: str | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_user_id=user.id if user else None,
            action=action,
            entity_type=entity,
            entity_id=(
                str(entity_id)
                if entity_id is not None
                else None
            ),
            detail=detail,
        )
    )


def patient_for(
    db: Session,
    user: User,
) -> Patient:
    patient = db.scalar(
        select(Patient).where(
            Patient.user_id == user.id
        )
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found",
        )

    return patient


def doctor_for(
    db: Session,
    user: User,
) -> Doctor:
    doctor = db.scalar(
        select(Doctor).where(
            Doctor.user_id == user.id
        )
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor profile not found",
        )

    return doctor


def appointment_json(
    appointment: Appointment,
) -> dict:
    return {
        "id": appointment.id,
        "status": appointment.status,
        "reason": appointment.reason,
        "start_at": appointment.slot.start_at.isoformat(),
        "doctor_name": appointment.doctor.user.full_name,
        "patient_name": appointment.patient.user.full_name,
        "department": appointment.doctor.department.name,
    }


@app.get("/health")
def health(
    db: Session = Depends(get_db),
) -> dict:
    db.execute(select(1))

    redis.from_url(
        settings.redis_url
    ).ping()

    return {
        "status": "healthy",
        "service": "mediflow-api",
    }


@app.get("/metrics")
def metrics(
    db: Session = Depends(get_db),
) -> Response:
    refresh_business_metrics(db)

    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )


@app.post("/api/auth/login")
def login(
    payload: LoginIn,
    db: Session = Depends(get_db),
) -> dict:
    user = db.scalar(
        select(User).where(
            func.lower(User.email)
            == payload.email.lower(),
            User.active.is_(True),
        )
    )

    if not user or not verify_password(
        payload.password,
        user.password_hash,
    ):
        LOGIN_ATTEMPTS_TOTAL.labels(
            result="failure"
        ).inc()

        logger.warning(
            "Login failed",
            extra={
                "event": "login_failure",
            },
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
        )

    LOGIN_ATTEMPTS_TOTAL.labels(
        result="success"
    ).inc()

    audit(
        db,
        user,
        "LOGIN",
        "user",
        user.id,
    )

    db.commit()

    logger.info(
        "Login successful",
        extra={
            "event": "login_success",
            "user_id": user.id,
            "role": user.role,
            "entity_type": "user",
            "entity_id": user.id,
        },
    )

    return {
        "access_token": create_token(user),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        },
    }


@app.post(
    "/api/auth/register",
    status_code=201,
)
def register(
    payload: RegisterIn,
    db: Session = Depends(get_db),
) -> dict:
    existing_user = db.scalar(
        select(User).where(
            func.lower(User.email)
            == payload.email.lower()
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(
            payload.password
        ),
        full_name=payload.full_name,
        role="patient",
    )

    db.add(user)
    db.flush()

    patient = Patient(
        user_id=user.id,
        patient_code=f"PT-{user.id:04d}",
        phone=payload.phone,
    )

    db.add(patient)
    db.flush()

    audit(
        db,
        user,
        "REGISTER",
        "patient",
        patient.id,
    )

    db.commit()

    logger.info(
        "Patient registered",
        extra={
            "event": "patient_registration",
            "user_id": user.id,
            "role": user.role,
            "entity_type": "patient",
            "entity_id": patient.id,
        },
    )

    return {
        "id": user.id,
        "email": user.email,
    }


@app.get("/api/me")
def me(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> dict:
    data = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
    }

    if user.role == "patient":
        patient = patient_for(
            db,
            user,
        )

        data.update(
            {
                "patient_code": patient.patient_code,
                "phone": patient.phone,
                "blood_group": patient.blood_group,
                "date_of_birth": patient.date_of_birth,
            }
        )

    return data


@app.put("/api/patient/profile")
def update_profile(
    payload: ProfileUpdate,
    user: User = Depends(
        require_roles("patient")
    ),
    db: Session = Depends(get_db),
) -> dict:
    patient = patient_for(
        db,
        user,
    )

    patient.phone = payload.phone
    patient.blood_group = payload.blood_group
    patient.date_of_birth = (
        payload.date_of_birth.isoformat()
        if payload.date_of_birth
        else None
    )

    audit(
        db,
        user,
        "UPDATE_PROFILE",
        "patient",
        patient.id,
    )

    db.commit()

    logger.info(
        "Patient profile updated",
        extra={
            "event": "profile_update",
            "user_id": user.id,
            "role": user.role,
            "entity_type": "patient",
            "entity_id": patient.id,
        },
    )

    return {
        "status": "updated",
    }


@app.get("/api/departments")
def departments(
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> list[dict]:
    del user

    rows = db.scalars(
        select(Department).order_by(
            Department.name
        )
    ).all()

    return [
        {
            "id": department.id,
            "name": department.name,
            "description": department.description,
        }
        for department in rows
    ]


@app.get("/api/doctors")
def doctors(
    department_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> list[dict]:
    del user

    query = select(Doctor)

    if department_id:
        query = query.where(
            Doctor.department_id
            == department_id
        )

    rows = db.scalars(
        query.order_by(Doctor.id)
    ).all()

    return [
        {
            "id": doctor.id,
            "name": doctor.user.full_name,
            "department": doctor.department.name,
            "qualification": doctor.qualification,
            "experience_years": doctor.experience_years,
            "consultation_fee": float(
                doctor.consultation_fee
            ),
        }
        for doctor in rows
    ]

@app.get("/api/doctor/slots")
def doctor_slots(
    user: User = Depends(
        require_roles("doctor")
    ),
    db: Session = Depends(get_db),
) -> list[dict]:
    doctor = doctor_for(
        db,
        user,
    )

    slots = db.scalars(
        select(Slot)
        .where(
            Slot.doctor_id == doctor.id
        )
        .order_by(Slot.start_at)
    ).all()

    return [
        {
            "id": slot.id,
            "start_at": slot.start_at.isoformat(),
            "end_at": slot.end_at.isoformat(),
            "is_booked": slot.is_booked,
        }
        for slot in slots
    ]


@app.post(
    "/api/doctor/slots",
    status_code=201,
)
def create_slot(
    payload: SlotCreate,
    user: User = Depends(
        require_roles("doctor")
    ),
    db: Session = Depends(get_db),
) -> dict:
    doctor = doctor_for(
        db,
        user,
    )

    if payload.start_at <= datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="Slot must be in the future",
        )

    overlap = db.scalar(
        select(func.count(Slot.id)).where(
            Slot.doctor_id == doctor.id,
            Slot.start_at < payload.end_at,
            Slot.end_at > payload.start_at,
        )
    )

    if overlap:
        raise HTTPException(
            status_code=409,
            detail="Slot overlaps an existing slot",
        )

    slot = Slot(
        doctor_id=doctor.id,
        start_at=payload.start_at,
        end_at=payload.end_at,
        is_booked=False,
    )

    db.add(slot)

    audit(
        db,
        user,
        "CREATE_SLOT",
        "slot",
        None,
    )

    db.commit()
    db.refresh(slot)

    return {
        "id": slot.id,
        "start_at": slot.start_at.isoformat(),
        "end_at": slot.end_at.isoformat(),
        "is_booked": slot.is_booked,
    }


@app.delete("/api/doctor/slots/{slot_id}")
def delete_slot(
    slot_id: int,
    user: User = Depends(
        require_roles("doctor")
    ),
    db: Session = Depends(get_db),
):
    doctor = doctor_for(
        db,
        user,
    )

    slot = db.get(
        Slot,
        slot_id,
    )

    if (
        not slot
        or slot.doctor_id != doctor.id
    ):
        raise HTTPException(
            status_code=404,
            detail="Slot not found",
        )

    if slot.is_booked:
        raise HTTPException(
            status_code=409,
            detail="Booked slots cannot be deleted",
        )

    db.delete(slot)

    audit(
        db,
        user,
        "DELETE_SLOT",
        "slot",
        slot_id,
    )

    db.commit()

    return {
        "message": "Slot deleted successfully",
    }

@app.get(
    "/api/doctors/{doctor_id}/slots"
)
def slots(
    doctor_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> list[dict]:
    del user

    rows = db.scalars(
        select(Slot)
        .where(
            Slot.doctor_id == doctor_id,
            Slot.is_booked.is_(False),
            Slot.start_at > datetime.utcnow(),
        )
        .order_by(Slot.start_at)
    ).all()

    return [
        {
            "id": slot.id,
            "start_at": slot.start_at.isoformat(),
            "end_at": slot.end_at.isoformat(),
        }
        for slot in rows
    ]


@app.post(
    "/api/appointments",
    status_code=201,
)
def book(
    payload: AppointmentCreate,
    user: User = Depends(
        require_roles("patient")
    ),
    db: Session = Depends(get_db),
) -> dict:
    patient = patient_for(
        db,
        user,
    )

    slot = db.get(
        Slot,
        payload.slot_id,
    )

    if (
        not slot
        or slot.is_booked
        or slot.start_at <= datetime.utcnow()
    ):
        raise HTTPException(
            status_code=409,
            detail="Slot is unavailable",
        )

    slot.is_booked = True

    appointment = Appointment(
        patient_id=patient.id,
        doctor_id=slot.doctor_id,
        slot_id=slot.id,
        reason=payload.reason,
        status="booked",
    )

    db.add(appointment)
    db.flush()

    audit(
        db,
        user,
        "BOOK_APPOINTMENT",
        "appointment",
        appointment.id,
    )

    db.commit()
    db.refresh(appointment)

    logger.info(
        "Appointment booked",
        extra={
            "event": "appointment_booked",
            "user_id": user.id,
            "role": user.role,
            "entity_type": "appointment",
            "entity_id": appointment.id,
        },
    )

    return appointment_json(
        appointment
    )


@app.get("/api/appointments")
def appointments(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    query = (
        select(Appointment)
        .order_by(
            Appointment.created_at.desc()
        )
    )

    if user.role == "patient":
        patient = patient_for(
            db,
            user,
        )

        query = query.where(
            Appointment.patient_id
            == patient.id
        )

    elif user.role == "doctor":
        doctor = doctor_for(
            db,
            user,
        )

        query = query.where(
            Appointment.doctor_id
            == doctor.id
        )

    elif user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Forbidden",
        )

    rows = db.scalars(query).all()

    return [
        appointment_json(appointment)
        for appointment in rows
    ]


@app.put(
    "/api/appointments/{appointment_id}/reschedule"
)
def reschedule(
    appointment_id: int,
    payload: AppointmentReschedule,
    user: User = Depends(
        require_roles("patient")
    ),
    db: Session = Depends(get_db),
) -> dict:
    patient = patient_for(
        db,
        user,
    )

    appointment = db.get(
        Appointment,
        appointment_id,
    )

    if (
        not appointment
        or appointment.patient_id
        != patient.id
        or appointment.status
        not in {
            "booked",
            "confirmed",
        }
    ):
        raise HTTPException(
            status_code=404,
            detail=(
                "Appointment cannot "
                "be rescheduled"
            ),
        )

    new_slot = db.get(
        Slot,
        payload.slot_id,
    )

    if (
        not new_slot
        or new_slot.is_booked
        or new_slot.start_at
        <= datetime.utcnow()
    ):
        raise HTTPException(
            status_code=409,
            detail="New slot unavailable",
        )

    appointment.slot.is_booked = False
    new_slot.is_booked = True

    appointment.slot_id = new_slot.id
    appointment.doctor_id = new_slot.doctor_id
    appointment.status = "booked"

    audit(
        db,
        user,
        "RESCHEDULE_APPOINTMENT",
        "appointment",
        appointment.id,
    )

    db.commit()
    db.refresh(appointment)

    logger.info(
        "Appointment rescheduled",
        extra={
            "event": "appointment_rescheduled",
            "user_id": user.id,
            "role": user.role,
            "entity_type": "appointment",
            "entity_id": appointment.id,
        },
    )

    return appointment_json(
        appointment
    )


@app.post(
    "/api/appointments/{appointment_id}/cancel"
)
def cancel(
    appointment_id: int,
    user: User = Depends(
        require_roles("patient")
    ),
    db: Session = Depends(get_db),
) -> dict:
    patient = patient_for(
        db,
        user,
    )

    appointment = db.get(
        Appointment,
        appointment_id,
    )

    if (
        not appointment
        or appointment.patient_id
        != patient.id
        or appointment.status
        in {
            "cancelled",
            "completed",
        }
    ):
        raise HTTPException(
            status_code=404,
            detail=(
                "Appointment cannot "
                "be cancelled"
            ),
        )

    appointment.status = "cancelled"
    appointment.slot.is_booked = False

    audit(
        db,
        user,
        "CANCEL_APPOINTMENT",
        "appointment",
        appointment.id,
    )

    db.commit()

    logger.info(
        "Appointment cancelled",
        extra={
            "event": "appointment_cancelled",
            "user_id": user.id,
            "role": user.role,
            "entity_type": "appointment",
            "entity_id": appointment.id,
        },
    )

    return {
        "status": "cancelled",
    }


@app.post(
    "/api/doctor/appointments/{appointment_id}/confirm"
)
def confirm(
    appointment_id: int,
    user: User = Depends(
        require_roles("doctor")
    ),
    db: Session = Depends(get_db),
) -> dict:
    doctor = doctor_for(
        db,
        user,
    )

    appointment = db.get(
        Appointment,
        appointment_id,
    )

    if (
        not appointment
        or appointment.doctor_id
        != doctor.id
        or appointment.status
        != "booked"
    ):
        raise HTTPException(
            status_code=404,
            detail=(
                "Appointment cannot "
                "be confirmed"
            ),
        )

    appointment.status = "confirmed"

    audit(
        db,
        user,
        "CONFIRM_APPOINTMENT",
        "appointment",
        appointment.id,
    )

    db.commit()

    logger.info(
        "Appointment confirmed",
        extra={
            "event": "appointment_confirmed",
            "user_id": user.id,
            "role": user.role,
            "entity_type": "appointment",
            "entity_id": appointment.id,
        },
    )

    return {
        "status": "confirmed",
    }


@app.post(
    "/api/doctor/appointments/{appointment_id}/complete"
)
def complete(
    appointment_id: int,
    payload: ConsultationIn,
    user: User = Depends(
        require_roles("doctor")
    ),
    db: Session = Depends(get_db),
) -> dict:
    doctor = doctor_for(
        db,
        user,
    )

    appointment = db.get(
        Appointment,
        appointment_id,
    )

    if (
        not appointment
        or appointment.doctor_id
        != doctor.id
        or appointment.status
        not in {
            "booked",
            "confirmed",
        }
    ):
        raise HTTPException(
            status_code=404,
            detail=(
                "Appointment cannot "
                "be completed"
            ),
        )

    existing_record = db.scalar(
        select(MedicalRecord).where(
            MedicalRecord.appointment_id
            == appointment.id
        )
    )

    if existing_record:
        raise HTTPException(
            status_code=409,
            detail=(
                "Consultation already "
                "exists"
            ),
        )

    record = MedicalRecord(
        appointment_id=appointment.id,
        patient_id=appointment.patient_id,
        doctor_id=doctor.id,
        diagnosis=payload.diagnosis,
        clinical_notes=payload.clinical_notes,
    )

    db.add(record)
    db.flush()

    for item in payload.prescriptions:
        db.add(
            Prescription(
                record_id=record.id,
                medicine=item.medicine,
                dosage=item.dosage,
                duration=item.duration,
            )
        )

    appointment.status = "completed"

    audit(
        db,
        user,
        "COMPLETE_CONSULTATION",
        "appointment",
        appointment.id,
    )

    db.commit()

    CONSULTATIONS_COMPLETED_TOTAL.inc()

    logger.info(
        "Consultation completed",
        extra={
            "event": "consultation_completed",
            "user_id": user.id,
            "role": user.role,
            "entity_type": "medical_record",
            "entity_id": record.id,
        },
    )

    return {
        "status": "completed",
        "record_id": record.id,
    }


@app.get("/api/medical-records")
def records(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    query = (
        select(MedicalRecord)
        .order_by(
            MedicalRecord.created_at.desc()
        )
    )

    if user.role == "patient":
        patient = patient_for(
            db,
            user,
        )

        query = query.where(
            MedicalRecord.patient_id
            == patient.id
        )

    elif user.role == "doctor":
        doctor = doctor_for(
            db,
            user,
        )

        query = query.where(
            MedicalRecord.doctor_id
            == doctor.id
        )

    elif user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Forbidden",
        )

    result = []

    for record in db.scalars(query).all():
        medicines = db.scalars(
            select(Prescription).where(
                Prescription.record_id
                == record.id
            )
        ).all()

        result.append(
            {
                "id": record.id,
                "created_at": (
                    record.created_at.isoformat()
                ),
                "doctor_name": (
                    record.doctor.user.full_name
                ),
                "diagnosis": record.diagnosis,
                "clinical_notes": (
                    record.clinical_notes
                ),
                "prescriptions": [
                    {
                        "medicine": medicine.medicine,
                        "dosage": medicine.dosage,
                        "duration": medicine.duration,
                    }
                    for medicine in medicines
                ],
            }
        )

    return result


@app.post(
    "/api/documents",
    status_code=201,
)
async def upload_document(
    file: UploadFile = File(...),
    user: User = Depends(
        require_roles("patient")
    ),
    db: Session = Depends(get_db),
) -> dict:
    allowed_types = {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "text/plain",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type",
        )

    data = await file.read()

    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Maximum file size is 10 MB",
        )

    patient = patient_for(
        db,
        user,
    )

    safe_file_name = (
        file.filename
        or "document"
    )

    object_key = (
        f"patients/{patient.id}/"
        f"{uuid4()}-{safe_file_name}"
    )

    storage_upload(
        object_key,
        data,
        (
            file.content_type
            or "application/octet-stream"
        ),
    )

    document = Document(
        patient_id=patient.id,
        file_name=safe_file_name,
        object_key=object_key,
        content_type=(
            file.content_type
            or "application/octet-stream"
        ),
    )

    db.add(document)
    db.flush()

    audit(
        db,
        user,
        "UPLOAD_DOCUMENT",
        "document",
        document.id,
    )

    db.commit()

    DOCUMENT_UPLOADS_TOTAL.inc()

    logger.info(
        "Document uploaded",
        extra={
            "event": "document_uploaded",
            "user_id": user.id,
            "role": user.role,
            "entity_type": "document",
            "entity_id": document.id,
        },
    )

    return {
        "id": document.id,
        "file_name": document.file_name,
    }


@app.get("/api/documents")
def documents(
    user: User = Depends(
        require_roles("patient")
    ),
    db: Session = Depends(get_db),
) -> list[dict]:
    patient = patient_for(
        db,
        user,
    )

    rows = db.scalars(
        select(Document)
        .where(
            Document.patient_id
            == patient.id
        )
        .order_by(
            Document.uploaded_at.desc()
        )
    ).all()

    return [
        {
            "id": document.id,
            "file_name": document.file_name,
            "content_type": document.content_type,
            "uploaded_at": (
                document.uploaded_at.isoformat()
            ),
        }
        for document in rows
    ]


@app.get(
    "/api/documents/{document_id}/download"
)
def download_document(
    document_id: int,
    user: User = Depends(
        require_roles("patient")
    ),
    db: Session = Depends(get_db),
) -> Response:
    patient = patient_for(
        db,
        user,
    )

    document = db.get(
        Document,
        document_id,
    )

    if (
        not document
        or document.patient_id
        != patient.id
    ):
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    return Response(
        storage_download(
            document.object_key
        ),
        media_type=document.content_type,
        headers={
            "Content-Disposition": (
                "attachment; "
                f'filename="{document.file_name}"'
            )
        },
    )


@app.get("/api/ai/summary")
def ai_summary(
    user: User = Depends(
        require_roles("patient")
    ),
    db: Session = Depends(get_db),
) -> dict:
    patient = patient_for(
        db,
        user,
    )

    record = db.scalar(
        select(MedicalRecord)
        .where(
            MedicalRecord.patient_id
            == patient.id
        )
        .order_by(
            MedicalRecord.created_at.desc()
        )
        .limit(1)
    )

    if not record:
        AI_SUMMARY_REQUESTS_TOTAL.labels(
            result="no_record"
        ).inc()

        logger.info(
            "AI summary unavailable",
            extra={
                "event": "ai_summary_no_record",
                "user_id": user.id,
                "role": user.role,
                "entity_type": "patient",
                "entity_id": patient.id,
            },
        )

        return {
            "answer": (
                "No medical records "
                "are available yet."
            )
        }

    medicines = db.scalars(
        select(Prescription).where(
            Prescription.record_id
            == record.id
        )
    ).all()

    medicine_names = (
        ", ".join(
            medicine.medicine
            for medicine in medicines
        )
        or "none"
    )

    AI_SUMMARY_REQUESTS_TOTAL.labels(
        result="success"
    ).inc()

    logger.info(
        "AI summary generated",
        extra={
            "event": "ai_summary_success",
            "user_id": user.id,
            "role": user.role,
            "entity_type": "medical_record",
            "entity_id": record.id,
        },
    )

    return {
        "answer": (
            "Your latest consultation "
            f"recorded {record.diagnosis}. "
            "Clinical notes: "
            f"{record.clinical_notes}. "
            "Prescribed medicines: "
            f"{medicine_names}. "
            "This is an informational "
            "summary, not medical advice."
        )
    }


@app.get("/api/admin/dashboard")
def admin_dashboard(
    user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
) -> dict:
    del user

    return {
        "users": db.scalar(
            select(func.count(User.id))
        ),
        "patients": db.scalar(
            select(func.count(Patient.id))
        ),
        "doctors": db.scalar(
            select(func.count(Doctor.id))
        ),
        "appointments": db.scalar(
            select(func.count(Appointment.id))
        ),
        "completed": db.scalar(
            select(
                func.count(Appointment.id)
            ).where(
                Appointment.status
                == "completed"
            )
        ),
    }


@app.post(
    "/api/admin/doctors",
    status_code=201,
)
def create_doctor(
    payload: DoctorCreate,
    admin: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
) -> dict:
    existing_email = db.scalar(
        select(User).where(
            func.lower(User.email)
            == payload.email.lower()
        )
    )

    if existing_email:
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )
    department = db.get(
        Department,
        payload.department_id,
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found",
        )

    account = User(
        email=payload.email.lower(),
        password_hash=hash_password(
            payload.password
        ),
        full_name=payload.full_name,
        role="doctor",
        active=True,
    )

    db.add(account)
    db.flush()

    last_doctor = db.scalar(
        select(Doctor)
        .order_by(Doctor.id.desc())
        .limit(1)
    )

    next_number = 1001 if not last_doctor else last_doctor.id + 1000
    doctor_code = f"DR-{next_number}"

    doctor = Doctor(
        user_id=account.id,
        department_id=department.id,
        doctor_code=doctor_code,
        qualification=(
            payload.qualification
        ),
        experience_years=(
            payload.experience_years
        ),
        consultation_fee=(
            payload.consultation_fee
        ),
    )

    db.add(doctor)
    db.flush()

    audit(
        db,
        admin,
        "CREATE_DOCTOR",
        "doctor",
        doctor.id,
        detail=(
            "Created doctor account "
            f"{account.email}"
        ),
    )

    db.commit()
    db.refresh(account)
    db.refresh(doctor)

    logger.info(
        "Doctor account created",
        extra={
            "event": "doctor_created",
            "user_id": admin.id,
            "role": admin.role,
            "entity_type": "doctor",
            "entity_id": doctor.id,
        },
    )

    return {
        "id": doctor.id,
        "user_id": account.id,
        "email": account.email,
        "full_name": account.full_name,
        "doctor_code": doctor.doctor_code,
        "department_id": doctor.department_id,
        "department": department.name,
        "qualification": doctor.qualification,
        "experience_years": (
            doctor.experience_years
        ),
        "consultation_fee": float(
            doctor.consultation_fee
        ),
        "active": account.active,
    }


@app.get("/api/admin/users")
def admin_users(
    user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
) -> list[dict]:
    del user

    rows = db.scalars(
        select(User).order_by(
            User.id
        )
    ).all()

    return [
        {
            "id": account.id,
            "email": account.email,
            "full_name": account.full_name,
            "role": account.role,
            "active": account.active,
        }
        for account in rows
    ]


@app.get("/api/admin/audit-logs")
def logs(
    user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
) -> list[dict]:
    del user

    rows = db.scalars(
        select(AuditLog)
        .order_by(
            AuditLog.created_at.desc()
        )
        .limit(200)
    ).all()

    return [
        {
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "detail": log.detail,
            "created_at": (
                log.created_at.isoformat()
            ),
        }
        for log in rows
    ]

@app.patch("/api/admin/users/{user_id}/status")
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    admin: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
) -> dict:
    account = db.get(
        User,
        user_id,
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if (
        account.id == admin.id
        and not payload.active
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "You cannot disable "
                "your own account"
            ),
        )

    if (
        account.role == "admin"
        and not payload.active
    ):
        active_admin_count = db.scalar(
            select(
                func.count(User.id)
            ).where(
                User.role == "admin",
                User.active.is_(True),
            )
        )

        if active_admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail=(
                    "At least one active "
                    "administrator is required"
                ),
            )

    if account.active == payload.active:
        return {
            "message": (
                "User status is already "
                "up to date"
            ),
            "user": {
                "id": account.id,
                "email": account.email,
                "active": account.active,
            },
        }

    previous_status = account.active
    account.active = payload.active

    audit(
        db,
        admin,
        "USER_STATUS_CHANGED",
        "user",
        account.id,
        detail=(
            f"active changed from "
            f"{previous_status} to "
            f"{payload.active}"
        ),
    )

    db.commit()
    db.refresh(account)

    logger.info(
        "User status updated",
        extra={
            "event": "user_status_changed",
            "user_id": admin.id,
            "role": admin.role,
            "entity_type": "user",
            "entity_id": account.id,
        },
    )

    return {
        "message": (
            "User status updated "
            "successfully"
        ),
        "user": {
            "id": account.id,
            "email": account.email,
            "active": account.active,
        },
    }

