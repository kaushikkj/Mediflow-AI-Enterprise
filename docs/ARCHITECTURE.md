# Architecture

MediFlow One v2 uses a modular monolith for reliability and low local overhead. The FastAPI application is organized by domain concepts in its models, schemas, security, storage and route groups. PostgreSQL is the source of truth, Redis supplies infrastructure readiness and future caching, and MinIO stores uploaded documents.

The most important transaction is:

Patient books slot → Doctor confirms → Doctor completes consultation → Medical record and prescription are persisted → Patient reads the result.
