🏥 MediFlow AI Enterprise

<p align="center">
  <strong>Cloud-Native Healthcare Platform • Full-Stack Engineering • DevOps • SRE • Observability • AI</strong>
</p>

<p align="center">
  A production-style healthcare platform built with React, FastAPI, PostgreSQL, Redis, Kubernetes, GKE, Helm, Prometheus, Grafana, OpenTelemetry, and CI/CD.
</p>

📌 Table of Contents

About the Project

Engineering Highlights

Architecture

Technology Stack

Functional Modules

Authentication and Authorization

Core API Areas

Kubernetes and GKE

Networking and Ingress

Observability

Distributed Tracing

CI/CD

Repository Structure

Prerequisites

Local Development

Environment Configuration

Build and Validation

GKE Deployment Workflow

Health Checks and Verification

CORS

Screenshots

Reliability and SRE Concepts

Troubleshooting

Demo Flow

Current Status

Production Hardening Roadmap

Glossary

License / Usage

🚀 About the Project

MediFlow AI Enterprise is an end-to-end healthcare SaaS-style platform designed around three primary personas:

Patient

Doctor

Administrator

The project intentionally goes beyond a conventional CRUD application. It combines application development with cloud-native deployment, container orchestration, CI/CD, authentication and authorization, monitoring, observability, failure detection, operational dashboards, and reliability engineering.

The frontend is built with React + TypeScript + Vite, while the backend uses Python + FastAPI + SQLAlchemy. Application state is persisted in PostgreSQL, Redis provides a low-latency platform/data layer, and MinIO provides S3-compatible object storage for healthcare documents.

The platform is deployed to Google Kubernetes Engine (GKE) Autopilot using Helm. Operational telemetry is collected through Prometheus, visualized through Grafana, and enriched by PostgreSQL Exporter and Redis Exporter. The application also contains an admin-only Operations Command Center that converts monitoring telemetry into application-level health states.

[!NOTE]
MediFlow is a portfolio-grade engineering platform that demonstrates production-style architecture and operational practices. It is not presented as a certified clinical system or as compliant with a particular healthcare regulation.

Engineering Highlights

Role-based healthcare workflows for Patient, Doctor, and Admin users

JWT-based authentication and server-side RBAC

FastAPI REST APIs backed by PostgreSQL

Redis integration for low-latency platform/data-layer use cases

MinIO-compatible object storage for uploaded documents

Containerized frontend and backend workloads

Kubernetes deployment on GKE Autopilot

Helm-based release management

GCP Ingress / HTTP(S) Load Balancer routing

GitHub-based CI/CD

Application and infrastructure metrics through Prometheus

Operational visualization through Grafana

PostgreSQL Exporter and Redis Exporter

Admin-only observability aggregation API

Dynamic healthy, degraded, down, and unknown states

Failure/recovery validation by deliberately taking a monitoring exporter offline

OpenTelemetry instrumentation with Alloy/Tempo tracing path under further development

Structured audit and operational logging

Architecture

flowchart TB
    USER[Patient / Doctor / Admin]
    LB[GCP Load Balancer / Kubernetes Ingress]

    subgraph GKE["Google Kubernetes Engine - Autopilot"]
        FE[React + TypeScript Frontend]
        API[FastAPI Backend]
        PG[(PostgreSQL)]
        RD[(Redis)]
        MINIO[(MinIO Object Storage)]

        PROM[Prometheus]
        GRAF[Grafana]
        PGEXP[PostgreSQL Exporter]
        RDEXP[Redis Exporter]

        OTEL[OpenTelemetry]
        ALLOY[Grafana Alloy]
        TEMPO[Tempo]
    end

    USER --> LB
    LB --> FE
    LB --> API
    LB --> GRAF

    FE --> API
    API --> PG
    API --> RD
    API --> MINIO

    API --> PROM
    PG --> PGEXP
    RD --> RDEXP
    PGEXP --> PROM
    RDEXP --> PROM
    PROM --> GRAF

    API -. traces .-> OTEL
    OTEL -. OTLP .-> ALLOY
    ALLOY -. traces .-> TEMPO
    TEMPO -. visualization .-> GRAF

