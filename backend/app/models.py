from __future__ import annotations
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base

class User(Base):
    __tablename__="users"
    id:Mapped[int]=mapped_column(primary_key=True)
    email:Mapped[str]=mapped_column(String(255),unique=True,index=True)
    password_hash:Mapped[str]=mapped_column(String(255))
    full_name:Mapped[str]=mapped_column(String(150))
    role:Mapped[str]=mapped_column(String(20),index=True)
    active:Mapped[bool]=mapped_column(Boolean,default=True)
    created_at:Mapped[datetime]=mapped_column(DateTime,default=datetime.utcnow)

class Department(Base):
    __tablename__="departments"
    id:Mapped[int]=mapped_column(primary_key=True)
    name:Mapped[str]=mapped_column(String(100),unique=True)
    description:Mapped[str|None]=mapped_column(Text,nullable=True)

class Patient(Base):
    __tablename__="patients"
    id:Mapped[int]=mapped_column(primary_key=True)
    user_id:Mapped[int]=mapped_column(ForeignKey("users.id"),unique=True)
    patient_code:Mapped[str]=mapped_column(String(30),unique=True)
    phone:Mapped[str|None]=mapped_column(String(30),nullable=True)
    blood_group:Mapped[str|None]=mapped_column(String(10),nullable=True)
    date_of_birth:Mapped[str|None]=mapped_column(String(20),nullable=True)
    user:Mapped[User]=relationship()

class Doctor(Base):
    __tablename__="doctors"
    id:Mapped[int]=mapped_column(primary_key=True)
    user_id:Mapped[int]=mapped_column(ForeignKey("users.id"),unique=True)
    department_id:Mapped[int]=mapped_column(ForeignKey("departments.id"))
    doctor_code:Mapped[str]=mapped_column(String(30),unique=True)
    qualification:Mapped[str]=mapped_column(String(150))
    experience_years:Mapped[int]=mapped_column(Integer,default=0)
    consultation_fee:Mapped[float]=mapped_column(Numeric(10,2),default=500)
    user:Mapped[User]=relationship()
    department:Mapped[Department]=relationship()

class Slot(Base):
    __tablename__="slots"
    __table_args__=(UniqueConstraint("doctor_id","start_at",name="uq_doctor_slot"),)
    id:Mapped[int]=mapped_column(primary_key=True)
    doctor_id:Mapped[int]=mapped_column(ForeignKey("doctors.id"),index=True)
    start_at:Mapped[datetime]=mapped_column(DateTime,index=True)
    end_at:Mapped[datetime]=mapped_column(DateTime)
    is_booked:Mapped[bool]=mapped_column(Boolean,default=False)
    doctor:Mapped[Doctor]=relationship()

class Appointment(Base):
    __tablename__="appointments"
    id:Mapped[int]=mapped_column(primary_key=True)
    patient_id:Mapped[int]=mapped_column(ForeignKey("patients.id"),index=True)
    doctor_id:Mapped[int]=mapped_column(ForeignKey("doctors.id"),index=True)
    slot_id:Mapped[int]=mapped_column(ForeignKey("slots.id"),unique=True)
    reason:Mapped[str]=mapped_column(Text)
    status:Mapped[str]=mapped_column(String(30),default="booked",index=True)
    created_at:Mapped[datetime]=mapped_column(DateTime,default=datetime.utcnow)
    patient:Mapped[Patient]=relationship()
    doctor:Mapped[Doctor]=relationship()
    slot:Mapped[Slot]=relationship()

class MedicalRecord(Base):
    __tablename__="medical_records"
    id:Mapped[int]=mapped_column(primary_key=True)
    appointment_id:Mapped[int]=mapped_column(ForeignKey("appointments.id"),unique=True)
    patient_id:Mapped[int]=mapped_column(ForeignKey("patients.id"),index=True)
    doctor_id:Mapped[int]=mapped_column(ForeignKey("doctors.id"),index=True)
    diagnosis:Mapped[str]=mapped_column(Text)
    clinical_notes:Mapped[str]=mapped_column(Text)
    created_at:Mapped[datetime]=mapped_column(DateTime,default=datetime.utcnow)
    appointment:Mapped[Appointment]=relationship()
    doctor:Mapped[Doctor]=relationship()

class Prescription(Base):
    __tablename__="prescriptions"
    id:Mapped[int]=mapped_column(primary_key=True)
    record_id:Mapped[int]=mapped_column(ForeignKey("medical_records.id"),index=True)
    medicine:Mapped[str]=mapped_column(String(150))
    dosage:Mapped[str]=mapped_column(String(100))
    duration:Mapped[str]=mapped_column(String(100))

class Document(Base):
    __tablename__="documents"
    id:Mapped[int]=mapped_column(primary_key=True)
    patient_id:Mapped[int]=mapped_column(ForeignKey("patients.id"),index=True)
    file_name:Mapped[str]=mapped_column(String(255))
    object_key:Mapped[str]=mapped_column(String(500),unique=True)
    content_type:Mapped[str]=mapped_column(String(150))
    uploaded_at:Mapped[datetime]=mapped_column(DateTime,default=datetime.utcnow)

class AuditLog(Base):
    __tablename__="audit_logs"
    id:Mapped[int]=mapped_column(primary_key=True)
    actor_user_id:Mapped[int|None]=mapped_column(ForeignKey("users.id"),nullable=True,index=True)
    action:Mapped[str]=mapped_column(String(100),index=True)
    entity_type:Mapped[str]=mapped_column(String(100))
    entity_id:Mapped[str|None]=mapped_column(String(100),nullable=True)
    detail:Mapped[str|None]=mapped_column(Text,nullable=True)
    created_at:Mapped[datetime]=mapped_column(DateTime,default=datetime.utcnow,index=True)
