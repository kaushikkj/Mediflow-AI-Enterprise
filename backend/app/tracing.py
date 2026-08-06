import os
from typing import Final

from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import (
    OTLPSpanExporter,
)
from opentelemetry.instrumentation.fastapi import (
    FastAPIInstrumentor,
)
from opentelemetry.instrumentation.redis import (
    RedisInstrumentor,
)
from opentelemetry.instrumentation.sqlalchemy import (
    SQLAlchemyInstrumentor,
)
from opentelemetry.sdk.resources import (
    DEPLOYMENT_ENVIRONMENT,
    SERVICE_NAME,
    SERVICE_VERSION,
    Resource,
)
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import (
    BatchSpanProcessor,
)

from .db import engine


DEFAULT_SERVICE_NAME: Final = "mediflow-backend"
DEFAULT_SERVICE_VERSION: Final = "2.0.0"
DEFAULT_ENVIRONMENT: Final = "local"
DEFAULT_OTLP_ENDPOINT: Final = "http://alloy:4317"

_tracing_initialized = False


def env_bool(
    variable_name: str,
    default: bool,
) -> bool:
    value = os.getenv(variable_name)

    if value is None:
        return default

    return value.strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def configure_tracer_provider() -> TracerProvider:
    service_name = os.getenv(
        "OTEL_SERVICE_NAME",
        DEFAULT_SERVICE_NAME,
    )

    service_version = os.getenv(
        "OTEL_SERVICE_VERSION",
        DEFAULT_SERVICE_VERSION,
    )

    environment = os.getenv(
        "DEPLOYMENT_ENVIRONMENT",
        DEFAULT_ENVIRONMENT,
    )

    otlp_endpoint = os.getenv(
        "OTEL_EXPORTER_OTLP_ENDPOINT",
        DEFAULT_OTLP_ENDPOINT,
    )

    otlp_insecure = env_bool(
        "OTEL_EXPORTER_OTLP_INSECURE",
        True,
    )

    resource = Resource.create(
        {
            SERVICE_NAME: service_name,
            SERVICE_VERSION: service_version,
            DEPLOYMENT_ENVIRONMENT: environment,
        }
    )

    tracer_provider = TracerProvider(
        resource=resource,
    )

    exporter = OTLPSpanExporter(
        endpoint=otlp_endpoint,
        insecure=otlp_insecure,
    )

    tracer_provider.add_span_processor(
        BatchSpanProcessor(exporter)
    )

    trace.set_tracer_provider(
        tracer_provider
    )

    return tracer_provider


def setup_tracing(app: FastAPI) -> None:
    global _tracing_initialized

    if _tracing_initialized:
        return

    tracer_provider = configure_tracer_provider()

    FastAPIInstrumentor.instrument_app(
        app,
        tracer_provider=tracer_provider,
        excluded_urls="health,metrics",
    )

    SQLAlchemyInstrumentor().instrument(
        engine=engine,
        tracer_provider=tracer_provider,
    )

    RedisInstrumentor().instrument(
        tracer_provider=tracer_provider,
    )

    _tracing_initialized = True