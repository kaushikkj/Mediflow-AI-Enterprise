import json
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DASHBOARD_DIR = (
    PROJECT_ROOT
    / "observability"
    / "grafana"
    / "dashboards"
)

PROMETHEUS_UID = "prometheus"


def target(
    expression: str,
    ref_id: str = "A",
    legend_format: str = "",
    range_query: bool = True,
) -> dict[str, Any]:
    return {
        "datasource": {
            "type": "prometheus",
            "uid": PROMETHEUS_UID,
        },
        "editorMode": "code",
        "expr": expression,
        "legendFormat": legend_format,
        "range": range_query,
        "refId": ref_id,
    }


def stat_panel(
    panel_id: int,
    title: str,
    expression: str,
    x: int,
    y: int,
    width: int = 6,
    height: int = 5,
    unit: str = "short",
    mappings: list[dict[str, Any]] | None = None,
    thresholds: dict[str, Any] | None = None,
) -> dict[str, Any]:
    defaults: dict[str, Any] = {
        "unit": unit,
    }

    if mappings:
        defaults["mappings"] = mappings

    if thresholds:
        defaults["thresholds"] = thresholds

    return {
        "id": panel_id,
        "type": "stat",
        "title": title,
        "datasource": {
            "type": "prometheus",
            "uid": PROMETHEUS_UID,
        },
        "gridPos": {
            "x": x,
            "y": y,
            "w": width,
            "h": height,
        },
        "targets": [
            target(
                expression=expression,
                range_query=True,
            )
        ],
        "fieldConfig": {
            "defaults": defaults,
            "overrides": [],
        },
        "options": {
            "colorMode": "value",
            "graphMode": "area",
            "justifyMode": "auto",
            "orientation": "auto",
            "reduceOptions": {
                "calcs": ["lastNotNull"],
                "fields": "",
                "values": False,
            },
            "textMode": "auto",
        },
    }


def timeseries_panel(
    panel_id: int,
    title: str,
    expression: str,
    x: int,
    y: int,
    width: int = 12,
    height: int = 8,
    unit: str = "short",
    legend_format: str = "",
) -> dict[str, Any]:
    return {
        "id": panel_id,
        "type": "timeseries",
        "title": title,
        "datasource": {
            "type": "prometheus",
            "uid": PROMETHEUS_UID,
        },
        "gridPos": {
            "x": x,
            "y": y,
            "w": width,
            "h": height,
        },
        "targets": [
            target(
                expression=expression,
                legend_format=legend_format,
                range_query=True,
            )
        ],
        "fieldConfig": {
            "defaults": {
                "unit": unit,
            },
            "overrides": [],
        },
        "options": {
            "legend": {
                "displayMode": "list",
                "placement": "bottom",
                "showLegend": True,
            },
            "tooltip": {
                "mode": "single",
                "sort": "none",
            },
        },
    }


def service_status_mappings() -> list[dict[str, Any]]:
    return [
        {
            "type": "value",
            "options": {
                "0": {
                    "text": "DOWN",
                    "color": "red",
                },
                "1": {
                    "text": "UP",
                    "color": "green",
                },
            },
        }
    ]


def service_status_thresholds() -> dict[str, Any]:
    return {
        "mode": "absolute",
        "steps": [
            {
                "color": "red",
                "value": None,
            },
            {
                "color": "green",
                "value": 1,
            },
        ],
    }


