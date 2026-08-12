from datetime import datetime, timedelta
from sqlalchemy import select

from app.db import SessionLocal
from app.models import User, Department, Doctor, Slot
from app.security import hash_password


DOCTORS = [
    ("priya.sharma@mediflow.com", "Dr. Priya Sharma", "Dermatology", "MBBS, MD Dermatology", 9, 800),
    ("rahul.verma@mediflow.com", "Dr. Rahul Verma", "Orthopaedics", "MBBS, MS Orthopaedics", 14, 900),
    ("neha.kapoor@mediflow.com", "Dr. Neha Kapoor", "Pediatrics", "MBBS, MD Pediatrics", 7, 700),
    ("vikram.rao@mediflow.com", "Dr. Vikram Rao", "Neurology", "MBBS, DM Neurology", 15, 1200),
    ("ananya.iyer@mediflow.com", "Dr. Ananya Iyer", "Gynecology", "MBBS, MD Obstetrics & Gynecology", 11, 900),
    ("rohan.desai@mediflow.com", "Dr. Rohan Desai", "ENT", "MBBS, MS ENT", 6, 650),
    ("kavya.nair@mediflow.com", "Dr. Kavya Nair", "Ophthalmology", "MBBS, MS Ophthalmology", 10, 800),
    ("aditya.singh@mediflow.com", "Dr. Aditya Singh", "Psychiatry", "MBBS, MD Psychiatry", 8, 1000),
    ("meera.reddy@mediflow.com", "Dr. Meera Reddy", "Cardiology", "MBBS, DM Cardiology", 13, 1100),
    ("siddharth.joshi@mediflow.com", "Dr. Siddharth Joshi", "General Medicine", "MBBS, MD General Medicine", 10, 750),
]

DEPARTMENT_DESCRIPTIONS = {
    "Dermatology": "Skin, hair and nail care",
    "Orthopaedics": "Bones, joints and mobility",
    "Pediatrics": "Child and adolescent healthcare",
    "Neurology": "Brain and nervous system care",
    "Gynecology": "Women's health and reproductive care",
    "ENT": "Ear, nose and throat care",
    "Ophthalmology": "Eye and vision care",
    "Psychiatry": "Mental health and behavioral care",
    "Cardiology": "Heart and vascular care",
    "General Medicine": "Primary and preventive care",
}

SLOT_HOURS = [9, 10, 11, 14, 15, 16]


def next_doctor_code(db):
    doctors = db.scalars(select(Doctor)).all()

    numbers = []
    for doctor in doctors:
        try:
            numbers.append(int(doctor.doctor_code.replace("DR-", "")))
        except (ValueError, AttributeError):
            pass

    next_number = max(numbers, default=1000) + 1
    return f"DR-{next_number}"


def seed_demo_doctors():
    db = SessionLocal()

    try:
        departments = {}

        for name, description in DEPARTMENT_DESCRIPTIONS.items():
            department = db.scalar(
                select(Department).where(Department.name == name)
            )

            if not department:
                department = Department(
                    name=name,
                    description=description,
                )
                db.add(department)
                db.flush()

            departments[name] = department

        for email, full_name, department_name, qualification, experience, fee in DOCTORS:

            existing_user = db.scalar(
                select(User).where(User.email == email)
            )

            if existing_user:
                print(f"Skipping existing doctor: {email}")
                continue

            user = User(
                email=email,
                password_hash=hash_password("Doctor123!"),
                full_name=full_name,
                role="doctor",
                active=True,
            )

            db.add(user)
            db.flush()

            doctor = Doctor(
                user_id=user.id,
                department_id=departments[department_name].id,
                doctor_code=next_doctor_code(db),
                qualification=qualification,
                experience_years=experience,
                consultation_fee=fee,
            )

            db.add(doctor)
            db.flush()

            base_date = datetime.utcnow() + timedelta(days=1)

            for day in range(7):
                for hour in SLOT_HOURS:
                    start = (
                        base_date + timedelta(days=day)
                    ).replace(
                        hour=hour,
                        minute=0,
                        second=0,
                        microsecond=0,
                    )

                    existing_slot = db.scalar(
                        select(Slot).where(
                            Slot.doctor_id == doctor.id,
                            Slot.start_at == start,
                        )
                    )

                    if not existing_slot:
                        db.add(
                            Slot(
                                doctor_id=doctor.id,
                                start_at=start,
                                end_at=start + timedelta(minutes=30),
                                is_booked=False,
                            )
                        )

            print(
                f"Created {doctor.doctor_code} - "
                f"{full_name} ({department_name})"
            )

        db.commit()
        print("Demo doctor seed completed.")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_doctors()