Request Flow

Browser
   |
   v
GCP Load Balancer / GKE Ingress
   |
   +----------------+------------------+
   |                |                  |
   v                v                  v
React/NGINX      FastAPI            Grafana
Frontend          Backend
                    |
             +------+-------+
             |      |       |
             v      v       v
        PostgreSQL Redis   MinIO

Observability Flow

FastAPI /metrics ---------+
PostgreSQL Exporter ------+--> Prometheus --> Grafana
Redis Exporter -----------+         |
                                    |
                                    v
                         Admin Observability API
                                    |
                                    v
                         React Operations UI

The frontend deliberately does not query Prometheus directly. Monitoring access is centralized through FastAPI so authorization, PromQL interpretation, status normalization, and the UI contract stay server-side.

Technology Stack

Layer

Technologies

Frontend

React, TypeScript, Vite, Lucide React, CSS

Backend

Python, FastAPI, SQLAlchemy, REST, JWT

Database

PostgreSQL

Cache / fast data layer

Redis

Object storage

MinIO

Containers

Docker

Orchestration

Kubernetes, GKE Autopilot

Packaging / deployment

Helm

Cloud

Google Cloud Platform

Traffic routing

Kubernetes Ingress, GCP Load Balancer

Metrics

Prometheus

Dashboards

Grafana

DB monitoring

PostgreSQL Exporter

Cache monitoring

Redis Exporter

Tracing

OpenTelemetry, Grafana Alloy, Tempo

CI/CD

Git, GitHub, GitHub Actions

Security

JWT, RBAC, CORS, protected backend routes

Reliability

health checks, metrics, failure/recovery validation

Functional Modules

Patient

Patients can:

authenticate and access a personalized dashboard

browse doctors and departments

book available appointment slots

reschedule or cancel appointments

view medical records generated from consultations

view prescriptions

upload and download healthcare documents

request an AI-generated health summary

manage profile information

Doctor

Doctors can:

authenticate through the same secured API layer

view their appointment workload

manage availability/slots

confirm appointments

open a consultation workspace

record diagnosis

enter clinical notes

add multiple prescription items

complete consultations

A completed consultation feeds the patient's longitudinal medical-record experience.

Administrator

Administrators can:

view platform-level dashboard information

manage users and doctors

inspect appointments

review audit logs

access the Operations Command Center

inspect embedded Grafana dashboards

view dynamic health for API, PostgreSQL, Redis, Prometheus, and Grafana

Authentication and Authorization

Authentication is based on JSON Web Tokens (JWT).

High-level flow:

POST /api/auth/login
        |
        v
Validate credentials
        |
        v
Generate JWT
        |
        v
Client sends Authorization: Bearer <token>
        |
        v
FastAPI resolves current user
        |
        v
RBAC dependency validates required role

Protected backend endpoints use dependencies such as:

Depends(current_user)
Depends(require_roles("patient"))
Depends(require_roles("doctor"))
Depends(require_roles("admin"))

This is important because authorization is enforced on the server, not merely by hiding frontend navigation items.

Core API Areas

The backend exposes APIs for:

