from datetime import datetime, timedelta
from sqlalchemy import select
from .db import Base, engine, SessionLocal
from .models import User,Department,Patient,Doctor,Slot,Appointment,MedicalRecord,Prescription
from .security import hash_password

def seed():
    Base.metadata.create_all(engine)
    db=SessionLocal()
    try:
        if db.scalar(select(User).limit(1)): return
        deps=[Department(name="General Medicine",description="Primary and preventive care"),Department(name="Cardiology",description="Heart and vascular care"),Department(name="Orthopaedics",description="Bones, joints and mobility")]
        db.add_all(deps); db.flush()
        patient_user=User(email="patient@mediflow.com",password_hash=hash_password("Patient123!"),full_name="John Miller",role="patient")
        doctor_user=User(email="doctor@mediflow.com",password_hash=hash_password("Doctor123!"),full_name="Dr. Sarah Wilson",role="doctor")
        doctor2_user=User(email="cardio@mediflow.com",password_hash=hash_password("Doctor123!"),full_name="Dr. Arjun Mehta",role="doctor")
        admin_user=User(email="admin@mediflow.com",password_hash=hash_password("Admin123!"),full_name="System Administrator",role="admin")
        db.add_all([patient_user,doctor_user,doctor2_user,admin_user]); db.flush()
        patient=Patient(user_id=patient_user.id,patient_code="PT-1001",phone="9000000001",blood_group="B+")
        doctor=Doctor(user_id=doctor_user.id,department_id=deps[0].id,doctor_code="DR-1001",qualification="MBBS, MD",experience_years=8,consultation_fee=700)
        doctor2=Doctor(user_id=doctor2_user.id,department_id=deps[1].id,doctor_code="DR-1002",qualification="MBBS, DM Cardiology",experience_years=12,consultation_fee=1000)
        db.add_all([patient,doctor,doctor2]); db.flush()
        base=(datetime.utcnow()+timedelta(days=1)).replace(hour=9,minute=0,second=0,microsecond=0)
        for d in range(5):
            for doc in [doctor,doctor2]:
                for h in [9,10,11,14,15,16]:
                    start=(base+timedelta(days=d)).replace(hour=h)
                    db.add(Slot(doctor_id=doc.id,start_at=start,end_at=start+timedelta(minutes=30)))
        db.flush()
        past_slot=Slot(doctor_id=doctor.id,start_at=datetime.utcnow()-timedelta(days=10),end_at=datetime.utcnow()-timedelta(days=10)+timedelta(minutes=30),is_booked=True)
        db.add(past_slot); db.flush()
        appt=Appointment(patient_id=patient.id,doctor_id=doctor.id,slot_id=past_slot.id,reason="Routine follow-up",status="completed")
        db.add(appt); db.flush()
        record=MedicalRecord(appointment_id=appt.id,patient_id=patient.id,doctor_id=doctor.id,diagnosis="Seasonal allergic rhinitis",clinical_notes="Hydration and steam inhalation advised.")
        db.add(record); db.flush()
        db.add(Prescription(record_id=record.id,medicine="Cetirizine",dosage="10 mg once daily",duration="5 days"))
        db.commit()
    finally: db.close()