def infrastructure_dashboard() -> dict[str, Any]:
    return {
        "uid": "mediflow-infrastructure",
        "title": "MediFlow Infrastructure Overview",
        "tags": [
            "mediflow",
            "infrastructure",
        ],
        "timezone": "browser",
        "schemaVersion": 39,
        "version": 5,
        "refresh": "10s",
        "editable": True,
        "time": {
            "from": "now-1h",
            "to": "now",
        },
        "panels": [
            stat_panel(
                panel_id=1,
                title="Backend Memory Usage",
                expression=(
                    "sum("
                    'process_resident_memory_bytes{job="mediflow-api"}'
                    ")"
                ),
                x=0,
                y=0,
                unit="bytes",
            ),
            stat_panel(
                panel_id=2,
                title="Backend Uptime",
                expression=(
                    "max("
                    "time() - "
                    'process_start_time_seconds{job="mediflow-api"}'
                    ")"
                ),
                x=6,
                y=0,
                unit="s",
            ),
            stat_panel(
                panel_id=3,
                title="Backend Status",
                expression=(
                    'max(up{job="mediflow-api"}) '
                    "or vector(0)"
                ),
                x=12,
                y=0,
                unit="short",
                mappings=service_status_mappings(),
                thresholds=service_status_thresholds(),
            ),
            stat_panel(
                panel_id=4,
                title="Open File Descriptors",
                expression=(
                    "sum("
                    'process_open_fds{job="mediflow-api"}'
                    ")"
                ),
                x=18,
                y=0,
                unit="short",
            ),
            timeseries_panel(
                panel_id=5,
                title="Backend CPU Usage",
                expression=(
                    "sum("
                    "rate("
                    "process_cpu_seconds_total"
                    '{job="mediflow-api"}[5m]'
                    ")"
                    ")"
                ),
                x=0,
                y=5,
                width=12,
                height=8,
                unit="cores",
                legend_format="Backend CPU",
            ),
            timeseries_panel(
                panel_id=6,
                title="Backend Memory Trend",
                expression=(
                    "sum("
                    "process_resident_memory_bytes"
                    '{job="mediflow-api"}'
                    ")"
                ),
                x=12,
                y=5,
                width=12,
                height=8,
                unit="bytes",
                legend_format="Backend Memory",
            ),
            timeseries_panel(
                panel_id=7,
                title="Python Garbage Collections",
                expression=(
                    "sum by (generation) ("
                    "rate("
                    "python_gc_collections_total"
                    '{job="mediflow-api"}[5m]'
                    ")"
                    ")"
                ),
                x=0,
                y=13,
                width=12,
                height=8,
                unit="ops",
                legend_format="Generation {{generation}}",
            ),
            timeseries_panel(
                panel_id=8,
                title="Python Garbage-Collected Objects",
                expression=(
                    "sum by (generation) ("
                    "rate("
                    "python_gc_objects_collected_total"
                    '{job="mediflow-api"}[5m]'
                    ")"
                    ")"
                ),
                x=12,
                y=13,
                width=12,
                height=8,
                unit="ops",
                legend_format="Generation {{generation}}",
            ),
        ],
    }


