# MediFlow One v2

A compact, single-hospital healthcare portfolio application with fully connected patient, doctor and admin workflows.

## What works

- JWT login for patient, doctor and admin
- Patient registration
- Doctor directory and available slots
- Book, reschedule and cancel appointments
- Doctor confirmation and consultation completion
- Diagnosis, notes and prescriptions persisted in PostgreSQL
- Patient medical-record view
- Document upload/download through MinIO
- Admin users, appointments, departments and audit logs
- Prometheus metrics and optional Grafana dashboard

## Prerequisites

Only Podman Desktop is required for local execution. Git and VS Code are recommended.

## Start

```powershell
Copy-Item .env.example .env
podman machine start
podman compose -f compose.yaml up -d --build
```

Open:

- App: http://localhost:3000
- API docs: http://localhost:8000/docs
- MinIO: http://localhost:9001

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Patient | patient@mediflow.test | Patient123! |
| Doctor | doctor@mediflow.test | Doctor123! |
| Admin | admin@mediflow.test | Admin123! |

## End-to-end demo

1. Sign in as patient and book an available doctor slot.
2. Sign out and sign in as doctor.
3. Confirm the appointment and complete the consultation.
4. Add diagnosis, clinical notes and medicines.
5. Sign back in as patient and open Medical Records.
6. Upload a report under Documents.
7. Sign in as admin to review users, appointments and audit events.

## Commands

```powershell
.\scripts.ps1 start
.\scripts.ps1 status
.\scripts.ps1 logs
.\scripts.ps1 test
.\scripts.ps1 reset
.\scripts.ps1 stop
```

Optional monitoring:

```powershell
.\scripts.ps1 observability
```

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (`admin` / `admin123`)

## Architecture

```text
React + TypeScript + NGINX
             |
        FastAPI API
             |
 PostgreSQL / Redis / MinIO
             |
 Prometheus + Grafana (optional)
```

This version intentionally uses a modular monolith rather than many fragile microservices. The backend modules remain separable for future extraction.
