import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BellRing,
  Bot,
  Database,
  ExternalLink,
  Gauge,
  HeartPulse,
  Maximize2,
  RefreshCw,
  Server,
  ServerCog,
  ShieldCheck,
} from "lucide-react";

import { request } from "../api";

type DashboardKey =
  | "hospital"
  | "backend"
  | "database"
  | "infrastructure"
  | "ai";

type ServiceStatus =
  | "healthy"
  | "degraded"
  | "down"
  | "unknown";

type DashboardDefinition = {
  label: string;
  description: string;
  path: string;
  range: string;
  icon: typeof Gauge;
};

type MonitoringService = {
  label: string;
  status: ServiceStatus;
  detail: string;
};

type ObservabilitySummary = {
  overall: ServiceStatus;
  services: {
    api: MonitoringService;
    postgres: MonitoringService;
    redis: MonitoringService;
    prometheus: MonitoringService;
    grafana: MonitoringService;
  };
  active_alerts: number;
};

const GRAFANA_BASE_URL =
  "http://grafana-dev.mediflow.example.com";

const dashboards: Record<
  DashboardKey,
  DashboardDefinition
> = {
  hospital: {
    label: "Hospital Operations",
    description:
      "Business and hospital workflow metrics including users, appointments, records, prescriptions and login activity.",
    path:
      "/d/mediflow-hospital-operations/" +
      "mediflow-hospital-operations",
    range: "now-6h",
    icon: HeartPulse,
  },

  backend: {
    label: "Backend & API",
    description:
      "API request volume, response latency, error rates, endpoint activity and backend performance.",
    path:
      "/d/mediflow-backend-api/" +
      "mediflow-backend-and-api-performance",
    range: "now-1h",
    icon: Activity,
  },

  database: {
    label: "Database & Cache",
    description:
      "PostgreSQL connections, query activity, Redis health, memory usage and cache performance.",
    path:
      "/d/mediflow-database-cache/" +
      "mediflow-database-and-cache",
    range: "now-1h",
    icon: Database,
  },

  infrastructure: {
    label: "Infrastructure",
    description:
      "Platform availability, service health, exporters, resource usage and infrastructure-level monitoring.",
    path:
      "/d/mediflow-infrastructure/" +
      "mediflow-infrastructure-overview",
    range: "now-1h",
    icon: ServerCog,
  },

  ai: {
    label: "AI & Documents",
    description:
      "AI summary requests, successful responses, document uploads, records and prescription analytics.",
    path:
      "/d/mediflow-ai-documents/" +
      "mediflow-ai-and-document-analytics",
    range: "now-6h",
    icon: Bot,
  },
};

const serviceDefinitions = [
  {
    key: "api",
    icon: Server,
  },
  {
    key: "postgres",
    icon: Database,
  },
  {
    key: "redis",
    icon: Activity,
  },
  {
    key: "prometheus",
    icon: Gauge,
  },
  {
    key: "grafana",
    icon: HeartPulse,
  },
] as const;

function statusLabel(
  status: ServiceStatus,
) {
  switch (status) {
    case "healthy":
      return "Healthy";

    case "degraded":
      return "Degraded";

    case "down":
      return "Down";

    default:
      return "Unknown";
  }
}