def backend_dashboard() -> dict[str, Any]:
    return {
        "uid": "mediflow-backend-api",
        "title": "MediFlow Backend & API Performance",
        "tags": [
            "mediflow",
            "backend",
            "api",
        ],
        "timezone": "browser",
        "schemaVersion": 39,
        "version": 4,
        "refresh": "10s",
        "editable": True,
        "time": {
            "from": "now-1h",
            "to": "now",
        },
        "panels": [
            stat_panel(
                panel_id=1,
                title="Current Request Rate",
                expression=(
                    "sum("
                    "rate("
                    "mediflow_http_requests_total[5m]"
                    ")"
                    ") or vector(0)"
                ),
                x=0,
                y=0,
                unit="reqps",
            ),
            stat_panel(
                panel_id=2,
                title="5xx Error Rate",
                expression=(
                    "sum("
                    "rate("
                    "mediflow_http_requests_total"
                    '{status=~"5.."}[5m]'
                    ")"
                    ") or vector(0)"
                ),
                x=6,
                y=0,
                unit="reqps",
            ),
            stat_panel(
                panel_id=3,
                title="4xx Error Rate",
                expression=(
                    "sum("
                    "rate("
                    "mediflow_http_requests_total"
                    '{status=~"4.."}[5m]'
                    ")"
                    ") or vector(0)"
                ),
                x=12,
                y=0,
                unit="reqps",
            ),
            stat_panel(
                panel_id=4,
                title="Average API Latency",
                expression=(
                    "sum("
                    "rate("
                    "mediflow_http_request_seconds_sum[5m]"
                    ")"
                    ") "
                    "/ "
                    "clamp_min("
                    "sum("
                    "rate("
                    "mediflow_http_request_seconds_count[5m]"
                    ")"
                    "), "
                    "0.000001"
                    ")"
                ),
                x=18,
                y=0,
                unit="s",
            ),
            timeseries_panel(
                panel_id=5,
                title="Request Rate by Endpoint",
                expression=(
                    "sum by (path) ("
                    "rate("
                    "mediflow_http_requests_total[5m]"
                    ")"
                    ")"
                ),
                x=0,
                y=5,
                width=12,
                height=8,
                unit="reqps",
                legend_format="{{path}}",
            ),
            timeseries_panel(
                panel_id=6,
                title="Request Rate by HTTP Status",
                expression=(
                    "sum by (status) ("
                    "rate("
                    "mediflow_http_requests_total[5m]"
                    ")"
                    ")"
                ),
                x=12,
                y=5,
                width=12,
                height=8,
                unit="reqps",
                legend_format="HTTP {{status}}",
            ),
            timeseries_panel(
                panel_id=7,
                title="P95 API Latency by Endpoint",
                expression=(
                    "histogram_quantile("
                    "0.95, "
                    "sum by (le, path) ("
                    "rate("
                    "mediflow_http_request_seconds_bucket[5m]"
                    ")"
                    ")"
                    ")"
                ),
                x=0,
                y=13,
                width=12,
                height=8,
                unit="s",
                legend_format="{{path}}",
            ),
            timeseries_panel(
                panel_id=8,
                title="P99 API Latency by Endpoint",
                expression=(
                    "histogram_quantile("
                    "0.99, "
                    "sum by (le, path) ("
                    "rate("
                    "mediflow_http_request_seconds_bucket[5m]"
                    ")"
                    ")"
                    ")"
                ),
                x=12,
                y=13,
                width=12,
                height=8,
                unit="s",
                legend_format="{{path}}",
            ),
            timeseries_panel(
                panel_id=9,
                title="Average Latency by Endpoint",
                expression=(
                    "sum by (path) ("
                    "rate("
                    "mediflow_http_request_seconds_sum[5m]"
                    ")"
                    ") "
                    "/ "
                    "clamp_min("
                    "sum by (path) ("
                    "rate("
                    "mediflow_http_request_seconds_count[5m]"
                    ")"
                    "), "
                    "0.000001"
                    ")"
                ),
                x=0,
                y=21,
                width=12,
                height=8,
                unit="s",
                legend_format="{{path}}",
            ),
            timeseries_panel(
                panel_id=10,
                title="Total API Errors",
                expression=(
                    "sum by (status) ("
                    "increase("
                    "mediflow_http_requests_total"
                    '{status=~"4..|5.."}[1h]'
                    ")"
                    ")"
                ),
                x=12,
                y=21,
                width=12,
                height=8,
                unit="short",
                legend_format="HTTP {{status}}",
            ),
        ],
    }


