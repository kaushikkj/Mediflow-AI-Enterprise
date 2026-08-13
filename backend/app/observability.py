import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends

from .models import User
from .security import require_roles


router = APIRouter(
    prefix="/api/admin/observability",
    tags=["observability"],
)

PROMETHEUS_URL = "http://prometheus:9090"
GRAFANA_URL = "http://grafana:3000"


def http_json(
    url: str,
    timeout: float = 3.0,
) -> dict:
    request = Request(
        url,
        headers={
            "Accept": "application/json",
        },
    )

    with urlopen(
        request,
        timeout=timeout,
    ) as response:
        return json.loads(
            response.read().decode("utf-8")
        )


def prometheus_query(
    query: str,
) -> float | None:
    try:
        payload = http_json(
            f"{PROMETHEUS_URL}/api/v1/query?"
            + urlencode(
                {
                    "query": query,
                }
            )
        )

        if payload.get("status") != "success":
            return None

        result = (
            payload.get("data", {})
            .get("result", [])
        )

        if not result:
            return 0.0

        value = result[0].get("value")

        if not value or len(value) < 2:
            return None

        return float(value[1])

    except Exception:
        return None


def target_status(
    value: float | None,
) -> str:
    if value is None:
        return "unknown"

    if value >= 1:
        return "healthy"

    return "down"


def prometheus_status() -> str:
    try:
        payload = http_json(
            f"{PROMETHEUS_URL}/api/v1/status/runtimeinfo"
        )

        if payload.get("status") == "success":
            return "healthy"

        return "degraded"

    except Exception:
        return "down"


def grafana_status() -> str:
    try:
        payload = http_json(
            f"{GRAFANA_URL}/api/health"
        )

        if payload.get("database") == "ok":
            return "healthy"

        return "degraded"

    except Exception:
        return "down"


@router.get("/summary")
def observability_summary(
    user: User = Depends(
        require_roles("admin")
    ),
) -> dict:
    del user

    api_up = prometheus_query(
        'up{job="mediflow-api"}'
    )

    postgres_up = prometheus_query(
        'up{job="postgres-exporter"}'
    )

    redis_up = prometheus_query(
        'up{job="redis-exporter"}'
    )

    alerts = prometheus_query(
        'count(ALERTS{alertstate="firing"})'
    )

    services = {
        "api": {
            "label": "API Gateway",
            "status": target_status(api_up),
            "detail": "Application metrics",
        },
        "postgres": {
            "label": "PostgreSQL",
            "status": target_status(postgres_up),
            "detail": "Exporter connected",
        },
        "redis": {
            "label": "Redis Cache",
            "status": target_status(redis_up),
            "detail": "Exporter connected",
        },
        "prometheus": {
            "label": "Prometheus",
            "status": prometheus_status(),
            "detail": "Metrics collection",
        },
        "grafana": {
            "label": "Grafana",
            "status": grafana_status(),
            "detail": "Dashboards online",
        },
    }

    statuses = [
        service["status"]
        for service in services.values()
    ]

    if all(
        status == "healthy"
        for status in statuses
    ):
        overall = "healthy"

    elif any(
        status == "down"
        for status in statuses
    ):
        overall = "degraded"

    else:
        overall = "unknown"

    return {
        "overall": overall,
        "services": services,
        "active_alerts": int(alerts or 0),
    }
