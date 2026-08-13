import { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Database,
  ExternalLink,
  Gauge,
  HeartPulse,
  Maximize2,
  RefreshCw,
  ServerCog,
} from "lucide-react";

type DashboardKey = "hospital" | "backend" | "database" | "infrastructure" | "ai";

type DashboardDefinition = {
  label: string;
  description: string;
  path: string;
  range: string;
  icon: typeof Gauge;
};

const dashboards: Record<DashboardKey, DashboardDefinition> = {
  hospital: {
    label: "Hospital Operations",
    description:
      "Business and hospital workflow metrics including users, appointments, records, prescriptions and login activity.",
    path: "/d/mediflow-hospital-operations/mediflow-hospital-operations",
    range: "now-6h",
    icon: HeartPulse,
  },
  backend: {
    label: "Backend & API",
    description:
      "API request volume, response latency, error rates, endpoint activity and backend performance.",
    path: "/d/mediflow-backend-api/mediflow-backend-and-api-performance",
    range: "now-1h",
    icon: Activity,
  },
  database: {
    label: "Database & Cache",
    description:
      "PostgreSQL connections, query activity, Redis health, memory usage and cache performance.",
    path: "/d/mediflow-database-cache/mediflow-database-and-cache",
    range: "now-1h",
    icon: Database,
  },
  infrastructure: {
    label: "Infrastructure",
    description:
      "Platform availability, service health, exporters, resource usage and infrastructure-level monitoring.",
    path: "/d/mediflow-infrastructure/mediflow-infrastructure-overview",
    range: "now-1h",
    icon: ServerCog,
  },
  ai: {
    label: "AI & Documents",
    description:
      "AI summary requests, successful responses, document uploads, records and prescription analytics.",
    path: "/d/mediflow-ai-documents/mediflow-ai-and-document-analytics",
    range: "now-6h",
    icon: Bot,
  },
};

export default function Operations() {
  const [selected, setSelected] = useState<DashboardKey>("hospital");
  const [frameKey, setFrameKey] = useState(0);
  const dashboard = dashboards[selected];

  const dashboardUrl = useMemo(() => {
    const params = new URLSearchParams({
      orgId: "1",
      from: dashboard.range,
      to: "now",
      timezone: "browser",
      refresh: "10s",
      kiosk: "",
    });
    return `http://grafana-dev.mediflow.example.com${dashboard.path}?${params.toString()}`;
  }, [dashboard]);

  return (
    <section className="page-stack operations-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow"><Gauge size={15} /> Live observability</span>
          <h1>Operations command center</h1>
          <p>Real-time hospital, application and infrastructure telemetry powered by Grafana.</p>
        </div>
        <div className="operations-health">
          <span className="status-pulse" />
          <div><strong>Monitoring healthy</strong><span>Prometheus · Grafana · Exporters</span></div>
        </div>
      </div>

      <div className="operations-toolbar card flat-card">
        <div className="operations-tabs">
          {(Object.entries(dashboards) as [DashboardKey, DashboardDefinition][]).map(
            ([key, definition]) => {
              const Icon = definition.icon;
              return (
                <button
                  key={key}
                  type="button"
                  className={`operations-tab ${selected === key ? "active" : ""}`}
                  onClick={() => setSelected(key)}
                >
                  <Icon size={16} />
                  {definition.label}
                </button>
              );
            },
          )}
        </div>
        <div className="operations-actions">
          <button className="secondary small" type="button" onClick={() => setFrameKey((value) => value + 1)}>
            <RefreshCw size={15} /> Refresh
          </button>
          <a className="button-link secondary small" href={dashboardUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={15} /> Open Grafana
          </a>
        </div>
      </div>

      <div className="monitoring-summary">
        <div>
          <span>Current view</span>
          <strong>{dashboard.label}</strong>
          <p>{dashboard.description}</p>
        </div>
        <div className="live-chip"><span /> Auto-refresh 10s</div>
      </div>

      <div className="grafana-frame premium-frame">
        <div className="frame-chrome">
          <div><span className="browser-dot" /><span className="browser-dot" /><span className="browser-dot" /></div>
          <span>grafana-dev.mediflow.example.com</span>
          <Maximize2 size={15} />
        </div>
        <iframe
          key={`${selected}-${frameKey}`}
          title={dashboard.label}
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
