from datetime import date, datetime
from typing import Literal

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
)


Role = Literal[
    "patient",
    "doctor",
    "admin",
]


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
    )


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
    )
    full_name: str = Field(
        min_length=2,
        max_length=150,
    )
    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(
        cls,
        value: str,
    ) -> str:
        cleaned = " ".join(
            value.split()
        )

        if not cleaned:
            raise ValueError(
                "Full name is required"
            )

        return cleaned


class AppointmentCreate(BaseModel):
    slot_id: int = Field(gt=0)
    reason: str = Field(
        min_length=3,
        max_length=500,
    )


class AppointmentReschedule(
    BaseModel
):
    slot_id: int = Field(gt=0)


class PrescriptionIn(BaseModel):
    medicine: str = Field(
        min_length=1,
        max_length=150,
    )
    dosage: str = Field(
        min_length=1,
        max_length=100,
    )
    duration: str = Field(
        min_length=1,
        max_length=100,
    )


class ConsultationIn(BaseModel):
    diagnosis: str = Field(
        min_length=2,
        max_length=2000,
    )
    clinical_notes: str = Field(
        min_length=2,
        max_length=5000,
    )
    prescriptions: list[
        PrescriptionIn
    ] = Field(
        default_factory=list,
        max_length=50,
    )


class ProfileUpdate(BaseModel):
    phone: str | None = Field(
        default=None,
        max_length=30,
    )
    blood_group: str | None = Field(
        default=None,
        max_length=10,
    )
    date_of_birth: date | None = None

    @field_validator(
        "blood_group"
    )
    @classmethod
    def validate_blood_group(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        normalized = (
            value.strip().upper()
        )

        valid_groups = {
            "A+",
            "A-",
            "B+",
            "B-",
            "AB+",
            "AB-",
            "O+",
            "O-",
        }

        if normalized not in valid_groups:
            raise ValueError(
                "Invalid blood group"
            )

        return normalized


class UserStatusUpdate(BaseModel):
    active: bool

class DoctorCreate(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
    )
    full_name: str = Field(
        min_length=2,
        max_length=150,
    )
    department_id: int = Field(
        gt=0,
    )
    qualification: str = Field(
        min_length=2,
        max_length=150,
    )
    experience_years: int = Field(
        ge=0,
        le=60,
    )
    consultation_fee: float = Field(
        ge=0,
        le=100000,
    )

    @field_validator(
        "full_name",
        "qualification",
    )
    @classmethod
    def strip_text(
        cls,
        value: str,
    ) -> str:
        cleaned = " ".join(
            value.split()
        )

        if not cleaned:
            raise ValueError(
                "Value cannot be empty"
            )

        return cleaned

class SlotCreate(BaseModel):
    start_at: datetime
    end_at: datetime

    @field_validator("end_at")
    @classmethod
    def validate_end_at(
        cls,
        value: datetime,
        info,
    ) -> datetime:
        start_at = info.data.get("start_at")

        if (
            start_at is not None
            and value <= start_at
        ):
            raise ValueError(
                "End time must be after start time"
            )

        return value