def database_dashboard() -> dict[str, Any]:
    return {
        "uid": "mediflow-database-cache",
        "title": "MediFlow Database & Cache",
        "tags": [
            "mediflow",
            "database",
            "postgresql",
            "redis",
        ],
        "timezone": "browser",
        "schemaVersion": 39,
        "version": 3,
        "refresh": "10s",
        "editable": True,
        "time": {
            "from": "now-1h",
            "to": "now",
        },
        "panels": [
            stat_panel(
                panel_id=1,
                title="PostgreSQL Status",
                expression=(
                    'max(pg_up{job="postgres-exporter"}) '
                    "or vector(0)"
                ),
                x=0,
                y=0,
                unit="short",
                mappings=service_status_mappings(),
                thresholds=service_status_thresholds(),
            ),
            stat_panel(
                panel_id=2,
                title="Active PostgreSQL Connections",
                expression=(
                    "sum("
                    "pg_stat_database_numbackends"
                    '{job="postgres-exporter",'
                    'datname="mediflow"}'
                    ") or vector(0)"
                ),
                x=6,
                y=0,
                unit="short",
            ),
            stat_panel(
                panel_id=3,
                title="Database Size",
                expression=(
                    "sum("
                    "pg_database_size_bytes"
                    '{job="postgres-exporter",'
                    'datname="mediflow"}'
                    ") or vector(0)"
                ),
                x=12,
                y=0,
                unit="bytes",
            ),
            stat_panel(
                panel_id=4,
                title="Redis Status",
                expression=(
                    'max(redis_up{job="redis-exporter"}) '
                    "or vector(0)"
                ),
                x=18,
                y=0,
                unit="short",
                mappings=service_status_mappings(),
                thresholds=service_status_thresholds(),
            ),
            timeseries_panel(
                panel_id=5,
                title="PostgreSQL Connections",
                expression=(
                    "sum("
                    "pg_stat_database_numbackends"
                    '{job="postgres-exporter",'
                    'datname="mediflow"}'
                    ")"
                ),
                x=0,
                y=5,
                width=12,
                height=8,
                unit="short",
                legend_format="Active Connections",
            ),
            timeseries_panel(
                panel_id=6,
                title="PostgreSQL Transactions per Second",
                expression=(
                    "sum("
                    "rate("
                    "pg_stat_database_xact_commit"
                    '{job="postgres-exporter",'
                    'datname="mediflow"}[5m]'
                    ")"
                    ")"
                ),
                x=12,
                y=5,
                width=12,
                height=8,
                unit="ops",
                legend_format="Commits/sec",
            ),
            timeseries_panel(
                panel_id=7,
                title="PostgreSQL Rollbacks per Second",
                expression=(
                    "sum("
                    "rate("
                    "pg_stat_database_xact_rollback"
                    '{job="postgres-exporter",'
                    'datname="mediflow"}[5m]'
                    ")"
                    ")"
                ),
                x=0,
                y=13,
                width=12,
                height=8,
                unit="ops",
                legend_format="Rollbacks/sec",
            ),
            timeseries_panel(
                panel_id=8,
                title="PostgreSQL Deadlocks",
                expression=(
                    "sum("
                    "increase("
                    "pg_stat_database_deadlocks"
                    '{job="postgres-exporter",'
                    'datname="mediflow"}[1h]'
                    ")"
                    ")"
                ),
                x=12,
                y=13,
                width=12,
                height=8,
                unit="short",
                legend_format="Deadlocks",
            ),
            stat_panel(
                panel_id=9,
                title="PostgreSQL Cache Hit Ratio",
                expression=(
                    "100 * "
                    "sum("
                    "rate("
                    "pg_stat_database_blks_hit"
                    '{job="postgres-exporter",'
                    'datname="mediflow"}[5m]'
                    ")"
                    ") "
                    "/ "
                    "clamp_min("
                    "sum("
                    "rate("
                    "pg_stat_database_blks_hit"
                    '{job="postgres-exporter",'
                    'datname="mediflow"}[5m]'
                    ")"
                    ") "
                    "+ "
                    "sum("
                    "rate("
                    "pg_stat_database_blks_read"
                    '{job="postgres-exporter",'
                    'datname="mediflow"}[5m]'
                    ")"
                    "), "
                    "0.000001"
                    ")"
                ),
                x=0,
                y=21,
                unit="percent",
            ),
            stat_panel(
                panel_id=10,
                title="Redis Connected Clients",
                expression=(
                    "sum("
                    "redis_connected_clients"
                    '{job="redis-exporter"}'
                    ") or vector(0)"
                ),
                x=6,
                y=21,
                unit="short",
            ),
            stat_panel(
                panel_id=11,
                title="Redis Memory Used",
                expression=(
                    "sum("
                    "redis_memory_used_bytes"
                    '{job="redis-exporter"}'
                    ") or vector(0)"
                ),
                x=12,
                y=21,
                unit="bytes",
            ),
            stat_panel(
                panel_id=12,
                title="Redis Keys",
                expression=(
                    "sum("
                    "redis_db_keys"
                    '{job="redis-exporter"}'
                    ") or vector(0)"
                ),
                x=18,
                y=21,
                unit="short",
            ),
            timeseries_panel(
                panel_id=13,
                title="Redis Memory Trend",
                expression=(
                    "sum("
                    "redis_memory_used_bytes"
                    '{job="redis-exporter"}'
                    ")"
                ),
                x=0,
                y=26,
                width=12,
                height=8,
                unit="bytes",
                legend_format="Redis Memory",
            ),
            timeseries_panel(
                panel_id=14,
                title="Redis Commands per Second",
                expression=(
                    "sum("
                    "rate("
                    "redis_commands_processed_total"
                    '{job="redis-exporter"}[5m]'
                    ")"
                    ")"
                ),
                x=12,
                y=26,
                width=12,
                height=8,
                unit="ops",
                legend_format="Commands/sec",
            ),
            timeseries_panel(
                panel_id=15,
                title="Redis Cache Hits",
                expression=(
                    "sum("
                    "rate("
                    "redis_keyspace_hits_total"
                    '{job="redis-exporter"}[5m]'
                    ")"
                    ")"
                ),
                x=0,
                y=34,
                width=12,
                height=8,
                unit="ops",
                legend_format="Cache Hits",
            ),
            timeseries_panel(
                panel_id=16,
                title="Redis Cache Misses",
                expression=(
                    "sum("
                    "rate("
                    "redis_keyspace_misses_total"
                    '{job="redis-exporter"}[5m]'
                    ")"
                    ")"
                ),
                x=12,
                y=34,
                width=12,
                height=8,
                unit="ops",
                legend_format="Cache Misses",
            ),
        ],
    }