export default function Operations() {
  const [selected, setSelected] =
    useState<DashboardKey>("hospital");

  const [frameKey, setFrameKey] =
    useState(0);

  const [summary, setSummary] =
    useState<ObservabilitySummary | null>(null);

  const [loadingHealth, setLoadingHealth] =
    useState(true);

  const frameContainerRef =
    useRef<HTMLDivElement>(null);

  const dashboard =
    dashboards[selected];

  const dashboardUrl = useMemo(() => {
    const params = new URLSearchParams({
      orgId: "1",
      from: dashboard.range,
      to: "now",
      timezone: "browser",
      kiosk: "",
    });

    return (
      `${GRAFANA_BASE_URL}` +
      `${dashboard.path}` +
      `?${params.toString()}`
    );
  }, [dashboard]);

  const loadHealth = async () => {
    try {
      setLoadingHealth(true);

      const data =
        await request(
          "/api/admin/observability/summary"
        );

      setSummary(
        data as ObservabilitySummary
      );
    } catch (error) {
      console.error(
        "Failed to load observability summary",
        error,
      );

      setSummary(null);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    loadHealth();

    const interval =
      window.setInterval(
        loadHealth,
        30000,
      );

    return () =>
      window.clearInterval(interval);
  }, []);

  const refreshDashboard = () => {
    setFrameKey(
      (value) => value + 1
    );

    loadHealth();
  };

  const openFullscreen = async () => {
    const element =
      frameContainerRef.current;

    if (!element) return;

    try {
      if (!document.fullscreenElement) {
        await element.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error(
        "Unable to enter fullscreen mode",
        error,
      );
    }
  };

  const overallStatus =
    summary?.overall ?? "unknown";

  return (
    <section className="page-stack operations-page">
      <div className="operations-hero">
        <div>
          <span className="eyebrow">
            <Gauge size={15} />
            Live observability
          </span>

          <h1>
            Operations command center
          </h1>

          <p>
            Monitor hospital workflows,
            application health, database
            activity and infrastructure
            telemetry from one workspace.
          </p>
        </div>

        <div
          className={
            `operations-overall-status ` +
            `status-${overallStatus}`
          }
        >
          <div className="operations-status-icon">
            <ShieldCheck size={21} />
          </div>

          <div>
            <strong>
              {loadingHealth
                ? "Checking observability..."
                : overallStatus === "healthy"
                  ? "All systems operational"
                  : overallStatus === "degraded"
                    ? "Monitoring degraded"
                    : "Monitoring status unknown"}
            </strong>

            <span>
              Prometheus · Grafana · Exporters
            </span>
          </div>
        </div>
      </div>

      <div className="operations-service-grid">
        {serviceDefinitions.map(
          (definition) => {
            const Icon =
              definition.icon;

            const service =
              summary?.services[
                definition.key
              ];

            const status =
              service?.status ??
              "unknown";

            return (
              <div
                className={
                  `operations-service-card ` +
                  `status-${status}`
                }
                key={
                  definition.key
                }
              >
                <div className="operations-service-icon">
                  <Icon size={19} />
                </div>

                <div>
                  <strong>
                    {service?.label ??
                      (definition.key ===
                      "api"
                        ? "API Gateway"
                        : definition.key ===
                            "postgres"
                          ? "PostgreSQL"
                          : definition.key ===
                              "redis"
                            ? "Redis Cache"
                            : definition.key ===
                                "prometheus"
                              ? "Prometheus"
                              : "Grafana")}
                  </strong>

                  <span>
                    {service?.detail ??
                      "Checking service"}
                  </span>
                </div>

                <div
                  className={
                    `operations-service-state ` +
                    `status-${status}`
                  }
                >
                  <span />

                  {loadingHealth
                    ? "Checking"
                    : statusLabel(status)}
                </div>
              </div>
            );
          },
        )}

        <div
          className={
            `operations-service-card ` +
            `alerts-card ${
              (summary?.active_alerts ??
                0) > 0
                ? "status-degraded"
                : "status-healthy"
            }`
          }
        >
          <div className="operations-service-icon">
            <BellRing size={19} />
          </div>

          <div>
            <strong>
              Active alerts
            </strong>

            <span>
              {(summary?.active_alerts ??
                0) === 0
                ? "No critical alerts"
                : "Prometheus alerts firing"}
            </span>
          </div>

          <div className="alert-count">
            {summary?.active_alerts ??
              0}
          </div>
        </div>
      </div>

      <div className="operations-toolbar">
        <div className="operations-tabs">
          {(
            Object.entries(
              dashboards
            ) as [
              DashboardKey,
              DashboardDefinition,
            ][]
          ).map(
            ([
              key,
              definition,
            ]) => {
              const Icon =
                definition.icon;

              return (
                <button
                  key={key}
                  type="button"
                  className={
                    `operations-tab ${
                      selected === key
                        ? "active"
                        : ""
                    }`
                  }
                  onClick={() =>
                    setSelected(key)
                  }
                >
                  <Icon
                    size={16}
                  />

                  {definition.label}
                </button>
              );
            },
          )}
        </div>

        <div className="operations-actions">
          <button
            className="secondary small"
            type="button"
            onClick={
              refreshDashboard
            }
          >
            <RefreshCw
              size={15}
            />

            Refresh
          </button>

          <a
            className="button-link secondary small"
            href={dashboardUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink
              size={15}
            />

            Open Grafana
          </a>
        </div>
      </div>

      <div className="operations-dashboard-heading">
        <div>
          <span>
            Live dashboard
          </span>

          <h2>
            {dashboard.label}
          </h2>

          <p>
            {dashboard.description}
          </p>
        </div>
      </div>

      <div
        className="grafana-workspace"
        ref={
          frameContainerRef
        }
      >
        <div className="grafana-workspace-toolbar">
          <div className="grafana-live-state">
            <span className="grafana-live-dot" />

            <strong>
              Live Grafana
            </strong>

            <span className="grafana-divider" />

            <span>
              {dashboard.label}
            </span>
          </div>

          <div className="grafana-toolbar-actions">
            <button
              type="button"
              title="Refresh dashboard"
              onClick={
                refreshDashboard
              }
            >
              <RefreshCw
                size={16}
              />

              Refresh
            </button>

            <button
              type="button"
              title="Open dashboard fullscreen"
              onClick={
                openFullscreen
              }
            >
              <Maximize2
                size={16}
              />

              Fullscreen
            </button>
          </div>
        </div>

        <iframe
          key={
            `${selected}-` +
            `${frameKey}`
          }
          title={
            dashboard.label
          }
          src={dashboardUrl}
          width="100%"
          height="900"
          frameBorder="0"
          allowFullScreen
        />
      </div>
    </section>
  );
}