/api/auth/* — authentication and registration

/api/me — current-user/profile data

/api/departments — healthcare departments

/api/doctors — doctor discovery

/api/slots/* — doctor availability

/api/appointments/* — appointment lifecycle

/api/doctor/appointments/* — doctor-side actions

/api/medical-records — clinical history

/api/documents/* — document management

/api/ai/summary — AI-oriented clinical summary

/api/admin/* — administrative workflows

/api/admin/observability/summary — normalized monitoring health

/health — application health endpoint

/metrics — Prometheus exposition endpoint

Kubernetes and GKE

Environment

GCP Project : mediflow-ai-enterprise
Namespace   : mediflow-dev
Helm Release: mediflow
Region      : asia-south1
Cluster     : GKE Autopilot

The development namespace contains workloads such as:

mediflow-mediflow-app-backend
mediflow-mediflow-app-frontend
postgres
redis
minio
prometheus
grafana
postgres-exporter
redis-exporter

Why GKE Autopilot?

GKE Autopilot manages much of the underlying node lifecycle while still providing Kubernetes abstractions such as:

Deployments

Pods

Services

Ingress

ConfigMaps

Secrets

health probes

rolling updates

autoscaling primitives

service discovery

This keeps the project focused on application/platform engineering instead of VM/node administration.

Helm

The application is packaged using Helm so Kubernetes manifests can be parameterized for environments.

Example:

helm upgrade mediflow `
  .\deployments\helm\mediflow-app `
  -n mediflow-dev `
  -f values-gke-dev.yaml

Networking and Ingress

Development hosts:

Frontend : http://dev.mediflow.example.com
API      : http://api-dev.mediflow.example.com
Grafana  : http://grafana-dev.mediflow.example.com

The GKE Ingress creates/uses Google Cloud load-balancing infrastructure and routes traffic based on host/path rules to the appropriate Kubernetes Service.

For a production environment, the expected hardening path would include managed DNS, TLS certificates, HTTPS-only traffic, secure cookies, HSTS, and tighter network controls.

Observability

Prometheus

Prometheus scrapes metrics from:

FastAPI application metrics

PostgreSQL Exporter

Redis Exporter

The backend exposes Prometheus-format metrics at:

/metrics

PostgreSQL Exporter

The exporter translates PostgreSQL operational statistics into Prometheus-compatible metrics.

Typical service endpoint:

postgres-exporter:9187

A useful health metric is:

pg_up

Redis Exporter

Redis Exporter exposes Redis telemetry to Prometheus.

Typical service endpoint:

redis-exporter:9121

A useful health metric is:

redis_up

Grafana

Grafana provides dashboards for:

Hospital Operations

Backend & API

Database & Cache

Infrastructure

AI & Documents

The dashboards are also embedded inside the admin Operations workspace.

Operations Command Center

The React Operations page polls:

GET /api/admin/observability/summary

The endpoint is admin-protected and aggregates monitoring information from the backend side.

Normalized states:

healthy
degraded
down
unknown

The UI currently surfaces:

API Gateway

PostgreSQL

Redis Cache

Prometheus

Grafana

Active Alerts

Failure Injection / Recovery Test

The monitoring pipeline was validated by intentionally removing Redis Exporter:

kubectl scale deployment redis-exporter `
  -n mediflow-dev `
  --replicas=0

The expected propagation path is:

Kubernetes workload change
        |
        v
Prometheus target becomes unavailable
        |
        v
FastAPI observability aggregation
        |
        v
Operations UI becomes degraded/down

Recovery:

kubectl scale deployment redis-exporter `
  -n mediflow-dev `
  --replicas=1

kubectl rollout status deployment/redis-exporter `
  -n mediflow-dev `
  --timeout=120s

This demonstrates actual failure detection rather than hard-coded status cards.

Distributed Tracing

The project includes an OpenTelemetry tracing path intended to follow:

FastAPI
   |
   v
OpenTelemetry SDK / OTLP exporter
   |
   v
Grafana Alloy
   |
   v
Tempo
   |
   v
Grafana

A known non-blocking issue remains around trace export to alloy:4317, where StatusCode.UNAVAILABLE has been observed.

This does not affect:

authentication

application APIs

PostgreSQL

Redis

Prometheus metrics

Grafana dashboards

CI/CD

GKE deployment

Tracing is therefore treated as an enhancement rather than a prerequisite for the working application.

CI/CD

High-level pipeline:

Developer change
      |
      v
Git commit / push
      |
      v
GitHub Actions CI
      |
      +--> dependency/build validation
      +--> frontend TypeScript/Vite build
      +--> backend checks
      |
      v
Container image build
      |
      v
Artifact Registry / image registry
      |
      v
Deployment workflow
      |
      v
Helm / Kubernetes rollout
      |
      v
GKE

Typical local checks before pushing:

python -m py_compile .\backend\app\main.py
python -m py_compile .\backend\app\observability.py

cd .\frontend
npm run build

cd ..
git diff --check
git status --short

Health Checks and Verification

Cluster:

kubectl get pods -n mediflow-dev
kubectl get svc -n mediflow-dev
kubectl get ingress -n mediflow-dev

Prometheus:

kubectl exec -n mediflow-dev deploy/grafana -- `
  wget -qO- http://prometheus:9090/-/ready

Redis exporter:

kubectl exec -n mediflow-dev deploy/prometheus -- `
  wget -qO- http://redis-exporter:9121/metrics |
  Select-String "redis_up"

PostgreSQL exporter:

kubectl exec -n mediflow-dev deploy/prometheus -- `
  wget -qO- http://postgres-exporter:9187/metrics |
  Select-String "pg_up"

🧰 Prerequisites

For local development and deployment work, install:

Tool

Purpose

Git

Source control

Node.js / npm

React frontend development and build

Python 3.12+

FastAPI backend development

Docker

Container image development

kubectl

Kubernetes administration

Helm

Kubernetes package/release management

Google Cloud CLI (gcloud)

GCP authentication and GKE access

Verify the main tools:

git --version
node --version
npm --version
python --version
docker --version
kubectl version --client
helm version
gcloud --version

🔐 Environment Configuration

Configuration should be supplied through environment variables, Kubernetes ConfigMaps/Secrets, or environment-specific values files rather than committed credentials.

Typical configuration categories include:

DATABASE_URL=<postgresql-connection-string>
REDIS_URL=<redis-connection-string>
JWT_SECRET=<secret>
MINIO_ENDPOINT=<object-storage-endpoint>
MINIO_ACCESS_KEY=<access-key>
MINIO_SECRET_KEY=<secret-key>

Frontend API configuration depends on the execution environment:

Local frontend     -> localhost/Vite proxy or configured API endpoint
GKE frontend       -> api-dev.mediflow.example.com

[!CAUTION]
Never commit real passwords, JWT signing secrets, cloud credentials, database credentials, or production .env files to Git.

🧪 Build and Validation

Before committing frontend/backend changes:

# Backend syntax validation
python -m py_compile .\backend\app\main.py

# Include this when observability.py changes
python -m py_compile .\backend\app\observability.py

# Frontend production build
cd .\frontend
npm install
npm run build

# Return to repository root
cd ..

# Git whitespace validation
git diff --check

# Review modified files
git status --short
git --no-pager diff --stat

A successful Vite production build confirms that TypeScript compilation and frontend bundling complete successfully.

☁️ GKE Deployment Workflow

Typical deployment lifecycle:

Code change
   ↓
Local validation
   ↓
Git commit / push
   ↓
CI/CD pipeline
   ↓
Container image build
   ↓
Container registry
   ↓
Helm/Kubernetes deployment
   ↓
GKE rollout
   ↓
Health + observability verification

After CI/CD completes:

kubectl get pods -n mediflow-dev
kubectl get svc -n mediflow-dev
kubectl get ingress -n mediflow-dev

Check the backend rollout if required:

kubectl rollout status `
  deployment/mediflow-mediflow-app-backend `
  -n mediflow-dev `
  --timeout=120s

Check the frontend rollout:

kubectl rollout status `
  deployment/mediflow-mediflow-app-frontend `
  -n mediflow-dev `
  --timeout=120s

Local Development

Frontend:

cd frontend
npm install
npm run dev

Vite development URL:

http://localhost:5173

Production frontend validation:

npm run build

When running the frontend locally against the cloud API, the FastAPI CORS allowlist must include the local Vite origin.

CORS

The API uses FastAPI's CORSMiddleware.

Development origins used during the project include:

http://localhost:3000
http://localhost:5173
http://dev.mediflow.example.com

A real preflight can be validated with:

curl.exe -i -X OPTIONS `
  "http://api-dev.mediflow.example.com/api/auth/login" `
  -H "Origin: http://dev.mediflow.example.com" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: content-type"

Repository Structure

Mediflow-AI-Enterprise-main/
├── .github/                  # CI/CD workflows
├── backend/                  # FastAPI application
│   └── app/
│       ├── main.py
│       ├── observability.py
│       ├── metrics.py
│       ├── security.py
│       └── ...
├── deployments/
│   ├── helm/                 # Helm chart
│   └── kubernetes/           # Kubernetes manifests
├── docs/                     # Architecture/runbooks/documentation
├── frontend/                 # React + TypeScript application
│   └── src/
│       ├── pages/
│       ├── api.ts
│       └── styles.css
├── infrastructure/           # Infrastructure-as-Code
├── observability/            # Monitoring/tracing configuration
└── README.md

📸 Screenshots

Repository screenshots can be stored under a path such as:

docs/
└── screenshots/
    ├── operations-command-center.png
    ├── grafana-hospital-operations.png
    ├── grafana-database-cache.png
    ├── grafana-infrastructure.png
    ├── grafana-ai-documents.png
    ├── prometheus-targets.png
    └── doctor-consultation.png

Then render them directly in GitHub:

Operations Command Center

![Operations Command Center](docs/screenshots/operations-command-center.png)

Grafana — Hospital Operations

![Grafana Hospital Operations](docs/screenshots/grafana-hospital-operations.png)

Prometheus Targets

![Prometheus Targets](docs/screenshots/prometheus-targets.png)

[!TIP]
Keeping screenshots inside docs/screenshots/ makes the README portable and prevents it from depending on local Windows paths or temporary ChatGPT attachments.

🛠️ Troubleshooting

CORS preflight failure

Typical browser error:

No 'Access-Control-Allow-Origin' header is present

Verify that the browser origin is included in FastAPI's CORS configuration and that the deployed backend image contains the change.

Development origins used by MediFlow include:

http://localhost:3000
http://localhost:5173
http://dev.mediflow.example.com

ERR_CONNECTION_REFUSED on localhost:8000

This usually means the frontend is pointing to a local API while the backend isn't listening on port 8000.

Verify the frontend API configuration or start the backend.

API returns 401 Unauthorized

Protected endpoints such as the admin observability API require a valid JWT with the appropriate role. A direct unauthenticated request returning 401 is expected behavior.

UI didn't change after deployment

Check:

git status --short
git log -1 --oneline
kubectl get pods -n mediflow-dev

Then verify the CI/CD run deployed the commit containing the frontend change and hard-refresh the browser.

Prometheus exporter appears down

Check the exporter Pod:

kubectl get pods -n mediflow-dev

Then inspect the metric endpoint from inside the cluster.

Redis:

kubectl exec -n mediflow-dev deploy/prometheus -- `
  wget -qO- http://redis-exporter:9121/metrics

PostgreSQL:

kubectl exec -n mediflow-dev deploy/prometheus -- `
  wget -qO- http://postgres-exporter:9187/metrics

OpenTelemetry StatusCode.UNAVAILABLE

The current known tracing issue relates to OTLP export toward Alloy/Tempo. It is independent of the working Prometheus/Grafana metrics path and doesn't prevent the main application from operating.

Reliability and SRE Concepts Demonstrated

This project intentionally uses SRE/platform-engineering terminology and practices:

Health check — endpoint/probe used to determine service health

Readiness — whether a workload is ready to receive traffic

Liveness — whether a workload should be considered alive/restarted

Metrics — numerical time-series telemetry

Logs — event-oriented diagnostic records

Traces — request execution paths across components

Observability — ability to understand internal system state through telemetry

Exporter — component translating service telemetry into Prometheus format

Scrape target — endpoint periodically collected by Prometheus

PromQL — Prometheus Query Language

Dashboard — visualization of telemetry in Grafana

Alert — rule-driven signal that a condition requires attention

SLI — Service Level Indicator, a measured reliability metric

SLO — Service Level Objective, the target for an SLI

SLA — Service Level Agreement, an externally committed service target

MTTR — Mean Time to Recovery/Repair

HA — High Availability

RCA — Root Cause Analysis

RBAC — Role-Based Access Control

JWT — JSON Web Token

CORS — Cross-Origin Resource Sharing

Ingress — Kubernetes HTTP routing into cluster services

Service discovery — locating services by stable cluster DNS names

Rolling deployment — replacing application replicas incrementally

IaC — Infrastructure as Code

CI — Continuous Integration

CD — Continuous Delivery/Deployment

OTLP — OpenTelemetry Protocol

GKE — Google Kubernetes Engine

GKE Autopilot — managed GKE operating mode with reduced node administration

Helm release — deployed instance of a Helm chart

Namespace — logical Kubernetes isolation boundary

Pod — smallest deployable Kubernetes workload unit

Deployment — Kubernetes controller managing replicated Pods

Service — stable Kubernetes network endpoint for Pods

ConfigMap — non-secret Kubernetes configuration

Secret — Kubernetes object for sensitive configuration

Container registry — repository for built container images

Production Hardening Roadmap

For a real regulated healthcare production environment, the next steps would include:

HTTPS/TLS everywhere

managed DNS

private GKE/networking

Cloud SQL instead of in-cluster PostgreSQL

managed Redis

Secret Manager / external secrets

encryption and key-management policies

Pod/network security policies

vulnerability and container-image scanning

backup and restore automation

disaster-recovery testing

multi-zone resilience

Horizontal Pod Autoscaling

resource requests/limits tuning

formal SLI/SLO definitions

alert routing and escalation

log retention policies

complete OpenTelemetry/Alloy/Tempo tracing

security audit controls

PHI/PII governance

compliance assessment and controls appropriate to deployment geography

MediFlow is a portfolio-grade engineering project demonstrating production-style patterns. It is not presented as a certified clinical system or as compliant with a specific healthcare regulation.

Demo Flow

Recommended interview demo:

Patient workflow
   ->
Doctor consultation
   ->
Admin workflow
   ->
Operations Command Center
   ->
Grafana
   ->
Failure/recovery demonstration
   ->
CI/CD
   ->
GKE workloads

This tells the complete story from business functionality to platform reliability.

Current Status

Working:

frontend

FastAPI backend

authentication

RBAC

PostgreSQL

Redis

MinIO

patient workflows

doctor workflows

admin workflows

GKE deployment

ingress

CI/CD

Prometheus

Grafana

PostgreSQL Exporter

Redis Exporter

dynamic Operations health

failure/recovery monitoring validation

Further enhancement:

complete Alloy/Tempo trace export

production security hardening

managed cloud stateful services

expanded AI/RAG workflows

formal SLO/alerting model

📖 Glossary

Term

Meaning in MediFlow

API

Application Programming Interface used by React to communicate with FastAPI

CI

Continuous Integration — automated validation/build of changes

CD

Continuous Delivery/Deployment — automated delivery of validated changes

CORS

Browser cross-origin access policy enforced between frontend and API

Exporter

Adapter exposing another service's telemetry in Prometheus format

GKE

Google Kubernetes Engine

GKE Autopilot

Managed GKE mode where Google manages more of the underlying node lifecycle

Grafana

Dashboard and telemetry visualization platform

Helm

Kubernetes package manager

Ingress

Kubernetes HTTP/HTTPS entry and routing resource

JWT

JSON Web Token used for authenticated API access

Kubernetes

Container orchestration platform

Liveness Probe

Kubernetes check used to determine whether a container should be restarted

MTTR

Mean Time to Recovery/Repair

Namespace

Logical isolation boundary in Kubernetes

Observability

Understanding internal system state through metrics, logs, and traces

OpenTelemetry

Vendor-neutral telemetry instrumentation framework

OTLP

OpenTelemetry Protocol

Pod

Smallest Kubernetes workload execution unit

Prometheus

Metrics collection and time-series query platform

PromQL

Prometheus Query Language

RBAC

Role-Based Access Control

RCA

Root Cause Analysis

Readiness Probe

Kubernetes check determining whether a Pod should receive traffic

Redis

In-memory data platform

REST

HTTP-based application API architectural style

SLA

Service Level Agreement

SLI

Service Level Indicator

SLO

Service Level Objective

Tempo

Distributed tracing backend

Alloy

Grafana telemetry collector/distribution component

Vite

Frontend development/build tool

Workload

Application/service running in Kubernetes

License / Usage

This repository is intended as an engineering portfolio and learning project. Any healthcare data used for demonstrations should be synthetic/non-production data.