def hospital_dashboard() -> dict[str, Any]:
    return {
        "uid": "mediflow-hospital-operations",
        "title": "MediFlow Hospital Operations",
        "tags": [
            "mediflow",
            "hospital",
            "business",
            "operations",
        ],
        "timezone": "browser",
        "schemaVersion": 39,
        "version": 2,
        "refresh": "10s",
        "editable": True,
        "time": {
            "from": "now-6h",
            "to": "now",
        },
        "panels": [
            stat_panel(
                panel_id=1,
                title="Registered Users",
                expression=(
                    "sum(mediflow_users_total) "
                    "or vector(0)"
                ),
                x=0,
                y=0,
                unit="short",
            ),
            stat_panel(
                panel_id=2,
                title="Registered Patients",
                expression=(
                    "sum(mediflow_patients_total) "
                    "or vector(0)"
                ),
                x=6,
                y=0,
                unit="short",
            ),
            stat_panel(
                panel_id=3,
                title="Registered Doctors",
                expression=(
                    "sum(mediflow_doctors_total) "
                    "or vector(0)"
                ),
                x=12,
                y=0,
                unit="short",
            ),
            stat_panel(
                panel_id=4,
                title="Total Appointments",
                expression=(
                    "sum(mediflow_appointments_total) "
                    "or vector(0)"
                ),
                x=18,
                y=0,
                unit="short",
            ),
            stat_panel(
                panel_id=5,
                title="Booked Appointments",
                expression=(
                    "sum("
                    "mediflow_appointments_total"
                    '{status="booked"}'
                    ") or vector(0)"
                ),
                x=0,
                y=5,
                unit="short",
            ),
            stat_panel(
                panel_id=6,
                title="Confirmed Appointments",
                expression=(
                    "sum("
                    "mediflow_appointments_total"
                    '{status="confirmed"}'
                    ") or vector(0)"
                ),
                x=6,
                y=5,
                unit="short",
            ),
            stat_panel(
                panel_id=7,
                title="Completed Appointments",
                expression=(
                    "sum("
                    "mediflow_appointments_total"
                    '{status="completed"}'
                    ") or vector(0)"
                ),
                x=12,
                y=5,
                unit="short",
            ),
            stat_panel(
                panel_id=8,
                title="Cancelled Appointments",
                expression=(
                    "sum("
                    "mediflow_appointments_total"
                    '{status="cancelled"}'
                    ") or vector(0)"
                ),
                x=18,
                y=5,
                unit="short",
            ),
            stat_panel(
                panel_id=9,
                title="Medical Records",
                expression=(
                    "sum("
                    "mediflow_medical_records_total"
                    ") or vector(0)"
                ),
                x=0,
                y=10,
                unit="short",
            ),
            stat_panel(
                panel_id=10,
                title="Prescription Items",
                expression=(
                    "sum("
                    "mediflow_prescriptions_total"
                    ") or vector(0)"
                ),
                x=6,
                y=10,
                unit="short",
            ),
            stat_panel(
                panel_id=11,
                title="Stored Documents",
                expression=(
                    "sum("
                    "mediflow_documents_total"
                    ") or vector(0)"
                ),
                x=12,
                y=10,
                unit="short",
            ),
            stat_panel(
                panel_id=12,
                title="Successful Logins",
                expression=(
                    "sum("
                    "mediflow_login_attempts_total"
                    '{result="success"}'
                    ") or vector(0)"
                ),
                x=18,
                y=10,
                unit="short",
            ),
            timeseries_panel(
                panel_id=13,
                title="Appointments by Status",
                expression=(
                    "sum by (status) ("
                    "mediflow_appointments_total"
                    ")"
                ),
                x=0,
                y=15,
                width=12,
                height=8,
                unit="short",
                legend_format="{{status}}",
            ),
            timeseries_panel(
                panel_id=14,
                title="Login Attempts",
                expression=(
                    "sum by (result) ("
                    "increase("
                    "mediflow_login_attempts_total[1h]"
                    ")"
                    ")"
                ),
                x=12,
                y=15,
                width=12,
                height=8,
                unit="short",
                legend_format="{{result}}",
            ),
            timeseries_panel(
                panel_id=15,
                title="AI Summary Usage",
                expression=(
                    "sum by (result) ("
                    "increase("
                    "mediflow_ai_summary_requests_total[1h]"
                    ")"
                    ")"
                ),
                x=0,
                y=23,
                width=12,
                height=8,
                unit="short",
                legend_format="{{result}}",
            ),
            timeseries_panel(
                panel_id=16,
                title="Document Uploads",
                expression=(
                    "sum("
                    "increase("
                    "mediflow_document_uploads_total[1h]"
                    ")"
                    ") or vector(0)"
                ),
                x=12,
                y=23,
                width=12,
                height=8,
                unit="short",
                legend_format="Uploaded Documents",
            ),
            timeseries_panel(
                panel_id=17,
                title="Completed Consultations",
                expression=(
                    "sum("
                    "increase("
                    "mediflow_consultations_completed_total[1h]"
                    ")"
                    ") or vector(0)"
                ),
                x=0,
                y=31,
                width=12,
                height=8,
                unit="short",
                legend_format="Completed Consultations",
            ),
            timeseries_panel(
                panel_id=18,
                title="Hospital API Activity",
                expression=(
                    "sum by (path) ("
                    "rate("
                    "mediflow_http_requests_total"
                    '{path=~"/api/appointments.*|'
                    '/api/doctors.*|'
                    '/api/medical-records.*|'
                    '/api/documents.*"}[5m]'
                    ")"
                    ")"
                ),
                x=12,
                y=31,
                width=12,
                height=8,
                unit="reqps",
                legend_format="{{path}}",
            ),
        ],
    }


def ai_documents_dashboard() -> dict[str, Any]:
    return {
        "uid": "mediflow-ai-documents",
        "title": "MediFlow AI & Document Analytics",
        "tags": [
            "mediflow",
            "ai",
            "documents",
            "analytics",
        ],
        "timezone": "browser",
        "schemaVersion": 39,
        "version": 1,
        "refresh": "10s",
        "editable": True,
        "time": {
            "from": "now-6h",
            "to": "now",
        },
        "panels": [
            stat_panel(
                panel_id=1,
                title="AI Summary Requests",
                expression=(
                    "sum("
                    "mediflow_ai_summary_requests_total"
                    ") or vector(0)"
                ),
                x=0,
                y=0,
                unit="short",
            ),
            stat_panel(
                panel_id=2,
                title="Successful AI Summaries",
                expression=(
                    "sum("
                    "mediflow_ai_summary_requests_total"
                    '{result="success"}'
                    ") or vector(0)"
                ),
                x=6,
                y=0,
                unit="short",
            ),
            stat_panel(
                panel_id=3,
                title="AI Requests Without Records",
                expression=(
                    "sum("
                    "mediflow_ai_summary_requests_total"
                    '{result="no_record"}'
                    ") or vector(0)"
                ),
                x=12,
                y=0,
                unit="short",
            ),
            stat_panel(
                panel_id=4,
                title="Average AI Response Time",
                expression=(
                    "sum("
                    "rate("
                    "mediflow_http_request_seconds_sum"
                    '{path="/api/ai/summary"}[5m]'
                    ")"
                    ") "
                    "/ "
                    "clamp_min("
                    "sum("
                    "rate("
                    "mediflow_http_request_seconds_count"
                    '{path="/api/ai/summary"}[5m]'
                    ")"
                    "), "
                    "0.000001"
                    ")"
                ),
                x=18,
                y=0,
                unit="s",
            ),
            stat_panel(
                panel_id=5,
                title="Stored Documents",
                expression=(
                    "sum("
                    "mediflow_documents_total"
                    ") or vector(0)"
                ),
                x=0,
                y=5,
                unit="short",
            ),
            stat_panel(
                panel_id=6,
                title="Document Upload Events",
                expression=(
                    "sum("
                    "mediflow_document_uploads_total"
                    ") or vector(0)"
                ),
                x=6,
                y=5,
                unit="short",
            ),
            stat_panel(
                panel_id=7,
                title="Medical Records",
                expression=(
                    "sum("
                    "mediflow_medical_records_total"
                    ") or vector(0)"
                ),
                x=12,
                y=5,
                unit="short",
            ),
            stat_panel(
                panel_id=8,
                title="Prescription Items",
                expression=(
                    "sum("
                    "mediflow_prescriptions_total"
                    ") or vector(0)"
                ),
                x=18,
                y=5,
                unit="short",
            ),
            timeseries_panel(
                panel_id=9,
                title="AI Summary Requests by Result",
                expression=(
                    "sum by (result) ("
                    "increase("
                    "mediflow_ai_summary_requests_total[1h]"
                    ")"
                    ")"
                ),
                x=0,
                y=10,
                width=12,
                height=8,
                unit="short",
                legend_format="{{result}}",
            ),
            timeseries_panel(
                panel_id=10,
                title="AI Summary Request Rate",
                expression=(
                    "sum("
                    "rate("
                    "mediflow_ai_summary_requests_total[5m]"
                    ")"
                    ") or vector(0)"
                ),
                x=12,
                y=10,
                width=12,
                height=8,
                unit="reqps",
                legend_format="AI Requests/sec",
            ),
            timeseries_panel(
                panel_id=11,
                title="AI Summary Response Time",
                expression=(
                    "sum("
                    "rate("
                    "mediflow_http_request_seconds_sum"
                    '{path="/api/ai/summary"}[5m]'
                    ")"
                    ") "
                    "/ "
                    "clamp_min("
                    "sum("
                    "rate("
                    "mediflow_http_request_seconds_count"
                    '{path="/api/ai/summary"}[5m]'
                    ")"
                    "), "
                    "0.000001"
                    ")"
                ),
                x=0,
                y=18,
                width=12,
                height=8,
                unit="s",
                legend_format="Average Response Time",
            ),
            timeseries_panel(
                panel_id=12,
                title="P95 AI Summary Latency",
                expression=(
                    "histogram_quantile("
                    "0.95, "
                    "sum by (le) ("
                    "rate("
                    "mediflow_http_request_seconds_bucket"
                    '{path="/api/ai/summary"}[5m]'
                    ")"
                    ")"
                    ")"
                ),
                x=12,
                y=18,
                width=12,
                height=8,
                unit="s",
                legend_format="P95 Latency",
            ),
            timeseries_panel(
                panel_id=13,
                title="Document Upload Activity",
                expression=(
                    "sum("
                    "increase("
                    "mediflow_document_uploads_total[1h]"
                    ")"
                    ") or vector(0)"
                ),
                x=0,
                y=26,
                width=12,
                height=8,
                unit="short",
                legend_format="Uploaded Documents",
            ),
            timeseries_panel(
                panel_id=14,
                title="AI and Document API Traffic",
                expression=(
                    "sum by (path) ("
                    "rate("
                    "mediflow_http_requests_total"
                    '{path=~"/api/ai/summary|'
                    '/api/documents.*"}[5m]'
                    ")"
                    ")"
                ),
                x=12,
                y=26,
                width=12,
                height=8,
                unit="reqps",
                legend_format="{{path}}",
            ),
        ],
    }


def write_dashboard(
    filename: str,
    dashboard: dict[str, Any],
) -> None:
    DASHBOARD_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path = DASHBOARD_DIR / filename

    output_path.write_text(
        json.dumps(
            dashboard,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"Generated: {output_path}")


def main() -> None:
    write_dashboard(
        filename="infrastructure.json",
        dashboard=infrastructure_dashboard(),
    )

    write_dashboard(
        filename="backend.json",
        dashboard=backend_dashboard(),
    )

    write_dashboard(
        filename="database.json",
        dashboard=database_dashboard(),
    )

    write_dashboard(
        filename="hospital.json",
        dashboard=hospital_dashboard(),
    )

    write_dashboard(
        filename="ai-documents.json",
        dashboard=ai_documents_dashboard(),
    )


if __name__ == "__main__":
    main()